# lenses/socratize

The `socratize` lens — a **click-an-element, read-a-question, think-it-through**
study surface over a frozen snippet. The learner sees the source code rendered
read-only and **un-colorized** (syntax highlighting is deliberately off — the
lens's own decorations carry the only meaning) inside a CodeMirror editor. Every
syntax element the analyzers reached is a clickable **anchor**; clicking one
opens a **panel** holding the Socratic question(s) for that element — a
`context` framing plus 1–3 prompts at escalating rhetorical **rungs**.
Whole-program questions (which no single element can anchor) sit in an
always-visible **overview** shelf. Nothing is graded: the learner answers in
their head or in prose, and the lens surfaces the questions through the
**Feedback Ladder** — `open` first, `pointed` and `comparative` revealed on
demand.

`socratize` is the **open / Socratic** complement to the **closed / gradable**
register (`quizzing`, surfaced via the [`quiz`](../quiz/README.md) lens — both
are Tier-2 source lenses; see
[`../README.md` § Three-tier classification](../README.md)). Where `quiz` poses
questions a machine grades — each `QuizItem` carrying its own answer key —
`socratize` poses prompts a human judges: reflection, not recall, with no binary
verdict.

It is a **consumer** of one pure lib — it never re-implements it:

- [`lib/question-orchestrator`](../../lib/question-orchestrator/README.md)
  (`composeQuestions`) — runs both question registers over the snippet and
  returns one unified `OrchestratedItem` stream on the shared Block Model grid.
  The lens takes only the **open** arm (`register: 'open'`) and renders each
  item's native `CodeQuestion` (`context` + `questions[]`) as-is. Grading,
  laddering-by-difficulty, and anchor normalization all live upstream; the lens
  owns rendering and the Feedback-Ladder disclosure.

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import socratize from './index.js';

// orchestrator mounts in lens mode:
<socratize.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'socratize'` — registry identity.
- `phase: 'source'` — the phases-panel station this lens teaches. Like `quiz`
  and `blanks`, it consumes the AST (via the orchestrator's analyzers) but its
  **pedagogical target** is the source / text surface (the "why is it written
  this way?" question lives at the code's text surface). Without `phase` the
  lens is panel-excluded.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders `<div data-lens="socratize">` with the read-only
  un-colorized editor, the question panel, and the program-level overview shelf.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` —
  [`../types.ts`](../types.ts) admits only primitives and primitive arrays);
  unknown keys in `overrides` are spread through unchanged (open-shape
  contract). The one knob is `disclosure` (`'ladder'`, the default and v1
  behavior; `'all'` is a defined-but-gated escape hatch — see
  [`./types.ts`](./types.ts) `SocratizeLensConfig` and § Glossary → Feedback
  Ladder); encode any future knobs as flat primitives / primitive arrays, never
  nested objects.
- `applicableTo(embodiment): boolean` — returns `embodiment.status.parsed`
  (**Tier 2** per [`../README.md`](../README.md) § Three-tier classification).
  The lens needs a valid AST — the open analyzers have nothing to say about an
  unparseable snippet. This is an applicability + UX-fallback gate, **not**
  throw-avoidance: `composeQuestions` is total (empty set on unparsed) and the
  open arm (`analyzeMicroDecisions`) degrades to a graceful empty result — it is
  the _closed_ arm's `generateQuiz` (which this lens never consumes) that
  throws. The Component also gates on `status.parsed` itself (nothing consults
  `applicableTo` before mount today — see § Edge cases).
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns the frozen
  empty array. Real Block-Model-cell coverage recommendations (mapping the open
  items' `cells` to `Recommendation.blockModelCell`) are future work, gated on
  the WS2 recommender seam — see § Future direction.

## Why this lens exists

`socratize` operationalizes the Socratic register of the curriculum's question
model: every micro-decision in the code — `let` vs `const`, a name, an operator,
a control structure — becomes a probe into "what was chosen here, what else
could have been, and what does the choice signal?" (`micro-decision` questions),
and every line becomes a probe into "what does this do?" (`comprehension`
questions). The questions come from
[`socratizing`](../../orchestrate/lib/socratizing/README.md) (56 analyzers),
reach the lens through the orchestrator, and use PBSI vocabulary and
rhetorical-audience framing so the learner practices the vocabulary every time.

The pedagogical pairing is deliberate: `socratize` (this lens, open register)
and `quiz` (the closed, gradable register over `quizzing`) are the two faces of
the same snippet. Open questions provoke explanation a human reads; closed
questions verify recognition with instant binary feedback. A learner moves
between them on the same code — the orchestrator's normalized `anchorOffsets` is
what lets a future increment co-anchor the two registers on one clicked element.

Learning is surfaced through the **Feedback Ladder** (EDM 2024): learning gain
is highest when the least information is revealed, so the lens shows the `open`
rung first and lets the learner **escalate** to `pointed` (scaffolding) and
`comparative` (alternatives) only on request. Escalation reveals further
questions — never answers — so it carries none of the "click through the hints
to the solution" risk a gradable surface would. The `socratizing` engine emits
all applicable rungs and delegates escalation to the environment; this lens
**is** that environment.

## Glossary

- **Register — two axes, one token (load-bearing; do not conflate).** The word
  `open` names two different things at two levels:
  - **Outer — `OrchestratedItem.register`** (`open` | `closed`,
    [`../../lib/question-orchestrator/types.ts`](../../lib/question-orchestrator/types.ts)):
    the **whole-kind** axis — which register (and which lens) owns the item.
    This lens **filters** the stream to `register: 'open'`.
  - **Inner — `Question.register`** (`open` | `pointed` | `comparative`,
    [`../../orchestrate/lib/socratizing/types.ts`](../../orchestrate/lib/socratizing/types.ts)):
    the **rhetorical** axis tagging each of a `CodeQuestion`'s 1–3 prompts. This
    lens **renders** these and escalates through them (the Feedback Ladder).
  - **Not a third homonym**: the orchestrator's `CompositionConfig.ladder`
    orders items by **Block-Model difficulty**
    (`atom → block → relation → macro`) — unrelated to the register disclosure
    this lens calls the Feedback Ladder.

  The lens reads the **outer** axis to select its items, then the **inner** axis
  to render and escalate them.

- **Anchor** — a clickable source element: the `[start, end)` character span an
  open item carries as `OrchestratedItemBase.anchorOffsets` (the orchestrator
  normalizes socratizing's node `location` to offsets — the items are
  **node-anchored, not token-anchored**; the lens consumes no classified-token
  stream). **Item resolution** (`itemsAt`) maps a click offset to the
  element-scoped open item(s) whose span **contains** it — analyzer spans nest
  routinely (a click on `===` inside a ternary is contained by both the operator
  question and the whole-ternary question), so one click can resolve several
  items. The **highlight** is the smallest containing item's `anchorOffsets`
  (the most specific to the click) — derived from the resolved items, not a
  token stream. Program-level items (`nodeType === 'Program'`) are excluded from
  `itemsAt` — they live in the Overview shelf.
- **Overview shelf** — the always-visible surface for **program-level**
  questions: those whose `CodeQuestion.nodeType` is `'Program'` (the socratizing
  engine's convention for whole-source questions — the 4 consistency,
  `voice-profile`, and the 3 program-level comprehension analyzers all tag
  `'Program'`), which no single clicked element can reach. The lens
  **partitions** the open items on `nodeType === 'Program'`: element-scoped →
  the click-driven panel, program-level → the shelf. `nodeType` is a crisp
  generation-time discriminant, not a span heuristic, so the two populations are
  disjoint and the partition is exact.
- **Panel** — the question surface for the picked anchor. Holds the open item(s)
  `itemsAt` resolves for that offset. When several co-anchor a click (nested
  spans are expected), the panel presents one **tab** per item ordered
  **smallest-containing-span first** (most specific to the click), ties broken
  by source order; each is labelled by its `CodeQuestion.category` (`voice` /
  `clarity` / `consistency` / …), and only the active tab's card renders.
  Because the open register has no answer to leak, tab labels are descriptive
  (unlike `quiz`'s answer-neutral indices) and the panel auto-selects the
  innermost (first) tab on a pick.
- **Card** — the render unit for one `CodeQuestion`, identical whether it sits
  in a panel tab or the overview shelf: the `context` prose, then the
  `questions[]` disclosed in Feedback-Ladder order.
- **`CodeQuestion`** — the open item's native payload
  ([`../../orchestrate/lib/socratizing/types.ts`](../../orchestrate/lib/socratizing/types.ts)):
  `id`, `category`, `context` (PBSI-vocabulary prose), `questions: Question[]`
  (the 1–3 registered prompts), `block` (Block-Model cells), plus tagging
  metadata. Rendered as-is; the lens never edits or re-derives it.
- **Feedback Ladder** — the disclosure discipline: for each `CodeQuestion`, show
  the `open` **rung**(s) first; a **reveal** control escalates through the
  question's own present rungs in `open → pointed → comparative` order (skipping
  any the analyzer did not emit). Each prompt carries its own `hints` (tool
  references, not answers) behind a `<details>` **sub-disclosure within** its
  rung — not a rung between `open` and `pointed`. A question with a single rung
  shows no reveal control. Ungated reveal (no forced attempt, no timer) is safe
  because the ladder discloses **more questions, not answers** — the open
  register has no answer key, so the "click through to the answer without
  thinking" failure mode is structurally absent. Governed by the `disclosure`
  config knob (`'ladder'`, the default and the v1 behavior; `'all'` — reveal
  every rung at once — is an educator escape hatch whose v1 build is a gate
  question).

## UI structure

```text
<div data-lens="socratize">
  <main data-socratize-editor>       — read-only, un-colorized CodeMirror EditorView
                                       (editable.of(false) + readOnly.of(true); NO
                                       javascript()/oneDark/syntaxHighlighting — black-on-white).
                                       Decoration: .cm-socratize-anchor-hit (the picked span).
  <aside data-socratize-panel>       — the picked anchor's question(s). Absent until an anchor is picked.
    <div data-socratize-tablist role="tablist">  — one tab per co-anchored open item; present only when >1.
      <button data-socratize-tab="<itemId>" role="tab" aria-selected="true|false">  — label = CodeQuestion.category.
    — the ACTIVE tab's card (see below).
  <section data-socratize-overview>  — program-level questions (whole-source anchors). Always present when any exist.
    — one card per program-level open item.
  OR (unparseable snippet):
  <div data-socratize-fallback role="alert">  — "needs parseable code" notice (no editor).
  OR (parsed, zero open items):
  <div data-socratize-empty>         — "no Socratic prompts for this snippet" (neutral, not an alert).
</div>

card (a single CodeQuestion — panel-tab body OR shelf entry, identical):
<article data-socratize-card="<itemIndex>" data-socratize-category="<category>">   — key = stable per-mount item index (CodeQuestion.id is NOT unique; see DOCS).
  <p data-socratize-context>            — the CodeQuestion.context prose (plain text).
  <ol data-socratize-questions>         — the inner questions, in Feedback-Ladder order, up to the revealed rung.
    <li data-socratize-question data-socratize-register="open|pointed|comparative">
      <span data-socratize-register-badge>  — the rhetorical rung label (Question.register).
      <span data-socratize-question-text>   — the prompt (plain text).
      <details data-socratize-hints>        — the prompt's hints (opt-in; absent when no hints).
  <button data-socratize-reveal>        — escalate to the next present rung. Absent once fully revealed,
                                          when only one rung exists, or under the gated disclosure: 'all'.
</article>
```

`data-lens="socratize"` on the root is the lenses-peer invariant (load-bearing
for sandbox-harness selectors). The `data-socratize-*` attributes and the
`.cm-socratize-*` decoration class are sandbox selectors + CSS hooks; renaming
any is a contract change. The `data-socratize-tablist` nests **inside**
`data-socratize-panel`, above the active tab's card.

## Interaction contract

1. **Mount** — the wrapper reads `embodiment.source.code`; on `status.parsed` it
   derives the open items (`composeQuestions` → filter `register: 'open'`),
   **partitions** them on `nodeType === 'Program'` into element-scoped and
   program-level, and mounts the read-only un-colorized editor. On
   `!status.parsed` it renders the fallback. Program-level items render in the
   overview shelf immediately; element-scoped items wait for a pick.
2. **Pick** — a click in the editor resolves to a document offset
   (`view.posAtCoords`), then via `itemsAt` to the element-scoped open item(s)
   whose `anchorOffsets` **contains** it (nested spans resolve several). The
   smallest containing span highlights; the panel opens with each co-anchored
   item as a tab (smallest-span-first, `category`-labelled), the innermost
   auto-selected. A click outside any anchored span clears the selection (the
   shelf persists).
3. **Read + escalate** (per card, both panel and shelf) — the card shows the
   `context` and the `open` rung's prompt(s). The learner reflects, then may
   open a prompt's `hints` (`<details>`) or press **reveal** to escalate to the
   next present rung (`pointed`, then `comparative`). (Under the gated
   `disclosure: 'all'` escape hatch every rung shows at once with no reveal
   control.) All disclosure state is per-mount (disposable practice); it
   persists across re-picks for the life of the mount (so the always-visible
   shelf keeps its escalation) and dies with the component on a snippet change /
   unmount.

There is no answer submission, no grading, no verdict, and no mastery — the open
register is non-gradable by charter.

## Edge cases

- **Unparseable snippet** (`embodiment.status.parsed === false`). `applicableTo`
  returns `false` — so the lens is excluded once per-lens applicability gating
  lands (a backlogged orchestrator seam; nothing consults `applicableTo` before
  mount today). **Today the Component's own `status.parsed` gate is
  load-bearing:** it renders the `data-socratize-fallback` notice instead of the
  editor, and never calls `composeQuestions` off the happy path (the
  orchestrator is total and returns an empty set on unparsed, so this gate is
  for the UX message, not to avoid a throw).
- **Empty source** (`embodiment.source.code === ''`). Parses to zero tokens →
  the orchestrator emits no open items. The editor renders empty; the panel
  never opens; the shelf is absent. Rendered as the neutral
  `data-socratize-empty` state (distinct from the fallback alert).
- **Parsed but zero open items.** Same neutral `data-socratize-empty` state — a
  parseable snippet the analyzers found nothing to ask about.
- **Click outside any anchored span** (whitespace, gutter, or a token no
  analyzer reached). `posAtCoords` returns an offset no item's `anchorOffsets`
  contains (or `null`); the lens clears the selection — no panel, no error. The
  overview shelf is unaffected.
- **A `CodeQuestion` with a single register.** The card shows that lone prompt
  and no reveal control (nothing to escalate to).

## What this lens does NOT do

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top runtime imports, no branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Beyond those:

- **No grading / verdict / mastery.** The open register carries no answer key;
  the lens renders questions and never evaluates a response. `quiz`'s option
  buttons, Confirm/Cancel, verdict region, and mastery decorations have no
  analogue here.
- **No snippet mutation.** The editor is read-only; the lens never calls the
  orchestrator's snippet setter (single-writer invariant). All disclosure state
  is per-mount.
- **No syntax coloring.** The editor is un-colorized by design — the picked-span
  decoration is the only editor signal.
- **No item generation or filtering.** The lens consumes `composeQuestions`
  as-is; it does not call `socratizing` directly, and it does not re-implement
  the engine's build-time register/category filter (a future config-forwarding
  direction — see below).
- **No `context` markdown.** `context` renders as plain text
  (framework-escaped); light-markdown rendering of the PBSI emphasis is future
  work.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers:

- `index.tsx` (wrapper) — React `Component`; the read-only un-colorized
  CodeMirror, click capture, panel, overview shelf, and Feedback-Ladder reveal;
  owns per-mount UI state (picked anchor / active tab / per-question reveal
  ladder); freezes and default-exports the `LensModule`.
- `core.ts` (core) — `LensModule` defaults (`config`, `applicableTo`,
  `recommend`) plus the pure derivations: `selectOpen` (the single seam to
  `composeQuestions` — filters the stream to `register: 'open'`), the
  element-scoped / program-level partition (on `nodeType === 'Program'`),
  `itemsAt` (containment item resolution), and the ladder-ordering of a
  `CodeQuestion`'s rungs. No React, no CodeMirror.
- `types.ts` (shared) — `SocratizeLensConfig`, the `SocraticModel` render alias,
  and the per-mount `RevealLadder` state type.

Tests split: `tests/core.test.ts` (vitest, no jsdom) +
`tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`); tests
live under `tests/` (NOT `lib/tests/`).

## Dependencies (no install needed)

- **`@codemirror/view`, `@codemirror/state`, `codemirror`** — already in
  `package.json` (used by the editor and the other lenses). Like `quiz`, this
  lens deliberately does **not** depend on `@codemirror/lang-javascript` /
  `@codemirror/theme-one-dark` — it omits them to stay un-colorized.
- **`lib/question-orchestrator`** (`composeQuestions`) — the item source (a
  runtime import from `../lib/*`, allowed by the lens-purity rule).
- **`orchestrate/lib/socratizing`** (`CodeQuestion`, `Question`,
  `QuestionRegister`) — type-only, for the render payload.

## Future direction

- **Co-anchor with `quiz`** — the orchestrator normalizes `anchorOffsets`
  precisely so a clicked token can surface **both** registers; a future
  increment renders the closed and open items for one span side by side.
- **Adaptive fading** — the stable `CodeQuestion.id` lets the environment
  suppress registers or categories a learner has demonstrated competence in
  (expertise reversal, Kalyuga et al. 2003). Per-mount today; durable fading is
  a cross-edit concern the LMS owns.
- **Config forwarding** — an educator knob that prunes registers / categories
  per cohort by forwarding a `MicroDecisionConfig` slice into
  `composeQuestions(embodiment, { sources: { socratizing } })` (build-time
  filtering, distinct from the runtime Feedback-Ladder disclosure).
- **Real `recommend()`** — a Block-Model-cell coverage report mapped from the
  open items' `cells`, once the WS2 recommender seam lands.
- **`context` markdown** — render the PBSI emphasis (`**implementation**`) as
  formatted text.
- **Span-render display fallback** — if read-only-CodeMirror click capture
  proves fragile, render the code as one clickable `<span>` per anchored span;
  the pure `itemsAt` resolution is reused unchanged (the `quiz` hedge).

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="socratize"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state for the picked anchor, active
  tab, or reveal ladder; React owns the lifecycle.
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
- **Consumed — question composition**:
  [`../../lib/question-orchestrator/README.md`](../../lib/question-orchestrator/README.md).
- **The open register (source of the questions)**:
  [`../../orchestrate/lib/socratizing/README.md`](../../orchestrate/lib/socratizing/README.md).
- **The closed sibling**: [`../quiz/README.md`](../quiz/README.md).
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes.
- **Structural template (reference)**:
  [`../blanks/README.md`](../blanks/README.md). </content>
