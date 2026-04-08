# evaluating

Raw execution engines for running JeJ code in sandboxed environments. Each engine
receives already-validated, formatted code and yields events via an AsyncGenerator.
None of these modules perform validation, format checking, or language-level
enforcement — that belongs in `api/`.

## Structure

| Directory | Isolation Model | Events       | Purpose                                        |
| --------- | --------------- | ------------ | ---------------------------------------------- |
| `run/`    | Web Worker      | `RunEvent`   | Execute with trapped globals, event logging    |
| `debug/`  | iframe          | `DebugEvent` | Debugger breakpoints, loop guards              |
| `trace/`  | Web Worker      | `AranStep`   | Aran AST instrumentation, step-by-step trace   |
| `shared/` | —               | —            | Execution type, SAB pause, guard-loops, config |

## Shared infrastructure

`shared/` provides the foundation all engines build on:

- **`Execution` type** — `AsyncIterable<TEvent> & PromiseLike<TResult>` with
  `.result` Promise and `.cancel()`
- **`createExecution` factory** — wraps an async generator into an `Execution`
  object with PromiseLike backward compatibility
- **SAB pause protocol** — Worker pauses between events so the consumer controls
  pacing (run and trace only; debug uses no Worker)
- **`guard-loops/`** — loop guard injection to prevent infinite loops (used by
  run with comma-in-condition strategy, debug with body-injection strategy)

## Navigation

- [run/README.md](./run/README.md) — Web Worker execution engine
- [debug/README.md](./debug/README.md) — iframe + debugger engine
- [trace/README.md](./trace/README.md) — Aran tracer module
- [shared/README.md](./shared/README.md) — shared types, Execution, SAB protocol
- [DOCS.md](./DOCS.md) — design decisions and cross-engine patterns
