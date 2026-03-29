# just-enough-javascript

Validates learner JavaScript against a pedagogical language subset ("Just Enough
JavaScript") and executes it in sandboxed environments. Provides validation,
formatting, and three execution modes (run, trace, debug) — all through a
unified API with a code object factory as the default export.

## Structure

| Path            | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `api/`          | Public API — validate, format, run, trace, debug           |
| `evaluating/`   | Raw execution engines (Web Worker, iframe, Aran)           |
| `validating/`   | AST-based validation pipeline and language level def       |
| `formatting/`   | Recast-based formatting and format checking                |
| `reference.md`  | Learner-facing cheat sheet of allowed language             |
| `index.ts`      | Package entry — re-exports all API functions               |

## Public API

```ts
import jej, { run, trace, debug, validate, isJej, format, checkFormat } from './index.js';
```

### Tooling functions

| Function            | Returns         | What it does                            |
| ------------------- | --------------- | --------------------------------------- |
| `format(code)`      | `string`        | Recast formatting (any valid JS)        |
| `checkFormat(code)` | `{ formatted }` | Check if code matches recast output     |
| `validate(code)`    | `BaseResult`    | Validation only — rejections            |
| `isJej(code)`       | `boolean`       | Convenience: is this valid JeJ?         |

### Execution functions

| Function              | Returns                              | Engine      |
| --------------------- | ------------------------------------ | ----------- |
| `run(code, config)`   | `Execution<RunEvent, RunResult>`     | Web Worker  |
| `trace(code, config)` | `Execution<AranStep, TraceResult>`   | Aran Worker |
| `debug(code, config)` | `Execution<DebugEvent, DebugResult>` | iframe      |

### Code object factory (default export)

```ts
const program = jej('let x = 5;\n');
program.ok;          // true
program.rejections;  // []
program.isFormatted; // true
```

## Result Shape

All execution results share a common base:

```ts
type Result<TEvent> = {
  readonly ok: boolean;
  readonly error?: ResultError;
  readonly rejections?: readonly Violation[];
  readonly logs?: readonly TEvent[];
};
```

## Navigation

- [api/README.md](./api/README.md) — API functions and code object
- [evaluating/README.md](./evaluating/README.md) — execution engines
- [validating/README.md](./validating/README.md) — validation pipeline
- [formatting/README.md](./formatting/README.md) — recast formatting
- [DOCS.md](./DOCS.md) — architecture decisions and design rationale
- [reference.md](./reference.md) — learner-facing language reference
