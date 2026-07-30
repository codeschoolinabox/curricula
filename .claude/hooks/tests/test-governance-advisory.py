#!/usr/bin/env python3
"""Behavioral contract for governance-advisory.py (types.ts is N/A by design).

Run after ANY edit to any hook in this directory: npm run test:hooks

The advisory hook NEVER blocks: every case, FIRING, SILENT, and MALFORMED,
asserts exit == 0. FIRING cases assert the additionalContext JSON carries the
edited file's findings; SILENT cases assert empty stdout. "Checker failure"
means NO REPORT PRODUCED — the checker's exit code is never consulted, since
exit 1 WITH a report is its normal error-findings state and must be relayed.
The checker invocation is injected via GOVERNANCE_ADVISORY_CMD; non-corpus
cases use a LOUD fixture (visible content if wrongly invoked) so silence
proves the corpus gate, not a quiet crash. No test shells to the real corpus;
the mirror-agreement case compares CLASSIFIERS over a fixed path list.
"""

import json
import os
import pathlib
import subprocess
import sys
import tempfile

HOOK = str(
    pathlib.Path(__file__).resolve().parent.parent / "governance-advisory.py"
)
PROJECT = pathlib.Path(HOOK).parent.parent.parent

FIXTURE_REPORT = """AGENTS.md:
  advisory [claims] line 12: something stale
.claude/README.md:
  advisory [claims] line 4: claude readme note
scripts/DOCS.md:
  advisory [links] line 6: docs sketch note
scripts/README.md:
  error [claims] line 3: other doc noise

1 error, 3 advisories"""


FIXTURE_FILES = []


def make_fixture_checker(report, exit_code=0):
    handle = tempfile.NamedTemporaryFile(
        "w", suffix=".py", delete=False, encoding="utf-8"
    )
    handle.write(
        "import sys\n"
        f"sys.stdout.write({report!r})\n"
        f"sys.exit({exit_code})\n"
    )
    handle.close()
    FIXTURE_FILES.append(handle.name)
    return f"{sys.executable} {handle.name}"


LOUD_IF_INVOKED = make_fixture_checker(
    "src/lib/x.ts:\n  error [claims] line 1: WRONGLY INVOKED\n\n1 error", 0
)


def run_hook(payload, checker_cmd):
    env = dict(os.environ)
    env["GOVERNANCE_ADVISORY_CMD"] = checker_cmd
    env["CLAUDE_PROJECT_DIR"] = str(PROJECT)
    return subprocess.run(
        [sys.executable, HOOK],
        input=payload,
        capture_output=True,
        text=True,
        env=env,
    )


def payload_for(file_path, tool_name="Edit"):
    return json.dumps(
        {
            "hook_event_name": "PostToolUse",
            "tool_name": tool_name,
            "tool_input": {"file_path": file_path},
        }
    )


failures = []


def check(name, condition, detail=""):
    if condition:
        print(f"  PASS {name}")
    else:
        failures.append(name)
        print(f"  FAIL {name} {detail}")


def context_of(result):
    body = json.loads(result.stdout.strip())
    return body["hookSpecificOutput"]["additionalContext"]


checker = make_fixture_checker(FIXTURE_REPORT)
checker_exit_one = make_fixture_checker(FIXTURE_REPORT, exit_code=1)

print("FIRING: corpus edit with findings for that file")
result = run_hook(payload_for(str(PROJECT / "AGENTS.md")), checker)
check("exit 0", result.returncode == 0, f"exit={result.returncode}")
out = result.stdout.strip()
check("emits JSON", out.startswith("{"), out[:80])
if out.startswith("{"):
    body = json.loads(out)
    context = body["hookSpecificOutput"]["additionalContext"]
    check("carries the edited file's finding", "something stale" in context)
    check("omits other documents' findings", "other doc noise" not in context)
    check(
        "names the hook event",
        body["hookSpecificOutput"]["hookEventName"] == "PostToolUse",
    )

print("FIRING: a LATER document in the report filters by identity, not position")
result = run_hook(payload_for(str(PROJECT / "scripts" / "README.md")), checker)
check("exit 0", result.returncode == 0)
if result.stdout.strip().startswith("{"):
    context = context_of(result)
    check("carries the later document's finding", "other doc noise" in context)
    check("omits the first document's finding", "something stale" not in context)
else:
    check("emits JSON", False, result.stdout[:80])

# PINNED(AR-2+AR-3 convergent BLOCKER 2026-07-29: exit 1 WITH a report is the
# checker's NORMAL error-findings state — an implementation silencing it is
# inverted; "failure" means NO REPORT PRODUCED, the exit code is never consulted)
print("FIRING: checker exit 1 WITH a report is findings, not failure")
result = run_hook(
    payload_for(str(PROJECT / "scripts" / "README.md")), checker_exit_one
)
check("exit 0", result.returncode == 0)
check("still relays", result.stdout.strip().startswith("{"), result.stdout[:80])
if result.stdout.strip().startswith("{"):
    check(
        "carries the error finding",
        "other doc noise" in context_of(result),
    )

print("FIRING: a Write payload behaves like an Edit payload")
result = run_hook(
    payload_for(str(PROJECT / "AGENTS.md"), tool_name="Write"), checker
)
check("exit 0", result.returncode == 0)
check("emits JSON", result.stdout.strip().startswith("{"), result.stdout[:80])

print("SILENT: corpus edit with no findings for that file")
result = run_hook(payload_for(str(PROJECT / "CLAUDE.md")), checker)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "", result.stdout[:80])

print("SILENT: non-corpus edit never runs the checker (loud fixture)")
result = run_hook(
    payload_for(str(PROJECT / "src" / "lib" / "x.ts")), LOUD_IF_INVOKED
)
check("exit 0", result.returncode == 0)
check("no output proves the gate", result.stdout.strip() == "", result.stdout[:80])

print("SILENT: out-of-project path never fires (loud fixture)")
result = run_hook(payload_for("/etc/hosts"), LOUD_IF_INVOKED)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "")

print("SILENT: checker crash (nonzero, NO report) fails open")
broken = make_fixture_checker("", exit_code=9)
result = run_hook(payload_for(str(PROJECT / "AGENTS.md")), broken)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "", result.stdout[:80])

print("SILENT: unlaunchable checker fails open")
result = run_hook(
    payload_for(str(PROJECT / "AGENTS.md")), "/nonexistent/checker-binary"
)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "")

print("MALFORMED: empty stdin")
result = run_hook("", checker)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "")

print("MALFORMED: missing tool_input")
result = run_hook(
    json.dumps({"hook_event_name": "PostToolUse", "tool_name": "Edit"}), checker
)
check("exit 0", result.returncode == 0)
check("no output", result.stdout.strip() == "")

print("MALFORMED: degenerate tool_input shapes")
for shape in [{}, {"file_path": None}, {"file_path": 123}]:
    result = run_hook(
        json.dumps(
            {
                "hook_event_name": "PostToolUse",
                "tool_name": "Edit",
                "tool_input": shape,
            }
        ),
        checker,
    )
    check(f"exit 0 for {shape}", result.returncode == 0)
    check(f"no output for {shape}", result.stdout.strip() == "")

print("AGREEMENT: the in-hook corpus mirror matches the checker's classifier")
agreement_paths = [
    "AGENTS.md",
    "research-framing.md",
    ".claude/README.md",
    "scripts/DOCS.md",
    "src/lib/utils/README.md",
    "notes.txt",
]
node_script = (
    "import('./scripts/lib/check-governance/corpus.mjs').then((m) => {"
    f"const paths = {json.dumps(agreement_paths)};"
    "console.log(JSON.stringify(paths.map((p) => m.default(p))));})"
)
node_result = subprocess.run(
    ["node", "-e", node_script],
    capture_output=True,
    text=True,
    cwd=str(PROJECT),
)
authority = json.loads(node_result.stdout.strip())
for path, expected in zip(agreement_paths, authority):
    result = run_hook(payload_for(str(PROJECT / path)), checker)
    fired = result.stdout.strip() != ""
    has_findings = f"{path}:" in FIXTURE_REPORT
    check(
        f"mirror agrees on {path}",
        fired == (expected and has_findings),
        f"fired={fired} authority={expected} findings={has_findings}",
    )

for fixture in FIXTURE_FILES:
    try:
        os.unlink(fixture)
    except OSError:
        pass

if failures:
    print(f"\n{len(failures)} failing: {failures}")
    sys.exit(1)
print("\nall governance-advisory cases pass")
