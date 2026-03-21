import { describe, expect, it } from 'vitest';

import deepFreezeInPlace from '../deep-freeze-in-place.js';

describe('deepFreezeInPlace', () => {
	describe('primitives', () => {
		it('returns null as-is', () => {
			expect(deepFreezeInPlace(null)).toBe(null);
		});

		it('returns numbers as-is', () => {
			expect(deepFreezeInPlace(42)).toBe(42);
		});

		it('returns strings as-is', () => {
			expect(deepFreezeInPlace('hello')).toBe('hello');
		});

		it('returns booleans as-is', () => {
			expect(deepFreezeInPlace(true)).toBe(true);
		});
	});

	describe('identity preservation', () => {
		it('returns the same reference for objects', () => {
			const object = { a: 1 };
			const result = deepFreezeInPlace(object);
			expect(result).toBe(object);
		});

		it('returns the same reference for arrays', () => {
			const array = [1, 2, 3];
			const result = deepFreezeInPlace(array);
			expect(result).toBe(array);
		});

		it('returns the same reference for nested objects', () => {
			const nested = { value: 1 };
			const object = { nested };
			deepFreezeInPlace(object);
			expect(object.nested).toBe(nested);
		});
	});

	describe('freezes the original', () => {
		it('freezes the top-level object', () => {
			const object = { a: 1 };
			deepFreezeInPlace(object);
			expect(Object.isFrozen(object)).toBe(true);
		});

		it('prevents property modification', () => {
			const object = deepFreezeInPlace({ value: 1 });
			expect(() => {
				(object as { value: number }).value = 2;
			}).toThrow();
		});

		it('prevents property addition', () => {
			const object = deepFreezeInPlace({ a: 1 });
			expect(() => {
				(object as Record<string, number>).b = 2;
			}).toThrow();
		});

		it('prevents property deletion', () => {
			const object = deepFreezeInPlace({ a: 1 });
			expect(() => {
				delete (object as { a?: number }).a;
			}).toThrow();
		});
	});

	describe('nested objects', () => {
		it('freezes nested objects in place', () => {
			const nested = { inner: 1 };
			const object = { nested };
			deepFreezeInPlace(object);
			expect(Object.isFrozen(object.nested)).toBe(true);
		});

		it('freezes deeply nested objects', () => {
			const object = { a: { b: { c: { d: 1 } } } };
			deepFreezeInPlace(object);
			expect(Object.isFrozen(object.a.b.c)).toBe(true);
		});

		it('prevents nested property modification', () => {
			const object = deepFreezeInPlace({ outer: { inner: 1 } });
			expect(() => {
				(object.outer as { inner: number }).inner = 2;
			}).toThrow();
		});
	});

	describe('arrays', () => {
		it('freezes arrays in place', () => {
			const array = [1, 2, 3];
			deepFreezeInPlace(array);
			expect(Object.isFrozen(array)).toBe(true);
		});

		it('freezes nested arrays', () => {
			const object = { items: [1, 2, 3] };
			deepFreezeInPlace(object);
			expect(Object.isFrozen(object.items)).toBe(true);
		});

		it('freezes objects inside arrays', () => {
			const array = [{ a: 1 }, { b: 2 }];
			deepFreezeInPlace(array);
			expect(Object.isFrozen(array[0])).toBe(true);
			expect(Object.isFrozen(array[1])).toBe(true);
		});

		it('prevents array push', () => {
			const array = deepFreezeInPlace([1, 2, 3]);
			expect(() => {
				array.push(4);
			}).toThrow();
		});
	});

	describe('already-frozen objects', () => {
		it('handles already-frozen objects without error', () => {
			const frozen = Object.freeze({ a: 1 });
			expect(() => deepFreezeInPlace(frozen)).not.toThrow();
		});

		it('handles deeply frozen objects without error', () => {
			const object = { nested: Object.freeze({ value: 1 }) };
			Object.freeze(object);
			expect(() => deepFreezeInPlace(object)).not.toThrow();
		});
	});
});
