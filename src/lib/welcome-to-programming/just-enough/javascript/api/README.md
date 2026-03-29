# api

Public API for the Just Enough JavaScript library. Provides standalone functions
for validation, formatting, and execution, plus a code object factory as the
default export.

## Execution Pipeline

Every execution function runs the same pipeline before evaluating code:

```text
1. parse          → { ok: false, error: { kind: 'parse' } }          → return
2. validate (JeJ) → { ok: false, rejections: [...] }                 → return
3. format check   → { ok: false, error: { kind: 'formatting' } }     → return
4. execute        → { ok: false, error: { kind: 'javascript'|... } }
                  → { ok: true, logs: [...] }                        → return
```

Each function uses the pipeline up to a different point:

| Function            | Parse | JeJ    | Format  | Execute |
| ------------------- | ----- | ------ | ------- | ------- |
| `format(code)`      | yes   | no     | formats | no      |
| `checkFormat(code)` | yes   | no     | checks  | no      |
| `validate(code)`    | yes   | checks | no      | no      |
| `run/trace/debug`   | yes   | gate   | gate    | yes     |

## Functions

### Tooling (help you get to valid formatted JeJ)

- **`format(code)`** — Recast prettyPrint wrapper. Works on any valid JS, not
  just JeJ. Returns formatted code. Synchronous.
- **`checkFormat(code)`** — returns `{ formatted: boolean }`.
- **`validate(code)`** — validation only, no execution. Returns rejections.

### Execution (require valid formatted JeJ)

- **`run(code, config)`** — Web Worker with trapped globals. Returns
  `Execution<RunEvent, RunResult>`.
- **`trace(code, config)`** — Aran instrumentation in Worker. Returns
  `Execution<AranStep, TraceResult>`. Config accepts optional `options` for
  trace granularity.
- **`debug(code, config)`** — iframe with `debugger` statements. Returns
  `Execution<DebugEvent, DebugResult>`.

### Code Object Factory (default export)

- **`createJejProgram(code?)`** — live analysis dashboard. Construction always
  succeeds. Properties reflect the pipeline state. `.ok` gates execution methods.

## Execution Type

All execution functions return `Execution<TEvent, TResult>`:

```ts
type Execution<TEvent, TResult> =
  AsyncIterable<TEvent>
  & PromiseLike<TResult>
  & {
    readonly result: Promise<TResult>;
    readonly cancel: () => void;
  };
```

- `for await (const event of execution)` — step through events with SAB pause
- `await execution` — PromiseLike drains generator, resolves to result
- `await execution.result` — same Promise
- Second `for await` replays from cached `result.logs`

## Result Shape

All results share a common base:

```ts
type Result<TEvent> = {
  readonly ok: boolean;
  readonly error?: ResultError;
  readonly rejections?: readonly Violation[];
  readonly logs?: readonly TEvent[];
};
```

## Structure

| File              | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `run.ts`          | Run execution wrapper                                 |
| `trace.ts`        | Trace execution wrapper                               |
| `debug.ts`        | Debug execution wrapper                               |
| `validate.ts`     | Validation wrapper                                    |
| `format.ts`       | Format and checkFormat re-exports                     |
| `default.ts`      | Code object factory (`createJejProgram`)              |
| `types.ts`        | Result type definitions                               |
| `tests/`          | Unit tests                                            |

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [types.ts](./types.ts) — result type definitions
- [../validating/](../validating/) — the validation pipeline
- [../formatting/](../formatting/) — recast formatting and format checking
- [../evaluating/](../evaluating/) — the raw execution engines
