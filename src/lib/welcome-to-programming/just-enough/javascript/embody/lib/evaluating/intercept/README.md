# evaluating/intercept

Executes JeJ code in a Web Worker with trapped globals, emitting an
event stream and resolving to a structured result. This is the single
public entry point for running learner code — validation, format
gating, config resolution, and execution are all built in. There is
no higher-level wrapper.

## Structure

| File                      | Purpose                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `types.ts`                | Worker message protocol, event types, `IoMocks`                                 |
| `intercept.ts`            | Public entry: `createInterceptGenerator(code, { seconds?, iterations?, io? })`  |
| `create-worker-script.ts` | Generates self-contained worker JS string                                       |
| `worker-protocol.ts`      | SharedArrayBuffer encode/decode utilities                                       |

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
- **IO event** — a `InterceptEvent` whose generation involves an IO hook
  (`ConsoleEvent`, `AlertEvent`, `ConfirmEvent`, `PromptEvent`).
  `ErrorEvent` is not an IO event.
- **Shape-identical guarantee** — the sequence, event tags, and `args`
  structure of `InterceptEvent`s emitted by a run is unaffected by which
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
  `.cancel(): void`. The InterceptHandle returned by this module satisfies
  this contract natively — no wrapper needed. Trace and debug engines
  return objects satisfying this same contract; their internal
  execution models differ (Worker + SAB for run/trace, iframe for
  debug).
- **Replay / re-iteration** — after a run completes (successfully,
  via a thrown runtime error, or via cancel), a second `for await`
  over the same handle yields the same event **references** that the
  first iteration yielded. Consumers can `===`-compare events across
  live and replayed iterations. Events come from the result's `events`
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
- **Non-IO event** — an event whose generation does not involve an IO
  hook: `ErrorEvent` (creation- or execution-phase errors in the
  learner's code). It travels the same `InterceptEvent` stream as IO
  events. Termination markers (cancel, break, fail) are NOT events
  — they live on the InterceptResult as `outcome` + optional `reason`.
- **Outcome** — how a run resolved. Six first-class variants set
  on the `InterceptResult` by the engine's buildResult: `complete`
  (natural end of learner code), `cancel` (consumer stopped via
  `.cancel()` or for-await break), `fail` (consumer stopped via
  `.fail(reason)` with a structured rejection payload), `timeout`
  (seconds budget exhausted), `iteration-limit` (guarded loop
  exceeded cap), `error` (learner code threw, or parse/format/
  creation gate failed). Consumers switch on `result.outcome` —
  TypeScript narrows it exhaustively. `events` is a pure worker-
  emitted event stream; it does NOT carry synthetic cancel/fail
  markers. See § Outcome below.
- **wrap** / **`__$ic`** / **`__currentPath`** / **instrumentation phase** /
  **nodePath** / **provenance (`'instrumented'`/`'enclosing-fallback'`/`'no-ast'`)** /
  **link** / **entwining** — see [DOCS.md § Ubiquitous Language](DOCS.md)
  for the full architectural vocabulary. Briefly: every trap call's source
  position is captured at AST-walk time and baked into a per-call wrap; the
  trap reads it at fire time. Events carry `nodePath`, `nodePathSource`,
  `node`, and `loc` directly — the AST is the single source of truth for
  position.
- **Termination cause** (internal) — the single closure variable
  inside `createInterceptGenerator` that records the first reason the
  run ended (first-write-wins). All termination entry points
  (cancel / fail / timeout / worker-error) funnel through one
  `setTermination()` helper so concurrent triggers collapse to a
  monotonic state machine without a priority ladder. The
  termination-cause payload (e.g. the `reason` passed to `.fail()`)
  surfaces on the InterceptResult alongside `outcome`.

## Public API

```ts
createInterceptGenerator(
  code: string,
  options?: {
    seconds?: number;    // default 5 — user-perceived runtime budget
    iterations?: number; // optional loop-guard limit
    io?: IoMocks;        // per-hook mocks; unspecified slots use natives
  }
): InterceptHandle
```

`InterceptHandle` extends the standard `Execution` contract with
intercept-specific eager fields and a structured-failure trigger. The
shape per `intercept/types.ts`:

```ts
type InterceptHandle =
  AsyncGenerator<InterceptEvent, InterceptResult> &
  Execution<InterceptEvent, InterceptResult> & {
    readonly code: string;             // the source passed in
    readonly options: InterceptOptions;// the options passed in (defaults applied)
    readonly ast: Promise<AstRecord | null>; // resolves once validation runs
    fail(reason?: unknown): void;      // structured-failure trigger
  };
```

It **is** an `AsyncGenerator<InterceptEvent, InterceptResult>` (all of
`.next()`, `.return()`, `.throw()` are available and used by internal
tests) AND it **satisfies** the `Execution<InterceptEvent,
InterceptResult>` contract from `../shared/types.ts`:

- `.cancel()` — tear down the worker and resolve with a cancel-marked
  InterceptResult. Idempotent. See § Cancellation.
- `.result` — memoized `Promise<InterceptResult>` that drains the generator
  internally. See § Result.
- `then(...)` — PromiseLike delegate so `await createInterceptGenerator(code)`
  works directly without explicit `.result`. Same Promise as `.result`.

Plus the intercept-specific fields:

- `.code` — the source string the consumer passed (verbatim).
- `.options` — the options object the consumer passed, with defaults
  applied. Read at any time, before or during iteration.
- `.ast` — `Promise<AstRecord | null>` that resolves to the parsed-and-
  built AST record once validation completes. Resolves to `null` if
  validation fails (parse error, JeJ violation) or if `.cancel()` ran
  before iteration began. Same record reference attached to the eventual
  `result.ast`.
- `.fail(reason?)` — structured-failure trigger. See § Fail.

A consumer may iterate events, await the final result, cancel, or
replay — with no separate wrapper required. The underlying
AsyncGenerator surface is intentionally kept exposed so fine-grained
consumers (primarily the test suite) can call `.next()` directly.

- **`code`** — JavaScript source. Validated on the first `.next()`
  (or first `.result` access). Parse errors, language-level
  violations, and unformatted code are surfaced as immediate error
  InterceptResults — no Worker is spawned. See § Validation pipeline.
- **`options.seconds`** — user-perceived runtime budget. Pauses
  during generator yield (consumer stepping time does not count) AND
  while an IO callback is being awaited (styled dialog time does not
  count). Each event yield additionally deducts a flat 5 ms charge
  representing the typical wall-clock cost of one event-cycle's
  consumer-side processing. The flat charge rounds up so a busy
  rendering-bound loop times out at-or-before the budget rather than
  after — see DOCS.md § Timer-vs-yield.
- **`options.iterations`** — when set to any finite number (including
  `0` and negatives), injects loop guards that throw `RangeError` when
  `++loopN > iterations`. `Infinity` / `undefined` = no guards.
- **`options.io`** — optional mocks for IO hooks. Each slot is
  independently overridable; omitted slots fall back to the Native IO
  wrapper. See § IO mocking.
- **Yields** — `InterceptEvent` objects one at a time, pausing the worker
  between events via the unified pause protocol (PAUSE + EVENT_READY
  flags on the SAB).
- **Returns** — `InterceptResult` (frozen `{ ok, outcome, reason?, error?, events: LinkedInterceptEvent[], ast, code, options, visitCounts }`)
  on completion. `outcome` is required and exhaustively classifies how
  the run ended (see § Outcome). `reason` is present only when
  `outcome === 'fail'`. `events` is empty (`[]`) when code was rejected
  before execution (parse error, JeJ violation, formatting gate); `ast`
  is `null` in those cases too.

### Lazy startup pipeline

On the first `.next()` call (or first `.result` access), the
generator body runs three phases in order. The `createInterceptGenerator(...)` call
itself returns cheaply — no work happens until a consumer pulls.

1. **Termination fast-path** — if `.cancel()` or `.fail(reason)`
   fired before any iteration, return a settled InterceptResult
   (`{ok:true, outcome:'cancel', events:[]}` or
   `{ok:true, outcome:'fail', reason, events:[]}`) and skip everything
   else. Worker is never spawned.
2. **Validation gate** — `validateProgram(code, justEnoughJs)` runs
   acorn parse and walks the AST against the JeJ language allow-list.
   Returns a `ValidationReport` carrying the parsed AST on success:
   - Parse failure: `error: {kind:'parse', line, column, ...}`
   - JeJ violations: `error: {kind:'validation', violations:[...]}`
   - Pass: AST returned for use by steps 3 and 4.
3. **Build LocationIndex** — `buildLocationIndex(ast, code)` walks
   the parsed Program once, producing the `astByPath` record (every
   AST node by nodePath) plus position lookups for the residual
   error path. Pure, deterministic; the result is reused by the link
   layer and the residual `extractPositionFromError` fallback.
4. **Instrument** — `wrapCallExpressions(ast, code)` rewrites every
   CallExpression as `__$ic('<nodePath>', () => <originalCall>)`
   in-place (string-splice; lines preserved 1:1). The rewritten
   source is what gets sent to the worker via `execute`.
5. **Format gate** — `checkFormat(code)` verifies the original
   source (not the instrumented one) matches the fixed recast
   output. Unformatted code → `{ok:false, error:{kind:'formatting'}}`.
   No runtime error is produced here; unformatted code is valid
   JavaScript — the gate is a learning constraint, not a correctness
   check.
6. **Execute** — only reached when all prior steps pass. Worker is
   spawned with `__$ic` + the trapped IO globals as `new Function`
   parameters. The generator body streams events until completion,
   cancel, or timeout.

#### Input-boundary behavior

- **Non-string `code`** — TypeScript types require `code: string`. A
  non-string input reaches `validateProgram(code, justEnoughJs)` and
  (depending on the value) produces a `SyntaxError`-shaped parse-failure
  InterceptResult via the acorn path, or is wrapped as a creation-phase
  `ErrorEvent` if validation throws unexpectedly. The engine does not
  sync-throw at the `createInterceptGenerator(...)` call boundary.
- **Non-object `options`** — TypeScript types require the options
  parameter shape; a non-object runtime value produces undefined
  destructure reads (`options?.seconds` → `undefined`), which apply
  defaults. No error. This is intentional: the engine is lenient at
  the options boundary for ergonomics.
- **`validateProgram()` / `checkFormat()` unexpected throws** — both are
  specified to return values, never throw. Any throw is an engine
  bug; it is caught inside the generator body and surfaced as a
  creation-phase `ErrorEvent` InterceptResult rather than escaping to the
  consumer. Iteration still resolves cleanly with `done:true`.

### Consumption modes

```ts
// 1. Iterate events
const handle = createInterceptGenerator(code);
for await (const event of handle) render(event);

// 2. Await the result, no event iteration
const result = await createInterceptGenerator(code);
// equivalent:
const result = await createInterceptGenerator(code).result;

// 3. Mix iteration with cancel
const handle = createInterceptGenerator(code);
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

- **Before first iterate:** sets the termination cause. First `.next()`
  sees it, returns a settled InterceptResult (`outcome:'cancel'`, empty
  events) without constructing the Worker. Zero resource leak.
- **During iteration:** pushes a sentinel into the internal queue,
  unsticks the pending `await dequeue()`, main loop's termination
  check breaks out, finally block terminates the Worker and revokes
  the Blob URL. The final InterceptResult is
  `{ok: true, outcome: 'cancel', events: [...firedEvents]}`. Events
  contain only worker-emitted ones — no synthetic cancel marker.
- **After completion:** no-op.

Consumers check the first-class `outcome` field:

```ts
const result = await createInterceptGenerator(code);
const wasCancelled = result.outcome === 'cancel';
```

Cancel is not an error — it did not originate in the learner's
program. The InterceptResult stays `ok: true`; `outcome: 'cancel'` is the
signal.

**`break` inside a live `for await` is equivalent to calling
`.cancel()`** — the runtime's implicit `gen.return()` is intercepted
and routed through the same cancel path, producing the same
`outcome: 'cancel'` and the same replay semantics. Consumers can
`break` out of the iteration loop safely; there is no "lost replay"
footgun:

```ts
const handle = createInterceptGenerator(code);
for await (const event of handle) {
    if (shouldStop(event)) break;   // same outcome as handle.cancel()
}
const result = await handle;  // settled with outcome: 'cancel'
for await (const event of handle) render(event);  // replay works
```

## Fail — consumer-driven structured termination

`.fail(reason?)` stops the run and attaches a structured rejection
payload to the InterceptResult. It serves consumer use cases that
`.cancel()` can't — specifically, teaching harnesses that need to
record WHY the run was stopped:

```ts
const handle = createInterceptGenerator(code);
for await (const event of handle) {
    if (event.event === 'console' && isWrongPrediction(event)) {
        handle.fail({
            kind: 'prediction-wrong',
            expected: 42,
            got: event.args[0],
        });
        break;
    }
}
const result = await handle;
// result.outcome === 'fail'
// result.reason === { kind: 'prediction-wrong', expected: 42, got: 43 }
```

`.fail()` is idempotent and first-write-wins with `.cancel()` /
timeout / worker-error: whichever termination entry point reaches
`setTermination` first wins. Calling `.fail()` after `.cancel()`
(or vice versa) is a no-op.

`reason` is stored by reference — not cloned, not separately
frozen. The same object the consumer passed is what appears on
`result.reason`, and the reference is replay-stable.

Like cancel, `.fail()` is NOT an error — it's consumer-driven
termination, classified as `ok: true, outcome: 'fail'`. If the
consumer needs the run to be classified as an error instead, they
should let the learner's code throw naturally and check
`result.outcome === 'error'`.

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

`.result` is a memoized `Promise<InterceptResult>` that drives the generator
to completion. First access creates the Promise; subsequent accesses
return the same Promise. `await createInterceptGenerator(code)` is equivalent.

```ts
const result = await createInterceptGenerator(code);
if (result.ok) {
  console.log('events:', result.events);
} else {
  console.log('error:', result.error);
}
```

The Promise resolves with the same InterceptResult the generator would have
produced via manual iteration. Errors inside the worker (uncaught
`TypeError` etc.) surface as `{ok: false, error: ...}` — they are NOT
thrown from `.result`. The only way `.result` rejects is if the main-
thread code itself throws (unreachable under current code).

## Outcome

Every InterceptResult carries a required `outcome` field classifying how
the run ended. Six variants, exhaustively switchable in TypeScript:

```ts
const result = await createInterceptGenerator(code);
switch (result.outcome) {
    case 'complete':         // learner code reached its natural end
    case 'cancel':           // consumer stopped via .cancel() or break
    case 'fail':             // consumer stopped via .fail(reason)
    case 'timeout':          // seconds budget exhausted
    case 'iteration-limit':  // a guarded loop exceeded its cap
    case 'error':            // learner code threw or gate failed
    // no default — TypeScript exhaustiveness covers every case
}
```

`ok` is a derived convenience flag. `complete | cancel | fail` →
`ok:true`; `timeout | iteration-limit | error` → `ok:false`. Use
`outcome` for fine-grained discrimination; `ok` remains the gate on
`result.error` presence (errors only exist on `ok:false`).

On `outcome: 'fail'` the InterceptResult also carries `reason` — the
payload passed to `.fail(reason)`. Not cloned, not separately
frozen; the reference is replay-stable.

`events` is a pure worker-emitted event stream. It does NOT carry
synthetic termination markers. Consumers inspecting `events.at(-1)`
for a `{event:'cancel'}` sentinel will find only the real final
event (or nothing if no events were emitted). Use `result.outcome`
for termination classification.

## Replay / re-iteration

Once a run completes — successfully, via a thrown error, or via
`.cancel()` — a second `for await` over the same handle replays the
events from the result's `events` array. No re-execution; no Worker
respawn.

```ts
const handle = createInterceptGenerator(code);
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
event into an internal `events` array using the exact reference the
consumer sees — no clone. `deepFreezeInPlace` freezes the final
InterceptResult (including the `events` array) in place; identity survives.

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
createInterceptGenerator(code, {
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
to resolve. The timer pauses during each callback await so consumer
UI interactions (custom dialogs, typewriter animations) do not count
against the runtime budget — only the flat 5 ms per-yield charge
applies, regardless of how long the modal stays open.

## Trapped globals

All traps are always defined in the worker — there is no
config-driven trap selection. Which implementation fires on the main
thread is determined by the Resolved IO table.

| Global               | Event produced                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `console.*` (all 19) | `ConsoleEvent` — method, args, nodePath, nodePathSource, node, loc, callee, calleePath, prev, next, step         |
| `alert`              | `AlertEvent` — args, nodePath, nodePathSource, node, loc, callee, calleePath, prev, next, step                   |
| `confirm`            | `ConfirmEvent` — args, return value, nodePath, nodePathSource, node, loc, callee, calleePath, prev, next, step   |
| `prompt`             | `PromptEvent` — args, return value, nodePath, nodePathSource, node, loc, callee, calleePath, prev, next, step    |

Every event carries a 1-indexed `step` field giving its position in the
global event stream — `result.events[i].step === i + 1`. After AST
entwining, the same `step` value appears on each AST node's
`events[]` back-refs, so `result.ast[nodePath].events[j].step` reveals
exactly when in the run that fire occurred without rescanning
`result.events`.

Every event also carries `nodePath` (the firing CallExpression's AST
path), `nodePathSource` (`'instrumented'` for the happy path,
`'enclosing-fallback'` for residual errors outside any wrapped call,
`'no-ast'` when validation failed before parsing), `loc` (the AST
node's `SourceLocation` — same reference as `event.node.loc` after
entwining), `node` (a direct reference into `result.ast`), and the
callee accessors `callee` / `calleePath` (the function-reference
subnode of `event.node` — `Identifier` for `prompt`/`alert`/`confirm`,
`MemberExpression` for `console.X` — useful when an editor wants to
underline only the function reference rather than the full call
expression). `callee` is the same object as `event.node.callee` —
single source of truth, no copy. Each event also carries `prev` and
`next` references to its neighbors in the global timeline, forming a
doubly-linked list — walk `event.next.next…` forward or
`event.prev.prev…` backward without indexing through `result.events`.
`prev` is captured at insert time (reference-stable); `next` is backed
by an accessor that returns `null` until the next event arrives, then
the next event reference (events are `Object.freeze`-immutable from
yield time, but the backing closure state mutates). No `line` or
`column` fields on trap events — read `event.loc.start.line` or
`event.loc.start.column` for those integer values. See
[DOCS.md § Navigation](DOCS.md#navigation)
for the full event ↔ node ↔ ast traversal graph; [DOCS.md § Ubiquitous
Language and Data flow](DOCS.md) covers the underlying mechanism.

The 19 trapped `console` methods: `log`, `debug`, `info`, `warn`,
`error`, `assert`, `table`, `dir`, `dirxml`, `group`, `groupCollapsed`,
`groupEnd`, `count`, `countReset`, `time`, `timeEnd`, `timeLog`,
`trace`, `clear`. (`console.trace` is the stack-trace dumper, not our
semantic trace engine — different namespace, no conflict.)

## How it works

> Pipeline expanded from the prior 12 steps to 17 with the addition of the
> instrumentation phase (steps 3–4) — the pre-execution AST walk that wraps
> every CallExpression so trap functions can read the firing nodePath without
> parsing `Error.stack`. See [DOCS.md § Data flow](DOCS.md) for the canonical
> diagram and [§ Ubiquitous Language](DOCS.md) for the wrap/trap vocabulary.

1. Build the **Resolved IO** table from `options.io` + Native IO wrappers.
2. **Validate** the source (parse + JeJ allow-list check). On failure, return early with `outcome: 'error'` and an `error.kind` payload (`'parse'` or `'validation'`).
3. **Build the LocationIndex** from the parsed Program (every AST node by nodePath, plus position lookups for the residual error path).
4. **Instrument** the source via `wrapCallExpressions(program, code)`: every `CallExpression` in the user's code is rewritten to `__$ic('<nodePath>', () => <originalCall>)`. The `__$ic` helper is injected into the worker as a `new Function` parameter; it pushes/pops a `__currentPath` slot around each call so trap functions can read the firing site directly. Lines preserved 1:1.
5. Run **format check** on the original source (rejection → early return).
6. If `options.iterations` is set, inject body-injection loop guards into `while`, `for`, `do-while`, and `for-of` loops via string offset splice (zero line shift). See `guard-loops/`.
7. Create a SharedArrayBuffer for synchronous IO and pause protocol.
8. Generate a self-contained worker script with `__$ic` + trapped globals + pause logic.
9. Send a **setup** message (delivers SAB; worker defines traps and `__$ic`).
10. Send an **execute** message (delivers instrumented learner code).
11. Worker runs user code. Each `__$ic` wrap pushes its `nodePath` onto `__currentPath` before invoking the call thunk; trap functions read `__currentPath` to know their firing site.
12. Worker posts each event, then pauses via `Atomics.wait` on the pause flag.
13. Generator `next()` resumes the worker via `Atomics.notify` — yields one event to the consumer.
14. Handle `io-request` by awaiting `resolvedIo.{prompt|alert|confirm}` and writing the response to the SAB; on throw, surface `ErrorEvent` with `name: 'InternalError'` and terminate.
15. Handle console events by awaiting `resolvedIo.console[method]` (if any) before yielding; on throw, same `InternalError` path.
16. Timeout tracks user-perceived runtime: paused while yielded AND while awaiting any IO callback, plus a flat 5 ms per-yield charge so rendering-bound loops still deplete the budget.
17. Return frozen `InterceptResult` on completion, timeout, or iteration limit. Events are already linked to AST nodes (set inline by `enrichEvent` as each event arrives, before yield).

## Key design decisions

- **Resolved IO table**: consumer-provided mocks are merged with
  Native IO wrappers at invocation time. The worker is unaware — it
  sees the same event-emission path regardless. This is what gives
  us the shape-identical guarantee.
- **AsyncGenerator**: yields events one at a time with SAB pause
  between each. Enables live streaming to UI and step-through
  consumption. The handle itself is `PromiseLike` so `await createInterceptGenerator(code)`
  works without iterating — no separate wrapper.
- **Body-injection loop guards**: `{ if (++loop1 > max) throw ...; }
  loop1 = 0;` — zero line shift, zero column shift. Covers `while`,
  `for`, `do-while`, and `for-of`; `for-in` is deliberately excluded
  (not in JeJ surface). Counter globals declared in worker setup via
  `var loop1 = 0, ..., loopN = 0;` — not per-loop inline declarations.
  See `guard-loops/DOCS.md` for the body-injection architecture.
- **User-perceived runtime budget**: pauses during SAB wait AND
  during IO-callback await so learners can examine events — or
  drive a styled dialog — without burning duration. Each event
  yield deducts a flat 5 ms charge, rounded up so the timeout
  fires at-or-before the wall-clock budget on busy loops. See
  DOCS.md § Timer-vs-yield.
- **Errors are events**: runtime errors (`phase: 'execution'`) and
  construction errors (`phase: 'creation'`) appear in the events
  array. The consumer always gets `LinkedInterceptEvent[]`, never a thrown
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

If SAB is unavailable, `createInterceptGenerator` returns a single `ErrorEvent` with
`name: 'EnvironmentError'` rather than throwing.

## Sandbox

To test interactively, start the Vite dev server from the project
root:

```sh
npx vite --config src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/intercept/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
