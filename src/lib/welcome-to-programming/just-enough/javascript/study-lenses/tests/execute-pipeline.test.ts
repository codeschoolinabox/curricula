/**
 * @file Unit tests for `executePipeline`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces →
 * Exceptions → Simple.
 *
 * All tests are pure-TS: no DOM, no React, no jsdom environment needed.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import executePipeline from '../execute-pipeline.js';
import createRegistry from '../registry.js';
import type {
	LensModule,
	TransformConfig,
	TransformFailureMode,
	TransformModule,
} from '../types.js';

function makeTransform(
	name: string,
	options: {
		transform?: (code: string, config?: TransformConfig) => string;
		config?: (overrides?: Partial<TransformConfig>) => TransformConfig;
		onFailure?: TransformFailureMode;
	} = {},
): TransformModule {
	return {
		name,
		transform: options.transform ?? ((code: string) => code),
		config:
			options.config ??
			((overrides?: Partial<TransformConfig>) =>
				Object.freeze({ ...overrides })),
		onFailure: options.onFailure,
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

describe('executePipeline', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Z — empty transforms', () => {
		it('transformedCode echoes the input code', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result = executePipeline('hello', pipeline, registry);

			expect(result.transformedCode).toBe('hello');
		});

		it('resolvedLens echoes pipeline.lens', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result = executePipeline('hello', pipeline, registry);

			expect(result.resolvedLens).toBe('editor');
		});
	});

	describe('O — one transform', () => {
		it('transformedCode is the output of the single transform', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('upper', {
					transform: (code) => code.toUpperCase(),
				}),
			);
			registry.register(makeLens('highlight'));
			const pipeline = { transforms: ['upper'], lens: 'highlight' } as const;

			const result = executePipeline('hello', pipeline, registry);

			expect(result.transformedCode).toBe('HELLO');
		});

		it('resolvedLens echoes a non-editor lens', () => {
			const registry = createRegistry();
			registry.register(makeTransform('upper'));
			registry.register(makeLens('highlight'));
			const pipeline = { transforms: ['upper'], lens: 'highlight' } as const;

			const result = executePipeline('hello', pipeline, registry);

			expect(result.resolvedLens).toBe('highlight');
		});
	});

	describe('M — multiple transforms', () => {
		it('applies transforms in declared order (concrete result)', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('appendA', { transform: (code) => `${code}a` }),
			);
			registry.register(
				makeTransform('appendB', { transform: (code) => `${code}b` }),
			);
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['appendA', 'appendB'],
				lens: 'editor',
			} as const;

			const result = executePipeline('x', pipeline, registry);

			expect(result.transformedCode).toBe('xab');
		});

		it('a fallthrough-mode transform that succeeds behaves identically to abort-mode', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('upper', {
					transform: (code) => code.toUpperCase(),
					onFailure: 'fallthrough',
				}),
			);
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['upper'], lens: 'editor' } as const;

			const result = executePipeline('hi', pipeline, registry);

			expect(result.transformedCode).toBe('HI');
		});

		it('passes pipeline.configs[name] as overrides to module.config', () => {
			const configSpy = vi.fn(
				(overrides?: Partial<TransformConfig>): TransformConfig =>
					Object.freeze({ ...overrides }),
			);
			const registry = createRegistry();
			registry.register(makeTransform('format', { config: configSpy }));
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['format'],
				lens: 'editor',
				configs: { format: { indentWidth: 4 } },
			} as const;

			executePipeline('hello', pipeline, registry);

			expect(configSpy).toHaveBeenCalledWith({ indentWidth: 4 });
		});

		it('passes the RESOLVED config (return of module.config) to module.transform', () => {
			const transformSpy = vi.fn(
				(code: string, _config?: TransformConfig) => code,
			);
			const registry = createRegistry();
			registry.register(
				makeTransform('format', { transform: transformSpy }),
			);
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['format'],
				lens: 'editor',
				configs: { format: { indentWidth: 4 } },
			} as const;

			executePipeline('hello', pipeline, registry);

			expect(transformSpy).toHaveBeenCalledWith(
				'hello',
				expect.objectContaining({ indentWidth: 4 }),
			);
		});

		it('calls module.config with undefined when pipeline has no configs at all', () => {
			const configSpy = vi.fn(
				(overrides?: Partial<TransformConfig>): TransformConfig =>
					Object.freeze({ ...overrides }),
			);
			const registry = createRegistry();
			registry.register(makeTransform('format', { config: configSpy }));
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['format'], lens: 'editor' } as const;

			executePipeline('hello', pipeline, registry);

			expect(configSpy).toHaveBeenCalledWith(undefined);
		});

		it('calls module.config with undefined when configs is an empty object', () => {
			const configSpy = vi.fn(
				(overrides?: Partial<TransformConfig>): TransformConfig =>
					Object.freeze({ ...overrides }),
			);
			const registry = createRegistry();
			registry.register(makeTransform('format', { config: configSpy }));
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['format'],
				lens: 'editor',
				configs: {},
			} as const;

			executePipeline('hello', pipeline, registry);

			expect(configSpy).toHaveBeenCalledWith(undefined);
		});
	});

	describe('B — boundaries', () => {
		it('empty code + empty transforms → empty transformedCode', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result = executePipeline('', pipeline, registry);

			expect(result.transformedCode).toBe('');
		});

		it('empty code + 1 identity transform → empty transformedCode', () => {
			const registry = createRegistry();
			registry.register(makeTransform('noop'));
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['noop'], lens: 'editor' } as const;

			const result = executePipeline('', pipeline, registry);

			expect(result.transformedCode).toBe('');
		});

		it('transform returning empty string → empty transformedCode', () => {
			const registry = createRegistry();
			registry.register(makeTransform('eraser', { transform: () => '' }));
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['eraser'], lens: 'editor' } as const;

			const result = executePipeline('hello', pipeline, registry);

			expect(result.transformedCode).toBe('');
		});

		it('fallthrough-failure leaves accumulated unchanged for the NEXT transform', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('boom', {
					transform: () => {
						throw new Error('boom');
					},
					onFailure: 'fallthrough',
				}),
			);
			registry.register(
				makeTransform('appendA', { transform: (code) => `${code}a` }),
			);
			registry.register(makeLens('editor'));
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const pipeline = {
				transforms: ['boom', 'appendA'],
				lens: 'editor',
			} as const;

			const result = executePipeline('x', pipeline, registry);

			expect(result.transformedCode).toBe('xa');
		});

		it('fallthrough-failure mid-pipeline threads the pre-failure accumulated forward', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('appendA', { transform: (code) => `${code}a` }),
			);
			registry.register(
				makeTransform('boom', {
					transform: () => {
						throw new Error('boom');
					},
					onFailure: 'fallthrough',
				}),
			);
			registry.register(
				makeTransform('appendC', { transform: (code) => `${code}c` }),
			);
			registry.register(makeLens('editor'));
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const pipeline = {
				transforms: ['appendA', 'boom', 'appendC'],
				lens: 'editor',
			} as const;

			const result = executePipeline('x', pipeline, registry);

			expect(result.transformedCode).toBe('xac');
		});

		it('fallthrough-failure emits console.warn with the transform name and the error', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const registry = createRegistry();
			const boomError = new Error('boom');
			registry.register(
				makeTransform('boom', {
					transform: () => {
						throw boomError;
					},
					onFailure: 'fallthrough',
				}),
			);
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['boom'], lens: 'editor' } as const;

			executePipeline('x', pipeline, registry);

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('boom'),
				boomError,
			);
		});

		it('stray configs key (not in transforms or lens) is harmless at execution', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('appendA', { transform: (code) => `${code}a` }),
			);
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['appendA'],
				lens: 'editor',
				configs: { nonexistent: { x: 1 } },
			} as const;

			const result = executePipeline('x', pipeline, registry);

			expect(result.transformedCode).toBe('xa');
		});
	});

	describe('I — returned shape', () => {
		it('returns a new object reference on each call (but equal value)', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result1 = executePipeline('x', pipeline, registry);
			const result2 = executePipeline('x', pipeline, registry);

			expect(result1).not.toBe(result2);
		});

		it('two calls with identical inputs produce equal results', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result1 = executePipeline('x', pipeline, registry);
			const result2 = executePipeline('x', pipeline, registry);

			expect(result1).toEqual(result2);
		});

		it('returned object is frozen', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: [], lens: 'editor' } as const;

			const result = executePipeline('x', pipeline, registry);

			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('E — exceptions', () => {
		it('rethrows when a transform throws with no onFailure field', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('boom', {
					transform: () => {
						throw new Error('boom');
					},
				}),
			);
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['boom'], lens: 'editor' } as const;

			expect(() => executePipeline('x', pipeline, registry)).toThrow(/boom/);
		});

		it('rethrows when a transform throws with onFailure: "abort"', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('boom', {
					transform: () => {
						throw new Error('boom');
					},
					onFailure: 'abort',
				}),
			);
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['boom'], lens: 'editor' } as const;

			expect(() => executePipeline('x', pipeline, registry)).toThrow(/boom/);
		});

		it('throws the invariant error when a transform name is not in the registry', () => {
			const registry = createRegistry();
			registry.register(makeLens('editor'));
			const pipeline = { transforms: ['nope'], lens: 'editor' } as const;

			expect(() => executePipeline('x', pipeline, registry)).toThrow(
				/"nope"[\s\S]*pipeline was not validated/,
			);
		});
	});

	describe('S — full happy-path pipeline', () => {
		it('returns the expected shape for a two-transform pipeline', () => {
			const registry = createRegistry();
			registry.register(
				makeTransform('appendA', { transform: (code) => `${code}a` }),
			);
			registry.register(
				makeTransform('appendB', { transform: (code) => `${code}b` }),
			);
			registry.register(makeLens('editor'));
			const pipeline = {
				transforms: ['appendA', 'appendB'],
				lens: 'editor',
			} as const;

			const result = executePipeline('hi', pipeline, registry);

			expect(result).toEqual({
				transformedCode: 'hiab',
				resolvedLens: 'editor',
			});
		});
	});
});
