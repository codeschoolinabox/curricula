#!/usr/bin/env python3
"""Non-blocking governance advisory (PostToolUse, matcher Edit|Write).

On an edit to a governance-corpus document, run the governance checker and
relay ONLY the edited document's findings back to the agent as
hookSpecificOutput.additionalContext. Emits only context and silence — never
a deny; exit 0 on every path. "Checker failure" means NO REPORT PRODUCED —
the checker's exit code is never consulted, because exit 1 WITH a report is
its normal error-findings state and must be relayed.

The corpus test below is a deliberately tiny mirror of
scripts/lib/check-governance/corpus.mjs — the checker is the authority, and
the suite pins mirror-vs-authority agreement; drift in either direction
degrades to silence, never a false advisory.
"""

import json
import os
import pathlib
import shlex
import subprocess
import sys

DENY = {"research-framing.md"}
DEFAULT_CHECKER = "node scripts/check-governance.mjs"
CHECKER_TIMEOUT_SECONDS = 30


def main():
    try:
        payload = json.load(sys.stdin)
        tool_input = payload.get("tool_input") or {}
        file_path = tool_input.get("file_path")
        if not isinstance(file_path, str) or not file_path:
            return
        project = pathlib.Path(
            os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or "."
        ).resolve()
        try:
            relative = pathlib.Path(file_path).resolve().relative_to(project)
        except ValueError:
            return
        rel = relative.as_posix()
        if not is_corpus_path(rel):
            return
        report = run_checker(project)
        if report is None:
            return
        findings = findings_for(report, rel)
        if not findings:
            return
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PostToolUse",
                        "additionalContext": (
                            "governance checker findings for "
                            f"{rel} (advisory, non-blocking):\n{findings}"
                        ),
                    }
                }
            )
        )
    except Exception:
        pass


def is_corpus_path(rel):
    if not rel.endswith(".md"):
        return False
    if rel in DENY:
        return False
    if "/" not in rel:
        return True
    return rel.startswith(".claude/") or rel.startswith("scripts/")


def run_checker(project):
    command = os.environ.get("GOVERNANCE_ADVISORY_CMD") or DEFAULT_CHECKER
    try:
        result = subprocess.run(
            shlex.split(command),
            capture_output=True,
            text=True,
            cwd=str(project),
            timeout=CHECKER_TIMEOUT_SECONDS,
        )
    except Exception:
        return None
    return result.stdout if result.stdout.strip() else None


def findings_for(report, rel):
    lines = []
    capturing = False
    for line in report.splitlines():
        if line == f"{rel}:":
            capturing = True
            continue
        if capturing:
            if line.startswith("  "):
                lines.append(line.strip())
            else:
                break
    return "\n".join(lines)


main()
sys.exit(0)
