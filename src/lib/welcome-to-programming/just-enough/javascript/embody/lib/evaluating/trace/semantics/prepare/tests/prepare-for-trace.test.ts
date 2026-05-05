/**
 * @file Tests for prepareForTrace() — the pre-flight pipeline.
 *
 * Coverage: the 5-step pipeline (validate code → validate config → prepareConfig
 * → verifyOptions → assemble PreparedTraceInput). Each step's failure mode has
 * its own test; happy path confirms assembly.
 */

import { describe, expect, it } from 'vitest';

import prepareForTrace from '../prepare-for-trace.js';

describe('prepareForTrace', () => {
	describe('code validation (step 1)', () => {
		describe('errors', () => {
			it('throws when code is undefined', () => {
				expect(() => prepareForTrace(undefined as unknown as string)).toThrow(
					'expected code to be a string, got undefined',
				);
			});

			it('throws when code is null', () => {
				expect(() => prepareForTrace(null as unknown as string)).toThrow(
					'expected code to be a string, got object',
				);
			});

			it('throws when code is a number', () => {
				expect(() => prepareForTrace(42 as unknown as string)).toThrow(
					'expected code to be a string, got number',
				);
			});

			it('throws when code is an object', () => {
				expect(() => prepareForTrace({} as unknown as string)).toThrow(
					'expected code to be a string, got object',
				);
			});
		});

		describe('accepts', () => {
			it('accepts empty string', () => {
				expect(() => prepareForTrace('')).not.toThrow();
			});

			it('accepts non-empty string', () => {
				expect(() => prepareForTrace('let x = 5;')).not.toThrow();
			});
		});
	});

	describe('config validation (step 2)', () => {
		describe('errors', () => {
			it('throws when config is a string', () => {
				expect(() => prepareForTrace('let x = 5;', 'bogus')).toThrow(
					'expected config to be an object, got string',
				);
			});

			it('throws when config is a number', () => {
				expect(() => prepareForTrace('let x = 5;', 42)).toThrow(
					'expected config to be an object, got number',
				);
			});
		});

		describe('accepts', () => {
			it('accepts undefined config', () => {
				expect(() => prepareForTrace('let x = 5;', undefined)).not.toThrow();
			});

			it('accepts null config', () => {
				expect(() => prepareForTrace('let x = 5;', null)).not.toThrow();
			});

			it('accepts empty object config', () => {
				expect(() => prepareForTrace('let x = 5;', {})).not.toThrow();
			});
		});
	});

	describe('options preparation (step 3)', () => {
		describe('defaults', () => {
			it('returns options object when config is absent', () => {
				const result = prepareForTrace('let x = 5;');
				expect(typeof result.options).toBe('object');
			});

			it('returns options object when config is empty', () => {
				const result = prepareForTrace('let x = 5;', {});
				expect(typeof result.options).toBe('object');
			});

			it('populates resolve.dependent default true', () => {
				const result = prepareForTrace('let x = 5;', {});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['dependent']).toBe(true);
			});

			it('populates resolve.provenance default true', () => {
				const result = prepareForTrace('let x = 5;', {});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['provenance']).toBe(true);
			});

			it('populates resolve.kinds as object', () => {
				const result = prepareForTrace('let x = 5;', {});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(typeof resolve['kinds']).toBe('object');
			});

			it('populates resolve.kinds.variable default true', () => {
				const result = prepareForTrace('let x = 5;', {});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['variable']).toBe(true);
			});

			it('populates resolve.kinds.operator default true', () => {
				const result = prepareForTrace('let x = 5;', {});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['operator']).toBe(true);
			});

			it('populates errors default true', () => {
				const result = prepareForTrace('let x = 5;', {});
				expect(result.options['errors']).toBe(true);
			});
		});

		describe('boolean shorthand expansion (recursive)', () => {
			it('{ resolve: true } expands to dependent/provenance/kinds all true', () => {
				const result = prepareForTrace('let x = 5;', { options: { resolve: true } });
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['dependent']).toBe(true);
			});

			it('{ resolve: true } expands kinds.variable to true', () => {
				const result = prepareForTrace('let x = 5;', { options: { resolve: true } });
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['variable']).toBe(true);
			});

			it('{ resolve: false } expands kinds.variable to false', () => {
				const result = prepareForTrace('let x = 5;', { options: { resolve: false } });
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['variable']).toBe(false);
			});

			it('{ resolve: false } sets dependent to false', () => {
				const result = prepareForTrace('let x = 5;', { options: { resolve: false } });
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['dependent']).toBe(false);
			});

			it('{ statements: true } recursively expands statements.while.test', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { statements: true },
				});
				const statements = result.options['statements'] as Record<string, unknown>;
				const whileLoop = statements['while'] as Record<string, unknown>;
				expect(whileLoop['test']).toBe(true);
			});

			it('{ statements: false } recursively expands statements.while.test to false', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { statements: false },
				});
				const statements = result.options['statements'] as Record<string, unknown>;
				const whileLoop = statements['while'] as Record<string, unknown>;
				expect(whileLoop['test']).toBe(false);
			});
		});

		describe('fine-grained overrides', () => {
			it('{ resolve: { provenance: false } } preserves provenance: false', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { resolve: { provenance: false } },
				});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['provenance']).toBe(false);
			});

			it('{ resolve: { provenance: false } } still defaults dependent to true', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { resolve: { provenance: false } },
				});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				expect(resolve['dependent']).toBe(true);
			});

			it('{ resolve: { kinds: { variable: false } } } disables only variable', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { resolve: { kinds: { variable: false } } },
				});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['variable']).toBe(false);
			});

			it('{ resolve: { kinds: { variable: false } } } leaves other kinds default true', () => {
				const result = prepareForTrace('let x = 5;', {
					options: { resolve: { kinds: { variable: false } } },
				});
				const resolve = result.options['resolve'] as Record<string, unknown>;
				const kinds = resolve['kinds'] as Record<string, unknown>;
				expect(kinds['literal']).toBe(true);
			});
		});
	});

	describe('semantic validation (step 4)', () => {
		describe('errors', () => {
			it('throws when range.start > range.end', () => {
				expect(() =>
					prepareForTrace('let x = 5;', { range: { start: 10, end: 5 } }),
				).toThrow('range.start (10) must be <= range.end (5)');
			});

			it('throws when iterations is 0', () => {
				expect(() => prepareForTrace('let x = 5;', { iterations: 0 })).toThrow(
					'iterations (0) must be a positive number',
				);
			});

			it('throws when seconds is negative', () => {
				expect(() => prepareForTrace('let x = 5;', { seconds: -1 })).toThrow(
					'seconds (-1) must be a positive number',
				);
			});
		});

		describe('accepts', () => {
			it('accepts valid range', () => {
				expect(() =>
					prepareForTrace('let x = 5;', { range: { start: 1, end: 10 } }),
				).not.toThrow();
			});

			it('accepts positive iterations', () => {
				expect(() => prepareForTrace('let x = 5;', { iterations: 100 })).not.toThrow();
			});
		});
	});

	describe('assembly (step 5)', () => {
		it('returns code unchanged', () => {
			const result = prepareForTrace('let x = 5;');
			expect(result.code).toBe('let x = 5;');
		});

		it('passes range through unchanged', () => {
			const range = { start: 2, end: 7 };
			const result = prepareForTrace('let x = 5;', { range });
			expect(result.range).toEqual(range);
		});

		it('passes iterations through unchanged', () => {
			const result = prepareForTrace('let x = 5;', { iterations: 500 });
			expect(result.iterations).toBe(500);
		});

		it('passes seconds through unchanged', () => {
			const result = prepareForTrace('let x = 5;', { seconds: 10 });
			expect(result.seconds).toBe(10);
		});

		it('omits range when not provided', () => {
			const result = prepareForTrace('let x = 5;', {});
			expect(result.range).toBeUndefined();
		});
	});

	describe('idempotency', () => {
		it('double-prep produces same options shape', () => {
			const result1 = prepareForTrace('let x = 5;', { options: { resolve: true } });
			// Treat result1.options as the input to a second prep via config.options
			const result2 = prepareForTrace('let x = 5;', {
				options: result1.options as unknown as Record<string, unknown>,
			});
			expect(result2.options).toEqual(result1.options);
		});
	});
});
