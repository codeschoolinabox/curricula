/**
 * @file Unit tests for `validatePipeline`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces →
 * Exceptions → Simple (golden-path summary).
 *
 * All tests are pure-TS: no DOM, no React, no jsdom environment needed.
 * Transforms and lenses are minimal stubs that satisfy the module
 * contracts without real implementations.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import validatePipeline from '../pipeline.js';
import createRegistry from '../registry.js';
import type { LensModule, TransformModule } from '../types.js';

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

describe('validatePipeline', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Z — empty transforms + registered lens', () => {
		it('returns a Pipeline whose transforms and lens echo the input', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const input = { transforms: [], lens: 'editor' } as const;

			const result = validatePipeline(input, registry);

			expect(result).toEqual({ transforms: [], lens: 'editor' });
		});
	});

	describe('O — one transform + non-editor lens', () => {
		it('returns a Pipeline echoing the single transform and the lens name', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			registry.register(makeLens('highlight'));
			const input = { transforms: ['format'], lens: 'highlight' } as const;

			const result = validatePipeline(input, registry);

			expect(result).toEqual({ transforms: ['format'], lens: 'highlight' });
		});
	});

	describe('M — multiple transforms + registered lens', () => {
		it('returns a Pipeline echoing every transform and the lens name', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			registry.register(makeTransform('loopGuard'));
			registry.register(makeLens('highlight'));
			const input = {
				transforms: ['format', 'loopGuard'],
				lens: 'highlight',
			} as const;

			const result = validatePipeline(input, registry);

			expect(result).toEqual({
				transforms: ['format', 'loopGuard'],
				lens: 'highlight',
			});
		});
	});

	describe('B — unknown lens name', () => {
		it('replaces the lens with "editor"', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const registry = createRegistry();
			const input = { transforms: [], lens: 'mystery' } as const;

			const result = validatePipeline(input, registry);

			expect(result.lens).toBe('editor');
		});

		it('emits a console.warn', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const registry = createRegistry();
			const input = { transforms: [], lens: 'mystery' } as const;

			validatePipeline(input, registry);

			expect(warnSpy).toHaveBeenCalled();
		});
	});

	describe('B — empty-string lens', () => {
		it('replaces the lens with "editor"', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const registry = createRegistry();
			const input = { transforms: [], lens: '' } as const;

			const result = validatePipeline(input, registry);

			expect(result.lens).toBe('editor');
		});

		it('emits a console.warn', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const registry = createRegistry();
			const input = { transforms: [], lens: '' } as const;

			validatePipeline(input, registry);

			expect(warnSpy).toHaveBeenCalled();
		});
	});

	describe('I — returned Pipeline shape', () => {
		it('is a new object reference, not the input', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const input = { transforms: [], lens: 'editor' } as const;

			const result = validatePipeline(input, registry);

			expect(result).not.toBe(input);
		});

		it('is frozen at the top level', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const input = { transforms: [], lens: 'editor' } as const;

			const result = validatePipeline(input, registry);

			expect(Object.isFrozen(result)).toBe(true);
		});

		it('has a frozen transforms array (deep-frozen)', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			registry.register(makeLens('editor'));
			const input = { transforms: ['format'], lens: 'editor' } as const;

			const result = validatePipeline(input, registry);

			expect(Object.isFrozen(result.transforms)).toBe(true);
		});
	});

	describe('E — exceptions', () => {
		it('throws when a transform name is unknown', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const input = { transforms: ['nope'], lens: 'editor' } as const;

			expect(() => validatePipeline(input, registry)).toThrow();
		});

		it('throws with the offending transform name in the error message', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			registry.register(makeTransform('loopGuard'));
			registry.register(makeLens('editor'));
			const input = {
				transforms: ['format', 'unknownX', 'loopGuard'],
				lens: 'editor',
			} as const;

			expect(() => validatePipeline(input, registry)).toThrow(/unknownX/);
		});

		it('throws with a type-mismatch message when a transforms entry is a registered lens', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const input = { transforms: ['editor'], lens: 'editor' } as const;

			expect(() => validatePipeline(input, registry)).toThrow(
				/registered as a lens/,
			);
		});

		it('throws with a type-mismatch message when the lens name is a registered transform', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			const input = { transforms: [], lens: 'format' } as const;

			expect(() => validatePipeline(input, registry)).toThrow(
				/registered as a transform/,
			);
		});
	});

	describe('S — full happy-path pipeline', () => {
		it('returns a valid Pipeline for format + loopGuard + editor', () => {
			const registry = createRegistry();
			registry.register(makeTransform('format'));
			registry.register(makeTransform('loopGuard'));
			registry.register(makeLens('editor'));
			const input = {
				transforms: ['format', 'loopGuard'],
				lens: 'editor',
			} as const;

			const result = validatePipeline(input, registry);

			expect(result).toEqual({
				transforms: ['format', 'loopGuard'],
				lens: 'editor',
			});
		});
	});
});
