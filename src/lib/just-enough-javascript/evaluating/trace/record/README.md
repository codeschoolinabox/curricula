# record/

Tracer core. Exposes one function: `record(code, config)`.

## Pipeline

```text
record(code, { meta, options })
  1. Save legacy config, apply capture-all override
  2. trace(code)              ← legacy Aran tracer (iframe + eval)
  3. postProcess(rawEntries)  ← raw entries → structured AranStep[]
  4. filterSteps(steps, options) ← post-trace filtering
  5. Restore legacy config
  → frozen AranStep[]
```

## Capture-all strategy

The legacy tracer uses a mutable `config.js` singleton to control what gets
instrumented. Rather than threading filter options through the legacy code,
`record.ts` temporarily overrides all config flags to "capture everything", then
filters the structured output post-hoc. The original config is restored in a
`try/finally`.

Console and blockScope are always enabled because they produce irreversible side
effects (actual `console.log` execution, indentation state mutations).

## Files

| File              | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `index.ts`        | Re-exports record (add env detection here if needed)               |
| `record.ts`       | RecordFunction — capture-all override + pipeline                   |
| `post-process.ts` | Raw entries → `AranStep[]` (regex parsing, depth tracking)         |
| `filter-steps.ts` | Post-trace filtering (categories, lists, names, range, data strip) |
| `types.ts`        | `AranStep`, `AranFilterOptions`, `ResolvedAranConfig`              |
| `sandbox.html`    | Browser sandbox for manual testing (requires `npm run build`)      |

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
- `tests/record.test.ts` — integration test stubs (legacy tracer needs browser
  DOM)
