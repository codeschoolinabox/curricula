# evaluating/trace

Traces JavaScript execution using the legacy Aran instrumentation engine. Captures
every expression evaluation, variable access, function call, and control-flow step,
yielding structured `AranStep` events for live educational visualization.

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

## Public API

```ts
record(code: string, config: TraceConfig): AsyncGenerator<AranStep, readonly AranStep[]>
```

- **Yields** — `AranStep` objects one at a time via streaming processor, pausing
  the Worker between steps via SAB pause protocol
- **Returns** — frozen array of all `AranStep` objects on completion

Wrapped by `createExecution` at the `api/` layer to produce an
`Execution<AranStep, TraceResult>` with PromiseLike backward compatibility.

Legacy `@study-lenses/tracing` wrappers (`trace`, `tracify`, `embody`,
`embodify`) are preserved for backward compatibility.

## How It Works

1. `record/` orchestrates: spawn module worker → Aran instrumentation →
   streaming processor (or batch postProcess) → filter
2. Worker posts raw entries via `postMessage` + pauses via SAB pause flag
3. Streaming processor incrementally parses entries into structured `AranStep`
   objects (same logic as batch `postProcess`, but per-entry)
4. Generator yields each processed step, then resumes Worker
5. Iteration-based stopping: counts loop-entry events per source location,
   triggers cancel when any loop exceeds `config.iterations`
6. Returns frozen `AranStep[]` on completion or timeout

## Record Pipeline

```text
record/
  trace.ts                    ← spawns module worker, async generator
  trace-worker.ts             ← Vite-bundled worker, runs legacy tracer
  create-streaming-processor  ← incremental entry → AranStep processing
  parsers/                    ← extracted parsing functions (from post-process.ts)
  filters/                    ← extracted filter functions (from filter-steps.ts)
  post-process.ts             ← batch orchestrator (imports from parsers/)
  filter-steps.ts             ← batch filter orchestrator (imports from filters/)
  record.ts                   ← pipeline entry: generator wrapping trace + processor
```

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and rationale
- [record/README.md](./record/README.md) — tracer core pipeline
- [verify-options/README.md](./verify-options/README.md) — option validation
- [../shared/README.md](../shared/README.md) — shared types across all engines
