# Handoff: `evaluating/run` merge + loop-guard update

Two parallel tasks coming out of the 2026-04-22 session. This folder
is the orchestration package: spec files for two agents plus this
coordinator for the user.

## Session commit trail (what's already done)

| Commit | Task |
| --- | --- |
| `68fa998` | Task B — iteration-guard widening to `Number.isFinite` + ZOMBIES edge tests |
| `dc58199` | Task C — `.cancel()` method, lazy startup refactor, CancelEvent, 18 tests |
| `ec56a4f` | Task D — `.result` + PromiseLike (`await handle`), 7 more tests |
| `121db0c` | AR-5 doc sweep — DEBUG-HANDOFF removed, LogEvent/AssertEvent removed, docs/types/JSDoc synced |

Tests: 84 passing across run/tests + shared/guard-loops/tests.
Full plan file: `/Users/master/.claude/plans/hi-read-0-curricula-agents-md-and-luminous-finch.md`

## Two parallel tasks

### Task 1 — api/run → evaluating/run merge (M.1–M.6)

Spec: `./agent-merge.md`

Folds the api-layer validation/config resolution into the engine and
unifies the SAB pause protocol across run and trace. Net result:
`run(code, options)` is the single public entry point; the
`createExecution` wrapper goes away; cancel-event invariant holds
across all consumers; the timer correctly pauses during yield.

Sub-tasks (full detail in agent-merge.md):

- **M.1** Move api-layer validation into evaluating/run. Delete api/run.ts.
- **M.2** Thread cancel through so CancelEvent invariant holds everywhere.
- **M.3** Adopt EVENT_READY protocol in run (match trace).
- **M.4** Port replay/re-iteration into RunHandle (identity-stable refs).
- **M.5** Fix timer-pause-during-yield (uses M.3's EVENT_READY signal).
- **M.6** Post-merge doc cleanup (remove "Known inconsistency" notes).

### Task 2 — loop-guard update

Spec: `./agent-loopguard.md`

Current state: docs describe comma-in-condition injection; code
actually does body-injection (a prior agent substituted the
implementation by mistake). User wants the originally documented
design restored AND extended to all loop types (for, do-while, for-of,
for-in).

## Parallel-safety matrix

| File | Merge | Loop-guard | Risk |
| --- | --- | --- | --- |
| `evaluating/run/run.ts` | validation, EVENT_READY, timer, replay | `guardLoopsCondition()` call + `loopCount` threading | Medium — different regions |
| `evaluating/run/create-worker-script.ts` | EVENT_READY writes in traps | `loopN` param declaration + guard template | **High — both edit the worker script string** |
| `evaluating/run/types.ts` | replay types, Execution tidy | none | Low |
| `evaluating/run/worker-protocol.ts` | scope-JSDoc cleanup | none | Low |
| `evaluating/run/README.md` + `DOCS.md` | post-merge cleanup | loop-guard sections | Medium — adjacent sections |
| `evaluating/shared/DOCS.md` | pause/resume consolidation | §guard-loops-moved-to-shared | Low — different sections |
| `evaluating/shared/types.ts` | Execution tidy | none | Low |
| `evaluating/shared/guard-loops/**` | none | everything | Low (solo) |
| `api/run.ts` | delete / merge | none | Low (solo) |

**Recommended sequencing:** loop-guard first, merge second. Loop-guard
is smaller; merge's trap-body EVENT_READY additions want to know the
final loop-counter declaration shape.

**If strictly parallel:** separate branches; use
`evaluating/run/.handoffs/COORDINATION.md` as the cross-branch channel;
last-to-merge rebases.

## Coordination channel

A live communication file lives at
`src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/COORDINATION.md`.

Both agents must:

1. Claim shared files in §Active claims before editing.
2. Commit + push the claim BEFORE starting the edit.
3. `git pull` before editing shared files; check active claims.
4. Mark `[done]` with the merge commit hash when landed.

Branch merges are queued via §Branch queue in that file.
Status updates (one-liners) go in §Status log.
Cross-agent or user-facing blockers go in §Open questions.

## Decisions locked (2026-04-22 afternoon)

All 8 pre-start questions are answered. Full detail in each agent's
spec under §User decisions. Summary:

### Loop-guard agent

1. **Restore vs. adjust:** study the original from git history
   FIRST, then discuss with user. This becomes **Sub-task 0** in
   the spec (runs before Phase 0). The original "was carefully
   designed"; don't reinvent.
2. **Counter declaration:** Worker setup globals — consistent with
   other Worker-setup globals. Drop the current `new Function`
   parameter-injection mechanism.
3. **for-of guards:** cover defensively. JEJ shouldn't allow
   infinite for-of, but better safe than sorry. Agent discusses
   specific injection site with user when it gets there.
4. **Injection syntax per loop type:** same template for
   while/for/for-of/for-in. do-while is the special case — counter
   wraps the `do` keyword, not the trailing `while (cond)`. Exact
   form emerges from Sub-task 0's git-history study.
5. **Recursion guards:** no. JEJ has no user-defined functions;
   browsers provide max-recursion error.

### Merge agent

1. **Replay yield-frequency:** sync-fast (no `setTimeout(0)`
   throttle between yields).
2. **AR-4 scope:** per sub-task (one AR-4 per M.1…M.6). Safer,
   easier to reason about.
3. **api/run.ts fate:** delete outright. Update every consumer in
   the same commit. No re-export shim.

Any new questions that arise during implementation go in
`evaluating/run/.handoffs/COORDINATION.md` §Open questions — not to
the user directly, unless genuinely blocking.

## Invocation prompts

Ready-to-paste prompts when you're ready to spawn each agent in a
fresh session.

### Loop-guard agent (spawn first)

```
You are the loop-guard update agent for the @study-lenses
evaluating/run module. Your spec is at
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/agent-loopguard.md

Read that spec end-to-end first. Then read AGENTS.md and DEV.md at
the repo root. Follow the Phase 0 workflow. Coordinate via
evaluating/run/.handoffs/COORDINATION.md.

Before starting: check the §Open questions section of the spec —
ensure all user-facing questions have been answered. If any are
still open, ask me before proceeding.
```

### Merge agent (spawn after loop-guard commits, or in parallel if
branches stay clean)

```
You are the merge agent for the api/run → evaluating/run merge.
Your spec is at
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/agent-merge.md

Read that spec end-to-end first. Then read AGENTS.md and DEV.md at
the repo root. Follow the Phase 0 workflow. Coordinate via
evaluating/run/.handoffs/COORDINATION.md — especially if the
loop-guard agent is still active.

Before starting: check the §Open questions section of the spec.
```

## Context for the agents

Both agents inherit:

- **AGENTS.md batch-fix directive** (added to repo AGENTS.md this
  session): when AR-N returns multiple findings, fix all in the
  current commit/task rather than deferring.
- **Lazy startup semantics** (user-confirmed, Task C): the Worker is
  not created until the first `.next()` call. `.cancel()` before
  iteration skips Worker creation entirely.
- **Unified ConsoleEvent**: all 19 console methods emit
  `{event: 'console', method: X}`. No per-method events.
- **CancelEvent in logs** (Task C): `.cancel()` appends
  `{event: 'cancel'}` to logs. Invariant to preserve:
  `logs.at(-1)?.event === 'cancel'` is the cancel signal.
- **Identity-stable event refs**: `logs.push(event)` must push the
  yielded reference, not a clone. `deepFreezeInPlace` freezes in
  place. Re-iteration (M.4) must yield the same object references.

## Pointer to full plan

The full plan file with all decisions, sub-task specs, AR workflow,
and historical context:
`/Users/master/.claude/plans/hi-read-0-curricula-agents-md-and-luminous-finch.md`

Read if you need deep context on a specific decision. The agent
specs are self-contained for execution; the plan file is the
authoritative history.
