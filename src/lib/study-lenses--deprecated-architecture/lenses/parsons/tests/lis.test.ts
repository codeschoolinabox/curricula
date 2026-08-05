import { describe, expect, it } from 'vitest';

import bestLise from '../lib/best-lise.js';
import bestLiseInverseIndices from '../lib/best-lise-inverse-indices.js';
import findLises from '../lib/find-lises.js';
import patienceSort from '../lib/patience-sort.js';

/**
 * Invariant of `bestLiseInverseIndices`: removing the returned indices from
 * the input must leave a strictly-increasing subsequence (that is the whole
 * point — the inverse of an increasing subsequence). Robust against which of
 * several equal-length LIS the algorithm happens to pick.
 */
const keptIsStrictlyIncreasing = (
	input: ReadonlyArray<number>,
	inverse: ReadonlyArray<number>,
): boolean => {
	const drop = new Set(inverse);
	const kept = input.filter((_, i) => !drop.has(i));
	for (let i = 1; i < kept.length; i++) {
		if (kept[i] <= kept[i - 1]) return false;
	}
	return true;
};

describe('lis', () => {
	describe('bestLiseInverseIndices', () => {
		describe('Zero — empty input', () => {
			it('returns [] for an empty sequence', () => {
				expect(bestLiseInverseIndices([])).toEqual([]);
			});
		});

		describe('One — single element', () => {
			it('returns [] (a single element is trivially the LIS)', () => {
				expect(bestLiseInverseIndices([5])).toEqual([]);
			});
		});

		describe('Many — already increasing leaves nothing to move', () => {
			it('returns [] for consecutive ascending [0,1,2,3]', () => {
				expect(bestLiseInverseIndices([0, 1, 2, 3])).toEqual([]);
			});

			it('returns [] for non-consecutive ascending [0,10,20]', () => {
				expect(bestLiseInverseIndices([0, 10, 20])).toEqual([]);
			});

			it('flags the out-of-place element in [1,0,2]', () => {
				// Full-pipeline assertion: deterministic ONLY because bestLise
				// prefers [1,2] (consecutive, score 1) over [0,2] (score 0) —
				// pinned by the bestLise tests below. The value 0 at index 1 is
				// then the one not in the LIS, i.e. the one to move.
				const inverse = bestLiseInverseIndices([1, 0, 2]);
				expect(inverse).toEqual([1]);
			});

			it('flags 3 of 4 for a fully-reversed sequence [3,2,1,0]', () => {
				// LIS length is 1; first-max picks value 3 (at index 0), so the
				// LIS is [3] and indices 1,2,3 (values 2,1,0) must all move.
				// Deterministic given first-max selection — pinned exactly as a
				// regression anchor.
				expect(bestLiseInverseIndices([3, 2, 1, 0])).toEqual([1, 2, 3]);
			});

			it('flags the two displaced lines in [2,0,3,1,4]', () => {
				// decks = [[2,0],[3,1],[4]]; candidate LISes of length 3 are
				// [2,3,4] (2 consecutive runs), [0,3,4] and [0,1,4] (1 each).
				// _.max picks the highest-consecutive-run LIS [2,3,4], leaving
				// the values 0 (index 1) and 1 (index 3) to move.
				expect(bestLiseInverseIndices([2, 0, 3, 1, 4])).toEqual([1, 3]);
			});
		});

		describe('Boundaries / Interfaces — invariants on the result', () => {
			it('returns ascending indices', () => {
				const inverse = bestLiseInverseIndices([2, 0, 3, 1, 4]);
				const sorted = [...inverse].sort((a, b) => a - b);
				expect(inverse).toEqual(sorted);
			});

			it('leaves a strictly-increasing subsequence after removing the inverse', () => {
				for (const input of [
					[2, 0, 3, 1, 4],
					[5, 4, 3, 2, 1],
					[0, 2, 1, 3],
					[1, 3, 2, 4, 3, 5],
				]) {
					expect(
						keptIsStrictlyIncreasing(input, bestLiseInverseIndices(input)),
					).toBe(true);
				}
			});

			it('kept count equals input length minus inverse length', () => {
				const input = [2, 0, 3, 1, 4];
				const inverse = bestLiseInverseIndices(input);
				const drop = new Set(inverse);
				const keptCount = input.filter((_, i) => !drop.has(i)).length;
				expect(keptCount).toBe(input.length - inverse.length);
			});

			it('handles duplicate values (equal model positions) without error', () => {
				const inverse = bestLiseInverseIndices([0, 1, 1, 2]);
				expect(keptIsStrictlyIncreasing([0, 1, 1, 2], inverse)).toBe(true);
			});
		});
	});

	describe('bestLise — selection restores the original _.max tie-break', () => {
		it('prefers the highest-consecutive-run LIS regardless of candidate position', () => {
			// [0,2] scores 0 consecutive pairs; [1,2] scores 1 (values differ by 1).
			// _.max picks the higher score WHATEVER its position in the list.
			// The discriminating case is higher-score-FIRST: the broken
			// parsonizer `.sort()` returns the LAST candidate, so it would yield
			// [0,2] here, whereas the restored _.max yields [1,2]. The
			// higher-score-last case is included too (both impls agree there) to
			// pin position-independence.
			expect(
				bestLise([
					[1, 2],
					[0, 2],
				]),
			).toEqual([1, 2]); // higher-score first
			expect(
				bestLise([
					[0, 2],
					[1, 2],
				]),
			).toEqual([1, 2]); // higher-score last
		});

		it('prefers the longer-scoring run [0,1,2] over a singleton [5]', () => {
			expect(bestLise([[5], [0, 1, 2]])).toEqual([0, 1, 2]);
		});

		it('returns first-max on a true tie (both score 0)', () => {
			expect(bestLise([[3], [7]])).toEqual([3]);
		});
	});

	describe('findLises — enumerates the full max-length candidate set', () => {
		it('returns BOTH equal-length LISes for decks [[1,0],[2]]', () => {
			// patienceSort([1,0,2]) = [[1,0],[2]]; max LIS length 2;
			// candidates are [1,2] and [0,2] — both must be returned so
			// bestLise can choose between them.
			const result = findLises([[1, 0], [2]]);
			expect(result).toHaveLength(2);
			expect(result).toContainEqual([1, 2]);
			expect(result).toContainEqual([0, 2]);
		});

		it('returns the single candidate for a one-element deck', () => {
			expect(findLises([[5]])).toEqual([[5]]);
		});

		it('accumulates a length-3 LIS across three decks [[2,0],[1],[3]]', () => {
			// Exercises multi-generation accumulation: [0] (deck 0) → [0,1]
			// (deck 1) → [0,1,3] (deck 2). The max-length filter keeps only it.
			expect(findLises([[2, 0], [1], [3]])).toEqual([[0, 1, 3]]);
		});
	});

	describe('patienceSort — building block', () => {
		it('groups a sorted ascending run into singleton decks', () => {
			// Each element >= the current deck's last starts a new deck.
			expect(patienceSort([1, 2, 3])).toEqual([[1], [2], [3]]);
		});

		it('piles a strictly-decreasing run onto one deck', () => {
			expect(patienceSort([3, 2, 1])).toEqual([[3, 2, 1]]);
		});

		it('mixed [3,1,2]: 1 falls below 3 (same deck); 2 exceeds 1 (new deck)', () => {
			expect(patienceSort([3, 1, 2])).toEqual([[3, 1], [2]]);
		});

		it('equal value starts a new deck (pins x < last, NOT x <= last)', () => {
			expect(patienceSort([1, 1])).toEqual([[1], [1]]);
		});
	});
});
