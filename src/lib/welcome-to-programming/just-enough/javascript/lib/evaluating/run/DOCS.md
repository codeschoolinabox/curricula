# evaluating/run — Architecture & Decisions

## Why an AsyncGenerator

The run engine needs to produce events incrementally for live UI rendering while
supporting batch consumption for backward compatibility. An async generator lets
the consumer pull events one at a time (`for await`) or drain all at once
(`await`). The generator is wrapped by `createExecution` at the `api/` layer to
add PromiseLike behavior.

The generator pauses the Worker between events using the SAB pause protocol
(see `evaluating/shared/DOCS.md`). This guarantees events are delivered in
correct order relative to I/O — log events appear before prompt dialogs.

## Why comma-in-condition loop guards

When `config.iterations` is set, the run engine injects loop guards into while
loop conditions using the comma operator:

```js
// before:                          // after:
while (x < 10) {                   while (++loop1 > 100 && guard(1), x < 10) {
```

### Why this approach (not body injection)

Body injection (`let loop1 = 0;` before the loop + `if (++loop1 > max) throw`
inside) shifts line numbers — the `let` declaration adds a line, making error
messages report wrong line numbers. The comma-in-condition approach adds no
lines.

### How it works

1. Counter variables (`loop1`, `loop2`, ...) are declared as globals in the
   Worker setup script, not per-loop. This avoids adding lines to the learner's
   code.
2. A `guard(id)` function is also declared in setup — it throws a `RangeError`
   with loop ID and limit info.
3. AST transformation (via recast) rewrites each while condition: the original
   condition becomes the right operand of a comma expression. The left operand
   is `++loopN > max && guard(N)`.
4. The comma operator evaluates left-to-right and returns the rightmost value —
   so the loop condition still evaluates to the original boolean.
5. If `++loopN > max` is true, `guard(N)` is called (short-circuit `&&`) and
   throws. If false, the guard is skipped and the original condition evaluates.

### Why recast (not regex)

Regex-based rewriting would break on multi-line conditions, nested loops, or
conditions containing string literals with `while` in them. Recast parses the
AST, replaces the condition node, and prints back — preserving the learner's
formatting exactly.

## Resolved IO table

When a run begins, the engine merges consumer-provided mocks with Native IO
wrappers into a single `resolvedIo` object:

```ts
resolvedIo = {
  prompt:  options.io?.prompt  ?? nativePrompt,
  alert:   options.io?.alert   ?? nativeAlert,
  confirm: options.io?.confirm ?? nativeConfirm,
  console: {
    log:   options.io?.console?.log   ?? nativeConsoleLog,
    // ... all 19 methods
  },
}
```

Slot-by-slot — not all-or-nothing. Consumer overrides one key; the rest stay
native. The worker is unaware of which slots are mocked vs. native — it always
sees the same event-emission path. This is what gives us the shape-identical
guarantee (sequence, event tags, and `args` structure preserved).

### IO execution model (unified)

ALL IO hooks hold learner execution until the callback completes. There is no
fire-and-forget category:

- **Dialog hooks** (`prompt`, `alert`, `confirm`): worker blocks on SAB
  `Atomics.wait`. Main thread awaits the callback, writes the response to the
  SAB response slot, then calls `Atomics.notify`. Worker reads response and
  continues.
- **Console hooks** (all 19 methods): worker blocks on the SAB pause flag
  (same mechanism used between every event). Main thread awaits the console
  callback, yields the `ConsoleEvent`, and on the consumer's next `next()` call,
  releases the pause. No response-slot write is needed (console hooks return
  `void`; nothing is delivered back to the worker).

The net effect: learner code does not proceed past any IO call until the
callback completes, whether native or mocked.

### Mock error handling

Native IO hooks do not throw. If a consumer-provided mock throws (sync or async
rejection), the main-thread catch path surfaces an `ErrorEvent` with
`name: 'InternalError'`. The worker is terminated. The learner sees an internal
error, not an exception from their own code. This is the only circumstance where
an IO callback's exception reaches the learner's event stream.

## Why cumulative timeout (not wall-clock)

Timeout tracks execution time only. The timer pauses:

- While the worker is blocked on the SAB pause flag (waiting for the consumer's
  `next()` call)
- While the main thread is awaiting any IO callback (dialog or console)

When execution resumes, `setTimeout(remainingMs)` restarts.

This means a learner stepping through events in the UI can take as long as they
want — only actual code execution counts toward the limit. Without this, a
learner examining step 3 of 100 could trigger a timeout while doing nothing. The
same applies to styled dialogs: a consumer-provided `prompt` mock showing a
custom modal does not count against the learner's execution time budget.

## Why a Web Worker

The worker provides two things: **timeout control** and **sandboxing**. An
iframe cannot be forcibly stopped mid-execution — `worker.terminate()` can.
Learner code with infinite loops or long-running operations must be killable
after `maxSeconds`. The worker also isolates learner code from the main thread's
DOM and globals.

## Why two-step protocol

The worker receives two messages: **setup** (SAB + trap definitions) and
**execute** (learner code). This separation exists for line number accuracy.

If trap definition code were prepended to the learner's source string, every
line number in error messages and stack traces would be offset by the preamble
length. By defining traps in a separate setup phase, the learner's code starts
at line 1 when wrapped in `new Function`.

The `"use strict"` prefix inside `new Function` adds exactly 1 line of offset,
which is a known constant that the line extraction logic subtracts.

**Invariant**: the setup message handler must be fully synchronous. Worker
message delivery is ordered, so `execute` is dequeued only after `setup`
completes — but only if `setup` does not yield (no `await`, no dynamic
`import()`). If a future change adds async work to setup, the protocol
must add a `setup-ready` acknowledgment message.

## SharedArrayBuffer protocol

Workers cannot call `prompt()`/`confirm()`/`alert()` natively. To provide
synchronous I/O from the learner's perspective, the worker blocks on a
SharedArrayBuffer while the main thread shows native browser dialogs.

### Why SAB+Atomics (alternatives explored)

The only two practical approaches to synchronous worker↔main communication are:

1. **SAB+Atomics** — worker blocks via `Atomics.wait`, main thread responds via
   `Atomics.notify`. Requires COOP/COEP headers.
2. **Sync XHR + ServiceWorker** — worker makes a synchronous `XMLHttpRequest`
   to a ServiceWorker-intercepted URL, which holds the request until the main
   thread provides the response. No header requirement, but adds ServiceWorker
   registration complexity and its own deployment constraints.

Everything else (postMessage, BroadcastChannel, Comlink) is asynchronous and
cannot block the worker. WASM shared memory is SAB under the hood (same header
requirement). There is no zero-cost synchronous path.

SAB+Atomics was chosen because it is simpler, more reliable, and the COOP/COEP
requirement is the hosting platform's concern — not this package's.

### I/O flow — dialog hooks (prompt/alert/confirm)

1. Worker encounters `prompt("name")` via trapped global
2. Worker posts `io-request` message to main thread
3. Worker sets control signal to `1` (waiting) and calls `Atomics.wait`
4. Main thread receives message, awaits `resolvedIo.prompt("name", undefined)`
   (native browser dialog or consumer mock — both awaited the same way)
5. Main thread writes response to buffer, sets signal to `2`, calls
   `Atomics.notify`; on callback throw, surfaces `ErrorEvent { name:
   'InternalError' }` and terminates worker
6. Worker unblocks, reads response, resets signal to `0`
7. Trapped `prompt` returns the value to the learner's code

### I/O flow — console hooks

1. Worker calls (e.g.) `console.log("hello")` via trapped global
2. Worker posts `event` message (ConsoleEvent) to main thread
3. Worker blocks on the SAB pause flag (`Atomics.wait` on pause slot)
4. Main thread receives event, **pauses the cumulative timer**, then awaits
   `resolvedIo.console.log("hello")` (native console or consumer mock)
5. Timer restarts; on callback throw, surfaces `ErrorEvent { name:
   'InternalError' }` and terminates worker
6. Main thread yields the `ConsoleEvent` to the generator consumer
7. Consumer calls `next()` → main thread releases pause (`Atomics.notify`)
8. Worker unblocks and continues execution

Console hooks use the existing SAB pause mechanism (the same pause used between
every event). No response-slot write is needed — nothing is delivered back to
the worker. The cumulative timer is explicitly paused (step 4) and restarted
(step 5) so that slow consumer mocks (typewriter animations, network calls, etc.)
do not count against the learner's execution time budget.

### COOP/COEP requirement

SharedArrayBuffer requires these HTTP headers on the hosting page:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

This is the hosting site's responsibility. If SAB is unavailable, `run` returns
an `EnvironmentError` event rather than throwing.

## Why errors are events

Throwing exceptions forces consumers into try-catch patterns and loses partial
results (e.g., logs before the error). Returning errors as events in the array
means:

- Consumer always gets `RunEvent[]` back
- Partial results (logs before a crash) are preserved
- Construction errors and runtime errors use the same interface
- `phase: 'creation'` vs `'execution'` distinguishes when the error occurred

## Why all traps are always defined

Traps are not config-driven. Every run defines all 19 standard console methods,
alert, confirm, and prompt — regardless of what the future allow/block config
says. The allow/block config controls **static validation** (which AST nodes are
permitted), not which traps exist at runtime.

This keeps the worker script static and simple. Config-driven trap selection
would add conditional logic to the worker script string for no clear benefit —
if a learner's code calls `prompt()` but prompt is not in the allow config, the
static validator catches it before `run` is ever called.

## Why no runtime enforcement

Earlier designs included an `enforceLevel` step that blocked unauthorized
globals and prototype methods via property descriptors on the worker's
`globalThis`. This was removed because static validation via
`validating/` catches all disallowed constructs at the AST level
before execution. Runtime enforcement was belt-and-suspenders complexity with no
practical benefit at this language level.

## Line tracking

Each trap function uses `new Error().stack` to extract the source line relative
to the user code offset. The `new Function` wrapper with `"use strict"` prefix
means user code starts at line 2 — the extraction logic subtracts 1.

This is browser-dependent. Chrome, Firefox, and Safari format `Error.stack`
differently. The line number in `RunEvent` is best-effort — correct in common
cases, possibly wrong for edge cases like multi-line expressions.

### scriptMode

The `execute` message accepts an optional `scriptMode` flag (see
`types.ts`'s `ExecuteMessage`). When true, the worker omits the
`"use strict";\n` prefix in front of user code. This is needed for
constructs that strict mode forbids — most notably the `with`
statement, which some legacy/teaching examples use.

Because scriptMode removes the prefix line, user code starts at line
**1** instead of line 2. `getLine()` branches on `isScriptMode`:
return the raw stack line number directly when `scriptMode` is true,
or subtract 1 when it's false. Same branch exists in
`extractLineFromError` for uncaught runtime errors.

scriptMode is a worker-side setup concern only — the main thread
never needs to know. Consumers who pass `scriptMode: true` get line
numbers that match their source 1:1.

## Why new Function instead of eval

`new Function('console', 'alert', 'confirm', 'prompt', code)` provides argument
shadowing — the trapped functions are passed as arguments, cleanly overriding
globals without property descriptor manipulation. This is simpler and more
reliable than patching `globalThis` for these specific APIs.

## Structured clone safety

Trap arguments pass through `postMessage`, which uses the structured clone
algorithm. Most JeJ values (strings, numbers, booleans, null, undefined, arrays)
clone without issue. If a learner somehow passes a function or symbol to
`console.log`, structured clone would throw. The traps catch this and fall back
to string serialization for uncloneable arguments.

## Worker script duplication

The worker runs from a Blob URL and cannot import modules. The SAB read-side
protocol (wait for signal, read response, reset) must be inlined in the
generated worker script string. This means some logic exists in both
`worker-protocol.ts` (typed, importable, used by main thread) and the worker
script string (plain JS, used by worker). This duplication is intentional —
the alternative (bundling or dynamic imports in workers) adds complexity that
is not justified for this amount of code.

## Why console routing goes through Resolved IO

Console calls are routed through `resolvedIo.console[method]` for the same
reason dialog calls are routed through `resolvedIo.prompt/alert/confirm` — the
Native IO wrapper for each console method is just `window.console[method]`. The
consumer can replace it with a styled panel renderer, a typewriter animation, or
any other async function. Routing through the Resolved IO table is what provides
the shape-identical guarantee: whether native or mocked, the `ConsoleEvent` in
the stream looks identical. Event emission serves the UI/analysis layer; the
native wrapper serves authenticity when no mock is provided.

## What this module deliberately does NOT do

- **Validate source code** — that is `validating/`'s job, called by the wrapper
  above
- **Check formatting** — that is `formatting/`'s job (pipeline gate)
- **Resolve allow/block config** — that is `evaluating/shared`'s job
- **Enforce language level at runtime** — static validation is sufficient
- **Manage the worker script as a separate file** — Blob URL from string avoids
  bundler/path concerns
