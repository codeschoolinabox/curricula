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
	SelectInCodeQuizItem,
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
 *   whether matching option ids (`mcq`) or source ranges (code-surface /
 *   select-in-code); no partial credit, so an exhaustive `select-in-code` answer
 *   is `correct` only when it hits the complete target set.
 * - **One-sided** — reads only `(item, response)`; the `Verdict` reports
 *   judgment + `feedback`, never the answer key.
 *
 * Dispatch is on `item.mode`: the `mcq` arm compares option-id sets; the
 * code-surface arm (`click-token` / `click-line`) compares clicked ranges to the
 * item's `targetRanges`; the `select-in-code` arm compares the exhaustive
 * selection's ranges to the same. Each arm gates a response whose `mode` differs
 * from the item's to `malformed` (the discriminant-narrowing contract — a caller
 * / UI bug, not a wrong learner). The fall-through `never` arm keeps grade total:
 * when `multi-mcq` (the sole remaining unbuilt mode) lands, its missing arm fails
 * the build here rather than silently falling through.
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
	if (item.mode === 'select-in-code') {
		return freezeVerdict(gradeSelectInCode(item, response));
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
		return modeMismatch(response.mode, item.mode);
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
 * Grade a code-surface response (`click-token` / `click-line`): a response whose
 * mode does not match the item's — an `mcq` or `select-in-code` response, or a
 * `click-line` response to a `click-token` item and vice versa — is `malformed`
 * (the discriminant-narrowing contract; a caller / UI bug, not a wrong learner).
 * Otherwise the clicked ranges must set-equal the target ranges for `correct`,
 * else `incorrect`. There is no range analogue to mcq's unknown-option-id
 * `malformed`: `grade` never sees the Snippet, so a non-matching range is simply
 * `incorrect`. Both judged verdicts surface `item.feedback`.
 */
function gradeCodeSurface(
	item: CodeSurfaceQuizItem,
	response: LearnerResponse,
): Verdict {
	if (response.mode === 'mcq' || response.mode !== item.mode) {
		return modeMismatch(response.mode, item.mode);
	}
	return gradeRangeSet(
		item.targetRanges,
		response.clickedRanges,
		item.feedback,
	);
}

/**
 * Grade an exhaustive `select-in-code` response: a response whose mode is not
 * `select-in-code` is `malformed` (the discriminant-narrowing contract; a caller
 * / UI bug, not a wrong learner). Otherwise the selected ranges must set-equal the
 * **complete** target set for `correct`, else `incorrect` — a partial selection
 * is never partially credited (exhaustiveness is the graded skill). Same exact
 * set-equality as the other code-surface modes; differs only in the response
 * field read (`selectedRanges`) and the mode guard. Both judged verdicts surface
 * `item.feedback`.
 */
function gradeSelectInCode(
	item: SelectInCodeQuizItem,
	response: LearnerResponse,
): Verdict {
	if (response.mode !== 'select-in-code') {
		return modeMismatch(response.mode, item.mode);
	}
	return gradeRangeSet(
		item.targetRanges,
		response.selectedRanges,
		item.feedback,
	);
}

/**
 * Exact set-equality of a response's ranges against an item's target ranges — the
 * shared comparator for every code-surface mode (`click-token` / `click-line` /
 * `select-in-code`). Order-insensitive, duplicates collapse, no missing or extra
 * (binary, no partial credit). The judged verdict surfaces `feedback`.
 */
function gradeRangeSet(
	targetRanges: ReadonlyArray<readonly [number, number]>,
	responseRanges: ReadonlyArray<readonly [number, number]>,
	feedback: string,
): Verdict {
	const response = new Set(responseRanges.map((range) => rangeKey(range)));
	const target = new Set(targetRanges.map((range) => rangeKey(range)));
	return isSameSet(response, target)
		? { status: 'correct', feedback }
		: { status: 'incorrect', feedback };
}

/**
 * A `malformed` verdict for a response whose mode does not match the item's — a
 * caller / UI bug, not a wrong learner. The `reason` is a developer diagnostic.
 */
function modeMismatch(responseMode: string, itemMode: string): Verdict {
	return {
		status: 'malformed',
		reason: `response mode ${responseMode} does not match item mode ${itemMode}`,
	};
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
