# src/

Source module map for `@study-lenses/trace-<lang>-<engine>`.

## Module Overview

```text
src/
  index.ts            ← Assembly point. Wire-up only — do not add logic here.
  id.ts               ← Tracer ID string (set in id.ts — TODO: fill in)
  langs.ts            ← Supported extensions (set in langs.ts — TODO: fill in)
  options-schema.ts   ← Re-exports options.schema.json (thin wrapper)
  options.schema.json ← JSON Schema for tracer options (TODO: fill in)
  verify-options/     ← Semantic validation (optional cross-field constraints)
  record/             ← Tracer core. See record/README.md.
  utils/              ← Deep object utilities. See utils/README.md.
```

## What To Edit

| File                      | When to touch it                                                   |
| ------------------------- | ------------------------------------------------------------------ |
| `record/record.ts`        | Implement your tracer engine — this is the main entry point        |
| `record/index.ts`         | Only if you need environment detection / conditional loading       |
| `verify-options/index.ts` | Add cross-field constraints your schema cannot express             |
| `options.schema.json`     | Define your tracer's options structure                             |
| `id.ts`                   | Set tracer ID (also bump when options schema changes incompatibly) |
| `langs.ts`                | Set supported file extensions                                      |

## What NOT To Touch

- `index.ts` — pure assembly; if you find yourself adding logic here, it belongs
  in `record/`
- `options-schema.ts` — thin re-export, no logic

## Dependency DAG

```text
entry (index.ts)
  → record/          (record/index.ts → record/record.ts)
  → verify-options/  (verify-options/index.ts)
  → core             (id, langs, options-schema, options.schema.json)
  → utils/           (deep-freeze, deep-clone, ...)
```
