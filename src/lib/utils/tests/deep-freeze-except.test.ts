import { describe, expect, it } from 'vitest';

import deepFreezeExcept from '../deep-freeze-except.js';

describe('deepFreezeExcept', () => {
	describe('primitives', () => {
		it('returns null as-is', () => {
			expect(deepFreezeExcept(null)).toBe(null);
		});

		it('returns numbers as-is', () => {
			expect(deepFreezeExcept(42)).toBe(42);
		});
	});

	describe('empty object', () => {
		it('freezes it', () => {
			expect(Object.isFrozen(deepFreezeExcept({}))).toBe(true);
		});

		it('returns the same reference', () => {
			const object = {};
			expect(deepFreezeExcept(object)).toBe(object);
		});
	});

	describe('nested structures', () => {
		it('freezes a nested object', () => {
			const object = { inner: { value: 1 } };
			deepFreezeExcept(object);
			expect(Object.isFrozen(object.inner)).toBe(true);
		});

		it('freezes objects inside an array', () => {
			const array = [{ a: 1 }];
			deepFreezeExcept(array);
			expect(Object.isFrozen(array[0])).toBe(true);
		});

		it('freezes the array itself, not just its elements', () => {
			const array = [{ a: 1 }];
			deepFreezeExcept(array);
			expect(Object.isFrozen(array)).toBe(true);
		});

		it('preserves nested reference identity', () => {
			const inner = { value: 1 };
			const object = { inner };
			deepFreezeExcept(object);
			expect(object.inner).toBe(inner);
		});
	});

	describe('except set', () => {
		it('does not freeze an excepted top-level object', () => {
			const foreign = { mutable: 1 };
			deepFreezeExcept({ foreign }, new Set([foreign]));
			expect(Object.isFrozen(foreign)).toBe(false);
		});

		it('does not freeze an excepted object nested inside an array', () => {
			const foreign = { mutable: 1 };
			deepFreezeExcept({ items: [foreign] }, new Set([foreign]));
			expect(Object.isFrozen(foreign)).toBe(false);
		});

		it('leaves an excepted object’s children mutable', () => {
			const foreign = { child: { deep: 1 } };
			deepFreezeExcept({ foreign }, new Set([foreign]));
			expect(Object.isFrozen(foreign.child)).toBe(false);
		});

		it('does not freeze an excepted object reached via two paths', () => {
			const foreign = { mutable: 1 };
			deepFreezeExcept(
				{ a: foreign, b: { nested: foreign } },
				new Set([foreign]),
			);
			expect(Object.isFrozen(foreign)).toBe(false);
		});

		it('still freezes a non-excepted sibling in the same call', () => {
			const foreign = { mutable: 1 };
			const sibling = { frozen: 1 };
			deepFreezeExcept({ foreign, sibling }, new Set([foreign]));
			expect(Object.isFrozen(sibling)).toBe(true);
		});

		it('does not freeze the root when the root itself is excepted', () => {
			const foreign = { mutable: 1 };
			deepFreezeExcept(foreign, new Set([foreign]));
			expect(Object.isFrozen(foreign)).toBe(false);
		});

		it('returns the same reference when except is populated', () => {
			const foreign = { mutable: 1 };
			const object = { foreign };
			expect(deepFreezeExcept(object, new Set([foreign]))).toBe(object);
		});
	});

	describe('functions', () => {
		it('returns a function by identity, unfrozen', () => {
			const attached = () => 1;
			const object = { attached };
			deepFreezeExcept(object);
			expect(object.attached).toBe(attached);
		});
	});

	describe('cycles', () => {
		it('terminates on a self-referential object', () => {
			const object: { self?: unknown } = {};
			object.self = object;
			expect(() => deepFreezeExcept(object)).not.toThrow();
		});

		it('freezes every node of a two-object cycle', () => {
			const a: { b?: unknown } = {};
			const b: { a?: unknown } = { a };
			a.b = b;
			deepFreezeExcept(a);
			expect(Object.isFrozen(b)).toBe(true);
		});

		it('freezes a cycle reached through an array', () => {
			const array: unknown[] = [];
			array.push(array);
			deepFreezeExcept(array);
			expect(Object.isFrozen(array)).toBe(true);
		});
	});

	describe('already-frozen input', () => {
		it('handles an already-frozen object without error', () => {
			const frozen = Object.freeze({ a: 1 });
			expect(() => deepFreezeExcept(frozen)).not.toThrow();
		});
	});

	describe('regular expressions', () => {
		it('leaves a RegExp unfrozen', () => {
			const object = { pattern: /find me/g };
			deepFreezeExcept(object);
			expect(Object.isFrozen(object.pattern)).toBe(false);
		});

		it('a global regex still matches after the freeze — lastIndex writes', () => {
			const object = { pattern: /a/g };
			deepFreezeExcept(object);
			const firstMatch = object.pattern.test('aa');
			const secondMatch = object.pattern.test('aa');
			expect(firstMatch && secondMatch).toBe(true);
		});
	});

	describe('a long flat reference chain', () => {
		it('freezes fifty thousand chained objects without overflowing', () => {
			// the walk must not spend call-stack depth per object — a token
			// stream chains this shape through `next`
			type Link = { next?: Link };
			const head: Link = {};
			let tail = head;
			for (let index = 0; index < 50_000; index += 1) {
				const link: Link = {};
				tail.next = link;
				tail = link;
			}
			deepFreezeExcept(head);
			expect(Object.isFrozen(tail)).toBe(true);
		});
	});

	describe('prevents mutation', () => {
		it('throws when a frozen property is reassigned', () => {
			const object = deepFreezeExcept({ value: 1 });
			expect(() => {
				(object as { value: number }).value = 2;
			}).toThrow();
		});
	});
});
