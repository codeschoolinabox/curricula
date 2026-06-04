# formatting — Architecture & Decisions

## Why Prettier (async tradeoff acknowledged)

Prettier is the canonical JavaScript formatter and preserves blank lines between
statements (Prettier collapses 1+ consecutive blank lines to 1). This matches
the "blank lines as paragraph breaks" convention documented in `DEV.md §12` and
used throughout this codebase.

The tradeoff: `prettier/standalone` is async-only (`Promise<string>`). This
makes `format()`, `checkFormat()`, and `isJej()` async too. Since the
execution-side of the library is already async (`run.result` is a Promise,
`intercept` is an async generator, IO mocks are all async), making
static-analysis async too just removes an artificial sync island — it does not
introduce a fundamentally new asynchronicity.

The previous implementation used `recast.prettyPrint()` (sync) but
unconditionally stripped all blank lines between statements, which made the
formatter actively hostile to the project's "paragraph breaks" convention.
Recast has no setting to preserve blank lines (they're not AST nodes), and
workarounds (sentinel comments, AST-walks) were judged to be permanent technical
debt without enough payoff.

`recast` is still a project dependency for AST loop-guard injection
(`evaluating/run/guard-loops`). It is no longer used for formatting.

## Why format works on any valid JS (not just JeJ)

Learners iterate toward JeJ compliance. During that process, they may write code
that uses disallowed features but is otherwise valid JavaScript. `format()`
should work on this code — helping them clean up formatting while they fix
validation errors. Restricting formatting to JeJ-only code would force learners
to fix everything at once instead of incrementally.

The pipeline reflects this: `format()` parses but does not validate.
`validate()` checks JeJ compliance but does not format. They are independent
tools that help learners reach the execution gate from different angles.

## Why no options parameter

The whole purpose of `format()` is that code is formatted exactly the JeJ way.
No overrides, no configurability. All code from all learners looks identical.

## Why `checkFormat` returns a payload (not throws)

All analysis functions in this library return result objects (`{ ok, ... }` or
`{ formatted, ... }`). Throwing on unformatted code would force consumers into
try-catch patterns and break the consistent API style.

`checkFormat` is used as a **pipeline gate** by execution wrappers (`run`,
`trace`, `debug`): unformatted code returns
`{ ok: false, error: { kind: 'formatting' } }`. No try-catch needed.

(Earlier drafts also fed `JejProgram.isFormatted` on a code-object factory; that
factory was removed as YAGNI bloat — superseded by the `<StudyLenses>` container
component.)

## Why `checkFormat` returns `{ formatted: true }` on Prettier failure

If Prettier itself throws (e.g., parse error on the input), `checkFormat`
returns `{ formatted: true }` rather than blocking execution. Formatter bugs
should not prevent learners from running their code. This is the same graceful
degradation philosophy as `format()` returning the original code on failure.

## Why these defaults

- **`useTabs: true`** — Accessibility. Screen readers and users with visual
  impairments can configure tab display width in their editor/browser. Spaces
  lock in a fixed width.
- **`tabWidth: 4`** — Readability for beginners. Wider indentation makes nesting
  levels more visually distinct.
- **`singleQuote: true`** — Consistency with JeJ conventions.
- **`printWidth: 80`** — Standard line width.
- **`semi: true`** — Explicit semicolons (JeJ convention).
- **`parser: 'babel'`** — Covers all JS the learners may write while iterating
  toward JeJ compliance (no JSX/decorators/Flow needed).

## Extracted from `evaluating/debug/format/`

This module was previously located inside `evaluating/debug/format/` because
only the debug engine used formatting (to clean up code after loop guard
injection). With the format gate (formatting required before execution),
formatting is a standalone concern used by the pipeline, the code object, and
the public API. The debug engine no longer calls `format()` internally.
