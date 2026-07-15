# evaluating/trace/configuring

Config preparation pipeline for the trace engine. Transforms raw user options
into a validated, fully-filled config object that the tracing generator uses for
event gating.

## Pipeline

```text
User options → expandShorthand → fillDefaults → validateConfig → prepared config
```

Orchestrated by `prepareConfig(data, schema)`.

## Structure

| File                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `prepare-config.ts`   | Pipeline orchestrator: expand, fill, validate |
| `expand-shorthand.ts` | Boolean shorthand expansion (recursive)       |
| `fill-defaults.ts`    | AJV-based JSON Schema default filling         |
| `validate-config.ts`  | AJV-based validation, throws on invalid       |
| `ajv.ts`              | CJS/ESM interop wrapper for AJV               |
| `types.ts`            | `JSONSchema` type definition                  |

## Config shape

The config is structured by the 4-layer mental model. Each layer accepts either
`boolean` shorthand or a fine-grained object:

```text
resolve       → boolean
expression    → boolean | { variables, operators, literals, templates, properties, functions }
statements    → boolean | { variables, conditionals, while, doWhile, for, forOf, break, continue }
scopes        → boolean | { script, block }  ← each with lifecycle + declare sub-gates
with          → boolean (easter egg)
```

See `../config.types.ts` for the full `TraceOptions` type definition. See
`../options.schema.json` for the JSON Schema used by this pipeline.

## Key behaviors

- **Recursive shorthand expansion**: `{ expression: false }` expands into the
  full nested structure with all boolean leaves set to `false`, recursing into
  all sub-objects. `{ operators: { arithmetic: false } }` expands only the
  affected leaf; siblings keep their default `true`. Filter arrays and
  non-boolean/non-object properties are omitted — `fillDefaults` provides them
  via schema defaults.

- **JSON Schema defaults**: `fillDefaults` uses AJV with `useDefaults: true` to
  fill missing fields from `options.schema.json` defaults. An empty `{}` becomes
  the fully-expanded config with all boolean leaves `true` and all filter arrays
  `[]`.

- **AJV `$schema` compatibility**: `options.schema.json` declares JSON Schema
  draft-2020-12 but AJV 8 only supports draft-07 by default. Both AJV instances
  use `validateSchema: false` to skip meta-schema validation. The schema uses no
  draft-2020-12 features.

- **Plain Error on validation failure**: `validateConfig` throws plain `Error`
  (not a custom error class). The trace module uses result objects for error
  reporting, not thrown errors.

## Navigation

- [../README.md](../README.md) — trace module overview
- [../config.types.ts](../config.types.ts) — TraceOptions type with layer
  documentation
- [../options.schema.json](../options.schema.json) — JSON Schema (source for
  default-filling)
