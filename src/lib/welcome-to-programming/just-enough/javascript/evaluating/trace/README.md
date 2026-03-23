# evaluating/trace

Traces JavaScript execution using the legacy Aran instrumentation engine. Captures
every expression evaluation, variable access, function call, and control-flow step,
returning structured `AranStep[]` data for educational visualization.

This is the low-level tracer module — it does not validate or enforce language
levels. The `api/trace` wrapper handles validation before calling into this module.

## Structure

| File / Directory      | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `index.ts`            | Assembly point — wires TracerModule into `@study-lenses/tracing`. No logic here. |
| `id.ts`               | Tracer ID string: `'aran:legacy'`                              |
| `langs.ts`            | Supported file extensions: `['js']`                            |
| `options-schema.ts`   | Re-exports `options.schema.json` (thin TypeScript wrapper)     |
| `options.schema.json` | JSON Schema for tracer filter options                          |
| `verify-options/`     | Semantic validation: cross-field constraint `range.start <= range.end` |
| `record/`             | Tracer core — pipeline orchestration, worker, post-processing. See [record/README.md](./record/README.md). |
| `trace.ts`            | (reserved — currently empty)                                   |

## Public API

```ts
import { trace, tracify, embody, embodify, tracer } from './index.js';
```

| Export     | Description                                              |
| ---------- | -------------------------------------------------------- |
| `trace`    | Positional args, throws on error. Default export.        |
| `tracify`  | Keyed args, returns Result (no throw).                   |
| `embody`   | Chainable builder with tracer pre-set, throws on error.  |
| `embodify` | Immutable chainable builder, returns Result.             |
| `tracer`   | Raw `TracerModule` object for introspection or custom wrappers. |

All wrappers are pre-bound via `@study-lenses/tracing(tracer)`.

## How It Works

1. `index.ts` assembles the `TracerModule` (id, langs, optionsSchema, verifyOptions, record)
2. Passes it to `@study-lenses/tracing` which returns the four standard wrappers
3. When called, the wrapper validates config, then calls `record(code, config)`
4. `record/` orchestrates: spawn worker → Aran instrumentation → postProcess → filterSteps
5. Returns frozen `AranStep[]`

## What To Edit

| File                      | When to touch it                                             |
| ------------------------- | ------------------------------------------------------------ |
| `record/record.ts`        | Tracer engine — the main pipeline entry point                |
| `record/index.ts`         | Only if you need environment detection / conditional loading |
| `verify-options/index.ts` | Add cross-field constraints the schema cannot express         |
| `options.schema.json`     | Change the tracer's options structure                        |
| `id.ts`                   | Bump when options schema changes incompatibly                |
| `langs.ts`                | Change supported file extensions                             |

## What NOT To Touch

- `index.ts` — pure assembly; logic belongs in `record/`
- `options-schema.ts` — thin re-export, no logic

## Dependency DAG

```text
entry (index.ts)
  → record/          (record/index.ts → record/record.ts)
  → verify-options/  (verify-options/index.ts)
  → core             (id, langs, options-schema, options.schema.json)
```

ESLint `boundaries` plugin enforces this DAG — see `eslint.boundaries.mjs`.

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and rationale
- [record/README.md](./record/README.md) — tracer core pipeline
- [verify-options/README.md](./verify-options/README.md) — option validation
- [../shared/README.md](../shared/README.md) — shared types across all engines
