import { describe, expect, it } from 'vitest';

import {
	evaluateLineOrder,
	type PlacedCode,
} from '../lib/evaluate-line-order.js';

const p = (id: string, code: string): PlacedCode => ({ id, code });

describe('evaluateLineOrder', () => {
	describe('Zero — nothing placed', () => {
		it('returns empty maps for an empty arrangement', () => {
			const result = evaluateLineOrder([], ['a', 'b']);
			expect([...result.order]).toEqual([]);
			expect([...result.matchedModelIndex]).toEqual([]);
		});
	});

	describe('One', () => {
		it('marks a single correctly-placed solution line correct with model index 0', () => {
			const result = evaluateLineOrder([p('p0', 'a')], ['a']);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.matchedModelIndex.get('p0')).toBe(0);
		});

		it('marks a line whose code is not in the model as a distractor', () => {
			const result = evaluateLineOrder([p('p0', 'zzz')], ['a']);
			expect(result.order.get('p0')).toBe('distractor');
			expect(result.matchedModelIndex.has('p0')).toBe(false);
		});
	});

	describe('Many — order grading', () => {
		it('marks every line correct when placed in model order', () => {
			const result = evaluateLineOrder(
				[p('p0', 'a'), p('p1', 'b'), p('p2', 'c')],
				['a', 'b', 'c'],
			);
			expect([...result.order.values()]).toEqual([
				'correct',
				'correct',
				'correct',
			]);
			expect(result.matchedModelIndex.get('p0')).toBe(0);
			expect(result.matchedModelIndex.get('p1')).toBe(1);
			expect(result.matchedModelIndex.get('p2')).toBe(2);
		});

		it('flags the minimal set to move for an out-of-order arrangement [b,a,c]', () => {
			// model positions [1,0,2]; LIS is [1,2] (b,c); the misplaced 'a' moves.
			const result = evaluateLineOrder(
				[p('p0', 'b'), p('p1', 'a'), p('p2', 'c')],
				['a', 'b', 'c'],
			);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.order.get('p1')).toBe('wrong-order');
			expect(result.order.get('p2')).toBe('correct');
			// wrong-order lines carry no matched model index (indent not surfaced).
			expect(result.matchedModelIndex.has('p1')).toBe(false);
		});
	});

	describe('Boundaries — distractors interleaved, duplicates interchangeable', () => {
		it('flags an interleaved distractor while the solution lines stay correct', () => {
			const result = evaluateLineOrder(
				[p('p0', 'a'), p('pd', 'zzz'), p('p2', 'b')],
				['a', 'b'],
			);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.order.get('pd')).toBe('distractor');
			expect(result.order.get('p2')).toBe('correct');
			expect(result.matchedModelIndex.has('pd')).toBe(false);
		});

		it('flags all lines as distractors when the model is empty', () => {
			const result = evaluateLineOrder([p('p0', 'a'), p('p1', 'b')], []);
			expect(result.order.get('p0')).toBe('distractor');
			expect(result.order.get('p1')).toBe('distractor');
			expect([...result.matchedModelIndex]).toEqual([]);
		});

		it('flags all lines as distractors when none appear in the model', () => {
			// every placed line filtered out -> LIS runs on the empty array.
			const result = evaluateLineOrder(
				[p('p0', 'zzz'), p('p1', 'yyy')],
				['a', 'b'],
			);
			expect(result.order.get('p0')).toBe('distractor');
			expect(result.order.get('p1')).toBe('distractor');
		});

		it('handles two interleaved distractors, keeping solution lines correct', () => {
			// the LIS input is built only from non-distractor lines, so the
			// distractor positions must be skipped cleanly (index offset).
			const result = evaluateLineOrder(
				[p('p0', 'a'), p('d1', 'zzz'), p('d2', 'yyy'), p('p1', 'b')],
				['a', 'b'],
			);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.order.get('d1')).toBe('distractor');
			expect(result.order.get('d2')).toBe('distractor');
			expect(result.order.get('p1')).toBe('correct');
			// the order map iterates in PLACED order, not distractors-first.
			expect([...result.order.keys()]).toEqual(['p0', 'd1', 'd2', 'p1']);
		});

		it('flags the FIRST line to move for [c,a,b] vs [a,b,c]', () => {
			// positions [2,0,1]; best LIS [0,1]; inverse [0] -> p0 (c) moves.
			const result = evaluateLineOrder(
				[p('p0', 'c'), p('p1', 'a'), p('p2', 'b')],
				['a', 'b', 'c'],
			);
			expect(result.order.get('p0')).toBe('wrong-order');
			expect(result.order.get('p1')).toBe('correct');
			expect(result.order.get('p2')).toBe('correct');
		});

		it('treats duplicate lines as interchangeable: [x,y,x] in model order is all correct', () => {
			// model has 'x' twice; placing x,y,x (any ids) matches model positions
			// 0,1,2 via the next-unused walk — no penalty for "which copy". The
			// SECOND x must advance to model index 2, not reuse 0 (load-bearing
			// for evaluate-indentation, which grades duplicates at their depth).
			const result = evaluateLineOrder(
				[p('p0', 'x'), p('p1', 'y'), p('p2', 'x')],
				['x', 'y', 'x'],
			);
			expect([...result.order.values()]).toEqual([
				'correct',
				'correct',
				'correct',
			]);
			expect(result.matchedModelIndex.get('p0')).toBe(0);
			expect(result.matchedModelIndex.get('p1')).toBe(1);
			expect(result.matchedModelIndex.get('p2')).toBe(2);
		});

		it('flags a misordered duplicate: [x,x,y] against model [x,y,x]', () => {
			// walk: x->0, x->2, y->1 => positions [0,2,1]; LIS [0,1] keeps p0,p2;
			// the second x (p1) is the one to move.
			const result = evaluateLineOrder(
				[p('p0', 'x'), p('p1', 'x'), p('p2', 'y')],
				['x', 'y', 'x'],
			);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.order.get('p1')).toBe('wrong-order');
			expect(result.order.get('p2')).toBe('correct');
			expect(result.matchedModelIndex.get('p0')).toBe(0);
			expect(result.matchedModelIndex.get('p2')).toBe(1);
		});

		it('matches a same-code distractor as a solution duplicate (by-design, code-based)', () => {
			// 'x' is in the model; a learner line tagged distractor but with code
			// 'x' is matched as a duplicate, not flagged. The true distractor
			// ('yyy') is flagged. Documents the code-based matching contract.
			const result = evaluateLineOrder(
				[p('px', 'x'), p('pd', 'x'), p('pzzz', 'yyy')],
				['x'],
			);
			expect(result.order.get('px')).toBe('correct');
			expect(result.order.get('pd')).toBe('wrong-order');
			expect(result.order.get('pzzz')).toBe('distractor');
		});
	});

	describe('Exceptions — extra duplicate beyond the model count', () => {
		it('flags an extra copy when the learner places more than the model has', () => {
			// model has one 'x'; learner placed it twice. The exhausted second
			// copy reuses the last model position (0), so LIS flags it to move.
			const result = evaluateLineOrder([p('p0', 'x'), p('p1', 'x')], ['x']);
			expect(result.order.get('p0')).toBe('correct');
			expect(result.order.get('p1')).toBe('wrong-order');
			expect(result.matchedModelIndex.has('p1')).toBe(false);
		});
	});
});
