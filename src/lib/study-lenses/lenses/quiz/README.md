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
mastery mechanic landed in inc 5: a graded answer folds into per-`groupKey`
`MasteryState` ([`./core.ts`](./core.ts) `masteryFold`), and the pure projector
([`./lib/decorations.ts`](./lib/decorations.ts) `masteryDecorations`) paints the
two color-free channels on every same-group token. The **contract** was fixed in
Phase 0 ([`./types.ts`](./types.ts) `MasteryState`), so the fold dropped in
against a stable shape.

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
  `itemsAt` resolves for that range. When a range carries more than one
  (co-anchoring is the norm, not the exception — § Form scoping), the panel
  presents one **answer-neutral tab** per item: the labels are **neutral** (a
  bare index — "1", "2" — never the prompt or a gesture verb, which would leak
  the answer to a co-anchored category question), and only the **active** tab's
  prompt + body renders. Each tab renders **by its own item's `mode`** (mcq
  buttons / a code-answer surface — § Interaction contract), so a heterogeneous
  bundle like `[mcq, mcq, click-token]` just works. The verdict is held **per
  item** (`VerdictsByItemId`), so switching tabs never shows one question's
  verdict under another's prompt. The default active tab is the **first `mcq`
  item** in the bundle (guaranteed to exist — V1 co-anchors every token, § Form
  scoping); a bundle with no `mcq` item (none today) leaves **no tab armed**
  (anchor phase) until the learner selects one. So the editor **never
  auto-arms** — entering answer phase is always an explicit tab selection, not a
  side effect of which item `generateQuiz` happened to emit first.
- **Quiz item** — a `QuizItem` from `lib/quizzing` (read its
  [`types.ts`](../../lib/quizzing/types.ts) live — it is the moving seam). A
  fully resolved question carrying its own ground truth: `prompt`,
  `anchorRange`, `groupKey`, `cells`, `feedback`, and a mode-specific answer
  key. Inc 6 consumes all three variants: `McqQuizItem` (`options` +
  `answerOptionIds`), `CodeSurfaceQuizItem` (`click-token`, `targetRanges`), and
  `SelectInCodeQuizItem` (`select-in-code`, `targetRanges`).
- **Verdict** — the outcome of `grade(item, response)`: `correct` / `incorrect`
  (with NM `feedback`) or `malformed` (a caller / UI bug — a mode mismatch or
  unknown option id; `grade` is total and never throws, and mastery is never
  penalized for `malformed`). The lens builds the response from what the learner
  did — the clicked `option.id` (`mcq`) or the clicked / confirmed source ranges
  (code-answer) — verbatim, so normal play never grades `malformed`.
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
  populates it is `masteryFold` ([`./core.ts`](./core.ts), inc 5); the pure
  `masteryDecorations` ([`./lib/decorations.ts`](./lib/decorations.ts)) then
  projects the state onto the two channels. _(The progress curve is **0..1
  accrual** — ruled at the Phase-0 human gate 2026-06-28, over a
  consecutive-correct counter or a threshold-to-unlock. inc 5 set
  `MASTERY_STEP = 0.25` (four correct answers saturate a group to `1`), rendered
  as four underline-density buckets; the `wrong` channel is an independent,
  color-free overline.)_
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
  <main data-quiz-editor data-quiz-phase="anchor|answer">
                                     — read-only, un-colorized CodeMirror EditorView
                                       (editable.of(false) + readOnly.of(true); NO
                                       javascript()/oneDark/syntaxHighlighting — black-on-white).
                                       data-quiz-phase reflects the active tab: "anchor" (click = re-pick)
                                       vs "answer" (click = stage the code-answer). Decorations:
                                       .cm-quiz-anchor-hit (picked token; suppressed in answer phase),
                                       .cm-quiz-progress-N / .cm-quiz-wrong (mastery — inc 5),
                                       .cm-quiz-pending (answer-phase staged ranges — inc 6c, a box outline).
  <aside data-quiz-panel>            — the picked anchor's question(s). Absent until an anchor is picked.
    <div data-quiz-tablist>          — one tab per co-anchored item; present only when >1 item.
      <button data-quiz-tab="<itemId>" aria-selected="true|false">  — neutral label (bare index);
                                       the active tab is aria-selected="true", the rest "false".
    — the ACTIVE tab's body, rendered by its item.mode:
      mcq:          <button data-quiz-option="<optionId>"> ... </button>   — one per option.
      code-answer:  <button data-quiz-confirm> Confirm (N selected) </button>  — grades the staged ranges;
                                       the pending count N is in the button's text content.
                    <button data-quiz-cancel> ... </button>   — returns to anchor phase (visible while armed).
    <div data-quiz-verdict="correct|incorrect|malformed">  — the ACTIVE item's verdict (per-item, not per-pick).
  OR (unparseable snippet):
  <div data-quiz-fallback role="alert">  — "needs parseable code" notice (no editor).
</div>
```

`data-lens="quiz"` on the root is the lenses-peer invariant (load-bearing for
sandbox-harness selectors). The `data-quiz-*` attributes + the `.cm-quiz-*`
decoration classes are sandbox selectors + CSS hooks; renaming any is a contract
change. The `data-quiz-tablist` nests **inside** `data-quiz-panel`, above the
active tab's body.

## Interaction contract

The lens has **two interaction phases**, derived purely from the **active tab's
`mode`** — there is no stored phase flag (see [`./DOCS.md`](./DOCS.md) § Why
dispatch on active-tab mode).

1. **Mount** — the wrapper reads `embodiment.source.code`; on `status.parsed` it
   derives the classified tokens (anchors) and the quiz items — running
   `generateQuiz` and **filtering by `item.mode`** (§ Form scoping; `mcq` in 6a,
   `+click-token` in 6b, `+select-in-code` in 6c) — then mounts the read-only
   un-colorized editor. On `!status.parsed` it renders the fallback.
2. **Pick** — a click in the editor (in **anchor phase**) resolves to a document
   offset (`view.posAtCoords`), then to the anchor token whose `[start, end)`
   contains it (`anchorAt`, binary search). The picked token highlights; the
   panel opens with **every** item `itemsAt` resolves for that range, as
   answer-neutral tabs (§ Panel). The default active tab is the first `mcq` item
   (§ Panel — guaranteed present, so the editor opens in anchor phase and never
   auto-arms). A click outside any token clears the selection.
3. **Anchor phase** (active tab is `mcq`, or no tab armed) — an editor click
   **re-picks** (step 2). An `mcq` answer comes from the **panel**: selecting an
   option builds `{ mode: 'mcq', selectedOptionIds: [option.id] }` and calls
   `grade`. The verdict shows for that item; the answer key is never echoed (the
   lens reveals it from the item it holds, never from the `Verdict`).
4. **Answer phase** (active tab is a code-surface `mode`, unanswered) —
   selecting a code-surface tab **arms** the editor (`data-quiz-phase` flips
   anchor → answer on the tab-switch itself, with no editor click). This is also
   the heterogeneous-bundle flow: answer the `mcq` tab in the panel, then select
   the co-anchored `click-token` tab and the same editor surface re-arms. Now an
   in-token editor click is the **answer**, not a re-pick: it **stages** a range
   into a pending selection (`anchorAt` resolves the click to a token range),
   and a **Confirm** control grades the pending ranges via `grade`. The two
   code-surface modes share this one substrate, differing only in how a click
   stages:
   - `click-token` — pending is **single-slot**: a click replaces it with
     `[range]`. Confirm grades `{ mode: 'click-token', clickedRanges }`.
   - `select-in-code` — pending is a **toggle-set**: a click toggles membership
     (exact `[start, end]` equality). Confirm grades
     `{ mode: 'select-in-code', selectedRanges }` by exhaustive set-equality.

   A whitespace / null-anchor click in answer phase is a **no-op** (it neither
   exits nor grades). A visible **`data-quiz-cancel`** returns to anchor phase
   at any time; a graded verdict also auto-returns. _(Invariant: every armed
   state has a visible, reachable way back to anchor phase.)_

5. **Reset matrix** — all learner state is per-mount React state (**disposable
   practice**, no persistence). The split is principled: a **verdict** is
   per-pick feedback; **mastery** is the durable per-`groupKey` record (it is
   what the decorations paint, so it carries the learning across picks).
   - **Source change** (a new snippet) clears everything: pick, active tab,
     per-item verdicts, pending selection, mastery.
   - **Re-pick** (a new anchor) clears the per-item verdicts and the pending
     selection and resets the active tab to its default; **mastery persists**.
     So re-picking an anchor is a fresh attempt at its questions.
   - **Tab switch** (within a pick) clears the pending selection; **verdicts and
     mastery persist** — answering tab B then returning to tab A still shows A's
     verdict. (This per-item isolation is exactly why the verdict is keyed by
     item id, not by pick — it is the only reason `VerdictsByItemId` exists.)

   A graded `Verdict` folds into per-`groupKey` `MasteryState` regardless of
   mode (`masteryFold`, inc 5), painting the two color-free channels on every
   same-group token — so the durable signal survives a re-pick even though the
   verdict text does not.

6. **Re-answering.** An `mcq` tab re-grades on a fresh option click within the
   same pick (the buttons stay live — the inc-5 behavior). A code-surface tab is
   **terminal for the pick** once graded: the verdict disarms the editor (back
   to anchor phase), so to re-attempt it the learner **re-picks the anchor**
   (which clears the pick's verdicts). There is no in-place retry control for
   code-surface answers — re-pick is the retry.

## Slice A scope

Ships now (inc 1–4):

- The `LensModule` skeleton (registered; `phase: 'source'`; `recommend → []`).
- Read-only, un-colorized CodeMirror rendering the snippet; a fallback for
  unparseable snippets.
- Clickable classified-token anchors with single-anchor highlight.
- The question panel for the picked anchor (V1 prompt + 5 category options).
- Answer → `grade('mcq')` → verdict feedback. **This is the live V1 milestone.**

## Form scoping

`generateQuiz` runs the **full generator registry** — currently
`[V1 category-ID, V2 keyword-vocab, V6 kind-semantics, V6b const-update, V7 usage-kind, V8 declaration-site, V10a/b/c sameness]`
(read it live:
[`../../lib/quizzing/generators/registry.ts`](../../lib/quizzing/generators/registry.ts))
— so its output is a **mixed-form, mixed-mode stream**. On `let x = 1; x;` the
reference `x` co-anchors V1 + V7 (`mcq`) **and** V8 (`click-token`); the
declaration co-anchors V1/V2/V6/V6b (`mcq`). The V10a/b/c sameness forms emit
**once per group, at the group's source-first occurrence** (the
"representative"), so on this snippet V10a lands on the declaration and V10b/c
on the reference — but on a larger snippet most occurrences carry only V1/V7/V8,
not a sameness item. Co-anchoring is **heterogeneous** — several forms, several
_modes_, one range. Because V1 is token-anchored and fires on **every**
classified token, every anchor's bundle contains at least one `mcq` item — a
consumed-contract invariant the default-tab rule (§ Panel) relies on (if M2 ever
stops co-anchoring V1, the default-tab rule, not the registry order, still keeps
the editor unarmed).

The lens narrows this stream with a single **`item.mode`** filter in
`lib/build-quiz.ts`, **widened in stages** as the lens learns each answer mode.
The filter is a plain boolean predicate (not a type-predicate), so the kept
array stays the full `QuizItem` union — the panel discriminates on `mode`, not
the filter:

- **`mcq`** (inc 6a) — V1/V2/V6/V6b/V7. Answered in the panel (option buttons).
- **+`click-token`** (inc 6b) — V8. Answered by a click in the editor.
- **+`select-in-code`** (inc 6c) — V10a/b/c. Answered by multi-select + confirm.

`click-line` and `multi-mcq` stay out — no generator emits them. The
**never-`malformed`-in-normal-play** guarantee survives the widening without the
old V1-only narrowing — and it is a property of **response construction**, not
of renderer dispatch: each mode's answer is built **inside its own narrowed
arm**, carrying that item's own `mode` plus the learner's verbatim input (the
option id / the clicked ranges). So the response mode always equals the item
mode, and `grade`'s mode-mismatch arm (`grade.ts` `modeMismatch`) is unreachable
in normal play — an `mcq` tab grades an `mcq` response, a `click-token` tab
grades a `click-token` response. (A hoisted, mode-agnostic response would break
this — see [`./DOCS.md`](./DOCS.md) § the per-arm construction note.)

_(Slice A shipped a `form === 'V1'` filter that left exactly one `mcq` item per
anchor — no tabs, no code-as-answer. Inc 6 replaces it with the staged
`item.mode` filter above: the **one** line that widens, never a panel
re-shape.)_

The `QuizLensConfig`, `MasteryState`, and the `MasteryFold` **signature** were
defined in Phase 0 ([`./types.ts`](./types.ts)) so the full contract was
captured up front. The mastery fold + two-channel decorations landed in inc 5;
inc 6 adds the code-as-answer modes (and the tabs + answer phase they need);
propagation (`unlocks`), config filtering, and `recommend` remain later slices.

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

- **No `click-line` / `multi-mcq`.** `grade` handles both, but no generator
  emits them (`click-line` needs `Source.offsets`; `multi-mcq` is
  enumerated-not-built), so the lens never receives them. Inc 6 _does_ capture
  the generated code-answer modes — `click-token` (V8) and `select-in-code`
  (V10a/b/c) — see § Form scoping; these two are no longer deferred.
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
  `recommend`, and the pure mastery fold `masteryFold` (inc 5). No React.
- `lib/build-quiz.ts` (core) — parses the snippet (Acorn), delegates
  classification to `lib/classifying`, calls `generateQuiz`, **filters the
  mixed-mode output by `item.mode`** (the staged inc-6 filter — § Form scoping),
  and returns `{ classified, items }` (or `null` on internal parse failure). The
  single re-parse site. No React.
- `lib/anchors.ts` (core) — the pure resolution layer:
  `anchorAt(offset, classified)` (token resolution, binary search over the token
  ranges, for the highlight), `itemsAt(items, anchorRange)` (item resolution,
  the panel's item(s) for a range), and `defaultActiveTab(bundle)` (the
  mode-aware safe default tab — the first `mcq` item, else `null`/unarmed; the
  "never auto-arm" invariant). Pure and **CM-independent** (so it serves both
  the CodeMirror path and the span-render fallback unchanged). No React.
- `lib/decorations.ts` (core) — the pure mastery-decoration projector
  `masteryDecorations(items, mastery)` → the two color-free render channels
  (`MasteryDecos`). Pure and **CM-independent** (it emits plain ranges; the
  wrapper owns the `Decoration` / `StateField` glue). No React. (inc 5)
- `types.ts` (shared) — `QuizLensConfig`, `GroupMastery`, `MasteryState`,
  `MasteryFold`, `MasteryDecos`, `ProgressBucket`.

Tests split: `tests/{core,mastery,build-quiz,anchors,decorations}.test.ts`
(vitest, no jsdom) + `tests/component.test.tsx` (vitest + jsdom +
`@testing-library/react`).

## Dependencies (no install needed)

- **`acorn`** — already in `package.json`; `lib/build-quiz.ts` imports it
  directly (and `lib/classifying` consumes the resulting tokens + AST).
- **`@codemirror/view`, `@codemirror/state`, `codemirror`** — already in
  `package.json` (used by the editor and the other lenses). The quiz lens
  deliberately does **not** depend on `@codemirror/lang-javascript` /
  `@codemirror/theme-one-dark` for display — it omits them to stay un-colorized.

## Future direction

- **`click-line` / `multi-mcq` modes** — `grade` already handles both; when a
  generator emits them (`click-line` needs `Source.offsets`; `multi-mcq` is the
  enumerated multi-select panel form), the lens admits them through the same
  `item.mode` filter + per-mode dispatch — no panel re-shape. (Inc 6 brings the
  generated code-answer modes `click-token` + `select-in-code`.)
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
