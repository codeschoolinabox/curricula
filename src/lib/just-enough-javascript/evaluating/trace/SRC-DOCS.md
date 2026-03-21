# src — Architecture & Decisions

## Module boundaries

The ESLint `boundaries` plugin enforces a DAG. Key rules:

- `utils/` is a leaf — no internal deps
- `record/` can use `utils/`
- `verify-options/` can use `utils/` but NOT `record/` (avoids coupling
  validation to engine types)
- `index.ts` (entry) assembles everything — the only file that imports across
  all modules

## Why options-schema.ts wraps options.schema.json

`options.schema.json` is kept as canonical JSON Schema for external tooling
(validators, editors, doc generators). `options-schema.ts` is the internal
import point, centralising the `with { type: 'json' }` attribute and any casting
needed.

## Why no barrel files?

Importing directly from source files keeps the dependency graph explicit and
prevents accidental coupling. The `boundaries` plugin enforces this.
