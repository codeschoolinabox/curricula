/**
 * @file Unit tests for `resetAll`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces → Simple.
 * No E — resetAll has no runtime failure modes on valid inputs.
 */

import { describe, expect, it, vi } from 'vitest';

import createEventBus from '../create-event-bus.js';
import createLensCache from '../create-lens-cache.js';
import createOrchestratorState from '../create-orchestrator-state.js';
import resetAll from '../reset-all.js';
import type { LensMount, OrchestratorState } from '../types.js';

function makeMount(dispose: () => void = () => {}): LensMount {
	return {
		el: {} as HTMLElement,
		dispose,
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

describe('resetAll', () => {
	describe('Z — empty cache, fresh state', () => {
		it('returns a state with snippet reset to originalCode', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next.snippet).toBe('original');
		});

		it('dispatches state-reset-all once even with an empty cache', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('state-reset-all', listener);

			resetAll(state, cache, bus);

			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('does not throw when the cache is empty', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			expect(() => resetAll(state, cache, bus)).not.toThrow();
		});
	});

	describe('O — one cached mount', () => {
		it('invokes dispose on the cached mount', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const dispose = vi.fn();
			cache.set('editor', {}, makeMount(dispose));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(dispose).toHaveBeenCalledTimes(1);
		});

		it('clears the cache after reset', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			cache.set('editor', {}, makeMount());
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(cache.has('editor', {})).toBe(false);
		});
	});

	describe('M — multiple cached mounts', () => {
		it('disposes every cached mount', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const disposeA = vi.fn();
			const disposeB = vi.fn();
			cache.set('editor', {}, makeMount(disposeA));
			cache.set('highlight', {}, makeMount(disposeB));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(disposeA).toHaveBeenCalledTimes(1);
		});

		it('disposes the second mount too', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const disposeA = vi.fn();
			const disposeB = vi.fn();
			cache.set('editor', {}, makeMount(disposeA));
			cache.set('highlight', {}, makeMount(disposeB));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(disposeB).toHaveBeenCalledTimes(1);
		});

		it('a throwing dispose does not abort remaining disposals', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const disposeSecond = vi.fn();
			cache.set('boom', {}, makeMount(() => {
				throw new Error('boom');
			}));
			cache.set('editor', {}, makeMount(disposeSecond));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(disposeSecond).toHaveBeenCalledTimes(1);
		});

		it('a throwing dispose still clears the cache', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			cache.set('boom', {}, makeMount(() => {
				throw new Error('boom');
			}));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(cache.has('boom', {})).toBe(false);
		});
	});

	describe('B — boundaries', () => {
		it('activeLens is restored to initialLens', () => {
			const state = freshState({ activeLens: 'highlight' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next.activeLens).toBe('editor');
		});

		it('activeTransforms is restored to initialTransforms', () => {
			const state = freshState({
				activeTransforms: Object.freeze(['loopGuard']),
			});
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next.activeTransforms).toEqual(['format']);
		});

		it('snippetName is NOT reset by resetAll', () => {
			const state = freshState({ snippetName: 'my ex' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next.snippetName).toBe('my ex');
		});

		it('resetAll on state already at initial values still returns the initial values', () => {
			const state = freshState();
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next.snippet).toBe('original');
		});

		it('mounts without onSnippetChanged still have dispose called', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const dispose = vi.fn();
			cache.set('editor', {}, makeMount(dispose));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(dispose).toHaveBeenCalledTimes(1);
		});
	});

	describe('I — interface contract', () => {
		it('returns a new object reference (not the input state)', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next).not.toBe(state);
		});

		it('returned state is frozen', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(Object.isFrozen(next)).toBe(true);
		});

		it('state-reset-all event payload carries snippet, lens, and transforms', () => {
			const state = freshState({
				snippet: 'edited',
				activeLens: 'highlight',
				activeTransforms: Object.freeze(['loopGuard']),
			});
			const cache = createLensCache();
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('state-reset-all', listener);

			resetAll(state, cache, bus);

			expect(listener).toHaveBeenCalledWith({
				snippet: 'original',
				lens: 'editor',
				transforms: ['format'],
			});
		});

		it('dispatch fires BEFORE dispose (listeners observe pre-disposal cache)', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			const calls: string[] = [];
			cache.set('editor', {}, makeMount(() => calls.push('dispose')));
			const bus = createEventBus();
			bus.subscribe('state-reset-all', () => calls.push('dispatch'));

			resetAll(state, cache, bus);

			expect(calls).toEqual(['dispatch', 'dispose']);
		});

		it('dispose fires BEFORE cache.clear', () => {
			const state = freshState({ snippet: 'edited' });
			const cache = createLensCache();
			let cacheSizeAtDispose = -1;
			cache.set('editor', {}, makeMount(() => {
				cacheSizeAtDispose = cache.has('editor', {}) ? 1 : 0;
			}));
			const bus = createEventBus();

			resetAll(state, cache, bus);

			expect(cacheSizeAtDispose).toBe(1);
		});
	});

	describe('S — full round-trip', () => {
		it('full result matches expected shape after resetAll from a fully edited state', () => {
			const state = freshState({
				snippet: 'edited',
				activeLens: 'highlight',
				activeTransforms: Object.freeze(['loopGuard']),
				snippetName: 'my ex',
			});
			const cache = createLensCache();
			cache.set('highlight', {}, makeMount());
			const bus = createEventBus();

			const next = resetAll(state, cache, bus);

			expect(next).toEqual({
				originalCode: 'original',
				snippet: 'original',
				initialLens: 'editor',
				activeLens: 'editor',
				initialTransforms: ['format'],
				activeTransforms: ['format'],
				snippetName: 'my ex',
			});
		});
	});
});
