/**
 * Convert per-line raw leading-whitespace counts into relative nesting
 * levels (0, 1, 2, …). Faithful port of the legacy JSParsons
 * `normalizeIndents`.
 *
 * @remarks
 * - line 0 → level 0 (or `-1` if it has any leading whitespace — an
 *   IndentationError sentinel).
 * - same raw indent as the previous line → same level.
 * - more raw indent than the previous line → previous level + 1.
 * - less → the level of the nearest earlier line with the same raw indent,
 *   or `-1` if none (IndentationError).
 */
export default function normalizeIndents(
	rawIndents: ReadonlyArray<number>,
): number[] {
	const normalized: number[] = [];

	// The level of the nearest EARLIER line with the same raw indent, or -1.
	function matchIndent(index: number): number {
		for (let earlier = index - 1; earlier >= 0; earlier--) {
			if (rawIndents[earlier] === rawIndents[index]) {
				return normalized[earlier];
			}
		}
		return -1;
	}

	for (let index = 0; index < rawIndents.length; index++) {
		let level: number;
		if (index === 0) {
			level = rawIndents[index] === 0 ? 0 : -1;
		} else if (rawIndents[index] === rawIndents[index - 1]) {
			level = normalized[index - 1];
		} else if (rawIndents[index] > rawIndents[index - 1]) {
			level = normalized[index - 1] + 1;
		} else {
			level = matchIndent(index);
		}
		normalized[index] = level;
	}
	return normalized;
}
