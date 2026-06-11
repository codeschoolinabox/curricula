# lib/completing

JEJ-aware completion source shaped as the editor's completion callback. Given a
request describing what the learner has typed (a word prefix plus the
surrounding text), produces a list of completion items — keywords, allowed
globals, the learner's own in-scope locals, and (in dot-receiver context) a
curated member union, with JEJ-blocked tokens that learners commonly reach for
surfaced as **marker + tooltip + no-op-apply** items so the popup explains the
language-level boundary instead of silently filtering.

Blocked-item tooltip content is sourced from
[`../documenting/not-in-jej.ts`](../documenting/not-in-jej.ts) — the single
source of truth for non-JEJ docs across both the autocomplete popup and the
hover (`docLookup`) surface. The same `DocEntry` (with its `whyNotInJej` field
tying the exclusion to JEJ's notional-machine boundary) appears in both
contexts.

This module is the **adapter** between the JEJ-validation feed at
[`../../embody/lib/validating/`](../../embody/lib/validating/) (and the scope
analysis it shares with [`../../embody/lib/scope/`](../../embody/lib/scope/))
and [`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/) (which
consumes a `CompletionCallback` to drive CodeMirror's autocompletion extension).
It is callable from any peer that wants JEJ-curated completions over a snippet
string.

## Glossary

**Completion request** — what the editor hands to the completer. Shape (owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts),
widened in Phase 0 of this sprint from `(prefix: string)` to a structured
request): `{ prefix: string; precedingText: string; fullText: string }`.
`prefix` is the bare word-fragment under the cursor (CodeMirror extracts it with
`/\w*/`). `precedingText` is the text on the current line from line-start to the
prefix-start (used for dot-receiver context detection). `fullText` is the entire
snippet (used by `validate(code)` and the scope walk). Named "request" rather
than "context" to keep the JEJ-side CM-blind; the editing/ layer translates CM's
`CompletionContext` into this shape.

**Completion item** — what the completer returns. Shape (owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)):
`{ label, type?, detail?, info?, entry?, apply? }`. `type` is CodeMirror's
icon-rendering hint (`'keyword'`, `'global'`, `'local'`, `'member'`, etc.).
`detail` renders inline next to the label in the dropdown row — blocked items
set `detail: '(not in JEJ)'` as a lightweight in-flow flag. `apply === 'noop'`
is the sentinel that asks CodeMirror to dismiss the popup on Enter instead of
inserting the label — the learner must type the blocked text manually to
override (and the linter catches it). `info` and `entry` are alternative
info-callback payloads the editing-layer dispatches between (`entry` takes
precedence, lifted through `build-tooltip-dom.ts`; `info` is the plain-string
fallback through `build-info-dom.ts`). The JEJ adapter leaves BOTH unset on
blocked items: rich pedagogical content surfaces through the linter's
gutter-warning hover and the docLookup word-hover, not through the autocomplete
popup info-callback — keeping the typing flow uncluttered. The `entry` field is
scaffolding for future adapters that may want a rich autocomplete-popup tooltip.

**Completion feed** — the path from snippet text → frozen completion items. The
adapter calls [`validate(code)`](../../embody/lib/validating/validate.ts) on
`fullText`, reads its returned `BaseResult` (specifically `.ast` when present)
for scope analysis via [`buildScope`](../../embody/lib/scope/build-scope.ts),
composes the union of JEJ-allowed tokens at the cursor position (keywords ∪
JEJ-allowed globals ∪ scope-chain locals in identifier context; the curated
member union in dot-receiver context), then overlays the blocked-label set
[`NOT_IN_JEJ_LABELS`](../documenting/not-in-jej.ts) exported by
`../documenting/` (which itself enumerates the 10 identifier-context plus 15
dot-member-context entries from
[`BLOCKED_MEMBER_NAMES`](../../embody/lib/validating/just-enough-js.ts)) to mark
— not filter — the JEJ-blocked labels. No [`Snippet`](../../embody/types.ts) is
constructed; the F2 "no embody in editor mode" boundary that the lint adapter
preserves applies here.

## Performance

`completeJej` triggers a fresh acorn parse inside
[`validate(code)`](../../embody/lib/validating/validate.ts) on each invocation
(a "live re-parse"); the linter does the same on its own schedule. There is no
parse-sharing between the two callbacks — each invocation runs its own
validate(). CodeMirror's `autocompletion()` extension debounces invocations by
`activateOnTypingDelay` (100ms default); JEJ snippets also "fit on a single
printed page" (per [`../../README.md`](../../README.md) § Why a language level),
so the cost is bounded by the page-size invariant. No adapter-level caching is
needed at JEJ sizes.

## What lives here

```text
lib/completing/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  types.ts                        Suggestion
  collect-jej-surface.ts          request + validation result → Suggestion[]
  mark-blocked.ts                 overlay → readonly CompletionItem[]
  complete-jej.ts                 orchestrator: validate → collect → mark → freeze
  tests/
    collect-jej-surface.test.ts
    mark-blocked.test.ts
    complete-jej.test.ts
```

Non-JEJ pedagogical content (the `info`/`entry` for blocked items) lives in
`../documenting/not-in-jej.ts` — this module imports `NOT_IN_JEJ_ENTRIES` and
`NOT_IN_JEJ_LABELS` rather than carrying its own copy.

`types.ts` exists here (unlike [`../linting/`](../linting/) and
[`../formatting-editor/`](../formatting-editor/), which both skip it) because
`Suggestion` — the intermediate shape threaded between `collect-jej-surface` and
`mark-blocked` — is JEJ-internal vocabulary with no home in the editing-layer's
types.

## Public API

```ts
import completeJej from './complete-jej.js';

const items: readonly CompletionItem[] = completeJej({
	prefix,
	precedingText,
	fullText,
});
```

Signature: `(req: CompletionRequest) => readonly CompletionItem[]`. Matches the
`CompletionCallback` shape expected by the editor's `completions` option after
Phase 0 widens the contract from `(prefix: string)` to the structured request
(see
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)).
The result is a deeply frozen array.

Behavior:

- **Prefix matches nothing in the JEJ surface** (e.g. `'zz'`, `'qqq'`) → empty
  array. The completer is a pure function of the request; the editor's own
  short-circuit at the editing factory filters out empty-implicit-prefix
  invocations before they reach this callback, but an explicit Ctrl-Space with
  empty prefix reaches the callback and is treated as "show me everything
  matching prefix `''`" — which under the case-insensitive `startsWith` filter
  is every JEJ-allowed identifier at the cursor position.
- **Bare identifier context, no AST** (parse failed) → keywords ∪ JEJ-allowed
  globals, prefix-filtered (case-insensitive); blocked tokens (`var`, `class`,
  etc.) appear as blocked items if their label matches the prefix.
- **Bare identifier context, AST available** → above ∪ scope-chain locals at the
  cursor position (`type: 'local'`).
- **Dot-receiver context** (`precedingText` ends with `<identifier>.` after
  stripping whitespace on either side of the dot) → the curated member-name
  union (`type: 'member'`); blocked dot names from
  [`BLOCKED_MEMBER_NAMES`](../../embody/lib/validating/just-enough-js.ts) (15
  entries: `.split`, `.match`, `.matchAll`, `.constructor`, `.__proto__`,
  `.prototype`, `.call`, `.apply`, `.bind`, `.caller`, `.arguments`,
  `.__defineGetter__`/`__defineSetter__`/`__lookupGetter__`/`__lookupSetter__`)
  appear as blocked items, each with the rich `DocEntry` from
  [`../documenting/not-in-jej.ts`](../documenting/not-in-jej.ts).
- **Chained dot context** (`str.charAt(0).`) → falls through to the identifier
  branch (no dot suggestions; keywords + globals + locals shown). Single-level
  dot-receiver only.
- **Blocked item** → `detail: '(not in JEJ)'` inline flag in the dropdown row,
  `type: 'blocked'`, `apply: 'noop'`. No `entry` payload — rich `DocEntry`
  content surfaces through the linter's gutter-warning hover and through the
  word-hover docLookup callback, not through the autocomplete popup. (Per
  [`../documenting/not-in-jej.ts`](../documenting/not-in-jej.ts), the 25 blocked
  labels span identifier-context + dot-member-context.) `null` is the one
  allowed-but-curated case — its DocEntry lives under
  [`../documenting/keywords.ts`](../documenting/keywords.ts) as an advisory
  stumble with `isJEJ: true`; the entry teaches "use `undefined` instead"
  without blocking the keystroke.

The function never throws. `validate(code)` never throws for string input.

### Edge cases

- **Easter eggs suppressed.** Of the validator's allowed-but- undocumented
  constructs, only `eval` reaches the surface union (via `allowedGlobals`) and
  is actively filtered out. The other easter eggs (`void` as a unary operator,
  plus the node-level `LabeledStatement`, `SequenceExpression`, `WithStatement`)
  never enter the suggestion union to begin with — `void` isn't in the keyword
  or global lists, and node-level constructs aren't tokens that completion ever
  sees. Learners can still type any of them manually; the language level
  continues to accept them. See Conventions § Easter eggs are suppressed for the
  rule that makes the `eval` filter load-bearing.
- **Whitespace around dot.** `'str . '` (whitespace before and/or after the dot)
  is detected as dot-receiver context — the detection trims whitespace on both
  sides of the dot before verifying that an identifier precedes it.
- **Already-past-the-dot** (`str.split` typed in full) → the prefix is `split`
  and the precedingText ends with `str.`, so the dot-receiver branch fires and
  `split` is marked blocked via the `NOT_IN_JEJ_LABELS` overlay.
- **Bare `.`** (no receiver before the dot) → identifier branch (no dot
  suggestions). Pathological but safe.
- **Parse-error code with prior valid locals.** Once parsing fails, no AST → no
  scope locals offered. Keywords + globals still come through; learner sees
  their language vocabulary even with broken code in flight.
- **Rejected-but-parsed code** (e.g. `var x = 1`) — AST is present even though
  `validate.ok === false`; scope analysis tolerates it, so locals (including `x`
  from a `var`) DO appear. This is intentional: the learner's identifiers are
  useful even when the declaration form is outside JEJ.

## Consumers

- **Current**:
  [`../../orchestrate/editor/index.tsx`](../../orchestrate/editor/index.tsx)
  passes `completeJej` as the `completions` callback to
  [`createEditor`](../../orchestrate/lib/editing/create-editor.ts).
- **Potential**: any lens or sandbox tool wanting JEJ-curated completions over a
  code string and cursor position. The module's location at `javascript/lib/`
  (peer-independent) makes such consumption available without an upward
  dependency on `orchestrate/`.

## Why this module exists

The CodeMirror completion slot in the editor home base needs a suggestion source
that knows about the JEJ language level — both positive (what's allowed) and
pedagogical (what learners commonly reach for but isn't in JEJ, and why). The
validation feed already knows the allowed surface; the scope module already
knows the learner's identifiers; the violation-message voice already knows how
to explain "X is not in JEJ". This adapter composes those three into a single
completion-callback contract without crossing peer boundaries.

Unlike the format adapter ([`../formatting-editor/`](../formatting-editor/)),
which intentionally has no JEJ-subset gate, completions both filter to
JEJ-allowed tokens AND overlay JEJ-blocked ones — completions is where the
curriculum gets taught; format is shape cleanup independent of level. The
asymmetry is deliberate: format is a "make code look clean regardless of level"
gesture; completions is a "teach the level" gesture.

The module lives at the JEJ-package `lib/` level rather than inside
[`../../orchestrate/lib/`](../../orchestrate/lib/) so that non-orchestrator
consumers (a future "what could I type here?" lens, a vocabulary-exploration
sandbox tool) need not reach across the `lenses/` ↔ `orchestrate/` boundary. It
lives outside [`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
because `editing/` is JEJ-blind by contract — the editor knows how to dispatch a
completion callback and render the popup, but does not know what shape
"JEJ-canonical suggestions" takes.

The module lives outside `../../embody/lib/validating/` because the validator's
role is rejection-after-the-fact (does this snippet pass the language level?).
Completion is a prospective shaping role (what should we suggest next?). The two
share data (the same language-level config and the same parse) but have distinct
responsibilities.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` / `DEV.md`.
Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects. The adapter is pure
  shape composition over the validate + scope primitives.
- **No `embody()`, no `Snippet` construction.** The adapter imports
  [`validate`](../../embody/lib/validating/validate.ts) and
  [`buildScope`](../../embody/lib/scope/build-scope.ts) (through the
  `BaseResult.ast` returned by validate), but never
  [`embody()`](../../embody/index.ts), the `Snippet` type, or anything under
  `../../embody/lib/evaluating/`. The F2 "no embody in editor mode" invariant
  rests on this boundary, as with the linting adapter.
- **Easter eggs are suppressed.** `eval`, `void`, `LabeledStatement`,
  `SequenceExpression`, `WithStatement` — neither offered as suggestions nor
  marked as blocked. They remain reachable by direct typing per the validator's
  existing permissiveness, but the completer treats them as
  outside-the-curriculum (suggesting them would teach learners something we
  don't want to teach).
- **Blocked is overlay, not filter.** The blocked-marker pass adds metadata to
  suggestions whose labels match the blocklist; it does not remove items.
  Filtering would silently hide constructs learners are typing; the marker tells
  them why instead. A hover-lens alternative was considered and rejected — the
  popup is the surface the learner is already attending to when they trigger
  completion; routing JEJ rationale to a different surface reduces it to dead
  documentation.
- **Each invocation parses independently.** No parse-sharing between the
  completer and the linter. CM debounces both callbacks; each runs its own
  `validate(code)`. JEJ snippets are small enough (single printed page) that the
  cost is bounded; no adapter-level cache is introduced. Future maintainers
  chasing a shared-parse optimization should first measure on production- sized
  JEJ snippets — at expected sizes, the optimization is premature.
- **Blocked-item content sources from `../documenting/`.** The completer's
  blocked-item synthesis looks up the corresponding `DocEntry` in
  [`../documenting/not-in-jej.ts`](../documenting/not-in-jej.ts) and renders it
  through the same DOM lift the hover surface uses. This module owns the
  _positive_ JEJ surface (keywords + globals + curated members + scope-chain
  locals) and the _blocked-marker overlay_ mechanism; it does NOT own the
  non-JEJ content prose. Editing the curriculum's non-JEJ pedagogical content
  happens in `../documenting/not-in-jej.ts`, not here.

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
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md) §
  Deferred callback wiring. That file's entry for `completions` points back
  here.
- **Sibling adapters:** [`../linting/README.md`](../linting/README.md)
  (validation-feed adapter for lint diagnostics) and
  [`../formatting-editor/README.md`](../formatting-editor/README.md)
  (format-callback adapter for the canonical formatter) — the prior two
  inhabitants of this peer, sharing the same lib/-boundary rationale and ZOMBIES
  test convention.
