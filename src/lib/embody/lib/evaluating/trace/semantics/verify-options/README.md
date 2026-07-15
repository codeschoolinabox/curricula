# verify-options

Semantic validation called after JSON Schema validation and default-filling.
Enforces cross-field constraints that JSON Schema cannot express.

## Constraint

**`range.start ≤ range.end`** — when `range` is present in `TraceConfig`,
`start` must not exceed `end`. Throws `OptionsSemanticInvalidError` on
violation.

`range` is at the `TraceConfig` level (alongside `seconds`, `iterations`,
`options`) — not inside `options`. Each bound is a `RangePosition`:

- `number` — whole line (e.g. `3` means line 3, all columns)
- `{ line: number, column: number }` — precise character position

Normalization for comparison: `number n` → `{ line: n, column: 0 }` for start,
`{ line: n, column: Number.MAX_SAFE_INTEGER }` for end.

## Files

- `index.ts` — `verifyOptions(config)` — validates range constraint
- `types.ts` — local types
- `tests/verify-options.test.ts` — unit tests for the range constraint

## Navigation

- [../README.md](../README.md) — trace module overview
- [../../../shared/types.ts](../../../shared/types.ts) — `TraceConfig`,
  `SourceRange`, `RangePosition` types
