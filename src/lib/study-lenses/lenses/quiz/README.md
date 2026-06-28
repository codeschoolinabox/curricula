# lenses/quiz

The `quiz` lens — a **click-an-element, answer-a-question, get-graded** study
surface over a frozen snippet. The learner sees the source code rendered
read-only and **un-colorized** (syntax highlighting is deliberately off — the
lens's own decorations carry the only meaning) inside a CodeMirror editor. Every
syntax element is a clickable **anchor**; clicking one opens a **panel** holding
the auto-gradable question(s) for that element. The learner answers; the lens
**grades** the response against machine-derived ground truth and surfaces
feedback in the notional-machine (NM) vocabulary.

`quiz` is the **closed / gradable** complement to the **open / Socratic**
register (`socratizing`, surfaced via the planned `ask` lens — both are Tier-2
source lenses; see [`../README.md` § Three-tier classification](../README.md)).
Where `ask` poses open prompts a human judges, `quiz` poses questions a machine
grades: each `QuizItem` carries its own answer key, so the feedback loop is
immediate and unmediated.

It is a **consumer** of two pure peer modules — it never re-implements them:

- [`lib/classifying`](../../lib/classifying/README.md) (`classifyTokens`) —
  turns the snippet into one `ClassifiedToken` per source token (category × role
  × range). The lens's clickable anchors **are** these token ranges.
- [`lib/quizzing`](../../lib/quizzing/README.md) (`generateQuiz` / `grade`) —
  turns the snippet + its classified tokens into `QuizItem`s, and grades a
  `LearnerResponse` to a `Verdict`.

> **Campaign scope.** This lens is built in slices (see the campaign plan).
> **Slice A** ships the interaction loop end-to-end for one question form: **V1
> category-ID** (`mcq` — "what kind of syntax element is this?"). The lens's
> mechanic is **form-agnostic** — it renders whatever `generateQuiz` emits and
> grades via `grade` — so later slices add question forms, code-as-answer modes,
> mastery decorations, earned propagation, and config knobs **without re-shaping
> this contract**. What Slice A defers is marked throughout (§ Slice A scope, §
> What this lens does NOT do, § Future direction).

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import quiz from './index.js';

// orchestrator mounts in lens mode:
<quiz.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'quiz'` — registry identity.
- `phase: 'source'` — the phases-panel station this lens teaches. Like `blanks`,
  it consumes the AST (via `classifyTokens`) but its **pedagogical target** is
  the source / text surface (the "what is this element?" question lives at the
  code's text surface). Without `phase` the lens is panel-excluded.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders `<div data-lens="quiz">` with the read-only un-colorized
  editor, the question panel, and the verdict region.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` —
  [`../types.ts`](../types.ts) admits only primitives and primitive arrays);
  unknown keys in `overrides` are spread through unchanged (open-shape
  contract). Slice A reads no required knobs (V1 has none); the config surface
  widens with the catalog (see [`./types.ts`](./types.ts) `QuizLensConfig` + §
  Future direction). Encode any future knobs as flat primitives / primitive
  arrays (e.g. `categories: ['identifier', …]`) — never nested objects.
- `applicableTo(embodiment): boolean` — returns `embodiment.status.parsed`
  (**Tier 2** per [`../README.md`](../README.md) § Three-tier classification).
  The lens needs tokens + AST to classify and to generate questions; an
  unparseable snippet has neither. (`status.validated` — JEJ-subset compliance —
  lives only here, for a future tightening; nothing calls `applicableTo` today,
  so the Component also gates on `status.parsed` itself — see § Edge cases.)
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns the frozen
  empty array in Slice A. Real Block-Model-cell coverage recommendations are the
  final increment (it maps `QuizItem.cells` → `Recommendation.blockModelCell`;
  see § Glossary homonym + § Future direction).

## Why this lens exists

`quiz` operationalizes the **Block Model** (Schulte 2008) as a clickable,
gradable surface: every syntax element becomes a probe into "what do you
understand about THIS, here?" The question forms (supplied by `lib/quizzing`)
span the Block Model's text-surface and execution dimensions at the atom /
relation / block levels — category identity, usage kind, declaration site,
scope, lifecycle — each with machine-derivable ground truth. JEJ, the NM, and
`embody` were designed to make exactly these facts statically decidable;
question copy uses NM vocabulary and visuals (`ƒ`, "register of methods",
creation phase, TDZ).

The pedagogical pairing is deliberate: `quiz` (this lens, closed register) and
`ask` (the Socratic open register over `socratizing`) are the two faces of the
same snippet. Closed questions verify recognition and recall with instant binary
feedback; open questions provoke explanation a human reads. A learner moves
between them on the same code.

Mastery is **earned and shown per element**, via progress-based, **non-color-
reliant** highlighting (the two-channel decoration — see § Glossary). The
mastery mechanic is Slice-B work (inc 5+); Slice A ships the per-answer verdict
only, but the **contract** for mastery is fixed in Phase 0
([`./types.ts`](./types.ts) `MasteryState`) so the fold lands against a stable
shape.

## Glossary

- **Anchor** — a clickable source element: a `ClassifiedToken`'s `[start, end)`
  range. The full classified-token stream is the anchor set. **Resolution has
  two pure steps** (both in `lib/anchors.ts`): _token resolution_ —
  `anchorAt(offset, classified)` maps a document offset to the token whose
  half-open range contains it (drives the highlight); and _item resolution_ —
  `itemsAt(items, anchorRange)` maps that range to the quiz item(s) whose
  `anchorRange` matches it (drives the panel). The two are distinct because the
  generated stream can carry several items per range (see § Form scoping). Slice
  A anchors off `anchorRange` (V1 is **token-anchored** and carries no
  `anchorPath`); the node-anchored forms `generateQuiz` also returns are
  filtered out (§ Form scoping), so `anchorPath` goes unread until a later slice
  surfaces a node-anchored form.
- **Panel** — the question surface for the picked anchor. Holds the item(s)
  `itemsAt` resolves for that range; when a range carries more than one item,
  the panel presents **answer-neutral tabs** (the tab labels never reveal or
  hint the answer). After Slice A's V1 form-scoping filter (§ Form scoping)
  every anchor carries exactly one item, so the panel renders single-item; the
  tab path is wired in the contract but exercised only when later slices add
  co-anchored forms.
- **Quiz item** — a `QuizItem` from `lib/quizzing` (read its
  [`types.ts`](../../lib/quizzing/types.ts) live — it is the moving seam). A
  fully resolved question carrying its own ground truth: `prompt`,
  `anchorRange`, `groupKey`, `cells`, `feedback`, and a mode-specific answer
  key. Slice A consumes only the `mcq` variant (`McqQuizItem`: `options` +
  `answerOptionIds`).
- **Verdict** — the outcome of `grade(item, response)`: `correct` / `incorrect`
  (with NM `feedback`) or `malformed` (a caller / UI bug — a mode mismatch or
  unknown option id; `grade` is total and never throws, and mastery is never
  penalized for `malformed`). The lens builds the response from the clicked
  `option.id` verbatim, so normal play never grades `malformed`.
- **Group key** — `QuizItem.groupKey`: the mastery / propagation axis, a
  namespaced string (`category:<category>[:<role>]`, `binding:…`, `usage:…`).
  Mastery folds verdicts **per `groupKey`**; "earned propagation" (a later
  increment) bulk-credits a `groupKey` when a sameness item's `unlocks` names
  it.
- **Mastery — two channels.** Per-`groupKey` state with **two orthogonal,
  color-free visual channels** so a learner with color-vision deficiency reads
  both: (1) **progress** — a monotonic accrual (how much of this group is
  mastered), rendered as a non-hue cue (e.g. underline density / fill); (2) a
  **wrongness mark** — an outstanding "got one wrong, not yet re-earned" flag,
  rendered on an independent non-hue axis. The encoding is fixed in
  [`./types.ts`](./types.ts): `GroupMastery = { progress, wrong }`, and
  `MasteryState` keys one `GroupMastery` per `groupKey`. The fold signature is
  `MasteryFold = (prior: MasteryState, item: QuizItem, verdict: Verdict) → MasteryState`
  (a `malformed` verdict is a no-op — mastery is never penalized for a UI bug).
  Progress is monotonic-up (a correct answer accrues; propagation bulk-credits);
  `wrong` toggles on an `incorrect` and clears on re-mastery. The fold that
  populates it is inc 5 (Slice B), not Slice A — Phase 0 fixes only the shape.
  _(The progress curve is **0..1 accrual** — ruled at the Phase-0 human gate
  2026-06-28, over a consecutive-correct counter or a threshold-to-unlock. The
  type pins the range + monotonic intent; inc 5's fold implements the accrual.)_
- **Earned propagation** — completing a "sameness" question (e.g. "click every
  occurrence of this variable") bulk-credits the `groupKey`s its `unlocks`
  names, so mastery shown on one element spreads to its propagation peers.
  Slice-B work; the data (`unlocks`) is already on the item.
- **Block-Model homonym** (load-bearing — two `*Cell` types, do not conflate):
  - **`BlockCell`** (socratizing —
    [`../../orchestrate/lib/socratizing/types.ts`](../../orchestrate/lib/socratizing/types.ts)):
    `{ dimension: 'text-surface' | 'execution' | 'purpose'; level: 'atom' | 'block' | 'relation' | 'macro' }`.
    This is what `QuizItem.cells` carries, and therefore **the vocabulary this
    lens displays** (carried through verbatim; Slice A's V1 items are
    `[{ dimension: 'text-surface', level: 'atom' }]`).
  - **`BlockModelCell`** (the recommender — [`../types.ts`](../types.ts)):
    `{ level: 'surface' | 'execution' | 'function'; scope: 'atoms' | 'blocks' | 'relations' | 'macro'; nmComponents? }`.
    This is what `Recommendation` carries. The two axes are **non-isomorphic**
    (`dimension` ≠ `level`, `level` ≠ `scope`). The lens's final increment
    (`recommend()`) is where the **mapping** `BlockCell → BlockModelCell` is
    applied; Slice A does **not** map (it returns `[]`). This glossary fixes
    which-is-which and names that future mapping.

## UI structure

```text
<div data-lens="quiz">
  <main data-quiz-editor>            — read-only, un-colorized CodeMirror EditorView
                                       (EditorView.editable.of(false) + EditorState.readOnly.of(true);
                                       NO javascript()/oneDark/syntaxHighlighting — black-on-white).
                                       Clicking a token highlights that anchor (a Decoration.mark).
  <aside data-quiz-panel>            — the picked anchor's question(s): prompt + options.
                                       Answer-neutral tabs when >1 item. Absent until an anchor is picked.
    <button data-quiz-option="<optionId>"> ... </button>   — one per option; the click builds the mcq response.
    <div data-quiz-verdict="correct|incorrect|malformed">  — feedback after an answer; reset on re-pick.
  OR (unparseable snippet):
  <div data-quiz-fallback role="alert">  — "needs parseable code" notice (no editor).
</div>
```

`data-lens="quiz"` on the root is the lenses-peer invariant (load-bearing for
sandbox-harness selectors). The `data-quiz-*` attributes are sandbox selectors +
CSS hooks; renaming them is a contract change.

## Interaction contract

1. **Mount** — the wrapper reads `embodiment.source.code`; on `status.parsed` it
   derives the classified tokens (anchors) and the quiz items — running
   `generateQuiz` and **filtering to `form === 'V1'`** (§ Form scoping) — then
   mounts the read-only un-colorized editor. On `!status.parsed` it renders the
   fallback.
2. **Pick** — a click in the editor resolves to a document offset
   (`view.posAtCoords`), then to the anchor token whose `[start, end)` contains
   it (`anchorAt`, binary search). The picked token highlights; the panel opens
   with the item(s) `itemsAt` resolves for that range (one V1 item in Slice A).
   A click outside any token clears the selection.
3. **Answer** — selecting an option builds a `LearnerResponse`
   (`{ mode: 'mcq', selectedOptionIds: [option.id] }`) and calls `grade`. The
   verdict's `feedback` shows; the answer key is never echoed (the lens reveals
   it from the item it already holds, never from the `Verdict`).
4. **Re-pick** — picking a different anchor resets the panel + verdict. All of
   this is per-mount React state — **disposable practice** (no persistence).

## Slice A scope

Ships now (inc 1–4):

- The `LensModule` skeleton (registered; `phase: 'source'`; `recommend → []`).
- Read-only, un-colorized CodeMirror rendering the snippet; a fallback for
  unparseable snippets.
- Clickable classified-token anchors with single-anchor highlight.
- The question panel for the picked anchor (V1 prompt + 5 category options).
- Answer → `grade('mcq')` → verdict feedback. **This is the live V1 milestone.**

### Form scoping

`generateQuiz` runs the **full generator registry** — today
`[V1 category-ID, V7 usage-kind, V8 declaration-site]` (read it live:
[`../../lib/quizzing/generators/registry.ts`](../../lib/quizzing/generators/registry.ts))
— so its output is a **mixed-form stream**, not V1 alone. On `let x = 5` it
returns V1 `mcq` items for every token **plus** a V7 `mcq` item on `x` ("how is
this variable used here?") **plus** a V8 `click-token` item. V1 and V7 are both
`mode: 'mcq'` and both `family: 'variables'`, so neither a `mode` filter nor the
upstream `QuizFilter` can isolate V1.

Slice A's `lib/build-quiz.ts` therefore filters the `generateQuiz` output to
**`item.form === 'V1'`** — the single text-surface × atom category-ID form. This
is the one place the lens narrows the moving `generateQuiz` contract to its
current capability; later slices **widen** the filter (admit V7 → inc 5/6, V8 →
inc 6) rather than re-shaping the panel. The V1 filter is also exactly what
makes the **never-`malformed`-in-normal-play** guarantee hold: no `click-token`
item (V8) ever reaches the `mcq` panel, and only one `mcq` form (V1) is rendered
per anchor (so `itemsAt` yields one item, no tabs). Without it, clicking an
identifier would surface V1 + V7 co-anchored, and clicking a declaration would
hand a `click-token` item to an `mcq` panel.

The `QuizLensConfig`, `MasteryState`, and the `MasteryFold` **signature** are
defined in Phase 0 ([`./types.ts`](./types.ts)) so the full contract is
captured, but Slice A does **not** implement the mastery fold, code-as-answer
modes, propagation, config filtering, or `recommend`.

## Edge cases

- **Unparseable snippet** (`embodiment.status.parsed === false`). `applicableTo`
  returns `false` — so the lens is excluded once per-lens applicability gating
  lands (a backlogged orchestrator seam; nothing consults `applicableTo` before
  mount today). **Today the Component's own `status.parsed` gate is
  load-bearing:** it renders the `data-quiz-fallback` notice ("`quiz` needs
  parseable code") instead of the editor, and never calls `generateQuiz` (which
  throws on unparsed) off the happy path. The internal re-parse returning `null`
  is a second guard.
- **Empty source** (`embodiment.source.code === ''`). Parses to zero tokens → no
  anchors. The editor renders empty; clicking does nothing; no panel. A neutral,
  non-error state.
- **Click outside any token** (whitespace, gutter). `posAtCoords` may return an
  offset that no token's `[start, end)` contains (or `null`); the lens clears
  the selection — no panel, no error.
- **`malformed` verdict.** Only reachable via a mode mismatch or an option id
  not on the item. The lens constructs responses from `option.id` against the
  item's own options, so normal play never triggers it; if it occurs (a wiring
  bug) the verdict region shows the diagnostic and mastery is untouched.

## What this lens does NOT do (Slice A drops + lens-specific)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top runtime imports, no branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Beyond those:

- **No mastery accrual or decorations** (inc 5). Slice A shows the per-answer
  verdict; it does not fold verdicts into `MasteryState` or paint the
  two-channel decoration. The contract is defined; the implementation is
  deferred.
- **No code-as-answer modes** (inc 6). The registry already emits V8
  `click-token` items into the `generateQuiz` stream, but the V1 form-scope
  filters them out (§ Form scoping); Slice A captures only `mcq`. `click-line` /
  `select-in-code` are later-form work.
- **No `multi-mcq`** — `generateQuiz` does not emit it yet; Slice A is single-
  select.
- **No earned propagation** (inc 7). `unlocks` is carried on items but not acted
  on.
- **No config filtering** (inc 8). The `QuizFilter` toolbar (category / cell
  knobs) is deferred; `generateQuiz`'s `filter` is a no-op upstream today
  anyway.
- **No `recommend()`** (final inc). Returns `[]`; the
  `BlockCell → BlockModelCell` mapping is future work.
- **No snippet mutation.** The editor is read-only; the lens never calls the
  orchestrator's snippet setter (single-writer invariant). All learner state is
  per-mount.
- **No syntax coloring.** The editor is un-colorized by design — the lens's
  decorations are the only visual signal.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers:

- `index.tsx` (wrapper) — React `Component`; the read-only un-colorized
  CodeMirror, click capture, panel, and verdict; owns per-mount UI state;
  freezes and default-exports the `LensModule`.
- `core.ts` (core) — `LensModule` defaults: `config`, `applicableTo`,
  `recommend` (and, in Slice B, the pure mastery fold). No React.
- `lib/build-quiz.ts` (core) — parses the snippet (Acorn), delegates
  classification to `lib/classifying`, calls `generateQuiz`, **filters the
  mixed-form output to `form === 'V1'`** (§ Form scoping), and returns
  `{ classified, items }` (or `null` on internal parse failure). The single
  re-parse site. No React.
- `lib/anchors.ts` (core) — the pure resolution layer:
  `anchorAt(offset, classified)` (token resolution, binary search over the token
  ranges, for the highlight) and `itemsAt(items, anchorRange)` (item resolution,
  the panel's item(s) for a range). Pure and **CM-independent** (so it serves
  both the CodeMirror path and the span-render fallback unchanged). No React.
- `types.ts` (shared) — `QuizLensConfig`, `GroupMastery`, `MasteryState`,
  `MasteryFold` (signature; deferred), `PickedAnchor`.

Tests split: `tests/{core,build-quiz,anchors}.test.ts` (vitest, no jsdom) +
`tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).

## Dependencies (no install needed)

- **`acorn`** — already in `package.json`; `lib/build-quiz.ts` imports it
  directly (and `lib/classifying` consumes the resulting tokens + AST).
- **`@codemirror/view`, `@codemirror/state`, `codemirror`** — already in
  `package.json` (used by the editor and the other lenses). The quiz lens
  deliberately does **not** depend on `@codemirror/lang-javascript` /
  `@codemirror/theme-one-dark` for display — it omits them to stay un-colorized.

## Future direction

- **Mastery fold + two-channel decorations** (inc 5) — implement `MasteryFold`;
  paint per-`groupKey` progress + wrongness on the editor via CodeMirror
  decorations on the two color-free channels.
- **Code-as-answer modes** (inc 6) — capture `click-token` / `click-line` clicks
  and `select-in-code` multi-select-and-confirm; grade via the existing `grade`
  range-set-equality arms.
- **Earned propagation** (inc 7) — act on `unlocks`: a passed sameness item
  bulk-completes the `groupKey`s it names.
- **Config knobs** (inc 8) — a toolbar (category / cell filters) → `QuizFilter`,
  once `generateQuiz` honors `filter` upstream.
- **Real `recommend()`** (final inc) — a Block-Model-cell coverage report mapped
  from `QuizItem.cells` (`BlockCell`) to `Recommendation.blockModelCell`
  (`BlockModelCell`).
- **Consume `embodiment.raw.{tokens,ast}` directly** — Slice A re-parses
  internally (the `blanks` posture: `raw.*` is nullable `RawAcorn`, so consuming
  it needs a narrowing cast). Plumbing the upstream parse through would drop the
  double-parse; deferred until the contract is stable.
- **Span-render display fallback** — if read-only-CodeMirror click capture
  proves fragile, render the code as one clickable `<span>` per classified
  token; the pure `anchorAt` resolution is reused unchanged.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="quiz"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state for picked anchor, answers, or
  mastery; React owns the lifecycle.
- **Read-only view** — the lens never mutates `embodiment` or `config`; the
  CodeMirror editor is non-editable and never writes to the orchestrator's
  snippet.
- **No branching on `embodiment.source.code`** — the lens _renders_
  `source.code` (legitimate) but discriminates only on
  `embodiment.status.parsed`.
- **Tier 2 classification** — `applicableTo` returns `embodiment.status.parsed`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Consumed — classification**:
  [`../../lib/classifying/README.md`](../../lib/classifying/README.md).
- **Consumed — quiz generation + grading**:
  [`../../lib/quizzing/README.md`](../../lib/quizzing/README.md).
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes.
- **Structural template (reference)**:
  [`../blanks/README.md`](../blanks/README.md).
