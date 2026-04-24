/**
 * @file Unit tests for `resetSnippet`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces → Simple.
 * No E — resetSnippet has no runtime failure modes on valid inputs.
 */

import { describe, expect, it, vi } from 'vitest';

import createEventBus from '../create-event-bus.js';
import createLensCache from '../create-lens-cache.js';
import createOrchestratorState from '../create-orchestrator-state.js';
import resetSnippet from '../reset-snippet.js';
import type { LensMount, OrchestratorState } from '../types.js';

function makeMount(onSnippetChanged?: (snippet: string) => void): LensMount {
	return {
		el: {} as HTMLElement,
		dispose: () => {},
		...(onSnippetChanged ? { onSnippetChanged } : {}),
	};
}

function freshState(overrides: Partial<OrchestratorState> = {}): OrchestratorState {
	const base = createOrchestratorState({
		originalCode: 'original',
		initialLens: 'editor',
		initialTransforms: ['format'],
	});
	return { ...base, ...overrides };
}

describe('resetSnippet', () => {
	describe('Z — empty cache', () => {
		it('returns a state with snippet reset to originalCode', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.snippet).toBe('original');
		});

		it('dispatches state-reset once even with an empty cache', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('state-reset', listener);

			resetSnippet(state, cache, bus);

			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('does not throw when the cache has no mounts', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			expect(() => resetSnippet(state, cache, bus)).not.toThrow();
		});
	});

	describe('O — one cached mount', () => {
		it('invokes onSnippetChanged on the cached mount with the original code', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const hook = vi.fn();
			cache.set('editor', {}, makeMount(hook));
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(hook).toHaveBeenCalledWith('original');
		});

		it('does not error on a mount without onSnippetChanged', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			cache.set('editor', {}, makeMount());
			const bus = createEventBus();

			expect(() => resetSnippet(state, cache, bus)).not.toThrow();
		});
	});

	describe('M — multiple cached mounts', () => {
		it('invokes onSnippetChanged on every hook-declaring mount', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const hookA = vi.fn();
			const hookB = vi.fn();
			cache.set('editor', {}, makeMount(hookA));
			cache.set('highlight', {}, makeMount(hookB));
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(hookA).toHaveBeenCalledWith('original');
		});

		it('invokes the second mount hook too', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const hookA = vi.fn();
			const hookB = vi.fn();
			cache.set('editor', {}, makeMount(hookA));
			cache.set('highlight', {}, makeMount(hookB));
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(hookB).toHaveBeenCalledWith('original');
		});

		it('skips mounts that do not declare the hook', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const hook = vi.fn();
			cache.set('editor', {}, makeMount(hook));
			cache.set('highlight', {}, makeMount());
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(hook).toHaveBeenCalledTimes(1);
		});

		it('a throwing onSnippetChanged does not abort remaining mounts', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const hookSecond = vi.fn();
			cache.set('boom', {}, makeMount(() => {
				throw new Error('boom');
			}));
			cache.set('editor', {}, makeMount(hookSecond));
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(hookSecond).toHaveBeenCalledWith('original');
		});

		it('a throwing onSnippetChanged still returns a reset state', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			cache.set('boom', {}, makeMount(() => {
				throw new Error('boom');
			}));
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.snippet).toBe('original');
		});
	});

	describe('B — boundaries', () => {
		it('activeLens is unchanged by reset', () => {
			const state = freshState({ snippet: 'edited', activeLens: 'highlight' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.activeLens).toBe('highlight');
		});

		it('activeTransforms is unchanged by reset', () => {
			const state = freshState({
				snippet: 'edited',
				activeTransforms: Object.freeze(['loopGuard']),
			});
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.activeTransforms).toEqual(['loopGuard']);
		});

		it('snippetName is unchanged by reset', () => {
			const state = freshState({ snippet: 'edited', snippetName: 'my ex' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.snippetName).toBe('my ex');
		});

		it('reset when snippet already equals originalCode still returns the originalCode', () => {
			const state = freshState({ snippet: 'original' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next.snippet).toBe('original');
		});

		it('the cache is NOT cleared by reset (entries still present afterwards)', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			cache.set('editor', {}, makeMount());
			const bus = createEventBus();

			resetSnippet(state, cache, bus);

			expect(cache.has('editor', {})).toBe(true);
		});
	});

	describe('I — interface contract', () => {
		it('returns a new object reference (not the input state)', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next).not.toBe(state);
		});

		it('returned state is frozen', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(Object.isFrozen(next)).toBe(true);
		});

		it('state-reset event payload carries snippet = originalCode', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('state-reset', listener);

			resetSnippet(state, cache, bus);

			expect(listener).toHaveBeenCalledWith({ snippet: 'original' });
		});

		it('dispatch fires BEFORE the IoC onSnippetChanged push (ordering)', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const calls: string[] = [];
			cache.set('editor', {}, makeMount(() => calls.push('hook')));
			const bus = createEventBus();
			bus.subscribe('state-reset', () => calls.push('dispatch'));

			resetSnippet(state, cache, bus);

			expect(calls).toEqual(['dispatch', 'hook']);
		});
	});

	describe('S — full round-trip', () => {
		it('full result matches expected shape after reset from a fully edited state', () => {
			const state = freshState({
				snippet: 'edited',
				activeLens: 'highlight',
				activeTransforms: Object.freeze(['loopGuard']),
				snippetName: 'my ex',
			});
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetSnippet(state, cache, bus);

			expect(next).toEqual({
				originalCode: 'original',
				snippet: 'original',
				initialLens: 'editor',
				activeLens: 'highlight',
				initialTransforms: ['format'],
				activeTransforms: ['loopGuard'],
				snippetName: 'my ex',
			});
		});
	});
});
