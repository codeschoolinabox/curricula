// cspell:ignore lises lise

import { describe, expect, it } from 'vitest';

import bestLiseInverseIndices from '../lib/best-lise-inverse-indices.js';
import bestLise from '../lib/best-lise.js';
import findLises from '../lib/find-lises.js';
import patienceSort from '../lib/patience-sort.js';

function kept(
	input: ReadonlyArray<number>,
	inverse: ReadonlyArray<number>,
): number[] {
	return input.filter((_, index) => !inverse.includes(index));
}

function isStrictlyIncreasing(values: ReadonlyArray<number>): boolean {
	return values.every(
		(value, index) => index === 0 || value > values[index - 1],
	);
}

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

		it('flags the out-of-place element in [1,0,2] (bestLise prefers the consecutive [1,2])', () => {
			expect(bestLiseInverseIndices([1, 0, 2])).toEqual([1]);
		});

		it('flags 3 of 4 for a fully-reversed sequence [3,2,1,0] (first-max keeps [3])', () => {
			expect(bestLiseInverseIndices([3, 2, 1, 0])).toEqual([1, 2, 3]);
		});

		it('flags the two displaced lines in [2,0,3,1,4] (highest-consecutive-run LIS [2,3,4])', () => {
			expect(bestLiseInverseIndices([2, 0, 3, 1, 4])).toEqual([1, 3]);
		});
	});

	describe('Boundaries / Interfaces — invariants on the result', () => {
		it('returns ascending indices', () => {
			const inverse = bestLiseInverseIndices([2, 0, 3, 1, 4]);
			expect(inverse).toEqual(inverse.toSorted((left, right) => left - right));
		});

		it.each([
			[[2, 0, 3, 1, 4]],
			[[5, 4, 3, 2, 1]],
			[[0, 2, 1, 3]],
			[[1, 3, 2, 4, 3, 5]],
		])(
			'removing the inverse of %j leaves a strictly-increasing subsequence',
			(input) => {
				expect(
					isStrictlyIncreasing(kept(input, bestLiseInverseIndices(input))),
				).toBe(true);
			},
		);

		it('kept count equals input length minus inverse length', () => {
			const input = [2, 0, 3, 1, 4];
			const inverse = bestLiseInverseIndices(input);
			expect(kept(input, inverse).length).toBe(input.length - inverse.length);
		});

		it('handles duplicate values (equal model positions) without error', () => {
			const input = [0, 1, 1, 2];
			expect(
				isStrictlyIncreasing(kept(input, bestLiseInverseIndices(input))),
			).toBe(true);
		});
	});
});

describe('bestLise — selection restores the original _.max tie-break', () => {
	it('prefers the highest-consecutive-run LIS when it comes first', () => {
		expect(
			bestLise([
				[1, 2],
				[0, 2],
			]),
		).toEqual([1, 2]);
	});

	it('prefers the highest-consecutive-run LIS when it comes last (position-independent)', () => {
		expect(
			bestLise([
				[0, 2],
				[1, 2],
			]),
		).toEqual([1, 2]);
	});

	it('prefers the longer-scoring run [0,1,2] over a singleton [5]', () => {
		expect(bestLise([[5], [0, 1, 2]])).toEqual([0, 1, 2]);
	});

	it('returns first-max on a true tie (both score 0)', () => {
		expect(bestLise([[3], [7]])).toEqual([3]);
	});
});

describe('findLises — enumerates the full max-length candidate set', () => {
	it('returns two candidates for decks [[1,0],[2]]', () => {
		expect(findLises([[1, 0], [2]])).toHaveLength(2);
	});

	it('includes the [1,2] candidate for decks [[1,0],[2]]', () => {
		expect(findLises([[1, 0], [2]])).toContainEqual([1, 2]);
	});

	it('includes the [0,2] candidate for decks [[1,0],[2]]', () => {
		expect(findLises([[1, 0], [2]])).toContainEqual([0, 2]);
	});

	it('returns the single candidate for a one-element deck', () => {
		expect(findLises([[5]])).toEqual([[5]]);
	});

	it('accumulates a length-3 LIS across three decks [[2,0],[1],[3]]', () => {
		expect(findLises([[2, 0], [1], [3]])).toEqual([[0, 1, 3]]);
	});
});

describe('patienceSort — building block', () => {
	it('groups a sorted ascending run into singleton decks', () => {
		expect(patienceSort([1, 2, 3])).toEqual([[1], [2], [3]]);
	});

	it('piles a strictly-decreasing run onto one deck', () => {
		expect(patienceSort([3, 2, 1])).toEqual([[3, 2, 1]]);
	});

	it('mixed [3,1,2]: 1 falls below 3 (same deck); 2 exceeds 1 (new deck)', () => {
		expect(patienceSort([3, 1, 2])).toEqual([[3, 1], [2]]);
	});

	it('equal value starts a new deck (pins strictly-less, not less-or-equal)', () => {
		expect(patienceSort([1, 1])).toEqual([[1], [1]]);
	});

	it('returns [] for empty input (no phantom deck)', () => {
		expect(patienceSort([])).toEqual([]);
	});
});
