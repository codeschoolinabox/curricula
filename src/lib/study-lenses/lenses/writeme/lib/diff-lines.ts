/**
 * @file Per-line diff between the learner's code and the solution. The single
 * engine behind the `diff` PAIR visual (which lines to highlight) plus an
 * honest reproduced-line tally (`matched` / `total`, computed but not currently
 * surfaced — a numeric Check was cut; see `../types.ts` § DiffResult).
 *
 * Compares line-by-line, BY INDEX, each line TRIMMED (content, not whitespace):
 * the comment skeleton preserves the solution's line count, so index alignment
 * holds while the learner fills lines in place. Each solution line resolves to a
 * `LineStatus`:
 * - `comment` — a freebie line (no executable code, or inside an open block
 *   comment). Excluded from the code-line tally, never highlighted (the skeleton
 *   seeds these verbatim). The code-line/freebie split is `./code-lines.ts`,
 *   shared with `./comment-skeleton.ts` so the tally counts exactly the lines the
 *   skeleton blanked (the B1 honesty invariant).
 * - `match` — a code line whose trimmed learner text equals the solution's.
 * - `diff` — a code line whose trimmed learner text differs AND is non-empty
 *   (typed-but-wrong). The only status the diff visual highlights.
 * - `empty` — a code line the learner left blank / has not reached. Counts toward
 *   the code-line tally but is left neutral in the diff visual ("not done", not
 *   "wrong").
 *
 * `total` counts CODE lines only; `matched` counts `match` lines. Counting
 * skeleton-seeded freebie lines would inflate the tally before the learner typed
 * anything — the dishonesty this lens's feedback design avoids.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { DiffResult, LineStatus } from '../types.js';

import computeCodeLineMask from './code-lines.js';

/**
 * @param learner - the learner's typed code.
 * @param solution - the original source (`embodiment.facts.source.value`).
 * @returns frozen per-line verdicts + code-line tallies (`perLine.length ===
 *   solution.split('\n').length`).
 */
export default function diffLines(
	learner: string,
	solution: string,
): DiffResult {
	const solutionLines = solution.split('\n');
	const learnerLines = learner.split('\n');
	// Shared code-line classifier — grades exactly the lines the comment skeleton
	// blanked, keeping the reproduced-line tally honest (see ./code-lines.ts).
	const codeLineMask = computeCodeLineMask(solutionLines);

	const perLine = solutionLines.map(
		function gradeLine(solutionLine, index): LineStatus {
			if (!codeLineMask[index]) {
				// Comment / blank / inside-block solution line — ungraded freebie.
				return 'comment';
			}

			// Index-aligned learner line (or '' when the learner is shorter).
			const learnerLine = learnerLines[index] ?? '';
			if (learnerLine.trim() === '') {
				return 'empty';
			}
			return learnerLine.trim() === solutionLine.trim() ? 'match' : 'diff';
		},
	);

	const matched = perLine.filter((status) => status === 'match').length;
	const total = perLine.filter((status) => status !== 'comment').length;

	return freezeInPlace({ perLine, matched, total });
}
