# evaluating/trace/configuring

Config preparation pipeline for the trace engine. Transforms raw user options
into a validated, fully-filled config object that the tracing generator uses
for event gating.

## Pipeline

```
User options → expandShorthand → fillDefaults → validateConfig → prepared config
```

Orchestrated by `prepareConfig(data, schema)`.

## Structure

| File | Purpose |
| ---- | ------- |
| `prepare-config.ts` | Pipeline orchestrator: expand, fill, validate |
| `expand-shorthand.ts` | Boolean shorthand expansion (recursive) |
| `fill-defaults.ts` | AJV-based JSON Schema default filling |
| `validate-config.ts` | AJV-based validation, throws on invalid |
| `ajv.ts` | CJS/ESM interop wrapper for AJV |
| `types.ts` | `JSONSchema` type definition |

## Key behaviors

- **Recursive shorthand expansion**: `{ operators: false }` expands into the full
  nested structure with all boolean leaves set to false and sub-objects recursed.
  Filter arrays and non-boolean/non-object properties are omitted (fillDefaults
  handles them via JSON Schema defaults).

- **JSON Schema defaults**: `fillDefaults` uses AJV with `useDefaults: true` to
  fill missing fields from `options.schema.json` defaults. Empty `{}` becomes
  the full config with all booleans true and all filters empty.

- **AJV `$schema` compatibility**: `options.schema.json` declares JSON Schema
  draft-2020-12 but AJV 8 only supports draft-07 by default. Both AJV instances
  use `validateSchema: false` to skip meta-schema validation. The schema uses no
  draft-2020-12 features.

- **Plain Error on validation failure**: the migrated validate-config throws
  plain `Error` (not `OptionsInvalidError`). The trace module uses result objects
  for error reporting, not custom error classes.
