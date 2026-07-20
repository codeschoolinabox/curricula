// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseSettledSnippetInput } from '../types.js';
import useSettledSnippet from '../use-settled-snippet.js';

afterEach(cleanup);
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});
beforeEach(() => {
	vi.useFakeTimers();
});

function mountHook(initial: UseSettledSnippetInput) {
	return renderHook(
		(input: UseSettledSnippetInput) => useSettledSnippet(input),
		{
			initialProps: initial,
			wrapper: React.StrictMode,
		},
	);
}

describe('useSettledSnippet', () => {
	describe('no edits (Zero)', () => {
		it('holds the initial snippet as the settled pair, with no phantom settle', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			const before = result.current.settled;
			act(() => {
				vi.advanceTimersByTime(5000);
			});
			expect(result.current.settled).toBe(before);
		});
	});

	describe('one edit (One)', () => {
		it('holds the settled pair unchanged before the window elapses', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			const before = result.current.settled;
			act(() => {
				result.current.onEdit('let y = 2;');
				vi.advanceTimersByTime(100);
			});
			expect(result.current.settled).toBe(before);
		});

		it('settles the new source past the window (200ms, SETTLE_DEBOUNCE_MS)', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('let y = 2;');
				vi.advanceTimersByTime(250);
			});
			expect(result.current.settled.source).toBe('let y = 2;');
		});

		it('carries the type unchanged through an edit settle', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'script',
			});
			act(() => {
				result.current.onEdit('let y = 2;');
				vi.advanceTimersByTime(250);
			});
			expect(result.current.settled.type).toBe('script');
		});
	});

	describe('a burst of edits (Many)', () => {
		it('keeps the settle pending while a burst restarts the window', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			const before = result.current.settled;
			act(() => {
				result.current.onEdit('a');
				vi.advanceTimersByTime(150);
				result.current.onEdit('ab');
				vi.advanceTimersByTime(150);
			});
			expect(result.current.settled).toBe(before);
		});

		it('settles once with the last source after the burst', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('a');
				vi.advanceTimersByTime(10);
				result.current.onEdit('ab');
				vi.advanceTimersByTime(10);
				result.current.onEdit('abc');
				vi.advanceTimersByTime(250);
			});
			expect(result.current.settled.source).toBe('abc');
		});

		it('does not settle again after the trailing settle', () => {
			const { result } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('a');
				result.current.onEdit('ab');
				vi.advanceTimersByTime(250);
			});
			const after = result.current.settled;
			act(() => {
				vi.advanceTimersByTime(2000);
			});
			expect(result.current.settled).toBe(after);
		});
	});

	describe('the type toggle (Boundaries)', () => {
		it('settles immediately with the live source when the type toggles mid-debounce', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('pending edit');
			});
			rerender({ initialSource: 'const x = 1;', type: 'script' });
			expect(result.current.settled).toEqual({
				source: 'pending edit',
				type: 'script',
			});
		});

		it('lands no late settle after a toggle absorbed the pending edit', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('pending edit');
			});
			rerender({ initialSource: 'const x = 1;', type: 'script' });
			const absorbed = result.current.settled;
			act(() => {
				vi.advanceTimersByTime(2000);
			});
			expect(result.current.settled).toBe(absorbed);
		});

		it('settles immediately with the current source when nothing is pending', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			rerender({ initialSource: 'const x = 1;', type: 'script' });
			expect(result.current.settled).toEqual({
				source: 'const x = 1;',
				type: 'script',
			});
		});

		it('carries the current type into a settle scheduled after a toggle', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('first edit');
			});
			rerender({ initialSource: 'const x = 1;', type: 'script' });
			act(() => {
				result.current.onEdit('post-toggle edit');
				vi.advanceTimersByTime(250);
			});
			expect(result.current.settled).toEqual({
				source: 'post-toggle edit',
				type: 'script',
			});
		});

		it('carries the previously settled source through an idle toggle, never the initial', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('changed source');
				vi.advanceTimersByTime(250);
			});
			rerender({ initialSource: 'const x = 1;', type: 'script' });
			expect(result.current.settled).toEqual({
				source: 'changed source',
				type: 'script',
			});
		});

		it('ignores a changed initial source after mount', () => {
			const { result, rerender } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			const before = result.current.settled;
			rerender({ initialSource: 'entirely different', type: 'module' });
			expect(result.current.settled).toBe(before);
		});
	});

	describe('unmount mid-debounce (Boundaries)', () => {
		it('cancels the pending timer on unmount', () => {
			const { result, unmount } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('never settles');
			});
			unmount();
			expect(vi.getTimerCount()).toBe(0);
		});

		it('fires nothing after unmount', () => {
			const { result, unmount } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('never settles');
			});
			unmount();
			expect(() => {
				act(() => {
					vi.advanceTimersByTime(2000);
				});
			}).not.toThrow();
		});

		it('warns nothing after unmount', () => {
			const warned = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { result, unmount } = mountHook({
				initialSource: 'const x = 1;',
				type: 'module',
			});
			act(() => {
				result.current.onEdit('never settles');
			});
			unmount();
			act(() => {
				vi.advanceTimersByTime(2000);
			});
			expect(warned).not.toHaveBeenCalled();
		});
	});
});
