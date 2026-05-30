/**
 * @vitest-environment jsdom
 *
 * @file View-toggle tests for the `annotate` lens (Inc 7c): the toolbar
 * view-toggle button, its parse-gated `disabled` state, the initial-view
 * parse-clamp, and the toggle-preserves-annotations invariant
 * (`../README.md` § View contract, `../DOCS.md` § Phase 4). `render-flowchart`
 * is mocked to a never-resolving Promise so entering flowchart-view holds a
 * deterministic loading state — these tests assert annotation/view state, not
 * flowchart content (the real SVG path lives in `component.test.tsx`; the
 * resolved-state paths in `component-flowchart-lifecycle.test.tsx`).
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import annotateLens from '../index.js';
import type { FlowchartSvg } from '../types.js';

// Mirror the lifecycle test's controlled-Promise mock, but the toggle tests
// never resolve it: entering flowchart-view should hold its loading state so
// the overlay (and the annotation sets behind it) are what we assert on.
const { resolvers } = vi.hoisted(() => ({
	resolvers: [] as Array<(value: FlowchartSvg) => void>,
}));

vi.mock('../render-flowchart.js', () => ({
	default: () =>
		new Promise<FlowchartSvg>((resolve) => {
			resolvers.push(resolve);
		}),
}));

afterEach(() => {
	cleanup();
	resolvers.length = 0;
	vi.restoreAllMocks();
});

function drawStroke(overlay: Element, points: Array<[number, number]>): void {
	const [first, ...rest] = points;
	fireEvent.mouseDown(overlay, { clientX: first[0], clientY: first[1] });
	for (const [x, y] of rest) {
		fireEvent.mouseMove(overlay, { clientX: x, clientY: y });
	}
	const last = points.at(-1) ?? first;
	fireEvent.mouseUp(overlay, { clientX: last[0], clientY: last[1] });
}

function getOverlay(container: HTMLElement): Element {
	return container.querySelector('svg.annotate-drawing-overlay') as Element;
}

function getToggle(container: HTMLElement): Element {
	return container.querySelector('[data-view-toggle]') as Element;
}

function viewModeOf(container: HTMLElement): string | undefined {
	return container.querySelector<HTMLElement>('[data-lens="annotate"]')?.dataset
		.viewMode;
}

describe('annotate lens — view toggle', () => {
	it('renders a view-toggle button', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		expect(container.querySelector('[data-view-toggle]')).not.toBeNull();
	});

	it('the toggle label names the target view ("Flowchart" while in code-view)', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		expect(getToggle(container).textContent?.trim()).toMatch(/flowchart/i);
	});

	it('the toggle label names the target view ("Code" while in flowchart-view)', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		fireEvent.click(getToggle(container));
		expect(getToggle(container).textContent?.trim()).toMatch(/code/i);
	});

	it('the toggle is enabled for a parseable snippet', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		expect(
			container.querySelector<HTMLButtonElement>('[data-view-toggle]')
				?.disabled,
		).toBe(false);
	});

	it('the enabled toggle carries no aria-disabled attribute', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		expect(getToggle(container).hasAttribute('aria-disabled')).toBe(false);
	});

	it('clicking the toggle switches the view from code to flowchart', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		fireEvent.click(getToggle(container));
		expect(viewModeOf(container)).toBe('flowchart');
	});

	it('clicking the toggle twice returns to the code view', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		fireEvent.click(getToggle(container));
		fireEvent.click(getToggle(container));
		expect(viewModeOf(container)).toBe('code');
	});

	it('the toggle is disabled when the snippet does not parse', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('const x = (((')} />,
		);
		expect(
			container.querySelector<HTMLButtonElement>('[data-view-toggle]')
				?.disabled,
		).toBe(true);
	});

	it('the disabled toggle carries aria-disabled="true"', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('const x = (((')} />,
		);
		expect(getToggle(container).getAttribute('aria-disabled')).toBe('true');
	});

	it('clicking a disabled toggle does not change the view mode', () => {
		// jsdom's fireEvent fires `click` on a disabled <button> (unlike a real
		// browser), so the no-op must come from a handler guard on
		// status.parsed — not from the `disabled` attribute alone.
		const { container } = render(
			<annotateLens.Component embodiment={embody('const x = (((')} />,
		);
		fireEvent.click(getToggle(container));
		expect(viewModeOf(container)).toBe('code');
	});

	it('initial view clamps to code when defaultView is flowchart but the snippet does not parse', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('const x = (((')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		expect(viewModeOf(container)).toBe('code');
	});

	it('preserves annotations across a view toggle (code → flowchart → code)', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		drawStroke(getOverlay(container), [
			[5, 5],
			[15, 25],
		]);
		fireEvent.click(getToggle(container)); // to flowchart
		fireEvent.click(getToggle(container)); // back to code
		expect(
			container
				.querySelector('svg.annotate-drawing-overlay polyline')
				?.getAttribute('points'),
		).toBe('5,5 15,25');
	});

	it('the inactive view shows none of the other view’s strokes', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		drawStroke(getOverlay(container), [
			[5, 5],
			[15, 25],
		]);
		fireEvent.click(getToggle(container)); // to flowchart (its own empty set)
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).toBeNull();
	});

	it('clear-all leaves the inactive view untouched', () => {
		vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;')} />,
		);
		// draw on code
		drawStroke(getOverlay(container), [
			[5, 5],
			[15, 25],
		]);
		// toggle to flowchart, draw there. The flowchart mock never resolves, so
		// the view holds its loading state; the overlay is rendered regardless of
		// flowchart status (index.tsx renders it unconditionally), so this stroke
		// genuinely commits to the flowchart view's set.
		fireEvent.click(getToggle(container));
		drawStroke(getOverlay(container), [
			[40, 40],
			[50, 50],
		]);
		// clear-all wipes the active (flowchart) view
		fireEvent.click(container.querySelector('[data-clear-all]') as Element);
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).toBeNull();
		// toggle back to code: its stroke survived the clear on the other view
		fireEvent.click(getToggle(container));
		expect(
			container
				.querySelector('svg.annotate-drawing-overlay polyline')
				?.getAttribute('points'),
		).toBe('5,5 15,25');
	});
});
