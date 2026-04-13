/**
 * @file Expands boolean shorthand to full object structure (recursive).
 *
 * Detects when a user passes a boolean where the schema expects an object and
 * expands it to the full nested structure with every boolean leaf set to that
 * value. Recurses into sub-objects so `{ statements: true }` expands every
 * leaf boolean inside `statements.while`, `statements.for`, `statements.doWhile`,
 * etc.
 *
 * Also recurses into user-provided object values to apply shorthand at every
 * nesting level (e.g. `{ statements: { while: true } }` expands `while` to its
 * full leaf structure without touching other `statements` keys).
 *
 * Non-boolean, non-object properties (e.g. filter arrays) are omitted when
 * expanding a boolean shorthand — `fill-defaults.ts` applies their schema
 * defaults in the next pipeline stage.
 *
 * @example
 * // Input: { statements: true }
 * // Output: {
 * //   statements: {
 * //     variables: { initialize: true, available: true },
 * //     conditionals: { test: true, branch: true },
 * //     while: { test: true, iteration: true },
 * //     for: { setup: true, test: true, increment: true, iteration: true },
 * //     ...
 * //   }
 * // }
 */

import type { JSONSchema } from './types.js';

/**
 * Expands boolean shorthand in options to a full object structure.
 *
 * @param options - User-provided options (may use boolean shorthand at any nesting level)
 * @param schema - JSON Schema defining the expected structure
 * @returns New options object with shorthand expanded (never mutates input)
 */
function expandShorthand(options: unknown, schema: JSONSchema): unknown {
	if (options === null || options === undefined) return {};
	if (typeof options !== 'object') return options;

	const schemaProperties = schema.properties ?? {};
	const entries = Object.entries(options as Record<string, unknown>);

	const expandedEntries = entries.map(([key, value]) => {
		const fieldSchema = schemaProperties[key];
		if (!fieldSchema) return [key, value];
		return [key, expandValue(value, fieldSchema)];
	});

	return Object.fromEntries(expandedEntries);
}

/**
 * Expands a single value against its field schema.
 * Delegates based on value type and schema type.
 */
function expandValue(value: unknown, fieldSchema: JSONSchema): unknown {
	// Boolean shorthand where schema expects an object: expand recursively
	if (typeof value === 'boolean' && fieldSchema.type === 'object') {
		return expandBooleanRecursive(value, fieldSchema);
	}

	// Nested object: recurse so inner shorthands also get expanded
	if (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		fieldSchema.type === 'object'
	) {
		return expandShorthand(value, fieldSchema);
	}

	// Scalar, array, or schema mismatch: pass through — fillDefaults handles missing
	return value;
}

/**
 * Expands a boolean to a full nested structure, recursing into sub-objects.
 * Every boolean-leaf in the schema gets `value`; sub-objects recurse with the
 * same value. Non-boolean, non-object properties (e.g. filter arrays) are
 * omitted — fillDefaults applies their schema defaults in the next stage.
 */
function expandBooleanRecursive(
	value: boolean,
	schema: JSONSchema,
): Record<string, unknown> {
	const properties = schema.properties ?? {};
	const result: Record<string, unknown> = {};

	for (const [key, propSchema] of Object.entries(properties)) {
		if (propSchema.type === 'boolean') {
			result[key] = value;
		} else if (propSchema.type === 'object') {
			result[key] = expandBooleanRecursive(value, propSchema);
		}
		// Arrays and other scalar types: omit — fillDefaults uses schema defaults
	}

	return result;
}

export default expandShorthand;
