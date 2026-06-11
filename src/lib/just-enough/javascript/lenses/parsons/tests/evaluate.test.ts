/**
 * Unit tests for `buildEvaluation` — the Check composition (no jsdom). Builds
 * arrangements + parsed models by hand so every per-line state, the precedence,
 * the `canIndent` gate, and the score/success formula are pinned precisely
 * (without fiddly drag simulation — that wiring is the component test's job).
 *
 * Order-grading (LIS) and indent-grading internals are covered in
 * `evaluate-line-order.test.ts` / `evaluate-indentation.test.ts`; here we verify
 * the COMPOSITION resolves their verdicts into the canonical `CorrectnessMap` +
 * aggregates. Cases that exercise order use placements whose LIS outcome is
 * unambiguous (a single, unique longest increasing subsequence).
 */

import { describe, expect, it } from 'vitest';

import buildEvaluation from '../lib/evaluate.js';
import type { Arrangement, ParsedParsons } from '../types.js';

/** Build a ParsedParsons from `[code, modelIndent]` solution lines + distractor codes. */
function makeParsed(
	solution: Array<[string, number]>,
	distractors: string[] = [],
): ParsedParsons {
	return {
		solution: solution.map(([code, indent], i) => ({
			id: `s${i}`,
			code,
			indent,
			distractor: false,
		})),
		distractors: distractors.map((code, i) => ({
			id: `d${i}`,
			code,
			indent: -1,
			distractor: true,
		})),
		pool: [], // unused by buildEvaluation
		hints: [], // unused by buildEvaluation
	};
}

/** Build an Arrangement from placed `[id, indent]` and the pool ids. */
function arrange(
	solution: Array<[string, number]>,
	pool: string[] = [],
): Arrangement {
	return {
		pool,
		solution: solution.map(([id, indent]) => ({ id, indent })),
	};
}

describe('buildEvaluation — Check composition', () => {
	describe('Zero — empty', () => {
		it('empty model + empty arrangement is vacuously complete (score 100, success)', () => {
			const result = buildEvaluation(arrange([]), makeParsed([]), true);
			expect(result.correctnessMap.size).toBe(0);
			expect(result.total).toBe(0);
			expect(result.correct).toBe(0);
			expect(result.score).toBe(100);
			expect(result.success).toBe(true);
		});

		it('non-empty model with nothing placed marks every solution line unplaced (score 0)', () => {
			const result = buildEvaluation(
				arrange([], ['s0', 's1']),
				makeParsed([
					['a', 0],
					['b', 0],
				]),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('unplaced');
			expect(result.correctnessMap.get('s1')).toBe('unplaced');
			expect(result.total).toBe(2);
			expect(result.correct).toBe(0);
			expect(result.score).toBe(0);
			expect(result.success).toBe(false);
		});
	});

	describe('One/Many — fully correct', () => {
		it('all lines in order at the right indent are correct (score 100, success)', () => {
			const result = buildEvaluation(
				arrange([
					['s0', 0],
					['s1', 1],
				]),
				makeParsed([
					['a', 0],
					['b', 1],
				]),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.get('s1')).toBe('correct');
			expect(result.total).toBe(2);
			expect(result.correct).toBe(2);
			expect(result.score).toBe(100);
			expect(result.success).toBe(true);
		});
	});

	describe('wrong-indent (only when canIndent)', () => {
		const model = (): ParsedParsons =>
			makeParsed([
				['a', 0],
				['b', 1],
			]);
		// b placed at indent 0 instead of model 1.
		const placed = (): Arrangement =>
			arrange([
				['s0', 0],
				['s1', 0],
			]);

		it('flags an order-correct line whose indent differs from the model', () => {
			const result = buildEvaluation(placed(), model(), true);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.get('s1')).toBe('wrong-indent');
			expect(result.total).toBe(2);
			expect(result.correct).toBe(1);
			expect(result.score).toBe(50);
			expect(result.success).toBe(false);
		});

		it('IGNORES indent entirely when canIndent is false (both correct)', () => {
			const result = buildEvaluation(placed(), model(), false);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.get('s1')).toBe('correct');
			expect(result.correct).toBe(2);
			expect(result.score).toBe(100);
			expect(result.success).toBe(true);
		});
	});

	describe('distractor', () => {
		it('flags a distractor placed in the solution; it never counts as correct and fails success', () => {
			// model [a]; distractor [x]; both placed.
			const result = buildEvaluation(
				arrange([
					['s0', 0],
					['d0', 0],
				]),
				makeParsed([['a', 0]], ['x']),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.get('d0')).toBe('distractor');
			expect(result.total).toBe(1); // distractors excluded from total
			expect(result.correct).toBe(1);
			// score is 100 (the one solution line is correct) but success is FALSE
			// because a distractor occupies the solution.
			expect(result.score).toBe(100);
			expect(result.success).toBe(false);
		});

		it('success is TRUE when distractors are declared but all stay in the pool', () => {
			// Triangulation: an impl that gates success on `parsed.distractors.length
			// === 0` (rather than "no distractor in the SOLUTION") would wrongly fail
			// here. A pool distractor is correct-by-omission and must NOT appear in
			// the correctnessMap (only unplaced SOLUTION lines do).
			const result = buildEvaluation(
				arrange([['s0', 0]], ['d0']), // distractor d0 left in the pool
				makeParsed([['a', 0]], ['x']),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.has('d0')).toBe(false); // not graded
			expect(result.total).toBe(1);
			expect(result.correct).toBe(1);
			expect(result.score).toBe(100);
			expect(result.success).toBe(true);
		});
	});

	describe('unplaced', () => {
		it('marks a solution line left in the pool as unplaced (counts toward total)', () => {
			const result = buildEvaluation(
				arrange([['s0', 0]], ['s1']),
				makeParsed([
					['a', 0],
					['b', 0],
				]),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('correct');
			expect(result.correctnessMap.get('s1')).toBe('unplaced');
			expect(result.total).toBe(2);
			expect(result.correct).toBe(1);
			expect(result.score).toBe(50);
			expect(result.success).toBe(false);
		});
	});

	describe('wrong-order', () => {
		it('flags the minimal lines to move (LIS) and rounds the score', () => {
			// model [a,b,c]; placed [b,c,a] -> positions [1,2,0]; LIS [1,2] is unique,
			// so only a (placed last) is wrong-order.
			const result = buildEvaluation(
				arrange([
					['s1', 0],
					['s2', 0],
					['s0', 0],
				]),
				makeParsed([
					['a', 0],
					['b', 0],
					['c', 0],
				]),
				true,
			);
			expect(result.correctnessMap.get('s1')).toBe('correct');
			expect(result.correctnessMap.get('s2')).toBe('correct');
			expect(result.correctnessMap.get('s0')).toBe('wrong-order');
			expect(result.total).toBe(3);
			expect(result.correct).toBe(2);
			expect(result.score).toBe(67); // round(2 / 3 * 100)
			expect(result.success).toBe(false);
		});

		it('rounds a 1-of-3 score to 33 (with the 67 case, pins Math.round vs floor/ceil)', () => {
			// Fully reversed [c,b,a] -> positions [2,1,0]; LIS length 1, so exactly
			// one line is order-correct (which one is a lis tie-break, not asserted)
			// and two are wrong-order. correct 1 / total 3 -> round(33.33) = 33
			// (Math.floor agrees at 33, but Math.ceil would give 34 -> caught).
			const result = buildEvaluation(
				arrange([
					['s2', 0],
					['s1', 0],
					['s0', 0],
				]),
				makeParsed([
					['a', 0],
					['b', 0],
					['c', 0],
				]),
				true,
			);
			expect(result.total).toBe(3);
			expect(result.correct).toBe(1);
			expect(result.score).toBe(33);
			expect(result.success).toBe(false);
		});

		it('precedence: a misordered line with a wrong indent is wrong-order, NOT wrong-indent', () => {
			// Same [b,c,a] placement, but a's model indent is 2 and it is placed at 0.
			// a is wrong-order, so its indent is never evaluated (it must move first).
			const result = buildEvaluation(
				arrange([
					['s1', 0],
					['s2', 0],
					['s0', 0],
				]),
				makeParsed([
					['a', 2],
					['b', 0],
					['c', 0],
				]),
				true,
			);
			expect(result.correctnessMap.get('s0')).toBe('wrong-order');
		});
	});
});
