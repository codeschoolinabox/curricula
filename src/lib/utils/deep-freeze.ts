/**
 * @file Deep freeze utility for making objects and their nested properties immutable.
 *
 * Used at the tracer registry layer to freeze default event configurations,
 * preventing accidental mutation of shared defaults.
 *
 * Contract: Returns a frozen COPY of the input. The original is NOT modified.
 */

import deepClone from './deep-clone.js';

/**
 * Creates a deeply frozen copy of an object and all nested objects/arrays.
 *
 * Unlike Object.freeze which is shallow and mutates in-place, this:
 * 1. Creates a deep clone of the input
 * 2. Freezes the clone recursively
 * 3. Returns the frozen clone (original untouched)
 *
 * Primitives and null are returned as-is (nothing to freeze/clone).
 *
 * @param value - The value to deep freeze
 * @returns A deeply frozen copy of the input
 *
 * @example
 * const original = { nested: { value: 1 } };
 * const frozen = deepFreeze(original);
 *
 * original.nested.value = 2;  // Still works - original not frozen
 * frozen.nested.value = 3;    // TypeError in strict mode
 *
 * console.log(original === frozen);  // false - different references
 */
function deepFreeze<T>(value: T): Readonly<T> {
	// Primitives and null: nothing to freeze
	if (value === null || typeof value !== 'object') {
		return value;
	}

	// Clone first, then freeze the clone
	const cloned = deepClone(value);
	freezeRecursive(cloned);
	return cloned as Readonly<T>;
}

/**
 * Internal helper to freeze an object tree in place.
 * Only called on objects we own (just cloned), so mutation is acceptable.
 */
function freezeRecursive(value: unknown): void {
	if (value === null || typeof value !== 'object') {
		return;
	}

	Object.freeze(value);

	for (const propertyValue of Object.values(value)) {
		if (propertyValue !== null && typeof propertyValue === 'object') {
			freezeRecursive(propertyValue);
		}
	}
}

export default deepFreeze;
