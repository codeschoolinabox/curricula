# record/

Tracer core. Exposes one function: `record(code, config)`.

## Pipeline

```text
record(code, { meta, options })
  1. trace(code, maxSeconds)    ← spawns worker, runs Aran tracer, streams entries
  2. postProcess(rawEntries)    ← raw entries → structured AranStep[]
  3. filterSteps(steps, options) ← post-trace filtering
  → frozen AranStep[]
```

## Capture-all strategy

The legacy tracer uses a mutable `config.js` singleton to control what gets
instrumented. The CAPTURE_ALL config is hardcoded in the worker — config is
always all-on. Filtering happens post-trace via `filterSteps`.

## Files

| File                 | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `index.ts`           | Re-exports record                                                  |
| `record.ts`          | RecordFunction — pipeline orchestration                            |
| `trace.ts`           | Main-thread orchestrator — spawns worker, handles timeout + SAB    |
| `trace-worker.ts`    | Vite-bundled module worker entry — runs legacy tracer              |
| `post-process.ts`    | Raw entries → `AranStep[]` (regex parsing, depth tracking)         |
| `filter-steps.ts`    | Post-trace filtering (categories, lists, names, range, data strip) |
| `types.ts`           | `AranStep`, `AranFilterOptions`, `ResolvedAranConfig`              |
| `legacy-aran-trace/` | Vendored Aran tracer (environment-agnostic)                        |

## Filter options

See `types.ts` for `AranFilterOptions` and `options.schema.json` for the JSON
Schema.

Categories: `variables` (declare/assign/read), `operators`, `controlFlow`,
`functions`, `functionDeclarations`, `this`, `errorHandling`, `enterLeave`.

Lists: `variablesList`, `operatorsList`, `controlFlowList`, `functionsList`,
`names`.

Range: `range.start` / `range.end` (source line numbers).

Data stripping: `data.loc`, `data.values`, `data.nodeType`, `data.depth`.

## Tests

- `tests/filter-steps.test.ts` — unit tests for each filter dimension
  (hand-crafted fixtures)
- `tests/record.test.ts` — integration tests (worker-based trace)
