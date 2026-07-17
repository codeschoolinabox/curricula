/**
 * @file Freeze utility — `deepFreezeExcept`.
 *
 * | Operation          | When to use                                              | Behavior                          |
 * | ------------------ | -------------------------------------------------------- | --------------------------------- |
 * | `deepFreezeExcept` | A graph we own that reaches foreign objects we must skip | Freezes in place, except a skip-set |
 *
 * Like `deepFreezeInPlace` (a cycle-guarded `Object.values` walk), but it also
 * skips every object in an `except` set — never freezing it and never recursing
 * into it. Used to freeze an owned plain-object graph that reaches a few foreign
 * references it must not touch (a lens ref owned by another module, a
 * process-global singleton the walk borrowed). Frozen data is plain objects and
 * arrays only (DEV.md § 13 — `Object.freeze` cannot make a `Map`/`Set`
 * immutable), so there is no `Map`/`Set` special-casing here.
 */

/**
 * Deep-freezes `value` and everything it owns **in place**, skipping every
 * object in `except`.
 *
 * Recurses through arrays and own enumerable object properties (via
 * `Object.values`). Cycles are handled — an already-visited object is skipped.
 * The input reference is returned directly, so identity is preserved
 * (`deepFreezeExcept(obj, s) === obj`).
 *
 * Skipped, never frozen and never recursed into:
 * - any object in `except` — foreign objects the caller does not own;
 * - functions — returned by identity (they are `typeof 'function'`, not
 *   `'object'`).
 *
 * Never use on caller-provided data — this mutates (freezes) in place.
 *
 * @param value - The value to freeze in place
 * @param except - Objects to skip: never frozen, never recursed into
 * @param visited - Internal cycle guard; do not pass externally. A `WeakSet`
 *   rather than the precedent's `Set`: transient, object-identity-keyed, and
 *   never enumerated (DEV.md § 13)
 * @returns The same reference, now deeply frozen except for `except`
 */
export default function deepFreezeExcept<T>(
	value: T,
	except: ReadonlySet<object> = new Set(),
	visited: WeakSet<object> = new WeakSet(),
): Readonly<T> {
	if (value === null || typeof value !== 'object') {
		return value as Readonly<T>;
	}

	if (except.has(value as object)) {
		return value as Readonly<T>;
	}

	if (visited.has(value as object)) {
		return value as Readonly<T>;
	}

	visited.add(value as object);
	Object.freeze(value);

	for (const propertyValue of Object.values(value)) {
		if (propertyValue !== null && typeof propertyValue === 'object') {
			deepFreezeExcept(propertyValue, except, visited);
		}
	}

	return value as Readonly<T>;
}
