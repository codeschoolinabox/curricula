# hinting — Architecture & Decisions

## Why extracted from verify-language-level

The original `verify-language-level/` mixed validation (rejections) with hinting
(warnings). These serve different purposes:

- **Rejections** gate execution — invalid code cannot run
- **Warnings** inform the learner — valid code runs with hints attached

Mixing them in one module meant consumers who only needed validation also paid
for warning detection. More importantly, the pipeline stages are different:
validation is step 2, warnings are step 4 (after format check). Separate modules
make the pipeline explicit.

## Why hint calls validate first

No point analyzing non-JeJ code for style issues. If the code uses `var`,
warning about camelCase is noise — the learner has bigger problems to fix. When
`!ok`, `hint()` returns early with rejections and empty warnings.

This also means `hint()` is a superset of `validate()` — it always validates,
then optionally warns. The UI can call `hint()` once instead of `validate()` +
warnings separately.

## Why formatted is included

The UI needs to know three things before enabling the Run button:

1. Is the code valid JeJ? (rejections)
2. Is it formatted? (format gate)
3. Any hints? (warnings)

Including `formatted: boolean` in the hint result means one API call gives the
full pre-execution picture. Without it, the UI would need to call `hint()` +
`checkFormat()` separately — two async operations instead of one.

## Misconceptions vs code smells

Warnings are categorized (conceptually, not in the type system) as:

**Code smells** — patterns that aren't wrong but suggest confusion or poor
habits. Examples: unused variables, missing semicolons, tabs vs spaces. These
help learners write cleaner code.

**Misconceptions** — patterns that reveal a misunderstanding of how JavaScript
works. Examples: `if (x = 5)` (assignment/comparison confusion), unreachable
code after `break`. These are more pedagogically valuable because they point to
a specific mental model error.

The distinction matters for UI treatment: misconceptions deserve more prominent
display and explanatory text, while code smells can be shown as gentle nudges.

## Warning boundary principle

JeJ warnings catch syntax that is obviously misused, overlooked, or
misunderstood by beginners. The test: "Could a beginner have written this by
accident?"

- **Yes → warning.** `if (x = 5)` — beginners confuse `=` and `===`
- **No → not a warning.** `!!value` for boolean coercion — requires intentional
  knowledge

If producing the pattern requires intentional knowledge, it belongs in linting,
not JeJ warnings.

## What this module deliberately does NOT do

- **No rejection-severity violations.** Those are `validating/`'s job.
- **No fix suggestions.** Reports what's suspicious and where, not how to fix it.
- **No formatting.** Only checks whether code _is_ formatted (via
  `formatting/checkFormat`), never reformats it.
- **No execution.** This is a pre-execution analysis tool.
