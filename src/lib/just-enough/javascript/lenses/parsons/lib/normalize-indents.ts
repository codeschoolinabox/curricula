/**
 * Convert per-line raw leading-whitespace counts into relative nesting levels
 * (0, 1, 2, …). Faithful port of legacy `normalizeIndents`.
 *
 * @remarks
 * - line 0 → level 0 (or `-1` if it has any leading whitespace — an
 *   IndentationError sentinel).
 * - same raw indent as the previous line → same level.
 * - more raw indent than the previous line → previous level + 1.
 * - less → the level of the nearest earlier line with the same raw indent, or
 *   `-1` if none (IndentationError).
 */
export default function normalizeIndents(rawIndents: ReadonlyArray<number>): number[] {
	const normalized: number[] = [];
	const matchIndent = (index: number): number => {
		for (let i = index - 1; i >= 0; i--) {
			if (rawIndents[i] === rawIndents[index]) {
				return normalized[i];
			}
		}
		return -1;
	};
	for (let i = 0; i < rawIndents.length; i++) {
		let level: number;
		if (i === 0) {
			level = rawIndents[i] !== 0 ? -1 : 0;
		} else if (rawIndents[i] === rawIndents[i - 1]) {
			level = normalized[i - 1];
		} else if (rawIndents[i] > rawIndents[i - 1]) {
			level = normalized[i - 1] + 1;
		} else {
			level = matchIndent(i);
		}
		normalized[i] = level;
	}
	return normalized;
}
