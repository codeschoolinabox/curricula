// cspell:ignore distractor distractors misordered

import { describe, expect, it } from 'vitest';

import buildEvaluation from '../lib/evaluate.js';
import type { Arrangement, EvaluationResult, ParsedParsons } from '../types.js';

function makeParsed(
	solution: Array<[string, number]>,
	distractors: string[] = [],
): ParsedParsons {
	return {
		solution: solution.map(([code, indent], index) => ({
			id: `s${index}`,
			code,
			indent,
			distractor: false,
		})),
		distractors: distractors.map((code, index) => ({
			id: `d${index}`,
			code,
			indent: -1,
			distractor: true,
		})),
		pool: [],
		hints: [],
	};
}

function arrange(
	solution: Array<[string, number]>,
	pool: string[] = [],
): Arrangement {
	return {
		pool,
		solution: solution.map(([id, indent]) => ({ id, indent })),
	};
}

function aggregates(result: EvaluationResult): {
	total: number;
	correct: number;
	score: number;
	success: boolean;
} {
	return {
		total: result.total,
		correct: result.correct,
		score: result.score,
		success: result.success,
	};
}

describe('buildEvaluation — Check composition', () => {
	describe('Zero — empty', () => {
		it('empty model + empty arrangement grades no lines', () => {
			expect(
				buildEvaluation(arrange([]), makeParsed([]), true).correctnessMap.size,
			).toBe(0);
		});

		it('empty model + empty arrangement is vacuously complete (score 100, success)', () => {
			expect(
				aggregates(buildEvaluation(arrange([]), makeParsed([]), true)),
			).toEqual({ total: 0, correct: 0, score: 100, success: true });
		});

		it('non-empty model with nothing placed marks every solution line unplaced', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([], ['s0', 's1']),
						makeParsed([
							['a', 0],
							['b', 0],
						]),
						true,
					).correctnessMap,
				),
			).toEqual({ s0: 'unplaced', s1: 'unplaced' });
		});

		it('non-empty model with nothing placed scores 0, not solved', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([], ['s0', 's1']),
						makeParsed([
							['a', 0],
							['b', 0],
						]),
						true,
					),
				),
			).toEqual({ total: 2, correct: 0, score: 0, success: false });
		});
	});

	describe('One/Many — fully correct', () => {
		it('all lines in order at the right indent are correct', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 1],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						true,
					).correctnessMap,
				),
			).toEqual({ s0: 'correct', s1: 'correct' });
		});

		it('a fully correct arrangement scores 100 and is solved', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 1],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						true,
					),
				),
			).toEqual({ total: 2, correct: 2, score: 100, success: true });
		});
	});

	describe('wrong-indent (only when canIndent)', () => {
		it('flags an order-correct line whose indent differs from the model', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 0],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						true,
					).correctnessMap,
				),
			).toEqual({ s0: 'correct', s1: 'wrong-indent' });
		});

		it('a wrong-indent line halves the two-line score', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 0],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						true,
					),
				),
			).toEqual({ total: 2, correct: 1, score: 50, success: false });
		});

		it('IGNORES indent entirely when canIndent is false (both correct)', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 0],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						false,
					).correctnessMap,
				),
			).toEqual({ s0: 'correct', s1: 'correct' });
		});

		it('a flat placement of an indented model scores 100 when canIndent is false', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([
							['s0', 0],
							['s1', 0],
						]),
						makeParsed([
							['a', 0],
							['b', 1],
						]),
						false,
					),
				),
			).toEqual({ total: 2, correct: 2, score: 100, success: true });
		});
	});

	describe('distractor', () => {
		it('flags a distractor placed in the solution', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([
							['s0', 0],
							['d0', 0],
						]),
						makeParsed([['a', 0]], ['x']),
						true,
					).correctnessMap,
				),
			).toEqual({ s0: 'correct', d0: 'distractor' });
		});

		it('a placed distractor fails success even at score 100 (it occupies the solution)', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([
							['s0', 0],
							['d0', 0],
						]),
						makeParsed([['a', 0]], ['x']),
						true,
					),
				),
			).toEqual({ total: 1, correct: 1, score: 100, success: false });
		});

		it('a distractor left in the pool is correct-by-omission and never graded', () => {
			expect(
				buildEvaluation(
					arrange([['s0', 0]], ['d0']),
					makeParsed([['a', 0]], ['x']),
					true,
				).correctnessMap.has('d0'),
			).toBe(false);
		});

		it('a same-code distractor placed alone earns no credit (id guard, not code match)', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([['d0', 0]], ['s0']),
						makeParsed([['x', 0]], ['x']),
						true,
					),
				),
			).toEqual({ total: 1, correct: 0, score: 0, success: false });
		});

		it('a same-code distractor is order-graded as a duplicate copy (wrong-order, not distractor)', () => {
			expect(
				buildEvaluation(
					arrange([
						['s0', 0],
						['d0', 0],
					]),
					makeParsed([['x', 0]], ['x']),
					true,
				).correctnessMap.get('d0'),
			).toBe('wrong-order');
		});

		it('success stays FALSE while a same-code distractor occupies the solution (id-based, not verdict-based)', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([
							['s0', 0],
							['d0', 0],
						]),
						makeParsed([['x', 0]], ['x']),
						true,
					),
				),
			).toEqual({ total: 1, correct: 1, score: 100, success: false });
		});

		it('success is TRUE when declared distractors all stay in the pool', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([['s0', 0]], ['d0']),
						makeParsed([['a', 0]], ['x']),
						true,
					),
				),
			).toEqual({ total: 1, correct: 1, score: 100, success: true });
		});
	});

	describe('unplaced', () => {
		it('marks a solution line left in the pool as unplaced', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
						arrange([['s0', 0]], ['s1']),
						makeParsed([
							['a', 0],
							['b', 0],
						]),
						true,
					).correctnessMap,
				),
			).toEqual({ s0: 'correct', s1: 'unplaced' });
		});

		it('an unplaced solution line counts toward total and halves the score', () => {
			expect(
				aggregates(
					buildEvaluation(
						arrange([['s0', 0]], ['s1']),
						makeParsed([
							['a', 0],
							['b', 0],
						]),
						true,
					),
				),
			).toEqual({ total: 2, correct: 1, score: 50, success: false });
		});
	});

	describe('wrong-order', () => {
		it('flags the minimal lines to move (LIS): only the displaced line in [b,c,a]', () => {
			expect(
				Object.fromEntries(
					buildEvaluation(
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
					).correctnessMap,
				),
			).toEqual({ s1: 'correct', s2: 'correct', s0: 'wrong-order' });
		});

		it('rounds a 2-of-3 score to 67', () => {
			expect(
				aggregates(
					buildEvaluation(
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
					),
				),
			).toEqual({ total: 3, correct: 2, score: 67, success: false });
		});

		it('rounds a 1-of-3 score to 33 (with the 67 case, pins Math.round vs floor/ceil)', () => {
			expect(
				aggregates(
					buildEvaluation(
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
					),
				),
			).toEqual({ total: 3, correct: 1, score: 33, success: false });
		});

		it('precedence: a misordered line with a wrong indent is wrong-order, NOT wrong-indent', () => {
			expect(
				buildEvaluation(
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
				).correctnessMap.get('s0'),
			).toBe('wrong-order');
		});
	});
});
