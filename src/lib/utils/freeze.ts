/**
 * @file Freeze utilities — `freezeInPlace` and `cloneAndFreeze`.
 *
 * Two operations, one ownership rule:
 *
 * | Operation        | When to use                                         | Behavior                      |
 * | ---------------- | --------------------------------------------------- | ----------------------------- |
 * | `freezeInPlace`  | Objects we just built (fresh results, new wrappers) | Freezes in place, same ref    |
 * | `cloneAndFreeze` | Objects we don't own (caller-provided, external)    | Clones first, returns new ref |
 *
 * The distinction is about **ownership**. If you just constructed the object
 * (a spread result, a new config wrapper), freeze it in place — there's no
 * reason to clone something nobody else has a reference to. If the object came
 * from outside (a parameter, imported data), clone-then-freeze to avoid
 * mutating the caller's data.
 */

import deepClone from './deep-clone.js';

/**
 * Freezes the object and all nested objects/arrays **in place**.
 *
 * Does NOT clone — the input reference is returned directly. This preserves
 * reference identity: `freezeInPlace(obj) === obj` is always true.
 *
 * Use for objects we just built. Never use on objects provided by the caller
 * — use `cloneAndFreeze` instead.
 *
 * Primitives and null are returned as-is (nothing to freeze).
 *
 * Circular references are handled safely — already-visited objects are
 * skipped, so objects with back-references (e.g. ASTNode `.parent`) won't
 * cause infinite recursion.
 *
 * @param value - The value to freeze in place
 * @param visited - Internal cycle guard; do not pass externally
 * @returns The same reference, now frozen
 *
 * @example
 * const obj = { nested: { value: 1 } };
 * const frozen = freezeInPlace(obj);
 * console.log(frozen === obj);       // true — same reference
 * frozen.nested.value = 2;           // TypeError in strict mode
 */
function freezeInPlace<T>(
	value: T,
	visited = new Set<object>(),
): Readonly<T> {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	if (visited.has(value as object)) {
		return value as Readonly<T>;
	}

	visited.add(value as object);
	Object.freeze(value);

	for (const propertyValue of Object.values(value)) {
		if (propertyValue !== null && typeof propertyValue === 'object') {
			freezeInPlace(propertyValue, visited);
		}
	}

	return value as Readonly<T>;
}

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
function cloneAndFreeze<T>(value: T): Readonly<T> {
	// Primitives and null: nothing to freeze
	if (value === null || typeof value !== 'object') {
		return value;
	}

	// Clone first, then freeze the clone in place
	const cloned = deepClone(value);
	freezeInPlace(cloned as object);
	return cloned as Readonly<T>;
}

export { freezeInPlace, cloneAndFreeze };
