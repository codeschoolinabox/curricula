# lenses/annotate

The `annotate` lens — an annotation surface over the snippet, supporting two
views (syntax-highlighted code OR generated flowchart), three annotation tools
(freehand pen, eraser, positioned text notes), and a flowchart-node select tool
(click a node to outline it). The learner can switch between code-view and
flowchart-view within a single mount **without losing annotations** on either
view; both annotation sets persist for the lifetime of
the mount and are discarded together when the snippet changes (per the lenses
peer's [disposable-practice contract](../README.md#conventions)).

**Toggle-preserves-annotations invariant:** toggling `viewMode` does not mutate
either annotation set; it only swaps which is rendered. This is a load-bearing
pedagogical claim and a testable contract.

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

> Migrated from the pre-refactor `HighlightLens.jsx` (registry id `highlight`).
> Renamed at WS4 Phase 0 because the lens does annotation-on-top-of-display, not
> token/line highlighting — the `highlight` tool was a deferred sub-feature. See
> [`./DOCS.md` § Naming](./DOCS.md) for the rationale and the migration audit
> trail.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import annotate from './index.js';

// orchestrator side (illustrative — registry shape is open-spec; see
// `../../orchestrate/DOCS.md` § Module ownership for the lock):
const roster = [annotate, /* parsons, blanks, … */];

// orchestrator mounts in lens mode:
<annotate.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'annotate'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the annotation surface (`<div data-lens="annotate">`)
  with the active view + drawing/note overlay.
- `config(overrides?): LensConfig` — resolves the per-lens config. Fields the
  lens reads:
  - `colorize?: boolean` (default `true`) — when `false`, code-view skips Prism
    tokenization and renders plain monospaced text.
  - `defaultView?: 'code' | 'flowchart'` (default `'code'`).
  - `eraserRadius?: number` (default `20`, pixels) — hit-test radius for the
    eraser tool. Tunable per fence so tablet vs. trackpad learners get
    appropriate precision. Anything else passed in is preserved (config is
    open-shape per [`../types.ts`](../types.ts) `LensConfig`).
- `applicableTo(embodiment): boolean` — returns `true` for any snippet (Tier 1
  per [`../README.md`](../README.md) § Three-tier classification). The
  code-view + drawing/notes work on any source string, parseable or not. The
  flowchart-view is a Tier-2 sub-feature internally: the flowchart-toggle button
  disables itself when `embodiment.status.parsed === false`, surfacing the
  limitation at the affordance rather than at runtime.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]` for this
  batch. Block-Model placement contributions land in a follow-up commit once the
  WS2 analysis pipeline ships per
  [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md).
  See [Future direction](#future-direction).

## Why this lens exists

The `annotate` lens is the learner's **annotation workbench**: a place to read
code (or its flowchart), draw on it, jot positioned notes, and switch between
the two representations without rebuilding the annotations. Pedagogically it
serves any "trace what's happening, mark what's interesting, leave yourself a
note" workflow — annotation-on-top-of-display is its own pedagogical
intervention, not just a UI affordance.

Two-view design — code OR flowchart, learner toggles — exists because some
learners build comprehension by walking the source line-by-line while others
build it by tracing the control-flow graph. Letting them toggle without losing
their pen marks means the annotation surface serves both reading strategies.

Flowchart nodes are **clickable while the `select` tool is active** (React event
delegation): clicking a node outlines it so the learner can correlate a
control-flow construct in the flowchart with the source line they just marked up
in code-view. Flowchart-view enters with `select` active by default, so this
correlation is the primary flowchart interaction. Without this interactivity the
flowchart would be a static picture; the click-correlation is what earns the
toggle's complexity.

## Glossary

- **View** — one of the two representations of the snippet the lens renders:
  `code` (syntax-highlighted source) or `flowchart` (SVG flow-chart generated
  from the source).
- **Tool** — the active interaction mode. One of `pen` (freehand stroke),
  `eraser` (remove strokes near the click), `note` (create a positioned text
  note), or `select` (flowchart-node inspection — click a node to outline it,
  correlating a control-flow construct with the source line marked up in
  code-view). Tools partition into two kinds: **annotation tools** (`pen`,
  `eraser`, `note` — the drawing overlay captures their events) and **inspection
  tools** (`select` — the overlay yields so events reach the view beneath). This
  partition, not the tool name, drives overlay event capture. The active tool
  **defaults per view**: code-view enters with `pen` (drawing is the primary code
  interaction), flowchart-view enters with `select` (node inspection is the
  primary flowchart interaction). The learner can switch tools freely within
  either view; toggling the view resets the tool to that view's default.
- **Stroke** — one continuous pen-down → pen-up draw, recorded as an ordered
  point array + color. (Prior-art name: `drawingPath`. The rename clarifies that
  a stroke is _one gesture_; an SVG `<path>` or `<polyline>` is the element
  rendering it.)
- **Note** — a text label pinned to a position over the active view, with a
  color border. (Prior-art name: an entry in the `annotations` array with
  `type === 'note'`.)
- **Annotation set** — the collection of strokes + notes belonging to one view.
  The umbrella term covers both. Each view has its own annotation set; switching
  views swaps which set is visible, not which exists.
- **Color** — the active stroke/note color, picked from a fixed six-swatch
  palette.

## UI structure

```text
<div data-lens="annotate" data-view-mode="code|flowchart">
  <header>                          — title
  <toolbar data-tool="…">           — tool picker, color picker, view-toggle, clear-all
  <main data-view-mode="…">         — active view + drawing/note overlay
    code-view OR flowchart-view
    <svg.drawing-overlay>           — polylines for saved strokes + in-progress stroke
    <div.notes-overlay>             — positioned <div.note> per saved note
  </main>
  <note-input-dialog?>              — positioned textarea when creating a note
  <footer>                          — instructions
</div>
```

The `data-lens` attribute is the lenses-peer invariant (see
[`../DOCS.md` § Structural constraints](../DOCS.md)). The `data-view-mode` and
`data-tool` attributes are sandbox-harness selectors and CSS hooks; renaming
them is a contract change.

Flowchart nodes carry `data-flowchart-node` attributes (added by a
post-SVG-inject `useEffect` that walks the rendered SVG and tags candidate
elements). React event delegation on the flowchart container handles click +
hover via `event.target.closest( '[data-flowchart-node]')`.

## Tool contract

- **pen** — pen-down (`mousedown`) starts a stroke at the cursor position
  (coordinate space: the active view's bounding rect). pen-move (`mousemove`)
  appends points. pen-up (`mouseup`) finalizes the stroke into the active view's
  annotation set with the current color, then resets the in-progress stroke.
- **eraser** — `click` removes any saved stroke whose any point lies within
  `config.eraserRadius` pixels of the click position.
- **note** — `click` opens a note-input dialog at the click position with an
  empty textarea. The dialog is dismissed by Save (commits a note into the
  active view's annotation set with the current color) or Cancel.
- **select** — the flowchart-node **inspection** tool (adds no annotation). While
  `select` is active, a `click` on a flowchart node outlines it so the learner
  can correlate it with a code-view annotation; saved strokes stay painted over
  the flowchart. Switching to `pen`/`eraser`/`note` restores drawing on the
  flowchart. (The overlay event-capture gating and the node-resolution mechanism
  live in [`./DOCS.md` § Structural constraints](./DOCS.md) — the contract here
  is behavioral: an inspection tool routes clicks to node selection, not to
  drawing.)
- The active tool **defaults per view**: code-view enters with `pen`,
  flowchart-view enters with `select`. Toggling the view resets the active tool
  to the new view's default (and clears any selected node); within a view the
  learner can switch tools freely.
- The `clear-all` button on the toolbar wipes BOTH strokes and notes of the
  active view after a confirmation. The inactive view's annotation set is
  untouched.

## View contract

- **code view** — renders `embodiment.source.code` as colorized `<pre><code>`
  (via `prism-react-renderer`) when `config.colorize` is `true`, or as plain
  `<pre><code>` when `false`. No editing — the code is read-only per the lenses
  peer's single-writer invariant.
- **flowchart view** — generates an SVG flowchart from `embodiment.source.code`
  using `js2flowchart`'s `convertCodeToSvg`. The call is synchronous; the lens
  wraps it in a Promise so the wrapper can render a loading state while
  generation is in flight. On parse failure, an inline error state renders (NOT
  a retry — the same source will fail the same way; the flowchart-toggle is the
  way back to code-view).
- The view toggle is a single button on the toolbar. The button is **disabled**
  when `embodiment.status.parsed === false` so a learner cannot toggle into a
  guaranteed-failing flowchart-view in the first place. The annotation overlay
  reattaches to the newly active view's annotation set when the toggle succeeds,
  the active tool resets to the new view's default (`pen` for code, `select` for
  flowchart), and any selected flowchart node is cleared.
- **Initial view is parse-gated.** When `config.defaultView === 'flowchart'` but
  `embodiment.status.parsed === false`, the initial view degrades to `code` (and
  the initial tool to `pen`), so a learner never lands in a guaranteed-failing
  flowchart-view on mount. Together with the disabled toggle, an unparseable
  snippet is code-view-only for the mount's lifetime.

## What this lens does NOT do (lens-specific drops only)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art `HighlightLens.jsx`:

- **No StudyBar.** The prior art bundled run/trace/ask/tables buttons. Those are
  sibling lenses; the orchestrator's L1 picker exposes them.
- **No telemetry.** The prior art's `trackStudyAction` calls are dropped for v1.
  A future internal-EventBus integration (WS3 F5) may surface
  `annotation-added`, `view-toggled`, `cleared` events for picker UI feedback.
- **No question-generation.** The `askOpenEnded` import was dead in the prior
  art (imported, never called). Question-generation is the future `ask` lens's
  job.
- **No global ColorizeContext.** Replaced by the lens-local `config.colorize`
  field.

## Two-layer module (with internal subsystem split)

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper). The
core is further split into three internal subsystems so each is independently
testable and any subsystem can later lift to `orchestrate/lib/*` if a second
consumer surfaces:

- `index.tsx` (wrapper) — React component, the `LensModule.Component`. Composes
  the three subsystems below into the UI shell.
- `core.ts` (core) — orchestrates the subsystems; exposes the lens's `config`,
  `applicableTo`, and `recommend`.
- `render-code.ts` (core) — pure: `(source, colorize) → CodeSpanTree`. Prism
  tokenization, no React.
- `render-flowchart.ts` (core) — pure (Promise): `source → FlowchartSvg`.
  `js2flowchart` invocation, no React.
- `annotations.ts` (core) — pure: annotation/drawing state model. Add / remove /
  clear strokes + notes, per-view scoping.
- `types.ts` (both) — lens-local types: `Tool`, `ViewMode`, `Stroke`, `Note`,
  `AnnotationSet`, narrowed `LensConfig`.

Tests split: `tests/render-code.test.ts`, `tests/render-flowchart.test.ts`,
`tests/annotations.test.ts`, `tests/core.test.ts` (vitest, no jsdom);
`tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).

## Dependencies added (Phase 0 install)

- **`js2flowchart`** — flowchart SVG generation (already used by the prior art).
- **`prism-react-renderer`** — React-idiomatic Prism wrapper. Picked over
  `prismjs` direct because: (a) no `dangerouslySetInnerHTML` for code, (b) no
  string-injection class manipulation, (c) sub-10kb bundle delta. The
  security/maintainability win is decisive against the smaller-bundle
  alternative.

## Future direction

- **WS2 `recommend()`.** This lens ships with `applicableTo: () => true` and
  `recommend: () => []`, which means it **appears in the picker but not in the
  recommendations panel** until WS2 ships. Once WS2's analysis surface lands,
  `recommend(embodiment)` populates Block-Model placements with snippet-fit
  relevance heuristics (e.g. higher relevance when the snippet has control-flow,
  motivating the flowchart-view's added value). The specific cells are WS2's
  call — drafting them here would lock the wrong dimension prematurely.
- **Internal EventBus dispatch** (WS3 F5) — `annotation-added`, `view-toggled`,
  `cleared` events for picker UI feedback and potential future LMS bridging.
- **Tool extensions** — `arrow` and `circle` were stubbed in the prior art
  ("coming soon"); the line-level `highlight` tool was half-implemented and
  dropped at migration. Restoration is its own increment per tool.
- **Keyboard node selection** — v1's `select` tool is mouse-`click`-only;
  flowchart nodes are not yet keyboard-focusable/selectable. Keyboard-reachable
  node inspection is deferred (named here rather than left silently absent).
- **Per-config Prism theme** — Prism theme is hard-coded to one default;
  per-config theme selection is deferred.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="annotate"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state; React owns the lifecycle.
  Annotation sets exist only between mount and unmount.
- **Read-only views** — the lens never mutates `embodiment` or `config`.

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
  `lens="annotate"` dispatch path.
- **Lens-migration plan**:
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
