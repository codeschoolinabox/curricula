/**
 * @file The quiz lens's code-surface answer transform — turns the ranges the
 * learner staged in the read-only editor (click-token: a single slot;
 * select-in-code: a toggle-set) into a graded `Verdict`. Builds the
 * `LearnerResponse` INSIDE the narrowed `item.mode` arm (never hoisted — the
 * never-`malformed` invariant; see `../DOCS.md` § the per-arm construction note)
 * and delegates to `lib/quizzing`'s total `grade`. Pure: no React, no CodeMirror.
 * The param is the code-surface union, so the mode dispatch is exhaustive (a
 * `const _never: never` closes the chain).
 */

import grade from '../../../lib/quizzing/grade.js';
import type {
	CodeSurfaceQuizItem,
	SelectInCodeQuizItem,
	Verdict,
} from '../../../lib/quizzing/types.js';
import type { PendingSelection } from '../types.js';

/**
 * Grades the ranges the learner staged for a code-surface item. Builds the
 * response **inside** the narrowed `item.mode` arm — so the response mode always
 * equals the item mode and `grade`'s mode-mismatch arm is unreachable in normal
 * play (the never-`malformed` invariant). Delegates to `lib/quizzing`'s total
 * `grade`. The item type is the code-surface union (`confirm` reaches this only
 * behind the `isCodeSurface` guard), so the dispatch is exhaustive.
 *
 * @param item - The active code-surface quiz item (its `mode` is the discriminant).
 * @param ranges - The staged ranges (click-token: a single slot; select-in-code:
 *   the toggle-set).
 * @returns The `Verdict` (`correct` / `incorrect`; `malformed` only on a wiring bug).
 */
function gradeRanges(
	item: CodeSurfaceQuizItem | SelectInCodeQuizItem,
	ranges: PendingSelection,
): Verdict {
	// click-token / click-line share the clicked-ranges response shape. click-line
	// is covered for EXHAUSTIVENESS only — no generator emits it and build-quiz does
	// not admit it, so this arm is forward-compatible + unreached today.
	if (item.mode === 'click-token' || item.mode === 'click-line') {
		return grade(item, { mode: item.mode, clickedRanges: ranges });
	}
	if (item.mode === 'select-in-code') {
		return grade(item, { mode: 'select-in-code', selectedRanges: ranges });
	}
	// Exhaustive over the code-surface modes — assert on the discriminant (`.mode`),
	// which narrows to `never` (asserting on the object doesn't reduce a union member
	// whose `mode` is itself a union). Return a safe `malformed` sentinel — NOT the
	// raw discriminant — mirroring `grade.ts`, so an impossible runtime mode fails
	// safely rather than leaking a string into the Verdict slot.
	const _never: never = item.mode;
	return {
		status: 'malformed',
		reason: `unsupported code-surface mode: ${String(_never)}`,
	};
}

export default gradeRanges;
