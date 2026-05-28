# lib/linting

JEJ validation feed shaped as editor lint diagnostics. Given a code
string, produces a list of lint diagnostics — one per violation of the
JEJ language level, plus one for a parse error if the source fails to
parse.

This module is the **adapter** between
[`../../embody/lib/validating/`](../../embody/lib/validating/) (which
produces `Violation[]` against the JEJ subset) and
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
(which consumes `LintDiagnostic[]` to render CodeMirror gutter markers
+ hover tooltips). It is callable from any peer that wants JEJ-aware
diagnostics over a snippet string.

## Glossary

**Violation** — a single reason the snippet is outside the JEJ subset,
produced by [`validate(code)`](../../embody/lib/validating/validate.ts).
Its canonical shape (owned by
[`../../embody/lib/validating/types.ts`](../../embody/lib/validating/types.ts)):
`{ nodeType, message, severity, location, nodePath }`, where `location`
is a `SourceRange` (`{ start: { line, column }, end: { line, column } }`,
line 1-based, column 0-based; copied from acorn, so `end` is
**exclusive** — one past the last character), `severity` is always
`'rejection'`, and `nodePath` is the offending node's JSONPath.

**LintDiagnostic** — a single editor-shaped diagnostic, consumed by
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/). Its
shape (owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)):
flat `{ line, column, endLine?, endColumn?, severity, message, source? }`,
line 1-based, column 0-based.

**Validation feed** — the path from snippet string → diagnostics. This
adapter consumes [`validate(code)`](../../embody/lib/validating/validate.ts)
directly and constructs no [`Snippet`](../../embody/types.ts); that is
what keeps it usable in editor mode, where the F2 "no embody in editor
mode" invariant (per
[`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md))
forbids embodiment. ([`embody()`](../../embody/index.ts) itself builds
a `Snippet` — irrelevant here; the adapter never invokes it.)

## Performance

`lintJej` triggers a fresh acorn parse inside
[`validate(code)`](../../embody/lib/validating/validate.ts) on each
invocation (a "live re-parse"). CodeMirror's `linter()` extension
debounces invocations by default, so the cost is bounded; JEJ snippets
also "fit on a single printed page" (per
[`../../README.md`](../../README.md) § Why a language level), bounding
input size.

## What lives here

```text
lib/linting/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  violation-to-diagnostic.ts      pure adapter: Violation → LintDiagnostic
  lint-jej.ts                     pure linter: (code) → readonly LintDiagnostic[]
  tests/
    violation-to-diagnostic.test.ts
    lint-jej.test.ts
```

There is no `types.ts`: this module defines no new types. It imports
`Violation` and `LintDiagnostic` directly from their owning modules.

## Public API

```ts
import lintJej from './lint-jej.js';

const diagnostics: readonly LintDiagnostic[] = lintJej(code);
```

Signature: `(code: string) => readonly LintDiagnostic[]`. Matches the
`LinterCallback` shape expected by the editor's `linters` option
(see [`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)).
The result is a deeply frozen array.

Behavior:

- **Empty input** → empty array (an empty program has no nodes to
  reject and parses cleanly).
- **Valid JEJ snippet** → empty array.
- **Snippet with rejections** (violations of the JEJ subset; parse
  succeeds) → one diagnostic per `Violation`, mapped 1:1 by
  [`violationToDiagnostic`](./violation-to-diagnostic.ts).
- **Snippet with a parse error** (acorn cannot parse) → one diagnostic
  synthesized inside `lintJej`. The parse-error branch is **not** a
  `Violation` and carries **no `SourceRange`**: on the
  [`BaseResult`](../../embody/lib/validating/types.ts) it is a flat
  `error: { kind: 'parse', name, message, line, column }`. Map
  `error.line`/`error.column` → `line`/`column`; omit `endLine`/
  `endColumn` (a syntax error is a point, not a span); set
  `severity: 'error'` and `source: 'JEJ'`.

**Parse error and rejections are mutually exclusive.** `validate`
returns the parse-error branch *before* walking the AST for
violations, so a result never carries both — and a `!ok` result that
is not a parse error always carries `rejections` (the producer's
invariant; no internal re-check needed). `lintJej` handles the
parse-error branch first, then reads `result.rejections` from any
remaining `!ok` result.

The function never throws. `validate(code)` never throws for string
input; the adapter is pure shape translation.

### Edge cases

- **Single-position location** (`start === end`): emitted verbatim;
  CodeMirror renders a zero-width marker. JEJ violation locations are
  produced by acorn and are typically multi-character.
- **Non-ASCII identifiers**: acorn reports columns in UTF-16 code
  units, matching CodeMirror's document model — no offset conversion
  needed.
- **`nodeType` / `nodePath` are dropped**: `LintDiagnostic` has no
  field for them. They exist on `Violation` for *other* consumers
  (lens highlighting, structured tooling); the editor's diagnostic
  surface does not use them.

## Consumers

- **Current**: [`../../orchestrate/editor/index.tsx`](../../orchestrate/editor/index.tsx)
  passes `lintJej` as the `linters` callback to
  [`createEditor`](../../orchestrate/lib/editing/create-editor.ts).
- **Potential**: any lens or sandbox tool wanting JEJ-aware diagnostics
  over a code string. The module's location at `javascript/lib/`
  (peer-independent) makes such consumption available without an
  upward dependency on `orchestrate/`.

## Why this module exists

The CodeMirror linter slot in the editor home base needs a diagnostics
feed. Per the orchestrator's F2 contract
([`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
§ Structural constraints), editor mode builds no embodiment — the
editor never receives a [`Snippet`](../../embody/types.ts), so the
linter feed cannot go through [`embody()`](../../embody/index.ts).

The validation feed reads violations directly from
[`validate(code)`](../../embody/lib/validating/validate.ts), a
separable gate that does not construct an embodiment. The adapter
shapes that data to the editor's diagnostic contract without touching
`embody()`, the `Snippet` type, or the orchestrator's embodiment cache.

The module lives at the JEJ-package `lib/` level rather than inside
[`../../orchestrate/lib/`](../../orchestrate/lib/) so that
non-orchestrator consumers (a future "highlight violations" lens, a
diagnostic-driven sandbox tool) need not reach across the `lenses/` ↔
`orchestrate/` boundary. It lives outside
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
because `editing/` is JEJ-blind by contract — per its
[`README.md`](../../orchestrate/lib/editing/README.md), "the editor
knows how to display feedback (gutters, tooltips, markers) but does
not know what the feedback means." JEJ-specific shaping belongs
outside that boundary.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` /
`DEV.md`. Module-specific rules:

- **Pure functions only.** No async, no side effects, no I/O. Both
  files produce deeply frozen output from string input.
- **No embodiment construction.** Imports from
  `../../embody/lib/validating/` (the validation gate) and the
  `Violation` type from
  `../../embody/lib/validating/types.js`, but never
  [`embody()`](../../embody/index.ts) or anything under
  `../../embody/lib/evaluating/` (the execution path). The F2
  invariant rests on this boundary.
- **Severity needs no translation.** Both `Violation` and
  `LintDiagnostic` use `'rejection'`; the editing/ module maps
  `'rejection'` → CodeMirror's `'error'` internally. The adapter's
  actual work is flattening `location` (`start`/`end` → `line` /
  `column` / `endLine` / `endColumn`); parse-error diagnostics get
  `severity: 'error'`. **No endpoint adjustment.** `SourceRange.end`
  is acorn-exclusive (one past the last character), and
  [`to-cm-diagnostic.ts`](../../orchestrate/lib/editing/to-cm-diagnostic.ts)
  treats `LintDiagnostic.endColumn` as an exclusive offset
  (`to = lineStart + endColumn`), so the adapter copies `end.line` /
  `end.column` straight through — both ends are exclusive, they match.
- **Source `'JEJ'`.** The optional `source` field is set to the
  constant `'JEJ'` so the editor's tooltip can attribute the
  diagnostic to the JEJ language gate rather than (e.g.) a third-party
  ESLint or TypeScript source. Emit it as a single named module
  constant (it is used on both the violation and parse-error paths) to
  satisfy `sonarjs/no-duplicate-string`.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Producer of `Violation`:**
  [`../../embody/lib/validating/`](../../embody/lib/validating/).
- **Consumer of `LintDiagnostic`:**
  [`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/).
- **F2 invariant statement:**
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
  § Structural constraints. (When this module is wired into the editor,
  that file's § Deferred callback wiring entry for `linters` should be
  updated from "open design question" to point here.)
