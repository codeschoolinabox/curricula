/**
 * @file Shared label-transform pipeline for directory names.
 *
 * Consumed by:
 * - The sidebar generator (to rewrite category labels for exercise-set
 *   directories).
 * - The remark plugin's grouped embed phase (to derive headings from
 *   subdirectory names).
 *
 * The pipeline is purely string-based — no filesystem access, no
 * configuration beyond the prefix list.
 *
 * Steps:
 *   1. Strip the first matching exercise-set prefix (e.g. `sl-`).
 *   2. Strip a leading `NN-` / `NNN-` numeric ordering, if present.
 *   3. Split remaining on `-`, Title-Case each segment, join with space.
 *   4. If the result is empty (basename was exactly `"sl-"` or
 *      `"sl-01-"`), return the original name unchanged and warn once.
 */

/**
 * Applies prefix-strip → numeric-strip → kebab-to-Title-Case.
 *
 * @param dirName - The raw directory basename (e.g. `"sl-01-while-loops"`).
 * @param exerciseSetPrefixes - Prefixes to strip (e.g. `["sl-"]`).
 * @returns The prettified string (e.g. `"While Loops"`), or the
 *   original `dirName` unchanged if no prefix matches or the transform
 *   would produce an empty string.
 */
function prettifyDirName(
	dirName: string,
	exerciseSetPrefixes: ReadonlyArray<string>,
): string {
	for (const prefix of exerciseSetPrefixes) {
		if (prefix === '') continue;
		if (!dirName.startsWith(prefix)) continue;
		const afterPrefix = dirName.slice(prefix.length);
		const afterNumeric = afterPrefix.replace(/^\d+-/, '');
		if (afterNumeric === '') {
			console.warn(
				`study-lenses: empty residue after stripping prefix "${prefix}" from "${dirName}"; falling back to original`,
			);
			return dirName;
		}
		return toTitleCase(afterNumeric);
	}
	// No prefix matched — still strip numeric + title-case if the name
	// has a leading NN- pattern (e.g. `01-intro` → "Intro").
	const afterNumeric = dirName.replace(/^\d+-/, '');
	if (afterNumeric !== '' && afterNumeric !== dirName) {
		return toTitleCase(afterNumeric);
	}
	return toTitleCase(dirName);
}

/**
 * Converts a kebab-case string to Title Case:
 * `while-loops` → `"While Loops"`.
 */
function toTitleCase(s: string): string {
	return s
		.split('-')
		.map((seg) => (seg === '' ? seg : seg[0].toUpperCase() + seg.slice(1)))
		.join(' ');
}

export default prettifyDirName;
export { toTitleCase };
