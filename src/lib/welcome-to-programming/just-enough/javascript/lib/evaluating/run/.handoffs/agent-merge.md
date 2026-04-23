# Merge Agent — M.3–M.6 + AR-5

## Your role

You are continuing the `api/run → evaluating/run` merge. M.1 and M.2
are done. Your scope is M.3 (EVENT_READY), M.4 (replay), M.5
(timer-pause-during-yield), M.6 (doc cleanup), and AR-5 (pre-merge
review).

## Current HEAD state

```text
3d15303  fix: sandbox logs run events live and supports cancel via btn-run toggle
caa15fe  refactor: migrate FakeWorker cancel tests to cancel.browser.test.ts
a41eaf3  docs: sync loop-guard docs with body-injection implementation (I-7)
aed8857  refactor: move loopN counter declaration to Worker-setup globals (I-6)
21384b9  add: for-of coverage + invert 'not guarded' test (I-5)
456e62f  add: do-while coverage to loop-guard (I-4)
5f6cc08  add: for-loop coverage to loop-guard (I-3)
1385253  refactor: extract loop-type-agnostic injection planning (I-2)
7068bfe  refactor: rename guardLoopsCondition to guardLoops (I-1)
641435f  refactor: relocate guard-loops from shared/ to run/
```

## Pre-flight: M.1-cleanup (do before M.3)

`api/run.ts` was deleted in M.1 but one consumer was missed:
`api/default.ts:15` still imports `'./run.js'`. Fix this import to
point at the correct path (check what `api/default.ts` actually needs
from run — likely `createRunGenerator` from
`'../lib/evaluating/run/run.js'`) and confirm `tsc` agrees. Do this
before touching M.3 so the type-check baseline is clean.

## Pre-flight: baseline type errors

Run `npx tsc --noEmit` before starting. Errors in these files are
PRE-EXISTING and not your responsibility:

- `lib/evaluating/shared/create-execution.ts` — stale wrapper, not touched
- `lib/evaluating/trace/**` — trace files have separate pre-existing issues
- Any error in a file outside `lib/evaluating/run/` that you did not modify

The only type errors you should fix are ones you introduced or the
`api/default.ts` M.1-cleanup above.

## AGENTS.md and DEV.md

Read both before writing a line of code. Repo root:
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/`

Key points:

- `--no-verify` approved for all commits (pre-existing broken ESLint config, `eslint.boundaries.mjs` missing)
- Batch-fix directive: all AR findings in the same task's commit
- AR protocol: AR-3 (test strategy) + AR-4 (implementation audit) per sub-task; AR-5 post all sub-tasks
- No `vi.stubGlobal('Worker')` in node tests — Worker tests go in `.browser.test.ts`

## Files to read before coding (in order)

1. `lib/evaluating/run/run.ts` — your primary target. Note:
   - Lines 44–53: current imports from worker-protocol (no EVENT_READY yet)
   - Lines 407–436: `startTimeout`, `pauseTimeout`, `clearTimeoutIfSet`
   - Lines 212–218: "Known inconsistency" JSDoc block (M.5/M.6 removes this)
   - Lines 479–509: event-path branch (yield + resume sequence)
   - Lines 572–606: RunHandle construction via `Object.defineProperty` pattern

2. `lib/evaluating/run/create-worker-script.ts` — loopguard changed this
   significantly (commit `aed8857`). Re-read before editing traps; do not
   assume the pseudo-code in this spec perfectly matches current line numbers.
   Counter declarations are now in Worker-setup globals, not `new Function` params.
   Trap bodies are at lines ~157–213.

3. `lib/evaluating/run/worker-protocol.ts` — `EVENT_READY_INDEX` and
   `clearEventReady` are exported. `EVENT_READY` and `EVENT_NOT_READY` are
   local constants (NOT exported). The inline worker string already has
   `EVENT_READY_INDEX = 5` and `EVENT_READY = 1` as inline constants — do not
   add them again.

4. `lib/evaluating/run/DOCS.md` — §Unified pause protocol is the canonical
   design reference for M.3. Read it before coding; treat it as the spec,
   not just background.

5. `lib/evaluating/shared/create-execution.ts` — replay source for M.4.
   Understand its `createIterator` + `logs` caching pattern, then port the
   concept (not the code) into RunHandle.

6. `lib/evaluating/trace/semantics/tracing/index.ts` — how trace consumes
   EVENT_READY, specifically its deduct-elapsed-time-then-check timer
   pattern. Mirror it in M.3, don't invent.

7. `lib/evaluating/run/tests/cancel.browser.test.ts` — existing browser test
   patterns (real Worker, console.log signal). Use as template for M.3/M.4
   browser tests.

## Do not redo Phase 0

Phase 0 DDD artifacts — README glossary, DOCS.md sketch — are already
committed and accurate. Use the existing §Unified pause protocol in DOCS.md
as the design contract. Do not run AR-1 or AR-2 again.

---

## M.3 — EVENT_READY adoption in run engine

**Worker-side** (`create-worker-script.ts`):

In each trap (`trappedConsole`, `trappedAlert`, `trappedConfirm`,
`trappedPrompt`), add one `Atomics.store` call immediately AFTER the
`PAUSE_PAUSED` store and BEFORE `postMessage`:

```js
// Existing:
Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
postMessage({ type: 'event', event });

// After M.3:
Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
Atomics.store(controlView, EVENT_READY_INDEX, EVENT_READY);
postMessage({ type: 'event', event });
```

The constants `EVENT_READY_INDEX` and `EVENT_READY` already exist in the
generated worker string. Do not add them again.

**Main-thread** (`run.ts`):

1. Import `clearEventReady` and `EVENT_READY_INDEX` from `worker-protocol.ts`.

2. In the event-path branch, add `clearEventReady(views)` BEFORE
   `writeResumeSignal`. See the combined M.3+M.5 ordering in the M.5 section.

3. Timer handler — mirror the trace engine's pattern exactly: deduct elapsed
   time first, THEN check EVENT_READY. Do NOT reschedule blindly.

```ts
function onTimeout(): void {
    remainingMs -= performance.now() - lastResumeTime;
    if (remainingMs <= 0) {
        timedOut = true;
        wakeDequeue();
        return;
    }
    const ready = Atomics.load(views.control, EVENT_READY_INDEX);
    if (ready === EVENT_READY) {
        // Worker posted an event and is paused — timer budget not exhausted
        // and an event is pending. Don't mark timedOut; dequeue will handle.
        return;
    }
    timedOut = true;
    wakeDequeue();
}
```

Read the trace engine first — this is a mirror, not an invention.

**Tests** — browser suite (`.browser.test.ts`):

- Worker posts event AND sets EVENT_READY=1 before timeout fires →
  timer does NOT set `timedOut`
- Worker runs without events (infinite loop, guarded via `iterations`) →
  timer fires `timedOut=true` after `remainingMs`

Commit: `add: run adopts EVENT_READY pause protocol (parity with trace)`

---

## M.4 — Replay on RunHandle

Augment `gen` with `[Symbol.asyncIterator]()` via `Object.defineProperty`,
following the EXACT same pattern as `.cancel`, `.result`, `.then` (lines
572–606 of `run.ts`). Do NOT wrap or replace `gen` with a new object —
that breaks the existing `AsyncGenerator` surface (`.next()`, `.return()`,
`.throw()`) that tests depend on.

**When is replay safe?** Only after `resultPromise` has settled. `logs` is
populated during live iteration and frozen by `buildResult`. Check that
`resultPromise` has settled (not just that it's non-null) before returning
a replay iterator. Otherwise replay starts while drain is still running.

**Implementation sketch:**

```ts
Object.defineProperty(gen, Symbol.asyncIterator, {
    enumerable: false,
    configurable: false,
    writable: false,
    value(): AsyncIterator<RunEvent, RunResult> {
        // If not done, delegate to the live generator
        if (!isDone) return gen[Symbol.asyncIterator]();
        // After completion: replay from frozen logs
        let i = 0;
        return {
            next(): Promise<IteratorResult<RunEvent, RunResult>> {
                if (i < logs.length) return Promise.resolve({ value: logs[i++], done: false });
                return Promise.resolve({ value: result!, done: true });
            },
        };
    },
});
```

Where `isDone` is set when `resultPromise` settles (same closure variable
used by `getResult` / `then`). `logs` is the same array that `body()` pushes
to. `result` is the settled `RunResult`.

Identity-stable: do NOT clone events — push the same reference yielded.
`deepFreezeInPlace` freezes in place; do not re-freeze or clone.

**Tests** (browser suite):

- Happy-path: run completes, iterate once, iterate again → every event
  from second iteration `===` corresponding event from first
- Cancelled: re-iterate → `{event:'cancel'}` appears in replay
- Still-running: `[Symbol.asyncIterator]()` on an in-progress gen returns
  the live gen (no error, no separate stream)

Commit: `add: native replay on RunHandle with identity-stable event refs`

---

## M.5 — Timer pauses during yield

**Complete event-path ordering** (M.3 + M.5 combined — implement in this
order, do not split across tasks):

```ts
// 1. Pause timer before consumer has control (M.5)
pauseTimeout();

// 2. Yield event to consumer
yield event;

// 3. Macrotask break
await new Promise<void>(resolve => setTimeout(resolve, 0));

// 4. Cancel check
if (cancelled) continue;

// 5. Clear EVENT_READY before resuming worker (M.3)
clearEventReady(views);

// 6. Restart timer — BEFORE writeResumeSignal (M.5)
startTimeout();

// 7. Resume worker
writeResumeSignal(views);
```

**Tests** (browser suite):

- `seconds: 0.5`, pause 1s between `.next()` calls → timer does NOT fire
- `seconds: 0.5`, infinite loop (guarded via `iterations`) → timer DOES
  fire within ~500ms

**Doc cleanup after M.5:**

- Remove "Known inconsistency" block from `run.ts` JSDoc (lines 212–218)
- Remove "Known inconsistency" note from `run/README.md` §options.seconds

🔍 **Sandbox checkpoint** (user): step through a ~30-event program over
2+ minutes. Timer must NOT fire.

Commit: `fix: timer pauses during yield using EVENT_READY signal`

---

## M.6 — Post-merge doc cleanup

- `worker-protocol.ts` lines 33–43: update block comment on `EVENT_READY_INDEX`
  that currently says "currently consumed by the TRACE engine only" — it is
  now used by both engines.
- `worker-protocol.ts` JSDoc on `clearEventReady`: remove "trace-consumer-only"
  scope note.
- `shared/DOCS.md` §Pause/resume flow: collapse two-engine split into a
  single unified description.
- `run/README.md`:
  - Drop §Replay / re-iteration content pointing at api/run as replay source;
    replace with native RunHandle replay section.
  - Update §Public API signature (api layer gone).
  - Remove `options.seconds` "Known inconsistency" bullet.
  - Add first-class §Replay section mirroring §Cancellation and §Result.
- `run.ts` function JSDoc: remove "Known inconsistency" block (lines 212–218).

Commit: `docs: sync run/shared docs with merged engine and native replay`

---

## AR-5 — Pre-merge review

Spawn a general-purpose subagent with:

- Full diff: `git log --oneline caa15fe..HEAD` + changed files
- `run/DOCS.md` contents
- This spec file

Focus: every public type has JSDoc, every public function has JSDoc,
every directory has a current README, cross-references accurate, no stale
symbols, docs/types/tests agree. Success criterion: "ready for a dumb and
dangerous LLM to understand and consume."

Batch-fix ALL AR-5 findings in the same commit (AGENTS.md batch-fix directive).

After AR-5 clears, surface the push-to-main decision to the user with:

> M.3–M.6 complete. Ready for final push. Commits: [list]. EVENT_READY
> protocol unified across run and trace. Timer pauses during yield.
> Native replay on RunHandle. api/run.ts deleted and all consumers updated.

**Do NOT push yourself.**

---

## Verification

After all sub-tasks land:

```bash
# All evaluating tests pass
npx vitest run src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating

# No new errors in touched files
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "evaluating/run"

# No remaining api/run imports
grep -rn "from.*api/run" src/

# No remaining createExecution usages
grep -rn "createExecution" src/
```

Sandbox (user-observable — request user runs these at check-ins):

- **M.5 checkpoint**: step through a 30-event program over 2+ minutes.
  Timer must NOT fire.
- **Replay checkpoint**: run a short program, `for await` it twice,
  confirm same event objects (`===` identity).

---

## Don't-do list

- Don't touch `shared/guard-loops/**` (loop-guard scope, fully committed)
- Don't touch `run/README.md` or `run/DOCS.md` loop-guard sections
- Don't change the `RunEvent` union (frozen contract)
- Don't amend committed history
- Don't `git add -A` — stage named files only
- Don't push to remote (user pushes)
- Don't redo Phase 0 / AR-1 / AR-2
