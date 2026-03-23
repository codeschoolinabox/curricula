# evaluating/run — Architecture & Decisions

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

### I/O flow

1. Worker encounters `prompt("name")` via trapped global
2. Worker posts `io-request` message to main thread
3. Worker sets control signal to `1` (waiting) and calls `Atomics.wait`
4. Main thread receives message, shows native `prompt()` dialog
5. Main thread writes response to buffer, sets signal to `2`, calls
   `Atomics.notify`
6. Worker unblocks, reads response, resets signal to `0`
7. Trapped `prompt` returns the value to the learner's code

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

Traps are not config-driven. Every run defines console.log, console.assert,
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
`verify-language-level` catches all disallowed constructs at the AST level
before execution. Runtime enforcement was belt-and-suspenders complexity with no
practical benefit at this language level.

## Line tracking

Each trap function uses `new Error().stack` to extract the source line relative
to the user code offset. The `new Function` wrapper with `"use strict"` prefix
means user code starts at line 2 — the extraction logic subtracts 1.

This is browser-dependent. Chrome, Firefox, and Safari format `Error.stack`
differently. The line number in `RunEvent` is best-effort — correct in common
cases, possibly wrong for edge cases like multi-line expressions.

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

## What this module deliberately does NOT do

- **Validate source code** — that is `verify-language-level`'s job, called by
  the wrapper above
- **Resolve allow/block config** — that is `evaluating/shared`'s job
- **Enforce language level at runtime** — static validation is sufficient
- **Manage the worker script as a separate file** — Blob URL from string avoids
  bundler/path concerns
