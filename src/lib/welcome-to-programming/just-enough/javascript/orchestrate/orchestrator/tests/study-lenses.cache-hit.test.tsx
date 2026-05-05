/**
 * @file Cache-hit-reattach contract for `<StudyLenses>` (Increment-9 TDD-3).
 *
 * When the learner switches editor → highlight → editor, the second
 * editor mount must reuse the FIRST editor mount.el (cache hit), not
 * call `editor.lens(...)` again, and not call `dispose` on the
 * outgoing mount during the switch. Disposal happens only on
 * component unmount, when `disposeOnUnmount` runs.
 *
 * Lives in its own file so the spied lens-module mocks do not leak
 * into the main toolbar suite (which uses the real editor + highlight
 * stubs).
 *
 * @vitest-environment jsdom
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LensMount } from '../../types.js';
import StudyLenses from '../study-lenses.js';

afterEach(function tearDown() {
	cleanup();
});

const spies = vi.hoisted(function makeSpies() {
	const editorElement = document.createElement('textarea');
	editorElement.dataset.lens = 'editor-stub';
	const editorMount: LensMount = Object.freeze({
		el: editorElement,
		dispose: vi.fn(),
	});
	const editorLensSpy = vi.fn(function editorLens() {
		return editorMount;
	});

	const highlightElement = document.createElement('pre');
	highlightElement.dataset.lens = 'highlight-stub';
	const highlightMount: LensMount = Object.freeze({
		el: highlightElement,
		dispose: vi.fn(),
	});
	const highlightLensSpy = vi.fn(function highlightLens() {
		return highlightMount;
	});

	return {
		editorMount,
		editorLensSpy,
		highlightMount,
		highlightLensSpy,
	};
});

vi.mock('../../editor/editor.js', function mockEditor() {
	return {
		default: {
			name: 'editor',
			lens: spies.editorLensSpy,
			config: function emptyConfig() {
				return {};
			},
			recommend: function noRecommendations() {
				return [];
			},
		},
	};
});

vi.mock('../../../lenses/highlight/highlight.js', function mockHighlight() {
	return {
		default: {
			name: 'highlight',
			lens: spies.highlightLensSpy,
			config: function emptyConfig() {
				return {};
			},
			recommend: function noRecommendations() {
				return [];
			},
		},
	};
});

describe('<StudyLenses> cache-hit reattach (Increment-9 TDD-3)', () => {
	describe('Boundary — switch-back reuses the cached mount', () => {
		it('editor → highlight → editor calls editor.lens exactly once and reattaches the same mount.el', async () => {
			spies.editorLensSpy.mockClear();
			spies.highlightLensSpy.mockClear();
			vi.mocked(spies.editorMount.dispose).mockClear();
			vi.mocked(spies.highlightMount.dispose).mockClear();

			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });

			act(function toHighlight() {
				fireEvent.change(picker, { target: { value: 'highlight' } });
			});
			await act(async function flush() {});
			act(function backToEditor() {
				fireEvent.change(picker, { target: { value: 'editor' } });
			});
			await act(async function flush() {});

			expect(spies.editorLensSpy).toHaveBeenCalledTimes(1);
			expect(spies.highlightLensSpy).toHaveBeenCalledTimes(1);

			const host = container.querySelector(
				'[data-orchestrator="study-lenses"]',
			);
			const reattached = host?.firstElementChild;
			expect(reattached).toBe(spies.editorMount.el);

			expect(spies.editorMount.dispose).not.toHaveBeenCalled();
			expect(spies.highlightMount.dispose).not.toHaveBeenCalled();
		});
	});

	describe('Boundary — unmount disposes every cached mount once', () => {
		it('after a round-trip, unmount() triggers dispose once per cached lens', async () => {
			spies.editorLensSpy.mockClear();
			spies.highlightLensSpy.mockClear();
			vi.mocked(spies.editorMount.dispose).mockClear();
			vi.mocked(spies.highlightMount.dispose).mockClear();

			const { unmount } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });
			act(function toHighlight() {
				fireEvent.change(picker, { target: { value: 'highlight' } });
			});
			await act(async function flush() {});

			expect(spies.editorMount.dispose).not.toHaveBeenCalled();
			expect(spies.highlightMount.dispose).not.toHaveBeenCalled();

			unmount();

			expect(spies.editorMount.dispose).toHaveBeenCalledTimes(1);
			expect(spies.highlightMount.dispose).toHaveBeenCalledTimes(1);
		});
	});
});
