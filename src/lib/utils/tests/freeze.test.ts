/**
 * @file Unit tests for `freezeInPlace` and `cloneAndFreeze`.
 *
 * ZOMBIES ordered. Both functions share behavioral primitives but differ in
 * the ownership contract:
 *
 *   freezeInPlace(x)   → same reference, input is mutated (frozen in place)
 *   cloneAndFreeze(x)  → new reference, input is untouched
 *
 * The key triangulation tests are:
 *   - freezeInPlace returns THE SAME reference (`===`)
 *   - cloneAndFreeze returns a DIFFERENT reference (`!==`)
 *   - cloneAndFreeze does NOT freeze the original
 *   - freezeInPlace handles cycles (critical for ASTNode.parent back-refs)
 */

import { describe, expect, it } from 'vitest';

import cloneAndFreeze from '../clone-and-freeze.js';
import freezeInPlace from '../freeze-in-place.js';

// ============================================================================
// freezeInPlace
// ============================================================================

describe('freezeInPlace — Zero', () => {
	it('returns null as-is', () => {
		expect(freezeInPlace(null)).toBe(null);
	});

	it('returns undefined as-is', () => {
		expect(freezeInPlace(undefined)).toBe(undefined);
	});

	it('returns an empty object frozen in place', () => {
		const obj = {};
		const result = freezeInPlace(obj);
		expect(result).toBe(obj);
		expect(Object.isFrozen(obj)).toBe(true);
	});

	it('returns an empty array frozen in place', () => {
		const arr: unknown[] = [];
		const result = freezeInPlace(arr);
		expect(result).toBe(arr);
		expect(Object.isFrozen(arr)).toBe(true);
	});
});

describe('freezeInPlace — One (primitives and single-key objects)', () => {
	it('returns a number as-is', () => {
		expect(freezeInPlace(42)).toBe(42);
	});

	it('returns a string as-is', () => {
		expect(freezeInPlace('hello')).toBe('hello');
	});

	it('returns a boolean as-is', () => {
		expect(freezeInPlace(true)).toBe(true);
	});

	it('freezes a single-key object in place', () => {
		const obj = { a: 1 };
		freezeInPlace(obj);
		expect(Object.isFrozen(obj)).toBe(true);
	});

	it('returns the same reference (identity preservation)', () => {
		const obj = { a: 1 };
		expect(freezeInPlace(obj)).toBe(obj);
	});
});

describe('freezeInPlace — Many (nested structures)', () => {
	it('freezes nested objects in place', () => {
		const nested = { inner: 1 };
		const obj = { nested };
		freezeInPlace(obj);
		expect(Object.isFrozen(obj.nested)).toBe(true);
	});

	it('freezes deeply nested objects (4 levels)', () => {
		const obj = { a: { b: { c: { d: 1 } } } };
		freezeInPlace(obj);
		expect(Object.isFrozen(obj.a.b.c)).toBe(true);
	});

	it('freezes arrays in place', () => {
		const arr = [1, 2, 3];
		freezeInPlace(arr);
		expect(Object.isFrozen(arr)).toBe(true);
	});

	it('freezes nested arrays', () => {
		const obj = { items: [1, 2, 3] };
		freezeInPlace(obj);
		expect(Object.isFrozen(obj.items)).toBe(true);
	});

	it('freezes objects inside arrays', () => {
		const arr = [{ a: 1 }, { b: 2 }];
		freezeInPlace(arr);
		expect(Object.isFrozen(arr[0])).toBe(true);
		expect(Object.isFrozen(arr[1])).toBe(true);
	});

	it('preserves inner references (same nested ref as before)', () => {
		const nested = { value: 1 };
		const obj = { nested };
		freezeInPlace(obj);
		expect(obj.nested).toBe(nested);
	});
});

describe('freezeInPlace — Boundaries (circular refs + already-frozen)', () => {
	it('handles circular references without infinite recursion', () => {
		type Cyclic = { value: number; self?: Cyclic };
		const obj: Cyclic = { value: 1 };
		obj.self = obj;
		expect(() => freezeInPlace(obj)).not.toThrow();
		expect(Object.isFrozen(obj)).toBe(true);
	});

	it('handles parent back-references (ASTNode-style)', () => {
		type Node = { name: string; parent: Node | null; children: Node[] };
		const root: Node = { name: 'root', parent: null, children: [] };
		const child: Node = { name: 'child', parent: root, children: [] };
		root.children.push(child);
		expect(() => freezeInPlace(root)).not.toThrow();
		expect(Object.isFrozen(root)).toBe(true);
		expect(Object.isFrozen(child)).toBe(true);
	});

	it('handles an already-frozen object without error', () => {
		const frozen = Object.freeze({ a: 1 });
		expect(() => freezeInPlace(frozen)).not.toThrow();
	});

	it('handles a deeply-frozen object without error', () => {
		const obj = { nested: Object.freeze({ value: 1 }) };
		Object.freeze(obj);
		expect(() => freezeInPlace(obj)).not.toThrow();
	});
});

describe('freezeInPlace — Interfaces (immutability contract)', () => {
	it('prevents property modification', () => {
		const obj = freezeInPlace({ value: 1 });
		expect(() => {
			(obj as { value: number }).value = 2;
		}).toThrow();
	});

	it('prevents property addition', () => {
		const obj = freezeInPlace({ a: 1 });
		expect(() => {
			(obj as Record<string, number>).b = 2;
		}).toThrow();
	});

	it('prevents property deletion', () => {
		const obj = freezeInPlace({ a: 1 });
		expect(() => {
			delete (obj as { a?: number }).a;
		}).toThrow();
	});

	it('prevents nested property modification', () => {
		const obj = freezeInPlace({ outer: { inner: 1 } });
		expect(() => {
			(obj.outer as { inner: number }).inner = 2;
		}).toThrow();
	});

	it('prevents array push', () => {
		const arr = freezeInPlace([1, 2, 3]);
		expect(() => {
			// @ts-expect-error — testing that runtime rejects mutation on frozen readonly
			arr.push(4);
		}).toThrow();
	});
});

// ============================================================================
// cloneAndFreeze
// ============================================================================

describe('cloneAndFreeze — Zero', () => {
	it('returns null as-is', () => {
		expect(cloneAndFreeze(null)).toBe(null);
	});

	it('returns undefined as-is', () => {
		expect(cloneAndFreeze(undefined)).toBe(undefined);
	});

	it('returns a frozen empty object clone', () => {
		const obj = {};
		const result = cloneAndFreeze(obj);
		expect(Object.isFrozen(result)).toBe(true);
	});
});

describe('cloneAndFreeze — One (primitives and single-key)', () => {
	it('returns numbers as-is', () => {
		expect(cloneAndFreeze(42)).toBe(42);
	});

	it('returns strings as-is', () => {
		expect(cloneAndFreeze('hello')).toBe('hello');
	});

	it('returns booleans as-is', () => {
		expect(cloneAndFreeze(true)).toBe(true);
	});

	it('freezes a single-key object clone', () => {
		const obj = { a: 1 };
		const frozen = cloneAndFreeze(obj);
		expect(Object.isFrozen(frozen)).toBe(true);
	});
});

describe('cloneAndFreeze — Many (nested structures)', () => {
	it('freezes nested objects in the clone', () => {
		const obj = { outer: { inner: 1 } };
		const frozen = cloneAndFreeze(obj);
		expect(Object.isFrozen(frozen.outer)).toBe(true);
	});

	it('freezes deeply nested objects (4 levels) in the clone', () => {
		const obj = { a: { b: { c: { d: 1 } } } };
		const frozen = cloneAndFreeze(obj);
		expect(Object.isFrozen(frozen.a.b.c)).toBe(true);
	});

	it('freezes arrays in the clone', () => {
		const arr = [1, 2, 3];
		const frozen = cloneAndFreeze(arr);
		expect(Object.isFrozen(frozen)).toBe(true);
	});

	it('freezes objects inside arrays in the clone', () => {
		const arr = [{ a: 1 }, { b: 2 }];
		const frozen = cloneAndFreeze(arr);
		expect(Object.isFrozen(frozen[0])).toBe(true);
		expect(Object.isFrozen(frozen[1])).toBe(true);
	});
});

describe('cloneAndFreeze — Boundaries (original preservation)', () => {
	it('returns a different reference (not the same object)', () => {
		const obj = { a: 1 };
		const frozen = cloneAndFreeze(obj);
		expect(frozen).not.toBe(obj);
	});

	it('does NOT freeze the original top-level object', () => {
		const obj = { a: 1 };
		cloneAndFreeze(obj);
		expect(Object.isFrozen(obj)).toBe(false);
	});

	it('does NOT freeze the original nested objects', () => {
		const obj = { outer: { inner: 1 } };
		cloneAndFreeze(obj);
		expect(Object.isFrozen(obj.outer)).toBe(false);
	});

	it('allows mutation of original after cloning + freezing', () => {
		const original = { value: 1 };
		const frozen = cloneAndFreeze(original);
		original.value = 2;
		expect(original.value).toBe(2);
		expect(frozen.value).toBe(1);
	});

	it('allows nested mutation of original after cloning + freezing', () => {
		const original = { nested: { value: 1 } };
		const frozen = cloneAndFreeze(original);
		original.nested.value = 2;
		expect(original.nested.value).toBe(2);
		expect(frozen.nested.value).toBe(1);
	});

	it('clone is structurally equal to original at call time', () => {
		const obj = { a: 1, b: [2, 3], c: { d: 4 } };
		const frozen = cloneAndFreeze(obj);
		expect(frozen).toEqual(obj);
	});
});

describe('cloneAndFreeze — Interfaces (immutability contract)', () => {
	it('prevents property modification on the clone', () => {
		const frozen = cloneAndFreeze({ value: 1 });
		expect(() => {
			(frozen as { value: number }).value = 2;
		}).toThrow();
	});

	it('prevents property addition on the clone', () => {
		const frozen = cloneAndFreeze({ a: 1 });
		expect(() => {
			(frozen as Record<string, number>).b = 2;
		}).toThrow();
	});

	it('prevents property deletion on the clone', () => {
		const frozen = cloneAndFreeze({ a: 1 });
		expect(() => {
			delete (frozen as { a?: number }).a;
		}).toThrow();
	});

	it('prevents array push on the cloned array', () => {
		const frozen = cloneAndFreeze([1, 2, 3]);
		expect(() => {
			// @ts-expect-error — testing that runtime rejects mutation on frozen readonly
			frozen.push(4);
		}).toThrow();
	});

	it('prevents array element modification on the cloned array', () => {
		const frozen = cloneAndFreeze([1, 2, 3]);
		expect(() => {
			// @ts-expect-error — testing that runtime rejects mutation on frozen readonly
			frozen[0] = 99;
		}).toThrow();
	});
});

// ============================================================================
// Contract comparison — the ownership boundary
// ============================================================================

describe('freeze utilities — ownership contract comparison', () => {
	it('freezeInPlace returns SAME reference; cloneAndFreeze returns DIFFERENT', () => {
		const obj = { a: 1 };
		const inPlaceResult = freezeInPlace({ ...obj });
		expect(inPlaceResult).not.toBe(obj); // we passed a spread, so new ref
		const cloneResult = cloneAndFreeze(obj);
		expect(cloneResult).not.toBe(obj);
		// The real test: passing the same reference in
		const keep = { x: 1 };
		expect(freezeInPlace(keep)).toBe(keep);
		expect(cloneAndFreeze(keep)).not.toBe(keep);
	});

	it('freezeInPlace freezes the input; cloneAndFreeze does not', () => {
		const a = { x: 1 };
		freezeInPlace(a);
		expect(Object.isFrozen(a)).toBe(true);

		const b = { y: 1 };
		cloneAndFreeze(b);
		expect(Object.isFrozen(b)).toBe(false);
	});
});
