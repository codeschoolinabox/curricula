import { describe, expect, it } from 'vitest';

import evaluateIndentation from '../lib/evaluate-indentation.js';

const placed = (
	...entries: ReadonlyArray<[string, number]>
): ReadonlyArray<{ id: string; indent: number }> =>
	entries.map(([id, indent]) => ({ id, indent }));

describe('evaluateIndentation', () => {
	describe('Zero — nothing order-correct to grade', () => {
		it('returns an empty map when matchedModelIndex is empty', () => {
			const result = evaluateIndentation(placed(['p0', 0]), new Map(), [0, 1]);
			expect([...result]).toEqual([]);
		});
	});

	describe('One', () => {
		it('marks a line correct when its level matches the model', () => {
			const result = evaluateIndentation(
				placed(['p0', 1]),
				new Map([['p0', 0]]),
				[1],
			);
			expect(result.get('p0')).toBe('correct');
		});

		it('marks a line wrong-indent when its level differs from the model', () => {
			const result = evaluateIndentation(
				placed(['p0', 0]),
				new Map([['p0', 0]]),
				[1],
			);
			expect(result.get('p0')).toBe('wrong-indent');
		});
	});

	describe('Many — mixed correct / wrong', () => {
		it('grades each order-correct line independently against its model level', () => {
			// model levels [0,1,0]; learner gave [0,2,0] -> middle line wrong.
			const result = evaluateIndentation(
				placed(['p0', 0], ['p1', 2], ['p2', 0]),
				new Map([
					['p0', 0],
					['p1', 1],
					['p2', 2],
				]),
				[0, 1, 0],
			);
			expect(result.get('p0')).toBe('correct');
			expect(result.get('p1')).toBe('wrong-indent');
			expect(result.get('p2')).toBe('correct');
		});

		it('routes each line via matchedModelIndex, NOT placed position', () => {
			// Non-identity mapping: p0->model 2 (lvl 1), p1->model 0 (lvl 2),
			// p2->model 1 (lvl 0). Learner [1,2,0] matches each ASSIGNED level, so
			// all correct. A positional-zip impl (learner[i] vs modelIndents[i])
			// would compare 1 vs 2 and flag p0 wrong — this test breaks that.
			const result = evaluateIndentation(
				placed(['p0', 1], ['p1', 2], ['p2', 0]),
				new Map([
					['p0', 2],
					['p1', 0],
					['p2', 1],
				]),
				[2, 0, 1],
			);
			expect(result.get('p0')).toBe('correct');
			expect(result.get('p1')).toBe('correct');
			expect(result.get('p2')).toBe('correct');
		});

		it('compares equality at deeper nesting levels (2)', () => {
			const result = evaluateIndentation(
				placed(['p0', 0], ['p1', 1], ['p2', 2]),
				new Map([
					['p0', 0],
					['p1', 1],
					['p2', 2],
				]),
				[0, 1, 2],
			);
			expect(result.get('p2')).toBe('correct');
			const wrong = evaluateIndentation(
				placed(['p0', 0], ['p1', 1], ['p2', 1]),
				new Map([
					['p0', 0],
					['p1', 1],
					['p2', 2],
				]),
				[0, 1, 2],
			);
			expect(wrong.get('p2')).toBe('wrong-indent');
		});
	});

	describe('Boundaries — duplicate lines graded at their own matched depth', () => {
		it('grades the second copy of a duplicate against ITS model index, not the first', () => {
			// model: x@0 (depth 0), y@1 (depth 1), x@2 (depth 1).
			// The second x (p2) matched model index 2, whose level is 1 — so a
			// learner indent of 1 is correct for it even though the first x is 0.
			const result = evaluateIndentation(
				placed(['p0', 0], ['p1', 1], ['p2', 1]),
				new Map([
					['p0', 0],
					['p1', 1],
					['p2', 2],
				]),
				[0, 1, 1],
			);
			expect(result.get('p0')).toBe('correct');
			expect(result.get('p1')).toBe('correct');
			expect(result.get('p2')).toBe('correct');
		});

		it('flags the second duplicate copy when the learner indents it like the first', () => {
			// same model; learner gives the second x indent 0 (like the first x),
			// but model index 2 expects level 1 -> wrong-indent.
			const result = evaluateIndentation(
				placed(['p0', 0], ['p1', 1], ['p2', 0]),
				new Map([
					['p0', 0],
					['p1', 1],
					['p2', 2],
				]),
				[0, 1, 1],
			);
			expect(result.get('p0')).toBe('correct');
			expect(result.get('p1')).toBe('correct');
			expect(result.get('p2')).toBe('wrong-indent');
		});
	});

	describe('Interfaces / Exceptions', () => {
		it('only grades ids present in matchedModelIndex (skips wrong-order / distractor lines)', () => {
			// p1 is not order-correct (absent from matchedModelIndex) -> not graded.
			const result = evaluateIndentation(
				placed(['p0', 0], ['p1', 5], ['p2', 1]),
				new Map([
					['p0', 0],
					['p2', 1],
				]),
				[0, 1],
			);
			expect(result.has('p1')).toBe(false);
			expect([...result.keys()]).toEqual(['p0', 'p2']);
		});

		it('treats a model IndentationError sentinel (-1) as wrong-indent for any learner level', () => {
			// model line 0 has unresolved indent (-1); learner can only produce >=0.
			expect(
				evaluateIndentation(placed(['p0', 0]), new Map([['p0', 0]]), [-1]).get(
					'p0',
				),
			).toBe('wrong-indent');
			// also wrong for a non-zero learner level (the sentinel is never matched).
			expect(
				evaluateIndentation(placed(['p0', 2]), new Map([['p0', 0]]), [-1]).get(
					'p0',
				),
			).toBe('wrong-indent');
		});

		it('treats an out-of-range matched index as wrong-indent (defensive; caller normally guarantees range)', () => {
			const result = evaluateIndentation(
				placed(['p0', 0]),
				new Map([['p0', 5]]),
				[0, 1],
			);
			expect(result.get('p0')).toBe('wrong-indent');
		});

		it('treats a matched id missing from learnerIndents as wrong-indent (defensive)', () => {
			// order-correct lines are always placed, so this is unreachable in
			// production; the function degrades to wrong-indent rather than throw.
			const result = evaluateIndentation(placed(), new Map([['p0', 0]]), [0]);
			expect(result.get('p0')).toBe('wrong-indent');
		});

		it('treats BOTH a missing id AND an out-of-range index as wrong-indent (not correct)', () => {
			// undefined learner level AND undefined expected level: `undefined ===
			// undefined` must NOT coincide to 'correct'. Guards both sides.
			const result = evaluateIndentation(placed(), new Map([['p0', 5]]), []);
			expect(result.get('p0')).toBe('wrong-indent');
		});
	});
});
