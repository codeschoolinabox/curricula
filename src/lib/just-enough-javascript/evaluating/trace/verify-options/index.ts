/**
 * @file Semantic validation for tracer options.
 *
 * Called by @study-lenses/tracing after JSON Schema validation and default-filling.
 * Enforces constraints that JSON Schema cannot express.
 *
 * Constraint: range.start must be <= range.end when both are present.
 */

import { OptionsSemanticInvalidError } from '@study-lenses/tracing';

/**
 * Validates cross-field constraints on tracer options.
 *
 * @param options - Fully-filled options (after schema validation)
 * @throws {OptionsSemanticInvalidError} if range.start > range.end
 */
function verifyOptions(options: unknown): void {
	if (typeof options !== 'object' || options === null) return;

	const { range } = options as Record<string, unknown>;
	if (typeof range !== 'object' || range === null) return;

	const { start, end } = range as Record<string, unknown>;
	if (typeof start !== 'number' || typeof end !== 'number') return;

	if (start > end) {
		throw new OptionsSemanticInvalidError(
			`range.start (${String(start)}) must be <= range.end (${String(end)})`,
		);
	}
}

export default verifyOptions;
