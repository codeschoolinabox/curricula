/**
 * @file Unit tests for `createLensCache`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces → Simple.
 * No E — factory has no runtime failure modes.
 */

import { describe, expect, it, vi } from 'vitest';

import createLensCache from '../create-lens-cache.js';
import type { LensConfig, LensMount } from '../types.js';

function makeMount(id: string = 'mount'): LensMount {
	return {
		el: { __id: id } as unknown as HTMLElement,
		dispose: () => {},
	};
}

describe('createLensCache', () => {
	describe('Z — fresh cache', () => {
		it('get returns undefined for any key on a fresh cache', () => {
			const cache = createLensCache();

			expect(cache.get('editor', {})).toBeUndefined();
		});

		it('has returns false for any key on a fresh cache', () => {
			const cache = createLensCache();

			expect(cache.has('editor', {})).toBe(false);
		});

		it('visit callback is not invoked on an empty cache', () => {
			const cache = createLensCache();
			const callback = vi.fn();

			cache.visit(callback);

			expect(callback).not.toHaveBeenCalled();
		});

		it('clear on an empty cache is a no-op (no throw)', () => {
			const cache = createLensCache();

			expect(() => cache.clear()).not.toThrow();
		});
	});

	describe('O — one entry', () => {
		it('get returns the mount after set', () => {
			const cache = createLensCache();
			const mount = makeMount('a');
			cache.set('editor', {}, mount);

			expect(cache.get('editor', {})).toBe(mount);
		});

		it('has returns true after set', () => {
			const cache = createLensCache();
			cache.set('editor', {}, makeMount());

			expect(cache.has('editor', {})).toBe(true);
		});

		it('delete removes the entry', () => {
			const cache = createLensCache();
			cache.set('editor', {}, makeMount());

			cache.delete('editor', {});

			expect(cache.has('editor', {})).toBe(false);
		});

		it('visit invokes the callback once for a single entry', () => {
			const cache = createLensCache();
			const callback = vi.fn();
			cache.set('editor', {}, makeMount());

			cache.visit(callback);

			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	describe('M — multiple entries', () => {
		it('two distinct (name, config) keys produce two entries', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', {}, mountA);
			cache.set('highlight', {}, mountB);

			expect(cache.get('editor', {})).toBe(mountA);
		});

		it('the second of two distinct entries is retrievable', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', {}, mountA);
			cache.set('highlight', {}, mountB);

			expect(cache.get('highlight', {})).toBe(mountB);
		});

		it('visit iterates every entry', () => {
			const cache = createLensCache();
			const callback = vi.fn();
			cache.set('editor', {}, makeMount('a'));
			cache.set('highlight', {}, makeMount('b'));
			cache.set('parsons', {}, makeMount('c'));

			cache.visit(callback);

			expect(callback).toHaveBeenCalledTimes(3);
		});
	});

	describe('B — boundaries', () => {
		it('same name + different config → two independent entries', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', { theme: 'dark' }, mountA);
			cache.set('editor', { theme: 'light' }, mountB);

			expect(cache.get('editor', { theme: 'dark' })).toBe(mountA);
		});

		it('different name + same config → two independent entries', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', { theme: 'dark' }, mountA);
			cache.set('highlight', { theme: 'dark' }, mountB);

			expect(cache.get('highlight', { theme: 'dark' })).toBe(mountB);
		});

		it('same name + same config with permuted key order collapses to ONE entry', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', { a: 1, b: 2 }, mountA);
			cache.set('editor', { b: 2, a: 1 } as LensConfig, mountB);

			expect(cache.get('editor', { b: 2, a: 1 } as LensConfig)).toBe(mountB);
		});

		it('set with a colliding key replaces the previous entry', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', {}, mountA);

			cache.set('editor', {}, mountB);

			expect(cache.get('editor', {})).toBe(mountB);
		});

		it('delete of a key that was never set is a no-op (no throw)', () => {
			const cache = createLensCache();

			expect(() => cache.delete('editor', {})).not.toThrow();
		});

		it('clear removes all entries', () => {
			const cache = createLensCache();
			cache.set('editor', {}, makeMount('a'));
			cache.set('highlight', {}, makeMount('b'));

			cache.clear();

			expect(cache.has('editor', {})).toBe(false);
		});

		it('clear also removes the second entry', () => {
			const cache = createLensCache();
			cache.set('editor', {}, makeMount('a'));
			cache.set('highlight', {}, makeMount('b'));

			cache.clear();

			expect(cache.has('highlight', {})).toBe(false);
		});

		it('config with array-valued field is hashable', () => {
			const cache = createLensCache();
			const mount = makeMount();
			cache.set('editor', { tokens: ['a', 'b'] }, mount);

			expect(cache.get('editor', { tokens: ['a', 'b'] })).toBe(mount);
		});

		it('arrays with different order produce different entries (array order is semantic)', () => {
			const cache = createLensCache();
			const mountA = makeMount('a');
			const mountB = makeMount('b');
			cache.set('editor', { tokens: ['a', 'b'] }, mountA);
			cache.set('editor', { tokens: ['b', 'a'] }, mountB);

			expect(cache.get('editor', { tokens: ['a', 'b'] })).toBe(mountA);
		});

		it('colliding set retains exactly ONE entry (visit called once)', () => {
			const cache = createLensCache();
			const callback = vi.fn();
			cache.set('editor', {}, makeMount('a'));
			cache.set('editor', {}, makeMount('b'));

			cache.visit(callback);

			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('null config value is not conflated with the string "null"', () => {
			const cache = createLensCache();
			const mountNull = makeMount('null-value');
			const mountString = makeMount('string-value');
			cache.set('editor', { a: null }, mountNull);
			cache.set('editor', { a: 'null' }, mountString);

			expect(cache.get('editor', { a: null })).toBe(mountNull);
		});

		it('boolean config value is not conflated with the string "true"', () => {
			const cache = createLensCache();
			const mountBool = makeMount('bool');
			const mountString = makeMount('string');
			cache.set('editor', { flag: true }, mountBool);
			cache.set('editor', { flag: 'true' }, mountString);

			expect(cache.get('editor', { flag: true })).toBe(mountBool);
		});
	});

	describe('I — interface contract', () => {
		it('visit iterates entries in insertion order', () => {
			const cache = createLensCache();
			cache.set('editor', {}, makeMount('a'));
			cache.set('highlight', {}, makeMount('b'));
			cache.set('parsons', {}, makeMount('c'));
			const names: string[] = [];

			cache.visit((entry) => names.push(entry.name));

			expect(names).toEqual(['editor', 'highlight', 'parsons']);
		});

		it('visit callback receives an entry with name, config, and mount', () => {
			const cache = createLensCache();
			const mount = makeMount('one');
			cache.set('editor', { theme: 'dark' }, mount);
			const received: unknown[] = [];

			cache.visit((entry) => received.push(entry));

			expect(received[0]).toEqual({
				name: 'editor',
				config: { theme: 'dark' },
				mount,
			});
		});

		it('the returned cache handle is frozen', () => {
			const cache = createLensCache();

			expect(Object.isFrozen(cache)).toBe(true);
		});

		it('get returns the exact mount reference, not a clone', () => {
			const cache = createLensCache();
			const mount = makeMount();
			cache.set('editor', {}, mount);

			const retrieved = cache.get('editor', {});

			expect(retrieved).toBe(mount);
		});

		it('set does NOT auto-dispose the replaced mount (caller responsibility)', () => {
			const cache = createLensCache();
			const dispose = vi.fn();
			const oldMount: LensMount = {
				el: {} as HTMLElement,
				dispose,
			};
			cache.set('editor', {}, oldMount);

			cache.set('editor', {}, makeMount('new'));

			expect(dispose).not.toHaveBeenCalled();
		});

		it('clear does NOT auto-dispose mounts (caller responsibility)', () => {
			const cache = createLensCache();
			const dispose = vi.fn();
			cache.set('editor', {}, {
				el: {} as HTMLElement,
				dispose,
			});

			cache.clear();

			expect(dispose).not.toHaveBeenCalled();
		});
	});

	describe('S — full round-trip', () => {
		it('set → get → delete → clear behaves as expected end-to-end', () => {
			const cache = createLensCache();
			const mount = makeMount();
			cache.set('editor', { theme: 'dark' }, mount);
			const got = cache.get('editor', { theme: 'dark' });
			cache.delete('editor', { theme: 'dark' });
			cache.clear();

			expect(got).toBe(mount);
		});

		it('cache is empty after the round-trip', () => {
			const cache = createLensCache();
			cache.set('editor', { theme: 'dark' }, makeMount());
			cache.delete('editor', { theme: 'dark' });
			cache.clear();

			expect(cache.has('editor', { theme: 'dark' })).toBe(false);
		});
	});
});
