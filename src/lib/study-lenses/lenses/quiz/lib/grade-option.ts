/**
 * @file The quiz lens's answer-handling transform — turns a clicked panel
 * option into a graded `Verdict`. Pure: builds the `mcq` `LearnerResponse` from
 * the option's id (verbatim — anything else grades `malformed`) and delegates
 * to `lib/quizzing`'s total `grade`. No React, no CodeMirror.
 */

import grade from '../../../lib/quizzing/grade.js';
import type { McqQuizItem, Verdict } from '../../../lib/quizzing/types.js';

/**
 * Grades a learner's panel-option pick for an `mcq` quiz item. Builds the
 * response from the clicked `optionId` **verbatim** (`grade` returns `malformed`
 * for an unknown id or a mode mismatch — never thrown), then returns the
 * `Verdict`. Single-select in Slice A (one id); the array shape is stable for
 * when `multi-mcq` lands.
 *
 * @param item - The `McqQuizItem` the panel is showing.
 * @param optionId - The `id` of the option the learner clicked.
 * @returns The `Verdict` (`correct` / `incorrect` / `malformed`).
 */
function gradeOption(item: McqQuizItem, optionId: string): Verdict {
	return grade(item, { mode: 'mcq', selectedOptionIds: [optionId] });
}

export default gradeOption;
