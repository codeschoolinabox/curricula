# verify-options — Architecture & Decisions

## Why this exists

JSON Schema cannot express cross-field constraints. If the config has ordering
rules or relationships between fields, enforce them here — after schema
validation and default-filling have already run.

## Why a folder

Keeps validation logic and tests co-located. If new constraints are added,
each can get its own helper file.

## Constraints

### `range.start` / `range.end` ordering

When `range` is present in `TraceConfig`, `start` must be ≤ `end`.

**Why:** A range where start exceeds end would match zero source lines,
producing a silent empty result. Catching this early gives the consumer a
clear error message.

**RangePosition normalization:** Each bound is `number | { line, column }`.
Before comparing, normalize: a bare `number n` becomes `{ line: n, column: 0 }`
for start and `{ line: n, column: Number.MAX_SAFE_INTEGER }` for end.
Then compare `(start.line, start.column) ≤ (end.line, end.column)`.

**Behavior:**

- Both present, `start ≤ end` → passes silently
- Both present, `start > end` → throws `OptionsSemanticInvalidError` with
  message `range.start must be ≤ range.end`
- Only one bound present → passes (the other defaults via JSON Schema)
- Range absent → passes
- Config is non-object or null → passes (defensive; schema validation runs first)

**Implementation:** `verifyOptions` defensively navigates the config object,
checking `typeof` at each level before accessing nested properties. This avoids
runtime errors if called with unexpected input shapes.

## Note on `range` location

`range` lives at the `TraceConfig` level (alongside `seconds`, `iterations`,
`options`) — NOT inside `options`. `verifyOptions` receives the full `TraceConfig`,
not just the inner `options` object.
