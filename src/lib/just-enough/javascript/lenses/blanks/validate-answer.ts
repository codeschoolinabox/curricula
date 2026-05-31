/**
 * @file Pure per-blank correctness primitive for the `blanks` lens.
 * Consumed by `./index.tsx` (the wrapper aggregates per-blank results
 * into the score readout). No React imports.
 *
 * @remarks Per `./README.md` § Validation contract: the learner answer
 * is `String.prototype.trim`-ed and compared via strict equality to
 * the original token text. Three outcomes: `'unfilled'` (empty after
 * trim), `'correct'` (trimmed match), `'incorrect'` (non-empty
 * mismatch).
 *
 * @remarks **No operator-equivalence relaxation in v1.** `==` and
 * `===` are distinct answers; `&&` and `&` are distinct. The toolbar's
 * score readout makes the strict-match contract explicit so learners
 * self-correct. See `./README.md` § Future direction for the deferred
 * relaxation.
 */

import type { Correctness } from './types.js';

/**
 * Per-blank correctness comparison.
 *
 * @param answer - The original token text for the blank (verbatim
 *   source range from Acorn; no surrounding whitespace).
 * @param learnerAnswer - The text the learner has typed into the
 *   blank's input field.
 * @returns `'unfilled'` when the learner answer is empty or
 *   whitespace-only after trim; `'correct'` when the trimmed learner
 *   answer equals the answer; `'incorrect'` otherwise.
 */
function validateAnswer(answer: string, learnerAnswer: string): Correctness {
	const trimmed = learnerAnswer.trim();
	if (trimmed === '') return 'unfilled';
	if (trimmed === answer) return 'correct';
	return 'incorrect';
}

export default validateAnswer;
