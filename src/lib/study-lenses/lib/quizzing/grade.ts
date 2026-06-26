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
	CodeSurfaceQuizItem,
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
 *   equality — order-insensitive, duplicates collapse, no missing or extra),
 *   whether matching option ids (`mcq`) or source ranges (code-surface); no
 *   partial credit.
 * - **One-sided** — reads only `(item, response)`; the `Verdict` reports
 *   judgment + `feedback`, never the answer key.
 *
 * Dispatch is on `item.mode`: the `mcq` arm compares option-id sets; the
 * code-surface arm (`click-token` / `click-line`) compares clicked ranges to the
 * item's `targetRanges`. Each arm gates a response whose `mode` differs from the
 * item's to `malformed` (the discriminant-narrowing contract — a caller / UI bug,
 * not a wrong learner). The fall-through `never` arm keeps grade total: when
 * `multi-mcq` or `select-in-code` lands, its missing arm fails the build here
 * rather than silently falling through.
 */
export default function grade(
	item: QuizItem,
	response: LearnerResponse,
): Verdict {
	if (item.mode === 'mcq') {
		return freezeVerdict(gradeMcq(item, response));
	}
	if (item.mode === 'click-token' || item.mode === 'click-line') {
		return freezeVerdict(gradeCodeSurface(item, response));
	}

	const exhaustiveCheck: never = item.mode;
	return freezeVerdict({
		status: 'malformed',
		reason: `unsupported answer mode: ${String(exhaustiveCheck)}`,
	});
}

/**
 * Grade an `mcq` response: a response whose mode is not `mcq` is `malformed` (the
 * discriminant-narrowing contract — a caller / UI bug, not a wrong learner); an
 * unknown option id (one not among the item's options) is `malformed` too —
 * checked before judging, so a UI bug never masquerades as a wrong answer;
 * otherwise the selected ids must set-equal the answer key for `correct`, else
 * `incorrect`. Both judged verdicts surface `item.feedback`.
 */
function gradeMcq(item: McqQuizItem, response: LearnerResponse): Verdict {
	if (response.mode !== 'mcq') {
		return {
			status: 'malformed',
			reason: `response mode ${response.mode} does not match item mode mcq`,
		};
	}

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

/**
 * Grade a code-surface response: a response whose mode does not match the item's
 * — an `mcq` response, or a `click-line` response to a `click-token` item and
 * vice versa — is `malformed` (the discriminant-narrowing contract; a caller / UI
 * bug, not a wrong learner). Otherwise the clicked ranges must set-equal the
 * target ranges for `correct`, else `incorrect`. There is no range analogue to
 * mcq's unknown-option-id `malformed`: `grade` never sees the Snippet, so a
 * non-matching range is simply `incorrect`. Both judged verdicts surface
 * `item.feedback`.
 */
function gradeCodeSurface(
	item: CodeSurfaceQuizItem,
	response: LearnerResponse,
): Verdict {
	if (response.mode === 'mcq' || response.mode !== item.mode) {
		return {
			status: 'malformed',
			reason: `response mode ${response.mode} does not match item mode ${item.mode}`,
		};
	}

	const clicked = new Set(
		response.clickedRanges.map((range) => rangeKey(range)),
	);
	const target = new Set(item.targetRanges.map((range) => rangeKey(range)));
	return isSameSet(clicked, target)
		? { status: 'correct', feedback: item.feedback }
		: { status: 'incorrect', feedback: item.feedback };
}

/** Canonical comparison key for a half-open source range. */
function rangeKey(range: readonly [number, number]): string {
	return `${range[0]}-${range[1]}`;
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
