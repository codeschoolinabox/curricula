# lib/completing

JEJ-aware completion source shaped as the editor's completion callback.
Given a request describing what the learner has typed (a word prefix
plus the surrounding text), produces a list of completion items —
keywords, allowed globals, the learner's own in-scope locals, and (in
dot-receiver context) a curated member union, with JEJ-blocked tokens
that learners commonly reach for surfaced as **marker + tooltip +
no-op-apply** items so the popup explains the language-level boundary
instead of silently filtering.

This module is the **adapter** between the JEJ-validation feed at
[`../../embody/lib/validating/`](../../embody/lib/validating/) (and
the scope analysis it shares with
[`../../embody/lib/scope/`](../../embody/lib/scope/)) and
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
(which consumes a `CompletionCallback` to drive CodeMirror's
autocompletion extension). It is callable from any peer that wants
JEJ-curated completions over a snippet string.

## Glossary

**Completion request** — what the editor hands to the completer. Shape
(owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts),
widened in Phase 0 of this sprint from `(prefix: string)` to a
structured request):
`{ prefix: string; precedingText: string; fullText: string }`.
`prefix` is the bare word-fragment under the cursor (CodeMirror
extracts it with `/\w*/`). `precedingText` is the text on the current
line from line-start to the prefix-start (used for dot-receiver
context detection). `fullText` is the entire snippet (used by
`validate(code)` and the scope walk). Named "request" rather than
"context" to keep the JEJ-side CM-blind; the editing/ layer
translates CM's `CompletionContext` into this shape.

**Completion item** — what the completer returns. Shape (owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts),
widened in Phase 0 of this sprint to add `info?` and `apply?`):
`{ label, type?, detail?, info?, apply? }`.
`type === 'blocked'` is the JEJ-pedagogical sentinel for items that
appear in the popup but represent constructs outside the language
level. `apply === 'noop'` is the sentinel that asks CodeMirror to
dismiss the popup on Enter instead of inserting the label — the
learner must type the blocked text manually to override (and the
linter catches it). `info` is markdown-flavored single-paragraph
prose that the editing layer lifts to a DOM tooltip.

**Completion feed** — the path from snippet text → frozen completion
items. The adapter calls
[`validate(code)`](../../embody/lib/validating/validate.ts) on
`fullText`, reads its returned `BaseResult` (specifically `.ast` when
present) for scope analysis via
[`buildScope`](../../embody/lib/scope/build-scope.ts), composes the
union of JEJ-allowed tokens at the cursor position (keywords ∪
JEJ-allowed globals ∪ scope-chain locals in identifier context; the
curated member union in dot-receiver context), then overlays
[`BLOCKED_MEMBER_NAMES`](../../embody/lib/validating/just-enough-js.ts)
and the curated stumbling-list to mark — not filter — the JEJ-blocked
labels. No [`Snippet`](../../embody/types.ts) is constructed; the F2
"no embody in editor mode" boundary that the lint adapter preserves
applies here.

## Performance

`completeJej` triggers a fresh acorn parse inside
[`validate(code)`](../../embody/lib/validating/validate.ts) on each
invocation (a "live re-parse"); the linter does the same on its own
schedule. There is no parse-sharing between the two callbacks — each
invocation runs its own validate(). CodeMirror's `autocompletion()`
extension debounces invocations by `activateOnTypingDelay` (100ms
default); JEJ snippets also "fit on a single printed page" (per
[`../../README.md`](../../README.md) § Why a language level), so
the cost is bounded by the page-size invariant. No adapter-level
caching is needed at JEJ sizes.

## What lives here

```text
lib/completing/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  types.ts                        Suggestion + StumblingEntry
  stumbling-list.ts               curated 14 entries: token → info prose
  collect-jej-surface.ts          request + validation result → Suggestion[]
  mark-blocked.ts                 overlay → readonly CompletionItem[]
  complete-jej.ts                 orchestrator: validate → collect → mark → freeze
  tests/
    stumbling-list.test.ts
    collect-jej-surface.test.ts
    mark-blocked.test.ts
    complete-jej.test.ts
```

`types.ts` exists here (unlike
[`../linting/`](../linting/) and
[`../formatting-editor/`](../formatting-editor/), which both skip it)
because **`StumblingEntry`** is JEJ-internal vocabulary with no home
in the editing-layer's types. `Suggestion` (the intermediate shape
threaded between `collect-jej-surface` and `mark-blocked`) is also
defined here.

## Public API

```ts
import completeJej from './complete-jej.js';

const items: readonly CompletionItem[] = completeJej({
    prefix,
    precedingText,
    fullText,
});
```

Signature: `(req: CompletionRequest) => readonly CompletionItem[]`.
Matches the `CompletionCallback` shape expected by the editor's
`completions` option after Phase 0 widens the contract from
`(prefix: string)` to the structured request
(see
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)).
The result is a deeply frozen array.

Behavior:

- **Prefix matches nothing in the JEJ surface** (e.g. `'zz'`,
  `'qqq'`) → empty array. The completer is a pure function of the
  request; the editor's own short-circuit at the editing factory
  filters out empty-implicit-prefix invocations before they reach
  this callback, but an explicit Ctrl-Space with empty prefix
  reaches the callback and is treated as "show me everything
  matching prefix `''`" — which under the case-insensitive
  `startsWith` filter is every JEJ-allowed identifier at the
  cursor position.
- **Bare identifier context, no AST** (parse failed) → keywords ∪
  JEJ-allowed globals, prefix-filtered (case-insensitive); blocked
  tokens (`var`, `class`, etc.) appear as blocked items if their
  label matches the prefix.
- **Bare identifier context, AST available** → above ∪ scope-chain
  locals at the cursor position (`type: 'local'`).
- **Dot-receiver context** (the regex
  `/([A-Za-z_$][\w$]*)\s*\.\s*$/` matches `precedingText`) → the
  curated member-name union (`type: 'member'`); blocked dot names
  from
  [`BLOCKED_MEMBER_NAMES`](../../embody/lib/validating/just-enough-js.ts)
  (e.g. `.split`, `.constructor`) appear as blocked items with
  curated info when present in the stumbling-list.
- **Chained dot context** (`str.charAt(0).`) → falls through to the
  identifier branch (no dot suggestions; keywords + globals + locals
  shown). Single-level dot-receiver only.
- **Blocked item that's also a curated stumble** → `type: 'blocked'`,
  `detail: '(not in JEJ)'`, `info` from the stumbling-list,
  `apply: 'noop'`. (`null` is the one allowed-but-curated case —
  info-attached but not marked blocked, since `null` is JEJ-valid;
  the curated entry teaches "use `undefined` instead" without
  blocking the keystroke.)
- **Blocked item that's NOT in the curated stumbling list** → same
  blocked marker but without `info` (generic `(not in JEJ)` only).

The function never throws. `validate(code)` never throws for string
input.

### Edge cases

- **Easter eggs suppressed.** `eval` (allowed global, easter egg),
  `void` (allowed unary, easter egg), `LabeledStatement`,
  `SequenceExpression`, `WithStatement` (allowed nodes, easter eggs)
  — none appear in the suggestion list. Learners can still type them
  manually; the language level continues to accept them. See
  Conventions § Easter eggs are suppressed for the rule that makes
  this load-bearing (this Edge case describes the runtime behavior;
  the Convention forbids future maintainers from "fixing" it).
- **Whitespace around dot.** `'str . '` (whitespace before/after
  the dot) is detected as dot-receiver context — the regex
  tolerates `\s*`.
- **Already-past-the-dot** (`str.split` typed in full) → the prefix
  is `split` and the precedingText ends with `str.`, so the
  dot-receiver branch fires and `split` is marked blocked from the
  stumbling-list overlay.
- **Bare `.`** (no receiver before the dot) → identifier branch
  (no dot suggestions). Pathological but safe.
- **Parse-error code with prior valid locals.** Once parsing fails,
  no AST → no scope locals offered. Keywords + globals still come
  through; learner sees their language vocabulary even with broken
  code in flight.
- **Rejected-but-parsed code** (e.g. `var x = 1`) — AST is present
  even though `validate.ok === false`; scope analysis tolerates it,
  so locals (including `x` from a `var`) DO appear. This is
  intentional: the learner's identifiers are useful even when the
  declaration form is outside JEJ.

## Consumers

- **Current**:
  [`../../orchestrate/editor/index.tsx`](../../orchestrate/editor/index.tsx)
  passes `completeJej` as the `completions` callback to
  [`createEditor`](../../orchestrate/lib/editing/create-editor.ts).
- **Potential**: any lens or sandbox tool wanting JEJ-curated
  completions over a code string and cursor position. The module's
  location at `javascript/lib/` (peer-independent) makes such
  consumption available without an upward dependency on
  `orchestrate/`.

## Why this module exists

The CodeMirror completion slot in the editor home base needs a
suggestion source that knows about the JEJ language level — both
positive (what's allowed) and pedagogical (what learners commonly
reach for but isn't in JEJ, and why). The validation feed already
knows the allowed surface; the scope module already knows the
learner's identifiers; the violation-message voice already knows
how to explain "X is not in JEJ". This adapter composes those three
into a single completion-callback contract without crossing peer
boundaries.

Unlike the format adapter
([`../formatting-editor/`](../formatting-editor/)), which intentionally
has no JEJ-subset gate, completions both filter to JEJ-allowed tokens
AND overlay JEJ-blocked ones — completions is where the curriculum
gets taught; format is shape cleanup independent of level. The
asymmetry is deliberate: format is a "make code look clean
regardless of level" gesture; completions is a "teach the level"
gesture.

The module lives at the JEJ-package `lib/` level rather than inside
[`../../orchestrate/lib/`](../../orchestrate/lib/) so that
non-orchestrator consumers (a future "what could I type here?" lens,
a vocabulary-exploration sandbox tool) need not reach across the
`lenses/` ↔ `orchestrate/` boundary. It lives outside
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
because `editing/` is JEJ-blind by contract — the editor knows how
to dispatch a completion callback and render the popup, but does
not know what shape "JEJ-canonical suggestions" takes.

The module lives outside `../../embody/lib/validating/` because the
validator's role is rejection-after-the-fact (does this snippet pass
the language level?). Completion is a prospective shaping role
(what should we suggest next?). The two share data (the same
language-level config and the same parse) but have distinct
responsibilities.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` /
`DEV.md`. Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects. The
  adapter is pure shape composition over the validate + scope
  primitives.
- **No `embody()`, no `Snippet` construction.** The adapter imports
  [`validate`](../../embody/lib/validating/validate.ts) and
  [`buildScope`](../../embody/lib/scope/build-scope.ts) (through the
  `BaseResult.ast` returned by validate), but never
  [`embody()`](../../embody/index.ts), the `Snippet` type, or
  anything under `../../embody/lib/evaluating/`. The F2 "no embody
  in editor mode" invariant rests on this boundary, as with the
  linting adapter.
- **Easter eggs are suppressed.** `eval`, `void`,
  `LabeledStatement`, `SequenceExpression`, `WithStatement` —
  neither offered as suggestions nor marked as blocked. They remain
  reachable by direct typing per the validator's existing
  permissiveness, but the completer treats them as
  outside-the-curriculum (suggesting them would teach learners
  something we don't want to teach).
- **Blocked is overlay, not filter.** The blocked-marker pass adds
  metadata to suggestions whose labels match the blocklist; it does
  not remove items. Filtering would silently hide constructs
  learners are typing; the marker tells them why instead. A
  hover-lens alternative was considered and rejected — the popup
  is the surface the learner is already attending to when they
  trigger completion; routing JEJ rationale to a different surface
  reduces it to dead documentation.
- **Each invocation parses independently.** No parse-sharing
  between the completer and the linter. CM debounces both
  callbacks; each runs its own `validate(code)`. JEJ snippets are
  small enough (single printed page) that the cost is bounded; no
  adapter-level cache is introduced. Future maintainers chasing a
  shared-parse optimization should first measure on production-
  sized JEJ snippets — at expected sizes, the optimization is
  premature.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Producer of the validation gate and the AST:**
  [`../../embody/lib/validating/`](../../embody/lib/validating/).
- **Producer of the scope analysis:**
  [`../../embody/lib/scope/`](../../embody/lib/scope/).
- **Consumer of `CompletionCallback`:**
  [`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/).
- **Editor deferred-callback wiring:**
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
  § Deferred callback wiring. That file's entry for `completions`
  points back here.
- **Sibling adapters:**
  [`../linting/README.md`](../linting/README.md) (validation-feed
  adapter for lint diagnostics) and
  [`../formatting-editor/README.md`](../formatting-editor/README.md)
  (format-callback adapter for the canonical formatter) — the prior
  two inhabitants of this peer, sharing the same lib/-boundary
  rationale and ZOMBIES test convention.
