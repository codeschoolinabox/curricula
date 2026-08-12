---
name: handoff
description:
  Build a resumption point from measured state and validate it context-free
  before any session handoff.
---

# handoff

Build a durable handoff at a clean boundary (an increment-cluster or phase edge
— never between a red test and its green implementation, never between an
implementation and its review).

## 1. Update the plan file's RESUMPTION POINT

Top of the campaign plan in `~/.claude/plans/`. It carries findings, not just
status: state at pause, the commit ledger (full SHAs + one-line summaries), user
decisions that won't be obvious from the diff, AR-cycle status and carry-forward
notes, explicit deferrals, untracked scratch files. Never persist running diffs
or tool transcripts — those are recoverable.

## 2. Measured, never remembered

Every number in the handoff is re-measured NOW — `git log`/`git status` run
fresh, test counts from a fresh run, lint counts recounted. If the
measured-facts oracle exists, run `node scripts/repo-facts.mjs` and paste its
OUTPUT verbatim; never retype a number from memory or inherit one from an
earlier handoff. A remembered number is a claim; the handoff carries
measurements.

## 3. Validate context-free (mandatory)

Per the governance rule "Validate every handoff with a context-free agent" (both
AGENTS files' Non-Negotiable Invariants — cite it by that heading and name,
never by number: the numbering differs between the two files): spawn a fresh
agent with NO session context, hand it ONLY the RESUMPTION POINT plus the launch
prompt, and have it report whether it could orient and execute the next step and
exactly where it would stumble, guess, or block. Apply its must-fix findings
before the handoff is final. The author holds all the context the next agent
lacks and is structurally blind to their own gaps — this step is the one that
catches them, and it is the one most often skipped because writing the handoff
feels like finishing. Only the human waives it.

## 4. Hand the swap to the human — an agent never hands itself off

An agent never clears its own session, chooses the next session's model, or
launches it — whatever the harness allows, the handoff's last mile is ALWAYS the
human's. The skill's final deliverable is therefore a chat message that makes
the swap two keystrokes. That message MUST contain all three of:

1. **Exactly what to do next, including the model.** Open a fresh session (or
   `/clear`), select the NAMED model — design phases track the strongest
   available tier, post-gate TDD runs on a proven cheaper one; write the model's
   actual name, never "a strong one" — and note which gates the human will hold
   in the next phase. **If it is a downgrade, name what it costs in the same
   breath**: `ar-2` and `ar-5` carry no model pin, so they inherit the tier you
   just named (`DEV.md § Sub-model dispatch`). A cheaper tier is yours to
   recommend; a silent one is not.
2. **The validated launch prompt, printed verbatim in a fenced markdown block in
   the chat**, ready to copy-paste as the new session's first message. Print the
   POST-validation version — the one the context-free agent's must-fix findings
   were applied to — never the draft, and never only a pointer to a file the
   human would have to open.
3. **Whether and when this session can be closed.** Either "this session can be
   closed as soon as the prompt block above is copied — nothing of value lives
   only here", or name exactly what must finish first (an in-flight background
   agent, an uncommitted file, an unwritten ledger entry). If anything important
   still exists ONLY in this session's context, it is not yet a handoff — write
   it into the plan file first, then say so.
