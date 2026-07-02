/**
 * @file `<Splitter>` — an orchestrate-local presentation module that renders
 * two panes with a draggable divider and owns only its own DISPOSABLE split
 * size (React re-inits `defaultBasisPx` on remount; the LMS owns persistence).
 * Relies on `../orchestrate.css` for static layout — NOT standalone-portable.
 *
 * **Drag transport:** mouse events + window-level move/up listeners, NOT the
 * DDD's original pointer/`setPointerCapture` pipeline — this repo's jsdom has
 * no `PointerEvent` (pointer events carry no `clientX`) and no
 * `setPointerCapture` (proven by probe), and window listeners are the robust
 * real-browser answer for a thin handle that loses the pointer mid-drag. The
 * anchor is a REF (stale-closure-safe); only the committed basis is state.
 * See `./README.md` + `./DOCS.md § Drag lifecycle`.
 *
 * All size arithmetic delegates to the pure `./geometry.ts` core.
 */

import React from 'react';

import geometry from './geometry.js';
import type { SplitOrientation, SizedPane, ResizeMode } from './types.js';

type SplitterProperties = Readonly<{
	readonly orientation: SplitOrientation;
	readonly sizedPane: SizedPane;
	readonly defaultBasisPx: number;
	readonly minPx: number;
	readonly maxPx: number;
	readonly maxFraction?: number;
	readonly stepPx: number;
	readonly label: string;
	readonly resizeMode?: ResizeMode;
	readonly first: React.ReactNode | null;
	readonly second: React.ReactNode | null;
}>;

/** The keys the separator handles (arrows nudge; Home/End jump to min/max). */
const HANDLED_KEYS: ReadonlySet<string> = new Set([
	'ArrowLeft',
	'ArrowRight',
	'ArrowUp',
	'ArrowDown',
	'Home',
	'End',
]);

/**
 * Measure the container along the drag axis and resolve the effective max (the
 * fraction-capped drag ceiling). Impure (reads the DOM); parameterised so the
 * extent-tracking effect and the interaction handlers share one measure. The
 * `maxFraction === undefined || container === null` short-circuit means no DOM
 * read happens unless a fraction cap is actually in play.
 */
function containerMainExtentPx(
	container: HTMLElement | null,
	orientation: SplitOrientation,
): number {
	// The extent along the split axis: row → width, column → height.
	if (container === null) return 0;
	const rect = container.getBoundingClientRect();
	return orientation === 'row' ? rect.width : rect.height;
}

function measureEffectiveMaxPx(
	container: HTMLElement | null,
	orientation: SplitOrientation,
	maxPx: number,
	maxFraction: number | undefined,
): number {
	// No DOM read unless a fraction cap is actually in play.
	return geometry.resolveMaxBasisPx({
		maxPx,
		containerPx:
			maxFraction === undefined
				? 0
				: containerMainExtentPx(container, orientation),
		...(maxFraction === undefined ? {} : { maxFraction }),
	});
}

function Splitter({
	orientation,
	sizedPane,
	defaultBasisPx,
	minPx,
	maxPx,
	maxFraction,
	stepPx,
	label,
	resizeMode = 'fixed',
	first,
	second,
}: SplitterProperties): React.JSX.Element | null {
	const [basisPx, setBasisPx] = React.useState(defaultBasisPx);
	const [dragging, setDragging] = React.useState(false);
	// The fraction-capped ceiling, reported as aria-valuemax so it is HONEST to
	// the reachable drag cap (not the raw maxPx). Seeded to maxPx; the extent
	// effect + interaction handlers refine it once the container is measured.
	const [effectiveMaxPx, setEffectiveMaxPx] = React.useState(maxPx);
	const anchorReference = React.useRef<{
		startBasisPx: number;
		startCoord: number;
		effectiveMaxPx: number;
	} | null>(null);
	const containerReference = React.useRef<HTMLDivElement | null>(null);
	// The container's last-measured main-axis extent — the basis for the
	// proportional rescale (resizeMode='proportional'). 0 until first measured.
	const extentReference = React.useRef<number>(0);
	const sizedPaneId = React.useId();

	// While dragging, listen on WINDOW so the divider keeps tracking after the
	// pointer leaves the thin handle; the effect cleanup removes the listeners
	// (also on unmount-mid-drag — no leak). The anchor ref holds the drag start
	// so the move handler never goes stale.
	React.useEffect(
		function trackDrag() {
			function onMove(event: MouseEvent): void {
				const anchor = anchorReference.current;
				if (anchor === null) return;
				const coordinate =
					orientation === 'row' ? event.clientX : event.clientY;
				setBasisPx(
					geometry.nextBasis({
						startBasisPx: anchor.startBasisPx,
						startCoord: anchor.startCoord,
						currentCoord: coordinate,
						orientation,
						sizedPane,
						minPx,
						maxPx: anchor.effectiveMaxPx,
					}),
				);
			}
			function onUp(): void {
				// Null the anchor synchronously so a stray mousemove arriving
				// before the effect cleanup runs (a sub-frame race in a real
				// browser) is ignored by onMove's `anchor === null` guard.
				anchorReference.current = null;
				setDragging(false);
			}
			// Always return the (idle-safe) cleanup — no early return — so the
			// effect has consistent returns (sonarjs) and unmount-mid-drag still
			// tears the listeners down. removeEventListener is a no-op when they
			// were never added (dragging false).
			if (dragging) {
				globalThis.addEventListener('mousemove', onMove);
				globalThis.addEventListener('mouseup', onUp);
			}
			return function stopTracking() {
				globalThis.removeEventListener('mousemove', onMove);
				globalThis.removeEventListener('mouseup', onUp);
			};
		},
		[dragging, orientation, sizedPane, minPx],
	);

	// Track the effective max so aria-valuemax reports the REACHABLE ceiling, not
	// the raw maxPx. Measured on mount and on container resize (feature-detected
	// ResizeObserver — jsdom lacks it); the interaction handlers below also
	// refresh it at drag/key time. The cleanup is always returned (idle-safe).
	React.useEffect(
		function trackExtent() {
			function remeasure(): void {
				const container = containerReference.current;
				const nextExtentPx = containerMainExtentPx(container, orientation);
				const nextEffectiveMaxPx = measureEffectiveMaxPx(
					container,
					orientation,
					maxPx,
					maxFraction,
				);
				setEffectiveMaxPx(nextEffectiveMaxPx);
				if (resizeMode === 'proportional') {
					// Preserve the basis's fraction of the container across the
					// resize. Functional update so the latest (possibly dragged)
					// basis is rescaled; the first measure (previous extent 0) is a
					// no-op inside rescaleBasis.
					const previousExtentPx = extentReference.current;
					setBasisPx((currentPx) =>
						geometry.rescaleBasis({
							currentPx,
							previousExtentPx,
							nextExtentPx,
							minPx,
							maxPx: nextEffectiveMaxPx,
						}),
					);
				}
				extentReference.current = nextExtentPx;
			}
			remeasure();
			const container = containerReference.current;
			const observer =
				container !== null && typeof ResizeObserver === 'function'
					? new ResizeObserver(remeasure)
					: null;
			if (observer !== null && container !== null) observer.observe(container);
			return function stopTracking() {
				if (observer !== null) observer.disconnect();
			};
		},
		[maxPx, maxFraction, orientation, minPx, resizeMode],
	);

	function onHandleMouseDown(event: React.MouseEvent<HTMLDivElement>): void {
		event.preventDefault(); // suppress text selection during the drag
		const coordinate = orientation === 'row' ? event.clientX : event.clientY;
		const resolvedMaxPx = measureEffectiveMaxPx(
			containerReference.current,
			orientation,
			maxPx,
			maxFraction,
		);
		setEffectiveMaxPx(resolvedMaxPx);
		anchorReference.current = {
			startBasisPx: basisPx,
			startCoord: coordinate,
			effectiveMaxPx: resolvedMaxPx,
		};
		setDragging(true);
	}

	function onHandleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
		if (!HANDLED_KEYS.has(event.key)) return;
		event.preventDefault();
		const resolvedMaxPx = measureEffectiveMaxPx(
			containerReference.current,
			orientation,
			maxPx,
			maxFraction,
		);
		setEffectiveMaxPx(resolvedMaxPx);
		setBasisPx(
			geometry.nextBasisFromKey({
				currentPx: basisPx,
				key: event.key,
				stepPx,
				minPx,
				maxPx: resolvedMaxPx,
			}),
		);
	}

	// Both panes absent → render nothing (single-pane-first-class degeneracy;
	// the owner keeps its own root, e.g. the output-panels section persists).
	if (first === null && second === null) return null;

	// Exactly one pane → render it as a lone flex pane, no handle, no drag.
	if (first === null || second === null) {
		return (
			<div data-orchestrator-splitter={orientation}>
				<div data-orchestrator-splitter-pane="flex">{first ?? second}</div>
			</div>
		);
	}

	const firstIsSized = sizedPane === 'first';
	const firstPane = firstIsSized ? (
		<div
			data-orchestrator-splitter-pane="sized"
			id={sizedPaneId}
			style={{ flexBasis: `${basisPx}px` }}
		>
			{first}
		</div>
	) : (
		<div data-orchestrator-splitter-pane="flex">{first}</div>
	);
	const secondPane = firstIsSized ? (
		<div data-orchestrator-splitter-pane="flex">{second}</div>
	) : (
		<div
			data-orchestrator-splitter-pane="sized"
			id={sizedPaneId}
			style={{ flexBasis: `${basisPx}px` }}
		>
			{second}
		</div>
	);

	return (
		<div data-orchestrator-splitter={orientation} ref={containerReference}>
			{firstPane}
			<div
				data-orchestrator-splitter-handle
				role="separator"
				aria-orientation={orientation === 'row' ? 'vertical' : 'horizontal'}
				aria-controls={sizedPaneId}
				aria-valuenow={basisPx}
				aria-valuemin={minPx}
				aria-valuemax={effectiveMaxPx}
				aria-label={label}
				tabIndex={0}
				onMouseDown={onHandleMouseDown}
				onKeyDown={onHandleKeyDown}
			/>
			{secondPane}
		</div>
	);
}

export default Splitter;
