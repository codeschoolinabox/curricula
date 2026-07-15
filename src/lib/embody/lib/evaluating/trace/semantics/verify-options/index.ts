/**
 * @file Semantic validation for tracer options.
 *
 * Called after JSON Schema validation and default-filling.
 * Enforces constraints that JSON Schema cannot express.
 *
 * Constraint: range.start must be <= range.end when both are present.
 */

/**
 * Validates cross-field constraints on tracer options.
 *
 * @param options - Fully-filled options (after schema validation)
 * @throws Error if range.start > range.end
 */
export default function verifyOptions(options: unknown): void {
	if (typeof options !== 'object' || options === null) return;

	const { range } = options as Record<string, unknown>;
	if (typeof range !== 'object' || range === null) return;

	const { start, end } = range as Record<string, unknown>;
	if (typeof start !== 'number' || typeof end !== 'number') return;

	if (start > end) {
		throw new Error(
			`range.start (${String(start)}) must be <= range.end (${String(end)})`,
		);
	}
}
