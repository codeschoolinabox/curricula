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
 * - a FREEBIE line (blank / whitespace-only / comment-only / a code-bearing line
 *   inside an open block comment) → kept verbatim. The code-line/freebie split is
 *   `./code-lines.ts`, shared with `./diff-lines.ts` so the skeleton blanks
 *   exactly the lines the Check grades (the B1 honesty invariant — a single
 *   source, not two copies that can drift).
 * - a code line WITH a comment → its leading whitespace + the comment(s);
 * - a code line with no comment → an empty line.
 *
 * Port posture: mechanical conversion; preserve semantics (declining only the
 * legacy's `console.warn` + try/catch swallow, which guarded against a throw the
 * pure string ops cannot produce). This directory (`lenses/writeme/lib/**`) is
 * eslint-ignored per `eslint.config.mjs`.
 */

import computeCodeLineMask from './code-lines.js';

/**
 * @param solution - the original source (the snippet's `embodiment.source.code`).
 * @returns the comment-only skeleton; `out.split('\n').length === solution.split('\n').length`.
 */
function commentSkeleton(solution: string): string {
	const lines = solution.split('\n');
	const codeLineMask = computeCodeLineMask(lines);
	const skeleton: string[] = [];

	lines.forEach((line, index) => {
		if (!codeLineMask[index]) {
			// Freebie line (blank / whitespace / comment-only / inside an open
			// block comment) — kept verbatim as scaffolding.
			skeleton.push(line);
			return;
		}

		// Code line: keep its comment(s) if any (indentation preserved), else blank.
		const singleLineComment = line.match(/\/\/.*$/);
		const multiLineCommentStart = line.match(/\/\*.*$/);
		const multiLineCommentEnd = line.match(/^.*?\*\//);
		const multiLineCommentFull = line.match(/\/\*.*?\*\//);
		const commentParts: string[] = [];

		if (singleLineComment) {
			commentParts.push(singleLineComment[0]);
		}
		if (multiLineCommentFull) {
			// `multiLineCommentFull` already matched, so the /g variant is
			// non-null here; `|| []` mirrors the legacy's match-null idiom.
			commentParts.push(...(line.match(/\/\*.*?\*\//g) || []));
		} else if (multiLineCommentStart) {
			commentParts.push(multiLineCommentStart[0]);
		} else if (multiLineCommentEnd) {
			commentParts.push(multiLineCommentEnd[0]);
		}

		if (commentParts.length > 0) {
			// `/^\s*/` is anchored + zero-or-more, so it always matches (never null).
			const leadingWhitespace = line.match(/^\s*/)![0];
			skeleton.push(leadingWhitespace + commentParts.join(' '));
		} else {
			skeleton.push('');
		}
	});

	return skeleton.join('\n');
}

export default commentSkeleton;
