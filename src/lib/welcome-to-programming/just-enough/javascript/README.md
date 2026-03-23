# just-enough-javascript

Validates learner JavaScript against a pedagogical language subset ("Just Enough
JavaScript") and executes it in sandboxed environments. Provides four modes:
validate-only, run with event logging, step-by-step execution tracing, and
interactive debugging.

## Structure

| Path                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `api/`                   | Unified wrappers — validate, run, trace, debug       |
| `evaluating/`            | Raw execution engines (Web Worker, iframe, Aran)     |
| `verify-language-level/` | AST-based validation pipeline and language level def |
| `reference.md`           | Learner-facing cheat sheet of allowed language        |
| `index.ts`               | Package entry — re-exports the four API functions    |

## Public API

All four functions validate code against the JeJ language level first, then
execute (except `validate` which only validates). All return frozen result objects.

```ts
import validate, { run, debug, trace } from './index.js';
```

| Function                              | Returns       | What it does                              |
| ------------------------------------- | ------------- | ----------------------------------------- |
| `validate(code)`                      | `BaseResult`  | Validation only — no execution            |
| `run(code, maxSeconds)`               | `RunResult`   | Web Worker execution with trapped globals |
| `trace(code, maxSeconds, options?)`   | `TraceResult` | Aran instrumentation, step-by-step data   |
| `debug(code, maxIterations?)`         | `DebugResult` | Iframe + `debugger` breakpoints           |

## Result Shape

All results share a common base:

```ts
{
  ok: boolean;
  error?: ResultError;         // 'parse' | 'javascript' | 'timeout' | 'iteration-limit'
  rejections?: Violation[];    // language-level violations (blocking)
  warnings?: Violation[];      // language-level hints (non-blocking)
}
```

Mode-specific additions: `logs` (run), `steps` (trace).

Consumers check `result.ok` first, then inspect `rejections` (pedagogical feedback)
or `error` (parse/runtime/limit failures).

## Navigation

- [api/README.md](./api/README.md) — wrapper functions and result types
- [evaluating/README.md](./evaluating/README.md) — execution engines
- [verify-language-level/README.md](./verify-language-level/README.md) — validation
  pipeline
- [DOCS.md](./DOCS.md) — architecture decisions and design rationale
- [reference.md](./reference.md) — learner-facing language reference
