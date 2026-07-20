/**
 * @file The single source of truth for classifying which solution lines are
 * GRADABLE CODE LINES (the lines the learner must reproduce) vs FREEBIE lines
 * (blank / whitespace-only / comment-only / sitting inside an open block
 * comment) that the comment skeleton seeds verbatim.
 *
 * Both `comment-skeleton.ts` (which blanks code lines and keeps freebies
 * verbatim) and `diff-lines.ts` (which grades code lines and treats freebies as
 * ungraded `comment`) MUST agree on this classification — otherwise the
 * reproduced-line tally would count lines the skeleton seeded for free, inflating
 * it before the learner types (the dishonesty the feedback design exists to
 * prevent). Extracting it here makes the agreement one source, not two copies
 * that can drift.
 *
 * The per-line rule: the `codeWithoutComments` 4-step strip, then the
 * cross-line `insideMultiLineComment` guard for code-bearing lines inside an
 * open block.
 */

/**
 * @param lines - the solution split on `\n`.
 * @returns one boolean per input line: `true` = a gradable code line; `false` =
 *   a freebie (blank / whitespace / comment-only / inside an open block comment).
 */
export default function computeCodeLineMask(
	lines: readonly string[],
): boolean[] {
	return lines.map(function classifyLine(line, index) {
		const codeWithoutComments = line
			// eslint-disable-next-line sonarjs/slow-regex -- runs on one newline-free source line; bounded local input, kept byte-identical to the ported classifier
			.replace(/\/\/.*$/, '')
			.replaceAll(/\/\*.*?\*\//g, '')
			.replace(/\/\*.*$/, '')
			.replace(/^.*?\*\//, '');
		if (codeWithoutComments.trim() === '') {
			// Blank / whitespace-only / comment-only line.
			return false;
		}

		// A code-bearing line sitting INSIDE an open block comment (and not
		// itself closing it) is comment body — the skeleton keeps it verbatim.
		const multiLineCommentEnd = /^.*?\*\//.exec(line);
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
