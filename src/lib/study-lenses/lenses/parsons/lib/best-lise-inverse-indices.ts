import bestLise from './best-lise.js';
import findLises from './find-lises.js';
import patienceSort from './patience-sort.js';

/**
 * The indices of `input` that are NOT part of the chosen longest increasing
 * subsequence — i.e. the positions a grader should flag as "needs to move".
 *
 * @param input the sequence of model positions, in the learner's placed order.
 * @returns ascending array of indices into `input` not covered by the best LIS.
 *   Empty input returns `[]` (callers should still short-circuit before calling,
 *   per `../DOCS.md` § Structural constraints "Empty-input guard").
 */
export default function bestLiseInverseIndices(
	input: ReadonlyArray<number>,
): number[] {
	if (input.length === 0) return [];
	const best = bestLise(findLises(patienceSort(input)));
	const inverse_indices: number[] = [];
	let j = 0;
	for (let i = 0; i < best.length; i++) {
		for (; j < input.length; j++) {
			if (input[j] === best[i]) {
				j++;
				break;
			} else {
				inverse_indices.push(j);
			}
		}
	}
	for (; j < input.length; j++) {
		inverse_indices.push(j);
	}
	return inverse_indices;
}
