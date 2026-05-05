/**
 * @file Unit tests for `createRegistry`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces →
 * Exceptions → Simple (golden-path summary).
 *
 * All tests are pure-TS: no DOM, no React, no jsdom environment needed.
 * Transforms and lenses are minimal stubs that satisfy the module
 * contracts without real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import createRegistry from '../registry.js';

import type { LensModule, Registry, TransformModule } from '../types.js';

// ─── Stubs ──────────────────────────────────────────────────────────

function makeTransform(name: string): TransformModule {
	return {
		name,
		transform: (code: string) => code,
		config: () => Object.freeze({}),
	};
}

function makeLens(name: string): LensModule {
	return {
		name,
		lens() {
			return { el: {} as HTMLElement, dispose() {} };
		},
		config: () => Object.freeze({}),
		recommend: () => [],
	};
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('createRegistry', () => {
	describe('Zero — empty registry', () => {
		it('getTransform → undefined for any name on a fresh registry', () => {
			const registry = createRegistry();
			expect(registry.getTransform('anything')).toBeUndefined();
		});

		it('getLens → undefined for any name on a fresh registry', () => {
			const registry = createRegistry();
			expect(registry.getLens('anything')).toBeUndefined();
		});
	});

	describe('One — register and retrieve a single module', () => {
		describe('transform registered and retrieved by name', () => {
			it('getTransform("format")?.name = "format"', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				expect(registry.getTransform('format')?.name).toBe('format');
			});

			it('getTransform("format")?.transform is a function (full module preserved, not just name)', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				expect(typeof registry.getTransform('format')?.transform).toBe('function');
			});

			it('register() returns void', () => {
				const registry = createRegistry();
				expect(registry.register(makeTransform('format'))).toBeUndefined();
			});

			it('getLens("format") = undefined (transform not in lens slot)', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				expect(registry.getLens('format')).toBeUndefined();
			});
		});

		describe('lens registered and retrieved by name', () => {
			it('getLens("editor")?.name = "editor"', () => {
				const registry = createRegistry();
				registry.register(makeLens('editor'));
				expect(registry.getLens('editor')?.name).toBe('editor');
			});

			it('getTransform("editor") = undefined (lens not in transform slot)', () => {
				const registry = createRegistry();
				registry.register(makeLens('editor'));
				expect(registry.getTransform('editor')).toBeUndefined();
			});
		});
	});

	describe('Many — register multiple modules', () => {
		describe('multiple transforms all retrievable by name', () => {
			let registry: Registry;
			beforeEach(() => {
				registry = createRegistry();
				registry.register(makeTransform('format'));
				registry.register(makeTransform('loopGuard'));
				registry.register(makeTransform('toUpperCase'));
			});

			it('getTransform("format")?.name = "format"', () => {
				expect(registry.getTransform('format')?.name).toBe('format');
			});

			it('getTransform("loopGuard")?.name = "loopGuard"', () => {
				expect(registry.getTransform('loopGuard')?.name).toBe('loopGuard');
			});

			it('getTransform("toUpperCase")?.name = "toUpperCase"', () => {
				expect(registry.getTransform('toUpperCase')?.name).toBe('toUpperCase');
			});
		});

		describe('multiple lenses all retrievable by name', () => {
			let registry: Registry;
			beforeEach(() => {
				registry = createRegistry();
				registry.register(makeLens('editor'));
				registry.register(makeLens('highlight'));
			});

			it('getLens("editor")?.name = "editor"', () => {
				expect(registry.getLens('editor')?.name).toBe('editor');
			});

			it('getLens("highlight")?.name = "highlight"', () => {
				expect(registry.getLens('highlight')?.name).toBe('highlight');
			});
		});

		describe('transforms and lenses coexist; slots are independent', () => {
			let registry: Registry;
			beforeEach(() => {
				registry = createRegistry();
				registry.register(makeTransform('format'));
				registry.register(makeLens('editor'));
			});

			it('getTransform("format")?.name = "format"', () => {
				expect(registry.getTransform('format')?.name).toBe('format');
			});

			it('getLens("editor")?.name = "editor"', () => {
				expect(registry.getLens('editor')?.name).toBe('editor');
			});

			it('getTransform("editor") = undefined (cross-slot miss)', () => {
				expect(registry.getTransform('editor')).toBeUndefined();
			});

			it('getLens("format") = undefined (cross-slot miss)', () => {
				expect(registry.getLens('format')).toBeUndefined();
			});
		});
	});

	describe('Boundaries — edge names and isolation', () => {
		describe('empty name is rejected at register', () => {
			it('register({ name: "" }) throws', () => {
				const registry = createRegistry();
				expect(() =>
					registry.register({ ...makeTransform('x'), name: '' }),
				).toThrow(Error);
			});
		});

		describe('two registries are isolated', () => {
			it('registration in r1 is retrievable from r1', () => {
				const r1 = createRegistry();
				r1.register(makeTransform('format'));
				expect(r1.getTransform('format')).toBeDefined();
			});

			it('registration in r1 is not visible from r2', () => {
				const r1 = createRegistry();
				const r2 = createRegistry();
				r1.register(makeTransform('format'));
				expect(r2.getTransform('format')).toBeUndefined();
			});
		});
	});

	describe('Interfaces — returned module satisfies contract', () => {
		it('retrieved transform is frozen', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			expect(Object.isFrozen(registry.getTransform('format')!)).toBe(true);
		});

		it('retrieved lens is frozen', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			expect(Object.isFrozen(registry.getLens('editor')!)).toBe(true);
		});

		describe('caller mutation after registration does not affect stored module', () => {
			it('original name still retrievable', () => {
				const registry = createRegistry();
				const mod = makeTransform('format');
				registry.register(mod);
				(mod as { name: string }).name = 'mutated';
				expect(registry.getTransform('format')?.name).toBe('format');
			});

			it('mutated name returns undefined', () => {
				const registry = createRegistry();
				const mod = makeTransform('format');
				registry.register(mod);
				(mod as { name: string }).name = 'mutated';
				expect(registry.getTransform('mutated')).toBeUndefined();
			});
		});
	});

	describe('Exceptions — duplicate registration', () => {
		it('registering the same transform name twice throws', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			expect(() => registry.register(makeTransform('format'))).toThrow(
				/duplicate name "format"/,
			);
		});

		it('registering the same lens name twice throws', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			expect(() => registry.register(makeLens('editor'))).toThrow(
				/duplicate name "editor"/,
			);
		});

		it('registering a lens name already used by a transform throws (shared namespace)', () => {
			const registry = createRegistry();
			registry.register(makeTransform('conflict'));
			expect(() => registry.register(makeLens('conflict'))).toThrow(
				/duplicate name "conflict"/,
			);
		});

		it('registering a transform name already used by a lens throws (shared namespace)', () => {
			const registry = createRegistry();
			registry.register(makeLens('conflict'));
			expect(() => registry.register(makeTransform('conflict'))).toThrow(
				/duplicate name "conflict"/,
			);
		});
	});

	describe('Simple — golden path', () => {
		describe('full lifecycle: register transforms + lenses, retrieve each, miss on unknown', () => {
			let registry: Registry;
			beforeEach(() => {
				registry = createRegistry();
				registry.register(makeTransform('format'));
				registry.register(makeTransform('loopGuard'));
				registry.register(makeLens('editor'));
				registry.register(makeLens('highlight'));
			});

			it('getTransform("format") → "format"', () => {
				expect(registry.getTransform('format')?.name).toBe('format');
			});

			it('getTransform("loopGuard") → "loopGuard"', () => {
				expect(registry.getTransform('loopGuard')?.name).toBe('loopGuard');
			});

			it('getLens("editor") → "editor"', () => {
				expect(registry.getLens('editor')?.name).toBe('editor');
			});

			it('getLens("highlight") → "highlight"', () => {
				expect(registry.getLens('highlight')?.name).toBe('highlight');
			});

			it('getTransform("unknown") → undefined', () => {
				expect(registry.getTransform('unknown')).toBeUndefined();
			});

			it('getLens("unknown") → undefined', () => {
				expect(registry.getLens('unknown')).toBeUndefined();
			});
		});
	});

	describe('Enumeration — getLensNames / getTransformNames', () => {
		describe('Zero — empty registry', () => {
			it('getLensNames() returns an empty frozen array on a fresh registry', () => {
				const registry = createRegistry();
				const names = registry.getLensNames();
				expect(names).toEqual([]);
				expect(Object.isFrozen(names)).toBe(true);
			});

			it('getTransformNames() returns an empty frozen array on a fresh registry', () => {
				const registry = createRegistry();
				const names = registry.getTransformNames();
				expect(names).toEqual([]);
				expect(Object.isFrozen(names)).toBe(true);
			});
		});

		describe('One — single registration', () => {
			it('getLensNames() returns a one-element array after a single lens is registered', () => {
				const registry = createRegistry();
				registry.register(makeLens('editor'));
				expect(registry.getLensNames()).toEqual(['editor']);
			});

			it('getTransformNames() returns a one-element array after a single transform is registered', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				expect(registry.getTransformNames()).toEqual(['format']);
			});
		});

		describe('Many — multiple registrations preserve insertion order', () => {
			it('getLensNames() returns lens names in insertion order', () => {
				const registry = createRegistry();
				registry.register(makeLens('editor'));
				registry.register(makeLens('highlight'));
				registry.register(makeLens('parsons'));
				expect(registry.getLensNames()).toEqual([
					'editor',
					'highlight',
					'parsons',
				]);
			});

			it('getTransformNames() returns transform names in insertion order', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				registry.register(makeTransform('loopGuard'));
				expect(registry.getTransformNames()).toEqual([
					'format',
					'loopGuard',
				]);
			});
		});

		describe('Boundary — separation between lens and transform lists', () => {
			let registry: Registry;
			beforeEach(() => {
				registry = createRegistry();
				registry.register(makeTransform('format'));
				registry.register(makeLens('editor'));
				registry.register(makeTransform('loopGuard'));
				registry.register(makeLens('highlight'));
			});

			it('getLensNames() does not include transform names', () => {
				expect(registry.getLensNames()).toEqual([
					'editor',
					'highlight',
				]);
			});

			it('getTransformNames() does not include lens names', () => {
				expect(registry.getTransformNames()).toEqual([
					'format',
					'loopGuard',
				]);
			});
		});

		describe('Interface — fresh array per call', () => {
			it('getLensNames() returns a different array reference on each call (no shared mutable singleton)', () => {
				const registry = createRegistry();
				registry.register(makeLens('editor'));
				const first = registry.getLensNames();
				const second = registry.getLensNames();
				expect(first).not.toBe(second);
				expect(first).toEqual(second);
			});

			it('getTransformNames() returns a different array reference on each call', () => {
				const registry = createRegistry();
				registry.register(makeTransform('format'));
				const first = registry.getTransformNames();
				const second = registry.getTransformNames();
				expect(first).not.toBe(second);
				expect(first).toEqual(second);
			});
		});
	});
});
