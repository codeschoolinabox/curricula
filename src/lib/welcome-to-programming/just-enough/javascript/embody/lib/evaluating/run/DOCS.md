# run — Architecture & Decisions

`run` is the trapless evaluation engine. Mostly subtractive vs.
[intercept](../intercept/DOCS.md): same Worker isolation, same
SharedArrayBuffer I/O handshake, same parse/validate/format gates,
same loop-guard injection. The differences are removals (no event
stream, no console traps, no AsyncGenerator surface, no `.fail`)
plus one deliberate behavioral divergence (I/O default).

## Data flow

```mermaid
flowchart TD
    A[validated formatted source<br/>+ RunOptions] --> B[run pipeline:<br/>sync gates, then Worker]
    B -->|sync gate failure<br/>parse / rejections / format| C[pre-settled RunResult<br/>outcome:'error']
    B -->|gates pass<br/>guard-loops if iterations set| D[Worker spawn + execute]
    D -->|complete message<br/>with optional error| E[frozen RunResult<br/>complete / error / iteration-limit]
    D -->|timer fires| F[outcome:'timeout']
    D -->|cancel()| G[outcome:'cancel']
    D -->|worker.onerror| H[outcome:'error', kind:'javascript']
```

The handle is returned synchronously from `run()`. Sync gate failures
pre-settle the result Promise inside `run()` body before the handle
is even returned; the Worker is then never spawned. Only after gates
pass does an async body queue the Worker spawn.

## Why sync gates

Two consequences:

1. **All sync-knowable data is on the handle at return time** —
   `code`, `ast` (acorn `Program`), and `options` (resolved with
   defaults). Consumers can read these without an `await`.
2. **Cancel can never fire mid-gates.** The phase table in §
   "Cancel mechanics" reflects this — a cancel before the Worker
   spawns lands either on a pre-settled result (no-op) or on the
   sync-gates-passed-async-body-not-yet-running path.

`validate()` was refactored (commit 209da51) to return the acorn
`Program` it already builds internally — no duplicate parse pass.
`checkFormat()` and `guardLoops()` were already synchronous.

## Worker isolation

Identical to intercept's:

- Web Worker via Blob URL (so the worker script is a self-contained
  string, no module imports).
- `worker.terminate()` is the kill switch — used by timeout, cancel,
  and worker-error paths.
- SAB-based synchronous I/O for `prompt`/`alert`/`confirm` (the only
  reason this engine needs a Worker rather than a plain async eval).

The worker script itself (`create-worker-script.ts`) is intercept's
template minus:

- the `CONSOLE_METHODS.forEach` block that builds `trappedConsole`,
- the post-response event-emit tail of dialog traps (`events.push`,
  `Atomics.store(PAUSE_INDEX, ...)`, `postMessage({type:'event'})`,
  `checkPause()`),
- the `console` parameter on `new Function(...)` — programs that
  call `console.log` resolve to the worker's native global console.

## SAB layout — same as intercept (slots 4 + 5 unused)

| Slot                       | Used by intercept | Used by run                    |
| -------------------------- | ----------------- | ------------------------------ |
| `CONTROL_INDEX` (0)        | yes               | yes (I/O handshake)            |
| `RESPONSE_TYPE_INDEX` (1)  | yes               | yes                            |
| `NULL_FLAG_INDEX` (2)      | yes               | yes                            |
| `PAYLOAD_LENGTH_INDEX` (3) | yes               | yes                            |
| `PAUSE_INDEX` (4)          | yes               | **no** (no inter-event pauses) |
| `EVENT_READY_INDEX` (5)    | yes               | **no** (no event protocol)     |
| Payload (24+)              | yes               | yes                            |

`worker-protocol.ts` keeps `createBufferViews` (still 6 slots, for
layout symmetry with intercept) plus the four I/O response writers
and `readResponse`. Drops `clearEventReady`, `writePauseEngaged`,
`writeResumeSignal`. The timer's reschedule-on-EVENT_READY branch
from `intercept.ts:514-520` is also stripped — with no event
protocol, a fired timer is always real, not a "paused-with-pending-
event" false alarm.

## Timer mechanics

```ts
const YIELD_CHARGE_MS = 0.8;
```

In intercept this represents the typical wall-clock cost of one
event-cycle's consumer-side processing. In run the only pause point
is during an I/O callback `await`, so the value is essentially
symbolic — a small per-pause minimum tick that prevents I/O-bound
code from cumulatively evading the seconds budget. Kept at the same
value as intercept for symmetry; revisit if testing shows material
over-counting of typical prompt modal time.

`pauseTimer()` runs before the I/O await; `startTimer()` runs after
the response is written back to the SAB (or after a post-await
cancel branch decides not to resume).

## Cancel mechanics (D5c)

Mirrors intercept's `TerminationCause` first-write-wins state
machine. With sync gates, cancel cannot fire mid-gates — the table
below reflects every reachable phase.

| Phase when `cancel()` is called                                          | Behavior                                                                                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync gates already failed → result pre-settled with gate error           | No-op (settle-guard short-circuits). `result` resolves with the gate error, not `'cancel'`.                                                                     |
| Sync gates passed; async body has not yet started worker spawn           | Set `terminationCause: 'cancel'`, settle with `outcome:'cancel'`. The async body's first instruction (after `await Promise.resolve()`) sees the cause and exits without spawning. |
| After Worker spawn, no I/O in flight                                     | `worker.terminate()`, clear timer, settle with `outcome:'cancel'`. Resolution is prompt (single ms).                                                            |
| During an in-flight I/O mock                                             | **Wait for the mock** to resolve or reject. Discard the return value (no SAB write). After the mock settles, terminate worker and settle `outcome:'cancel'`.    |
| After result has already settled (complete, timeout, error, prior cancel) | No-op. Idempotent across the lifecycle.                                                                                                                         |
| Multiple cancels                                                         | First call wins (sets termination cause); subsequent calls are no-ops.                                                                                          |

The cancel-during-I/O wait-for-mock semantics mirror intercept's
I/O-uninterruptible model: the consumer's mock is awaiting in
main-thread JavaScript and can't be cancelled mid-await. The
correct behavior is to let it complete, then terminate. This avoids
mid-state where the mock has side effects but the worker doesn't
get the response.

The leading `await Promise.resolve()` in the async IIFE is
load-bearing. Without it, `new Worker(...)` would execute inside
`run()`'s synchronous frame, race-blocking any `cancel()` queued
immediately after `run()` returns. The defer pushes the spawn into
the next microtask so cancel can land first.

## I/O default (parity with intercept)

No behavioral divergence between the two engines on missing-mock
behavior:

- **Intercept** (`intercept.ts:152-156`, `buildResolvedIo`): missing
  mock → defaults to `window.prompt` / `window.alert` /
  `window.confirm` (native browser dialogs).
- **Run** (`run.ts:101-113`, `buildResolvedIo`): missing mock →
  defaults to `globalThis.prompt` / `globalThis.alert` /
  `globalThis.confirm` (native browser dialogs).

Same fallback semantics, same SAB handshake on the worker side.

**Historical note (D5b rescinded):** an earlier version of run threw
on missing mocks instead of falling back, on the theory that
fire-and-forget consumers shouldn't stall on a native dialog. After
testing, that decision was reverted in favor of intercept-parity. If
you need a no-dialog environment (headless tests, CI), pass mocks
for every dialog your code might call.

## Result and handle types

Lives in [`types.ts`](./types.ts) per the
`lib/validating/types.ts` § BaseResult convention ("execution
wrappers compose their own result types … declared in their own
modules"). `RunResultError` is the engine's discriminated union of
the three runtime kinds (`javascript`, `timeout`, `iteration-limit`)
plus the upstream `ParseResultError` and `FormattingResultError`.

`RunResult` deliberately uses `BaseResult<RunResultError>` directly
rather than the generic `Result<TEvent, TOutcome>` helper because
the latter adds an optional `logs` field run forbids. The
contract `'logs' in result === false` is asserted on every
outcome variant in the test suite.

## Iteration-limit classification

Same gate as intercept (`intercept.ts:940-945`): a `RangeError`
classifies as `outcome:'iteration-limit'` only if **both**:

1. `options.iterations !== undefined` (the consumer asked for
   guards), AND
2. The error message matches the loop-guard's specific format:
   `Loop {n} exceeded {max} iterations.` (regex
   `^Loop \d+ exceeded \d+ iterations\.?`).

Without both, an unguarded `RangeError` from learner code (e.g.
`'a'.repeat(2 ** 32)`) classifies as plain
`outcome:'error'`/`error.kind:'javascript'`. The test
`unguarded RangeError is NOT misclassified as iteration-limit`
triangulates this gate.

## What this module deliberately does NOT do

- Trap `console`. Programs that call `console.log` write to the
  worker's native console (visible in browser dev tools).
- Stream events.
- Expose an AsyncGenerator surface or `Symbol.asyncIterator`.
- Provide `.fail(reason)`. Cancel is the only mutator.
- Replay. The result Promise is memoized but there's nothing to
  replay (no events).

## Related

- [README.md](./README.md) — public API.
- [`run.ts`](./run.ts) — engine implementation.
- [`types.ts`](./types.ts) — types.
- [`worker-protocol.ts`](./worker-protocol.ts) — SAB helpers.
- [`create-worker-script.ts`](./create-worker-script.ts) — worker template.
- [intercept/DOCS.md](../intercept/DOCS.md) — sibling engine; this
  module is mostly its subtractive twin.
- [shared/DOCS.md](../shared/DOCS.md) — cross-engine SAB protocol +
  `Execution` factory + guard-loops.
