# lenses/blanks

The `blanks` lens — a **fill-in-the-blank** exercise over the snippet. The lens
walks the embodiment's AST and raw token stream (two-pass derivation: AST
classifies categories, token stream supplies positions), selects tokens of
the learner-configured categories (keywords, identifiers, operators,
literals), randomly blanks a subset of them (quantity controlled by a
difficulty knob), and renders the source with input fields where the blanks
go. The learner types into the blanks; each blank is scored independently
against the original token text.

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import blanks from './index.js';

// orchestrator mounts in lens mode (illustrative):
<blanks.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'blanks'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the toolbar + the blanked source surface
  (`<div data-lens="blanks">`).
- `config(overrides?): LensConfig` — resolves the per-lens config. Fields the
  lens reads:
  - `difficulty?: number` (default `50`, range `0`–`100`) — probability that any
    eligible token gets blanked. `0` blanks none; `100` blanks all eligible
    tokens. Higher difficulty = more blanks.
  - `tokenCategories?: ReadonlyArray<TokenCategory>` (default
    `['keywords', 'identifiers', 'operators', 'literals']`) — which categories
    of tokens are eligible for blanking. Empty array → zero blanks. At the
    `LensConfig` boundary this is a `ReadonlyArray<string>`; `TokenCategory`
    is the lens-local string-literal-union narrowing for internal use, open-
    shape per [`../types.ts`](../types.ts).
  - `seed?: number` — seeds the deterministic blank selection. When unset,
    the wrapper computes a per-mount random seed at first render (via
    `useMemo([])`) so each mount produces a fresh exercise; when set,
    the same snippet + config produces the same blanks (useful for tests
    or a "retry this exact exercise" affordance). The core's selection
    function is pure; the wrapper owns the non-determinism source.
  - Anything else passed in is preserved (config is open-shape per
    [`../types.ts`](../types.ts) `LensConfig`).
- `applicableTo(embodiment): boolean` — returns `embodiment.status.parsed`.
  **Tier 2 (AST-dependent)** per [`../README.md`](../README.md) § Three-tier
  classification: the lens needs a valid AST to identify tokens by category. A
  parse-failed snippet has no AST to walk.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]` for
  this batch. Block-Model placement contributions land once the WS2 analysis
  pipeline ships per
  [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md).
  See [Future direction](#future-direction).

## Why this lens exists

The `blanks` lens is the learner's **fill-in-the-blank workbench**: a piece of
JEJ source is rendered with selected tokens removed, and the learner types the
missing tokens back in. Pedagogically it serves the surface-level comprehension
goal — recognizing language elements (a keyword goes here, an operator goes
here) and reproducing syntax fluency.

The lens is Tier 2 because token categorization needs the AST: the AST walk
tells us which keywords / operators / identifiers / literals are present in
which syntactic contexts. The actual position-and-text-to-blank comes from
the raw token stream (`embodiment.raw.tokens`), which is also available once
`status.parsed === true` (per the monotonic-chain `parsed ⇒ tokenized`).
A purely text-based blanking (e.g. "remove every fourth word") would be
Tier 1 but loses the pedagogical specificity — the value here is that the
learner sees gaps that correspond to named language concepts.

Difficulty is **probability**, not count. A snippet with three eligible tokens
at difficulty 50 might produce one blank, two blanks, or all three blanks
across different snippets — the knob calibrates expected density, not exact
quantity. This matches the prior-art behavior and avoids a brittle "exactly N
blanks" contract that would need re-tuning per snippet length.

## Glossary

- **Token** — one identifiable unit of source extracted from the AST or token
  stream. Each token has a category, a text (the source substring), and a
  source range.
- **Token category** — one of `keywords` / `identifiers` / `operators` /
  `literals`. The four categories the learner can toggle on or off for
  blanking. Categorization is **AST-classified + token-stream-positioned**
  (see § Token categorization); each entry below describes what the AST
  walker classifies as belonging to that category.
  - `keywords` — tokens whose Acorn token type is a keyword (`let`, `const`,
    `if`, `else`, `return`, `for`, `while`, `break`, `continue`, `switch`,
    `case`, `default`, `do`, `function`, `class`, `extends`, `new`, `delete`,
    `typeof`, `instanceof`, `in`, `of`, `void`, `throw`, `try`, `catch`,
    `finally`, `true`, `false`, `null`, `this`, `super`). The AST walker
    confirms which keyword tokens belong to syntactic positions the lens
    surfaces (e.g. `else` only when the parent `IfStatement` has an
    `alternate`).
  - `identifiers` — `Identifier` AST nodes (variable names, parameter names,
    member-access names).
  - `operators` — operator strings from `BinaryExpression`,
    `LogicalExpression`, `UnaryExpression`, `UpdateExpression`,
    `AssignmentExpression` nodes; the matching operator-character range is
    looked up via the raw token stream.
  - `literals` — `Literal` AST nodes (numbers, strings, booleans, `null`).
- **Eligible token** — a token whose category is enabled in
  `config.tokenCategories`. Only eligible tokens are candidates for blanking.
- **Blank** — an eligible token that the lens has selected for removal. The
  blank is rendered as an `<input>` element at the token's source position.
- **Difficulty** — the probability (`0`–`100`, mapped to `0`–`1`) that any
  eligible token becomes a blank. Independently rolled per token, seeded so
  the selection is deterministic given snippet + config.
- **Display source** — the rendering produced by the lens: the original source
  text with blanks replaced by `<input>` elements. Other characters render
  verbatim.
- **Answer** — the original token text for one blank (e.g. `"let"`, `"+"`,
  `"42"`). Sourced verbatim from Acorn's token range — operator answers are
  the operator characters only (`"+"`, `"=="`, `"&&"`), with no surrounding
  whitespace; string-literal answers include their delimiters (`"'hi'"`),
  matching Acorn's raw `value` for the token. Used as the comparison
  target for correctness.
- **Learner answer** — the text the learner has typed into one blank's input.
- **Correctness** — one of `unfilled` / `correct` / `incorrect`, computed per
  blank by comparing the learner answer to the answer. Case-sensitive,
  whitespace-trimmed.
- **Score** — the percentage of blanks that are `correct`. `0` when there are
  no blanks (degenerate snippets, all-categories-disabled config).

## UI structure

```text
<div data-lens="blanks">
  <div data-blanks-toolbar>             — difficulty slider, category checkboxes, score readout
  <pre data-blanks-display>             — the blanked source surface
    <code>
      …<span>keyword</span> <input data-blank-index="0" />…
    </code>
  </pre>
</div>
```

- The root carries `data-lens="blanks"` (the lenses-peer invariant per
  [`../DOCS.md` § Structural constraints](../DOCS.md)).
- `data-blanks-toolbar`, `data-blanks-display`, and `data-blank-index="N"` are
  sandbox-harness selectors and per-lens CSS hooks; renaming them is a
  contract change.
- The display surface is **read-only** for non-blank characters; only the
  `<input>` blanks accept learner edits. This preserves the lenses peer's
  single-writer invariant — the lens never writes back to snippet state.

## Display-fragment shape

`derive-blanks.ts` returns a flat ordered sequence of fragments. Each
fragment is one of:

- `{ kind: 'text'; text: string }` — a verbatim source substring (may
  contain newlines, indentation, comments, and any non-blanked tokens).
- `{ kind: 'blank'; index: number; answer: string }` — a blank at this
  position. `index` is 0-based and used for the input's `data-blank-index`
  attribute; `answer` is the original token text used by
  `validate-answer.ts` for correctness comparison.

Per-line grouping (line-number gutter rendering, etc.) is the wrapper's
concern, not the core's. The flat sequence reconstructs the source
byte-for-byte when the `text` fragments and the `answer` of each `blank`
fragment concatenate in order.

## Tier classification + Block Model placement

**Tier 2** per [`../README.md`](../README.md) § Three-tier classification:
`applicableTo` returns `embodiment.status.parsed`. A parse-failed snippet has
no AST; the lens cannot identify token categories without one.

In v1 the lens **does not occupy any Block Model cells** because
`recommend()` returns `[]` (see [Future direction](#future-direction)).
The intended cells, once `recommend()` ships substance, are:

- `{ level: 'surface', scope: 'atoms' }` — when only `keywords` or only
  `operators` are eligible (the learner is reading individual tokens).
- `{ level: 'surface', scope: 'blocks' }` — when `identifiers` or `literals`
  are eligible (the learner is reading expressions / declarations as a
  whole).

Cell shapes per the canonical `BlockModelCell` type at
[`../types.ts`](../types.ts) (`{ level, scope, nmComponents? }`). Per the
multi-variant pattern in
[`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md)
§ Lens design patterns, a single lens can suggest multiple recommendations
at different cells with different configs.

## Token categorization

Token categorization is a **two-pass derivation** combining the AST and
the raw token stream:

1. **Classify (AST walk).** Walk `embodiment.raw.ast` (Acorn `Program`) to
   build a category map keyed by source range: `Identifier` nodes →
   `identifiers`; `Literal` nodes → `literals`; operator-bearing nodes →
   `operators`; keyword-bearing syntactic positions (via the parent node's
   shape: `IfStatement.alternate ≠ null` ⇒ the `else` token is
   classifiable as `keywords`; `ForOfStatement` ⇒ the `for` AND `of`
   tokens are; etc.) → `keywords`.
2. **Position (token-stream walk).** Walk `embodiment.raw.tokens` (Acorn
   tokens) once. For each token, look up its category by source range
   against the classifier output. The token gives the authoritative
   position-and-text; the AST gives the category.

Why two passes: not every keyword corresponds to the **start** of an AST
node (e.g. `else`, `extends`, `of`, `case`, `default`, `catch`,
`finally`, `in`, `instanceof`). Acorn's token stream lexes every
syntactic marker including these; the AST walk identifies which of them
the lens should surface for blanking based on the surrounding node's
shape. The token stream's positions are what the lens's display fragments
use to interleave `<input>` elements with verbatim text.

Both passes run only when `embodiment.status.parsed === true` (gated by
`applicableTo`). The chain `parsed ⇒ tokenized` (per
[`../../embody/types.ts`](../../embody/types.ts) § Status booleans)
guarantees `embodiment.raw.tokens` is non-null in this branch.

## Validation contract

- Per-blank comparison: the learner answer is `String.prototype.trim`-ed and
  compared via strict equality to the answer. The answer is the verbatim
  source range of the original token (no whitespace stripping internal to
  the token, no operator-equivalence relaxation — `==` and `===` are
  distinct answers).
- `unfilled` — the input is empty (or whitespace-only) after trim.
- `correct` — the trimmed learner answer equals the answer.
- `incorrect` — the trimmed learner answer is non-empty and does not equal
  the answer.
- Score = `Math.round(correctCount / blankCount * 100)`. When `blankCount`
  is `0`, score is `0` (no exercise to grade).
- Validation is **synchronous and pure** in `validate-answer.ts`. The
  wrapper runs it on learner-input changes; debounce is a wrapper-internal
  optimization (not a contract). v1 ships without debounce — per-blank
  comparison is keystroke-cheap (`trim` + strict equality).
- The toolbar's score readout makes the strict-match contract explicit so
  learners self-correct rather than rage at the system when (e.g.) `==` is
  marked incorrect against a `===` answer. See § Future direction for the
  deferred operator-equivalence relaxation.

## What this lens does NOT do

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art `BlanksLens.jsx`:

- **No CodeMirror editor.** The prior art embedded a writable CodeMirror
  instance for typing. V2 uses `<input>` elements at blank positions inside a
  static `<pre><code>` surface — the lens is read-only for non-blank
  characters, satisfying the lenses peer's single-writer invariant.
- **No "complete code" view toggle.** The prior art let the learner toggle
  between the blanked display and the unblanked original. In V2 the editor
  mode IS the unblanked original — the orchestrator's mode-switch covers that
  affordance; the lens does not duplicate it.
- **No URL config sync.** The prior art read `?blanks=difficulty:50,types:…`
  from the URL. Config in V2 is supplied via `LensProps.config`; URL parsing
  is the plugin's / orchestrator's job, not the lens's.
- **No "ask me" question-generation button.** The prior art embedded an
  `askOpenEnded` call. Question generation is a future sibling lens.
- **No external `blankenate()` script load.** The prior art loaded a separate
  `blankenate.js` from a static path. The V2 algorithm is inline pure TS
  inside `core.ts` — no async setup, no global side effects.
- **No hints panel.** The prior art's hints panel was commented out in the
  shipped UI. V2 ships without it; restoration is its own future increment.
- **No `__` placeholder convention.** The legacy embedded literal `__`
  tokens in the rendered source as "fill these in here" markers. V2 uses
  `<input>` elements at blank positions; the source surface does not
  contain `__` markers. Curriculum content that says "fill in the `__`"
  needs updating to "fill in the blank" or "fill in the input field".

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper).
The core is split by responsibility for testability:

- `index.tsx` (wrapper) — React component, the `LensModule.Component`. Owns
  per-mount UI state (the learner answers, the selected categories, the
  difficulty value, the resolved seed) and composes the core's pure
  derivations into the surface.
- `core.ts` (core) — exposes `config`, `applicableTo`, `recommend` for the
  `LensModule` literal in `index.tsx`. No React imports.
- `derive-blanks.ts` (core) — pure:
  `(embodiment, difficulty, tokenCategories, seed) → BlanksDerivation`.
  Performs the two-pass derivation (AST classify + token-stream position),
  runs the seeded selection, returns the per-blank metadata + the flat
  display fragments the wrapper renders.
- `validate-answer.ts` (core) — pure: `(answer, learnerAnswer) → Correctness`.
  Per-blank correctness primitive; the wrapper aggregates into the score.
- `types.ts` (both) — lens-local types: `TokenCategory`, `Blank`,
  `DisplayFragment`, `BlanksDerivation`, `Correctness`, `BlanksLensConfig`.

`config`, `applicableTo`, and `recommend` are **inlined into `core.ts`**
rather than split into separate files
([`04-lens-migration.md` § Lens file structure](../../.planning-handoffs/04-lens-migration.md)
documents the alternative split). Justification: each body is trivial
(`config` = `freezeInPlace({...defaults, ...overrides})`, `applicableTo`
= a one-liner status-boolean read, `recommend` = `() => []` for v1) and
the indirection cost of three additional files outweighs the
per-surface testability gain. Follows the
[`../annotate/core.ts`](../annotate/core.ts) precedent.

Tests split: `tests/derive-blanks.test.ts`, `tests/validate-answer.test.ts`,
`tests/core.test.ts` (vitest, no jsdom); `tests/component.test.tsx`
(vitest + jsdom + `@testing-library/react`).

## Future direction

- **WS2 `recommend()`** — this lens ships with `recommend: () => []`, which
  means it **appears in the picker but not in the recommendations panel** until
  WS2 ships. Once the analysis surface lands, `recommend(embodiment)` populates
  Block-Model placements per § Tier classification + Block Model placement.
- **Hints panel restoration** — the prior art's easy/medium/hard hint tiers
  (based on difficulty) were commented out at migration. Restoration is its
  own follow-up increment.
- **Per-fence blanks override** — a learner-author-supplied "blank these
  specific tokens" override (vs. category-based random selection) is a clean
  extension; deferred until a curriculum need surfaces.
- **Operator partial-match scoring** — strict equality may be too harsh for
  some operator categories (`==` vs `===`, `&&` vs `&`); a follow-up may
  introduce category-aware comparison rules.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="blanks"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state; React owns the lifecycle.
  Learner answers exist only between mount and unmount.
- **Read-only views** — the lens never mutates `embodiment` or `config`. The
  `<input>` blanks are local React state; they do not propagate to snippet
  state.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes (in particular `status.parsed`,
  `raw.ast`, `raw.tokens`, `source.code`).
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="blanks"` dispatch path.
- **Lens-migration plan**:
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
- **Prior art**:
  [`0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses/BlanksLens.jsx`](../../../../../../../0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses/BlanksLens.jsx)
  (React component with CodeMirror integration) and
  [`0-study-lenses-committee/zz--study-lenses-package--2025-try/00-repo--study-lenses/lenses/blanks/`](../../../../../../../0-study-lenses-committee/zz--study-lenses-package--2025-try/00-repo--study-lenses/lenses/blanks/)
  (WC kit with the `blankenate` external library).
