/**
 * Pick the "best" LIS among candidates: the one with the most consecutive runs
 * (adjacent values differing by exactly 1), first-max on ties.
 *
 * @remarks Restores the original `_.max(scores, s => s.score)` semantics (see
 * lis.ts file header) rather than the parsonizer `.sort()` transcription bug.
 */
export default function bestLise(
	lises: ReadonlyArray<ReadonlyArray<number>>,
): number[] {
	if (lises.length === 0) return [];
	const lis_scores = lises.map((item, index) => {
		if (item.length <= 1) {
			return { score: 0, index };
		}
		let score = 0;
		for (let i = 1; i < item.length; i++) {
			if (item[i - 1] === item[i] - 1) {
				score++;
			}
		}
		return { score, index };
	});
	// Restore `_.max(lis_scores, s => s.score)`: highest score wins; the strict
	// `>` keeps the FIRST candidate on a tie (first-max), matching `_.max`.
	let best = lis_scores[0];
	for (const s of lis_scores) {
		if (s.score > best.score) {
			best = s;
		}
	}
	return [...lises[best.index]];
}
