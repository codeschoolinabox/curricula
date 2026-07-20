// cspell:ignore lises lise

import bestLise from './best-lise.js';
import findLises from './find-lises.js';
import patienceSort from './patience-sort.js';

/**
 * The indices of `input` that are NOT part of the chosen longest increasing
 * subsequence — i.e. the positions a grader should flag as "needs to move".
 *
 * @param input - the sequence of model positions, in the learner's placed
 *   order.
 * @returns ascending array of indices into `input` not covered by the best
 *   LIS. Empty input returns `[]` (callers should still short-circuit before
 *   calling — see the empty-input guard rationale in `../DOCS.md`
 *   § Decisions).
 */
export default function bestLiseInverseIndices(
	input: ReadonlyArray<number>,
): number[] {
	if (input.length === 0) return [];
	const best = bestLise(findLises(patienceSort(input)));
	const inverseIndices: number[] = [];
	let cursor = 0;
	for (const kept of best) {
		for (; cursor < input.length; cursor++) {
			if (input[cursor] === kept) {
				cursor++;
				break;
			} else {
				inverseIndices.push(cursor);
			}
		}
	}
	for (; cursor < input.length; cursor++) {
		inverseIndices.push(cursor);
	}
	return inverseIndices;
}
