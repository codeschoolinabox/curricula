#!/usr/bin/env python3
"""Behavioral contract for pinned-guard.py (types.ts is N/A by design).

Run after ANY edit to any hook in this directory: npm run test:hooks

The pinned-guard emits only `ask` and `silence` — NEVER a deny: `ask` routes
an edit that would erase a pinned expectation to the human, mechanising the
ERASURE face of "never invert without human sign-off" without the bootstrap
deadlock a deny would create. Scope is suffix-only (**/*.test.ts and
**/*.test.tsx — identical to DEV.md § Pinned expectations' inventory scope).
The Write baseline is the ON-DISK file, so fixtures are real temp files and
no command-injection seam exists. Every case asserts exit == 0.
"""

import json
import pathlib
import subprocess
import sys
import tempfile

HOOK = str(pathlib.Path(__file__).resolve().parent.parent / "pinned-guard.py")

PINNED_FILE_CONTENT = """import { it, expect } from 'vitest';

// PINNED(AR-4 2026-07-29: duplicate rows must never silently overwrite)
it('reports a duplicate AR row instead of letting it overwrite', () => {
\texpect(findings).toEqual([duplicateFinding]);
});

it('accepts a fresh row', () => {
\texpect(accept(freshRow)).toBe(true);
});
"""

# Line 0 pin; match at line 3 = exactly 3 above (ask); line 4 = 4 above (silent).
BOUNDARY_CONTENT = """// PINNED(boundary ruling: the window is exactly three lines)
lineA();
lineB();
targetThree();
targetFour();
"""

# Same old_string at two sites: line 1 (pinned context) and line 5 (unpinned).
MULTI_SITE_CONTENT = """// PINNED(multi-site ruling: shared assertion shape)
expect(shape).toBe(1);
fillerOne();
fillerTwo();
fillerThree();
expect(shape).toBe(1);
"""

TWO_PINS_CONTENT = """// PINNED(ruling alpha: first settled expectation)
it('alpha', () => {});
// PINNED(ruling beta: second settled expectation)
it('beta', () => {});
"""

DUPLICATE_PIN_CONTENT = """// PINNED(shared ruling: applies twice)
it('one', () => {});
// PINNED(shared ruling: applies twice)
it('two', () => {});
"""


def make_test_file(content, name="fixture.test.ts"):
    root = pathlib.Path(tempfile.mkdtemp())
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return str(path)


def run_hook(payload):
    return subprocess.run(
        [sys.executable, HOOK],
        input=payload,
        capture_output=True,
        text=True,
    )


def edit_payload(file_path, old_string, replace_all=None, omit_new=False):
    tool_input = {"file_path": file_path, "old_string": old_string}
    if not omit_new:
        tool_input["new_string"] = "replacement"
    if replace_all is not None:
        tool_input["replace_all"] = replace_all
    return json.dumps(
        {
            "hook_event_name": "PreToolUse",
            "tool_name": "Edit",
            "tool_input": tool_input,
        }
    )


def write_payload(file_path, content=None, omit_content=False):
    tool_input = {"file_path": file_path}
    if not omit_content:
        tool_input["content"] = content
    return json.dumps(
        {
            "hook_event_name": "PreToolUse",
            "tool_name": "Write",
            "tool_input": tool_input,
        }
    )


failures = []


def check(name, condition, detail=""):
    if condition:
        print(f"  PASS {name}")
    else:
        failures.append(name)
        print(f"  FAIL {name} {detail}")


def decision_of(result):
    body = json.loads(result.stdout.strip())
    return body["hookSpecificOutput"]


def asks(result):
    return (
        result.stdout.strip().startswith("{")
        and decision_of(result)["permissionDecision"] == "ask"
    )


def silent(result):
    return result.stdout.strip() == ""


print("SILENT: pinned-looking text outside the suffix scope (.md)")
outside = pathlib.Path(tempfile.mkdtemp()) / "notes.md"
outside.write_text(PINNED_FILE_CONTENT, encoding="utf-8")
result = run_hook(edit_payload(str(outside), "// PINNED(anything)"))
check("exit 0", result.returncode == 0, f"exit={result.returncode}")
check("no output", silent(result), result.stdout[:80])

print("SILENT: wrong suffix inside a tests/ directory (.spec.ts is out of scope)")
spec = make_test_file(PINNED_FILE_CONTENT, name="tests/fixture.spec.ts")
result = run_hook(edit_payload(spec, "// PINNED(anything)"))
check("exit 0", result.returncode == 0)
check("no output — suffix decides, not the directory", silent(result))

print("SILENT: a Write to a scope path absent on disk (new-file red stub)")
missing_path = str(pathlib.Path(tempfile.mkdtemp()) / "brand-new.test.ts")
result = run_hook(write_payload(missing_path, "it('new', () => {});\n"))
check("exit 0", result.returncode == 0)
check("no output", silent(result), result.stdout[:80])

print("SILENT: a Write over a disk file that has no pins")
unpinned = make_test_file("it('free', () => {});\n")
result = run_hook(write_payload(unpinned, "anything"))
check("exit 0", result.returncode == 0)
check("no output", silent(result))

print("ASK: an Edit whose old_string contains a pin marker")
path = make_test_file(PINNED_FILE_CONTENT)
result = run_hook(
    edit_payload(
        path,
        "// PINNED(AR-4 2026-07-29: duplicate rows must never silently overwrite)\nit('reports",
    )
)
check("exit 0", result.returncode == 0, f"exit={result.returncode}")
if result.stdout.strip().startswith("{"):
    out = decision_of(result)
    check("asks", out["permissionDecision"] == "ask", str(out)[:80])
    check(
        "quotes the pin rationale",
        "duplicate rows" in out["permissionDecisionReason"],
    )
else:
    check("emits ask JSON", False, result.stdout[:80])

print("ASK: the same pin-in-old_string case in a .test.tsx file")
tsx = make_test_file(PINNED_FILE_CONTENT, name="fixture.test.tsx")
result = run_hook(edit_payload(tsx, "// PINNED(AR-4 2026-07-29: duplicate rows"))
check("exit 0", result.returncode == 0)
check("asks in .test.tsx", asks(result), result.stdout[:80])

print("ASK: an Edit whose match site sits 2 lines under a pin on disk")
result = run_hook(edit_payload(path, "expect(findings).toEqual([duplicateFinding]);"))
check("exit 0", result.returncode == 0)
check("asks from the on-disk lines above", asks(result), result.stdout[:80])

print("BOUNDARY: pin exactly 3 lines above asks; 4 lines above is silent")
boundary = make_test_file(BOUNDARY_CONTENT)
result = run_hook(edit_payload(boundary, "targetThree();"))
check("exit 0", result.returncode == 0)
check("asks at exactly 3 lines above", asks(result), result.stdout[:80])
result = run_hook(edit_payload(boundary, "targetFour();"))
check("exit 0", result.returncode == 0)
check("silent at 4 lines above — the window is contract", silent(result))

print("SILENT: an Edit in the same file touching nothing pinned (before the pin)")
result = run_hook(edit_payload(path, "import { it, expect } from 'vitest';"))
check("exit 0", result.returncode == 0)
check("no output", silent(result), result.stdout[:80])

print("SILENT: an Edit to an unpinned block AFTER the pinned one")
result = run_hook(edit_payload(path, "expect(accept(freshRow)).toBe(true);"))
check("exit 0", result.returncode == 0)
check(
    "no output — position decides, not pin-anywhere-in-file",
    silent(result),
    result.stdout[:80],
)

print("ASK: replace_all with one pinned site among several match sites")
multi = make_test_file(MULTI_SITE_CONTENT)
result = run_hook(
    edit_payload(multi, "expect(shape).toBe(1);", replace_all=True)
)
check("exit 0", result.returncode == 0)
check("asks — every site checked, any pinned site asks", asks(result))

print("DEGRADED: Edit on an unreadable file keeps the old_string verdict")
gone = str(pathlib.Path(tempfile.mkdtemp()) / "gone.test.ts")
result = run_hook(edit_payload(gone, "// PINNED(kept verdict) here"))
check("exit 0", result.returncode == 0)
check("asks from old_string alone", asks(result), result.stdout[:80])
result = run_hook(edit_payload(gone, "no pin here"))
check("exit 0 without pin", result.returncode == 0)
check("silent without pin", silent(result))

print("ASK: file order holds when old_string embeds a pin AND one sits above")
two_consecutive = make_test_file(TWO_PINS_CONTENT)
result = run_hook(
    edit_payload(
        two_consecutive,
        "// PINNED(ruling beta: second settled expectation)\nit('beta', () => {});",
    )
)
check("exit 0", result.returncode == 0)
if result.stdout.strip().startswith("{"):
    reason = decision_of(result)["permissionDecisionReason"]
    check(
        "quotes the window pin BEFORE the old_string pin — disk order",
        "ruling alpha" in reason
        and "ruling beta" in reason
        and reason.index("ruling alpha") < reason.index("ruling beta"),
        reason[:120],
    )
else:
    check("emits ask JSON", False, result.stdout[:80])

print("ASK: an Edit judgment survives invalid UTF-8 elsewhere in the file")
dirty = pathlib.Path(tempfile.mkdtemp()) / "dirty.test.ts"
dirty.write_bytes(PINNED_FILE_CONTENT.encode("utf-8") + b"const raw = '\xff';\n")
result = run_hook(
    edit_payload(str(dirty), "// PINNED(AR-4 2026-07-29: duplicate rows")
)
check("exit 0", result.returncode == 0)
check(
    "asks — undecodable bytes never swallow an old_string verdict",
    asks(result),
    result.stdout[:80],
)

print("ASK: a Write dropping a disk pin survives invalid UTF-8 in that file")
result = run_hook(
    write_payload(str(dirty), "it('rewritten clean', () => {});\n")
)
check("exit 0", result.returncode == 0)
check(
    "asks — undecodable bytes never hide an erased pin",
    asks(result),
    result.stdout[:80],
)

print("ASK: a Write that drops the only pin on disk")
result = run_hook(
    write_payload(path, "import { it } from 'vitest';\nit('rewritten', () => {});\n")
)
check("exit 0", result.returncode == 0)
if result.stdout.strip().startswith("{"):
    out = decision_of(result)
    check("asks about the dropped pin", out["permissionDecision"] == "ask")
    check(
        "quotes the dropped pin's rationale",
        "duplicate rows" in out["permissionDecisionReason"],
    )
else:
    check("emits ask JSON", False, result.stdout[:80])

print("ASK: two pins on disk, the new content keeps one and drops the other")
two = make_test_file(TWO_PINS_CONTENT)
keeps_alpha = (
    "// PINNED(ruling alpha: first settled expectation)\n"
    "it('alpha', () => {});\n"
    "it('beta', () => {});\n"
)
result = run_hook(write_payload(two, keeps_alpha))
check("exit 0", result.returncode == 0)
if result.stdout.strip().startswith("{"):
    out = decision_of(result)
    reason = out["permissionDecisionReason"]
    check("asks — per-pin membership, not existence", out["permissionDecision"] == "ask")
    check("quotes the DROPPED pin", "ruling beta" in reason)
    check("does not quote the kept pin", "ruling alpha" not in reason)
else:
    check("emits ask JSON", False, result.stdout[:80])

print("ASK: both pins dropped — one ask quoting both, in file order")
result = run_hook(write_payload(two, "it('alpha', () => {});\nit('beta', () => {});\n"))
check("exit 0", result.returncode == 0)
if result.stdout.strip().startswith("{"):
    reason = decision_of(result)["permissionDecisionReason"]
    check(
        "quotes both pins in file order",
        "ruling alpha" in reason
        and "ruling beta" in reason
        and reason.index("ruling alpha") < reason.index("ruling beta"),
        reason[:120],
    )
else:
    check("emits ask JSON", False, result.stdout[:80])

print("ASK: a reworded pin reason is an erasure of the old ruling")
reword_src = make_test_file(
    "// PINNED(original ruling: keep me verbatim)\nit('settled', () => {});\n"
)
result = run_hook(
    write_payload(
        reword_src,
        "// PINNED(reworded ruling: changed words)\nit('settled', () => {});\n",
    )
)
check("exit 0", result.returncode == 0)
check("asks — exact text, rewording is not intent-judged", asks(result))

print("ASK: one of two DUPLICATE pin lines erased (multiset, not set)")
dup = make_test_file(DUPLICATE_PIN_CONTENT)
keeps_one = (
    "// PINNED(shared ruling: applies twice)\n"
    "it('one', () => {});\n"
    "it('two', () => {});\n"
)
result = run_hook(write_payload(dup, keeps_one))
check("exit 0", result.returncode == 0)
check("asks — per-occurrence counting", asks(result), result.stdout[:80])

print("SILENT: a Write that keeps every pin verbatim")
result = run_hook(write_payload(path, PINNED_FILE_CONTENT))
check("exit 0", result.returncode == 0)
check("no output", silent(result))

# PINNED(pinned-guard AR-2 C3 2026-07-30: inversion that keeps every marker
# verbatim is a STATED unguarded limit — reviewers own it; the guard must
# stay silent here, not pretend to a coverage it does not have)
print("SILENT (stated limit): pins kept verbatim, assertions beneath rewritten")
inverted = PINNED_FILE_CONTENT.replace(
    "expect(findings).toEqual([duplicateFinding]);",
    "expect(findings).toEqual([]);",
)
result = run_hook(write_payload(path, inverted))
check("exit 0", result.returncode == 0)
check("no output — the stated Write-inversion limit", silent(result))

print("ASK: an Edit payload with no new_string key still judges old_string")
result = run_hook(
    edit_payload(path, "// PINNED(AR-4 2026-07-29: duplicate rows", omit_new=True)
)
check("exit 0", result.returncode == 0)
check("asks — new_string is irrelevant to the judgment", asks(result))

print("SILENT: a Write payload with no content key")
result = run_hook(write_payload(path, omit_content=True))
check("exit 0", result.returncode == 0)
check("no output", silent(result))

print("SILENT: a non-file tool_name with an otherwise ask-shaped payload")
result = run_hook(
    json.dumps(
        {
            "hook_event_name": "PreToolUse",
            "tool_name": "Bash",
            "tool_input": {"file_path": path, "old_string": "// PINNED(x)"},
        }
    )
)
check("exit 0", result.returncode == 0)
check("no output — defense in depth beyond the matcher", silent(result))

print("MALFORMED: empty stdin / missing tool_input / degenerate shapes")
for payload in [
    "",
    json.dumps({"hook_event_name": "PreToolUse", "tool_name": "Edit"}),
    json.dumps(
        {
            "hook_event_name": "PreToolUse",
            "tool_name": "Edit",
            "tool_input": {"file_path": None, "old_string": 3},
        }
    ),
]:
    result = run_hook(payload)
    check(f"exit 0 for {payload[:40]!r}", result.returncode == 0)
    check(f"no output for {payload[:40]!r}", result.stdout.strip() == "")

if failures:
    print(f"\n{len(failures)} failing: {failures}")
    sys.exit(1)
print("\nall pinned-guard cases pass")
