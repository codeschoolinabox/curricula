/**
 * @file The `grade` public export — the quizzing module's grading entry point.
 * A pure comparator: it reads only the `QuizItem` and the `LearnerResponse`
 * (never the snippet — the item carries its own machine-derived ground truth),
 * dispatches on `item.mode`, and returns a frozen `Verdict`. Total and
 * non-throwing: it runs in the lens's interaction loop on every click. See
 * `./DOCS.md` § Grading for the one-sided seam this realizes.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	LearnerResponse,
	McqQuizItem,
	QuizItem,
	Verdict,
} from './types.js';

/**
 * Grade one learner response against one quiz item.
 *
 * @remarks
 * - **Total and never throws** — an uninterpretable response (an unknown option
 *   id) grades to a `malformed` verdict, not an exception, so the lens never
 *   penalizes a UI bug as a wrong answer.
 * - **Binary** — `correct` only on an exact match of the answer key (set
 *   equality of selected vs. correct option ids — order-insensitive, duplicates
 *   collapse, no missing or extra); no partial credit.
 * - **One-sided** — reads only `(item, response)`; the `Verdict` reports
 *   judgment + `feedback`, never the answer key.
 *
 * Dispatch is on `item.mode`. Only `mcq` exists today; the fall-through arm is a
 * compile-time exhaustiveness guard (`never`) that keeps grade total — when a
 * second answer mode lands, its missing arm fails the build here rather than
 * silently falling through. That new arm must also gate a response whose `mode`
 * differs from the item's to `malformed` (the discriminant-narrowing contract).
 */
export default function grade(
	item: QuizItem,
	response: LearnerResponse,
): Verdict {
	if (item.mode === 'mcq') {
		return freezeVerdict(gradeMcq(item, response));
	}

	const exhaustiveCheck: never = item.mode;
	return freezeVerdict({
		status: 'malformed',
		reason: `unsupported answer mode: ${String(exhaustiveCheck)}`,
	});
}

/**
 * Grade an `mcq` response: an unknown option id (one not among the item's
 * options) is `malformed` — checked first, so a UI bug never masquerades as a
 * wrong answer; otherwise the selected ids must set-equal the answer key for
 * `correct`, else `incorrect`. Both judged verdicts surface `item.feedback`.
 */
function gradeMcq(item: McqQuizItem, response: LearnerResponse): Verdict {
	const knownIds = new Set(item.options.map((option) => option.id));
	const unknownId = response.selectedOptionIds.find((id) => !knownIds.has(id));
	if (unknownId !== undefined) {
		return { status: 'malformed', reason: `unknown option id: ${unknownId}` };
	}

	const selected = new Set(response.selectedOptionIds);
	const answer = new Set(item.answerOptionIds);
	return isSameSet(selected, answer)
		? { status: 'correct', feedback: item.feedback }
		: { status: 'incorrect', feedback: item.feedback };
}

/** Set equality: same size and every member of `a` is in `b`. */
function isSameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
	if (a.size !== b.size) {
		return false;
	}
	for (const value of a) {
		if (!b.has(value)) {
			return false;
		}
	}
	return true;
}

/**
 * Freeze a verdict (own, freshly-built data) and return it — typed as `Verdict`,
 * not the lossy `Readonly<Verdict>` a generic freeze infers over the union.
 */
function freezeVerdict(verdict: Verdict): Verdict {
	deepFreezeInPlace(verdict);
	return verdict;
}
