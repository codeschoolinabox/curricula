/**
 * @file Convenience wrapper that pipes all configuration functions.
 *
 * Enforces correct order: expand → fill → validate.
 */

import expandShorthand from './expand-shorthand.js';
import fillDefaults from './fill-defaults.js';
import type { JSONSchema } from './types.js';
import validateConfig from './validate-config.js';

/**
 * Prepares user data by expanding shorthand, filling defaults, and validating.
 *
 * @param data - User-provided data (may be partial, may use shorthand)
 * @param schema - JSON Schema defining expected structure with defaults
 * @returns Fully-filled, validated data object
 * @throws OptionsInvalidError when validation fails
 */
function prepareConfig(data: unknown, schema: JSONSchema): unknown {
  const expanded = expandShorthand(data, schema);
  const filled = fillDefaults(expanded, schema);
  return validateConfig(filled, schema);
}

export default prepareConfig;
