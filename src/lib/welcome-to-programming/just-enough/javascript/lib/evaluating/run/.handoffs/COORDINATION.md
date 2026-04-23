# Agent Coordination Channel

Live coordination file for the two parallel agents working on
`evaluating/run/`:

- **@agent-merge** — `api/run` → `evaluating/run` merge (M.1–M.6).
  Spec: `./agent-merge.md`
- **@agent-loopguard** — loop-guard implementation update.
  Spec: `./agent-loopguard.md`

Both agents work on separate branches. This file is the cross-branch
communication channel — update it on your branch and rebase off main
regularly, or push coordination updates directly to main (small,
non-code changes don't need review).

---

## How to use — 4-step protocol

Follow this BEFORE editing any of these shared files:

- `evaluating/run/run.ts`
- `evaluating/run/create-worker-script.ts`
- `evaluating/run/README.md` or `DOCS.md`
- `evaluating/shared/DOCS.md`

The protocol:

1. **Claim.** Append an entry to §Active claims below with your
   agent name, branch, file(s) claimed, timestamp, and what you're
   about to do.
2. **Publish.** Commit + push the COORDINATION.md update to main
   BEFORE starting the edit. (This is a coordination-only commit, no
   code changes in it. Commit message: `coord: @agent-X claims <file>
   for <reason>`.)
3. **Sync.** If you're about to edit a shared file, `git pull origin
   main` first. Check §Active claims. If another agent has an active
   claim on the same file, hold off — either wait for their `[done]`
   marker or message them via §Open questions.
4. **Release.** When your edit lands on main, update your §Active
   claims entry to `[done]` with the commit hash. Push to main.

**Branch merges:** add an entry to §Branch queue before merging.
Describe expected conflicts. Last-to-merge rebases.

**Status updates:** one-liners in §Status log so the human user can
see activity without reading diffs.

**Blocked?** Post a question in §Open questions. Cross-agent or
user-facing issues go here.

---

## §Active claims

*(agents: append your claims here; mark `[done]` when the edit has
landed on main; keep entries for audit trail)*

<!-- Example format:
- `[active]` **@agent-loopguard** on `feature/loopguard-update`:
  editing `create-worker-script.ts` (lines 220–260, `loopParams`
  setup). Started 2026-04-22 14:40. Expected duration: ~30min.
- `[done, dead00d]` **@agent-merge** on `feature/api-merge`: moved
  validation from api/run.ts into run.ts. Landed 2026-04-22 16:12.
-->

- `[active]` **@agent-loopguard** on `feature/loopguard-update`:
  relocate guard-loops from `shared/` to `run/`; introduce uniform
  body-injection across 4 loop types (while, for, do-while, for-of);
  rename `guardLoopsCondition` → `guardLoops`; migrate `loopN` counter
  declaration from `new Function` params to Worker-setup globals.
  Phase 0 artifacts (README, DOCS, types.ts) complete at new location;
  AR-1 + AR-2 cleared with batch-fix. Approximate touched regions on
  SHARED files (claim before edit; merge rebases last):
  - `run/run.ts` ~lines 189–200: import path update + call site.
  - `run/create-worker-script.ts` ~lines 225–265: counter-declaration
    region (ABOVE trap functions). Merge agent's EVENT_READY edits
    go INSIDE trap bodies — different regions, should merge clean.
  - `run/DOCS.md` §Why comma-in-condition → §Why body-injection.
    Merge agent's §Unified pause protocol + §scriptMode are different
    sections.
  - `run/README.md` §How it works + §Key design decisions (loop-guard
    language). Merge agent's Cancellation/Result sections different.
  - `shared/DOCS.md` §Why guard-loops moved to shared — to be REMOVED
    (guard-loops no longer in shared). Merge agent's §Pause/resume
    flow consolidation is a different section.
  - `shared/README.md` — remove guard-loops link/reference.

  Started 2026-04-22. Expected duration: 2–3 days.

---

## §Branch queue

*(agents: add an entry before merging to main; other agent reads
before merging their own; last-to-merge rebases)*

<!-- Example format:
- **@agent-loopguard** — `feature/loopguard-update`:
  - Summary: replaces body-injection with comma-in-condition; adds
    support for for/do-while/for-of/for-in.
  - Files: guard-loops.ts, guard-loops.test.ts, shared/README.md,
    run/DOCS.md, run/README.md (loop-guard sections).
  - Expected conflicts: NONE with merge's touched files — isolated
    to the `guardLoopsCondition` template + docs sections.
  - Tests: 35+ new cases in guard-loops.test.ts, all passing.
  - Ready: 2026-04-22 16:00.
-->

---

## §Status log

*(append-only, newest at bottom; keep one-liners; timestamps optional
but helpful)*

- **2026-04-22 14:35 — @orchestrator** — Handoff package created.
  Recommended sequencing: loop-guard first, merge second (loop-guard
  is smaller and merge's EVENT_READY additions want to know the
  final trap-setup shape). Decisions already locked in this session:
  unified ConsoleEvent (no per-method events), lazy startup, .cancel()
  is idempotent, CancelEvent appended to logs, EVENT_READY kept (used
  by trace, run adopts it in merge task M.3). Full commit trail: see
  README.md in the orchestration folder.
- **2026-04-22 afternoon — @orchestrator** — All 8 pre-start open
  questions answered by user. Full detail in each agent's §User
  decisions section. Headlines:
  - **Loop-guard:** (1) Sub-task 0 = study the original via git
    history, then propose restore-vs-adjust. The original "was
    carefully designed." (2) Counter = Worker setup globals. (3)
    for-of guarded defensively. (4) Same template for
    while/for/for-of/for-in; do-while special (counter around `do`).
    (5) No recursion guards.
  - **Merge:** (1) Replay yields sync-fast. (2) AR-4 per sub-task.
    (3) Delete api/run.ts outright, no shim.
  New questions that arise during implementation go in §Open
  questions below, not back to the user by default.
- **2026-04-22 — @agent-loopguard** — Sub-task 0 complete: git
  archaeology shows comma-in-condition was NEVER committed; only HEAD
  body-injection design ever shipped. User approved **Path A** (keep
  body-injection, extend coverage, fix docs). Scope expanded to 4
  loop types (while/for/do-while/for-of); for-in EXCLUDED per user
  direction (not in JeJ surface). Do-while is NOT special under Path
  A — reset text simply starts with `;` for ASI safety.
- **2026-04-22 — @agent-loopguard** — Phase 0 artifacts drafted at
  new location `run/guard-loops/` (README.md, types.ts, DOCS.md).
  AR-1 returned PAUSE with 2 blockers (counter-declaration factual
  mismatch vs HEAD; parent doc drift to comma-in-condition). AR-2
  returned PAUSE with 3 blockers (scope-vs-HEAD-tests; for-in
  exclusion justification; ID-range density). All 11 AR-2 findings
  and 9 AR-1 findings batch-fixed per AGENTS.md batch-fix directive.
  Ready to commit Phase 0 and move to I-0 (relocation). Branch:
  `feature/loopguard-update` off `58aa111`.

---

## §Open questions

*(cross-agent or user-pointing questions; user answers asynchronously)*

<!-- Example format:
- **@agent-loopguard → user** (blocks start): for-of loops —
  keep the current docs' "no guards for for-of" exclusion, or extend
  guards to cover for-of too?
- **@agent-merge → @agent-loopguard**: when your new template lands,
  does the `loopN` parameter name convention change? I'll need to
  know for the EVENT_READY write ordering in traps.
-->

---

## Rules of engagement

- **Don't edit the other agent's scope.** If you're the merge agent,
  don't touch `guard-loops.ts`, `guard-loops.test.ts`, or the
  loop-guard sections in READMEs. If you're the loop-guard agent,
  don't touch `api/run.ts`, SAB protocol, or cancel logic.
- **When in doubt, claim first.** A claim entry costs a tiny commit;
  a merge conflict costs an hour.
- **Coordinate via this file, not private channels.** User reads
  here to see progress.
- **When done with your task, push a final `[done]` status log
  entry** naming the merged commit(s) and noting anything the other
  agent or user should know (e.g., "test infrastructure added, you
  can use vi.stubGlobal for Worker if needed").
