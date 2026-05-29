/**
 * @vitest-environment jsdom
 *
 * @file Async-lifecycle tests for the `annotate` flowchart-view: the
 * loading state and the cancelled-flag cleanup invariant (`../DOCS.md`
 * § Phase 2 Async cleanup invariant). Isolated in its own file because
 * it `vi.mock`s `render-flowchart` with a CONTROLLED Promise the test
 * resolves by hand — the main `component.test.tsx` uses the real module
 * for the SVG / error paths.
 */

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import annotateLens from '../index.js';
import type { FlowchartSvg } from '../types.js';

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
});

describe('annotate flowchart view — async lifecycle', () => {
	it('shows the loading state before generation resolves', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('function f() {}')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		expect(
			container.querySelector('[data-flowchart-status="loading"]'),
		).not.toBeNull();
	});

	it('does not update state after unmount (cancelled-flag invariant)', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = render(
			<annotateLens.Component
				embodiment={embody('function f() {}')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);

		// Non-vacuity: confirm a generation was actually in flight at unmount,
		// so this test exercises the cancellation path rather than passing
		// because nothing ever resolved.
		expect(resolvers.length).toBeGreaterThan(0);

		unmount();
		for (const resolve of resolvers) {
			resolve({ status: 'ready', svg: '<svg></svg>' });
		}
		await Promise.resolve();
		await Promise.resolve();

		expect(errorSpy).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
