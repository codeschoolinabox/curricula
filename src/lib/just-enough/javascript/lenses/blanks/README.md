# lenses/blanks

The `blanks` lens — a **fill-in-the-blank programming exercise** over a frozen
snippet. The learner sees the source code with selected tokens replaced by
length-matched `_` placeholders (one `_` per character of the original token,
preserving the token's width as a recognition-cue) inside a CodeMirror editor.
Each blank behaves as a fixed-width fillable form field (Inc 6.7 overwrite-mode
UX): typing at any position inside a blank OVERWRITES the char at that position
(whether `_` or a previously-typed char); backspace replaces a typed char with
`_`; total blank width never changes. This means a learner can fill in any
order — typing `fun` then jumping to fill the end with `ion` yields `fun__ion`,
and then typing `c`+`t` at the middle underscores yields `function`.

**Directional compaction on `_` deletes.** When the learner backspaces or
forward-deletes a `_` (not a typed char), the empty slot is compacted in the
direction opposite to the freed space: backspace shifts right-text LEFT and
pads a new `_` at the END of the blank (e.g., cursor at 3 in `he_lo`, backspace
deletes the `_` at position 2 → `helo_`); Del shifts left-text RIGHT and pads
a new `_` at the FRONT of the blank (e.g., cursor at 2 in `he_lo`, Del deletes
the `_` at position 2 → `_helo`). This lets the learner compact scattered
typed chars without having to re-type them.

Per-blank correctness is computed live against the original code.

A difficulty slider (0–100%) governs the probability that any eligible token is
blanked; a five-checkbox content-type panel chooses which kinds of tokens are
eligible (keywords / identifiers / operators / literals / delimiters); a
view-mode toggle switches between `blankenated` (editable, with length-matched
`_` placeholders) and `complete` (read-only, original source).

**Blanks re-roll on settings change.** The vendored `blankenate` algorithm uses
an AST walk (via Acorn) with bare `Math.random()` per eligible token — when the
learner moves the difficulty slider or toggles a content-type checkbox, the
blank set re-derives and the score resets. This is the legacy's chaos preserved
deliberately: per-toggle re-rolls are part of the exercise's unpredictability.
Reproducibility-via-seed is **deferred** per
[Future direction](#future-direction) (introducing it requires modifying the
vendored algorithm beyond the locked mechanical-conversion mandate).

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

> Migrated from the pre-refactor `BlanksLens.jsx` (registry id `blanks`).
> Re-implementation in this V2 sprint preserves the legacy's pedagogical surface
> (the algorithm, controls, hints, view-mode toggle) while replacing structural
> pieces (Preact contexts → embodiment prop; `<script>` tag loading → ESM
> imports; legacy `askOpenEnded` chain → `socratizing/` module; buggy substring
> evaluation → position-aware per-blank tracking). See [`./DOCS.md`](./DOCS.md)
> for the migration audit trail and decision log.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import blanks from './index.js';

// orchestrator side (illustrative — registry shape is open-spec; see
// `../../orchestrate/DOCS.md` § Module ownership for the lock):
const roster = [annotate, blanks, /* … */];

// orchestrator mounts in lens mode:
<blanks.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'blanks'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the blanks surface (`<div data-lens="blanks">`) with the
  toolbar, editor, editor header, hints panel, and Ask Me button.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` per
  [`../types.ts`](../types.ts) `LensConfig`); unknown keys in `overrides` are
  spread through unchanged (open-shape contract). Fields the lens reads:
  - `difficulty?: number` (default `50`, range `0–100`) — per-token probability
    `p = difficulty / 100` of being blanked.
  - `contentTypes?: ReadonlyArray<'keywords' | 'identifiers' | 'operators' | 'literals' | 'delimiters'>`
    (default `['keywords', 'identifiers', 'operators', 'literals', 'delimiters']`)
    — which token categories are eligible to be blanked. Presence in the array =
    enabled. The wrapper derives a boolean map for per-render rendering; the
    config-level representation is the flat array to comply with
    `SerializableValue` (`LensConfig` admits only primitives and arrays of
    primitives — nested objects break determinism of config hashing per
    [`../types.ts`](../types.ts) JSDoc on `SerializablePrimitive`). The
    URL-config format `types:keywords+identifiers` mirrors the same array
    semantics.
  - `viewMode?: 'blankenated' | 'complete'` (default `'blankenated'`) — initial
    view.
  - `hintsMode?: 'on' | 'off'` (default `'on'`) — whether the
    cursor-scoped hints panel renders. **Orthogonal to `difficulty`**
    (Inc 6h-redux user-directed redesign — hints are not inferred from
    difficulty). When `'off'`, the panel does not render at all.
    When `'on'`, the panel shows a reveal-button for the blank under
    the cursor (only that blank); the learner controls scaffolding by
    choosing how many blanks to reveal. See
    [Hints panel contract](#hints-panel-contract).
- `applicableTo(embodiment): boolean` — returns `embodiment.status.parsed` (Tier
  2 per [`../README.md`](../README.md) § Three-tier classification). The
  vendored `blankenate` walks an Acorn AST; an unparseable snippet has no AST to
  walk.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]` for this
  batch. Block-Model placement contributions land in a follow-up commit once the
  WS2 analysis pipeline ships per
  [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md).
  See [Future direction](#future-direction).

## Why this lens exists

`blanks` is the learner's **fill-in-the-blank workbench**. Pedagogically it
serves the "recognize what should go here" gap-filling exercise — a
well-established cloze-deletion technique in programming-education research
(Denny et al. 2019). The difficulty slider lets the same source snippet generate
exercises across the entire novice → review spectrum: at difficulty 20 the
learner fills a few token holes (recognition); at difficulty 80 most of the
structural keywords disappear (recall). The five content-type checkboxes let an
educator tune which dimensions of the code the learner practices — keywords-only
blanks emphasize control-flow vocabulary; identifiers-only blanks emphasize
naming and scope; operators-only blanks emphasize semantics-of-symbols;
delimiters-only blanks emphasize syntactic structure (parens, brackets,
braces, `${`, semicolons, commas, dots). The
view-mode toggle lets the learner peek at the complete source as a self-check
without leaving the lens.

The hints panel surfaces per-blank correctness state as the learner types —
green for correct, red for incorrect, yellow for unfilled — making the exercise
self-pacing rather than a submit-then-grade round-trip. The Ask Me button hands
the original (non-blanked) source to the `socratizing/` module for Socratic
micro-decision / comprehension questions, framing the exercise as a study
session rather than a quiz.

**Bimodal pedagogical posture.** The blanks exercise is a correct/incorrect
cloze-deletion task by design (per Denny et al. 2019); the Ask Me affordance
layers socratizing's observational study mode on top for learners who want to
step back from filling blanks and consider the source's micro-decisions. The
lens carries both pedagogical commitments deliberately: blanks-mode is "answer
the questions correctly," Ask-Me-mode is "consider the choices." The two
surfaces share a snippet but ask different things of the learner.

## Glossary

Vocabulary used throughout this lens. Legacy terms surface from the pre-refactor
`BlanksLens.jsx`; socratizing terms surface from the
[`socratizing/` module](../../orchestrate/lib/socratizing/README.md).

- **Blank** — a single position where an original token was replaced by the `__`
  placeholder. Each blank carries `{ id, original, type, start, end }`: its
  unique identifier, the original token text, its category (`identifier` /
  `literal` / `keyword` / `operator`), and its position in the original source
  (zero-indexed character offsets).
- **`__` placeholder** — the two-underscore string the learner sees in place of
  a blanked token. Legal JavaScript identifier; the editor treats it as text the
  learner types over.
- **Content type** — one of the five token categories
  (`keywords / identifiers / operators / literals / delimiters`). Stored in
  `config` as a
  `ReadonlyArray<'keywords' | 'identifiers' | 'operators' | 'literals' | 'delimiters'>`
  (presence = enabled), mirroring the URL format's `types:keywords+identifiers`
  shape. The toolbar exposes a checkbox per category; unchecking removes that
  category from the array.
- **View mode** — one of the two representations of the snippet: `blankenated`
  (editable, with `__` placeholders the learner fills) or `complete` (read-only,
  original source for self-check).
- **Blankenated** — the verb form (legacy retained). "The source has been
  blankenated" = "the blankenate algorithm has produced a version with selected
  tokens replaced by `__`".
- **Blankenate** — the vendored algorithm at `lib/blankenate.ts` (JS→TS
  conversion of the legacy `public/static/blanks/blankenate.js`).
- **Difficulty** — the per-token probability slider (0–100);
  `p = difficulty / 100` is the chance each eligible token is replaced.
- **Correctness** — per-blank state in the **blanks-exercise** sense: `correct`
  (learner typed the original token), `incorrect` (learner typed something
  else), `unfilled` (learner hasn't typed anything yet; the `__` placeholder
  remains in place). This is a blanks-internal term for the cloze-deletion
  exercise; `socratizing/` deliberately produces questions rather than
  corrections (see
  [`../../orchestrate/lib/socratizing/README.md`](../../orchestrate/lib/socratizing/README.md))
  — Ask Me's outputs do not carry correctness state.
- **Hints mode** — `'on' | 'off'`. Enable or disable the cursor-scoped
  hints panel. Default `'on'`. Orthogonal to `difficulty` (Inc 6h-redux
  user-directed redesign). The `data-hints-mode` attribute on the root
  reflects this value.
- **Score** — the aggregate percentage. Formula:
  `total === 0 ? 100 : Math.round(correct / total * 100)`. Surfaced in the
  editor header and the hints panel. The `total === 0` branch handles the
  degenerate case (difficulty 0, or all content-type checkboxes unchecked, or
  empty source) as a vacuously-complete exercise.
- **Code question** — a Socratic question about the source code, produced by the
  `socratizing/` module. Two kinds: `micro-decision` ("What effect does this
  choice have?") and `comprehension` ("What does this line do?"). The Ask Me
  button surfaces these.
- **Micro-decision question** — a `CodeQuestion` of kind `micro-decision`;
  invites the learner to consider an alternative choice (e.g. `let` vs `const`,
  ternary vs if/else).
- **Comprehension question** — a `CodeQuestion` of kind `comprehension`; invites
  the learner to articulate what the code does.

## UI structure

```text
<div data-lens="blanks" data-view-mode="blankenated|complete" data-hints-mode="on|off">
  <header>                          — title + Ask Me button
  <toolbar>                         — difficulty slider, 5 content-type checkboxes, view-mode toggle
  <editorHeader>                    — mode label + difficulty% + blanks count + remaining count
  <main>                            — CodeMirror EditorView (editable in blankenated, read-only in complete)
  <aside data-blanks-hints>         — cursor-scoped hint for the blank under the cursor:
                                      empty state OR reveal-button OR scrambled-letters reveal
                                      (rendered only when data-hints-mode='on';
                                      per-blank in-editor visual lives on CM6 decorations via Inc 6.7,
                                      separate from this panel)
  <instructions>                    — collapsible "How to use" panel
</div>
```

The `data-lens` attribute is the lenses-peer invariant (see
[`../DOCS.md` § Structural constraints](../DOCS.md)). The `data-view-mode`
and `data-hints-mode` attributes are sandbox-harness selectors and CSS
hooks; renaming them is a contract change. `data-*` values reflect
**committed config state**.

## Toolbar contract

- **Difficulty slider** — `<input type="range" min="0" max="100">`. Drag fires
  `onChange`; the state updates immediately and the blank set re-derives on the
  next render. Score resets to unfilled when the set changes (the previous
  learner answers no longer correspond to the new blank positions).
- **Content-type checkboxes** — five checkboxes (keywords / identifiers /
  operators / literals / delimiters). Toggle fires `onChange`; the state
  updates immediately
  and the blank set re-derives on the next render. A checkbox set to `false`
  suppresses that token category from being eligible — even at difficulty 100,
  tokens of an unchecked category remain visible.
- **View-mode toggle** — two `<button>`s ("📝 Blankenated Code" / "📖 Complete
  Code"). Active button is highlighted via the `data-view-mode` attribute on the
  root. Toggling **preserves the learner's answers** (parity with legacy) — the
  toggle is a self-check affordance ("let me peek at the original to verify what
  I just typed"), not a reset. Answers live in lens-local React state for the
  lifetime of the mount; only unmount discards them, per the disposable-practice
  contract. Disposable-practice governs cross-mount persistence, not
  within-mount toggle semantics.

## View contract

- **Blankenated view** — renders
  `blankenate(source, difficulty, contentTypes, seed).blankedCode` in a
  CodeMirror editor with `basicSetup`, `javascript()` language, `oneDark` theme,
  and the vendored `noPasteExtension` (blocks Ctrl+V / Cmd+V / context-menu
  paste so learners type the answer rather than pasting). The editor is
  editable; `updateListener` mirrors learner edits into local `learnerCode`
  state. The lens NEVER calls the orchestrator's `setSnippet` — learner answers
  live in lens-local state per the disposable-practice contract; the
  orchestrator's snippet is `embodiment.source.code`, unchanged.
- **Complete view** — renders the original `embodiment.source.code` read-only
  (CodeMirror with `EditorView.editable.of(false)`). No `__` placeholders; no
  input. The CSS class adds `user-select: none` and `pointer-events: none` to
  discourage copy-paste-back-to-blankenated workarounds (parity with legacy).
- The view toggle recreates the CodeMirror `EditorView` rather than dynamically
  reconfiguring `editable` (parity with legacy lines 310–338). A
  dynamic-reconfigure optimization is deferred to a follow-up — see
  [Future direction](#future-direction).

## Hints panel contract

Inc 6h-redux ships a **cursor-scoped, on-demand, scrambled** hints panel
per user-directed redesign. The legacy 3-tier system (`'auto' | 'easy' |
'medium' | 'hard'` controlling rendered richness) is gone — replaced by:

- **Orthogonality.** Hints are decoupled from `difficulty`. `hintsMode`
  has its own knob (`'on' | 'off'`), not inferred from the slider.
- **Cursor-scoped.** The panel surfaces hints for **one blank at a
  time**: whichever blank the cursor is currently inside. Anchor
  positions (between blanks) show an empty state.
- **Hidden by default + incremental reveal.** Each blank's hint starts
  hidden. The panel shows a "Reveal next letter" button. Each click
  exposes ONE more letter of the correct answer, appending it left-to-
  right to the displayed partial. After N clicks the learner sees the
  first N letters of the per-blank scrambled order (no position info).
  For `hello` (length 5), if the per-blank permutation is `[3, 0, 4,
  1, 2]`, clicks 1–5 produce `'l'`, `'lh'`, `'lho'`, `'lhoe'`,
  `'lhoel'`. After all letters revealed, the button vanishes.
- **Scrambled-order is deterministic per-blank-mount.** The
  permutation comes from a mulberry32 PRNG seeded by an FNV-1a 32-bit
  hash of `blank.id` (see `index.tsx` § `shufflePositions`). Same
  blank in the same mount always reveals letters in the same
  sequence; same blank in a re-rolled blank set (after settings
  change) gets a new permutation. No `Math.random()` per render —
  tests are deterministic and re-renders don't reshuffle.
- **Per-blank reveal-count persists** across cursor moves. Once two
  letters are revealed for blank A, returning to A after visiting B
  shows the same two letters. Switching the editor-mode scaffolding
  level (helpful → diff → raw or back) resets all reveal-counts.

**Why this design.** The 3-tier system coupled scaffolding intensity to
difficulty, but the user's pedagogical goal is the inverse: the learner
chooses how much help to ask for, blank by blank. The "tier" is now
emergent — how many blanks the learner chooses to peek at across a
session is itself the scaffolding gradient.

**Panel structure (when `hintsMode === 'on'`):**

```text
<aside data-blanks-hints>
  <h4>Hint</h4>
  EITHER (cursor not in any blank):
    <p data-hint-empty>Place the cursor in a blank to request a hint.</p>
  OR (cursor in blank):
    <p data-hint-revealed
       data-hint-blank-id="…"
       data-hint-type="…"
       data-hint-reveal-count="N"
       data-hint-reveal-total="M">
      <type>: <code data-hint-partial><first N scrambled letters></code>
      (N / M revealed)
    </p>
    {N < M ? <button data-hint-reveal-button>Reveal next letter</button>
           : nothing — fully revealed}
</aside>
```

When `hintsMode === 'off'`, the `<aside>` does not render at all.

**Independent from the score panel.** The aggregate-score display
(`[data-blanks-score]`) and the editor header (`[data-blanks-editor-header]`)
still surface score / remaining / total. The hints panel only shows the
per-blank scrambled reveal — it does not duplicate the score.

## Editor header contract

Renders above the CodeMirror editor:

- Mode label: "📝 Fill in the Blanks" (blankenated) or "📖 Complete Code
  (Read-only)" (complete).
- Difficulty %: `{difficulty}%`.
- Blanks count: `{blanks.length}`.
- Remaining count: `{learnerCode.match(/__/g)?.length ?? 0}` (number of `__`
  placeholders still in the editor — i.e. blanks the learner hasn't filled).

Legacy designed this readout but compiled it out via `{/* ... */}` (lines
648–662); we ship it at parity per the visible-progress-signal pedagogical
principle.

## Ask Me contract

The "🤔 Ask Me" button in the header delegates to the `socratizing/` module:

- On click: `analyzeMicroDecisions(embodiment, ASK_ME_CONFIG)` →
  `MicroDecisionResult`.
- The embodiment passed is the **original** (`props.embodiment`), NOT a
  re-embodied blankenated version. Rationale: the `__` placeholders are valid
  JavaScript identifiers and would parse, but the resulting AST would be
  semantically incoherent — `socratizing/`'s analyzers would produce questions
  like "What does the name `__` communicate?" which is not a useful Socratic
  prompt. Ask Me v1 is whole-source study-companion; cursor-aware Ask Me (scoped
  to the blank the learner is currently typing in) is a
  [Future direction](#future-direction) item with a clear path via socratizing's
  `MicroDecisionConfig.range` field.
- **v1 config** (`ASK_ME_CONFIG`, module-level constant in `index.tsx`):

  ```ts
  const ASK_ME_CONFIG: MicroDecisionConfig = {
  	count: 5,
  	register: { open: true, pointed: true, comparative: false },
  };
  ```

  The cap of 5 keeps a session-sized list rather than dumping 30+ questions on
  the learner; dropping the comparative register removes the "consider this
  alternative" questions that assume the learner already knows the baseline (per
  [`../../orchestrate/lib/socratizing/README.md`](../../orchestrate/lib/socratizing/README.md)
  — "comparative questions for learners ready to explore alternatives"). Filter
  knobs in the lens UI are a [Future direction](#future-direction) item; v1
  ships the constant.

- **Cycling**: the lens maintains a local cursor (0..K-1) into the filtered
  question list. The first render shows `questions[0]`; clicking the Ask Me
  button advances the cursor by one (wrapping at K back to 0). The cursor
  resets to 0 on `embodiment.source.code` change (a new snippet starts from
  question 1, not mid-cycle from the previous snippet). The lens UI shows a
  "Question N of K" indicator so cycling is legible.
- Questions are ordered by source location (top-to-bottom) before capping, per
  [`../../orchestrate/lib/socratizing/README.md`](../../orchestrate/lib/socratizing/README.md)
  § Ordering — so the first question on the same snippet is stable across
  mounts.
- The lens displays each question's `context` (PBSI sentence framing the
  decision) + the prompt text. Prompt selection prefers the open-register
  question (`questions[N].questions.find(q => q.register === 'open').text`),
  falling back to `questions[N].questions[0].text` when no open-register
  entry exists. The pedagogical bias is toward open prompts — they invite
  the learner to articulate their own reasoning, matching the Ask Me /
  socratizing posture (vs. pointed prompts which presume the learner
  already has a candidate to evaluate).
- An empty result list (`questions.length === 0` after filtering) renders "No
  questions available for this snippet at the current Ask Me configuration." The
  `ok: false` branch is unreachable in production because `applicableTo` gates
  on `status.parsed` (and socratizing's `ok: false` fires only on un-parsed
  embodiments), but the wrapper handles it as `"Snippet did not produce an AST"`
  for defense-in-depth.

## URL config sync

The lens reads its config from the URL on mount and writes config changes back
to the URL with a 500ms debounce. Format:

```text
?blanks=difficulty:50,types:keywords+identifiers,view:blankenated,hints:on
```

The `:` separates a key from its value; the `,` separates parameters within the
lens; the `+` within `types:` is a value-array separator. Unrecognized
parameters are ignored. The parser is the vendored `url-config.ts` (slimmed
adaptation of the legacy `urlManager.js`); only the read/write surface for the
single `blanks` URL parameter is preserved.

URL state is the **only** cross-mount persistence the lens uses. Learner
answers, blanks, correctness map, and overall score are all React-state only —
gone on unmount per the disposable-practice contract.

The orchestrator owns no URL state in this batch; the lens manages its own URL
slice. When the orchestrator grows a URL-state surface (post-WS3), this lens's
URL handling lifts to an adapter over that surface (see
[Future direction](#future-direction)).

## Edge cases

- **Initial mount.** `blankenate()` is called **synchronously during the first
  render** (the AST is already in `embodiment.raw.ast` by the time
  `applicableTo` admits the lens; Acorn parsing has already happened upstream in
  `embody()`). The first paint already shows `__` placeholders; no flicker. No
  `useEffect` wraps the initial derivation.
- **Empty source** (`embodiment.source.code === ''`). `blankenate('')` returns
  `{ blankedCode: '', blanks: [], originalCode: '' }` — the AST has zero nodes,
  no token is eligible. The lens renders an empty CodeMirror editor; the hints
  panel shows `total === 0` → score 100% (vacuously complete; per § Glossary
  `Score` formula); the editor header shows `0 blanks · 0 remaining`. Ask Me on
  an empty source returns `questions.length === 0` → "No questions available for
  this snippet at the current Ask Me configuration."
- **Acorn parse error** (`embodiment.status.parsed === false`). `applicableTo`
  returns `false` for this case; the orchestrator's recommender filters the lens
  out before mount. **Defense-in-depth:** if the lens is nonetheless mounted on
  a parse-failed embodiment (e.g. the orchestrator's picker bypasses the
  recommender's filter), the vendored `blankenate` returns `null` on its
  internal re-parse attempt; the wrapper renders a fallback panel naming the
  contradiction ("`blanks` lens received an unparseable snippet —
  `applicableTo`'s contract was violated") rather than the editor. The fallback
  is a safety net, not the happy path.
- **Difficulty = 0.** `p = 0/100 = 0`; no token's `Math.random()` roll passes;
  `blanks.length === 0`. UI shows the complete code in blankenated-mode (no `__`
  placeholders); editor header shows `0 blanks · 0 remaining`; score 100%
  (vacuously complete). The view-mode toggle still works (the read-only
  "complete" view is available for the self-check use case).
- **Difficulty = 100.** `p = 1.0`; every eligible token rolls true; the entire
  eligible-token set is blanked. UI shows a heavily-`__`'d source; CodeMirror
  renders fine (the string is still valid CodeMirror content); score starts at
  0/N. No render-breakage at the boundary.
- **All content-type checkboxes unchecked.** `contentTypes` is the empty array;
  no token category is eligible; `blanks.length === 0` (same as difficulty = 0
  case). Score 100%; editor header shows `0 blanks · 0 remaining`.
- **Learner edits outside `__` placeholders.** v1 contract: the position-aware
  evaluator (`lib/evaluate-correctness.ts`) takes the blanks' original
  `{start, end}` offsets from `blankenate`'s output and slices the learner's
  text at those positions to compare each blank. Edits **outside** placeholder
  ranges (e.g. inserting text between two blanks) shift the actual offsets of
  subsequent blanks in the learner's typed text away from the recorded
  `{start, end}` — the evaluator's subsequent comparisons read the WRONG
  positions and return spurious `incorrect` / `correct` verdicts for those
  blanks. v1 accepts this limitation; richer tracking that re-anchors blank
  positions after non-placeholder edits is on
  [Future direction](#future-direction). The `noPasteExtension` and the
  CodeMirror `editable.of(false)` in complete-view discourage the
  pathological-edit pattern in practice.

## What this lens does NOT do (lens-specific drops only)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art `BlanksLens.jsx`:

- **No `<script>` tag loading of `blankenate`.** The legacy injects
  `<script src="${BASE_PATH}/static/blanks/blankenate.js">` at runtime and waits
  for `window.blankenate` to appear. V2 vendors the algorithm as
  `lib/blankenate.ts` and imports it directly as ESM.
- **No `BASE_PATH` constant.** Irrelevant in V2 (no script-tag loading).
- **No legacy `askOpenEnded` chain.** The legacy uses `askOpenEnded` from
  `public/static/ask/component/ask-questions.js` (a chain of `multiple-choice`
  library files); v1 of V2 uses the `socratizing/` module instead. Richer
  questions, stronger config, in-tree code.
- **No `URLManager` global class.** Replaced by the vendored slimmed
  `lib/url-config.ts` adapter; only the read/write of the single `blanks` URL
  parameter is preserved. Global URL-coordination is out-of-scope for a lens
  module; the orchestrator will own that when it grows a URL surface.
- **No `useColorize` / `useApp` Preact contexts.** Replaced by the `embodiment`
  prop and lens-local React state. (`useColorize` was vestigial in the legacy —
  imported and destructured but never used.)
- **Buggy substring-based evaluation is fixed.** The legacy's `evaluateExercise`
  (lines 394–448) had two known bugs: (a) `"function"` matches `"functionX"`
  (false-positive containment), (b) multiple blanks of the same word weren't
  tracked per-position. V2's `lib/evaluate-correctness.ts` is position-aware:
  each blank's `{start, end}` from `blankenate`'s output anchors a per-position
  match against the learner's typed text, so same-word repeats and substring
  containment are handled correctly.
- **Hints panel ships ENABLED at parity.** Legacy compiled it out with
  `{false && showHints && (...)}` (line 672); the design and styling exist and
  are load-bearing pedagogically.
- **Editor header ships ENABLED at parity.** Legacy compiled it out with
  `{/* ... */}` (lines 648–662); ship it for the visible-progress signal.
- **View-mode toggle preserves learner answers** (parity with legacy). Answers
  live in lens-local React state for the lifetime of the mount.
  Disposable-practice governs cross-mount persistence (answers vanish on
  unmount), not within-mount toggle semantics (the toggle is a self-check
  affordance — the learner peeks at the original to verify what they typed;
  clearing on toggle would punish that legitimate use). Confirmed at AR-1.
- **No `console.warn` swallowed errors.** The legacy comments out `console.warn`
  on blankenate failure (line 370); V2 surfaces parse failures via the
  discriminated-union return shape, handled by the wrapper (renders a fallback
  panel rather than the editor on a `null` blankenate result — defensive; in
  production `applicableTo` gates this case out).
- **No seeded RNG (yet).** The vendored `blankenate.ts` preserves the legacy's
  bare `Math.random()` per-token roll (per the mechanical-conversion mandate —
  locked in the handoff). Blanks re-roll on settings change; the learner sees a
  fresh set on every difficulty slider drag. Reproducibility-via-seed is on the
  [Future direction](#future-direction) list because introducing it requires
  modifying the vendored algorithm beyond mechanical conversion — defer until
  the lens's other contracts are stable.
- **CodeMirror writes to local state, never to `setSnippet`.** The wrapper's
  `updateListener` mirrors learner edits into local `learnerCode` state only.
  The orchestrator's `setSnippet` is the editor's job; the lens is a read-only
  view per the lenses-peer single-writer invariant.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper). The
core is split into a `lib/` subdirectory with one file per internal subsystem so
each is independently testable:

- `index.tsx` (wrapper) — React component, the `LensModule.Component`. Composes
  the core subsystems below into the UI shell.
- `core.ts` (core) — `LensModule` defaults: `config`, `applicableTo`,
  `recommend`.
- `lib/blankenate.ts` (core) — **vendored** from the legacy
  `public/static/blanks/blankenate.js`. JS→TS mechanical conversion; AST walk
  via Acorn; per-token seeded RNG. Pure. Eslint-ignored per
  [`../../../../../../eslint.config.mjs`](../../../../../../eslint.config.mjs)
  global-ignores.
- `lib/no-paste-extension.ts` (core) — **vendored** from the legacy
  `src/utils/noPasteExtension.js`. CodeMirror 6 extension that blocks paste via
  keymap (`Mod-v`) + DOM event handler (`paste` event). Pure. Eslint-ignored.
- `lib/evaluate-correctness.ts` (core) — **new**. Position-aware per-blank
  correctness; takes `(learnerCode, blanks)` and returns
  `{ correctnessMap: CorrectnessMap, score: number }`. Fixes the legacy's two
  evaluation bugs. Pure.
- `lib/url-config.ts` (core) — **vendored & slimmed** from the legacy
  `src/utils/urlManager.js`. Only the `getLensConfig('blanks')` /
  `updateLensConfig('blanks', config)` surface is preserved. Pure.
- `types.ts` (shared) — lens-local types: `Blank`, `BlankType`,
  `BlankenateResult`, `ContentType`, `ViewMode`, `HintsMode`,
  `BlankCorrectness`, `CorrectnessMap`, `EvaluationResult`,
  `BlanksLensConfig`. The boolean-map representation of content types
  is wrapper-internal state derived from the array on render; it has
  no exported type.

Tests split: `tests/blankenate.test.ts`, `tests/no-paste-extension.test.ts`,
`tests/evaluate-correctness.test.ts`, `tests/url-config.test.ts`,
`tests/core.test.ts` (vitest, no jsdom); `tests/component.test.tsx` (vitest +
jsdom + `@testing-library/react`).

## Dependencies (no install needed)

- **`acorn`** — already in `package.json` (`^8.16.0`); the vendored `blankenate`
  imports it directly.
- **`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-javascript`,
  `@codemirror/theme-one-dark`, `codemirror`** — already in `package.json` (used
  by the editor and the annotate lens).
- **`socratizing/`** — sibling module at `../../orchestrate/lib/socratizing/`.
  Imported directly as ESM.

## Future direction

- **WS2 `recommend()`.** Lens ships with `recommend: () => []`. Once WS2's
  analysis surface lands, `recommend(embodiment)` populates Block-Model
  placements with snippet-fit relevance heuristics (likely higher relevance for
  snippets with many keywords / identifiers in scope, motivating the blanks
  exercise). Specific cells are WS2's call.
- **Cursor-aware Ask Me** — scope Ask Me to the blank the learner is currently
  typing in. Socratizing already supports this via
  [`MicroDecisionConfig.range`](../../orchestrate/lib/socratizing/types.ts)
  (filter questions whose `location` overlaps a source-line range). The lens
  already knows each blank's `{start, end}` offsets from `blankenate`'s output;
  mapping cursor → blank → source-line → range → filtered Socratic questions is
  one extra arg to `analyzeMicroDecisions`. This makes Ask Me a per-decision
  Socratic prompt rather than a whole-snippet survey ("the name you're about to
  choose — what would it communicate about this variable's role?").
- **Per-blank position-aware learner-input re-anchoring.** v1's evaluator reads
  each blank's `{start, end}` from `blankenate`'s output and compares the
  learner's text at those positions; edits **outside** placeholders shift the
  actual offsets of subsequent blanks and corrupt the comparisons (per § Edge
  cases). v2 re-anchors blank positions after non-placeholder edits — likely a
  CodeMirror `Decoration.mark` per blank that re-derives offsets from the
  decoration's live range rather than the static `{start, end}`.
- **Seeded RNG for reproducible exercises.** The vendored `blankenate` uses bare
  `Math.random()` per token; the same `(source, difficulty, contentTypes)`
  produces different blank sets on each re-roll. Educators may want
  reproducibility (same exercise across learners, re-visitable assessments).
  Path: inject a `random: () => number` function at the call-site (so the vendor
  stays mechanical) and pass a seeded PRNG from the wrapper when a `seed` config
  field is provided.
- **Editor `editable.of()` dynamic reconfiguration.** Recreating the
  `EditorView` on view-mode change (parity with legacy) is perf-suboptimal.
  CodeMirror 6 supports dynamic `EditorView.editable.of()` reconfiguration; the
  swap-out can land as a follow-up.
- **Ask Me config knobs in the toolbar.** v1 calls
  `analyzeMicroDecisions(embodiment, {})` (include everything). A follow-up
  exposes the `kind` / `features` / `levels` / `categories` / `register` knobs
  in the lens UI so a learner can scope Ask Me to e.g. "only `micro-decision`
  questions about `variables` at the `syntax` level."
- **URL state lifted to the orchestrator.** v1 owns its own URL slice (vendored
  `url-config.ts`). Post-WS3, when the orchestrator grows a URL-state surface,
  this lens's URL handling becomes an adapter over that surface and the vendored
  `url-config.ts` shrinks (or disappears).
- **Hints panel: per-blank highlight in the editor.** v1 shows per-blank state
  in the side panel. A follow-up adds inline highlighting at the blank's
  `{start, end}` in the editor itself (e.g. CodeMirror `Decoration.mark`) so the
  learner sees green/red/yellow at the position they're typing.
- **Internal-EventBus dispatch** (WS3 F5) — `blank-filled`, `view-toggled`,
  `difficulty-changed` events for picker UI feedback and future LMS bridging.
- **Per-config Acorn `ecmaVersion`.** v1 hard-codes the legacy's
  `ecmaVersion: 2022`. An educator override may want a narrower or wider spec
  for specific exercises.
- **`[diff hint]` toggle: split-view or ghost overlay against the original
  source.** v1 ships per-blank CSS borders (a subtle background + outline on
  each `__` decoration) so adjacent blanks are visually separable without
  changing the placeholder character. For learners who need stronger scaffolding
  on heavily-blanked snippets, a `[diff hint]` toggle would render a
  side-by-side or ghost-text view of the complete source alongside the
  blankenated editor — preserving the recall exercise while letting the learner
  consult the original on demand. Likely a CodeMirror `Decoration.widget`
  overlay or a second read-only view in a horizontal split. Pairs with the
  view-mode toggle but is non-blocking (the learner can keep typing while the
  hint is visible).
- **Richer delimiter taxonomy.** v1 classifies every delimiter blank as
  `type: 'delimiter'` (a single bucket). Block/object braces and
  template-expression braces both blank as `}` from the same Acorn TokenType
  (`tokTypes.braceR`); v1 does not sub-classify. A brace-context stack walking
  the token stream could distinguish `template-close` from `block-close` for
  per-sub-type visual treatment (e.g. different border colors) — useful if the
  hints panel grows category-aware feedback.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="blanks"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state for learner answers, blanks, or
  correctness; React owns the lifecycle. URL config is the one exception
  (cross-mount config persistence), and that's orchestrator-domain (URL = caller
  environment, not lens-internal).
- **Read-only views** — the lens never mutates `embodiment` or `config`; the
  wrapper's CodeMirror writes to local `learnerCode` state, never to the
  orchestrator's `setSnippet`.
- **Tier 2 classification** — `applicableTo` returns `embodiment.status.parsed`.
  The recommender skips this lens for unparseable snippets without invoking
  `recommend`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes.
- **Socratizing module**:
  [`../../orchestrate/lib/socratizing/README.md`](../../orchestrate/lib/socratizing/README.md)
  — the Ask Me backend.
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="blanks"` dispatch path.
- **Lens-migration plan**:
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
- **V2 structural template (reference)**:
  [`../annotate/README.md`](../annotate/README.md).
