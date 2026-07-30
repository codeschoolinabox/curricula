#!/usr/bin/env python3
"""Behavioral contract for governance-guard.py (types.ts is N/A by design).

Run after ANY edit to any hook in this directory: npm run test:hooks

Each DENY case is (command, expected_reason_substrings) — a string or a tuple;
every named substring must appear, pinning rule attribution, self-teaching
content, and (for tuples) cross-reason aggregation. Every case, DENY, ALLOW,
and MALFORMED, also asserts exit == 0: fail-open is part of the contract.
"""

import json
import pathlib
import subprocess
import sys

HOOK = str(pathlib.Path(__file__).resolve().parent.parent / "governance-guard.py")

# --- commit-pathspec rule ---------------------------------------------------

DENY = [
    # no pathspec at all
    ("git commit -m 'x'", "pathspec"),
    # no message and no pathspec — aggregation: BOTH reasons in one decision
    ("git commit", ("-m", "pathspec")),
    # -a sweeps the shared index; separate, long, and bundled forms
    ("git commit -am 'x' -- src/", "-a"),
    ("git commit -a -m 'x' -- src/", "-a"),
    ("git commit --all -m 'x' -- src/", "-a"),
    # -a alone: aggregation across three violations (AR-3 concern 4)
    ("git commit -a", ("-a", "-m", "pathspec")),
    # whole-tree sweep pathspecs — all three documented forms (AR-3 concern 6)
    ("git commit -m 'x' -- .", "name the files"),
    ("git commit -m 'x' -- :/", "name the files"),
    ("git commit -m 'x' -- *", "name the files"),
    # PINNED(Wave-3 ruling 2026-07-29: --amend is denied — history rewrites are
    # forbidden by governance, and the repo's own guarantee must hold on a fresh
    # checkout without the machine-local destructive-git sibling)
    # --amend is a history rewrite (covered here so a fresh checkout is
    # guarded); bare --amend also aggregates the message/pathspec teaching
    ("git commit --amend -m 'x' -- DEV.md", "amend"),
    ("git commit --amend --no-edit", "amend"),
    ("git commit --amend", ("amend", "-m")),
    # runner prefixes and git global options must not hide the subcommand —
    # including the runners' OWN flags (AR-4 3.1 blocker 2)
    ("sudo git commit -m 'x'", "pathspec"),
    ("sudo -u root git commit -m 'x'", "pathspec"),
    ("env GIT_AUTHOR_DATE=2026-01-01 git commit -m 'x'", "pathspec"),
    ("env -i git commit -m 'x'", "pathspec"),
    ("env -u GIT_AUTHOR_DATE git commit -m 'x'", "pathspec"),
    ("nice -n 10 git commit -m 'x'", "pathspec"),
    ("nohup -- git commit -m 'x'", "pathspec"),
    ("git -C /tmp commit -m 'x'", "pathspec"),
    ("git -c user.name=x commit -m 'x'", "pathspec"),
    # shell keywords and grouping must not hide the invocation (AR-4 3.1
    # blocker 1): ordinary momentum syntax, not determined bypass
    ("{ git commit -m 'x'; }", "pathspec"),
    ("if true; then git commit -m 'x'; fi", "pathspec"),
    ("for f in a b; do git commit -m 'x'; done", "pathspec"),
    ("while true; do git commit -m 'x'; done", "pathspec"),
    ("time git commit -m 'x'", "pathspec"),
    ("! git commit -m 'x'", "pathspec"),
    # every segment is judged: violator first, middle, and last; every
    # operator from the documented set (AR-3 concerns 3, 9, 16)
    ("git commit -m 'x' && git status", "pathspec"),
    ("git status && git commit -m 'x'", "pathspec"),
    ("git status; git commit -m 'x'; echo done", "pathspec"),
    ("echo x | git commit -m 'x'", "pathspec"),
    ("git commit -m 'x' || echo failed", "pathspec"),
    ("(git commit -m 'x')", "pathspec"),
    # unquoted newline is a segment boundary
    ("git status\ngit commit -m 'x'", "pathspec"),
    # a violation split across a backslash continuation still denies
    ("git commit -a \\\n  -m 'x' -- src/", "-a"),
    # bash concatenates a continuation with NO separator (AR-4 3.1 c.3):
    # git com\<newline>mit really runs git commit
    ("git com\\\nmit -m 'x'", "pathspec"),
    # one malformed neighbour must not blind the guard to a real violation
    # in a well-formed segment (per-piece re-lex, AR-4 3.1 c.6)
    ("git commit -m 'x' && echo 'unterminated", "pathspec"),
    # glued -m value: message present, pathspec still missing
    ("git commit -mfoo", "pathspec"),
    # bare '--' with nothing after it
    ("git commit -m 'x' --", "pathspec"),
    # the incident-1 form: `--` exists only INSIDE the quoted message
    ('git commit -m "docs: the -- pathspec rule"', "pathspec"),
    # lex failure -> coarse fallback, anchored to the segment start
    ("git commit -m 'unterminated", "quote"),
    # KNOWN LIMITATION, pinned (sketch § heredoc bodies): an UNQUOTED heredoc
    # body is judged as command content; a body line shaped like a commit
    # false-denies. Accepted — file content belongs in Write/Edit.
    ('cat <<EOF >> NOTES.md\ngit commit -m "todo"\nEOF\n', "pathspec"),
]

ALLOW = [
    # the corrected form itself
    "git commit -m 'x' -- DEV.md",
    "git commit -m 'x' --no-verify -- DEV.md",
    "git commit -m 'subject' -m 'body' -- a.md b.md",
    "git commit --message='x' -- src/lib/a.ts",
    "git commit --message x -- DEV.md",
    "git commit -F msg.txt -- DEV.md",
    "git commit --file msg.txt -- DEV.md",
    # -ma is -m with glued value "a" per git semantics, NOT bundled -a
    "git commit -ma -- DEV.md",
    # glued values of OTHER flags containing 'a' are not -a (AR-4 3.1 c.4)
    "git commit -uall -m 'x' -- file.txt",
    "git commit -Sabc123 -m 'x' -- file.txt",
    # mid-word '#' is literal, as in bash — commenters disabled (c.5)
    "git commit -m 'x' -- notes#1.md",
    # a well-formed, correctly-scoped commit beside a malformed neighbour
    # stays allowed (per-piece re-lex: no cross-segment contamination, c.6)
    "git commit -m 'valid' -- file.txt && echo 'unterminated",
    # silent shell grouping with no violation stays silent
    "{ git status; }",
    # THE false-deny killer (sketch § Segment): a quoted multi-line message
    # quoting forbidden commands is ONE token and never splits
    "git commit -m 'subject\n\nbody quoting git commit -m x and npx eslint --fix .' -- DEV.md",
    # a QUOTED command substitution with a heredoc is one token — a valid
    # commit shape (AR-3 concern 1: verified against real shlex)
    "git commit -m \"$(cat <<'EOF'\nsubject\nEOF\n)\" -- DEV.md",
    # backslash-newline continuation is normalized before segmentation
    "git commit -m 'x' \\\n  -- DEV.md",
    # prose mentioning the forbidden shape is not an invocation of it
    'grep "git commit" DEV.md',
    "echo git commit -m x",
    "echo never run git commit --amend",
    # non-commit git and non-git commands are silent
    "git status",
    "git status --porcelain | head -5",
    "git diff -- DEV.md",
    "npm run lint:md",
]

# --- eslint-autofix rule ----------------------------------------------------

DENY_ESLINT = [
    # leading and trailing flag positions; the settings deny is a
    # leading-position belt only — this rule is the any-position coverage
    ("npx eslint --fix src/a.ts", ("eslint-autofix", "0e05c5ac")),
    ("npx eslint src/a.ts --fix", "0e05c5ac"),
    ("eslint --fix .", "0e05c5ac"),
    ("./node_modules/.bin/eslint --fix src/", "0e05c5ac"),
    ("npm exec eslint -- --fix src/", "0e05c5ac"),
    ("npx eslint --fix-type layout src/", "0e05c5ac"),
    ("npx eslint --fix-dry-run src/", "0e05c5ac"),
    # npx version pins are ordinary momentum syntax (AR-4 3.2 c.1)
    ("npx eslint@9 --fix src/", "0e05c5ac"),
    ("npx -y eslint@^9.0.0 --fix src/", "0e05c5ac"),
    # yarn/pnpm runner families (AR-4 3.2 c.6)
    ("pnpm exec eslint --fix src/", "0e05c5ac"),
    ("yarn eslint --fix src/", "0e05c5ac"),
    # KNOWN LIMITATION, pinned (AR-4 3.2 c.2): the any-position scan cannot
    # tell a flag from a preceding flag's VALUE that happens to start with
    # --fix; accepted per the momentum threat model (real values almost
    # never start with the literal --fix)
    ("npx eslint --rulesdir --fix-stuff src/", "0e05c5ac"),
    # one command, two rules: BOTH corrections teach in one decision
    (
        "npx eslint --fix src/a.ts && git commit -m 'x'",
        ("eslint-autofix", "commit-pathspec"),
    ),
]

ALLOW_ESLINT = [
    # every basename form WITHOUT the flag stays silent (AR-3 3.2 c.1)
    "npx eslint src/a.ts",
    "eslint src/a.ts",
    "npm exec eslint -- src/a.ts",
    "./node_modules/.bin/eslint src/lib/a.ts",
    # basename EQUALITY, not substring: eslint_d is a different tool (c.2)
    "./node_modules/.bin/eslint_d --fix src/a.ts",
    # the sanctioned autofix path carries no eslint invocation of its own
    "npm run lint:fix:study-lenses",
    "node scripts/lint-fix-study-lenses.mjs",
    # prose and quoted mentions are not invocations
    "echo npx eslint --fix",
    "git commit -m 'ban eslint --fix everywhere' -- DEV.md",
]

DENY += DENY_ESLINT
ALLOW += ALLOW_ESLINT

# --- markdownlint-globs rule ------------------------------------------------

DENY_MDLINT = [
    # a bare file argument is silently treated as a GLOB by markdownlint-cli2
    # — the documented per-file checkpoint requires --no-globs
    ("npx markdownlint-cli2 README.md", ("markdownlint-globs", "--no-globs")),
    ("npx markdownlint-cli2 DEV.md AGENTS.md", "--no-globs"),
    ("./node_modules/.bin/markdownlint-cli2 README.md", "--no-globs"),
    ("markdownlint-cli2 .claude/README.md", "--no-globs"),
    # a filename never used elsewhere kills a hardcoded-name Fake It
    ("npx markdownlint-cli2 CONTRIBUTING.md", "--no-globs"),
    # a plain path BESIDE an intentional glob still needs --no-globs — kills
    # first-arg-only and any-glob-anywhere heuristics
    ('npx markdownlint-cli2 "**/*.md" AGENTS.md', "--no-globs"),
    # runner-family parity with the sibling rules
    ("npm exec markdownlint-cli2 -- README.md", "--no-globs"),
    ("npx markdownlint-cli2@0.21.0 README.md", "--no-globs"),
    # a flag VALUE (--config x) is not a path argument; the plain path
    # beside it still denies
    ("npx markdownlint-cli2 --config custom.jsonc README.md", "--no-globs"),
]

ALLOW_MDLINT = [
    # the corrected per-file form
    "npx markdownlint-cli2 --no-globs README.md",
    'npx markdownlint-cli2 --no-globs "DEV.md"',
    # glob-INTENDED invocations pass: metacharacters or a #-exclusion mean
    # the caller wants globbing (the documented repo-wide form)
    'npx markdownlint-cli2 "**/*.md" "#node_modules"',
    "npx markdownlint-cli2 docs/*.md",
    # no path arguments at all: nothing to misread as a glob
    "npx markdownlint-cli2 --help",
    "npm run lint:md",
    # the tool's real glob dialect includes ? and [] character classes —
    # glob-intended args pass (verified live against markdownlint-cli2)
    'npx markdownlint-cli2 "notes/[ab]doc.md"',
    'npx markdownlint-cli2 "report?.md"',
]

DENY += DENY_MDLINT
ALLOW += ALLOW_MDLINT

# --- write-flag-on-read-command rule ----------------------------------------

DENY_WRITEFLAG = [
    # --output turns a read command into an arbitrary-path write primitive
    # (proven live during Wave 2's review); any token position
    ("git diff --output=/tmp/x -- DEV.md", ("write-flag-on-read-command", "--output")),
    ("git diff -- DEV.md --output=/tmp/x", "--output"),
    ("git log --output=/tmp/x -3", "--output"),
    ("git show HEAD --output /tmp/x", "--output"),
    # git global options must not hide the subcommand from the scoping —
    # the judge->git_subcommand wiring is new at this call site
    ("git -C /tmp diff --output=/tmp/x -- DEV.md", "--output"),
    # markdownlint --fix mutates files from a checkpoint command; with
    # --no-globs present only this rule fires
    (
        "npx markdownlint-cli2 --no-globs --fix README.md",
        ("write-flag-on-read-command", "--fix"),
    ),
    # without --no-globs BOTH rules fire — cross-rule aggregation
    (
        "npx markdownlint-cli2 --fix README.md",
        ("write-flag-on-read-command", "markdownlint-globs"),
    ),
]

ALLOW_WRITEFLAG = [
    # the read commands themselves stay silent
    "git diff -- DEV.md",
    "git diff --stat -- src/",
    "git log --oneline -5",
    "git show HEAD:DEV.md",
    # --output on a NON-read git subcommand is not this rule's business —
    # as a REAL token (kills unscoped scanning; commit-pathspec stays silent
    # because -m and the pathspec are present)
    "git commit --output=/tmp/x -m 'x' -- src/lib/a.ts",
    # a quoted mention is one token, not a flag
    "git commit -m 'add --output support' -- src/lib/a.ts",
    # a fourth subcommand pins the {diff,log,show} ALLOWLIST reading over a
    # not-commit denylist reading
    "git branch --output=/tmp/x",
    # --output-indicator-new is a REAL, unrelated git-diff flag sharing the
    # prefix — the git row matches exact-or-equals, never prefix
    "git diff --output-indicator-new=X -- DEV.md",
    # KNOWN SETTLED CALL, pinned: -O<orderfile> REORDERS diff output, it
    # does not write a file — a naive reading of the flag name must not
    # regress this into a deny
    "git diff -O/dev/null -- DEV.md",
]

DENY += DENY_WRITEFLAG
ALLOW += ALLOW_WRITEFLAG

# --- protocol: fail-open on malformed or degenerate payloads ----------------

MALFORMED = [
    "",  # empty stdin
    "not json at all",
    json.dumps({"tool_name": "Bash"}),  # no tool_input
    json.dumps({"tool_name": "Bash", "tool_input": {}}),  # no command
    json.dumps({"tool_name": "Read", "tool_input": {"file_path": "/x"}}),
    # command-level Zero: present but degenerate (AR-3 concern 8)
    json.dumps({"tool_name": "Bash", "tool_input": {"command": ""}}),
    json.dumps({"tool_name": "Bash", "tool_input": {"command": "   "}}),
    json.dumps({"tool_name": "Bash", "tool_input": {"command": None}}),
    json.dumps({"tool_name": "Bash", "tool_input": {"command": 123}}),
]


def run(payload_text):
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=payload_text,
        capture_output=True,
        text=True,
        check=False,
    )
    decision = None
    reason = ""
    if proc.stdout.strip():
        out = json.loads(proc.stdout)["hookSpecificOutput"]
        decision = out.get("permissionDecision")
        reason = out.get("permissionDecisionReason", "")
    return proc.returncode, decision, reason


def payload_for(command):
    return json.dumps({"tool_name": "Bash", "tool_input": {"command": command}})


failures = []

# static row-consistency check: subcommand scoping is only meaningful for git
# rows (the judge's scoping branch is git-specific by design); a runtime
# assert would violate fail-open, so the constraint lives here
sys.path.insert(0, str(pathlib.Path(HOOK).parent))
import importlib.util as _ilu

_spec = _ilu.spec_from_file_location("governance_guard", HOOK)
_gg = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_gg)
for _row in _gg.FLAG_ROWS:
    if _row["subcommands"] is not None and _row["invocations"] != {"git"}:
        failures.append(
            f"row {_row['name']!r}: subcommands set on non-git invocations "
            f"{_row['invocations']!r} — silently a no-op in the judge"
        )

for command, expected in DENY:
    substrings = (expected,) if isinstance(expected, str) else expected
    code, decision, reason = run(payload_for(command))
    if code != 0:
        failures.append(f"DENY exit!=0 ({code}): {command!r}")
    if decision != "deny":
        failures.append(f"expected deny, got {decision!r}: {command!r}")
    else:
        for substring in substrings:
            if substring.lower() not in reason.lower():
                failures.append(
                    f"reason missing {substring!r}: {command!r} -> {reason!r}"
                )

for command in ALLOW:
    code, decision, _ = run(payload_for(command))
    if code != 0:
        failures.append(f"ALLOW exit!=0 ({code}): {command!r}")
    if decision is not None:
        failures.append(f"expected silence, got {decision!r}: {command!r}")

for payload_text in MALFORMED:
    code, decision, _ = run(payload_text)
    if code != 0:
        failures.append(f"MALFORMED exit!=0 ({code}): {payload_text!r}")
    if decision is not None:
        failures.append(f"expected silence on malformed payload: {payload_text!r}")

print(
    f"deny cases: {len(DENY)}  allow cases: {len(ALLOW)}  "
    f"malformed cases: {len(MALFORMED)}"
)
if failures:
    print(f"FAILURES ({len(failures)}):")
    for failure in failures:
        print(f"  - {failure}")
    sys.exit(1)
print("ALL PASS")
