/**
 * @file Predicate for identifying plain JavaScript objects.
 *
 * A plain object is one created via object literal syntax `{}` or
 * `Object.create(Object.prototype)`. Class instances (Date, RegExp, Set, Map,
 * custom classes) and `Object.create(null)` objects are not plain objects.
 *
 * Used internally by deepMerge and deepEqual to distinguish plain objects
 * from other object types before attempting recursive structural operations.
 */

/**
 * Returns true if `thing` is a plain JavaScript object.
 *
 * @param thing - Value to test
 * @returns true for `{}` and `Object.create(Object.prototype)`; false for
 *   class instances, arrays, null, primitives, and null-prototype objects
 *
 * @example
 * isPlainObject({})             // true
 * isPlainObject({ a: 1 })       // true
 * isPlainObject([])             // false
 * isPlainObject(new Date())     // false
 * isPlainObject(null)           // false
 * isPlainObject(Object.create(null)) // false
 */
function isPlainObject(thing: unknown): thing is Record<string, unknown> {
	if (typeof thing !== 'object') return false;
	if (thing === null) return false;
	if (Array.isArray(thing)) return false;

	const proto = Object.getPrototypeOf(thing);
	return proto === Object.prototype;
}

export default isPlainObject;
