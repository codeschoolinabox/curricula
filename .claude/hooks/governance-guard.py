#!/usr/bin/env python3
"""governance-guard — PreToolUse Bash tool hook.

Denies the command shapes this repo's governance forbids but agents
demonstrably still type. Protocol, ubiquitous language, rule roster, and
threat model: README.md beside this file. Architecture: DOCS.md — six phases
(Ingest, Normalize, Lex, Segment, Judge, Decide), declarative rules, every
matching rule contributes its reason to one decision.

Fail-open: any internal error ends in silence (exit 0, no output) — the
human's workflow outranks guard coverage. A deny exists only as the
hookSpecificOutput JSON on stdout; the exit code is always 0.
"""

import json
import re
import shlex
import sys

SEGMENT_OPERATORS = {"&&", "||", ";", "|", "&", "(", ")", "{", "}"}
RUNNER_WORDS = {"sudo", "env", "npx", "nice", "nohup", "yarn", "pnpm", "pnpx", "bunx"}
EXEC_RUNNERS = {"npm", "pnpm", "yarn"}  # <runner> exec/dlx TOOL ...
RUNNER_VALUE_FLAGS = {"-u", "-n", "-g"}  # sudo -u USER, nice -n N, sudo -g GRP
SHELL_KEYWORDS = {
    "if", "then", "elif", "else", "fi",
    "for", "while", "until", "do", "done",
    "case", "esac", "in", "select", "function", "time", "!",
}
GIT_VALUE_OPTIONS = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}
# git-commit short options that take a (possibly glued) value; scanning a
# cluster stops at the first of these — the rest is a value, not more flags
# (git semantics: -am == -a -m; -ma == -m "a"; -uall == -u "all", not -a)
COMMIT_VALUE_SHORTS = {"m", "F", "C", "c", "t", "u", "S"}
SWEEP_PATHSPECS = {".", ":/", "*"}

CORRECTED_FORM = (
    "Correct form: git add <paths> -> verify `git diff --cached --name-only` "
    "in a separate call -> git commit -m \"...\" -- <paths>. A pathspec commit "
    "takes WORKING-TREE content of those paths, not staged content — in this "
    "shared worktree run `git status --short -- <paths>` first and confirm "
    "every listed change is yours."
)


def normalize(command):
    """Join backslash-newline continuations, then turn every UNQUOTED newline
    into a `;` separator so the lexer sees one line. A quote-state scan keeps
    newlines inside quoted strings intact — the quoted multi-line message
    stays one token. Textual, quoted content included for the continuation
    join — accepted lossiness (DOCS.md)."""
    joined = command.replace("\\\n", "")  # bash concatenates with NO separator
    out = []
    state = None  # None | "'" | '"'
    i = 0
    while i < len(joined):
        char = joined[i]
        if state is None:
            if char == "\\" and i + 1 < len(joined):
                out.append(char)
                out.append(joined[i + 1])
                i += 2
                continue
            if char in ("'", '"'):
                state = char
            elif char == "\n":
                char = ";"
        elif state == '"':
            if char == "\\" and i + 1 < len(joined):
                out.append(char)
                out.append(joined[i + 1])
                i += 2
                continue
            if char == '"':
                state = None
        elif state == "'":
            if char == "'":
                state = None
        out.append(char)
        i += 1
    return "".join(out)


def lex_segments(command):
    """One whole-command lex; segments are runs of tokens between operator
    tokens (unquoted newlines were normalized to `;` upstream). Raises
    ValueError on unlexable input — the caller falls back to raw pieces."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    lexer.commenters = ""  # bash treats mid-word '#' as literal; so do we
    segments = []
    current = []
    while True:
        token = lexer.get_token()
        if token is None:
            break
        if token in SEGMENT_OPERATORS:
            if current:
                segments.append(current)
                current = []
            continue
        current.append(token)
    if current:
        segments.append(current)
    return segments


def raw_pieces(command):
    """Lex-failure fallback: raw-string split on the operator set. Pieces are
    unparseable and may be judged only by the coarse fallback."""
    return [
        piece.strip()
        for piece in re.split(r"&&|\|\||;|\||\n|&|\(|\)", command)
        if piece.strip()
    ]


def strip_runners(tokens):
    """Skip leading shell keywords (if/for/time/{/!/...), VAR=value
    assignments, runner words (npx, npm exec, env, sudo, ...), AND the
    runners' own flags (env -i, sudo -u USER, nice -n N); the next token
    carries the invocation."""
    i = 0
    saw_runner = False
    while i < len(tokens):
        token = tokens[i]
        if token in SHELL_KEYWORDS:
            i += 1
            continue
        if (
            token in EXEC_RUNNERS
            and i + 1 < len(tokens)
            and tokens[i + 1] in ("exec", "dlx")
        ):
            saw_runner = True
            i += 2
            continue
        if token in RUNNER_WORDS:
            saw_runner = True
            i += 1
            continue
        if "=" in token and not token.startswith("-"):
            name = token.split("=", 1)[0]
            if name.isidentifier():
                i += 1
                continue
        if saw_runner and token.startswith("-"):
            i += 2 if token in RUNNER_VALUE_FLAGS else 1
            continue
        break
    return tokens[i:]


def invocation_of(tokens):
    """The tool a segment invokes, matched by basename (README glossary)."""
    stripped = strip_runners(tokens)
    if not stripped:
        return "", []
    basename = stripped[0].rsplit("/", 1)[-1]
    # npx-style package specs pin versions (eslint@9, eslint@^9.0.0) — strip
    # the trailing @spec so basename equality still matches; a LEADING @ is a
    # scope (@scope/pkg) and is not a version separator
    if "@" in basename[1:]:
        basename = basename[0] + basename[1:].split("@", 1)[0]
    return basename, stripped[1:]


def git_subcommand(args):
    """Strip git's pre-subcommand global options; return (subcommand, rest)."""
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == "--":  # end-of-options: the subcommand follows
            i += 1
            continue
        if arg in GIT_VALUE_OPTIONS:
            i += 2
            continue
        if any(arg.startswith(opt + "=") for opt in GIT_VALUE_OPTIONS):
            i += 1
            continue
        if arg.startswith("-"):
            i += 1
            continue
        return arg, args[i + 1 :]
    return "", []


def judge_commit_pathspec(tokens):
    """The commit-pathspec rule (README roster item 1). Returns reasons."""
    basename, args = invocation_of(tokens)
    if basename != "git":
        return []
    subcommand, rest = git_subcommand(args)
    if subcommand != "commit":
        return []

    if "--" in rest:
        split_at = rest.index("--")
        flags, pathspec = rest[:split_at], rest[split_at + 1 :]
    else:
        flags, pathspec = rest, None

    has_amend = "--amend" in flags
    has_all = "--all" in flags
    has_message = any(
        flag in ("--message", "--file")
        or flag.startswith("--message=")
        or flag.startswith("--file=")
        for flag in flags
    )
    # short-flag clusters: scan chars until the first value-taking flag —
    # everything after it is that flag's glued value, not more flags
    # (git semantics: -am == -a -m; -ma == -m "a"; -uall == -u "all")
    for flag in flags:
        if flag.startswith("-") and not flag.startswith("--") and len(flag) > 1:
            for char in flag[1:]:
                if char in COMMIT_VALUE_SHORTS:
                    if char in ("m", "F"):
                        has_message = True
                    break
                if char == "a":
                    has_all = True

    reasons = []
    if has_amend:
        reasons.append(
            "[commit-pathspec] --amend rewrites history and is on the "
            "Forbidden list (AGENTS git policy) — the human runs it, never "
            "the agent. Commit a NEW commit instead."
        )
    if has_all:
        reasons.append(
            "[commit-pathspec] -a/--all sweeps every tracked change in a "
            "worktree shared by concurrent sessions — a peer's staged work "
            "rides your commit. " + CORRECTED_FORM
        )
    if not has_message:
        reasons.append(
            "[commit-pathspec] no -m/--message/-F: this commit would hang "
            "waiting on $EDITOR. " + CORRECTED_FORM
        )
    if pathspec is None or not pathspec:
        reasons.append(
            "[commit-pathspec] no explicit pathspec after `--`: in this "
            "shared worktree an unscoped commit takes whatever is staged, "
            "including a peer's files. " + CORRECTED_FORM
        )
    elif any(path in SWEEP_PATHSPECS for path in pathspec):
        reasons.append(
            "[commit-pathspec] the pathspec sweeps the whole tree — name the "
            "files. " + CORRECTED_FORM
        )
    return reasons


# declarative flag rules (DOCS.md: a row is name, invocation basenames,
# forbidden flag prefixes, reason; one judge shared by every row)
FLAG_ROWS = [
    {
        "name": "eslint-autofix",
        "invocations": {"eslint"},
        "flag_prefixes": ("--fix",),
        "reason": (
            "eslint --fix is severity-blind autofix — the largest crater in "
            "this repo's history (0e05c5ac: 150 files reformatted). Use "
            "`npm run lint:fix:study-lenses` (the sanctioned, scoped, "
            "reviewed autofix) or fix by hand."
        ),
    },
]


def judge_flag_rows(tokens):
    """One judge for every declarative row: invocation basename equality +
    forbidden flag prefix at ANY token position. The rule-name tag is derived
    from the row — one source of truth for attribution."""
    basename, args = invocation_of(tokens)
    reasons = []
    for row in FLAG_ROWS:
        if basename not in row["invocations"]:
            continue
        if any(
            arg.startswith(prefix)
            for arg in args
            for prefix in row["flag_prefixes"]
        ):
            reasons.append(f"[{row['name']}] {row['reason']}")
    return reasons


GLOB_METACHARS = set("*?[]{}!#:")  # markdownlint-cli2's documented glob dialect
MDLINT_VALUE_FLAGS = {"--config"}  # flags whose next token is a value


def judge_markdownlint_globs(tokens):
    """The markdownlint-globs rule (bespoke: conditional on flag ABSENCE).
    A bare path argument is silently treated as a GLOB by markdownlint-cli2
    and merges with the config's repo-wide globs — the per-file checkpoint
    form requires --no-globs. Glob-intended args (any metacharacter of the
    tool's dialect) pass; flag values are not path arguments."""
    basename, args = invocation_of(tokens)
    if basename != "markdownlint-cli2":
        return []
    if "--no-globs" in args:
        return []
    plain_paths = []
    i = 0
    while i < len(args):
        arg = args[i]
        if arg in MDLINT_VALUE_FLAGS:
            i += 2
            continue
        if arg.startswith("-"):
            i += 1
            continue
        if not (set(arg) & GLOB_METACHARS):
            plain_paths.append(arg)
        i += 1
    if plain_paths:
        return [
            "[markdownlint-globs] a bare file argument is treated as a GLOB "
            "and merges with the repo-wide config globs — this would lint "
            "hundreds of files, not "
            + ", ".join(plain_paths)
            + ". Per-file form: `npx markdownlint-cli2 --no-globs \"<file>\"`; "
            "full sweep: `npm run lint:md`."
        ]
    return []


COARSE_COMMIT = re.compile(
    r"^\s*(?:\w+=\S*\s+)*(?:(?:sudo|env|npx|nice|nohup)\s+)*"
    r"\S*git\s+(?:-\S+\s+)*commit\b"
)


def judge_unparseable(piece):
    """Coarse fallback — anchored to the segment start, never a substring
    scan (DOCS.md). Only commit-shaped unparseable pieces deny."""
    if COARSE_COMMIT.match(piece):
        return [
            "[commit-pathspec] this command could not be parsed (unbalanced "
            "quoting?) and looks like a git commit. Quote the message and "
            "use the explicit form. " + CORRECTED_FORM
        ]
    return []


RULES = [judge_commit_pathspec, judge_flag_rows, judge_markdownlint_globs]


def decide(command):
    """Judge every segment with every rule; aggregate all reasons. On a
    whole-command lex failure, each raw piece is RE-LEXED individually so
    one malformed segment never demotes its well-formed neighbours to the
    coarse fallback (segment-local judgment, DOCS.md)."""
    normalized = normalize(command)
    reasons = []
    try:
        segments = lex_segments(normalized)
    except ValueError:
        for piece in raw_pieces(normalized):
            try:
                for segment in lex_segments(piece):
                    for rule in RULES:
                        reasons.extend(rule(segment))
            except ValueError:
                reasons.extend(judge_unparseable(piece))
        return reasons
    for segment in segments:
        for rule in RULES:
            reasons.extend(rule(segment))
    return reasons


def main():
    try:
        payload = json.load(sys.stdin)
        command = payload.get("tool_input", {}).get("command", "")
        if not isinstance(command, str) or not command.strip():
            sys.exit(0)
        reasons = decide(command)
        if reasons:
            print(
                json.dumps(
                    {
                        "hookSpecificOutput": {
                            "hookEventName": "PreToolUse",
                            "permissionDecision": "deny",
                            "permissionDecisionReason": "\n\n".join(reasons),
                        }
                    }
                )
            )
    except Exception:
        pass  # fail-open: silence outranks a wrongly blocked human workflow
    sys.exit(0)


if __name__ == "__main__":
    main()
