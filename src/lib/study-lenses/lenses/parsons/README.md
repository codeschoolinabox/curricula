<!-- cspell:ignore distractor distractors outdent colour Haden footgun gameable PRNG -->

# parsons

The `parsons` lens — a **drag-to-order code exercise** over the frozen
embodiment. The learner sees the program's lines **shuffled** (plus optional
**distractor** lines that do not belong) and reconstructs the program by
dragging lines into a solution column **in the correct order** and **at the
correct indentation**. A **Check** button grades the arrangement and surfaces
per-line feedback — correct / wrong place / wrong indentation, in a
colour-blind-safe palette — plus an aggregate score; a placed distractor reads
as "wrong place" and a missing line lowers the score, so the feedback never
reveals which lines are distractors. A view-mode toggle reveals the complete
solution for self-check without discarding the learner's arrangement.

A Parsons problem (Parsons & Haden 2006) isolates **program structure and
sequencing** from the load of recalling syntax: the learner does not write code
from scratch, but must reason about which line comes first, what nests inside
what, and which plausible-looking lines are actually wrong.

**The program IS the solution.** The educator authors the program as the correct
answer (lines in order, indented as intended); the lens derives the exercise
from it. Lines ending with the `// distractor` marker are pulled out as
distractors; every other non-blank line is a solution line whose source position
is its expected order and whose leading whitespace is normalized to an expected
indentation **level** (relative nesting, not raw spaces). C-style block comments
become collapsible **hint blocks** above the board.

## The lens object

The module's default export is a frozen `Lens` per [`../types.ts`](../types.ts):

- `name: 'parsons'` — the lens's identity within the kind.
- `phase: 'source'` — the lifecycle phase this lens teaches.
- `main` — the React component: the parsons surface
  (`<div data-lens="parsons">`) with the available-lines pool, the solution
  column, per-line indent controls, the Check button, per-line feedback, the
  score, the info panel, the view-mode toggle, and the attempt-history modal.
- `applicability(facts)` — `true` for every program. Parsons reorders **text
  lines**: it reads `facts.source` only, needs no syntax tree, and does not
  require the program to parse. Suitability (a single-line program is a vacuous
  exercise) is a recommender concern, not a gate.
- `config(overrides?)` — the pure factory: defaults applied, overrides win,
  unknown keys preserved (open shape), `undefined`-valued keys treated as
  absent, result deep-frozen.
- `recommend(embodiment)` — returns the frozen empty array; see
  [Future direction](#future-direction).

## Configuration

Fields the lens reads (all `SerializableValue` primitives; defaults applied by
the factory):

- `canIndent?: boolean` (default `true`) — whether indentation is a **graded**
  dimension. When `false`, the indent controls and guide steps are hidden and
  indentation is excluded from grading and the score.
- `maxDistractors?: number` (default `10`) — the maximum number of distractor
  lines shown; the selected count is `min(maxDistractors, declared)` (a cap, not
  a target). `0` suppresses distractors entirely.
- `indentSize?: number` (default `4`) — the literal spaces per indent level in
  the **complete view** (and the history snapshot). Presentation only — grading
  compares levels; the work view renders compact guide steps instead.
- `viewMode?: 'work' | 'complete'` (default `'work'`) — the initial view.

## UI structure

```text
<div data-lens="parsons" data-view-mode="work|complete" data-can-indent="true|false">
  <header data-parsons-toolbar>
    <button data-parsons-check>        — grade the current arrangement
    <button data-parsons-reset>        — re-shuffle + clear feedback (NOT history)
    <button data-parsons-view-toggle>  — single toggle; aria-pressed = solution shown
    <button data-parsons-history-open> — open the attempt-history modal
  — info panel (above the board; both views) —
  <details data-parsons-legend>            — 3-state feedback key, collapsed
  <details data-parsons-distractor-count>  — spoiler-free summary; body reveals
                                             "extra lines: N" (N > 0 only)
  <div data-parsons-hints>                 — educator hint blocks, each a collapsed
                                             <details><summary>Hint</summary><pre>…</pre>
  — work view —
  <main data-parsons-board>
    <ul data-parsons-pool>             — available pool (shuffled, draggable <li>;
                                         NO per-line feedback — see Anti-leak)
    <ol data-parsons-solution>         — solution column (drop target, ordered)
      <li data-parsons-line
          data-indent="N"              — indent level (semantic, non-negative int)
          data-correctness="…">        — after Check: correct|wrong-order|
                                         wrong-indent|distractor
        <span data-parsons-indent-step>      — N compact guide rules
        <code>line text</code>
        <span data-parsons-indent-controls>  — right-side controls
            <button data-parsons-outdent>    — omitted at level 0
            <button data-parsons-indent>     — when canIndent
  <div data-parsons-score>             — aggregate score (after Check), aria-live
  — complete view —
  <pre data-parsons-complete>          — model solution, read-only, in order at
                                         literal level*indentSize; no distractors
  — attempt-history modal (when open; both views) —
  <div data-parsons-history-modal>     — role=dialog; Escape / data-parsons-history-close
    <li data-parsons-attempt>          — one per Check: number, pass/fail, score +
        <li data-snapshot-line>        — frozen snapshot lines (data-correctness)
</div>
```

The `data-lens` attribute plus the `data-parsons-*` family above,
`data-view-mode`, `data-can-indent`, `data-indent`, and `data-correctness` are
harness selectors and CSS hooks; renaming any is a contract change.
`data-line-id` (every pool and solution `<li>`), `data-legend-state` and
`data-legend-swatch` (legend rows), and the history-modal internals
(`data-parsons-history-header`, `data-parsons-attempt-list`,
`data-parsons-attempt`, `data-parsons-attempt-summary`,
`data-parsons-attempt-snapshot`, `data-attempt-success`, `data-snapshot-line`)
are **internal wiring hooks** — load-bearing, but harness and CSS code keys off
the `data-parsons-*` family. `data-correctness` is **absent until the first
Check** — treat absence as "ungraded," not a state.

## Interaction contract (native HTML5 drag-and-drop)

Native HTML5 DnD backs all three moves — pool → solution (place at the drop
index), solution → solution (reorder), solution → pool (return, discarding
indent) — with no drag library. The **arrangement logic is pure**
(`lib/place-from-pool.ts`, `lib/reorder-within-solution.ts`,
`lib/return-to-pool.ts`, `lib/indent-line.ts`, `lib/outdent-line.ts` over a
plain `{ pool, solution }` value), so every transition is unit-testable without
a DOM:

- `onDragStart` writes `${zone}:${id}` into `dataTransfer` (`text/plain`) so the
  drop handler reads both from the event with no cross-handler state.
- `onDragOver` **MUST call `event.preventDefault()`** — without it `onDrop`
  never fires. This is the #1 native-DnD footgun and a load-bearing line.
- `onDrop` computes the insert index from the drop target (dropping onto line
  _i_ inserts before _i_; dropping onto the zone's empty area appends) and
  dispatches one pure transition.

jsdom does not implement real drag-and-drop: the component tests prove the
wiring; real drag behavior is a browser-observation concern.

## Indent contract (when `canIndent`)

Each placed line carries an indent level (`data-indent="N"`), shown in the work
view as `N` compact fixed-width **guide steps** — a relative nesting cue, not a
literal margin — with the indent/outdent buttons on the **right** so the code's
left origin stays fixed and equal depths align. The outdent button is omitted at
level 0 (the floor is enforced by its absence; the transition also floors at 0).
Indent is learner state: every line **starts at level 0** when it enters the
solution, persists across reorders within the column, and resets to 0 on a pool
round-trip. Grading compares the level against the model line's normalized
level.

## Feedback contract (Check)

Check grades the arrangement via `lib/evaluate.ts` and resolves each placed line
to exactly one state under the precedence
`distractor > wrong-order > wrong-indent > correct`:

| State          | Meaning                                                          | Rendered as                     |
| -------------- | ---------------------------------------------------------------- | ------------------------------- |
| `correct`      | right relative order **and** (if `canIndent`) right indent level | blue tint, solid border         |
| `wrong-order`  | not in the LIS of placed lines' model positions (should move)    | vermilion tint, dashed border   |
| `wrong-indent` | order-correct but indent level ≠ model level                     | vermilion tint, dotted border   |
| `distractor`   | a distractor line wrongly placed in the solution                 | same as wrong-order (no badge)  |
| `unplaced`     | a solution line still left in the available pool                 | not rendered; lowers score only |

Order is graded via a Longest-Increasing-Subsequence comparison against the
model order, so the feedback highlights the **fewest** lines that need to move.
Duplicate lines are interchangeable (each placed copy matches the next-unused
model line). Indent is evaluated **only for order-correct lines**.

**Anti-leak: feedback never identifies the distractors.** A placed `distractor`
keeps its `data-correctness` value but CSS renders it identically to
`wrong-order`; pool lines carry **no** per-line feedback at all (flagging the
missing solution lines would identify the distractors by elimination) — a
missing line is signalled only through the score. The legend lists only the
three placed states a learner can act on.

**Colour-blind-safe palette.** Wong's palette (blue `#0072B2` correct, vermilion
`#D55E00` errors — no red/green), with the **border style** carrying the signal
too (solid/dashed/dotted), so the states survive total colour blindness. A
dark-mode media query bumps the tint alpha.

**Score.** `total === 0 ? 100 : Math.round(correct / total * 100)` over solution
lines (distractors excluded; unplaced solution lines count toward `total`, so
the exercise is not gameable by omission). `success` is `correct === total` with
no distractor placed. Any arrangement edit clears the last Check's feedback;
Check is re-runnable.

## View contract

One `data-parsons-view-toggle` button flips between the work view (the board)
and the complete view (`<pre data-parsons-complete>` — the model solution in
order at literal `level * indentSize`, no distractors), seeding from
`config.viewMode`; `aria-pressed` is `true` while the solution shows. Toggling
is a **self-check affordance, not a reset**: it preserves both the arrangement
and any Check feedback.

## Attempt history

Each Check appends an `Attempt` to in-mount history; a toolbar button opens a
modal (`role="dialog"`, closed by button or Escape) listing every attempt —
number, pass/fail, score, and a read-only **snapshot of the arrangement as it
was checked**. Snapshots are frozen at Check time and rendered verbatim — the
modal never re-grades — and the snapshot CSS folds `distractor` into the
wrong-place look exactly as the board does. History persists across Reset and
dies on unmount (disposable practice; no cross-mount persistence).

## Edge cases

- **Empty program** — pool and solution both empty; Check scores 100 (vacuously
  complete); the order evaluator short-circuits before the LIS.
- **Single solution line** — a degenerate exercise; still offered (the gate is
  total; down-ranking is a recommender concern).
- **More `// distractor` lines than `maxDistractors`** — a random subset of size
  `maxDistractors` is selected per mount.
- **Duplicate lines** — matched left-to-right to the next-unused model position;
  no penalty for placing "the wrong copy."
- **A program that does not parse** — irrelevant; parsons grades text order and
  indentation, not a syntax tree.
- **Indented first line / unresolvable dedent** — normalized to the `-1`
  IndentationError sentinel, which never matches a learner level.

## Future direction

- **`recommend`** — propose next steps and down-rank programs too trivial to
  order (single-line, all-flat).
- **Seeded RNG** — the shuffle and distractor selection take an injectable
  `random` (already threaded through `parseParsons`); a `seed` config field plus
  a seeded PRNG at the call-site would pin one arrangement across learners.
- **Keyboard reordering / touch drag** — native HTML5 DnD is pointer-oriented;
  explicit move buttons or a drag-library swap are contained follow-ups (the
  pure core is drag-mechanism-agnostic).
- **Live (as-you-drag) feedback toggle** — grading is commit-then-Check by
  design; an educator-configurable live mode is a follow-up.

## Navigation

- Region: [`../README.md`](../README.md) — the lens kind's mechanics.
- [`DOCS.md`](./DOCS.md) — this lens's architectural sketch and decisions.
- [`types.ts`](./types.ts) — the lens-local domain model.
- Kind contract: [`../types.ts`](../types.ts) — `Lens`, `LensProperties`,
  `LensConfig`, `Recommendation`.
- Embodiment contract: [`../../embody/types.ts`](../../embody/types.ts) — the
  `Embodiment` and `Facts` the lens consumes.
