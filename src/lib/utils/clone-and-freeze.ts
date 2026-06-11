/**
 * @file Freeze utility — `cloneAndFreeze`.
 *
 * | Operation        | When to use                                      | Behavior                      |
 * | ---------------- | ------------------------------------------------ | ----------------------------- |
 * | `cloneAndFreeze` | Objects we don't own (caller-provided, external) | Clones first, returns new ref |
 *
 * Use when the object came from outside (a parameter, imported data) —
 * clone-then-freeze avoids mutating the caller's data. For objects you just
 * constructed, use `freezeInPlace` instead.
 */

import deepClone from './deep-clone.js';
import freezeInPlace from './freeze-in-place.js';

/**
 * Creates a deeply frozen **clone** of an object and all nested objects/arrays.
 *
 * Unlike `freezeInPlace`, this:
 * 1. Creates a deep clone of the input (via `deepClone`)
 * 2. Freezes the clone recursively
 * 3. Returns the frozen clone (original is never modified)
 *
 * Use for objects we don't own (caller-provided, external data). The original
 * reference is untouched — safe to pass through even if the caller continues
 * to mutate their copy.
 *
 * Primitives and null are returned as-is (nothing to freeze or clone).
 *
 * Function-valued properties are passed through by reference — the clone
 * contains the same callable function. Closure state inside those functions
 * is not frozen.
 *
 * @param value - The value to deep clone and freeze
 * @returns A deeply frozen copy of the input (new reference)
 *
 * @example
 * const original = { nested: { value: 1 } };
 * const frozen = cloneAndFreeze(original);
 *
 * original.nested.value = 2;  // Works — original is not frozen
 * frozen.nested.value = 3;    // TypeError — clone is frozen
 * console.log(original === frozen);  // false — different references
 */
export default function cloneAndFreeze<T>(value: T): Readonly<T> {
	// Primitives and null: nothing to freeze
	if (value === null || typeof value !== 'object') {
		return value;
	}

	// Clone first, then freeze the clone in place
	const cloned = deepClone(value);
	freezeInPlace(cloned as object);
	return cloned as Readonly<T>;
}
