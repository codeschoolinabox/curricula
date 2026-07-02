/**
 * @file The `<Splitter>` pure core — the jsdom-independent correctness
 * surface. Everything here is a pure function of numbers (px) and small
 * records; no DOM, no React, no time. The component (`./index.tsx`) is the
 * only impure glue (it measures the container and commits state); it delegates
 * every size decision to these functions so the arithmetic is exhaustively
 * unit-testable without a renderer.
 *
 * **Units are px-numbers end-to-end** (props, state, these inputs, the ARIA
 * `aria-valuenow`). rem/percent defaults are resolved to px at the CALL SITE,
 * never here. See `./README.md` § The pure core.
 *
 * Default-exports a bag of the five pure functions (the repo forbids named
 * exports outside `index`/`types` files); the shared types live in `./types.ts`.
 */

import type { SplitOrientation, SizedPane } from './types.js';

/**
 * Clamp a basis (px) into `[minPx, maxPx]`.
 *
 * **Precondition:** `minPx <= maxPx`. Callers uphold it by resolving the
 * effective max through `resolveMaxBasisPx` first (an unmeasured container
 * skips the fraction cap, so the max never collapses below `minPx`). Defined as
 * "lower to the ceiling, then raise to the floor": if the precondition is ever
 * violated (`minPx > maxPx`) the FLOOR wins (returns `minPx`) — a deterministic
 * degenerate, never `NaN`.
 */
function clampBasis(px: number, minPx: number, maxPx: number): number {
	return Math.max(minPx, Math.min(maxPx, px));
}

/**
 * Resolve the effective maximum basis (px) from the static `maxPx` and the
 * optional `maxFraction` cap, given the measured container extent.
 *
 * **Gate decision (ratified 2026-07-01):** when `maxFraction` is unset OR the
 * container is unmeasured / zero (`containerPx <= 0` — jsdom, or pre-layout in
 * a real browser), the fraction cap is SKIPPED and `maxPx` is returned. Capping
 * by a zero container would collapse the max to 0 and pin every size to
 * `minPx`; skipping is also the correct in-browser behaviour (never cap by an
 * extent that has not been laid out yet).
 */
function resolveMaxBasisPx(input: {
	maxPx: number;
	maxFraction?: number;
	containerPx: number;
}): number {
	const { maxPx, maxFraction, containerPx } = input;
	if (maxFraction === undefined || containerPx <= 0) return maxPx;
	return Math.min(maxPx, containerPx * maxFraction);
}

/**
 * Pointer/mouse drag → clamped new basis (px).
 *
 * `delta = currentCoord - startCoord` along the drag axis (the component passes
 * `clientX` for `row`, `clientY` for `column`, so the scalars are already
 * axis-correct). `sizedPane: 'second'` INVERTS the sign — the handle moving in
 * the positive direction shrinks a second (right/bottom) sized pane. The sign
 * therefore depends only on `sizedPane`, NOT on `orientation`; `orientation` is
 * carried for drag-context symmetry and is pinned orientation-INVARIANT by the
 * `{row,column} × {first,second}` unit matrix.
 */
function nextBasis(input: {
	startBasisPx: number;
	startCoord: number;
	currentCoord: number;
	orientation: SplitOrientation;
	sizedPane: SizedPane;
	minPx: number;
	maxPx: number;
}): number {
	const { startBasisPx, startCoord, currentCoord, sizedPane, minPx, maxPx } =
		input;
	const delta = currentCoord - startCoord;
	const signedDelta = sizedPane === 'second' ? -delta : delta;
	return clampBasis(startBasisPx + signedDelta, minPx, maxPx);
}

/**
 * Keyboard nudge → clamped new basis (px). Basis-centric (matches
 * `aria-valuenow`, which IS the basis): `ArrowRight`/`ArrowUp` grow the basis,
 * `ArrowLeft`/`ArrowDown` shrink it by `stepPx`; `Home` → `minPx`, `End` →
 * `maxPx`. Any other key leaves the basis unchanged (still clamped).
 * Deliberately orientation- and sizedPane-agnostic (the signature omits both):
 * the arrow keys move the REPORTED value, and the sized pane grows/shrinks with
 * it. The visual divider direction this yields per config is a UX-feel question
 * for the Sandbox checkpoint, not encoded here.
 */
function nextBasisFromKey(input: {
	currentPx: number;
	key: string;
	stepPx: number;
	minPx: number;
	maxPx: number;
}): number {
	const { currentPx, key, stepPx, minPx, maxPx } = input;
	return clampBasis(
		keyedBasis(currentPx, key, stepPx, minPx, maxPx),
		minPx,
		maxPx,
	);
}

/**
 * Proportional resize → clamped rescaled basis. When the container's main-axis
 * extent changes (`previousExtentPx` → `nextExtentPx`), scale the basis by the
 * same ratio so it keeps its FRACTION of the container (the `resizeMode:
 * 'proportional'` behaviour). The first measure has no prior extent
 * (`previousExtentPx <= 0`) so it only clamps — nothing to preserve yet.
 */
function rescaleBasis(input: {
	currentPx: number;
	previousExtentPx: number;
	nextExtentPx: number;
	minPx: number;
	maxPx: number;
}): number {
	const { currentPx, previousExtentPx, nextExtentPx, minPx, maxPx } = input;
	if (previousExtentPx <= 0) return clampBasis(currentPx, minPx, maxPx);
	return clampBasis(
		currentPx * (nextExtentPx / previousExtentPx),
		minPx,
		maxPx,
	);
}

/** The pre-clamp basis a key intent maps to (module-local helper). */
function keyedBasis(
	currentPx: number,
	key: string,
	stepPx: number,
	minPx: number,
	maxPx: number,
): number {
	if (key === 'ArrowRight' || key === 'ArrowUp') return currentPx + stepPx;
	if (key === 'ArrowLeft' || key === 'ArrowDown') return currentPx - stepPx;
	if (key === 'Home') return minPx;
	if (key === 'End') return maxPx;
	return currentPx;
}

const geometry = {
	clampBasis,
	resolveMaxBasisPx,
	nextBasis,
	nextBasisFromKey,
	rescaleBasis,
};

export default geometry;
