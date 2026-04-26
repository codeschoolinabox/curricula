/**
 * @file Async-cancellation contract for `<StudyLenses>`. If the
 * component unmounts while `lensModule.lens(code, cfg)` is still in
 * flight, the eventual mount must be disposed and never attached to
 * the host. Lives in its own file so the controlled-promise mock of
 * the editor lens does not leak into the main suite.
 *
 * @vitest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { LensMount } from '../../types.js';
import StudyLenses from '../study-lenses.js';

const mockState = vi.hoisted(function makeMockState() {
	const state: {
		pendingResolve: ((mount: LensMount) => void) | null;
	} = { pendingResolve: null };
	const lensSpy = vi.fn(function deferredLens() {
		return new Promise<LensMount>(function suspend(resolve) {
			state.pendingResolve = resolve;
		});
	});
	return { state, lensSpy };
});

vi.mock('../../lenses/editor/editor.js', function mockEditor() {
	return {
		default: {
			name: 'editor',
			lens: mockState.lensSpy,
			config: function emptyConfig() {
				return {};
			},
			recommend: function noRecommendations() {
				return [];
			},
		},
	};
});

const disposeSpy = vi.fn();

describe('<StudyLenses> async cancellation', () => {
	it('disposes the in-flight mount once on unmount and never appends it to the host', async () => {
		const { container, unmount } = render(
			<StudyLenses code="x;" lens="editor" lang="js" />,
		);
		await act(async function flush() {});
		expect(mockState.lensSpy).toHaveBeenCalledOnce();
		expect(mockState.state.pendingResolve).not.toBeNull();
		const host = container.querySelector('[data-orchestrator="study-lenses"]');
		expect(host?.firstElementChild).toBeNull();

		unmount();

		const lateElement = document.createElement('pre');
		lateElement.dataset.lens = 'editor-stub';
		const lateMount: LensMount = Object.freeze({
			el: lateElement,
			dispose: disposeSpy,
		});
		mockState.state.pendingResolve?.(lateMount);

		await act(async function flushAfter() {});
		expect(disposeSpy).toHaveBeenCalledOnce();
		expect(lateElement.parentNode).toBeNull();
	});
});
