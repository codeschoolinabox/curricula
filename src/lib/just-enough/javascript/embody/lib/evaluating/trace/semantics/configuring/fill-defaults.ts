/**
 * @file Fills missing fields with defaults from JSON Schema.
 *
 * Uses Ajv's `useDefaults` feature to apply defaults during validation.
 * Also coerces types when safe (string to number, string to boolean) and
 * removes unknown properties silently.
 */

import Ajv from './ajv.js';
import type { JSONSchema } from './types.js';

/** Configured Ajv instance for default filling */
const ajv = new Ajv({
	useDefaults: true,
	coerceTypes: true,
	removeAdditional: true,
	allErrors: true,
	strict: false,
	// WHY: options.schema.json declares $schema draft-2020-12 but AJV 8
	// default only supports draft-07. The schema uses no 2020-12 features.
	validateSchema: false,
});

/**
 * Fills missing fields with defaults from schema.
 *
 * @param options - User-provided options (may be partial)
 * @param schema - JSON Schema with default values
 * @returns New options object with all defaults filled (never mutates input)
 */
function fillDefaults(options: unknown, schema: JSONSchema): unknown {
	// Handle null/undefined by starting with empty object
	const input = options === null || options === undefined ? {} : options;

	// Deep clone to ensure immutability
	const clone = structuredClone(input);

	// Compile schema and apply defaults
	const validate = ajv.compile(schema);
	validate(clone);

	return clone;
}

export default fillDefaults;
