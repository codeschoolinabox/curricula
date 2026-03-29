/**
 * @file Deep freeze utility that mutates the input in place.
 *
 * Contrast with `deep-freeze.ts` which clones first (for objects we don't own).
 * Use this only for objects we just built — where we own every reference.
 *
 * Contract: Freezes the input and all nested objects IN PLACE. Returns the same reference.
 * The original IS modified (frozen). No copy is made.
 */

/**
 * Freezes the object and all nested objects/arrays in place.
 *
 * Unlike `deepFreeze`, this does NOT clone first — the input reference is returned directly.
 * This preserves reference identity: `deepFreezeInPlace(obj) === obj` is always true.
 *
 * Use for objects we just built (e.g. `{ meta, options }` from `prepareConfig`, result
 * wrappers). Never use on objects provided by the caller — use `deepFreeze` instead.
 *
 * Primitives and null are returned as-is (nothing to freeze).
 *
 * @param value - The value to freeze in place
 * @returns The same reference, now frozen
 *
 * @example
 * const obj = { nested: { value: 1 } };
 * const frozen = deepFreezeInPlace(obj);
 *
 * console.log(frozen === obj);       // true — same reference
 * frozen.nested.value = 2;           // TypeError in strict mode
 */
function deepFreezeInPlace<T>(value: T): Readonly<T> {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	Object.freeze(value);

	for (const propertyValue of Object.values(value)) {
		if (propertyValue !== null && typeof propertyValue === 'object') {
			deepFreezeInPlace(propertyValue);
		}
	}

	return value as Readonly<T>;
}

export default deepFreezeInPlace;
