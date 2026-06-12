/**
 * @file React wrapper for the `annotate` lens. Default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes. The wrapper
 * composes the pure-TS core subsystems (`render-code`, `render-flowchart`,
 * `annotations`) into the annotation surface: a `<div data-lens="annotate"
 * data-view-mode="…">` root with a toolbar, the active view, a drawing /
 * notes overlay, and a note-input dialog.
 *
 * The `config`, `applicableTo`, and `recommend` fields come from
 * `./core.js`; the wrapper owns only the per-mount UI state and rendering.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import addNote from './annotations/add-note.js';
import addStroke from './annotations/add-stroke.js';
import clearView from './annotations/clear-view.js';
import removeStroke from './annotations/remove-stroke.js';
import annotateCore from './core.js';
import deriveCodeSpanTree from './render-code.js';
import deriveFlowchartSvg from './render-flowchart.js';
import type {
	AnnotationsByView,
	FlowchartSvg,
	Note,
	Point,
	Stroke,
	Tool,
	ViewMode,
} from './types.js';

import './annotate.css';

/**
 * The fixed six-swatch drawing palette. Module-level (not config-driven
 * in v1 — per `./DOCS.md` § Future direction); the active color defaults
 * to the first entry.
 */
const PALETTE: ReadonlyArray<string> = [
	'#e63946',
	'#f4a261',
	'#e9c46a',
	'#2a9d8f',
	'#457b9d',
	'#6d597a',
];

// Frozen so the shared module-level initial-state reference can never be
// mutated; the annotations ops return new objects rather than mutating.
const EMPTY_ANNOTATIONS: AnnotationsByView = freezeInPlace({
	code: { strokes: [], notes: [] },
	flowchart: { strokes: [], notes: [] },
});

/** Serializes a point array to an SVG `<polyline points>` string. */
function pointsToString(points: ReadonlyArray<Point>): string {
	return points.map((point) => `${point.x},${point.y}`).join(' ');
}

/**
 * Whether any point of `stroke` lies within `radius` pixels of `point`
 * (the eraser hit-test).
 */
function isStrokeNearPoint(
	stroke: Stroke,
	point: Point,
	radius: number,
): boolean {
	return stroke.points.some(
		(p) => Math.hypot(p.x - point.x, p.y - point.y) <= radius,
	);
}

/**
 * Renders the flowchart-view's loading / error / ready state. The ready
 * branch injects the `js2flowchart` SVG via `dangerouslySetInnerHTML` —
 * the lens's only such call-site, fed a trusted local library's output
 * (no learner-controlled markup) per `./DOCS.md` § Structural constraints.
 */
function renderFlowchartView(
	flowchart: FlowchartSvg,
	containerReference: React.RefObject<HTMLDivElement | null>,
	html: { readonly __html: string },
): React.JSX.Element {
	if (flowchart.status === 'loading') {
		return <div data-flowchart-status="loading">Generating flowchart…</div>;
	}
	if (flowchart.status === 'error') {
		return (
			<div data-flowchart-status="error" role="alert">
				{flowchart.message}
			</div>
		);
	}
	// The `html` object is memoized in the wrapper: React's reconciler compares
	// dangerouslySetInnerHTML by prop OBJECT identity, so an inline literal here
	// would re-set innerHTML on every parent render and blow away the
	// data-flowchart-node attributes the tagger applied (forward-ready
	// infrastructure for the deferred correlation feature).
	return (
		<div
			data-flowchart-status="ready"
			ref={containerReference}
			dangerouslySetInnerHTML={html}
		/>
	);
}

const AnnotateComponent: ComponentType<LensProperties> =
	function AnnotateComponent({ embodiment, config }) {
		const resolved = annotateCore.config(config);
		// Clamp to a valid ViewMode: `config()` returns the open `LensConfig`,
		// so an educator override could carry any string. Anything other than
		// 'flowchart' degrades to 'code' (the always-applicable Tier-1 view).
		// Parse-gate: 'flowchart' also degrades to 'code' for an unparseable
		// snippet, so a learner never mounts into a guaranteed-failing
		// flowchart-view (per `./DOCS.md` § Phase 1).
		const initialView: ViewMode =
			resolved.defaultView === 'flowchart' && embodiment.status.parsed
				? 'flowchart'
				: 'code';
		const [viewMode, setViewMode] = useState<ViewMode>(initialView);

		// Colorize is default-on: only an explicit `false` disables Prism
		// tokenization, so a malformed value keeps the documented default.
		const colorize = resolved.colorize !== false;
		const codeTree = useMemo(
			() => deriveCodeSpanTree(embodiment.source.code, colorize),
			[embodiment.source.code, colorize],
		);

		const [flowchart, setFlowchart] = useState<FlowchartSvg>({
			status: 'loading',
		});
		const flowchartReference = useRef<HTMLDivElement>(null);
		// Memoize the dangerouslySetInnerHTML object across renders. React's
		// reconciler compares this prop by object identity, so a fresh literal
		// per render would re-apply innerHTML every wrapper re-render and wipe
		// the post-inject `data-flowchart-node` tags. Tied to flowchart so a new
		// SVG string properly triggers a re-injection.
		const flowchartHtml = useMemo(
			() => ({
				__html: flowchart.status === 'ready' ? flowchart.svg : '',
			}),
			[flowchart],
		);

		// Generate the flowchart only while it is the active view. The
		// `cancelled` flag (set by the cleanup) drops a resolved-after-unmount
		// or resolved-after-toggle-away setState — the async-cleanup invariant.
		useEffect(
			function generateFlowchart() {
				let cancelled = false;
				if (viewMode === 'flowchart') {
					setFlowchart({ status: 'loading' });
					void deriveFlowchartSvg(embodiment.source.code).then(
						function applyResult(result) {
							if (!cancelled) setFlowchart(result);
						},
					);
				}
				return function cancel() {
					cancelled = true;
				};
			},
			[viewMode, embodiment.source.code],
		);

		// Post-inject tagging: walk the freshly injected SVG and tag each node
		// group with `data-flowchart-node` (positional ids). Forward-ready
		// infrastructure for the deferred flowchart-node → source-line correlation
		// feature (see README § Future direction); no consumer in v1. The one
		// permitted DOM mutation — attribute-tagging only, never structural.
		useEffect(
			function tagFlowchartNodes() {
				if (flowchart.status !== 'ready') return;
				const container = flowchartReference.current;
				if (!container) return;
				// Pitfall #14: Babel emits unstable code for [...iterable] under the
				// Docusaurus build; keep Array.from on NodeList iterators.
				// eslint-disable-next-line unicorn/prefer-spread -- see note above
				const shapes = Array.from(
					container.querySelectorAll<SVGElement>('rect, polygon, circle'),
				);
				let nodeIndex = 0;
				for (const shape of shapes) {
					const group = shape.closest('g') ?? shape;
					if (group.dataset.flowchartNode === undefined) {
						// DOCS-sanctioned post-inject tag; attribute-only DOM mutation.
						// eslint-disable-next-line functional/immutable-data -- see above
						group.dataset.flowchartNode = String(nodeIndex);
						nodeIndex += 1;
					}
				}
			},
			[flowchart],
		);

		const [annotationsByView, setAnnotationsByView] =
			useState<AnnotationsByView>(EMPTY_ANNOTATIONS);
		const [tool, setTool] = useState<Tool>('pen');
		const [color, setColor] = useState<string>(PALETTE[0]);
		const [currentStroke, setCurrentStroke] =
			useState<ReadonlyArray<Point> | null>(null);
		const [noteDialog, setNoteDialog] = useState<{
			readonly position: Point;
		} | null>(null);
		const [noteText, setNoteText] = useState('');

		const eraserRadius =
			typeof resolved.eraserRadius === 'number' ? resolved.eraserRadius : 20;
		const activeStrokes = annotationsByView[viewMode].strokes;
		const activeNotes = annotationsByView[viewMode].notes;

		function pointFromEvent(event: React.MouseEvent<SVGSVGElement>): Point {
			const rect = event.currentTarget.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		}

		function startStroke(event: React.MouseEvent<SVGSVGElement>): void {
			if (tool !== 'pen') return;
			setCurrentStroke([pointFromEvent(event)]);
		}

		function extendStroke(event: React.MouseEvent<SVGSVGElement>): void {
			if (tool !== 'pen' || !currentStroke) return;
			const point = pointFromEvent(event);
			setCurrentStroke((previous) =>
				previous ? [...previous, point] : [point],
			);
		}

		// Discard taps (fewer than two points) — a single point is not a
		// visible freehand stroke, and committing it would leave an invisible
		// artifact in the annotation set.
		function finishStroke(): void {
			if (tool === 'pen' && currentStroke && currentStroke.length >= 2) {
				const stroke: Stroke = {
					id: crypto.randomUUID(),
					points: currentStroke,
					color,
				};
				setAnnotationsByView((previous) =>
					addStroke(previous, viewMode, stroke),
				);
			}
			setCurrentStroke(null);
		}

		function eraseAt(event: React.MouseEvent<SVGSVGElement>): void {
			if (tool !== 'eraser') return;
			const point = pointFromEvent(event);
			// Functional update reading `previous` so rapid clicks compose
			// safely; returns the same reference (React bails the re-render)
			// when nothing lies within the radius.
			function eraseFrom(previous: AnnotationsByView): AnnotationsByView {
				const erasedIds = previous[viewMode].strokes
					.filter((stroke) => isStrokeNearPoint(stroke, point, eraserRadius))
					.map((stroke) => stroke.id);
				let next = previous;
				for (const id of erasedIds) {
					next = removeStroke(next, viewMode, id);
				}
				return next;
			}
			setAnnotationsByView(eraseFrom);
		}

		function openNoteAt(event: React.MouseEvent<SVGSVGElement>): void {
			if (tool !== 'note') return;
			setNoteText('');
			setNoteDialog({ position: pointFromEvent(event) });
		}

		// The overlay's single click handler dispatches by tool; pen uses the
		// mouse down/move/up sequence instead.
		function handleOverlayClick(event: React.MouseEvent<SVGSVGElement>): void {
			eraseAt(event);
			openNoteAt(event);
		}

		// Discard empty / whitespace-only notes — an empty positioned box is
		// not a useful annotation (parallel to the single-point stroke discard).
		function saveNote(): void {
			if (noteDialog && noteText.trim() !== '') {
				const note: Note = {
					id: crypto.randomUUID(),
					position: noteDialog.position,
					text: noteText,
					color,
				};
				setAnnotationsByView((previous) => addNote(previous, viewMode, note));
			}
			setNoteDialog(null);
			setNoteText('');
		}

		function cancelNote(): void {
			setNoteDialog(null);
			setNoteText('');
		}

		// Wipes both strokes and notes of the active view (after a
		// confirmation); the inactive view's set is left untouched by
		// `clearView`.
		function clearActiveView(): void {
			if (!globalThis.confirm('Clear all annotations on this view?')) return;
			setAnnotationsByView((previous) => clearView(previous, viewMode));
		}

		// State-only viewMode swap: both per-view annotation sets are untouched
		// (the toggle-preserves-annotations invariant). Guarded on status.parsed
		// so a click on the disabled toggle is a no-op even where the host fires
		// click on disabled buttons. The active tool persists across the toggle.
		function toggleView(): void {
			if (!embodiment.status.parsed) return;
			setViewMode((previous) => (previous === 'code' ? 'flowchart' : 'code'));
		}

		return (
			<div data-lens="annotate" data-view-mode={viewMode}>
				<div className="annotate-toolbar" data-tool={tool}>
					<button
						type="button"
						data-tool-select="pen"
						onClick={() => setTool('pen')}
					>
						Pen
					</button>
					<button
						type="button"
						data-tool-select="eraser"
						onClick={() => setTool('eraser')}
					>
						Eraser
					</button>
					<button
						type="button"
						data-tool-select="note"
						onClick={() => setTool('note')}
					>
						Note
					</button>
					{PALETTE.map(function renderSwatch(swatch) {
						return (
							<button
								key={swatch}
								type="button"
								className="annotate-swatch"
								aria-label={`color ${swatch}`}
								data-color-swatch={swatch}
								style={{ background: swatch }}
								onClick={() => setColor(swatch)}
							/>
						);
					})}
					<button
						type="button"
						data-view-toggle="true"
						disabled={!embodiment.status.parsed}
						aria-disabled={embodiment.status.parsed ? undefined : 'true'}
						onClick={toggleView}
					>
						{viewMode === 'code' ? 'Flowchart' : 'Code'}
					</button>
					<button type="button" data-clear-all="true" onClick={clearActiveView}>
						Clear all
					</button>
				</div>
				<main className="annotate-main" data-view-mode={viewMode}>
					{viewMode === 'code' && (
						<pre>
							<code>
								{codeTree.lines.map(function renderLine(line, lineIndex) {
									return (
										<React.Fragment key={lineIndex}>
											{lineIndex > 0 && '\n'}
											{line.map(function renderSpan(span, spanIndex) {
												return (
													<span
														key={`${lineIndex}-${spanIndex}`}
														className={span.className}
													>
														{span.text}
													</span>
												);
											})}
										</React.Fragment>
									);
								})}
							</code>
						</pre>
					)}
					{viewMode === 'flowchart' &&
						renderFlowchartView(flowchart, flowchartReference, flowchartHtml)}
					{/* The overlay captures pointer events for drawing across both
					    views. The flowchart-node tagger pre-positions `[data-flowchart-
					    node]` ids on the SVG; v1 has no consumer for them (the deferred
					    correlation feature would gate the overlay here and route node
					    clicks via closest delegation — see DOCS § Structural constraints). */}
					<svg
						className="annotate-drawing-overlay"
						onMouseDown={startStroke}
						onMouseMove={extendStroke}
						onMouseUp={finishStroke}
						onClick={handleOverlayClick}
					>
						{activeStrokes.map(function renderSavedStroke(stroke) {
							return (
								<polyline
									key={stroke.id}
									points={pointsToString(stroke.points)}
									stroke={stroke.color}
									fill="none"
								/>
							);
						})}
						{currentStroke && (
							<polyline
								points={pointsToString(currentStroke)}
								stroke={color}
								fill="none"
							/>
						)}
					</svg>
					{activeNotes.map(function renderNote(note) {
						return (
							<div
								key={note.id}
								className="annotate-note"
								data-note-color={note.color}
								style={{
									left: `${note.position.x}px`,
									top: `${note.position.y}px`,
									borderColor: note.color,
								}}
							>
								{note.text}
							</div>
						);
					})}
					{noteDialog && (
						<div
							className="annotate-note-dialog"
							data-note-dialog="true"
							style={{
								left: `${noteDialog.position.x}px`,
								top: `${noteDialog.position.y}px`,
							}}
						>
							<textarea
								aria-label="note text"
								value={noteText}
								onChange={(event) => setNoteText(event.target.value)}
							/>
							<button type="button" data-note-save="true" onClick={saveNote}>
								Save
							</button>
							<button
								type="button"
								data-note-cancel="true"
								onClick={cancelNote}
							>
								Cancel
							</button>
						</div>
					)}
				</main>
			</div>
		);
	};

const annotateLens: LensModule = freezeInPlace<LensModule>({
	name: 'annotate',
	Component: AnnotateComponent,
	config: annotateCore.config,
	applicableTo: annotateCore.applicableTo,
	recommend: annotateCore.recommend,
	phase: 'source',
});

export default annotateLens;
