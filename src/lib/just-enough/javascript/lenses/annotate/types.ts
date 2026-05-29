/**
 * @file Domain model for the `annotate` lens — an annotation surface
 * over the snippet with two views (code, flowchart) and four tools:
 * three annotation tools (pen, eraser, note) plus one inspection tool
 * (select). The learner toggles views without losing
 * annotations on either; both annotation sets persist for the lifetime
 * of one mount and are discarded together when the snippet changes.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./render-code.ts` +
 *   `./render-flowchart.ts` + `./annotations.ts`) produces the
 *   per-view derivations and the annotation-state model the wrapper
 *   renders.
 * - The React wrapper (`./index.tsx`) composes the cores, owns the
 *   per-mount UI state (active view, active tool, active color,
 *   in-progress stroke, note-input dialog, selected flowchart node),
 *   and dispatches user interaction events.
 *
 * @remarks Per-mount wrapper state that does NOT need a named type
 * here: `selectedNodeId: string | null` (transient UI selection on a
 * flowchart node — see `./DOCS.md` § Phase 3 + § Structural
 * constraints). The structural constraint that selection is rendered
 * via a CSS rule keyed on `data-flowchart-node`, never via
 * `element.style` mutation, is enforced at the wrapper layer; no
 * type-level enforcement at this surface.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. Annotation sets exist only in
 * per-mount React state — no `localStorage`, no module-level cache,
 * no refs across mounts. See `../README.md` § Disposable practice.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop
 * type for `config`; the lens reads three known fields (`colorize`,
 * `defaultView`, `eraserRadius`) and ignores the rest. Per-lens
 * narrowing is captured in `AnnotateLensConfig` below — it documents
 * the known fields but does NOT exclude unknown ones (config is
 * open-shape at the contract boundary).
 *
 * @remarks Naming note: the prior-art lens was called `highlight` and
 * its drawing data lived in `drawingPaths`. The new lens is named
 * `annotate` (the lens does annotation-on-top-of-display, not token
 * highlighting); strokes (one continuous gesture) and notes
 * (positioned text labels) are the two annotation kinds. See
 * `./README.md` § Glossary for the full vocabulary.
 */

// ─── View + tool ────────────────────────────────────────────

/**
 * Which representation of the snippet the active view renders.
 *
 * @remarks The view-toggle is a single button on the toolbar; when
 * `embodiment.status.parsed === false`, the toggle is disabled
 * (flowchart generation requires a parseable source).
 */
type ViewMode = 'code' | 'flowchart';

/**
 * Active tool. The tool determines what learner mouse events do over
 * the active view. `pen`, `eraser`, and `note` are the
 * drawing/annotation tools (active over either view); `select` is the
 * flowchart-node inspection tool — clicking a flowchart node selects it
 * (visual outline) so the learner can correlate a control-flow construct
 * with the source line they marked up in code-view.
 *
 * @remarks The active tool **defaults per view**: code-view enters with
 * `pen` (drawing is the primary code interaction); flowchart-view enters
 * with `select` (node inspection is the primary flowchart interaction).
 * The learner can switch tools within either view — e.g. switch to `pen`
 * to draw on the flowchart. While `select` is active the drawing overlay
 * yields pointer events so clicks reach the flowchart container, where
 * React event delegation resolves the node via
 * `closest('[data-flowchart-node]')`.
 *
 * @remarks Pre-refactor tool catalog also included `arrow`, `circle`,
 * and a line-level `highlight`; those were stubbed-and-deferred and
 * are not in the v1 catalog. Restoration is a per-tool follow-up.
 */
type Tool = 'pen' | 'eraser' | 'note' | 'select';

// ─── Annotation primitives ──────────────────────────────────

/**
 * One point on a stroke, in the active view's local coordinate space
 * (the view's bounding rect; origin top-left).
 */
type Point = {
	readonly x: number;
	readonly y: number;
};

/**
 * One pen-down → pen-up gesture. The points are ordered (rendered as
 * a polyline).
 *
 * @remarks Prior-art name: `drawingPath`. The rename clarifies that a
 * stroke is *one gesture*; an SVG `<polyline>` is the element
 * rendering it. The `color` field is a hex color string from the
 * six-swatch palette (palette is a module-level constant in
 * `index.tsx`; not type-enforced — see `./DOCS.md` § Phase 1).
 */
type Stroke = {
	readonly id: string;
	readonly points: ReadonlyArray<Point>;
	readonly color: string;
};

/**
 * One positioned text label over the active view.
 *
 * @remarks Prior-art name: an entry in `annotations` with
 * `type === 'note'`. The `color` field is a hex color string from
 * the six-swatch palette.
 */
type Note = {
	readonly id: string;
	readonly position: Point;
	readonly text: string;
	readonly color: string;
};

/**
 * The collection of strokes + notes belonging to one view. Each view
 * (`code` and `flowchart`) has its own `AnnotationSet`; switching
 * views swaps which set is rendered, not which exists.
 */
type AnnotationSet = {
	readonly strokes: ReadonlyArray<Stroke>;
	readonly notes: ReadonlyArray<Note>;
};

/**
 * The pair of annotation sets, one per view. The
 * **toggle-preserves-annotations** invariant holds at this type
 * boundary: every state transition keeps the inactive view's
 * `AnnotationSet` byte-identical to its pre-transition value
 * (reference identity preserved via immutable update).
 */
type AnnotationsByView = {
	readonly code: AnnotationSet;
	readonly flowchart: AnnotationSet;
};

// ─── Render-code intermediate ───────────────────────────────

/**
 * One Prism-derived token span. The wrapper renders each as
 * `<span class="…">{text}</span>` inside a `<pre><code>` block.
 *
 * @remarks The shape mirrors `prism-react-renderer`'s `getTokenProps`
 * output — the lens consumes that library's tokenizer and re-projects
 * the result to this plain serializable shape at the core/wrapper
 * boundary so the core doesn't import React.
 */
type CodeSpan = {
	readonly className: string;
	readonly text: string;
};

/**
 * The per-line breakdown of the colorized code. Each line is a
 * `ReadonlyArray<CodeSpan>`; lines are kept distinct so the wrapper
 * can attach per-line affordances (line-number gutter, future
 * line-level annotation tool restoration).
 */
type CodeSpanTree = {
	readonly lines: ReadonlyArray<ReadonlyArray<CodeSpan>>;
};

// ─── Render-flowchart intermediate ──────────────────────────

/**
 * The flowchart-view's render outcome. The shape is a discriminated
 * union so the wrapper can render distinct loading / error / success
 * states without re-introspecting raw promise state.
 *
 * @remarks `js2flowchart` is the SVG-string generator; the wrapper
 * injects the `ready` variant's `svg` field via
 * `dangerouslySetInnerHTML` on the flowchart container element
 * (the one exception to the lens's no-`dangerouslySetInnerHTML`
 * preference — see `./DOCS.md` § Structural constraints).
 */
type FlowchartSvg =
	| { readonly status: 'loading' }
	| { readonly status: 'error'; readonly message: string }
	| { readonly status: 'ready'; readonly svg: string };

// ─── Per-lens config narrowing ──────────────────────────────

/**
 * The fields this lens reads from `LensConfig`. The type does NOT
 * exclude additional fields — `LensConfig` is open-shape at the
 * contract boundary — but it documents what the lens looks for and
 * what defaults apply when a field is absent.
 *
 * @remarks Defaults:
 * - `colorize` → `true`
 * - `defaultView` → `'code'`
 * - `eraserRadius` → `20`
 */
type AnnotateLensConfig = {
	readonly colorize?: boolean;
	readonly defaultView?: ViewMode;
	readonly eraserRadius?: number;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	ViewMode,
	Tool,
	Point,
	Stroke,
	Note,
	AnnotationSet,
	AnnotationsByView,
	CodeSpan,
	CodeSpanTree,
	FlowchartSvg,
	AnnotateLensConfig,
};
