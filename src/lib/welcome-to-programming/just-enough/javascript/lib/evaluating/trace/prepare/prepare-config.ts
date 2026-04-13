/**
 * @file Three-stage config pipeline: expand → fill → validate.
 *
 * Enforces the canonical stage order so shorthand always expands before
 * defaults are applied (recursive expand would otherwise see already-filled
 * objects and miss the shorthand signal).
 */

import expandShorthand from './expand-shorthand.js';
import fillDefaults from './fill-defaults.js';
import validateConfig from './validate-config.js';
import type { JSONSchema } from './types.js';

/**
 * Prepares user data by expanding shorthand, filling defaults, and validating.
 *
 * @param data - User-provided data (may be partial, may use shorthand)
 * @param schema - JSON Schema defining expected structure with defaults
 * @returns Fully-filled, validated data object
 * @throws Error when validation fails
 */
function prepareConfig(data: unknown, schema: JSONSchema): unknown {
	const expanded = expandShorthand(data, schema);
	const filled = fillDefaults(expanded, schema);
	return validateConfig(filled, schema);
}

export default prepareConfig;
