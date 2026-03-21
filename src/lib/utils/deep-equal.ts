/**
 * @file Structural equality comparison for nested JavaScript values.
 *
 * Handles the same type universe as deepClone: primitives, Date, RegExp,
 * Array, Set, Map, and plain objects.
 */

import isPlainObject from './is-plain-object.js';

/**
 * Recursively compares two values for structural equality.
 *
 * Handles: primitives, null, Date, RegExp, Array, Set, Map, plain objects.
 * Functions are compared by reference only — two distinct function literals
 * with identical bodies are not equal.
 * Class instances not in the above list (custom constructors) return false.
 *
 * @remarks
 * Circular references are handled via pair tracking: when the same (a, b)
 * pair is encountered again during recursion, the cycle is treated as
 * structurally isomorphic (returns true), letting non-circular properties
 * determine the overall result. Tracking overhead is O(depth) per comparison.
 *
 * Set comparison is O(n²) — acceptable since Set values in config objects
 * are small.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if structurally equal, false otherwise
 *
 * @example
 * deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }) // true
 * deepEqual(new Date('2024-01-01'), new Date('2024-01-01')) // true
 * deepEqual([1, 2], [1, 2, 3]) // false
 *
 * @example
 * // Circular references
 * const a: { self?: unknown } = { }; a.self = a;
 * const b: { self?: unknown } = { }; b.self = b;
 * deepEqual(a, b) // true
 */
/* eslint-disable functional/immutable-data, functional/prefer-readonly-type -- seenA/seenB are mutable tracking stacks scoped to one call tree, same pattern as deepClone's visited WeakSet */
function deepEqual(
	a: unknown,
	b: unknown,
	seenA: object[] = [],
	seenB: object[] = [],
): boolean {
	// Step 1: Reference/primitive equality — handles same ref, null===null,
	// equal primitives, and self-referential objects compared to themselves
	if (a === b) return true;

	// Step 2: One is null (both can't be — a===b above would have returned)
	if (a === null || b === null) return false;

	// Step 3: typeof mismatch (e.g. function vs object, string vs number)
	if (typeof a !== typeof b) return false;

	// Step 4: Non-object types that reached here are unequal — includes
	// primitives and functions (typeof 'function' !== 'object')
	if (typeof a !== 'object') return false;

	// From here: both are non-null objects with the same typeof

	// Step 5: Date
	if (a instanceof Date || b instanceof Date) {
		return (
			a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
		);
	}

	// Step 6: RegExp
	if (a instanceof RegExp || b instanceof RegExp) {
		return (
			a instanceof RegExp &&
			b instanceof RegExp &&
			a.source === b.source &&
			a.flags === b.flags
		);
	}

	// From here: only container types that recurse — cycle tracking required

	// Step 7: Cycle detection — if we're already comparing this (a, b) pair
	// higher in the call stack, the structures are isomorphic at this point.
	// Return true so non-circular properties determine the overall result.
	// Steps 1–4 guarantee a is a non-null object; b needs a cast because
	// TypeScript narrows a via typeof but doesn't transitively narrow b
	const objectB = b as object;
	if (seenA.some((seen, index) => seen === a && seenB[index] === objectB))
		return true;
	seenA.push(a);
	seenB.push(objectB);

	// Steps 8–11: container comparisons — if-else chain with single pop point
	let result: boolean;

	// Step 8: Array
	if (Array.isArray(a) || Array.isArray(b)) {
		result =
			Array.isArray(a) &&
			Array.isArray(b) &&
			a.length === b.length &&
			a.every((item, index) => deepEqual(item, b[index], seenA, seenB));
	}
	// Step 9: Set (O(n²) — acceptable for config-sized values)
	else if (a instanceof Set || b instanceof Set) {
		result =
			a instanceof Set &&
			b instanceof Set &&
			a.size === b.size &&
			[...a].every((itemA) =>
				[...b].some((itemB) => deepEqual(itemA, itemB, seenA, seenB)),
			);
	}
	// Step 10: Map
	else if (a instanceof Map || b instanceof Map) {
		result =
			a instanceof Map &&
			b instanceof Map &&
			a.size === b.size &&
			[...a.entries()].every(
				([key, value]) =>
					b.has(key) && deepEqual(value, b.get(key), seenA, seenB),
			);
	}
	// Step 11: Plain objects
	else if (isPlainObject(a) && isPlainObject(b)) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		result =
			keysA.length === keysB.length &&
			keysA.every(
				(key) =>
					Object.prototype.hasOwnProperty.call(b, key) &&
					deepEqual(a[key], b[key], seenA, seenB),
			);
	}
	// Step 12: Unhandled object types (custom class instances, etc.)
	else {
		result = false;
	}

	seenA.pop();
	seenB.pop();
	return result;
}
/* eslint-enable functional/immutable-data, functional/prefer-readonly-type */

export default deepEqual;
