/**
 * @file Validates config data against JSON Schema.
 *
 * Returns data on success (enables piping), throws on failure. Collects all
 * violations, not just the first. Throws plain `Error` — JEJ has no shared
 * `errors/` directory yet; a later sprint may promote this to a dedicated
 * error class for `instanceof` discrimination.
 */

import Ajv from './ajv.js';
import type { JSONSchema } from './types.js';

/**
 * Validates data against JSON Schema.
 *
 * @param data - Data to validate
 * @param schema - JSON Schema to validate against
 * @returns Same data reference on success (enables piping)
 * @throws Error when validation fails — message lists every violation joined with "; "
 */
export default function validateConfig(
	data: unknown,
	schema: JSONSchema,
): unknown {
	// Handle null/undefined as empty object
	const input = data === null || data === undefined ? {} : data;

	const validate = ajv.compile(schema);
	const valid = validate(input);

	if (!valid && validate.errors) {
		const errors = validate.errors as readonly AjvError[];
		const messages = errors.map((error) => formatError(error));
		const combined = messages.join('; ');
		throw new Error(`Options validation failed: ${combined}`);
	}

	return input;
}

type AjvError = {
	readonly instancePath?: string;
	readonly dataPath?: string;
	readonly message?: string;
	readonly params?: {
		readonly missingProperty?: string;
		readonly allowedValues?: readonly unknown[];
	};
};

/**
 * Extracts property path from Ajv error.
 * Handles both instancePath (Ajv 8+) and dataPath (older Ajv).
 */
function getErrorPath(error: AjvError | undefined): string {
	if (!error) return '';
	const rawPath = error.instancePath ?? error.dataPath ?? '';
	const missingProperty = error.params?.missingProperty ?? '';
	const cleanPath = rawPath.replace(/^[./]/, '');
	return cleanPath || missingProperty || '';
}

/**
 * Formats an Ajv error into a human-readable message.
 */
function formatError(error: AjvError): string {
	const path = getErrorPath(error) || 'config';
	const message = error.message ?? 'validation failed';

	if (error.params?.allowedValues) {
		const allowed = error.params.allowedValues;
		return `${path} must be one of: ${(allowed as readonly string[]).join(', ')}`;
	}

	return `${path} ${message}`;
}

/** Configured Ajv instance for validation */
const ajv = new Ajv({
	allErrors: true,
	strict: false,
});
