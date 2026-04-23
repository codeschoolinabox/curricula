# Merge Agent — `api/run` → `evaluating/run`

## Role

You are the **merge agent** for the @study-lenses codebase. Your task
is to consolidate the api-layer validation and Execution wrapper into
the `evaluating/run` engine and unify the SAB pause protocol with
trace. The goal is that `createRunGenerator(code, options)` from
`evaluating/run/run.ts` becomes the single public entry point for
running learner code — no separate api layer, no wrapper.

This is substantial work. Budget accordingly.

## Session-origin context

A previous session landed four atomic commits on `main`:

| Commit | Summary |
| --- | --- |
| `68fa998` | Task B — iteration-guard widening to `Number.isFinite`; `0` and negatives throw on first iteration; `Infinity` skips guards. Tests in `guard-loops.test.ts`. |
| `dc58199` | Task C — added `.cancel()` method to `createRunGenerator`'s return. Hoisted queue state out of the generator body. Lazy startup preserved. `CancelEvent` added to RunEvent union; appended to logs on cancel. Tests in `run/tests/cancel.test.ts`. |
| `ec56a4f` | Task D — added `.result` (memoized Promise) and `.then` (PromiseLike) to the RunHandle so `await run(code)` works. |
| `121db0c` | AR-5 doc sweep — deleted DEBUG-HANDOFF.md + LogEvent/AssertEvent; fixed README signature, added §Cancellation/§Result sections; noted a known timer-pause-during-yield inconsistency pending THIS merge; JSDoc'd EVENT_READY as trace-only-for-now. |

Your scope extends what Tasks C+D started (RunHandle as Execution) by
fulfilling the rest of the Execution contract on the raw engine
(replay) and fixing the two remaining gaps (cancel invariant across
the api layer, timer during yield).

Commits your work should NOT touch: the four above. Those are done.

## Goal

Six sub-tasks (M.1–M.6). Full inline spec below so you don't need
external references to execute. You may read the full plan file at
`/Users/master/.claude/plans/hi-read-0-curricula-agents-md-and-luminous-finch.md`
for deeper historical context.

### M.1 — Move api-layer validation into evaluating/run

Currently `api/run.ts` wraps `createRunGenerator` with
`createExecution(factory, cancelFn)`, adds config resolution +
language-level validation, and returns an `Execution<RunEvent, RunResult>`.

**Target:** fold the validation/config-resolution into
`evaluating/run/run.ts` directly. `run(code, options)` becomes the
single public entry point.

**Steps:**

1. Inspect `api/run.ts` end-to-end. Identify:
   - What config options it normalizes (e.g., setting defaults).
   - What language-level validation it performs (check
     `validating/` module imports).
   - What exactly `createExecution(factory, cancelFn)` adds beyond
     the RunHandle.
2. Port the validation pre-step into `run.ts` at the top of
   `createRunGenerator` (or a helper it calls). Validation runs
   BEFORE the lazy-setup body — invalid input returns an error
   RunResult without creating a Worker. This matches the existing
   SAB-unavailable early-return pattern.
3. Port config resolution similarly — apply defaults, expand
   shorthands, etc.
4. Delete `api/run.ts` in the same commit (or add a re-export shim
   — see §Open questions).
5. Update every consumer of `api/run.ts`. Search:
   ```
   grep -rn "from.*api/run" src/
   ```
   Rewrite each import to point at `evaluating/run/run.ts`.

### M.2 — CancelEvent invariant: thread cancel through

**Current gap:** the engine's native `.cancel()` appends
`{event: 'cancel'}` to logs. The api/run.ts wrapper's cancel goes
through `createExecution(... , function noop() {})` which runs
`generator.return()` — which skips the main-loop cancelled branch
that appends the cancel event.

**After M.1:** there's no api wrapper. All consumers call the
engine's `.cancel()` directly. Invariant holds.

**Action required:** verify in a test that `logs.at(-1)?.event === 'cancel'`
is true for ANY consumer calling `.cancel()` (ex-api-layer
consumers, direct engine consumers, sandbox). The test should be in
`run/tests/cancel.test.ts` (extend the existing file).

**Docstring update:** `shared/types.ts` CancelEvent says "Presence in
`logs` is the signal." After M.1 + M.2 this is universally true.
Remove the caveat-hedging added by AR-5 if present. Also update
run/README.md's §Cancellation section if it had any api-layer caveat.

### M.3 — EVENT_READY adoption in run

**Current state:** `worker-protocol.ts` exports `EVENT_READY_INDEX`,
`EVENT_READY`, `EVENT_NOT_READY`, `clearEventReady`. The TRACE
engine uses them; the run engine does NOT (confirmed by AR-5 audit).
SAB layout reserves slot [5] for this signal.

**Why adopt:** consistency with trace (one mental model for learners);
enables M.5 (timer pause during yield); future-proofs run for "detect
hang after N ms with no events"-style features.

**Adoption spec:**

**Worker side** (`run/create-worker-script.ts`):

Each trap (console methods, prompt, alert, confirm) currently sets
`PAUSED=1` before postMessage. Additionally: store `EVENT_READY=1`
to `control[5]` in the same step, before the `Atomics.wait`. Example
pseudo-edit:

```js
// Before:
Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
postMessage({ type: 'event', event: event });
checkPause();

// After:
Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
Atomics.store(controlView, EVENT_READY_INDEX, EVENT_READY);
postMessage({ type: 'event', event: event });
checkPause();
```

Apply to `trappedConsole`, `trappedPrompt`, `trappedAlert`,
`trappedConfirm`. Note: inside the generated worker-script string,
the constants must match those defined at the top of
`create-worker-script.ts` (it declares its own local copies —
`EVENT_READY_INDEX = 5`, `EVENT_READY = 1`).

**Main-thread side** (`run/run.ts`):

- Import `clearEventReady` and `EVENT_READY_INDEX` from
  `worker-protocol.ts` (current imports don't include them).
- After `dequeue()` resolves with an event (the event-path branch),
  call `clearEventReady(views)` BEFORE `writeResumeSignal(views)`.
  This resets control[5] so the next event's EVENT_READY write is
  a fresh signal.
- Timer handler: the `onTimeout` closure inside `startTimeout()`
  currently does `timedOut = true; wakeDequeue();` unconditionally.
  Modify: first read `Atomics.load(views.control, EVENT_READY_INDEX)`.
  If it's `EVENT_READY` (1), the worker is paused with a pending
  event in the queue — don't mark timedOut; reschedule the timer
  for another cycle. Otherwise mark timedOut.

**Tests** (`run/tests/`):

- New test: FakeWorker posts an event AND sets EVENT_READY=1 before
  the timeout fires. Assert the timer reschedules instead of firing
  `timedOut = true`.
- New test: FakeWorker runs without events (infinite loop sim).
  Assert the timer fires `timedOut = true` after `remainingMs`.
- Verify existing timer tests still pass.

### M.4 — Replay / re-iteration on the merged handle

The current `createExecution` wrapper (in
`evaluating/shared/create-execution.ts`) caches events and replays on
re-iteration after completion. Port this into the engine.

**Invariant to preserve:** identity-stable event references. The
cache is whatever `logs: RunEvent[]` accumulates. `logs.push(event)`
must push the SAME reference the consumer saw during live iteration.
`deepFreezeInPlace` freezes in place without cloning. Re-iteration
yields the exact same object references so consumers can
`===`-compare events across live and replay iterations.

**Implementation sketch** (not prescriptive):

Wrap the generator in an iterable object. Its `[Symbol.asyncIterator]()`
returns either:
- the live generator's iterator (delegate to `gen.next()`) if not
  done, OR
- a fresh iterator over the frozen `logs` array if done.

Track completion state (probably via the existing result promise
cache — when `resultPromise` has settled, we're done).

Cancel during live iteration still works. Once done (cancelled or
otherwise), re-iteration yields the frozen log snapshot.

**Do NOT** clone events into the log. **Do NOT** build a separate
cache — reuse the `logs` array that `body()` already maintains.

**Tests:**

- Happy-path run completes, re-iterate, assert identity: every event
  from the second iteration is `===` to the corresponding event from
  the first.
- Cancelled run: re-iterate, assert the `{event: 'cancel'}` entry
  appears in the replay.
- Incomplete run (still executing): assert re-iteration attempt
  behaves sanely — ideally rejects or returns the same generator.

### M.5 — Timer pauses during yield

After M.3, timer handler has the EVENT_READY signal. Now fix the
yield-path:

- Add `pauseTimeout()` at the top of the event-path branch in run.ts,
  BEFORE the `yield event`.
- Add `startTimeout()` after `await new Promise(resolve => setTimeout(resolve, 0))`
  and BEFORE `writeResumeSignal(views)` / `clearEventReady(views)`.

Wrapping yield with pause/start makes stepping mode NOT count against
the `seconds` limit. Combined with M.3's handler guard, the timer
behaves correctly across both IO-callback-await and generator-yield.

**Tests:**

- Set `seconds: 0.5`. Iterate, pause 1 second between `.next()` calls.
  Assert timer does NOT fire (yield pauses it).
- Set `seconds: 0.5`. Run infinite loop (guarded, via iterations).
  Assert timer DOES fire within ~500ms.

**Doc cleanup** (after M.5 lands):

- Remove the "Known inconsistency" note from `run.ts` function JSDoc
  (around line 251).
- Remove the "Known inconsistency" note from `run/README.md`'s
  `options.seconds` bullet.

### M.6 — Post-merge doc cleanup

Now that the merge has shipped, sync documentation:

- `shared/DOCS.md` §Pause/resume flow: collapse the two-engine split
  into a single unified description. Both engines use EVENT_READY
  now.
- `run/worker-protocol.ts` JSDoc on `EVENT_READY_INDEX` and
  `clearEventReady`: remove the "trace-consumer-only" scope note.
  They're now shared infrastructure used by both engines. Update the
  header comment accordingly.
- `run/README.md`:
  - Remove the "Known inconsistency" note from §Public API's
    `options.seconds` bullet.
  - Drop the §Replay / re-iteration section that points at api/run
    as the replay source; replace with documentation of native
    replay on RunHandle.
  - Update §Public API signature description to note that the api
    layer no longer exists.
- `run.ts` function JSDoc: remove the "Known inconsistency" block
  added by AR-5.
- Add a first-class §Replay section to `run/README.md` mirroring
  the existing §Cancellation and §Result sections. Describe
  identity-stable refs + "use `for await` twice to iterate, then
  replay."

## Files to read first

Absolute paths, with read priority. Read in this order.

1. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
   — mandatory before any code change. Workflow rules, AR protocols,
   batch-fix directive.
2. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
   — mandatory. Codebase conventions.
3. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/COORDINATION.md`
   — check for active claims from the loop-guard agent before you
   start editing any shared file.
4. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/run.ts`
   — your primary target. Understand the RunHandle shape (Tasks C+D)
   and the existing lazy-startup flow.
5. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/create-worker-script.ts`
   — for M.3 worker-side trap edits.
6. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/worker-protocol.ts`
   — for EVENT_READY exports (clearEventReady, EVENT_READY_INDEX).
7. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/types.ts`
   — Execution contract, RunEvent union, CancelEvent docstring.
8. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/create-execution.ts`
   — current wrapper source, for understanding replay semantics to
   port.
9. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/api/run.ts`
   — validation + config layer you're merging in.
10. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/tests/cancel.test.ts`
    — existing test patterns, especially `FakeWorker` stub (for
    extending to cover M.3/M.4/M.5 tests).
11. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/semantics/tracing/index.ts`
    — see how trace consumes EVENT_READY, to mirror in run.

## Phase-0 workflow requirement

This is substantial enough to warrant full Phase 0 DDD per DEV.md:

1. **0.1 Ubiquitous language.** The merge introduces new concepts
   (unified pause protocol, replay, Execution fulfilled natively).
   Update `run/README.md`'s glossary if needed.
2. **0.2 README update** — sketch the new architecture in
   `run/README.md` §Public API before touching code.
3. **0.3 AR-1** — design challenge. Spawn a general-purpose agent as
   adversarial reviewer per AGENTS.md § AR-1.
4. **0.4 Types update** — update `run/types.ts` and `shared/types.ts`
   to reflect the final contract (e.g., Execution simplifications).
5. **0.5 Architectural sketch** in `run/DOCS.md` — §Unified pause
   protocol section describing EVENT_READY flow, timer behavior,
   replay mechanism.
6. **0.6 AR-2** — sketch challenge.
7. **0.7 Commit Phase 0** with message `docs: establish merged run
   engine domain model and architectural sketch`.

## TDD workflow per sub-task

For each of M.1–M.6:

1. JSDoc on new/changed public symbols.
2. Stub implementation.
3. Failing test (ZOMBIES order).
4. AR-3 — test strategy challenge.
5. Implement minimally.
6. Lint checkpoint.
7. Refactor.
8. AR-4 — implementation audit.
9. Quality checks (`npm test`, `npm run type-check`, lint).
10. 🔍 Sandbox checkpoint if user-observable (M.2, M.5 are).
11. Atomic commit prompt.

## AR-5 pre-merge review (expanded scope from prior session)

After M.1–M.6 all land, run AR-5 with the full expanded scope:

- Every public type has JSDoc.
- Every public function has JSDoc.
- Every directory has a current README.md.
- Cross-references accurate.
- No stale symbols.
- `run/README.md`, `run/DOCS.md`, `shared/DOCS.md`, `shared/types.ts`,
  `run/types.ts`, `run/worker-protocol.ts` all in sync.

Success criterion: *"the folder should be ready for a dumb and
dangerous LLM to understand and consume"* (user directive from prior
session). Deliverable: a punch list if gaps remain, then fix.

Per AGENTS.md batch-fix directive: address ALL AR-5 findings in the
same task; don't defer.

## User decisions (locked 2026-04-22)

All three pre-start questions are answered:

1. **Replay yield-frequency (M.4): sync-fast.** Replay yields events
   as fast as the consumer pulls — no `setTimeout(0)` throttle
   between yields. The user's replay-exercise use case favors fast
   drain; visual smoothness is the consumer's concern, not the
   engine's.
2. **AR-4 scope: per sub-task.** Run AR-4 independently on each of
   M.1, M.2, M.3, M.4, M.5, M.6. Safer than one-at-the-end; each
   AR-4 audits a contained diff and is easier to reason about. Per
   AGENTS.md batch-fix directive, fix all findings of each AR-4 in
   that sub-task's commit rather than deferring.
3. **api/run.ts fate: delete outright.** No re-export shim. Consumers
   update their imports in the same commit. Run the grep in M.1
   step 5, rewrite every import.

Any NEW questions that arise during implementation go in
`evaluating/run/.handoffs/COORDINATION.md` §Open questions; do not
block on them silently.

## Don't-do list

- **Don't touch `shared/guard-loops/**`** — that's the loop-guard
  agent's scope.
- **Don't touch `run/README.md` or `run/DOCS.md` loop-guard sections**
  — the loop-guard agent owns those.
- **Don't change the RunEvent union** — CancelEvent was added in
  Task C; LogEvent/AssertEvent were removed in AR-5. Contract frozen.
- **Don't touch `api/default.ts`, `api/trace.ts`, or `index.ts`**
  unless M.1's consumer-update grep finds them. If it does, touch
  the specific import line only.
- **Don't re-add the 5-second timeout fallback** (freeze-mask
  anti-pattern from the prior session).
- **Don't use `git add -A`** — stage named files only.
- **Don't amend committed history** — new commits only.
- **Don't run with `--no-verify`** unless the hook failure is
  pre-existing and user-approved (as in the prior session).

## Coordination with loop-guard agent

Communication channel:
`src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/COORDINATION.md`

Protocol (also documented in COORDINATION.md):

1. Before editing `run.ts` or `create-worker-script.ts`, append a
   §Active claims entry and commit-push it.
2. `git pull origin main` before editing shared files.
3. Mark `[done]` when the edit lands.

**If loop-guard is actively editing `create-worker-script.ts`:**
pause. Loop-guard's changes are in the `loopParams` /
`loopArgs` / `new Function(...)` setup region. Your M.3 changes are
in the trap function bodies (`trappedConsole`, `trappedPrompt`,
etc.). Different regions — should merge cleanly — but wait for their
`[done]` entry before pushing your own edit to that file.

**If a push is rejected or a conflict is detected:** stop immediately
and post the details in COORDINATION.md §Open questions for the user
to resolve. Do not attempt to rebase or merge independently.

**If loop-guard has already merged to main:**
`git pull`, review their trap/counter setup changes, adjust your
M.3 additions accordingly. The EVENT_READY writes go in trap bodies
which should be unchanged by loop-guard.

## Verification

After ALL sub-tasks land:

- `npx vitest run src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating` — all tests pass.
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "evaluating/(run|shared)"` — no new errors in touched files.
- Grep for removed symbols:
  - `grep -rn "from.*api/run" src/` — only expected re-export shim hits, if any.
  - `grep -rn "createExecution" src/` — should only appear if something outside run/trace still uses it.
- Sandbox manual (user): load `[io + error]`, run, answer prompts, confirm `[run result]` prints. Load `[infinite loop]`, set max seconds, confirm timeout fires. Load a quiet program, `await run(code)`, confirm result returns.
- Stepping mode: step through a 30-event program over 2+ minutes. Confirm timer does NOT fire despite the long elapsed wall-clock time (M.5 fix).
- Cancel test: click cancel during an infinite loop. Confirm worker terminates AND `[run result]` includes `{event: 'cancel'}` as last log entry (M.2 fix).
- Replay test: run a short program, iterate events, then re-iterate. Confirm same events appear + `===` identity holds.

## Final commit prompt

After AR-5 clears:

> M.1–M.6 complete. Ready for final push to main. Merge commit(s):
> [list]. Expanded Execution contract fulfilled natively on RunHandle.
> api/run.ts [deleted / shimmed]. EVENT_READY protocol unified
> across run and trace. Timer correctly pauses during yield.

Prompt user to push. Do NOT push yourself.
