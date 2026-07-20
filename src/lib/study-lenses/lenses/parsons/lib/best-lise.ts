// cspell:ignore lises lise parsonizer

/**
 * Pick the "best" LIS among candidates: the one with the most consecutive
 * runs (adjacent values differing by exactly 1), first-max on ties.
 *
 * @remarks Restores the original underscore `_.max(scores, s => s.score)`
 * semantics of the upstream js-parsons `lis.js` rather than the parsonizer
 * copy's `.sort()` transcription bug (a single-argument function passed to
 * `Array.sort` is not a valid comparator, which silently defeated the
 * tie-break). See `../DOCS.md` § Decisions.
 */
export default function bestLise(
	lises: ReadonlyArray<ReadonlyArray<number>>,
): number[] {
	if (lises.length === 0) return [];
	const scores = lises.map((candidate, index) =>
		scoreCandidate(candidate, index),
	);
	// Restore `_.max(scores, s => s.score)`: highest score wins; the strict
	// `>` keeps the FIRST candidate on a tie (first-max), matching `_.max`.
	let best = scores[0];
	for (const scored of scores) {
		if (scored.score > best.score) {
			best = scored;
		}
	}
	return [...lises[best.index]];
}

/** Count the consecutive runs (adjacent values differing by exactly 1). */
function scoreCandidate(
	candidate: ReadonlyArray<number>,
	index: number,
): { score: number; index: number } {
	if (candidate.length <= 1) {
		return { score: 0, index };
	}
	let score = 0;
	for (let position = 1; position < candidate.length; position++) {
		if (candidate[position - 1] === candidate[position] - 1) {
			score++;
		}
	}
	return { score, index };
}
