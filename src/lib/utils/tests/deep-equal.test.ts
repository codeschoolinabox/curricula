import { describe, expect, it } from 'vitest';

import deepEqual from '../deep-equal.js';

describe('deepEqual', () => {
	describe('primitives', () => {
		it('returns true for equal numbers', () => {
			expect(deepEqual(1, 1)).toBe(true);
		});

		it('returns false for unequal numbers', () => {
			expect(deepEqual(1, 2)).toBe(false);
		});

		it('returns true for equal strings', () => {
			expect(deepEqual('hello', 'hello')).toBe(true);
		});

		it('returns false for unequal strings', () => {
			expect(deepEqual('hello', 'world')).toBe(false);
		});

		it('returns true for equal booleans', () => {
			expect(deepEqual(true, true)).toBe(true);
		});

		it('returns false for unequal booleans', () => {
			expect(deepEqual(true, false)).toBe(false);
		});

		it('returns true for null equal to null', () => {
			expect(deepEqual(null, null)).toBe(true);
		});

		it('returns true for undefined equal to undefined', () => {
			expect(deepEqual()).toBe(true);
		});

		it('returns false for null vs undefined', () => {
			expect(deepEqual(null)).toBe(false);
		});

		it('returns false for primitive vs object', () => {
			expect(deepEqual(1, { valueOf: () => 1 })).toBe(false);
		});
	});

	describe('functions', () => {
		it('returns true for same function reference', () => {
			const function_ = () => 1;
			expect(deepEqual(function_, function_)).toBe(true);
		});

		it('returns false for different function references with same body', () => {
			expect(
				deepEqual(
					() => 1,
					() => 1,
				),
			).toBe(false);
		});
	});

	describe('Date objects', () => {
		it('returns true for Dates with same time value', () => {
			expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(
				true,
			);
		});

		it('returns false for Dates with different time values', () => {
			expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(
				false,
			);
		});

		it('returns false for Date vs plain object', () => {
			expect(
				deepEqual(new Date('2024-01-01'), { time: 1_704_067_200_000 }),
			).toBe(false);
		});
	});

	describe('RegExp objects', () => {
		it('returns true for RegExps with same source and flags', () => {
			expect(deepEqual(/test/gi, /test/gi)).toBe(true);
		});

		it('returns false for RegExps with different source', () => {
			expect(deepEqual(/test/g, /other/g)).toBe(false);
		});

		it('returns false for RegExps with different flags', () => {
			expect(deepEqual(/test/g, /test/i)).toBe(false);
		});

		it('returns false for RegExp vs plain object', () => {
			expect(deepEqual(/test/, { source: 'test', flags: '' })).toBe(false);
		});
	});

	describe('arrays', () => {
		it('returns true for equal arrays', () => {
			expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
		});

		it('returns true for empty arrays', () => {
			expect(deepEqual([], [])).toBe(true);
		});

		it('returns false for arrays with different lengths', () => {
			expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
		});

		it('returns false for arrays with different elements', () => {
			expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
		});

		it('returns true for nested equal arrays', () => {
			expect(
				deepEqual(
					[
						[1, 2],
						[3, 4],
					],
					[
						[1, 2],
						[3, 4],
					],
				),
			).toBe(true);
		});

		it('returns false for array vs plain object', () => {
			expect(deepEqual([1, 2], { 0: 1, 1: 2, length: 2 })).toBe(false);
		});
	});

	describe('Sets', () => {
		it('returns true for Sets with same values', () => {
			expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
		});

		it('returns true for empty Sets', () => {
			expect(deepEqual(new Set(), new Set())).toBe(true);
		});

		it('returns false for Sets with different values', () => {
			expect(deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
		});

		it('returns false for Sets with different sizes', () => {
			expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2]))).toBe(false);
		});

		it('returns false for Set vs plain object', () => {
			expect(deepEqual(new Set([1]), { size: 1 })).toBe(false);
		});
	});

	describe('Maps', () => {
		it('returns true for Maps with same key-value pairs', () => {
			expect(
				deepEqual(
					new Map([
						['a', 1],
						['b', 2],
					]),
					new Map([
						['a', 1],
						['b', 2],
					]),
				),
			).toBe(true);
		});

		it('returns true for empty Maps', () => {
			expect(deepEqual(new Map(), new Map())).toBe(true);
		});

		it('returns false for Maps with different values', () => {
			expect(deepEqual(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
		});

		it('returns false for Maps with different keys', () => {
			expect(deepEqual(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false);
		});

		it('returns false for Maps with different sizes', () => {
			expect(
				deepEqual(
					new Map([
						['a', 1],
						['b', 2],
					]),
					new Map([['a', 1]]),
				),
			).toBe(false);
		});

		it('returns false for Map vs plain object', () => {
			expect(deepEqual(new Map([['a', 1]]), { a: 1 })).toBe(false);
		});
	});

	describe('plain objects', () => {
		it('returns true for equal shallow objects', () => {
			expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
		});

		it('returns true for empty objects', () => {
			expect(deepEqual({}, {})).toBe(true);
		});

		it('returns false for objects with different values', () => {
			expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
		});

		it('returns false for objects with different keys', () => {
			expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
		});

		it('returns false for objects with different key counts', () => {
			expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
		});

		it('returns true for deeply nested equal objects', () => {
			expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(
				true,
			);
		});

		it('returns false for deeply nested unequal objects', () => {
			expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(
				false,
			);
		});
	});

	describe('circular references', () => {
		it('returns true for same self-referential object compared to itself', () => {
			const object: { self?: unknown } = {};
			object.self = object;
			expect(deepEqual(object, object)).toBe(true);
		});

		it('returns true for two distinct self-referential objects with same structure', () => {
			const a: { value: number; self?: unknown } = { value: 1 };
			a.self = a;
			const b: { value: number; self?: unknown } = { value: 1 };
			b.self = b;
			expect(deepEqual(a, b)).toBe(true);
		});

		it('returns false for two distinct self-referential objects with different structure', () => {
			const a: { value: number; self?: unknown } = { value: 1 };
			a.self = a;
			const b: { value: number; self?: unknown } = { value: 2 };
			b.self = b;
			expect(deepEqual(a, b)).toBe(false);
		});

		it('returns true for cross-referential objects with same structure', () => {
			const a: { value: number; ref?: unknown } = { value: 1 };
			const b: { value: number; ref?: unknown } = { value: 2 };
			a.ref = b;
			b.ref = a;
			const c: { value: number; ref?: unknown } = { value: 1 };
			const d: { value: number; ref?: unknown } = { value: 2 };
			c.ref = d;
			d.ref = c;
			expect(deepEqual(a, c)).toBe(true);
		});

		it('returns false for cross-referential objects with different structure', () => {
			const a: { value: number; ref?: unknown } = { value: 1 };
			const b: { value: number; ref?: unknown } = { value: 2 };
			a.ref = b;
			b.ref = a;
			const c: { value: number; ref?: unknown } = { value: 1 };
			const d: { value: number; ref?: unknown } = { value: 999 };
			c.ref = d;
			d.ref = c;
			expect(deepEqual(a, c)).toBe(false);
		});

		it('returns true for arrays with circular self-references and same elements', () => {
			const a: unknown[] = [1, 2];
			a.push(a);
			const b: unknown[] = [1, 2];
			b.push(b);
			expect(deepEqual(a, b)).toBe(true);
		});

		it('returns false for arrays with circular self-references and different elements', () => {
			const a: unknown[] = [1, 2];
			a.push(a);
			const b: unknown[] = [1, 3];
			b.push(b);
			expect(deepEqual(a, b)).toBe(false);
		});

		it('returns true for Maps with circular reference values', () => {
			const a = new Map<string, unknown>();
			a.set('self', a);
			const b = new Map<string, unknown>();
			b.set('self', b);
			expect(deepEqual(a, b)).toBe(true);
		});
	});

	describe('mixed structures', () => {
		it('returns true for equal complex nested structures', () => {
			const a = {
				nums: [1, 2, 3],
				date: new Date('2024-01-01'),
				nested: { value: 'hello' },
			};
			const b = {
				nums: [1, 2, 3],
				date: new Date('2024-01-01'),
				nested: { value: 'hello' },
			};
			expect(deepEqual(a, b)).toBe(true);
		});

		it('returns false when nested array differs', () => {
			const a = { nums: [1, 2, 3], label: 'x' };
			const b = { nums: [1, 2, 4], label: 'x' };
			expect(deepEqual(a, b)).toBe(false);
		});

		it('returns false for type mismatch at nested level', () => {
			expect(
				deepEqual({ a: new Date('2024-01-01') }, { a: { getTime: () => 1 } }),
			).toBe(false);
		});
	});
});
