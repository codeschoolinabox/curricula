/**
 * @file Freeze utility — `freezeInPlace`.
 *
 * | Operation       | When to use                                         | Behavior                   |
 * | --------------- | --------------------------------------------------- | -------------------------- |
 * | `freezeInPlace` | Objects we just built (fresh results, new wrappers) | Freezes in place, same ref |
 *
 * Use when you just constructed the object (a spread result, a new config
 * wrapper) — there is no reason to clone something nobody else has a reference
 * to. For objects provided by the caller, use `cloneAndFreeze` instead.
 */

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
export default function freezeInPlace<T>(
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
