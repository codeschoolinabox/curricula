/**
 * @vitest-environment jsdom
 *
 * @file Component wiring tests for `<Splitter>` (`../index.tsx`). jsdom
 * computes NO layout, so these pin WIRING only — the DOM/ARIA contract, the
 * drag/keyboard DIRECTION (via the annotate zero-rect-cancels-in-delta
 * precedent), and the single-/both-pane degeneracies. The exact px arithmetic
 * lives in `./geometry.test.ts`; drag FEEL lives in the Sandbox checkpoint.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Splitter from '../index.js';

afterEach(cleanup);
afterEach(() => vi.restoreAllMocks());

/** Stub every element's rect so the extent Measure sees a real container size
 * (jsdom returns all-zero rects by default). */
function stubRect(width: number, height: number): void {
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
		width,
		height,
		top: 0,
		left: 0,
		right: width,
		bottom: height,
		x: 0,
		y: 0,
		toJSON: () => ({}),
	} as DOMRect);
}

const PANE_A = <div data-testid="pane-a">A</div>;
const PANE_B = <div data-testid="pane-b">B</div>;

function renderSplitter(
	overrides: Partial<React.ComponentProps<typeof Splitter>> = {},
) {
	return render(
		<Splitter
			orientation="row"
			sizedPane="first"
			defaultBasisPx={200}
			minPx={0}
			maxPx={1000}
			stepPx={16}
			label="resize panes"
			first={PANE_A}
			second={PANE_B}
			{...overrides}
		/>,
	);
}

function getHandle(container: HTMLElement): HTMLElement {
	return container.querySelector(
		'[data-orchestrator-splitter-handle]',
	) as HTMLElement;
}

function getSizedPane(container: HTMLElement): HTMLElement {
	return container.querySelector(
		'[data-orchestrator-splitter-pane="sized"]',
	) as HTMLElement;
}

function basisOf(container: HTMLElement): number {
	return Number.parseFloat(getSizedPane(container).style.flexBasis);
}

describe('<Splitter> — two-pane render + ARIA contract', () => {
	it('renders the flex container, two panes, and a handle when both panes are present', () => {
		const { container } = renderSplitter();
		expect(
			container.querySelector('[data-orchestrator-splitter="row"]'),
		).not.toBeNull();
		expect(
			container.querySelectorAll('[data-orchestrator-splitter-pane]'),
		).toHaveLength(2);
		expect(getHandle(container)).not.toBeNull();
	});

	it('keeps DOM order first-pane, handle, second-pane', () => {
		const { container } = renderSplitter();
		const panes = container.querySelectorAll(
			'[data-orchestrator-splitter-pane]',
		);
		expect(panes).toHaveLength(2);
		expect(panes[0].querySelector('[data-testid="pane-a"]')).not.toBeNull();
		expect(panes[1].querySelector('[data-testid="pane-b"]')).not.toBeNull();
		// the handle sits BETWEEN the two panes — order pinned via siblings, not
		// index-destructuring (robust to extra nodes) and not bitwise
		// compareDocumentPosition (repo bans no-bitwise).
		const handle = getHandle(container);
		expect(handle.previousElementSibling).toBe(panes[0]);
		expect(handle.nextElementSibling).toBe(panes[1]);
	});

	it('gives the handle role=separator, tabindex, label, and value bounds', () => {
		const { container } = renderSplitter();
		const handle = getHandle(container);
		expect(handle.getAttribute('role')).toBe('separator');
		expect(handle.getAttribute('tabindex')).toBe('0');
		expect(handle.getAttribute('aria-label')).toBe('resize panes');
		expect(handle.getAttribute('aria-valuenow')).toBe('200');
		expect(handle.getAttribute('aria-valuemin')).toBe('0');
		expect(handle.getAttribute('aria-valuemax')).toBe('1000');
	});

	it('points aria-controls at the sized pane id', () => {
		const { container } = renderSplitter();
		const controls = getHandle(container).getAttribute('aria-controls');
		expect(controls).not.toBeNull();
		expect(getSizedPane(container).getAttribute('id')).toBe(controls);
	});

	it('INVERTS aria-orientation: row → vertical (reads backwards — pinned)', () => {
		const { container } = renderSplitter({ orientation: 'row' });
		expect(getHandle(container).getAttribute('aria-orientation')).toBe(
			'vertical',
		);
	});

	it('INVERTS aria-orientation: column → horizontal', () => {
		const { container } = renderSplitter({ orientation: 'column' });
		expect(getHandle(container).getAttribute('aria-orientation')).toBe(
			'horizontal',
		);
	});

	it('seeds the sized pane flex-basis from defaultBasisPx', () => {
		const { container } = renderSplitter();
		expect(basisOf(container)).toBe(200);
	});

	it('reports the fraction-capped EFFECTIVE max in aria-valuemax (honest to the drag cap)', () => {
		// Container measures 1000; maxFraction 0.6 → effective cap 600 < maxPx
		// 900. aria-valuemax must report 600 (the reachable max), not the raw 900.
		stubRect(1000, 1000);
		const { container } = renderSplitter({ maxFraction: 0.6, maxPx: 900 });
		expect(getHandle(container).getAttribute('aria-valuemax')).toBe('600');
	});

	it('reports the raw maxPx in aria-valuemax when maxFraction is unset', () => {
		const { container } = renderSplitter();
		expect(getHandle(container).getAttribute('aria-valuemax')).toBe('1000');
	});
});

describe('<Splitter> — drag wiring (mouse + window listeners; direction, not exact layout)', () => {
	// Deviation from the DDD's pointer/setPointerCapture pipeline: this repo's
	// jsdom exposes no PointerEvent (pointer events carry no clientX) and no
	// setPointerCapture — proven by probe. Mouse events DO carry clientX in
	// jsdom (the annotate precedent), and window-level move/up listeners are the
	// robust real-browser answer for a thin handle that loses the pointer during
	// a drag. Flagged to AR-3.
	it('a forward drag GROWS the sized-first basis, and aria-valuenow tracks it', () => {
		const { container } = renderSplitter({ sizedPane: 'first' });
		const before = basisOf(container);
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		fireEvent.mouseMove(document, { clientX: 160 });
		const after = basisOf(container);
		expect(after).toBeGreaterThan(before);
		expect(getHandle(container).getAttribute('aria-valuenow')).toBe(
			String(after),
		);
		fireEvent.mouseUp(document);
	});

	it('a forward drag SHRINKS the sized-second basis (inverted sign)', () => {
		const { container } = renderSplitter({ sizedPane: 'second' });
		const before = basisOf(container);
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		fireEvent.mouseMove(document, { clientX: 160 });
		expect(basisOf(container)).toBeLessThan(before);
		fireEvent.mouseUp(document);
	});

	it('does not move the basis on a stray window mousemove with no drag in progress', () => {
		const { container } = renderSplitter();
		const before = basisOf(container);
		fireEvent.mouseMove(document, { clientX: 160 });
		expect(basisOf(container)).toBe(before);
	});

	it('with maxFraction set, the zero jsdom container does NOT collapse the basis (guard holds end-to-end)', () => {
		// The ratified guard in action: jsdom measures the container as 0, so
		// without it maxFraction would cap the max at 0 and pin the basis to
		// minPx. With it, the drag still grows.
		const { container } = renderSplitter({
			sizedPane: 'first',
			maxFraction: 0.6,
		});
		const before = basisOf(container);
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		fireEvent.mouseMove(document, { clientX: 160 });
		expect(basisOf(container)).toBeGreaterThan(before);
		fireEvent.mouseUp(document);
	});

	it('stops tracking after mouseup (drag released)', () => {
		const { container } = renderSplitter({ sizedPane: 'first' });
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		fireEvent.mouseMove(document, { clientX: 160 });
		const afterDrag = basisOf(container);
		fireEvent.mouseUp(document);
		fireEvent.mouseMove(document, { clientX: 400 });
		expect(basisOf(container)).toBe(afterDrag);
	});

	it('accepts resizeMode="proportional" and still renders + drags (the rescale is resize-only — jsdom has no ResizeObserver, so it is Sandbox-verified)', () => {
		const { container } = renderSplitter({ resizeMode: 'proportional' });
		expect(getHandle(container)).not.toBeNull();
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		fireEvent.mouseMove(document, { clientX: 160 });
		expect(basisOf(container)).toBeGreaterThan(200);
		fireEvent.mouseUp(document);
	});
});

describe('<Splitter> — keyboard wiring', () => {
	it('ArrowRight grows the basis and aria-valuenow by stepPx', () => {
		const { container } = renderSplitter();
		fireEvent.keyDown(getHandle(container), { key: 'ArrowRight' });
		expect(basisOf(container)).toBe(216);
		expect(getHandle(container).getAttribute('aria-valuenow')).toBe('216');
	});

	it('Home jumps to minPx, End jumps to maxPx', () => {
		const { container } = renderSplitter();
		fireEvent.keyDown(getHandle(container), { key: 'Home' });
		expect(basisOf(container)).toBe(0);
		fireEvent.keyDown(getHandle(container), { key: 'End' });
		expect(basisOf(container)).toBe(1000);
	});

	it('keyboard wires through the maxFraction guard (zero jsdom container does not collapse)', () => {
		// Parallels the drag guard test: without the containerPx <= 0 guard, the
		// keyboard path would resolve effectiveMax to 0 and clamp the nudge to 0.
		const { container } = renderSplitter({ maxFraction: 0.6 });
		fireEvent.keyDown(getHandle(container), { key: 'ArrowRight' });
		expect(basisOf(container)).toBe(216);
	});
});

describe('<Splitter> — degenerate states (single-pane / both-null)', () => {
	it('renders the present pane as a lone flex pane (container kept, NO handle, NO inline basis) when second is null', () => {
		const { container } = renderSplitter({ second: null });
		// the Splitter container still renders — Inc B relies on this at idle
		// (active surface fills, no panels yet).
		expect(
			container.querySelector('[data-orchestrator-splitter="row"]'),
		).not.toBeNull();
		expect(getHandle(container)).toBeNull();
		const panes = container.querySelectorAll(
			'[data-orchestrator-splitter-pane]',
		);
		expect(panes).toHaveLength(1);
		// the lone pane flexes to fill — it is the "flex" pane and carries NO
		// inline flex-basis (no sized basis in single-pane mode).
		expect(
			container.querySelector('[data-orchestrator-splitter-pane="flex"]'),
		).not.toBeNull();
		expect((panes[0] as HTMLElement).style.flexBasis).toBe('');
		expect(container.querySelector('[data-testid="pane-a"]')).not.toBeNull();
		expect(container.querySelector('[data-testid="pane-b"]')).toBeNull();
	});

	it('renders the present pane with NO handle when first is null', () => {
		const { container } = renderSplitter({ first: null });
		expect(getHandle(container)).toBeNull();
		expect(
			container.querySelectorAll('[data-orchestrator-splitter-pane]'),
		).toHaveLength(1);
		expect(container.querySelector('[data-testid="pane-b"]')).not.toBeNull();
	});

	it('renders nothing (component returns null) when BOTH panes are null', () => {
		const { container } = renderSplitter({ first: null, second: null });
		expect(container.querySelector('[data-orchestrator-splitter]')).toBeNull();
		expect(
			container.querySelector('[data-orchestrator-splitter-handle]'),
		).toBeNull();
		// pin "renders nothing" = empty render (not an empty container element).
		expect(container.innerHTML.trim()).toBe('');
	});
});

describe('<Splitter> — lifecycle', () => {
	it('unmounting mid-drag tears down the live window listener (no post-unmount throw)', () => {
		const { container, unmount } = renderSplitter({ sizedPane: 'first' });
		fireEvent.mouseDown(getHandle(container), { clientX: 100 });
		// prove the listener is LIVE before unmount (a window move moves basis)
		fireEvent.mouseMove(document, { clientX: 160 });
		expect(basisOf(container)).toBeGreaterThan(200);
		// unmount mid-drag: the effect cleanup must remove the window listeners
		expect(() => unmount()).not.toThrow();
		// a post-unmount stray move must not throw (the listeners are gone)
		expect(() => fireEvent.mouseMove(document, { clientX: 300 })).not.toThrow();
	});
});
