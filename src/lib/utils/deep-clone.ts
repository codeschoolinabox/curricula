/**
 * Deep clone utility for creating serializable copies of JavaScript values
 * Handles nested objects, arrays, and special types while avoiding circular references
 *
 * @param value - The value to clone
 * @param visited - WeakSet to track visited objects (for circular reference detection)
 * @returns A deep copy of the input value
 */
function deepClone<T>(value: T, visited = new WeakSet<object>()): T {
	// Null clones as-is
	if (value === null) {
		return value;
	}

	// Handle functions (store as string representation)
	if (typeof value === 'function') {
		const function_ = value as unknown as (
			...arguments_: readonly unknown[]
		) => unknown;
		return {
			type: 'function',
			name: function_.name || 'anonymous',
			stringified:
				function_.toString().slice(0, 100) +
				(function_.toString().length > 100 ? '...' : ''),
		} as T;
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
		return new Set([...value].map((item) => deepClone(item, visited))) as T;
	}

	// Handle Map — construct from mapped entries
	if (value instanceof Map) {
		return new Map(
			[...value.entries()].map(([k, v]) => [
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

export default deepClone;
