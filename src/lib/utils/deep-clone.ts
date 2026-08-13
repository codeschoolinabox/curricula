/**
 * Deep clone utility. Handles nested objects, arrays, and special types
 * while detecting circular references.
 *
 * Functions (including async functions and class constructors) are returned
 * as-is — the same function identity, no copy. All other non-primitive types
 * (Date, RegExp, Array, Set, Map, plain objects) are deeply cloned into
 * new references.
 *
 * @param value - The value to clone
 * @param visited - Internal cycle guard; do not pass externally
 * @returns A deep copy of the input value. Functions are the same
 *   identity; all other structures are new references.
 */
export default function deepClone<T>(
	value: T,
	visited = new WeakSet<object>(),
): T {
	if (value === null) {
		return value;
	}

	if (typeof value === 'function') {
		return value;
	}

	// Primitives clone as-is
	if (typeof value !== 'object') {
		return value;
	}

	// Handle circular references
	if (visited.has(value)) {
		return '[Circular Reference]' as T;
	}
	visited.add(value);

	// Handle Date objects
	if (value instanceof Date) {
		return new Date(value) as T;
	}

	// Handle RegExp objects
	if (value instanceof RegExp) {
		return new RegExp(value.source, value.flags) as T;
	}

	// Handle Arrays
	if (Array.isArray(value)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Generic utility pattern
		return value.map((item) => deepClone(item, visited)) as T;
	}

	// Handle Set — construct from mapped spread
	if (value instanceof Set) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Generic utility pattern
		return new Set(
			Array.from(value).map((item) => deepClone(item, visited)),
		) as T;
	}

	// Handle Map — construct from mapped entries
	if (value instanceof Map) {
		return new Map(
			Array.from(value.entries()).map(([k, v]) => [
				deepClone(k, visited),
				deepClone(v, visited),
			]),
		) as T;
	}

	// Handle plain objects — construct via Object.fromEntries
	const valueObject = value as Record<string, unknown>;
	const stringEntries = Object.keys(valueObject)
		.filter((key) => Object.prototype.hasOwnProperty.call(valueObject, key))
		.map((key) => [key, deepClone(valueObject[key], visited)] as const);

	const symbolEntries = Object.getOwnPropertySymbols(value as object).map(
		(sym) =>
			[
				Symbol.keyFor(sym) ?? sym.toString(),
				deepClone((value as Record<symbol, unknown>)[sym], visited),
			] as const,
	);

	return Object.fromEntries([...stringEntries, ...symbolEntries]) as T;
}
