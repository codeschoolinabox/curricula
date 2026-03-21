import { describe, expect, it } from 'vitest';

import deepFreeze from '../deep-freeze.js';

describe('deepFreeze', () => {
	describe('primitives', () => {
		it('returns null as-is', () => {
			expect(deepFreeze(null)).toBe(null);
		});

		it('returns undefined as-is', () => {
			expect(deepFreeze()).toBe(undefined);
		});

		it('returns numbers as-is', () => {
			expect(deepFreeze(42)).toBe(42);
		});

		it('returns strings as-is', () => {
			expect(deepFreeze('hello')).toBe('hello');
		});

		it('returns booleans as-is', () => {
			expect(deepFreeze(true)).toBe(true);
		});
	});

	describe('shallow objects', () => {
		it('freezes a simple object', () => {
			const object = { a: 1, b: 2 };
			const frozen = deepFreeze(object);
			expect(Object.isFrozen(frozen)).toBe(true);
		});

		it('returns a frozen copy (not same reference)', () => {
			const object = { a: 1 };
			const frozen = deepFreeze(object);
			expect(frozen).toEqual(object);
			expect(frozen).not.toBe(object);
		});

		it('does not freeze the original object', () => {
			const object = { a: 1 };
			deepFreeze(object);
			expect(Object.isFrozen(object)).toBe(false);
		});

		it('prevents property modification on frozen copy', () => {
			const frozen = deepFreeze({ value: 1 });
			expect(() => {
				(frozen as { value: number }).value = 2;
			}).toThrow();
		});

		it('prevents property addition on frozen copy', () => {
			const frozen = deepFreeze({ a: 1 });
			expect(() => {
				(frozen as Record<string, number>).b = 2;
			}).toThrow();
		});

		it('prevents property deletion on frozen copy', () => {
			const frozen = deepFreeze({ a: 1 });
			expect(() => {
				delete (frozen as { a?: number }).a;
			}).toThrow();
		});
	});

	describe('nested objects', () => {
		it('freezes nested objects in the copy', () => {
			const object = { outer: { inner: 1 } };
			const frozen = deepFreeze(object);
			expect(Object.isFrozen(frozen.outer)).toBe(true);
			expect(Object.isFrozen(object.outer)).toBe(false);
		});

		it('freezes deeply nested objects in the copy', () => {
			const object = { a: { b: { c: { d: 1 } } } };
			const frozen = deepFreeze(object);
			expect(Object.isFrozen(frozen.a.b.c)).toBe(true);
			expect(Object.isFrozen(object.a.b.c)).toBe(false);
		});

		it('prevents nested property modification on frozen copy', () => {
			const frozen = deepFreeze({ outer: { inner: 1 } });
			expect(() => {
				(frozen.outer as { inner: number }).inner = 2;
			}).toThrow();
		});
	});

	describe('arrays', () => {
		it('freezes arrays in the copy', () => {
			const array = [1, 2, 3];
			const frozen = deepFreeze(array);
			expect(Object.isFrozen(frozen)).toBe(true);
			expect(Object.isFrozen(array)).toBe(false);
		});

		it('freezes nested arrays in the copy', () => {
			const object = { items: [1, 2, 3] };
			const frozen = deepFreeze(object);
			expect(Object.isFrozen(frozen.items)).toBe(true);
			expect(Object.isFrozen(object.items)).toBe(false);
		});

		it('freezes objects inside arrays in the copy', () => {
			const array = [{ a: 1 }, { b: 2 }];
			const frozen = deepFreeze(array);
			expect(Object.isFrozen(frozen[0])).toBe(true);
			expect(Object.isFrozen(frozen[1])).toBe(true);
			expect(Object.isFrozen(array[0])).toBe(false);
			expect(Object.isFrozen(array[1])).toBe(false);
		});

		it('prevents array push on frozen copy', () => {
			const frozen = deepFreeze([1, 2, 3]);
			expect(() => {
				frozen.push(4);
			}).toThrow();
		});

		it('prevents array element modification on frozen copy', () => {
			const frozen = deepFreeze([1, 2, 3]);
			expect(() => {
				frozen[0] = 99;
			}).toThrow();
		});
	});

	describe('mixed structures', () => {
		it('freezes complex nested structure in the copy', () => {
			const config = {
				remove: ['a', 'b'],
				replace: { x: 'y' },
				nested: { deep: { value: 1 } },
			};
			const frozen = deepFreeze(config);

			expect(Object.isFrozen(frozen)).toBe(true);
			expect(Object.isFrozen(frozen.remove)).toBe(true);
			expect(Object.isFrozen(frozen.replace)).toBe(true);
			expect(Object.isFrozen(frozen.nested)).toBe(true);
			expect(Object.isFrozen(frozen.nested.deep)).toBe(true);

			// Original not frozen
			expect(Object.isFrozen(config)).toBe(false);
			expect(Object.isFrozen(config.remove)).toBe(false);
		});
	});

	describe('original object preservation', () => {
		it('allows mutation of original after freezing copy', () => {
			const original = { value: 1 };
			const frozen = deepFreeze(original);

			original.value = 2;

			expect(original.value).toBe(2);
			expect(frozen.value).toBe(1);
		});

		it('allows nested mutation of original after freezing copy', () => {
			const original = { nested: { value: 1 } };
			const frozen = deepFreeze(original);

			original.nested.value = 2;

			expect(original.nested.value).toBe(2);
			expect(frozen.nested.value).toBe(1);
		});
	});
});
