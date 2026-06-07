/**
 * @file PORTED helper — the single source of truth for classifying which
 * solution lines are GRADABLE CODE LINES (the lines the learner must reproduce)
 * vs FREEBIE lines (blank / whitespace-only / comment-only / sitting inside an
 * open block comment) that the comment skeleton seeds verbatim.
 *
 * Both `comment-skeleton.ts` (which blanks code lines and keeps freebies
 * verbatim) and `diff-lines.ts` (which grades code lines and treats freebies as
 * ungraded `comment`) MUST agree on this classification — otherwise the Check
 * would count lines the skeleton seeded for free, inflating the score before the
 * learner types (the dishonesty the feedback redesign exists to prevent).
 * Extracting it here makes the agreement one source, not two copies that can
 * drift (the drift was a real bug, caught at AR-4 of the diff-lines increment).
 *
 * The per-line rule is the legacy `WritemeLens.jsx`'s own classification (lines
 * 212-246): the `codeWithoutComments` 4-step strip, then the cross-line
 * `insideMultiLineComment` guard for code-bearing lines inside an open block.
 *
 * This directory (`lenses/writeme/lib/**`) is eslint-ignored per `eslint.config.mjs`.
 */

/**
 * @param lines - the solution split on `\n`.
 * @returns one boolean per input line: `true` = a gradable code line; `false` =
 *   a freebie (blank / whitespace / comment-only / inside an open block comment).
 */
function computeCodeLineMask(lines: readonly string[]): boolean[] {
	return lines.map((line, index) => {
		const codeWithoutComments = line
			.replace(/\/\/.*$/, '')
			.replace(/\/\*.*?\*\//g, '')
			.replace(/\/\*.*$/, '')
			.replace(/^.*?\*\//, '');
		if (codeWithoutComments.trim() === '') {
			// Blank / whitespace-only / comment-only line.
			return false;
		}

		// A code-bearing line sitting INSIDE an open block comment (and not
		// itself closing it) is comment body — the skeleton keeps it verbatim.
		const multiLineCommentEnd = line.match(/^.*?\*\//);
		const beforeThisLine = lines.slice(0, index).join('\n');
		const openComments = (beforeThisLine.match(/\/\*/g) || []).length;
		const closeComments = (beforeThisLine.match(/\*\//g) || []).length;
		const insideMultiLineComment = openComments > closeComments;
		if (insideMultiLineComment && !multiLineCommentEnd) {
			return false;
		}

		return true;
	});
}

export default computeCodeLineMask;
