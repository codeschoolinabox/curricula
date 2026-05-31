# lenses/parsons

The `parsons` lens — a **drag-and-drop line-ordering** exercise. The lens
splits the embodiment's source into lines, shuffles them deterministically
(seeded), and renders them as draggable rows. The learner reorders the
rows to reconstruct the original line sequence; correctness is per-row
("correct position" vs. "wrong position") and the score is the percentage
of rows in their original position.

One of the lens-module implementations the orchestrator's picker enumerates
and the recommender ranks.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import parsons from './index.js';

// orchestrator mounts in lens mode (illustrative):
<parsons.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'parsons'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the draggable row stack
  (`<div data-lens="parsons">`).
- `config(overrides?): LensConfig` — resolves the per-lens config. Fields
  the lens reads:
  - `seed?: number` — seeds the deterministic shuffle. When unset, the
    wrapper computes a per-mount random seed at first render (via
    `useMemo([])`) so each mount produces a fresh exercise; when set,
    the same snippet + config produces the same shuffle (useful for tests
    or a "retry this exact exercise" affordance). The core's shuffle
    function is pure; the wrapper owns the non-determinism source.
  - Anything else passed in is preserved (config is open-shape per
    [`../types.ts`](../types.ts) `LensConfig`). v1 intentionally ships
    without other knobs — line-ordering is the entire affordance.
- `applicableTo(embodiment): boolean` — returns `true` for any snippet.
  Does not read `embodiment` (the `() => true` literal is intentional,
  matching the [`../annotate/`](../annotate/) precedent). **Tier 1
  (text-only)** per [`../README.md`](../README.md) § Three-tier
  classification: the lens works on raw source text without needing
  parse status. The "correct" answer is the original source order
  regardless of whether that order produces valid syntax; educators
  authoring parsons exercises should verify the snippet parses (via
  the `validate` gate) before assigning it.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]`
  for this batch. Block-Model placement contributions land once the WS2
  analysis pipeline ships per
  [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md).
  See [Future direction](#future-direction).

## Why this lens exists

The `parsons` lens is the learner's **line-ordering workbench**: a piece
of JEJ source is shuffled line-by-line, and the learner drags the rows
back into order. Pedagogically it exercises program-structure
comprehension — understanding which statements logically precede which
— without requiring the learner to write any syntax.

The lens is Tier 1 because line ordering does not need an AST: any
text with `\n` separators can be shuffled. This is the simplest lens
in the V2 roster and intentionally a complement to `blanks` (which
exercises tokens within lines).

Shuffle is **deterministic** given the same `(snippet, seed)`. The
wrapper's per-mount random seed gives each fresh mount a different
shuffle, but a pinned `seed` reproduces a specific exercise (for tests
or a "redo this exact challenge" affordance).

## Glossary

- **Line** — one entry produced by splitting `embodiment.source.code`
  on `\n`. Empty lines are preserved as empty entries (the learner
  drags them like any other row).
- **Row** — a draggable rendering of one line. Each row carries a
  stable identity (its index in the original source) so the lens can
  track which line moved where.
- **Original index** — the row's 0-based index in the unshuffled
  source (`Row.originalIndex`). Immutable; assigned at row
  construction in the shuffle pass.
- **Current index** — the row's 0-based index in the learner's
  current arrangement. Mutable; updated on every drag-and-drop
  reorder.
- **Correctness** — for one row, `correct` when `currentIndex ===
  originalIndex`; `incorrect` otherwise. (No `unfilled` state —
  every row always has a current index.)
- **Score** — the percentage of rows in their original index
  (`correctCount / rowCount * 100`, rounded). **Suppressed (rendered
  as `–`) when `rowCount < 2`** — a 0- or 1-row stack has no
  meaningful ordering exercise to grade. Avoids the trap where a
  single-row stack trivially scores 100% without learner effort.

## UI structure

```text
<div data-lens="parsons">
  <output data-parsons-score>           — score readout ("N% (k/N)" or "–")
  <ol data-parsons-stack>                — the draggable row stack
    <li data-parsons-row data-row-original-index="N" draggable>
      <span>line text</span>
    </li>
    ...
  </ol>
</div>
```

- The root carries `data-lens="parsons"` (the lenses-peer invariant per
  [`../DOCS.md` § Structural constraints](../DOCS.md)).
- `data-parsons-score`, `data-parsons-stack`, `data-parsons-row`,
  `data-row-original-index` are sandbox-harness selectors and per-
  lens CSS hooks; renaming them is a contract change.
- Drag-and-drop uses the **HTML5 drag-and-drop API** (no jQuery, no
  external drag library). Each row is `draggable`; the stack handles
  `dragover` / `drop` events to reorder.
- v1 ships **without a toolbar**: no difficulty, no categories, no
  reset button. A "reset" affordance is served by the orchestrator-
  level remount (toggle to another lens and back; or edit the
  snippet) — both produce a fresh per-mount seed and a new shuffle.

## Initial state

At mount, each row's `currentIndex` equals its position in the
shuffled-output stack; the `originalIndex` is baked in at row
construction (during the shuffle pass) and never changes. Reordering
updates only the row positions in the stack — `originalIndex` is the
immutable correctness target.

**Per-remount fresh shuffle**: when `config.seed` is unset, toggling
away to another lens and back produces a new shuffle (per the
disposable-practice contract — each remount runs `useMemo([])`
fresh). A pinned `seed` reproduces the same shuffle across remounts
(useful for tests or a "retry this exact challenge" affordance).

## Tier classification + Block Model placement

**Tier 1** per [`../README.md`](../README.md) § Three-tier classification:
`applicableTo: () => true`. The lens works on raw text; parse status is
irrelevant.

In v1 the lens **does not occupy any Block Model cells** because
`recommend()` returns `[]` (see [Future direction](#future-direction)).
The intended cell, once `recommend()` ships substance, is:

- `{ level: 'surface', scope: 'relations' }` — line ordering exercises
  relations between statements (which one precedes which).

Cell shapes per the canonical `BlockModelCell` type at
[`../types.ts`](../types.ts) (`{ level, scope, nmComponents? }`).

## Shuffle contract

- Lines are split on `\n` (preserving empty lines).
- The shuffle is a seeded Fisher-Yates permutation: for `i` from
  `lines.length - 1` down to `1`, pick `j` deterministically from the
  seeded RNG, swap `lines[i]` and `lines[j]`.
- A snippet with `0` or `1` lines is not meaningfully shuffleable;
  the lens renders the single line (or empty stack) as-is.
- Two distinct seeds will (usually) produce different shuffles. Same
  seed reproduces the same shuffle byte-for-byte.

## Validation contract

- Per-row: `correct` when the row's `originalIndex` equals its current
  index in the stack; `incorrect` otherwise.
- Score = `Math.round(correctCount / rowCount * 100)` when
  `rowCount >= 2`; otherwise score is **suppressed** (rendered as
  `–`).
- Validation runs on every reorder (React re-render cadence); no
  debounce.

## Known v1 limitations

These are deliberate gaps in v1 shipping scope; each lands in a
follow-up. Surfaced here so AR-2/AR-3/AR-5 reviewers do not re-
discover them, and curriculum authors are not surprised.

- **No keyboard reordering.** HTML5 `draggable` does not support
  arrow-key / space-bar reordering natively. A learner using a
  screen-reader or who cannot use a mouse cannot complete the
  exercise in v1. Follow-up: WAI-ARIA Listbox pattern with
  `aria-grabbed` / `aria-dropeffect` semantics, or a swap-on-
  arrow-key handler. **This is a known a11y gap.**
- **No touch support.** Native `draggable` is unreliable on touch
  devices (iOS Safari partial, Android Chrome inconsistent). v1
  ships desktop-only. Follow-up: a touch-event handler pair
  (`touchstart` / `touchmove` / `touchend`) that mirrors the
  drag-and-drop semantics; or a swap-to-library decision if
  multiple lenses surface the same need.
- **No reset button.** Orchestrator-level remount (lens toggle,
  snippet edit) is the v1 reset affordance.

## What this lens does NOT do

Inherited from the lenses peer (single-writer state, disposable practice,
no `embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific
drops vs. the prior-art `ParsonsLens.jsx`:

- **No iframe.** The prior art embedded a standalone HTML page via
  `iframe` to host the `JSParsons` (jQuery-based) library. V2 is
  pure React with HTML5 drag-and-drop; no iframe, no jQuery, no
  external lib.
- **No distractor lines.** The prior-art `parsonizer` library supported
  injecting "distractor" lines (plausible-but-wrong) into the shuffle.
  V2 ships without; deferred to a follow-up.
- **No trace / diff variants.** The WC-kit parsons had `parsons-trace`
  and `parsons-diff` sub-variants. Out of scope for v1; each would be
  a separate lens (or a config variant) in a follow-up.
- **No syntax-highlighting.** Prior art used Prism via the WC kit. v1
  renders rows as plain `<span>` text; Prism colorization can land in
  a follow-up.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper).
The core is split by responsibility for testability:

- `index.tsx` (wrapper) — React component, the `LensModule.Component`.
  Owns per-mount UI state (the current row order, the resolved seed)
  and composes the core's pure derivations into the surface.
- `core.ts` (core) — exposes `config`, `applicableTo`, `recommend` for
  the `LensModule` literal in `index.tsx`. No React imports.
- `shuffle.ts` (core) — pure: `(source, seed) → ReadonlyArray<Row>`.
  Splits source by `\n`, runs the seeded Fisher-Yates shuffle, returns
  rows with `text` + `originalIndex`. Split out of `core.ts` because
  the algorithm is testable as a standalone pure function (no
  `LensConfig` ceremony) and may lift to `orchestrate/lib/` once a
  second seeded-RNG consumer surfaces.
- `types.ts` (both) — lens-local types: `Row`, `Correctness`,
  `ParsonsLensConfig`.

`config`, `applicableTo`, and `recommend` are **inlined into `core.ts`**
rather than split into separate files (follows the
[`../blanks/core.ts`](../blanks/core.ts) and
[`../annotate/core.ts`](../annotate/core.ts) precedents).
[04-lens-migration.md § Lens file structure](../../.planning-handoffs/04-lens-migration.md)
documents the alternative split.

Tests split: `tests/shuffle.test.ts`, `tests/core.test.ts` (vitest, no
jsdom); `tests/component.test.tsx` (vitest + jsdom + `@testing-library/
react`).

## Future direction

- **WS2 `recommend()`** — substantive recommendations once WS2 ships.
  Heuristic: parsons relevance peaks at 8–15 lines, drops for very
  short or very long snippets (per the prior art's mental model).
- **Distractor injection** — the legacy `parsonizer` library supported
  it; V2 ships without; a follow-up `config.includeDistractors` knob
  could land later.
- **Syntax-highlighted rows** — Prism / `prism-react-renderer` to
  colorize the row text; per-row visual cue for token types.
- **Trace / diff variants** — additional configurations of the lens
  for execution-step ordering (trace) or change-detection (diff) per
  the WC-kit precedent. Each likely a separate lens or a config-
  variant follow-up.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="parsons"` on the wrapper's root element** — load-bearing
  for sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state; React owns the
  lifecycle. The current row order exists only between mount and unmount.
- **Read-only views** — the lens never mutates `embodiment` or `config`.
  Row reordering is local React state; it does not propagate to snippet
  state.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` +
  `LensProps` + `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts)
  — the `Snippet` type the lens consumes (in particular `source.code`).
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="parsons"` dispatch path.
- **Lens-migration plan**:
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
- **Prior art**:
  [`0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses/ParsonsLens.jsx`](../../../../../../../0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses/ParsonsLens.jsx)
  (React iframe wrapper around standalone JSParsons) and
  [`0-study-lenses-committee/zz--study-lenses-package--2025-try/00-repo--study-lenses/lenses/parsons/`](../../../../../../../0-study-lenses-committee/zz--study-lenses-package--2025-try/00-repo--study-lenses/lenses/parsons/)
  (WC kit with `parsonizer` + jQuery, plus `parsons-trace` and
  `parsons-diff` sub-variants).
