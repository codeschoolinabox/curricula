# verify-options — Architecture & Decisions

## Why this exists

JSON Schema (draft-07) cannot express cross-field constraints. If your tracer
options have mutual exclusion rules, conditional required fields, or other
relationships between options, enforce them here — after the API layer has
validated the schema and filled defaults.

## Why a folder?

Keeps validation logic and tests co-located and out of `src/`. If new
constraints are added, each can get its own helper file here.

## Constraints

### `range.start` / `range.end` ordering

When both `range.start` and `range.end` are present, `start` must be ≤ `end`.

**Why:** A range where start exceeds end is nonsensical — it would match zero
source lines. Catching this early (before tracing) gives the consumer a clear
error message rather than a silent empty result.

**Behavior:**

- Both present, `start <= end` → passes silently
- Both present, `start > end` → throws `OptionsSemanticInvalidError` with
  message `range.start (N) must be <= range.end (M)`
- Only one present → passes (the missing bound defaults via JSON Schema)
- Range absent, empty, or non-object → passes
- Options are non-object or null → passes (defensive; schema validation runs
  first)

**Implementation:** `verifyOptions` defensively navigates the `unknown`-typed
options object, checking `typeof` at each level before accessing nested
properties. This avoids runtime errors if called with unexpected input shapes.
