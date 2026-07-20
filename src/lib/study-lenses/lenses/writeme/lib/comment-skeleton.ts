/**
 * @file The comment-skeleton generator. Produces the write editor's optional
 * starting template: the solution with executable code stripped but comments,
 * blank lines, and — critically — the LINE COUNT preserved (each source line
 * maps to exactly one skeleton line), so the wrapper's per-line diff stays
 * index-aligned against the solution.
 *
 * Per-line rule:
 * - a FREEBIE line (blank / whitespace-only / comment-only / a code-bearing line
 *   inside an open block comment) → kept verbatim. The code-line/freebie split is
 *   `./code-lines.ts`, shared with `./diff-lines.ts` so the skeleton blanks
 *   exactly the lines the diff grades (the B1 honesty invariant — a single
 *   source, not two copies that can drift).
 * - a code line WITH a comment → its leading whitespace + the comment(s);
 * - a code line with no comment → an empty line.
 */

import computeCodeLineMask from './code-lines.js';

/**
 * @param solution - the original source (`embodiment.facts.source.value`).
 * @returns the comment-only skeleton; `out.split('\n').length === solution.split('\n').length`.
 */
export default function commentSkeleton(solution: string): string {
	const lines = solution.split('\n');
	const codeLineMask = computeCodeLineMask(lines);

	const skeleton = lines.map(function skeletonLine(line, index) {
		if (!codeLineMask[index]) {
			// Freebie line (blank / whitespace / comment-only / inside an open
			// block comment) — kept verbatim as scaffolding.
			return line;
		}

		// Code line: keep its comment(s) if any (indentation preserved), else blank.
		// eslint-disable-next-line sonarjs/slow-regex -- runs on one newline-free source line; bounded local input, kept byte-identical to the ported generator
		const singleLineComment = /\/\/.*$/.exec(line);
		const multiLineCommentStart = /\/\*.*$/.exec(line);
		const multiLineCommentEnd = /^.*?\*\//.exec(line);
		const multiLineCommentFull = /\/\*.*?\*\//.exec(line);
		const commentParts: string[] = [];

		if (singleLineComment) {
			commentParts.push(singleLineComment[0]);
		}
		if (multiLineCommentFull) {
			// `multiLineCommentFull` already matched, so the /g variant is
			// non-null here; `|| []` keeps the match-null idiom explicit.
			commentParts.push(...(line.match(/\/\*.*?\*\//g) || []));
		} else if (multiLineCommentStart) {
			commentParts.push(multiLineCommentStart[0]);
		} else if (multiLineCommentEnd) {
			commentParts.push(multiLineCommentEnd[0]);
		}

		if (commentParts.length > 0) {
			// `/^\s*/` is anchored + zero-or-more, so it always matches; the
			// `?? ''` arm exists only to satisfy the no-non-null-assertion rule.
			const leadingWhitespace = /^\s*/.exec(line)?.[0] ?? '';
			return leadingWhitespace + commentParts.join(' ');
		}
		return '';
	});

	return skeleton.join('\n');
}
