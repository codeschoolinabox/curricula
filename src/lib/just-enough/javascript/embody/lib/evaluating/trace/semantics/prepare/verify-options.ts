/**
 * @file Semantic validation for tracer options.
 *
 * Called after JSON Schema validation and default-filling.
 * Enforces constraints that JSON Schema cannot express.
 *
 * Constraints:
 *   - range.start must be <= range.end when both are present
 *   - iterations must be a positive number when present
 *   - seconds must be a positive number when present
 */

/**
 * Validates cross-field constraints on tracer config.
 *
 * @param options - Fully-filled config (after schema validation + defaults)
 * @throws Error if range.start > range.end
 * @throws Error if iterations <= 0
 * @throws Error if seconds <= 0
 */
function verifyOptions(options: unknown): void {
	if (typeof options !== 'object' || options === null) return;
	const config = options as Record<string, unknown>;

	// Constraint 1: range.start ≤ range.end
	const { range } = config;
	if (typeof range === 'object' && range !== null) {
		const { start, end } = range as Record<string, unknown>;
		if (typeof start === 'number' && typeof end === 'number' && start > end) {
			throw new Error(
				`range.start (${String(start)}) must be <= range.end (${String(end)})`,
			);
		}
	}

	// Constraint 2: iterations must be positive when present
	const { iterations } = config;
	if (typeof iterations === 'number' && iterations <= 0) {
		throw new Error(
			`iterations (${String(iterations)}) must be a positive number`,
		);
	}

	// Constraint 3: seconds must be positive when present
	const { seconds } = config;
	if (typeof seconds === 'number' && seconds <= 0) {
		throw new Error(`seconds (${String(seconds)}) must be a positive number`);
	}
}

export default verifyOptions;
