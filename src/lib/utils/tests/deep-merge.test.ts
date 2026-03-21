/**
 * @file Unit tests for deep merge utility
 * Comprehensive test suite covering all merge scenarios and edge cases
 */

import { describe, expect, it } from 'vitest';

import deepMerge from '../deep-merge.js';

describe('deepMerge', () => {
	describe('Basic Functionality', () => {
		it('should return user value for primitives', () => {
			expect(deepMerge(1, 2)).toBe(2);
			expect(deepMerge('a', 'b')).toBe('b');
			expect(deepMerge(true, false)).toBe(false);
		});

		it('should return user value for null/undefined', () => {
			expect(deepMerge({ a: 1 }, null)).toBe(null);
			expect(deepMerge({ a: 1 })).toBe(undefined);
			expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
			expect(deepMerge(undefined, { a: 1 })).toEqual({ a: 1 });
		});

		it('should merge simple objects', () => {
			const base = { a: 1, b: 2 };
			const user = { b: 3, c: 4 };
			const result = deepMerge(base, user);

			expect(result).toEqual({ a: 1, b: 3, c: 4 });
		});

		it('should replace arrays completely', () => {
			const base = { arr: [1, 2, 3] };
			const user = { arr: [4, 5] };
			const result = deepMerge(base, user);

			expect(result.arr).toEqual([4, 5]);
		});

		it('should handle empty arrays', () => {
			const base = { arr: [1, 2, 3] };
			const user = { arr: [] };
			const result = deepMerge(base, user);

			expect(result.arr).toEqual([]);
		});
	});

	describe('Deep Nesting', () => {
		it('should merge deeply nested objects', () => {
			const base = {
				level1: {
					level2: {
						level3: {
							a: 1,
							b: 2,
						},
						other: 'keep',
					},
				},
			};

			const user = {
				level1: {
					level2: {
						level3: {
							a: 10, // override
						},
					},
				},
			};

			const result = deepMerge(base, user);

			expect(result.level1.level2.level3.a).toBe(10);
			expect(result.level1.level2.level3.b).toBe(2);
			expect(result.level1.level2.other).toBe('keep');
		});

		it('should handle arbitrary depth nesting', () => {
			const base = { a: { b: { c: { d: { e: { f: 1 } } } } } };
			const user = { a: { b: { c: { d: { e: { f: 2, g: 3 } } } } } };
			const result = deepMerge(base, user);

			expect(result.a.b.c.d.e.f).toBe(2);
			expect(result.a.b.c.d.e.g).toBe(3);
		});
	});

	describe('Type Mismatches', () => {
		it('should handle object to primitive conversion', () => {
			const base = { config: { enabled: true, level: 2 } };
			const user = { config: 'disabled' };
			const result = deepMerge(base, user);

			expect(result.config).toBe('disabled');
		});

		it('should handle primitive to object conversion', () => {
			const base = { config: 'basic' };
			const user = { config: { enabled: true, level: 2 } };
			const result = deepMerge(base, user);

			expect(result.config).toEqual({ enabled: true, level: 2 });
		});

		it('should handle array to object conversion', () => {
			const base = { config: [1, 2, 3] };
			const user = { config: { a: 1, b: 2 } };
			const result = deepMerge(base, user);

			expect(result.config).toEqual({ a: 1, b: 2 });
		});

		it('should handle object to array conversion', () => {
			const base = { config: { a: 1, b: 2 } };
			const user = { config: [1, 2, 3] };
			const result = deepMerge(base, user);

			expect(result.config).toEqual([1, 2, 3]);
		});
	});

	describe('Null/Undefined Edge Cases', () => {
		it('should preserve null values in user config', () => {
			const base = { a: { b: 1, c: 2 } };
			const user = { a: null };
			const result = deepMerge(base, user);

			expect(result.a).toBe(null);
		});

		it('should handle null in nested objects', () => {
			const base = { a: { b: { c: 1 } } };
			const user = { a: { b: null } };
			const result = deepMerge(base, user);

			expect(result.a.b).toBe(null);
		});

		it('should merge when base has null', () => {
			const base = { a: null };
			const user = { a: { b: 1 } };
			const result = deepMerge(base, user);

			expect(result.a.b).toBe(1);
		});
	});

	describe('Real-World Scenarios', () => {
		it('should handle realistic config merge', () => {
			const base = {
				variables: { read: false, write: true, filter: [] },
				functions: { calls: true, returns: false },
				errors: { throw: true, catch: false },
			};

			const user = {
				variables: { read: true, filter: ['x', 'y'] },
				functions: true, // boolean shorthand
				errors: { catch: true },
			};

			const result = deepMerge(base, user);

			expect(result.variables.read).toBe(true);
			expect(result.variables.write).toBe(true);
			expect(result.variables.filter).toEqual(['x', 'y']);
			expect(result.functions).toBe(true);
			expect(result.errors.throw).toBe(true);
			expect(result.errors.catch).toBe(true);
		});

		it('should preserve references where no changes occur', () => {
			const base = { unchanged: { deep: { value: 1 } }, changed: 2 };
			const user = { changed: 3 };
			const result = deepMerge(base, user);

			// unchanged object should be preserved (same reference)
			expect(result.unchanged).toBe(base.unchanged);
			expect(result.changed).toBe(3);
		});
	});

	describe('Edge Cases', () => {
		it('should handle circular references in input without infinite loop', () => {
			const base = { a: 1 };
			const user = { b: 2 };
			user.self = user; // circular reference

			// Should not hang or crash
			const result = deepMerge(base, user);
			expect(result.a).toBe(1);
			expect(result.b).toBe(2);
			expect(result.self).toBe(user);
		});

		it('should handle functions in objects', () => {
			const function1 = () => 'preset';
			const function2 = () => 'user';

			const base = { func: function1 };
			const user = { func: function2 };
			const result = deepMerge(base, user);

			expect(result.func).toBe(function2);
		});

		it('should handle Date objects', () => {
			const date1 = new Date('2023-01-01');
			const date2 = new Date('2024-01-01');

			const base = { date: date1 };
			const user = { date: date2 };
			const result = deepMerge(base, user);

			expect(result.date).toBe(date2);
		});

		it('should handle RegExp objects', () => {
			const regex1 = /preset/;
			const regex2 = /user/;

			const base = { pattern: regex1 };
			const user = { pattern: regex2 };
			const result = deepMerge(base, user);

			expect(result.pattern).toBe(regex2);
		});
	});
});
