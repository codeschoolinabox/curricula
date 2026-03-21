import { describe, expect, it } from 'vitest';

import deepClone from '../deep-clone.js';

const CIRCULAR_REF_MARKER = '[Circular Reference]';
const TEST_DATE_STRING = '2024-01-15';

function namedFunction() {
	return 1;
}

function longBodyFunction() {
	const alpha = 1;
	const bravo = 2;
	const charlie = 3;
	const delta = 4;
	const echo = 5;
	return alpha + bravo + charlie + delta + echo;
}

describe('deepClone', () => {
	describe('primitives', () => {
		it('returns null as-is', () => {
			expect(deepClone(null)).toBe(null);
		});

		it('returns undefined as-is', () => {
			expect(deepClone()).toBeUndefined();
		});

		it('returns numbers as-is', () => {
			expect(deepClone(42)).toBe(42);
		});

		it('returns strings as-is', () => {
			expect(deepClone('hello')).toBe('hello');
		});

		it('returns booleans as-is', () => {
			expect(deepClone(true)).toBe(true);
		});
	});

	describe('functions', () => {
		it('converts named function to serializable representation', () => {
			const result = deepClone(namedFunction) as { type: string; name: string };
			expect(result.type).toBe('function');
			expect(result.name).toBe('namedFunction');
		});

		it('converts anonymous function to serializable representation', () => {
			const result = deepClone(() => 1) as { type: string; name: string };
			expect(result.type).toBe('function');
		});

		it('truncates long function bodies to 100 chars with ellipsis', () => {
			const result = deepClone(longBodyFunction) as { stringified: string };
			expect(result.stringified.length).toBeLessThanOrEqual(103);
			expect(result.stringified.endsWith('...')).toBe(true);
		});
	});

	describe('circular references', () => {
		it('detects direct circular reference in object', () => {
			const object: { self?: unknown } = {};
			object.self = object;
			const result = deepClone(object) as { self: string };
			expect(result.self).toBe(CIRCULAR_REF_MARKER);
		});

		it('detects circular reference in nested object', () => {
			const object: { nested: { parent?: unknown } } = { nested: {} };
			object.nested.parent = object;
			const result = deepClone(object) as { nested: { parent: string } };
			expect(result.nested.parent).toBe(CIRCULAR_REF_MARKER);
		});

		it('detects circular reference in array', () => {
			const array: unknown[] = [1, 2];
			array.push(array);
			const result = deepClone(array);
			expect(result[2]).toBe(CIRCULAR_REF_MARKER);
		});
	});

	describe('Date objects', () => {
		it('clones Date to new instance', () => {
			const original = new Date(TEST_DATE_STRING);
			const cloned = deepClone(original);
			expect(cloned instanceof Date).toBe(true);
		});

		it('cloned Date has same time value', () => {
			const original = new Date(TEST_DATE_STRING);
			const cloned = deepClone(original);
			expect(cloned.getTime()).toBe(original.getTime());
		});

		it('cloned Date is not same reference', () => {
			const original = new Date(TEST_DATE_STRING);
			const cloned = deepClone(original);
			expect(cloned).not.toBe(original);
		});
	});

	describe('RegExp objects', () => {
		it('clones RegExp to new instance', () => {
			const original = /test/gi;
			const cloned = deepClone(original);
			expect(cloned instanceof RegExp).toBe(true);
		});

		it('cloned RegExp preserves source and flags', () => {
			const original = /test/gi;
			const cloned = deepClone(original);
			expect(cloned.source).toBe('test');
			expect(cloned.flags).toBe('gi');
		});

		it('cloned RegExp is not same reference', () => {
			const original = /test/gi;
			const cloned = deepClone(original);
			expect(cloned).not.toBe(original);
		});
	});

	describe('arrays', () => {
		it('clones array to new instance', () => {
			const original = [1, 2, 3];
			const cloned = deepClone(original);
			expect(cloned).toEqual([1, 2, 3]);
			expect(cloned).not.toBe(original);
		});

		it('clones nested arrays deeply', () => {
			const original = [
				[1, 2],
				[3, 4],
			];
			const cloned = deepClone(original);
			expect(cloned[0]).not.toBe(original[0]);
		});

		it('clones objects inside arrays', () => {
			const original = [{ a: 1 }, { b: 2 }];
			const cloned = deepClone(original);
			expect(cloned[0]).not.toBe(original[0]);
			expect(cloned[0]).toEqual({ a: 1 });
		});
	});

	describe('Sets', () => {
		it('clones Set to new instance', () => {
			const original = new Set([1, 2, 3]);
			const cloned = deepClone(original);
			expect(cloned instanceof Set).toBe(true);
		});

		it('cloned Set contains cloned items', () => {
			const original = new Set([1, 2, 3]);
			const cloned = deepClone(original);
			expect([...cloned]).toEqual([1, 2, 3]);
		});

		it('cloned Set is not same reference', () => {
			const original = new Set([1, 2, 3]);
			const cloned = deepClone(original);
			expect(cloned).not.toBe(original);
		});
	});

	describe('Maps', () => {
		it('clones Map to new instance', () => {
			const original = new Map([['a', 1]]);
			const cloned = deepClone(original);
			expect(cloned instanceof Map).toBe(true);
		});

		it('clones both keys and values', () => {
			const original = new Map([
				['a', 1],
				['b', 2],
			]);
			const cloned = deepClone(original);
			expect(cloned.get('a')).toBe(1);
			expect(cloned.get('b')).toBe(2);
		});

		it('cloned Map is not same reference', () => {
			const original = new Map([['a', 1]]);
			const cloned = deepClone(original);
			expect(cloned).not.toBe(original);
		});
	});

	describe('plain objects', () => {
		it('clones shallow object', () => {
			const original = { a: 1, b: 2 };
			const cloned = deepClone(original);
			expect(cloned).toEqual({ a: 1, b: 2 });
		});

		it('clones nested objects deeply', () => {
			const original = { outer: { inner: 1 } };
			const cloned = deepClone(original);
			expect(cloned.outer).not.toBe(original.outer);
			expect(cloned.outer.inner).toBe(1);
		});

		it('cloned object is not same reference', () => {
			const original = { a: 1 };
			const cloned = deepClone(original);
			expect(cloned).not.toBe(original);
		});
	});

	describe('symbol properties', () => {
		it('copies symbol properties to string keys', () => {
			const sym = Symbol('test');
			const original = { [sym]: 'value' };
			const cloned = deepClone(original) as Record<string, unknown>;
			expect(cloned['Symbol(test)']).toBe('value');
		});
	});

	describe('mixed structures', () => {
		it('clones complex nested structure', () => {
			const original = {
				primitives: { num: 42, str: 'hello', bool: true },
				array: [1, { nested: true }],
				date: new Date(TEST_DATE_STRING),
				regex: /pattern/g,
			};
			const cloned = deepClone(original);

			expect(cloned.primitives).toEqual({ num: 42, str: 'hello', bool: true });
			expect(cloned.array[1]).not.toBe(original.array[1]);
			expect(cloned.date).not.toBe(original.date);
			expect(cloned.regex).not.toBe(original.regex);
		});
	});
});
