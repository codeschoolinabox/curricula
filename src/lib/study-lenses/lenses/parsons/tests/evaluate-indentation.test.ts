// cspell:ignore distractor

import { describe, expect, it } from 'vitest';

import evaluateIndentation from '../lib/evaluate-indentation.js';

function placed(
	...entries: ReadonlyArray<[string, number]>
): ReadonlyArray<{ id: string; indent: number }> {
	return entries.map(([id, indent]) => ({ id, indent }));
}

describe('evaluateIndentation', () => {
	describe('Zero — nothing order-correct to grade', () => {
		it('returns an empty map when matchedModelIndex is empty', () => {
			expect([
				...evaluateIndentation(placed(['p0', 0]), new Map(), [0, 1]),
			]).toEqual([]);
		});
	});

	describe('One', () => {
		it('marks a line correct when its level matches the model', () => {
			expect(
				evaluateIndentation(placed(['p0', 1]), new Map([['p0', 0]]), [1]).get(
					'p0',
				),
			).toBe('correct');
		});

		it('marks a line wrong-indent when its level differs from the model', () => {
			expect(
				evaluateIndentation(placed(['p0', 0]), new Map([['p0', 0]]), [1]).get(
					'p0',
				),
			).toBe('wrong-indent');
		});
	});

	describe('Many — mixed correct / wrong', () => {
		it('grades each order-correct line independently against its model level', () => {
			expect([
				...evaluateIndentation(
					placed(['p0', 0], ['p1', 2], ['p2', 0]),
					new Map([
						['p0', 0],
						['p1', 1],
						['p2', 2],
					]),
					[0, 1, 0],
				),
			]).toEqual([
				['p0', 'correct'],
				['p1', 'wrong-indent'],
				['p2', 'correct'],
			]);
		});

		it('routes each line via matchedModelIndex, NOT placed position', () => {
			expect([
				...evaluateIndentation(
					placed(['p0', 1], ['p1', 2], ['p2', 0]),
					new Map([
						['p0', 2],
						['p1', 0],
						['p2', 1],
					]),
					[2, 0, 1],
				),
			]).toEqual([
				['p0', 'correct'],
				['p1', 'correct'],
				['p2', 'correct'],
			]);
		});

		it('accepts a matching level at deeper nesting (2)', () => {
			expect(
				evaluateIndentation(
					placed(['p0', 0], ['p1', 1], ['p2', 2]),
					new Map([
						['p0', 0],
						['p1', 1],
						['p2', 2],
					]),
					[0, 1, 2],
				).get('p2'),
			).toBe('correct');
		});

		it('flags a shallow level against a deeper model (1 vs 2)', () => {
			expect(
				evaluateIndentation(
					placed(['p0', 0], ['p1', 1], ['p2', 1]),
					new Map([
						['p0', 0],
						['p1', 1],
						['p2', 2],
					]),
					[0, 1, 2],
				).get('p2'),
			).toBe('wrong-indent');
		});
	});

	describe('Boundaries — duplicate lines graded at their own matched depth', () => {
		it('grades the second copy of a duplicate against ITS model index, not the first', () => {
			expect([
				...evaluateIndentation(
					placed(['p0', 0], ['p1', 1], ['p2', 1]),
					new Map([
						['p0', 0],
						['p1', 1],
						['p2', 2],
					]),
					[0, 1, 1],
				),
			]).toEqual([
				['p0', 'correct'],
				['p1', 'correct'],
				['p2', 'correct'],
			]);
		});

		it('flags the second duplicate copy when the learner indents it like the first', () => {
			expect(
				evaluateIndentation(
					placed(['p0', 0], ['p1', 1], ['p2', 0]),
					new Map([
						['p0', 0],
						['p1', 1],
						['p2', 2],
					]),
					[0, 1, 1],
				).get('p2'),
			).toBe('wrong-indent');
		});
	});

	describe('Interfaces / Exceptions', () => {
		it('only grades ids present in matchedModelIndex (skips wrong-order / distractor lines)', () => {
			expect([
				...evaluateIndentation(
					placed(['p0', 0], ['p1', 5], ['p2', 1]),
					new Map([
						['p0', 0],
						['p2', 1],
					]),
					[0, 1],
				).keys(),
			]).toEqual(['p0', 'p2']);
		});

		it('treats a model IndentationError sentinel (-1) as wrong-indent for learner level 0', () => {
			expect(
				evaluateIndentation(placed(['p0', 0]), new Map([['p0', 0]]), [-1]).get(
					'p0',
				),
			).toBe('wrong-indent');
		});

		it('treats a model IndentationError sentinel (-1) as wrong-indent for a non-zero learner level', () => {
			expect(
				evaluateIndentation(placed(['p0', 2]), new Map([['p0', 0]]), [-1]).get(
					'p0',
				),
			).toBe('wrong-indent');
		});

		it('treats an out-of-range matched index as wrong-indent (defensive; caller normally guarantees range)', () => {
			expect(
				evaluateIndentation(
					placed(['p0', 0]),
					new Map([['p0', 5]]),
					[0, 1],
				).get('p0'),
			).toBe('wrong-indent');
		});

		it('treats a matched id missing from learnerIndents as wrong-indent (defensive)', () => {
			expect(
				evaluateIndentation(placed(), new Map([['p0', 0]]), [0]).get('p0'),
			).toBe('wrong-indent');
		});

		it('treats BOTH a missing id AND an out-of-range index as wrong-indent (undefined === undefined must not read correct)', () => {
			expect(
				evaluateIndentation(placed(), new Map([['p0', 5]]), []).get('p0'),
			).toBe('wrong-indent');
		});
	});
});
