/**
 * @file Shared, fallback-tolerant decoder for the `config` prop a
 * `<StudyLens>` React component receives.
 *
 * The plugin may pass `config` as a structured object (when the
 * hProperties pipeline round-trips objects cleanly), as a
 * JSON-stringified object (when JSON.stringify was used), or as an
 * arbitrary raw string (some lenses — e.g. a `parsons` with a single
 * `shuffleSeed` token — accept a bare string config). This decoder
 * normalizes all those surfaces so consumer components don't have
 * to branch on runtime shape.
 *
 * Resolution order:
 *   1. `null` / `undefined` → return `null`
 *   2. Non-null object → return as-is (caller may freeze independently)
 *   3. String that JSON-parses to an object → return the parsed object
 *   4. String that JSON-parses to a non-object (number, boolean, array,
 *      `null`) → return the ORIGINAL string raw (the value wasn't
 *      meant as structured config)
 *   5. String that does NOT JSON-parse → return the raw string
 *   6. Any other type (number, boolean, function, symbol, etc.) →
 *      return `null` (not a valid config shape from the plugin)
 */

function parseLensConfig(
	input: unknown,
): Readonly<Record<string, unknown>> | string | null {
	if (input === null || input === undefined) return null;
	if (typeof input === 'object') {
		return input as Readonly<Record<string, unknown>>;
	}
	if (typeof input !== 'string') return null;

	try {
		const parsed: unknown = JSON.parse(input);
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			!Array.isArray(parsed)
		) {
			return parsed as Readonly<Record<string, unknown>>;
		}
		// JSON-parsed but not a plain object (number/boolean/array/null)
		// — treat the original string as a bare-string config.
		return input;
	} catch {
		// Not JSON — treat as a bare-string config.
		return input;
	}
}

export default parseLensConfig;
