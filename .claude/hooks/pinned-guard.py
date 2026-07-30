#!/usr/bin/env python3
"""PreToolUse guard: ask before an Edit/Write erases a pinned expectation.

Mechanises the ERASURE face of DEV.md § Pinned expectations' "never invert
without human sign-off": emits only `ask` and `silence` — NEVER a deny (a
deny would recreate the bootstrap deadlock where a pin could never be
legitimately changed). Scope is suffix-only (**/*.test.ts, **/*.test.tsx),
identical to the convention's inventory scope by construction. Sketch:
DOCS.md § Sketch amendment — the pinned-guard pipeline. Fail-open: any
internal error ends in silence; the exit code is always 0.
"""

import json
import sys

MARKER = "// PINNED("
WINDOW = 3


def pin_lines(text):
    """Every marker-carrying line, stripped, in text order (per occurrence)."""
    return [line.strip() for line in text.split("\n") if MARKER in line]


def match_site_lines(disk, needle):
    """Zero-based line numbers where each occurrence of needle starts —
    non-overlapping, matching what a sequential replace would touch."""
    if not needle:
        return []
    sites = []
    start = 0
    while True:
        index = disk.find(needle, start)
        if index == -1:
            return sites
        sites.append(disk.count("\n", 0, index))
        start = index + len(needle)


def judge_edit(file_path, old_string):
    """Pins in old_string itself, plus pins in the WINDOW on-disk lines
    directly above EVERY match site (replace_all or not — any pinned site
    asks), quoted in FILE ORDER: every pin is tagged with its disk line and
    the final list is sorted by it. An unreadable file (or an old_string
    absent from disk) degrades to the old_string-only check: a verdict
    already in hand is never discarded. Undecodable bytes are REPLACED,
    never allowed to abort the judgment."""
    old_string_pins = pin_lines(old_string)
    try:
        with open(file_path, encoding="utf-8", errors="replace") as handle:
            disk = handle.read()
    except OSError:
        return old_string_pins
    lines = disk.split("\n")
    sites = match_site_lines(disk, old_string)
    if not sites:
        return old_string_pins
    found = []
    for site in sites:
        for offset in range(max(0, site - WINDOW), site):
            stripped = lines[offset].strip()
            if MARKER in stripped:
                found.append((offset, stripped))
        for extra, raw in enumerate(old_string.split("\n")):
            if MARKER in raw:
                found.append((site + extra, raw.strip()))
    ordered = []
    for _, text in sorted(found, key=lambda pair: pair[0]):
        if text not in ordered:
            ordered.append(text)
    return ordered


def judge_write(file_path, content):
    """Disk pin lines the new content drops — a MULTISET of exact marker-line
    texts, per occurrence, so duplicate-pin erasure and reworded reasons both
    ask. A path absent on disk carries vacuously no pins (the new-file
    red-stub path). Undecodable bytes are REPLACED, never allowed to abort
    the judgment — a pin line corrupted on disk cannot be matched by new
    content, which fails toward ask."""
    try:
        with open(file_path, encoding="utf-8", errors="replace") as handle:
            disk = handle.read()
    except OSError:
        return []
    new_counts = {}
    for line in pin_lines(content):
        new_counts[line] = new_counts.get(line, 0) + 1
    missing = []
    seen = {}
    for line in pin_lines(disk):
        seen[line] = seen.get(line, 0) + 1
        if seen[line] > new_counts.get(line, 0) and line not in missing:
            missing.append(line)
    return missing


def main():
    payload = json.load(sys.stdin)
    tool_name = payload.get("tool_name")
    if tool_name not in ("Edit", "Write"):
        return
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return
    file_path = tool_input.get("file_path")
    if not isinstance(file_path, str):
        return
    if not file_path.endswith((".test.ts", ".test.tsx")):
        return
    if tool_name == "Edit":
        old_string = tool_input.get("old_string")
        if not isinstance(old_string, str):
            return
        pins = judge_edit(file_path, old_string)
    else:
        content = tool_input.get("content")
        if not isinstance(content, str):
            return
        pins = judge_write(file_path, content)
    if not pins:
        return
    reason = (
        "This edit touches or erases pinned test expectation(s) — settled "
        "by a human or AR ruling (DEV.md § Pinned expectations). Never "
        "invert without human sign-off:\n" + "\n".join(pins)
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception:  # fail-open: the human's workflow outranks guard coverage
        pass
    sys.exit(0)
