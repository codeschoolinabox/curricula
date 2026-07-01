/**
 * @file The quiz lens's code-surface answer transform — turns the ranges the
 * learner staged in the read-only editor (click-token: a single slot;
 * select-in-code: a toggle-set) into a graded `Verdict`. Builds the
 * `LearnerResponse` INSIDE the narrowed `item.mode` arm (never hoisted — the
 * never-`malformed` invariant; see `../DOCS.md` § the per-arm construction note)
 * and delegates to `lib/quizzing`'s total `grade`. Pure: no React, no CodeMirror.
 * (inc 6b adds the click-token arm; 6c adds the select-in-code arm.)
 */

import grade from '../../../lib/quizzing/grade.js';
import type { QuizItem, Verdict } from '../../../lib/quizzing/types.js';
import type { PendingSelection } from '../types.js';

/**
 * Grades the ranges the learner staged for a code-surface item. Builds the
 * response **inside** the narrowed `item.mode` arm — so the response mode always
 * equals the item mode and `grade`'s mode-mismatch arm is unreachable in normal
 * play (the never-`malformed` invariant). Delegates to `lib/quizzing`'s total
 * `grade`.
 *
 * @param item - The active code-surface quiz item (its `mode` is the discriminant).
 * @param ranges - The staged ranges (click-token: a single slot; select-in-code:
 *   the toggle-set).
 * @returns The `Verdict` (`correct` / `incorrect`; `malformed` only on a wiring bug).
 */
function gradeRanges(item: QuizItem, ranges: PendingSelection): Verdict {
	if (item.mode === 'click-token') {
		return grade(item, { mode: 'click-token', clickedRanges: ranges });
	}
	// The `select-in-code` arm lands in 6c (and gains a `_never` exhaustiveness
	// check then). Until then this path is unreachable: build-quiz admits only mcq +
	// click-token, and an mcq active tab is anchor phase, so only click-token items
	// reach gradeRanges. Delegating to `grade` (total) as a select-in-code response
	// rather than throwing keeps the boundary safe, and this becomes the correct arm
	// the moment 6c admits select-in-code.
	return grade(item, { mode: 'select-in-code', selectedRanges: ranges });
}

export default gradeRanges;
