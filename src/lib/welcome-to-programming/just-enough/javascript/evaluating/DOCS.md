# evaluating — Architecture & Decisions

## Why three separate engines

Each engine serves a different pedagogical use case with a fundamentally different
isolation model and output type:

- **run** uses a Web Worker because it needs timeout safety (`worker.terminate()`)
  and synchronous I/O traps (SAB+Atomics for `prompt`/`confirm`/`alert`). Returns
  an event log — the consumer builds UI from logged events.

- **debug** uses an iframe because `debugger` statements only pause execution when
  DevTools is open on the main thread — workers have no DevTools access. Returns
  only error info (if any) — the debugging happens interactively in DevTools.

- **trace** uses a Web Worker with Aran AST instrumentation to capture every
  expression, variable access, and control-flow step. Returns structured
  `AranStep[]` for visualization. Uses a Vite-bundled module worker (not blob URL)
  because the Aran tracer is ~500KB of ESM code.

## Shared contract

All engines follow the same contract:

1. Receive already-validated code (validation is the `api/` layer's job)
2. Execute in isolation (worker or iframe — never on the main thread)
3. Return frozen results (deep-frozen in place before returning)
4. Never throw — errors are captured and returned as data

## Why no unified "execute" function

The output types are fundamentally different (`RunEvent[]` vs `AranStep[]` vs
nothing). A unified function would require either a discriminated union that
consumers must narrow, or runtime type checks — both worse than separate
well-typed functions.

## How `shared/` is consumed

`shared/types.ts` defines the types used across engines: `AllowConfig`,
`RunEvent`, `RunConfig`, `TraceConfig`, `DebugConfig`. Each engine imports only
what it needs. `shared/allow-schema.ts` provides JSON Schema validation for
allow/block configuration.
