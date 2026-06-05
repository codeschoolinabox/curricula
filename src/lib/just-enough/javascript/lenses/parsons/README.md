# lenses/parsons

The `parsons` lens — a **drag-to-order code exercise** over a frozen snippet.
The learner sees the snippet's lines **shuffled** (plus optional **distractor**
lines that do not belong in the solution) and reconstructs the original program
by dragging lines into a solution column **in the correct order** and **at the
correct indentation**. A "Check" button grades the arrangement and surfaces
**per-line feedback** — correct / wrong-order / wrong-indent / distractor /
unplaced — plus an aggregate score. A view-mode toggle reveals the complete
solution for self-check without discarding the learner's arrangement.

**The snippet IS the solution.** The educator authors the snippet as the correct
program (lines in order, indented as intended); the lens derives the exercise
from it. Lines whose source ends with the `// distractor` marker are pulled out
as distractors (wrong lines that look plausible); every other non-blank line is
a solution line whose source position is its expected order and whose leading
whitespace is normalized to an expected indentation **level** (relative nesting,
not raw spaces).

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

> Migrated from the pre-refactor `ParsonsLens.jsx` (registry id `parsons`). The
> legacy was a thin React shell that `encodeURIComponent`'d the source into a
> sandboxed `parsons-iframe.html`; the pedagogy lived in the jQuery
> **JSParsons** widget (`parsons.js`, 1446 LOC) + a
> **Longest-Increasing-Subsequence** grader (`lis.js`). This V2 reproduces the
> JSParsons **pedagogy** (shuffle, distractors, indentation grading, LIS-based
> order feedback, per-line correctness, score) while replacing the structure:
> the iframe + jQuery + jQuery-UI sortable are dropped; the pure algorithm (LIS,
> line/indent parsing) is vendored as TS; the drag-and-drop is rewritten with
> the **native HTML5 Drag-and-Drop API** (zero new dependencies). See
> [`./DOCS.md`](./DOCS.md) for the migration audit trail and decision log.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import parsons from './index.js';

// orchestrator mounts in lens mode:
<parsons.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'parsons'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the parsons surface (`<div data-lens="parsons">`) with
  the available-lines pool, the solution column, per-line indent controls, the
  Check button, the per-line feedback, the score, and the view-mode toggle.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` per
  [`../types.ts`](../types.ts) `LensConfig`); unknown keys in `overrides` are
  spread through unchanged (open-shape contract). Fields the lens reads:
  - `canIndent?: boolean` (default `true`) — whether indentation is a **graded**
    dimension. When `true`, the learner sets each placed line's indent level and
    a wrong indent is flagged; when `false`, indentation is ignored in grading
    (order-only Parsons) and the indent controls are hidden.
  - `maxDistractors?: number` (default `10`) — the maximum number of distractor
    lines shown. If the snippet declares more `// distractor` lines than this, a
    subset is selected. `0` suppresses distractors entirely.
  - `indentSize?: number` (default `4`) — the visual width (in spaces) of one
    indent level when rendering and when revealing the complete solution.
    Grading compares **levels**, not raw spaces; this is presentation only.
  - `viewMode?: 'work' | 'complete'` (default `'work'`) — initial view. `'work'`
    is the interactive exercise; `'complete'` reveals the solution read-only.
- `applicableTo(embodiment): boolean` — returns `true` (Tier 1 per
  [`../README.md`](../README.md) § Three-tier classification). A Parsons
  exercise reorders **text lines**; it needs no AST and does not require the
  snippet to parse. Suitability (e.g. a snippet must have at least two non-blank
  lines to be a meaningful exercise) is the recommender's concern via
  `recommend`, not a hard applicability gate. **This is a deliberate divergence
  from `blanks`** (Tier 2, `status.parsed`): blanks walks an AST; parsons does
  not.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]` for this
  batch. Block-Model placement contributions (and down-ranking of single-line or
  trivial snippets) land in a follow-up once the WS2 analysis pipeline ships.
  See [Future direction](#future-direction).

## Why this lens exists

`parsons` is the learner's **assembly workbench**. A Parsons problem (Parsons &
Haden 2006) gives the learner the correct lines of a program in scrambled order
and asks them to assemble it. The pedagogy isolates **program structure and
sequencing** from the cognitive load of recalling syntax: the learner does not
write code from scratch, but must reason about which line comes first, what
nests inside what, and which plausible-looking lines (distractors) are actually
wrong. It sits earlier on the novice → competence spectrum than `blanks` (which
asks the learner to recall tokens): parsons asks the learner to **order and
nest** lines they are given.

Three pedagogical dimensions are graded and surfaced per line (under a fixed
precedence — see [Feedback contract](#feedback-contract-check)):

- **Order** — is each line in a correct relative position? Graded via a
  Longest-Increasing-Subsequence (LIS) comparison against the model order, so
  the feedback highlights the **fewest** lines that need to move rather than
  cascading one early mistake into a wall of red.
- **Indentation** — is each line nested at the correct level? Graded as relative
  nesting levels (0, 1, 2, …) derived from the snippet's leading whitespace, not
  as raw space counts — so a learner's tab-vs-spaces choice does not matter,
  only the structure. Optional per `canIndent`, and evaluated **only for
  order-correct lines** (a misordered line is flagged to move first; its indent
  is not surfaced until its order is right).
- **Distractors** — did the learner correctly leave the wrong lines out? A
  distractor dragged into the solution is flagged; a distractor left in the pool
  is silently correct.

The Check button makes grading **commit-then-verify** rather than
drag-until-green: the learner assembles a complete arrangement and asks for
feedback, which preserves the structural-reasoning value of the exercise
(continuous as-you-drag feedback would degrade it into trial-and-error). The
view-mode toggle lets the learner peek at the complete solution as a self-check
without discarding their in-progress arrangement.

## Glossary

Vocabulary used throughout this lens. Legacy terms surface from the pre-refactor
JSParsons widget (`parsons.js`).

- **Parsons problem** — an exercise where the learner reconstructs a program by
  ordering (and indenting) a given set of scrambled code lines.
- **Solution line** — a non-blank line of the snippet that is **not** a
  distractor. Its position in the source is its expected order (its index in the
  ordered model solution); its leading whitespace, normalized, is its expected
  indent level.
- **Distractor** — a line whose source ends with the `// distractor` marker. It
  is a plausible-but-wrong line that does **not** belong in the solution. The
  learner succeeds by leaving it in the available pool. (The legacy JSParsons
  marker was the Python-idiom `#distractor`; this JS-only lens uses the
  JS-comment idiom `// distractor`.)
- **Available pool** — the column of shuffled lines (solution lines +
  distractors) the learner drags **from**.
- **Solution column** — the column the learner drags lines **into**, in order;
  the assembled arrangement that gets graded.
- **Indent level** — a line's nesting depth as a non-negative integer (0 = no
  indent, 1 = one level in, …). Derived from leading whitespace by
  `normalizeIndents` (relative: a line indented more than the previous line is
  one level deeper). Compared as levels, never as raw spaces.
- **Order correctness** — whether a placed line participates in a correct
  relative ordering, computed via LIS over the placed lines' model positions.
  Lines **not** in the longest increasing subsequence are the ones flagged to
  move.
- **Indent correctness** — whether a placed, order-correct line's indent level
  matches its model line's indent level.
- **Line correctness** — the per-line feedback state, one of: `correct`,
  `wrong-order`, `wrong-indent`, `distractor` (a distractor wrongly placed in
  the solution), `unplaced` (a solution line still in the available pool).
- **Score** — the aggregate percentage of solution lines that are fully correct
  (right order **and**, when `canIndent`, right indent). Formula:
  `total === 0 ? 100 : Math.round(correct / total * 100)`, where `total` is the
  number of solution lines. The `total === 0` branch (empty snippet) is a
  vacuously-complete exercise at 100%.
- **Check** — the learner action that grades the current arrangement and renders
  per-line feedback + score. Re-runnable; non-destructive.

## UI structure

```text
<div data-lens="parsons" data-view-mode="work|complete" data-can-indent="true|false">
  <header>                          — title + Check button + Reset button
  <main data-parsons-board>         — work view: two columns
    <ul data-parsons-pool>          —   available pool (shuffled, draggable lines)
    <ol data-parsons-solution>      —   solution column (drop target, ordered)
      <li data-parsons-line         —     each placed line:
          data-indent="N"           —       indent level (visual margin = N * indentSize)
          data-correctness="…">     —       set after Check: correct|wrong-order|wrong-indent|distractor
        <indent controls>           —       outdent / indent buttons (when canIndent)
  <pre data-parsons-complete>       — complete view: the solution, read-only
  <div data-parsons-score>          — aggregate score (after Check), aria-live="polite"
</div>
```

The `data-lens` attribute is the lenses-peer invariant (see
[`../DOCS.md` § Structural constraints](../DOCS.md)). The `data-view-mode`,
`data-can-indent`, `data-indent`, and `data-correctness` attributes are
sandbox-harness selectors and CSS hooks; renaming them is a contract change.

## Pool + solution contract

- **Initial shuffle.** On mount, all solution lines and the selected distractors
  are placed in the available pool in a shuffled order (Fisher–Yates, bare
  `Math.random()` per the mechanical-conversion mandate — see
  [What this lens does NOT do](#what-this-lens-does-not-do-lens-specific-drops-only)).
  The solution column starts empty. A correct shuffle never leaves the lines in
  their model order (re-roll on the degenerate case).
- **Drag from pool to solution.** Dragging a line from the pool into the
  solution column appends/inserts it at the drop position and removes it from
  the pool.
- **Reorder within solution.** Dragging a placed line to a new position within
  the solution column reorders it.
- **Drag back to pool.** Dragging a placed line back to the pool removes it from
  the solution (e.g. to discard a line the learner now believes is a
  distractor).
- Native HTML5 Drag-and-Drop backs all three; no drag library is used.

### Interaction contract (native HTML5 DnD)

The drag interaction is the surface where the prior shell silently failed (it
satisfied the structural contract but did nothing in a browser). The contract is
therefore specified concretely, and the **arrangement logic is a pure reducer**
(`lib/arrange.ts`) so it is unit-testable without a DOM:

- **`onDragStart`** (on each `draggable` line): writes the dragged line's `id`
  and its source zone (`pool` | `solution`) into `dataTransfer` —
  `setData('text/plain', \`${zone}:${id}\`)`— so the drop handler reads both from the event with no cross-handler React state (a ref held across`dragstart`→`drop`
  is a stale-closure footgun in the jsdom-untestable layer).
- **`onDragOver`** (on both drop zones and on line elements): **MUST call
  `event.preventDefault()`** — without it `onDrop` never fires. This is the #1
  native-DnD footgun and a load-bearing line, not boilerplate.
- **`onDrop`**: reads the dragged `id` + source zone, computes the **insert
  index** from the drop target (dropping onto line _i_ inserts before _i_;
  dropping onto the zone's empty area appends), and dispatches one pure reducer
  action — `placeFromPool`, `reorderWithinSolution`, or `returnToPool`.
- **`lib/arrange.ts`** (pure, new code) owns the arrangement state transitions:
  `placeFromPool(state, id, index)`, `reorderWithinSolution(state, id, index)`,
  `returnToPool(state, id)`, `indent(state, id)`, `outdent(state, id)`. It takes
  and returns a plain `{ pool: string[], solution: PlacedLine[] }` value — no
  React, no DOM. The wrapper's `onDrop` is a thin adapter that derives the index
  and calls the reducer.
- **Testing:** `lib/arrange.ts` is fully unit-tested (`tests/arrange.test.ts`,
  no jsdom) for every transition. `component.test.tsx` verifies the wrapper
  **wiring** by firing synthetic `dragStart` / `dragOver` / `drop` events, with
  the explicit caveat that **jsdom does not implement real drag-and-drop** — so
  the component test proves the handlers are attached and call the reducer, but
  **real drag behavior is verified by manual browser observation** at
  `/spiralearn/parsons-preview` before merge (the sandbox checkpoint is a gate,
  not a formality).

## Indent contract (when `canIndent`)

- Each placed line carries an **indent level** (non-negative integer), shown as
  a left margin of `level * indentSize` spaces.
- **Indent / outdent controls** (per placed line) increment / decrement the
  level; outdent floors at 0.
- Indent level is learner state. Every line **starts at level 0** (legacy
  parity: `init` zeroes all line indents, L1016 — lines begin flush-left and the
  learner establishes nesting themselves). Thereafter the level is set by the
  indent/outdent controls and **persists** across reorders and pool↔solution
  moves — a line dragged back to the pool and re-placed keeps its level. (The
  legacy set indent via horizontal drag-distance, `updateIndent` L1137; V2 uses
  explicit buttons because native HTML5 DnD exposes no reliable
  horizontal-offset signal — a deliberate divergence in _mechanism_, not in the
  start-at-0 or persist behavior.) The level is graded against the model line's
  normalized level.
- When `canIndent` is `false`, the controls are hidden,
  `data-can-indent="false"` is set, and indentation is excluded from grading and
  from the score.

## Feedback contract (Check)

Clicking **Check** grades the current arrangement and sets `data-correctness` on
each placed line plus the aggregate score. The five per-line states:

| State          | Meaning                                                          | Where shown                         |
| -------------- | ---------------------------------------------------------------- | ----------------------------------- |
| `correct`      | right relative order **and** (if `canIndent`) right indent level | placed line, green                  |
| `wrong-order`  | not in the LIS of placed lines' model positions (should move)    | placed line, red                    |
| `wrong-indent` | order-correct but indent level ≠ model level                     | placed line, amber                  |
| `distractor`   | a distractor line wrongly placed in the solution                 | placed line, red (distractor badge) |
| `unplaced`     | a solution line still left in the available pool                 | pool line, neutral "missing" hint   |

**Precedence (canonical).** Each placed line resolves to exactly one state by
this order: `distractor` > `wrong-order` > `wrong-indent` > `correct`. (A
distractor is flagged regardless of position; an in-solution line is
order-checked, and only if order-correct is its indent checked.) `unplaced` is a
**pool-line** state, not a `data-correctness` value (it is never set on a
solution `<li>`).

**Deliberate grading-MODEL change from legacy.** The legacy `LineBasedGrader`
(`parsons.js` L609–723) is a **sequential gate** (`first_error_only`): it grades
order first, then line-count, and checks indent **only when
`errors.length === 0`** (L709) — and marks a line `correct` **only when there
are zero errors anywhere** (L716). So in the legacy a learner with one
misordered line sees no positive feedback on any other line, and never any
indent feedback. V2 **changes this model** to **independent per-line
evaluation**: each placed line's order is graded via LIS, each order-correct
line's indent is graded against its model level, and a line is `correct` based
on its own order+indent — regardless of other lines' states. This is a behavior
change (not a rendering tweak), adopted for the same reason the blanks redo
enabled its hints panel: per-line formative feedback is the load-bearing
pedagogical affordance. The legacy's per-line markers (`markCorrect` /
`markIncorrectPosition` / `markIncorrectIndent`) are reused as the visual
vocabulary, but the gating is removed.

**Score.** `total === 0 ? 100 : Math.round(correct / total * 100)`, where
`total` is the number of **solution lines** (distractors excluded) and `correct`
counts solution lines that are fully correct (right order, and right indent when
`canIndent`). **Unplaced solution lines count toward `total`** (so leaving hard
lines in the pool lowers the score — the exercise is not gameable by omission).
The legacy parsons had **no percentage score** — grading was binary
`success: errors.length === 0` (L723). The percentage is a **V2 cross-lens
convention** adopted from the blanks score surface (`blanks/README.md` § Score)
for consistency, not legacy parity. The `total === 0` empty-snippet case is
vacuously 100% rather than `NaN%`.

## View contract

- **Work view** (`data-view-mode="work"`) — the interactive pool + solution
  board described above.
- **Complete view** (`data-view-mode="complete"`) — the model solution rendered
  read-only (lines in model order, indented at `level * indentSize`), for
  self-check. No distractors. Toggling to complete and back **preserves the
  learner's arrangement** (parity with the blanks view-mode toggle; the toggle
  is a self-check affordance, not a reset). Arrangement lives in lens-local
  React state for the lifetime of the mount; only unmount discards it, per the
  disposable-practice contract.

## Edge cases

- **Empty snippet** (`embodiment.source.code === ''`). No solution lines, no
  distractors; pool and solution both empty; Check reports `total === 0` → score
  100% (vacuously complete). `evaluate-line-order.ts` **short-circuits on zero
  placed lines** (returns an empty correctness map) and never calls the vendored
  LIS — the legacy `patience_sort([])` initializes `decks = [[undefined]]` and
  would misbehave on empty input, so the evaluator guards before the call.
- **Single solution line.** A degenerate Parsons (nothing to order). The lens
  renders the one line; LIS is trivially the whole sequence; the exercise is
  vacuous. `applicableTo` still returns `true`, so **until WS2's recommender
  lands, single-line snippets are still offered** in the picker; down-ranking
  them is a recommender concern (Future direction), not an applicability gate.
- **No distractors declared** (or `maxDistractors: 0`). The pool contains only
  solution lines; the exercise is pure ordering/indentation.
- **More `// distractor` lines than `maxDistractors`.** A shuffled subset of
  size `maxDistractors` is selected and shown; the rest are dropped. The
  selection is re-rolled per mount (bare `Math.random()`; reproducibility
  deferred).
- **Fewer `// distractor` lines than `maxDistractors`** (including the default
  `10`). All declared distractors are shown; `maxDistractors` is a **cap, not a
  target**. The selected count is `min(maxDistractors, declared)`. (The legacy
  `parseCode` looped to `max_distractors` over a permutation sized to the actual
  count, pushing `undefined` line-objects past the end — a real bug; V2 takes
  the `min`, a deliberate non-propagation of the legacy defect.)
- **Duplicate lines** (the same code text appears twice in the solution). The
  LIS grader assigns each occurrence the next-unused model position (legacy
  parity via the `lastFoundCodeIndex` walk), so duplicates are matched
  left-to-right rather than both snapping to the first position.
- **Indentation when `canIndent` is false.** Indent levels are neither shown nor
  graded; lines render flush-left.
- **Snippet that does not parse.** Irrelevant — parsons grades text
  order/indent, not an AST. The exercise still works (unlike `blanks`, which
  gates on `status.parsed`).

## What this lens does NOT do (lens-specific drops only)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art JSParsons widget:

- **No iframe.** The legacy `ParsonsLens.jsx` loaded a sandboxed
  `parsons-iframe.html?code=…`; V2 mounts the lens component directly.
- **No jQuery / jQuery-UI / underscore.** The legacy depended on jQuery,
  jQuery-UI `sortable`, and underscore. V2 uses native HTML5 Drag-and-Drop and
  plain TS; the only vendored code is the pure LIS + line/indent parsing.
- **No Python-isms.** The legacy is a Python-Parsons descendant — the
  `#distractor` marker, `python_indents`, two-space indent, and toggle/unit-test
  machinery (`$$toggle$$`, `vartests`, `unittests`) are dropped. The marker
  becomes the JS-idiom `// distractor`; indentation is
  `indentSize`-configurable; toggles and embedded unit tests are out of scope.
- **Per-line feedback shows all five states at once** (the legacy
  `first_error_only` grader stops at the first error). Parity with the blanks
  redo's enabled-by-default hints panel.
- **No seeded RNG (yet).** The shuffle and distractor-subset selection use bare
  `Math.random()` (mechanical-conversion mandate). Reproducible exercises are a
  [Future direction](#future-direction) item via call-site PRNG injection.
- **No URL config.** The legacy parsons carried no meaningful URL state (only
  the iframe's `?code=`). V2 ships no URL surface; config comes from the fence
  directive / props. URL-state persistence is a
  [Future direction](#future-direction) item (and would lift to the
  orchestrator, per the blanks precedent). **This is a deliberate divergence
  from `blanks`, which ships a `lib/url-config.ts`.**
- **Drag-and-drop writes to local state, never to `setSnippet`.** The
  arrangement is lens-local React state; the orchestrator's snippet
  (`embodiment.source.code`) is unchanged — the lens is a read-only view per the
  single-writer invariant.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper). The
core is split into a `lib/` subdirectory with one file per internal subsystem so
each is independently testable:

- `index.tsx` (wrapper) — React component, the `LensModule.Component`. Owns the
  pool/solution drag state, the indent controls, the Check action, and the
  view-mode toggle. The only file that imports React.
- `core.ts` (core) — `LensModule` defaults: `config`, `applicableTo`,
  `recommend`.
- `lib/lis.ts` (core) — **vendored** from the legacy
  `spiral-lens/public/static/parsonizer/lis.js` (patience-sort →
  longest-increasing-subsequence → inverse-indices). JS→TS mechanical
  conversion; pure; eslint-ignored. **One declined-defect fix (`best_lise`
  selection):** the de-underscored `parsonizer/lis.js` L99 replaced the original
  underscore `_.max(scores, s => s.score)` (still visible commented on L98) with
  `scores.sort(s => s.score)[length - 1]` — a single-argument function passed to
  `Array.sort`, i.e. **not a valid comparator**, so the "prefer the LIS with the
  most consecutive runs" tie-break silently stopped working. That is a
  **transcription bug introduced by the prior de-underscoring**, not a JSParsons
  design choice (the original `js-parsons/lib/lis.js` uses `_.max`). V2
  **restores the original `_.max` semantics** (pick the highest-consecutive-run
  LIS; first-max on ties) — the faithful conversion of the _true_ algorithm,
  declining to propagate the parsonizer defect, exactly as it declines the
  legacy `maxDistractors` overflow bug. `tests/lis.test.ts` pins the
  highest-score selection.
- `lib/parse-parsons.ts` (core) — **vendored & slimmed** from the legacy
  `parseCode` + `normalizeIndents`. Splits the snippet into solution lines and
  distractors, normalizes indentation to levels, selects the distractor subset,
  and produces the shuffled pool. Pure; eslint-ignored.
- `lib/evaluate-line-order.ts` (core) — **new**. Wraps `lis.ts` to compute, for
  the learner's placed lines, which are order-correct and which should move. It
  derives the LIS input per-Check by **matching each placed line's `code` to the
  next-unused solution line** (legacy `lastFoundCodeIndex` walk) so identical
  lines are interchangeable; distractors (no match) are flagged; an empty
  arrangement short-circuits before the LIS call. Pure.
- `lib/evaluate-indentation.ts` (core) — **new**. Per-line indent-level
  correctness for order-correct lines, against the model levels. Pure.
- `lib/arrange.ts` (core) — **new**. Pure reducer for the learner's arrangement:
  `placeFromPool` / `reorderWithinSolution` / `returnToPool` / `indent` /
  `outdent` over a plain `{ pool, solution }` value. No React, no DOM — the
  testable heart of the drag interaction (see § Interaction contract). Pure.
- `types.ts` (shared) — lens-local types: `ParsonsLine`, `ParsedParsons`,
  `PlacedLine`, `Arrangement`, `LineCorrectness`, `CorrectnessMap`,
  `EvaluationResult`, `ParsonsLensConfig`.

Tests split: `tests/lis.test.ts`, `tests/parse-parsons.test.ts`,
`tests/evaluate-line-order.test.ts`, `tests/evaluate-indentation.test.ts`,
`tests/arrange.test.ts`, `tests/core.test.ts` (vitest, no jsdom);
`tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).

## Dependencies (no install needed)

- **None beyond React.** Native HTML5 Drag-and-Drop is a browser API; the LIS
  and parsing algorithms are vendored as in-tree TS. No drag library, no jQuery,
  no AST parser (parsons does not parse).

## Future direction

- **WS2 `recommend()`.** Lens ships with `recommend: () => []`. Once WS2's
  analysis surface lands, `recommend(embodiment)` populates Block-Model
  placements and down-ranks snippets too trivial to order (single-line, or
  all-flat).
- **Seeded RNG for reproducible exercises.** The shuffle and distractor
  selection use bare `Math.random()`. Path: inject a `random: () => number` at
  the call-site (so the vendor stays mechanical) and pass a seeded PRNG from the
  wrapper when a `seed` config field is provided — so an educator can pin one
  arrangement across learners.
- **Live (as-you-drag) feedback toggle.** v1 is commit-then-Check by design. An
  educator-configurable "show feedback live" mode is a follow-up for
  lower-stakes practice.
- **`@dnd-kit` upgrade.** Native HTML5 DnD is accessibility- and touch-limited.
  If keyboard/screen-reader reordering or robust mobile support becomes a
  requirement, swapping the drag layer for `@dnd-kit` (keyboard sensors, touch
  sensors) is a contained follow-up — the pure core (`lis.ts`,
  `parse-parsons.ts`, the evaluators) is drag-mechanism-agnostic.
- **Keyboard reordering.** Independent of the DnD library: move-up / move-down
  and indent / outdent buttons make the exercise operable without a pointer.
- **URL state.** v1 ships none. A follow-up could persist `canIndent` /
  `maxDistractors` / `viewMode` to the URL, lifting to the orchestrator's URL
  surface when it lands (per the blanks precedent).
- **Toggle-line distractors (`$$toggle$$`).** The legacy supports inline
  toggle-able tokens (boolean/compop/mathop) and embedded unit/variable tests.
  Out of scope for v1; a richer-assessment follow-up.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="parsons"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state for the learner's arrangement
  or feedback; React owns the lifecycle. (No URL config in v1 — see drops.)
- **Read-only views** — the lens never mutates `embodiment` or `config`; the
  arrangement is lens-local state, never written back to `setSnippet`.
- **Tier 1 classification** — `applicableTo` returns `true` (text-only exercise,
  no AST). A deliberate divergence from `blanks` (Tier 2); the recommender, not
  `applicableTo`, judges suitability.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes.
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="parsons"` dispatch path.
- **V2 structural template (reference)**:
  [`../blanks/README.md`](../blanks/README.md).
