# evaluating/run

Executes JeJ code in a Web Worker with trapped globals, emitting an
event stream and resolving to a structured result. This is the single
public entry point for running learner code — validation, format
gating, config resolution, and execution are all built in. There is
no higher-level wrapper.

## Structure

| File                      | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `types.ts`                | Worker message protocol, event types, `IoMocks`             |
| `run.ts`                  | Public entry: `run(code, { seconds?, iterations?, io? })`   |
| `create-worker-script.ts` | Generates self-contained worker JS string                   |
| `worker-protocol.ts`      | SharedArrayBuffer encode/decode utilities                   |

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this
README. Use them consistently.

- **IO mock** — consumer-provided replacement for one of the
  runtime's IO hooks (`prompt`, `alert`, `confirm`, or a `console`
  method). Each mock is async-compatible — sync returns work, async
  returns are awaited before learner execution continues.
- **Native IO wrapper** — the default implementation of an IO hook,
  delegating to `window.prompt` / `window.alert` / `window.confirm`
  or the corresponding `console.*` method. Used for any hook the
  consumer omits.
- **Resolved IO** — the `{ prompt, alert, confirm, console }` table
  built once per invocation. Each slot is either the consumer's mock
  or the Native IO wrapper. The worker is unaware of which — it always
  sees the same event-emission path.
- **IO event** — a `RunEvent` whose generation involves an IO hook
  (`ConsoleEvent`, `AlertEvent`, `ConfirmEvent`, `PromptEvent`).
  `ErrorEvent` is not an IO event.
- **Shape-identical guarantee** — the sequence, event tags, and `args`
  structure of `RunEvent`s emitted by a run is unaffected by which
  slots in the Resolved IO are mocks vs. native wrappers. Return values
  may differ (they reflect actual IO interaction), but the event shape
  does not.
- **IO execution model** — ALL IO hooks (`prompt`, `alert`, `confirm`,
  and every `console` method) hold learner script execution until the
  hook's callback completes. There is no fire-and-forget category.
  Async mocks let the platform (DOM, network, etc.) do its work without
  the learner's script noticing the difference from a native call.
- **Execution contract** — the `Execution<TEvent, TResult>` shape
  defined in `../shared/types.ts`: `AsyncIterable<TEvent>` +
  `PromiseLike<TResult>` + `.result: Promise<TResult>` +
  `.cancel(): void`. The RunHandle returned by this module satisfies
  this contract natively — no wrapper needed. Trace and debug engines
  return objects satisfying this same contract; their internal
  execution models differ (Worker + SAB for run/trace, iframe for
  debug).
- **Replay / re-iteration** — after a run completes (successfully,
  via a thrown runtime error, or via cancel), a second `for await`
  over the same handle yields the same event **references** that the
  first iteration yielded. Consumers can `===`-compare events across
  live and replayed iterations. Events come from the result's `logs`
  array; no clone, no separate cache. Events are `deepFreezeInPlace`-
  frozen before the first yield; consumer mutation attempts throw in
  strict mode.
- **Unified pause protocol** — the SAB-based coordination that freezes
  the Worker between events. Uses two flags in the control slot array:
  **PAUSE** (control[4], 0=running, 1=paused) and **EVENT_READY**
  (control[5], 0=not ready, 1=ready). Worker sets both in the same
  trap step before `postMessage`; main thread clears EVENT_READY
  before writing the resume signal; the timer handler reads
  EVENT_READY to distinguish "Worker paused with pending event" from
  "Worker stuck in infinite loop." Shared with the trace engine.
- **Cumulative timer** — tracks code-execution time only. Paused
  during generator yield (consumer stepping time does not count),
  during IO callback await (styled dialog time does not count), and
  while the Worker is otherwise blocked. Resumes when the Worker is
  unblocked.
- **Non-IO events** — events whose generation does not involve an IO
  hook: `ErrorEvent` (creation- or execution-phase errors in the
  learner's code) and `CancelEvent` (appended by the main thread
  when `.cancel()` is invoked). They travel the same `RunEvent`
  stream as IO events.

## Public API

```ts
run(
  code: string,
  options?: {
    seconds?: number;    // default 5 — cumulative execution time
    iterations?: number; // optional loop-guard limit
    io?: IoMocks;        // per-hook mocks; unspecified slots use natives
  }
): RunHandle
```

`RunHandle` is defined as

```ts
type RunHandle =
  AsyncGenerator<RunEvent, RunResult> &
  Execution<RunEvent, RunResult>;
```

— `Execution` already extends `PromiseLike` (shape shown at line 105
above just for readers). It **is** an `AsyncGenerator<RunEvent,
RunResult>` (all of `.next()`, `.return()`, `.throw()` are available
and used by internal tests) AND it **satisfies** the
`Execution<RunEvent, RunResult>` contract from `../shared/types.ts`:

- `.cancel()` — tear down the worker and resolve with a cancel-marked
  RunResult. Idempotent. See § Cancellation.
- `.result` — memoized `Promise<RunResult>` that drains the generator
  internally. See § Result.
- `then(...)` — PromiseLike delegate so `await run(code)` works
  directly without explicit `.result`. Same Promise as `.result`.

A consumer may iterate events, await the final result, cancel, or
replay — with no separate wrapper required. The underlying
AsyncGenerator surface is intentionally kept exposed so fine-grained
consumers (primarily the test suite) can call `.next()` directly.

- **`code`** — JavaScript source. Validated on the first `.next()`
  (or first `.result` access). Parse errors, language-level
  violations, and unformatted code are surfaced as immediate error
  RunResults — no Worker is spawned. See § Validation pipeline.
- **`options.seconds`** — cumulative execution time limit. Pauses
  during generator yield (consumer stepping time does not count) AND
  while an IO callback is being awaited (styled dialog time does not
  count). Only actual Worker-thread code execution counts toward the
  limit.
- **`options.iterations`** — when set to any finite number (including
  `0` and negatives), injects loop guards that throw `RangeError` when
  `++loopN > iterations`. `Infinity` / `undefined` = no guards.
- **`options.io`** — optional mocks for IO hooks. Each slot is
  independently overridable; omitted slots fall back to the Native IO
  wrapper. See § IO mocking.
- **Yields** — `RunEvent` objects one at a time, pausing the worker
  between events via the unified pause protocol (PAUSE + EVENT_READY
  flags on the SAB).
- **Returns** — `RunResult` (frozen `{ ok, error?, logs?: RunEvent[] }`)
  on completion. `logs` is absent when code was rejected before
  execution (parse, rejections, formatting gate).

### Lazy startup pipeline

On the first `.next()` call (or first `.result` access), the
generator body runs three phases in order. The `run(...)` call
itself returns cheaply — no work happens until a consumer pulls.

1. **Cancel fast-path** — if `.cancel()` fired before any iteration,
   return a cancel-only RunResult (`{ok:true, logs:[{event:'cancel'}]}`)
   and skip everything else. Worker is never spawned.
2. **Validation gates** — two ordered checks, both producing an
   immediate error RunResult on failure. Worker is still never
   spawned.
   1. **Parse + JeJ validation** — `validate(code)` runs acorn parse,
      then walks the AST against the JeJ language allow-list.
      Returns a `BaseResult`:
      - Parse failure: `{ok:false, error:{kind:'parse', line,
        column, ...}}`
      - Language-level violations: `{ok:false, rejections:[...]}`
      - Pass: `{ok:true}` — continue.
   2. **Format gate** — `checkFormat(code)` verifies the source
      matches the fixed recast output. Unformatted code →
      `{ok:false, error:{kind:'formatting'}}`. No runtime error is
      produced here; unformatted code is valid JavaScript — the gate
      is a learning constraint, not a correctness check.
3. **Execute** — only reached when both gates pass. Worker is
   spawned, the generator body streams events until completion,
   cancel, or timeout.

#### Input-boundary behavior

- **Non-string `code`** — TypeScript types require `code: string`. A
  non-string input reaches `validate()` and (depending on the value)
  produces a `SyntaxError`-shaped parse-failure RunResult via the
  acorn path, or is wrapped as a creation-phase `ErrorEvent` if
  validate throws unexpectedly. The engine does not sync-throw at
  the `run(...)` call boundary.
- **Non-object `options`** — TypeScript types require the options
  parameter shape; a non-object runtime value produces undefined
  destructure reads (`options?.seconds` → `undefined`), which apply
  defaults. No error. This is intentional: the engine is lenient at
  the options boundary for ergonomics.
- **`validate()` / `checkFormat()` unexpected throws** — both are
  specified to return values, never throw. Any throw is an engine
  bug; it is caught inside the generator body and surfaced as a
  creation-phase `ErrorEvent` RunResult rather than escaping to the
  consumer. Iteration still resolves cleanly with `done:true`.

### Consumption modes

```ts
// 1. Iterate events
const handle = run(code);
for await (const event of handle) render(event);

// 2. Await the result, no event iteration
const result = await run(code);
// equivalent:
const result = await run(code).result;

// 3. Mix iteration with cancel
const handle = run(code);
setTimeout(() => handle.cancel(), 1000);
for await (const event of handle) render(event);
```

**Do not mix** modes 1 and 2 on the same handle. `.result` internally
drives `.next()`; concurrent `for await` alongside `await handle`
causes AsyncGenerator to serialize the `.next()` calls, and each
consumer sees a disjoint subset of events. Pick one mode per handle.

## Cancellation

`.cancel()` terminates execution immediately. Idempotent — safe to
call any number of times at any phase.

- **Before first iterate:** sets a cancelled flag. First `.next()`
  sees the flag, returns `{done: true}` immediately. The Worker is
  never constructed. Zero resource leak.
- **During iteration:** pushes a sentinel into the internal queue,
  unsticks the pending `await dequeue()`, main loop's cancelled check
  breaks out, finally block terminates the Worker and revokes the
  Blob URL. A `{event: 'cancel'}` is appended to `logs`. The final
  RunResult is `{ok: true, logs: [...events, {event: 'cancel'}]}`.
- **After completion:** no-op.

Consumers that care whether a run was cancelled can inspect the logs:

```ts
const result = await run(code);
const wasCancelled = result.logs.at(-1)?.event === 'cancel';
```

Cancel is not an error — it did not originate in the learner's
program. The RunResult stays `ok: true`; the cancel event in logs
is the signal.

**`break` inside a live `for await` is equivalent to calling
`.cancel()`** — the runtime's implicit `gen.return()` is intercepted
and routed through the same cancel path, producing the same trailing
`{event: 'cancel'}` and the same replay semantics. Consumers can
`break` out of the iteration loop safely; there is no "lost replay"
footgun:

```ts
const handle = run(code);
for await (const event of handle) {
    if (shouldStop(event)) break;   // same outcome as handle.cancel()
}
const result = await handle;  // settled with {event:'cancel'} in logs
for await (const event of handle) render(event);  // replay works
```

### Cancel latency caveat

Cancel takes effect on the next main-loop iteration. For the worker
to actually stop executing user code, the main loop must reach its
cancelled check. If the main loop is suspended inside `await
handleIoRequest(...)` — i.e. a consumer's async `io.prompt/alert/
confirm` mock is awaiting user input — cancel waits for that
Promise to settle. Native `window.prompt` blocks the main thread
synchronously, so cancel can't even be clicked while it's open. For
styled/async dialogs, the consumer should resolve or reject the
pending IO promise if they want immediate teardown.

## Result

`.result` is a memoized `Promise<RunResult>` that drives the generator
to completion. First access creates the Promise; subsequent accesses
return the same Promise. `await run(code)` is equivalent.

```ts
const result = await run(code);
if (result.ok) {
  console.log('logs:', result.logs);
} else {
  console.log('error:', result.error);
}
```

The Promise resolves with the same RunResult the generator would have
produced via manual iteration. Errors inside the worker (uncaught
`TypeError` etc.) surface as `{ok: false, error: ...}` — they are NOT
thrown from `.result`. The only way `.result` rejects is if the main-
thread code itself throws (unreachable under current code).

## Replay / re-iteration

Once a run completes — successfully, via a thrown error, or via
`.cancel()` — a second `for await` over the same handle replays the
events from the result's `logs` array. No re-execution; no Worker
respawn.

```ts
const handle = run(code);
for await (const event of handle) render(event);     // live run
for await (const event of handle) postProcess(event); // replay
```

The replay yields the same event **references** that the live
iteration yielded. Consumers can `===`-compare events across live
and replayed iterations:

```ts
const liveEvents = [];
for await (const e of handle) liveEvents.push(e);
const replayedEvents = [];
for await (const e of handle) replayedEvents.push(e);
console.log(liveEvents[0] === replayedEvents[0]); // true
```

This is possible because the engine's main loop pushes each yielded
event into an internal `logs` array using the exact reference the
consumer sees — no clone. `deepFreezeInPlace` freezes the final
RunResult (including the `logs` array) in place; identity survives.

Replay does not throttle — events drain as fast as the consumer
pulls. If the consumer wants to pace the replay (e.g. for a
typewriter UI), they do that themselves.

Mid-execution re-iteration (starting a second `for await` before the
first has completed) is unsupported. The underlying
AsyncGenerator serializes concurrent `.next()` calls, so each
consumer sees a disjoint subset of events as the two paths alternate.
Wait for completion (or `.cancel()`) before re-iterating.

## IO mocking

The consumer overrides any subset of IO hooks; the rest fall back to
Native IO wrappers:

```ts
run(code, {
  io: {
    prompt: async (message, defaultValue) =>
      showStyledDialog(message, defaultValue),
    // alert, confirm, console.* omitted → Native IO wrappers used
  },
});
```

### IO execution model

All IO hooks — `prompt`, `alert`, `confirm`, and every `console` method
— hold learner script execution until the hook's callback completes.
There is no fire-and-forget category. An async mock pauses the worker
until the Promise resolves; the learner's script does not continue until
then. This is the same model as a native `prompt()` call that waits for
the user to click OK.

If a mock throws (sync error or async rejection), the error is caught
and an `ErrorEvent` with `name: 'InternalError'` is surfaced in the
learner's event stream. Native IO hooks do not throw; if a mock does,
the runtime owns the failure so the learner sees an internal error, not
an exception from their own code. The worker is terminated cleanly.

### Order for a `prompt` call

1. Learner code calls `prompt("name?")`.
2. Worker trap posts an `io-request` message to the main thread and
   blocks on `Atomics.wait`.
3. Main thread invokes `resolvedIo.prompt("name?", undefined)` and
   awaits the result. (Sync callbacks resolve in one microtask; async
   callbacks resolve when the consumer's UI completes.)
4. Main thread writes the response to the SharedArrayBuffer and calls
   `Atomics.notify`.
5. Worker unblocks, reads the response, constructs a `PromptEvent`
   carrying the return value, and posts it.
6. Main thread yields the `PromptEvent` to the generator consumer.

`alert` and `confirm` follow the same order.

### Order for a `console.*` call

1. Learner code calls (e.g.) `console.log("hello")`.
2. Worker trap posts a `console-event` message to the main thread and
   blocks on the SAB pause flag (`Atomics.wait`).
3. Main thread invokes `resolvedIo.console.log("hello")` and awaits
   the result.
4. Main thread yields the `ConsoleEvent` to the generator consumer.
5. On the consumer's next `next()` call, the main thread releases the
   SAB pause (`Atomics.notify`).
6. Worker unblocks and continues execution.

Console methods do not require a SAB response-slot write (they return
`void`; nothing is delivered back to the worker). The worker is still
held until step 5 — learner code does not proceed past the `console`
call until the callback completes.

**All IO callbacks are awaited.** Sync callbacks cost one microtask;
async callbacks pause the worker for however long the Promise takes
to resolve. The cumulative timer pauses during each callback await so
consumer UI interactions (custom dialogs, typewriter animations) do not
count against execution time.

## Trapped globals

All traps are always defined in the worker — there is no
config-driven trap selection. Which implementation fires on the main
thread is determined by the Resolved IO table.

| Global               | Event produced                              |
| -------------------- | ------------------------------------------- |
| `console.*` (all 19) | `ConsoleEvent` — method, args, line         |
| `alert`              | `AlertEvent` — args, line                   |
| `confirm`            | `ConfirmEvent` — args, return value, line   |
| `prompt`             | `PromptEvent` — args, return value, line    |

The 19 trapped `console` methods: `log`, `debug`, `info`, `warn`,
`error`, `assert`, `table`, `dir`, `dirxml`, `group`, `groupCollapsed`,
`groupEnd`, `count`, `countReset`, `time`, `timeEnd`, `timeLog`,
`trace`, `clear`. (`console.trace` is the stack-trace dumper, not our
semantic trace engine — different namespace, no conflict.)

## How it works

1. Build the **Resolved IO** table from `options.io` + Native IO wrappers.
2. If `options.iterations` is set, inject body-injection loop guards
   into `while`, `for`, `do-while`, and `for-of` loops via string
   offset splice (zero line shift). See `guard-loops/`.
3. Create a SharedArrayBuffer for synchronous IO and pause protocol.
4. Generate a self-contained worker script with trapped globals +
   pause logic.
5. Send a **setup** message (delivers SAB; worker defines traps).
6. Send an **execute** message (delivers learner code).
7. Worker posts each event, then pauses via `Atomics.wait` on the
   pause flag.
8. Generator `next()` resumes the worker via `Atomics.notify` — yields
   one event to the consumer.
9. Handle `io-request` by awaiting `resolvedIo.{prompt|alert|confirm}`
   and writing the response to the SAB; on throw, surface `ErrorEvent`
   with `name: 'InternalError'` and terminate.
10. Handle console events by awaiting `resolvedIo.console[method]` (if
    any) before yielding; on throw, same `InternalError` path.
11. Timeout tracks cumulative execution time: paused while yielded
    AND while awaiting any IO callback.
12. Return frozen `RunResult` on completion, timeout, or iteration
    limit.

## Key design decisions

- **Resolved IO table**: consumer-provided mocks are merged with
  Native IO wrappers at invocation time. The worker is unaware — it
  sees the same event-emission path regardless. This is what gives
  us the shape-identical guarantee.
- **AsyncGenerator**: yields events one at a time with SAB pause
  between each. Enables live streaming to UI and step-through
  consumption. The handle itself is `PromiseLike` so `await run(code)`
  works without iterating — no separate wrapper.
- **Body-injection loop guards**: `{ if (++loop1 > max) throw ...; }
  loop1 = 0;` — zero line shift, zero column shift. Covers `while`,
  `for`, `do-while`, and `for-of`; `for-in` is deliberately excluded
  (not in JeJ surface). Counter globals declared in worker setup via
  `var loop1 = 0, ..., loopN = 0;` — not per-loop inline declarations.
  See `guard-loops/DOCS.md` for the body-injection architecture.
- **Cumulative timeout**: tracks execution time only. Paused during
  SAB wait AND during IO-callback await so learners can examine
  events — or drive a styled dialog — indefinitely.
- **Errors are events**: runtime errors (`phase: 'execution'`) and
  construction errors (`phase: 'creation'`) appear in the logs
  array. The consumer always gets `RunEvent[]`, never a thrown
  exception.
- **SAB + Atomics for IO**: `prompt` / `confirm` / `alert` block the
  worker via `Atomics.wait` while the main thread runs the Resolved IO
  callback (mock or native). Console methods use the existing SAB pause
  flag — no separate response-slot write needed (void return). Requires
  COOP/COEP headers. Returns an error event if SAB is unavailable.
- **SAB pause protocol**: worker pauses after each event via
  `Atomics.wait` on control slot 4 (pause flag). Generator `next()`
  resumes via `Atomics.notify`. See `../shared/DOCS.md` for the full
  6-slot layout.
- **Two-step worker protocol**: `setup` and `execute` are separate
  messages so trap-definition code does not affect learner-code line
  numbers.
- **Validation + format gating inside the engine**: parse, JeJ
  allow-list validation, and format check run lazy inside the
  generator body before Worker spawn. Pedagogy-level gates coupled to
  execution intentionally — callers never have to thread a separate
  "is this runnable?" check through their control flow.
- **No runtime language-level enforcement**: static validation (step
  2 of the Lazy startup pipeline) catches all disallowed constructs
  at the AST level before execution. Runtime enforcement via
  property-descriptor trickery on `globalThis` was removed as
  belt-and-suspenders complexity.

## Platform requirements

SharedArrayBuffer requires these HTTP headers on the hosting page:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If SAB is unavailable, `run` returns a single `ErrorEvent` with
`name: 'EnvironmentError'` rather than throwing.

## Sandbox

To test interactively, start the Vite dev server from the project
root:

```sh
npx vite --config src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
