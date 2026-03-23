# api

Unified wrappers for validating and executing Just Enough JavaScript programs.

Each wrapper validates code against the full JeJ language level, then executes it
in the appropriate environment. All four functions return a frozen result object
with the same base shape.

## Functions

- **`validate(code)`** — validation only, no execution. Also serves as the
  shared preamble for the other three.
- **`run(code, maxSeconds)`** — executes in a Web Worker with trapped globals.
  Returns an event log.
- **`trace(code, maxSeconds, options?)`** — traces execution with Aran
  instrumentation. Returns step-by-step trace data.
- **`debug(code, maxIterations)`** — runs in an iframe with `debugger`
  statements. Returns captured error info (if any).

## Result Shape

All functions return `{ ok, error?, rejections?, warnings? }` plus a
mode-specific field (`logs` for run, `steps` for trace, none for debug).

Consumers check `result.ok` first, then inspect `rejections` (language level
feedback) or `error` (parse/runtime/limit failures) for details.

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [types.ts](./types.ts) — result type definitions
- [../verify-language-level/](../verify-language-level/) — the validation
  pipeline these wrappers build on
- [../evaluating/](../evaluating/) — the raw execution engines these wrappers
  delegate to
