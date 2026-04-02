# record — Architecture

## Pipeline

Code is instrumented on the main thread using Aran's standalone mode, then
executed in a disposable Web Worker. Events stream back via postMessage.

```text
api/trace.ts → createExecution(createTracingGenerator)
  → Execution<TraceEvent, TraceResult>
    createTracingGenerator:
      1. instrument(code, config)  — main thread: Aran standalone pipeline
      2. spawn worker via blob URL — same pattern as run engine
      3. worker registers advice on globalThis, evals instrumented code
      4. advice fires → emitEvent → state.onEvent → postMessage('entry')
      5. main thread yields TraceEvent per entry, pauses worker via SAB
      6. returns TraceResult on completion
```

## Key design decisions

- **Standalone mode**: Aran captures all builtins into a closure. Learner code
  can't break Aran internals (e.g., overwriting Array.prototype.push).
- **No post-processing**: Events are structured by advice functions at runtime.
  No regex parsing, no post-trace filtering. Config-time pointcuts control what
  gets instrumented.
- **onEvent via global callback**: Aran JSON-clones initialState (losing
  functions). The worker sets `globalThis.__jej_onEvent` before eval.
  block-setup (first hook) picks it up and sets `state.onEvent`. All
  subsequent hooks inherit it.
- **eval kind with strict situ**: JEJ programs are modules (strict mode), but
  the worker uses `new Function()` which can't handle `import.meta`. Aran's
  `kind: 'eval'` with `situ: { type: 'local', mode: 'strict' }` gives
  module-like semantics without `import.meta`.

## Files

- `index.ts` — re-export from `tracing/index.ts`
- `tracing/index.ts` — async generator (main export)
- `tracing/instrument.ts` — Aran instrumentation pipeline
- `tracing/trace-worker.ts` — worker module
- `tracing/weaving/` — pointcuts + advice functions
- `tracing/event-generators/` — event factory functions
- `tracing/types.ts` — TraceEvent type definitions
