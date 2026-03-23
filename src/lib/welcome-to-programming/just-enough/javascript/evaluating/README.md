# evaluating

Raw execution engines for running JeJ code in sandboxed environments. Each engine
receives already-validated code and returns a frozen result. None of these modules
perform validation or language-level enforcement — that belongs in `api/`.

## Structure

| Directory  | Isolation Model | Output          | Purpose                                      |
| ---------- | --------------- | --------------- | -------------------------------------------- |
| `run/`     | Web Worker      | `RunEvent[]`    | Execute with trapped globals, event logging  |
| `debug/`   | iframe          | (none)          | Debugger breakpoints, loop guards            |
| `trace/`   | Web Worker      | `AranStep[]`    | Aran AST instrumentation, step-by-step trace |
| `shared/`  | —               | —               | Types and schemas shared across all engines  |

## Navigation

- [run/README.md](./run/README.md) — Web Worker execution engine
- [debug/README.md](./debug/README.md) — iframe + debugger engine
- [trace/README.md](./trace/README.md) — Aran tracer module
- [shared/README.md](./shared/README.md) — shared types and schemas
- [DOCS.md](./DOCS.md) — design decisions and cross-engine patterns
