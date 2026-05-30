# lib/documenting

JEJ-aware hover documentation shaped as the editor's docLookup
callback. Given a hovered word, returns a frozen `DocEntry` describing
the token — JEJ keywords, JEJ-allowed globals, the curated member
surface, and the stumbling-list set of JEJ-blocked tokens carrying
full pedagogical content under a `'not in JEJ'` category badge.

This module is the **adapter** between the JEJ language level (the
keyword / global / member surface used by
[`../completing/`](../completing/) and the stumbling-list of common
reaches outside JEJ) and
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
(which consumes a `DocLookupCallback` to drive CodeMirror's
`hoverTooltip()` extension). It is callable from any peer that wants
JEJ-aware hover docs over a bare word.

## Glossary

**DocEntry** — what the callback returns. Shape (owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)):
`{ description; example?; category?; commonMistakes?; whenToUse? }`.
Only `description` is required; the editing layer's DOM lift
([`../../orchestrate/lib/editing/build-tooltip-dom.ts`](../../orchestrate/lib/editing/build-tooltip-dom.ts))
conditionally renders the optional fields.

**DocLookupCallback** — the editor's callback slot, owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts):
`(word: string) => DocEntry | null`. CodeMirror's `hoverTooltip()`
invokes the callback once per hovered word (extracted via
`view.state.wordAt(pos)`); `null` means "no tooltip for this word".

**Hovered word** — the bare word-text the editor passes to the
callback. The JEJ-side function sees only the string — no
surrounding context, no preceding `.`, no parent identifier. The
editor extracts it from CM's `wordAt(pos)`; the callback contract
is CM-blind.

**Allowed token** — in the JEJ surface. The 16 keywords come from
`KEYWORDS` in
[`../completing/collect-jej-surface.ts`](../completing/collect-jej-surface.ts);
the 16 JEJ-allowed globals come from `allowedGlobals` in
[`../../embody/lib/validating/just-enough-js.ts`](../../embody/lib/validating/just-enough-js.ts)
minus the suppressed `eval` (via `SUPPRESSED_GLOBALS` in
collect-jej-surface); the 28 curated member methods come from
`CURATED_MEMBERS` in collect-jej-surface.

**Blocked stumble** — outside the JEJ surface; the language level
rejects the construct entirely. The 12 entries come from the
"blocked stumbles" partition of the completer's
[stumbling-list](../completing/stumbling-list.ts) (see its
file-doc): `var`, `function`, `class`, `=>`, `this`, `throw`,
`try`, `import`, `async`, `await`, `split`, `match`. Each gets a
`DocEntry` with `category: 'not in JEJ'` plus the same field
richness as an allowed entry.

**Advisory stumble** — IN the JEJ surface but carries a teaching
caveat. The 2 entries are `new` ("only allowed with `Date`") and
`null` ("`undefined` is the conventional 'no value' marker; use
`null` only when you deliberately need to distinguish 'set to
nothing' from 'never set'"). These live under the allowed
keyword/global sections of the doc table (not under `'not in
JEJ'`); their caveat prose is woven into `whenToUse` or
`commonMistakes`, lifted from the stumbling-list `info` field
verbatim or paraphrased to fit the hover-entry voice.

**Voice** — editor-side inline whisper, not reference-document prose.
The voice and scope are deliberately decoupled from
[`../../reference.md`](../../reference.md) (which is the comprehensive
learner / agent-facing reference) and from MDN-style external
sources. Entries are concise (one to two sentences per field).

**`'not in JEJ'` badge** — the value of `category` for every blocked
entry. The editing layer renders `category` as a small badge above
the description; the value is opaque to the editing layer. Blocked
entries carry the same field richness as allowed ones — the badge
communicates the JEJ boundary without diminishing the pedagogical
content. JEJ scopes the editor's positive surface, not the learner's
universe.

## Performance

`documentJej` is a single object-keyed lookup against a module-level
constant table. No parse, no scope walk, no I/O, no validation.
CodeMirror's `hoverTooltip` only fires after the configured hover
delay (default 300ms) and only for word positions, so call frequency
is naturally bounded; the lookup cost is O(1) regardless.

The DOM lift in
[`../../orchestrate/lib/editing/build-tooltip-dom.ts`](../../orchestrate/lib/editing/build-tooltip-dom.ts)
constructs a fresh element per hover; that cost is owned by the
editing layer, not by this adapter.

## What lives here

```text
lib/documenting/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  document-jej.ts                 entry-point: (word) → DocEntry | null
  doc-table.ts                    assembles category sections + freezes
  keywords.ts                     16 keywords + 2 advisory stumbles
  globals.ts                      16 JEJ-allowed globals
  members.ts                      28 curated member methods
  not-in-jej.ts                   12 blocked-stumble entries
  tests/
    document-jej.test.ts
```

There is no `types.ts`: `DocEntry` and `DocLookupCallback` are owned
by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts).
This module defines no new types. Mirrors
[`../linting/`](../linting/) and
[`../formatting-editor/`](../formatting-editor/), which also skip
`types.ts` for the same reason.

The per-category split (`keywords.ts` / `globals.ts` / `members.ts`
/ `not-in-jej.ts`) is committed to from day one rather than deferred,
because the entry counts (~72 entries × 5 fields with multi-line
examples) reliably exceed single-file readability. The category
files also serve the drift-guard test described in DOCS.md
(`keywords.ts` exporting `KEYWORD_LABELS` lets the test assert
`KEYWORD_LABELS === KEYWORDS` from `collect-jej-surface.ts`).

## Public API

```ts
import documentJej from './document-jej.js';

const entry: DocEntry | null = documentJej(word);
```

Signature: `(word: string) => DocEntry | null`. Matches the
`DocLookupCallback` shape expected by the editor's `docLookup` option
(see
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)).
The returned `DocEntry` is deeply frozen (including any
`commonMistakes` array).

Behavior:

- **Unknown word** (empty string, whitespace, identifier not in the
  table) → `null`.
- **JEJ keyword** (`let`, `const`, `if`, `else`, `for`, `while`,
  `do`, `break`, `continue`, `return`, `true`, `false`, `null`,
  `new`, `typeof`, `in`) → `DocEntry` carrying a JEJ-positive
  category (e.g. `'variables'`, `'control-flow'`, `'operators'`).
  `null` and `new` are advisory stumbles: their entries live here,
  not under `'not in JEJ'`, but their caveats from
  [`../completing/stumbling-list.ts`](../completing/stumbling-list.ts)
  are woven in (see Glossary § Advisory stumble).
- **JEJ-allowed global** (`console`, `Math`, `String`, `Number`,
  `Boolean`, `Date`, `RegExp`, `BigInt`, `parseInt`, `parseFloat`,
  `alert`, `confirm`, `prompt`, `undefined`, `NaN`, `Infinity`) →
  `DocEntry` carrying a JEJ-positive category (e.g. `'i/o'`,
  `'built-in object'`, `'type conversion'`).
- **Curated member method** (the 28-entry surface mirrored from
  [`../completing/collect-jej-surface.ts`](../completing/collect-jej-surface.ts)
  `CURATED_MEMBERS`: String / Number / Math methods like `charAt`,
  `toFixed`, `floor`) → `DocEntry` carrying a method-context
  category (e.g. `'string method'`, `'math method'`).
- **Blocked stumble** (the 12-entry "blocked stumbles" partition of
  the stumbling-list: `var`, `function`, `class`, `=>`, `this`,
  `throw`, `try`, `import`, `async`, `await`, `split`, `match`)
  → `DocEntry` carrying the same field richness as an allowed entry
  (`description`, `example`, `whenToUse`, `commonMistakes`), with
  `category: 'not in JEJ'` as the visible boundary marker.
  `commonMistakes` includes the JEJ-replacement guidance ("use `let`
  or `const` instead of `var`") woven into the feature's pedagogy,
  not as a hand-wave.
- **Member name shared across host types in real JavaScript.** At
  authoring time, only the JEJ-curated receiver-context is added to
  the table. `slice` has a String entry (the JEJ-curated method);
  Array `slice` is not in JEJ's surface so it gets no entry. At
  runtime the lookup is unambiguous — at most one entry per name
  by construction (the table assembly throws on duplicate keys).
  The "JEJ-primary" framing is descriptive of the authoring
  posture, not of a runtime collision resolver. Method-context
  disambiguation (peeking back for `Math.` vs `str.`) is deferred —
  see Edge cases below.

The function never throws.

### Edge cases

- **Whitespace / empty input.** `documentJej('')`, `documentJej(' ')`
  → `null`. CM's `wordAt(pos)` does not invoke the callback for
  non-word positions, but the function handles it defensively.
- **Case sensitivity.** Lookup is case-sensitive. `Let` ≠ `let`.
  JavaScript is case-sensitive; the table mirrors that.
- **Lookup precedence.** Each word resolves to at most one entry
  (no name collisions across categories in the current JEJ surface
  — verified at authoring time and enforced by the doc-table
  assembly, which throws at module-load if duplicate keys are
  detected). If a future surface change introduces a collision, the
  authoring step must resolve it explicitly; the runtime does not
  pick.
- **Method-context ambiguity.** Bare-word lookup means a token name
  shared across multiple host types in *real JavaScript* (`slice`
  on `String` / `Array`, `indexOf` on `String` / `Array`, `length`
  on `String` / `Array`) returns the JEJ-primary entry. Parent-
  context disambiguation (peeking back through the source for
  `Math.` vs `str.`) is **deferred** — the existing
  `DocLookupCallback` contract is a bare-word callback, and the
  editor home-base wiring extracts only the bare word. A future
  widening would update the callback to receive
  `(word, parentContext?)` — surface to the user before doing so.
- **`null` / `true` / `false` are keywords, not globals.** Their
  entries live in `keywords.ts`. `null`'s entry carries the advisory
  caveat from `stumbling-list.ts` (prefer `undefined` as the
  conventional 'no value' marker); `null` is not blocked, just
  discouraged outside specific cases.
- **`function` is fully blocked, including arrow form.** JEJ has
  **no functions of any kind** — declarations (`function foo(){}`),
  expressions (`const f = function(){}`), and arrows
  (`const f = () => {}`) are all rejected by the language level.
  The stumbling-list's `function` entry says "JEJ runs as a flat
  script. Reach for inline expressions; if you find yourself
  repeating, that's a sign the exercise scope is wrong." The
  separate `=>` entry says "JEJ programs do not define functions."
  Both get full hover entries under `'not in JEJ'` teaching the
  feature plus the JEJ-rationale; neither steers the learner toward
  the other ("use arrow functions instead of `function`" would be
  pedagogically wrong here).
- **`new` is allowed only with `Date`.** `new` has a JEJ-allowed
  entry in `keywords.ts` (since the keyword itself isn't rejected)
  but its `whenToUse` / `commonMistakes` carries the advisory
  caveat from `stumbling-list.ts` ("only allowed with `Date`, e.g.
  `new Date()`; no other constructors are available").
- **Easter eggs not documented.** Validator-allowed but
  curriculum-suppressed constructs (`eval`, `void`,
  `LabeledStatement`, `SequenceExpression`, `WithStatement`) get no
  hover entry. Matches the completer's suppression policy: not
  surfaced, not taught.

## Consumers

- **Planned (this sprint)**:
  [`../../orchestrate/editor/index.tsx`](../../orchestrate/editor/index.tsx)
  will pass `documentJej` as the `docLookup` callback to
  [`createEditor`](../../orchestrate/lib/editing/create-editor.ts).
  The home-base imports currently include `lintJej`, `formatJej`,
  and `completeJej` only; `documentJej` is added as part of this
  module's landing along with the corresponding "moved from
  unwired to wired" entry in
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
  § Deferred callback wiring (which presently still points at the
  obsolete `orchestrate/lib/jej-documentation/` placeholder).
- **Potential**: any lens or sandbox tool wanting JEJ-aware hover
  docs over a code string + cursor position. The module's location
  at `javascript/lib/` (peer-independent) makes such consumption
  available without an upward dependency on `orchestrate/`.

## Why this module exists

The CodeMirror `docLookup` slot in the editor home base needs a
source of hover documentation that knows about the JEJ language
level — both positively (covering the allowed surface with
learner-voiced content) and pedagogically (covering the common-stumble
tokens with full content plus a `'not in JEJ'` badge, so learners
learn the broader JavaScript while understanding the JEJ scope).

The pedagogical premise is that JEJ scopes the **editor's positive
surface**, not the **learner's universe**. A learner hovering on
`var` in an external tutorial, in pasted code, or in their own
typed-but-blocked snippet should receive the same pedagogical depth
as for `let` — just badged as outside the JEJ curriculum. Reducing
blocked entries to stubs ("not in JEJ, use `let`") would deny the
learner the explanation they came to the editor for.

The module lives at the JEJ-package `lib/` level (peer to
[`../linting/`](../linting/),
[`../formatting-editor/`](../formatting-editor/), and
[`../completing/`](../completing/)) so that non-orchestrator
consumers (a future "hover-docs-as-a-lens" mode, a vocabulary-
exploration sandbox tool) need not reach across the
`lenses/` ↔ `orchestrate/` boundary. It lives outside
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
because `editing/` is JEJ-blind by contract — the editor knows how
to wire a `docLookup` callback into `hoverTooltip()` and lift a
`DocEntry` to DOM (see
[`build-tooltip-dom.ts`](../../orchestrate/lib/editing/build-tooltip-dom.ts)),
but does not know what shape "JEJ-canonical hover docs" takes.

The module also lives outside
[`../../embody/lib/`](../../embody/lib/). Documentation lookup is
not part of the embodiment pipeline (no validation, no execution,
no scope analysis). It is a curated knowledge layer, structurally
separate from the language-level validator and the runtime
formatter. The F2 "no embody in editor mode" invariant is preserved
trivially here — the adapter has no path into `embody()` to begin
with.

Relationship to the completer
([`../completing/`](../completing/)): the two are **complementary,
not overlapping**. The completer's `info` field carries
single-paragraph prose for the 14 stumbling-list entries that the
completer surfaces (the curated subset of blocked tokens learners
auto-complete toward); the rest of the JEJ surface — keywords,
globals, methods — gets no `info` prose from the completer. The
hover adapter covers the *entire* JEJ surface plus the blocked set
with full multi-field entries, callable on hover regardless of
whether the learner is reaching toward the token via completion or
encountering it at rest in existing code.

Relationship to [`../../reference.md`](../../reference.md): the
reference is the comprehensive doc — prose, code tables,
PseudoCode equivalents, multi-paragraph explanations. The hover
adapter is the **editor-side whisper**: 1–2 sentence description,
short example, 1–3 common mistakes, single-sentence whenToUse.
Different voice, different scope, different surface. The two are
not derived from each other; they evolve independently within the
fixed JEJ language level.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`
and `DEV.md`. Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects. The
  adapter is module-level table lookup with deep-freeze on return.
  CM's `hoverTooltip` accepts a synchronous return; we exploit
  that.
- **No `embody()`, no `Snippet` construction.** The adapter never
  imports from `../../embody/`. No validate, no scope walk, no
  parse. The lookup is purely word → DocEntry mapping. The F2
  invariant is preserved by structural impossibility, not by
  discipline.
- **Voice is editor-whisper, not reference-prose.** Entries are
  concise: one-to-two-sentence `description`, single-line or
  short multi-line `example`, one-to-three `commonMistakes`,
  one-sentence `whenToUse`. The five fields of `DocEntry` are
  deliberately short; the lift in
  [`build-tooltip-dom.ts`](../../orchestrate/lib/editing/build-tooltip-dom.ts)
  is sized for a hover popup, not a documentation page.
- **Blocked is full content + badge, not stub + badge.** Blocked-
  token entries carry the same field richness as allowed ones.
  `category: 'not in JEJ'` is the visible boundary marker; the
  rest of the entry teaches the feature. Stub entries
  (`description` only, with "not in JEJ" boilerplate) are not
  acceptable. This rule is load-bearing for the pedagogical
  premise that JEJ scopes the editor, not the learner.
- **Hardcoded curated table.** The table is not generated from
  `reference.md`, MDN, TypeScript declarations, or any external
  source. The voice and the scope are deliberately decoupled from
  reference-style sources. JEJ is fixed for now; no re-sync
  anchor is needed against an external document.
- **Deep freeze at module load, not per call.** The category
  tables and the assembled `doc-table.ts` constant are deeply
  frozen once at module load via `@utils/deep-freeze-in-place.js`
  (same utility the completer and linter use). The entry function
  returns references into that frozen table; no per-call freeze is
  needed. If a future feature requires synthesizing entries on the
  fly, freeze each synthesized object before returning. This
  differs subtly from
  [`../completing/complete-jej.ts`](../completing/complete-jej.ts),
  which builds a fresh array per call and freezes that — there the
  pipeline composes new objects every invocation.
- **Advisory stumbles live in the allowed section.** `null` and
  `new` are JEJ-allowed (they are not blocked at the language
  level), so their entries belong in `keywords.ts`, not under
  `'not in JEJ'`. Their caveat prose (lifted from
  `stumbling-list.ts` entries `'null'` and `'new'`) goes into
  `whenToUse` or `commonMistakes`. Misplacing them under
  `'not in JEJ'` would teach the wrong language-level boundary.
- **Easter eggs are suppressed.** Validator-allowed but
  curriculum-suppressed constructs (`eval`, `void`,
  `LabeledStatement`, `SequenceExpression`, `WithStatement`) get
  no hover entry. Matches the completer's suppression policy.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **`DocEntry` / `DocLookupCallback` owner:**
  [`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts).
- **DOM lift:**
  [`../../orchestrate/lib/editing/build-tooltip-dom.ts`](../../orchestrate/lib/editing/build-tooltip-dom.ts).
- **`hoverTooltip()` wiring:**
  [`../../orchestrate/lib/editing/build-extensions.ts`](../../orchestrate/lib/editing/build-extensions.ts).
- **Editor deferred-callback wiring:**
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
  § Deferred callback wiring. That file's entry for `docLookup`
  points back here (corrected from the prior
  `orchestrate/lib/jej-documentation/` placeholder).
- **Sibling adapters:**
  [`../linting/README.md`](../linting/README.md) (validation-feed
  adapter for lint diagnostics),
  [`../formatting-editor/README.md`](../formatting-editor/README.md)
  (format-callback adapter for the canonical formatter), and
  [`../completing/README.md`](../completing/README.md) (completion
  source with curated stumbling-list overlay) — the prior three
  inhabitants of this peer, sharing the same lib/-boundary
  rationale and ZOMBIES test convention.
- **JEJ keyword / global / member surface (source of truth):**
  [`../completing/collect-jej-surface.ts`](../completing/collect-jej-surface.ts)
  (allowed lists + `CURATED_MEMBERS`) and
  [`../../embody/lib/validating/just-enough-js.ts`](../../embody/lib/validating/just-enough-js.ts)
  (`allowedGlobals`, `BLOCKED_MEMBER_NAMES`). The doc table mirrors
  these at authoring time; future surface changes require manual
  re-sync.
- **Curated stumbling-list (source of blocked entries):**
  [`../completing/stumbling-list.ts`](../completing/stumbling-list.ts).
  Hover adapter's blocked-entries cover the same set with the full
  pedagogical-content expansion described above.
