# hinting

Detects beginner mistakes and misconceptions in JeJ programs. Produces warnings
that help learners improve their code without blocking execution.

Extracted from `verify-language-level/collect-warnings.ts` during the module
restructure. Warnings are informational feedback, separate from validation
rejections that gate execution.

## Purpose

`hint()` runs the full analysis pipeline and returns a pre-execution picture:

1. Validates the code (via `validating/`) — if not JeJ-compliant, returns early
   with rejections only (no point analyzing non-JeJ code for style issues)
2. Checks formatting status (via `formatting/`) — included as a boolean field
3. Runs warning detection — AST-based and source-text-based checks

One call gives everything the UI needs to display before the learner runs code.

## Warning Categories

### Code smells (style)

Patterns that aren't wrong but suggest confusion or poor habits:

- `'use strict'` — redundant in module mode
- Unused expression — expression result not used (e.g. `5;`, `x + 1;`)
- camelCase — variable names not matching `/^[a-z][a-zA-Z0-9]*$/`
- Empty blocks — `BlockStatement` with empty body
- Missing semicolons — missing `;` at statement boundaries
- Unnecessary semicolons — `;` after `}` of control flow, or `;;`
- Unused variables — declared variable with zero references
- for-of with `let` — should use `const`
- for-of var reassigned — reassigning iteration variable inside loop body
- Variable shadowing — inner block re-declares outer scope name
- Tabs not spaces — leading spaces should be tabs
- Trailing newline — file should end with exactly one newline

### Misconceptions (conceptual confusion)

Patterns that reveal a misunderstanding of how JavaScript works:

- Assignment in condition — `if (x = 5)` suggests assignment/comparison
  confusion (probably meant `===`)
- Unreachable code — statements after `break`/`continue`

## Structure

| File                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `collect-warnings.ts` | AST + source-text warning detection                  |
| `tests/`              | Unit tests                                           |

## API

### `hint`

```ts
function hint(code: string): HintResult;
```

Returns:

```ts
type HintResult = {
  readonly ok: boolean;
  readonly rejections?: readonly Violation[];
  readonly warnings: readonly Violation[];
  readonly formatted: boolean;
};
```

- `ok` — `true` when code is valid JeJ (may still have warnings)
- `rejections` — present only when `!ok` (JeJ violations)
- `warnings` — empty when `!ok` (no point warning about style in invalid code)
- `formatted` — whether the code matches the expected recast format

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [../validating/README.md](../validating/README.md) — validation (called
  internally by hint)
- [../formatting/README.md](../formatting/README.md) — format check (for the
  `formatted` field)
- [../api/README.md](../api/README.md) — public API wrapper (`hint`)
