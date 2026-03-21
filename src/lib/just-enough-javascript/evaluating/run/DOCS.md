# evaluating/run — Architecture & Decisions

## SharedArrayBuffer protocol

Workers cannot call `prompt()`/`confirm()`/`alert()` natively. To provide
synchronous I/O from the learner's perspective, the worker blocks on a
SharedArrayBuffer while the main thread shows native browser dialogs.

### Flow

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

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

This is the hosting site's responsibility, not this package's. If SAB is
unavailable, `run` should detect this and return an error event rather than
silently failing.

## Why errors are events

Throwing exceptions forces consumers into try-catch patterns and loses partial
results (e.g., logs before the error). Returning errors as events in the array
means:

- Consumer always gets `RunEvent[]` back
- Partial results (logs before a crash) are preserved
- Validation errors and runtime errors use the same interface
- `phase: 'creation'` vs `'execution'` distinguishes when the error occurred

## Line tracking

Each trap function uses `new Error().stack` to extract the source line relative
to the user code offset. This is browser-dependent and may require fallbacks.
The line number in `RunEvent` is best-effort.

## Why new Function instead of eval

`new Function('console', 'alert', 'confirm', 'prompt', code)` provides argument
shadowing — the trapped functions are passed as arguments, cleanly overriding
globals without property descriptor manipulation. This is simpler and more
reliable than patching `globalThis` for these specific APIs.

For other enforcement (String.prototype methods, etc.), property descriptor
blocking via `enforceLevel` is still used on the worker's globalThis.
