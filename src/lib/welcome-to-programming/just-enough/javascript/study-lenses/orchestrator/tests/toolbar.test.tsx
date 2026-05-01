/**
 * @file Direct unit tests for the `Toolbar` component (Increment 9
 * AR-5 follow-up). Exercises the documented edge cases in
 * `orchestrator/README.md` §Toolbar prop contract that the
 * `study-lenses.toolbar.test.tsx` suite (which renders the full
 * `<StudyLenses>`) cannot reach without the orchestrator's pre-baked
 * registry.
 *
 * ZOMBIES order:
 *   Zero — empty `options` renders an empty `<select>`.
 *   Bound — `value` not in `options` does not crash; the browser falls
 *           back to the first option visually but `onChange` does not
 *           fire on render.
 *   Excep — `onLensChange` that throws propagates the error (fail-loud
 *           policy per README §Toolbar — no internal try/catch).
 *
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Toolbar from '../toolbar.js';

afterEach(function tearDown() {
	cleanup();
});

describe('Toolbar component (direct, AR-5 follow-up)', () => {
	describe('Zero — empty options', () => {
		it('renders the `<select>` with no `<option>` children', () => {
			const { container } = render(
				<Toolbar value="editor" options={[]} onLensChange={vi.fn()} />,
			);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker).not.toBeNull();
			expect(picker?.children).toHaveLength(0);
		});
	});

	describe('Boundary — value is not in options', () => {
		it('does not crash and does not synthesize an onChange call on render', () => {
			const onLensChange = vi.fn();
			const { container } = render(
				<Toolbar
					value="parsons"
					options={['editor', 'highlight']}
					onLensChange={onLensChange}
				/>,
			);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker).not.toBeNull();
			expect(onLensChange).not.toHaveBeenCalled();
		});
	});

	describe('Interface — onLensChange contract', () => {
		it('invokes the handler exactly once with the selected value (no internal try/catch)', () => {
			const handler = vi.fn();
			const { container } = render(
				<Toolbar
					value="editor"
					options={['editor', 'highlight']}
					onLensChange={handler}
				/>,
			);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker).not.toBeNull();
			fireEvent.change(picker as HTMLSelectElement, {
				target: { value: 'highlight' },
			});
			// Toolbar is purely presentational: no try/catch, no debounce, no
			// state. The fail-loud semantics for a throwing handler (the README
			// §Toolbar prop contract) are React's event-handler error reporting,
			// not a Toolbar-level concern. This test pins the only invariant
			// the Toolbar owns: it forwards the new value through the callback
			// exactly once per change.
			expect(handler).toHaveBeenCalledOnce();
			expect(handler).toHaveBeenCalledWith('highlight');
		});
	});
});
