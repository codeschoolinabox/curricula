/**
 * @file Expands boolean shorthand to full object structure.
 *
 * Detects when user passes a boolean where schema expects an object with
 * all-boolean properties, and expands it to the full structure.
 *
 * @example
 * // Input: { allowedCharClasses: false }
 * // Output: { allowedCharClasses: { lowercase: false, uppercase: false, ... } }
 */

import type { JSONSchema } from './types.js';

/**
 * Expands boolean shorthand in options to full object structure.
 *
 * Recursively walks the schema tree. When the user provides a boolean
 * where the schema expects an object, expands it:
 * - Boolean schema properties → set to the user's boolean value
 * - Object schema properties → recurse (expand their sub-properties)
 * - Other types (arrays, strings) → omit (fillDefaults handles them)
 *
 * Also recurses into user-provided objects to expand nested shorthand.
 *
 * @param options - User-provided options (may use boolean shorthand)
 * @param schema - JSON Schema defining expected structure
 * @returns New options object with shorthand expanded (never mutates input)
 */
function expandShorthand(options: unknown, schema: JSONSchema): unknown {
	// Handle null/undefined gracefully
	if (options === null || options === undefined) {
		return {};
	}

	// Boolean where schema expects object → expand recursively
	if (typeof options === 'boolean' && isObjectSchema(schema)) {
		return expandBooleanRecursive(options, schema);
	}

	// Must be an object to process further
	if (typeof options !== 'object') {
		return options;
	}

	// Recurse into each property the user provided
	const schemaProperties = schema.properties ?? {};
	const entries = Object.entries(options as Record<string, unknown>);

	const expandedEntries = entries.map(function expandEntry([key, value]) {
		const fieldSchema = schemaProperties[key];
		if (!fieldSchema) return [key, value];

		if (typeof value === 'boolean' && isObjectSchema(fieldSchema)) {
			return [key, expandBooleanRecursive(value, fieldSchema)];
		}

		if (
			typeof value === 'object' &&
			value !== null &&
			isObjectSchema(fieldSchema)
		) {
			return [key, expandShorthand(value, fieldSchema)];
		}

		return [key, value];
	});

	return Object.fromEntries(expandedEntries);
}

function isObjectSchema(schema: JSONSchema | undefined): boolean {
	return schema?.type === 'object' && schema.properties !== undefined;
}

/**
 * Expands a boolean into an object matching the schema structure.
 * Boolean properties → set to the value. Object properties → recurse.
 * Other types (arrays, strings) → omitted (fillDefaults adds them).
 */
function expandBooleanRecursive(
	value: boolean,
	schema: JSONSchema,
): Record<string, unknown> {
	const properties = schema.properties ?? {};
	const entries: [string, unknown][] = [];

	for (const [key, propSchema] of Object.entries(properties)) {
		if (propSchema.type === 'boolean') {
			entries.push([key, value]);
		} else if (propSchema.type === 'object' && propSchema.properties) {
			entries.push([key, expandBooleanRecursive(value, propSchema)]);
		}
		// Other types (array, string, etc.) are skipped — fillDefaults handles them
	}

	return Object.fromEntries(entries);
}

export default expandShorthand;
