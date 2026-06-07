/**
 * @file PORTED — the comment-skeleton generator, de-duplicated from the legacy
 * `WritemeLens.jsx`'s two byte-identical inline template generators (the seed
 * effect, legacy lines 206-257, and `resetExercise`, legacy lines 546-597).
 *
 * Produces the write editor's optional starting template: the solution with
 * executable code stripped but comments, blank lines, and — critically — the
 * LINE COUNT preserved (each source line maps to exactly one skeleton line), so
 * the wrapper's per-line diff stays index-aligned against the solution.
 *
 * Per-line rule (legacy semantics, preserved):
 * - a blank / whitespace-only / comment-only line → kept verbatim;
 * - a code-bearing line INSIDE an open block comment (not closing it) → kept
 *   verbatim;
 * - a code-bearing line WITH a comment → its leading whitespace + the comment(s);
 * - a code-bearing line with no comment → an empty line.
 *
 * Port posture: mechanical conversion; preserve semantics (declining only the
 * legacy's `console.warn` + try/catch swallow, which guarded against a throw
 * that the pure string ops cannot produce). This directory
 * (`lenses/writeme/lib/**`) is eslint-ignored per `eslint.config.mjs`.
 */

/**
 * @param solution - the original source (the snippet's `embodiment.source.code`).
 * @returns the comment-only skeleton; `out.split('\n').length === solution.split('\n').length`.
 */
function commentSkeleton(solution: string): string {
	const lines = solution.split('\n');
	const skeleton: string[] = [];

	lines.forEach((line, index) => {
		const singleLineComment = line.match(/\/\/.*$/);
		const multiLineCommentStart = line.match(/\/\*.*$/);
		const multiLineCommentEnd = line.match(/^.*?\*\//);
		const multiLineCommentFull = line.match(/\/\*.*?\*\//);

		const codeWithoutComments = line
			.replace(/\/\/.*$/, '')
			.replace(/\/\*.*?\*\//g, '')
			.replace(/\/\*.*$/, '')
			.replace(/^.*?\*\//, '');

		if (codeWithoutComments.trim() === '') {
			// Blank / whitespace-only / comment-only line — kept verbatim.
			skeleton.push(line);
		} else {
			const commentParts: string[] = [];

			if (singleLineComment) {
				commentParts.push(singleLineComment[0]);
			}

			if (multiLineCommentFull) {
				// `multiLineCommentFull` already matched, so the /g variant is
				// non-null here; `|| []` mirrors the legacy's match-null idiom
				// (also used for the open/close counts below).
				commentParts.push(...(line.match(/\/\*.*?\*\//g) || []));
			} else if (multiLineCommentStart) {
				commentParts.push(multiLineCommentStart[0]);
			} else if (multiLineCommentEnd) {
				commentParts.push(multiLineCommentEnd[0]);
			}

			// Cross-line block-comment state: count unclosed `/*` in all
			// lines BEFORE this one (legacy semantics).
			const beforeThisLine = lines.slice(0, index).join('\n');
			const openComments = (beforeThisLine.match(/\/\*/g) || []).length;
			const closeComments = (beforeThisLine.match(/\*\//g) || []).length;
			const insideMultiLineComment = openComments > closeComments;

			if (insideMultiLineComment && !multiLineCommentEnd) {
				// Code-bearing line inside an open block comment — kept verbatim.
				skeleton.push(line);
			} else if (commentParts.length > 0) {
				// Code line with a comment — keep indentation + the comment(s).
				// `/^\s*/` is anchored + zero-or-more, so it always matches (never null).
				const leadingWhitespace = line.match(/^\s*/)![0];
				skeleton.push(leadingWhitespace + commentParts.join(' '));
			} else {
				// Code line with no comment — blanked.
				skeleton.push('');
			}
		}
	});

	return skeleton.join('\n');
}

export default commentSkeleton;
