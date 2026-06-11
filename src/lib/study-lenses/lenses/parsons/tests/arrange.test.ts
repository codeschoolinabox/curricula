import { describe, expect, it } from 'vitest';

import indentLine from '../lib/indent-line.js';
import initialArrangement from '../lib/initial-arrangement.js';
import outdentLine from '../lib/outdent-line.js';
import placeFromPool from '../lib/place-from-pool.js';
import reorderWithinSolution from '../lib/reorder-within-solution.js';
import returnToPool from '../lib/return-to-pool.js';
import type { Arrangement } from '../types.js';

const arr = (
	pool: ReadonlyArray<string>,
	solution: ReadonlyArray<[string, number]>,
): Arrangement => ({
	pool: [...pool],
	solution: solution.map(([id, indent]) => ({ id, indent })),
});

/** Every id appears in exactly one of pool / solution. */
const partitionOk = (state: Arrangement, allIds: ReadonlyArray<string>): boolean => {
	const seen = [...state.pool, ...state.solution.map((s) => s.id)].sort();
	return JSON.stringify(seen) === JSON.stringify([...allIds].sort());
};

describe('arrange', () => {
	describe('initialArrangement', () => {
		it('puts all ids in the pool and leaves the solution empty', () => {
			expect(initialArrangement(['a', 'b', 'c'])).toEqual({
				pool: ['a', 'b', 'c'],
				solution: [],
			});
		});

		it('copies the pool ids (does not alias the input array)', () => {
			const input = ['a', 'b'];
			const result = initialArrangement(input);
			input.push('c');
			expect(result.pool).toEqual(['a', 'b']);
		});

		it('returns empty pool + solution for empty input', () => {
			expect(initialArrangement([])).toEqual({ pool: [], solution: [] });
		});
	});

	describe('placeFromPool', () => {
		it('moves a pooled line into the solution at index 0 with indent 0', () => {
			const result = placeFromPool(arr(['a', 'b'], []), 'a', 0);
			expect(result.pool).toEqual(['b']);
			expect(result.solution).toEqual([{ id: 'a', indent: 0 }]);
		});

		it('inserts at a middle index', () => {
			const start = arr(['c'], [['a', 0], ['b', 0]]);
			const result = placeFromPool(start, 'c', 1);
			expect(result.solution.map((s) => s.id)).toEqual(['a', 'c', 'b']);
			expect(result.pool).toEqual([]);
		});

		it('clamps an index beyond the solution length to the end', () => {
			const result = placeFromPool(arr(['b'], [['a', 0]]), 'b', 99);
			expect(result.solution.map((s) => s.id)).toEqual(['a', 'b']);
		});

		it('clamps a negative index to the start (splice footgun guard)', () => {
			const result = placeFromPool(arr(['b'], [['a', 0]]), 'b', -5);
			expect(result.solution.map((s) => s.id)).toEqual(['b', 'a']);
		});

		it('removes the placed id from the pool (no duplication into both)', () => {
			const result = placeFromPool(arr(['a', 'b'], []), 'a', 0);
			expect(result.pool).not.toContain('a');
		});

		it('is a no-op (same ref) when the id is not in the pool', () => {
			const start = arr(['a'], [['x', 0]]);
			expect(placeFromPool(start, 'zzz', 0)).toBe(start);
		});

		it('does not mutate the input arrangement', () => {
			const start = arr(['a', 'b'], []);
			placeFromPool(start, 'a', 0);
			expect(start).toEqual(arr(['a', 'b'], []));
		});
	});

	describe('reorderWithinSolution', () => {
		it('moves a placed line down, preserving its indent', () => {
			const start = arr([], [['a', 0], ['b', 1], ['c', 2]]);
			const result = reorderWithinSolution(start, 'a', 2);
			expect(result.solution).toEqual([
				{ id: 'b', indent: 1 },
				{ id: 'c', indent: 2 },
				{ id: 'a', indent: 0 },
			]);
		});

		it('moves a placed line up', () => {
			const start = arr([], [['a', 0], ['b', 0], ['c', 0]]);
			const result = reorderWithinSolution(start, 'c', 0);
			expect(result.solution.map((s) => s.id)).toEqual(['c', 'a', 'b']);
		});

		it('moves to a precise in-range middle index', () => {
			const start = arr([], [['a', 0], ['b', 0], ['c', 0]]);
			expect(reorderWithinSolution(start, 'a', 1).solution.map((s) => s.id)).toEqual([
				'b',
				'a',
				'c',
			]);
		});

		it('clamps the target index', () => {
			const start = arr([], [['a', 0], ['b', 0]]);
			expect(reorderWithinSolution(start, 'a', 99).solution.map((s) => s.id)).toEqual([
				'b',
				'a',
			]);
		});

		it('is a no-op-shaped move when reordered to its own position', () => {
			const start = arr([], [['a', 0], ['b', 0], ['c', 0]]);
			expect(reorderWithinSolution(start, 'b', 1).solution.map((s) => s.id)).toEqual([
				'a',
				'b',
				'c',
			]);
		});

		it('does not mutate the input arrangement and returns fresh line objects', () => {
			const start = arr([], [['a', 0], ['b', 1], ['c', 2]]);
			const result = reorderWithinSolution(start, 'a', 2);
			expect(start).toEqual(arr([], [['a', 0], ['b', 1], ['c', 2]]));
			expect(result.solution).not.toBe(start.solution);
		});

		it('is a no-op (same ref) when the id is not in the solution', () => {
			const start = arr(['z'], [['a', 0]]);
			expect(reorderWithinSolution(start, 'z', 0)).toBe(start);
		});
	});

	describe('returnToPool', () => {
		it('moves a placed line back to the end of the pool, dropping its indent', () => {
			const start = arr(['a'], [['b', 2]]);
			const result = returnToPool(start, 'b');
			expect(result.solution).toEqual([]);
			expect(result.pool).toEqual(['a', 'b']);
		});

		it('empties the solution when returning the only placed line', () => {
			const result = returnToPool(arr([], [['a', 3]]), 'a');
			expect(result).toEqual({ pool: ['a'], solution: [] });
		});

		it('is a no-op (same ref) when the id is not in the solution', () => {
			const start = arr(['a'], []);
			expect(returnToPool(start, 'a')).toBe(start);
		});

		it('re-placing a returned line restarts its indent at 0 (pool stores no level)', () => {
			let s = initialArrangement(['a']);
			s = placeFromPool(s, 'a', 0);
			s = indentLine(s, 'a');
			s = indentLine(s, 'a');
			s = indentLine(s, 'a'); // a is now at indent 3
			s = returnToPool(s, 'a'); // back to pool, level dropped
			s = placeFromPool(s, 'a', 0); // re-placed
			expect(s.solution).toEqual([{ id: 'a', indent: 0 }]);
		});
	});

	describe('indentLine / outdentLine', () => {
		it('increments the indent of a placed line', () => {
			const result = indentLine(arr([], [['a', 1]]), 'a');
			expect(result.solution[0]).toEqual({ id: 'a', indent: 2 });
		});

		it('decrements the indent of a placed line', () => {
			const result = outdentLine(arr([], [['a', 2]]), 'a');
			expect(result.solution[0]).toEqual({ id: 'a', indent: 1 });
		});

		it('floors outdent at 0', () => {
			const result = outdentLine(arr([], [['a', 0]]), 'a');
			expect(result.solution[0]).toEqual({ id: 'a', indent: 0 });
		});

		it('only changes the targeted line', () => {
			const result = indentLine(arr([], [['a', 0], ['b', 0]]), 'b');
			expect(result.solution).toEqual([
				{ id: 'a', indent: 0 },
				{ id: 'b', indent: 1 },
			]);
		});

		it('indent is a no-op (same ref) when the id is not placed', () => {
			const start = arr(['a'], []);
			expect(indentLine(start, 'a')).toBe(start);
		});

		it('outdent is a no-op (same ref) when the id is not placed', () => {
			const start = arr(['a'], []);
			expect(outdentLine(start, 'a')).toBe(start);
		});
	});

	describe('Invariant — partition preserved across a sequence of ops', () => {
		it('keeps every id in exactly one of pool / solution', () => {
			const ids = ['a', 'b', 'c'];
			let s = initialArrangement(ids);
			s = placeFromPool(s, 'b', 0);
			s = placeFromPool(s, 'a', 0);
			s = indentLine(s, 'a');
			s = reorderWithinSolution(s, 'b', 0);
			s = returnToPool(s, 'a');
			expect(partitionOk(s, ids)).toBe(true);
		});
	});
});
