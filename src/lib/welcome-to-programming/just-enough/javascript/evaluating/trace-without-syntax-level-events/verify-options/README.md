# verify-options

Semantic validation called by the API layer after JSON Schema validation and
default-filling.

Enforces constraints JSON Schema cannot express.

## Constraint

**range.start <= range.end** — when both `range.start` and `range.end` are
present, start must not exceed end. Throws `OptionsSemanticInvalidError` on
violation.

## Files

- `index.ts` — `verifyOptions(options)` — validates range constraint
- `types.ts` — local types (currently empty)
- `tests/verify-options.test.ts` — unit tests for the range constraint
