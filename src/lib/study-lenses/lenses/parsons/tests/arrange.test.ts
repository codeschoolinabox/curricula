// cspell:ignore footgun

import { describe, expect, it } from 'vitest';

import indentLine from '../lib/indent-line.js';
import initialArrangement from '../lib/initial-arrangement.js';
import outdentLine from '../lib/outdent-line.js';
import placeFromPool from '../lib/place-from-pool.js';
import reorderWithinSolution from '../lib/reorder-within-solution.js';
import returnToPool from '../lib/return-to-pool.js';
import type { Arrangement } from '../types.js';

function arrange(
	pool: ReadonlyArray<string>,
	solution: ReadonlyArray<[string, number]>,
): Arrangement {
	return {
		pool: [...pool],
		solution: solution.map(([id, indent]) => ({ id, indent })),
	};
}

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
		expect(placeFromPool(arrange(['a', 'b'], []), 'a', 0)).toEqual({
			pool: ['b'],
			solution: [{ id: 'a', indent: 0 }],
		});
	});

	it('inserts at a middle index', () => {
		const start = arrange(
			['c'],
			[
				['a', 0],
				['b', 0],
			],
		);
		expect(
			placeFromPool(start, 'c', 1).solution.map((placed) => placed.id),
		).toEqual(['a', 'c', 'b']);
	});

	it('clamps an index beyond the solution length to the end', () => {
		expect(
			placeFromPool(arrange(['b'], [['a', 0]]), 'b', 99).solution.map(
				(placed) => placed.id,
			),
		).toEqual(['a', 'b']);
	});

	it('clamps a negative index to the start (splice footgun guard)', () => {
		expect(
			placeFromPool(arrange(['b'], [['a', 0]]), 'b', -5).solution.map(
				(placed) => placed.id,
			),
		).toEqual(['b', 'a']);
	});

	it('removes the placed id from the pool (no duplication into both)', () => {
		expect(placeFromPool(arrange(['a', 'b'], []), 'a', 0).pool).not.toContain(
			'a',
		);
	});

	it('is a no-op (same ref) when the id is not in the pool', () => {
		const start = arrange(['a'], [['x', 0]]);
		expect(placeFromPool(start, 'zzz', 0)).toBe(start);
	});

	it('does not mutate the input arrangement', () => {
		const start = arrange(['a', 'b'], []);
		placeFromPool(start, 'a', 0);
		expect(start).toEqual(arrange(['a', 'b'], []));
	});
});

describe('reorderWithinSolution', () => {
	it('moves a placed line down, preserving its indent', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 1],
				['c', 2],
			],
		);
		expect(reorderWithinSolution(start, 'a', 2).solution).toEqual([
			{ id: 'b', indent: 1 },
			{ id: 'c', indent: 2 },
			{ id: 'a', indent: 0 },
		]);
	});

	it('moves a placed line up', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 0],
				['c', 0],
			],
		);
		expect(
			reorderWithinSolution(start, 'c', 0).solution.map((placed) => placed.id),
		).toEqual(['c', 'a', 'b']);
	});

	it('moves to a precise in-range middle index', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 0],
				['c', 0],
			],
		);
		expect(
			reorderWithinSolution(start, 'a', 1).solution.map((placed) => placed.id),
		).toEqual(['b', 'a', 'c']);
	});

	it('clamps the target index', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 0],
			],
		);
		expect(
			reorderWithinSolution(start, 'a', 99).solution.map((placed) => placed.id),
		).toEqual(['b', 'a']);
	});

	it('is a no-op-shaped move when reordered to its own position', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 0],
				['c', 0],
			],
		);
		expect(
			reorderWithinSolution(start, 'b', 1).solution.map((placed) => placed.id),
		).toEqual(['a', 'b', 'c']);
	});

	it('does not mutate the input arrangement', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 1],
				['c', 2],
			],
		);
		reorderWithinSolution(start, 'a', 2);
		expect(start).toEqual(
			arrange(
				[],
				[
					['a', 0],
					['b', 1],
					['c', 2],
				],
			),
		);
	});

	it('returns a fresh solution array (not the input reference)', () => {
		const start = arrange(
			[],
			[
				['a', 0],
				['b', 1],
			],
		);
		expect(reorderWithinSolution(start, 'a', 1).solution).not.toBe(
			start.solution,
		);
	});

	it('is a no-op (same ref) when the id is not in the solution', () => {
		const start = arrange(['z'], [['a', 0]]);
		expect(reorderWithinSolution(start, 'z', 0)).toBe(start);
	});
});

describe('returnToPool', () => {
	it('moves a placed line back to the end of the pool, dropping its indent', () => {
		expect(returnToPool(arrange(['a'], [['b', 2]]), 'b')).toEqual({
			pool: ['a', 'b'],
			solution: [],
		});
	});

	it('empties the solution when returning the only placed line', () => {
		expect(returnToPool(arrange([], [['a', 3]]), 'a')).toEqual({
			pool: ['a'],
			solution: [],
		});
	});

	it('is a no-op (same ref) when the id is not in the solution', () => {
		const start = arrange(['a'], []);
		expect(returnToPool(start, 'a')).toBe(start);
	});

	it('re-placing a returned line restarts its indent at 0 (pool stores no level)', () => {
		const indented = indentLine(
			indentLine(
				indentLine(placeFromPool(initialArrangement(['a']), 'a', 0), 'a'),
				'a',
			),
			'a',
		);
		expect(placeFromPool(returnToPool(indented, 'a'), 'a', 0).solution).toEqual(
			[{ id: 'a', indent: 0 }],
		);
	});
});

describe('indentLine / outdentLine', () => {
	it('increments the indent of a placed line', () => {
		expect(indentLine(arrange([], [['a', 1]]), 'a').solution[0]).toEqual({
			id: 'a',
			indent: 2,
		});
	});

	it('decrements the indent of a placed line', () => {
		expect(outdentLine(arrange([], [['a', 2]]), 'a').solution[0]).toEqual({
			id: 'a',
			indent: 1,
		});
	});

	it('floors outdent at 0', () => {
		expect(outdentLine(arrange([], [['a', 0]]), 'a').solution[0]).toEqual({
			id: 'a',
			indent: 0,
		});
	});

	it('only changes the targeted line', () => {
		expect(
			indentLine(
				arrange(
					[],
					[
						['a', 0],
						['b', 0],
					],
				),
				'b',
			).solution,
		).toEqual([
			{ id: 'a', indent: 0 },
			{ id: 'b', indent: 1 },
		]);
	});

	it('indent is a no-op (same ref) when the id is not placed', () => {
		const start = arrange(['a'], []);
		expect(indentLine(start, 'a')).toBe(start);
	});

	it('outdent is a no-op (same ref) when the id is not placed', () => {
		const start = arrange(['a'], []);
		expect(outdentLine(start, 'a')).toBe(start);
	});
});

describe('Invariant — partition preserved across a sequence of ops', () => {
	it('keeps every id in exactly one of pool / solution', () => {
		const shuffledAbout = returnToPool(
			reorderWithinSolution(
				indentLine(
					placeFromPool(
						placeFromPool(initialArrangement(['a', 'b', 'c']), 'b', 0),
						'a',
						0,
					),
					'a',
				),
				'b',
				0,
			),
			'a',
		);
		expect(
			[
				...shuffledAbout.pool,
				...shuffledAbout.solution.map((placed) => placed.id),
			].toSorted((left, right) => left.localeCompare(right)),
		).toEqual(['a', 'b', 'c']);
	});
});
