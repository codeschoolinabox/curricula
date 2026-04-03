# formatting — Architecture & Decisions

## Why recast, not Prettier

Prettier/standalone is async-only in the browser. This would cascade async
through `checkFormat`, `isJej`, `hint`, the code object factory, and the
`.code` setter — making the entire analysis pipeline asynchronous.

Recast's prettyPrint is synchronous and already a project dependency (used for
loop guard AST injection). JeJ's constrained syntax subset doesn't use features
where recast and Prettier output diverges (no object literals, no multi-line
parameter lists, no complex line wrapping). Recast achieves near-identical
formatting for JeJ code.

## Why format works on any valid JS (not just JeJ)

Learners iterate toward JeJ compliance. During that process, they may write code
that uses disallowed features but is otherwise valid JavaScript. `format()`
should work on this code — helping them clean up formatting while they fix
validation errors. Restricting formatting to JeJ-only code would force learners
to fix everything at once instead of incrementally.

The pipeline reflects this: `format()` parses but does not validate. `validate()`
checks JeJ compliance but does not format. They are independent tools that help
learners reach the execution gate from different angles.

## Why no options parameter

The whole purpose of `format()` is that code is formatted exactly the JeJ way.
No overrides, no configurability. All code from all learners looks identical.

## Why `checkFormat` returns a payload (not throws)

All analysis functions in this library return result objects (`{ ok, ... }` or
`{ formatted, ... }`). Throwing on unformatted code would force consumers into
try-catch patterns and break the consistent API style.

`checkFormat` is used in two contexts:

1. **Pipeline gate** (in `api/run`, `api/trace`, `api/debug`): unformatted code
   returns `{ ok: false, error: { kind: 'formatting' } }`. No try-catch needed.
2. **Code object** (`JejProgram.isFormatted`): a boolean property, not a thrown
   exception.

## Why `checkFormat` returns `{ formatted: true }` on recast failure

If recast itself throws (e.g., internal bug, unexpected input), `checkFormat`
returns `{ formatted: true }` rather than blocking execution. Formatter bugs
should not prevent learners from running their code. This is the same graceful
degradation philosophy as `format()` returning the original code on failure.

## Why these defaults

- **`useTabs: true`** — Accessibility. Screen readers and users with visual
  impairments can configure tab display width in their editor/browser. Spaces
  lock in a fixed width.
- **`tabWidth: 4`** — Readability for beginners. Wider indentation makes nesting
  levels more visually distinct.
- **`quote: 'single'`** — Consistency with JeJ conventions.
- **`wrapColumn: 80`** — Standard line width.

## Extracted from `evaluating/debug/format/`

This module was previously located inside `evaluating/debug/format/` because only
the debug engine used formatting (to clean up code after loop guard injection).
With the format gate (formatting required before execution), formatting is a
standalone concern used by the pipeline, the code object, and the public API.
The debug engine no longer calls `format()` internally.
