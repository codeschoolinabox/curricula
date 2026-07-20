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
 * immutable), so there is no `Map`/`Set` special-casing here. `RegExp`
 * instances are skipped like functions are: freezing one breaks its primary
 * operation (`.exec`/`.test` on a `/g` or `/y` regex must write `lastIndex`).
 */

/**
 * Deep-freezes `value` and everything it owns **in place**, skipping every
 * object in `except`.
 *
 * Walks arrays and own enumerable object properties (via `Object.values`)
 * with an explicit work-stack, not call-stack recursion — freeze depth would
 * otherwise be linear in the graph's longest reference chain (a token stream
 * chained through `next` links tens of thousands of objects) and overflow.
 * Cycles are handled — an already-visited object is skipped. The input
 * reference is returned directly, so identity is preserved
 * (`deepFreezeExcept(obj, s) === obj`).
 *
 * Skipped, never frozen and never walked into:
 * - any object in `except` — foreign objects the caller does not own;
 * - functions — returned by identity (they are `typeof 'function'`, not
 *   `'object'`);
 * - `RegExp` instances — engine-stateful: a frozen `/g`/`/y` regex throws on
 *   use because matching writes `lastIndex`.
 *
 * Never use on caller-provided data — this mutates (freezes) in place.
 *
 * @param value - The value to freeze in place
 * @param except - Objects to skip: never frozen, never walked into
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

	const remaining: object[] = [value as object];
	while (remaining.length > 0) {
		const current = remaining.pop();
		if (current === undefined || except.has(current) || visited.has(current)) {
			continue;
		}
		if (current instanceof RegExp) {
			continue;
		}

		visited.add(current);
		Object.freeze(current);

		const propertyValues: ReadonlyArray<unknown> = Object.values(current);
		for (const propertyValue of propertyValues) {
			if (propertyValue !== null && typeof propertyValue === 'object') {
				remaining.push(propertyValue);
			}
		}
	}

	return value as Readonly<T>;
}
