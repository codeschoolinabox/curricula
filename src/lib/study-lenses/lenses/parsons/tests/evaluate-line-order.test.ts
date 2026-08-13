// cspell:ignore distractor distractors misordered pzzz

import { describe, expect, it } from 'vitest';

import evaluateLineOrder from '../lib/evaluate-line-order.js';
import type { PlacedCode } from '../types.js';

function placedCode(id: string, code: string): PlacedCode {
	return { id, code };
}

describe('evaluateLineOrder', () => {
	describe('Zero — nothing placed', () => {
		it('returns an empty order map for an empty arrangement', () => {
			expect(Array.from(evaluateLineOrder([], ['a', 'b']).order)).toEqual([]);
		});

		it('returns an empty matchedModelIndex for an empty arrangement', () => {
			expect(
				Array.from(evaluateLineOrder([], ['a', 'b']).matchedModelIndex),
			).toEqual([]);
		});
	});

	describe('One', () => {
		it('marks a single correctly-placed solution line correct with model index 0', () => {
			const result = evaluateLineOrder([placedCode('p0', 'a')], ['a']);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({ order: [['p0', 'correct']], matched: [['p0', 0]] });
		});

		it('marks a line whose code is not in the model as a distractor with no matched index', () => {
			const result = evaluateLineOrder([placedCode('p0', 'zzz')], ['a']);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({ order: [['p0', 'distractor']], matched: [] });
		});
	});

	describe('Many — order grading', () => {
		it('marks every line correct when placed in model order', () => {
			const result = evaluateLineOrder(
				[placedCode('p0', 'a'), placedCode('p1', 'b'), placedCode('p2', 'c')],
				['a', 'b', 'c'],
			);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({
				order: [
					['p0', 'correct'],
					['p1', 'correct'],
					['p2', 'correct'],
				],
				matched: [
					['p0', 0],
					['p1', 1],
					['p2', 2],
				],
			});
		});

		it('flags the minimal set to move for an out-of-order arrangement [b,a,c]', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[
							placedCode('p0', 'b'),
							placedCode('p1', 'a'),
							placedCode('p2', 'c'),
						],
						['a', 'b', 'c'],
					).order,
				),
			).toEqual([
				['p0', 'correct'],
				['p1', 'wrong-order'],
				['p2', 'correct'],
			]);
		});

		it('a wrong-order line carries no matched model index (indent not surfaced)', () => {
			expect(
				evaluateLineOrder(
					[placedCode('p0', 'b'), placedCode('p1', 'a'), placedCode('p2', 'c')],
					['a', 'b', 'c'],
				).matchedModelIndex.has('p1'),
			).toBe(false);
		});
	});

	describe('Boundaries — distractors interleaved, duplicates interchangeable', () => {
		it('flags an interleaved distractor while the solution lines stay correct', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[
							placedCode('p0', 'a'),
							placedCode('pd', 'zzz'),
							placedCode('p2', 'b'),
						],
						['a', 'b'],
					).order,
				),
			).toEqual([
				['p0', 'correct'],
				['pd', 'distractor'],
				['p2', 'correct'],
			]);
		});

		it('flags all lines as distractors when the model is empty', () => {
			expect(
				Array.from(
					evaluateLineOrder([placedCode('p0', 'a'), placedCode('p1', 'b')], [])
						.order,
				),
			).toEqual([
				['p0', 'distractor'],
				['p1', 'distractor'],
			]);
		});

		it('flags all lines as distractors when none appear in the model (LIS runs on empty input)', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[placedCode('p0', 'zzz'), placedCode('p1', 'yyy')],
						['a', 'b'],
					).order,
				),
			).toEqual([
				['p0', 'distractor'],
				['p1', 'distractor'],
			]);
		});

		it('handles two interleaved distractors, keeping solution lines correct in placed order', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[
							placedCode('p0', 'a'),
							placedCode('d1', 'zzz'),
							placedCode('d2', 'yyy'),
							placedCode('p1', 'b'),
						],
						['a', 'b'],
					).order,
				),
			).toEqual([
				['p0', 'correct'],
				['d1', 'distractor'],
				['d2', 'distractor'],
				['p1', 'correct'],
			]);
		});

		it('flags the FIRST line to move for [c,a,b] vs [a,b,c]', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[
							placedCode('p0', 'c'),
							placedCode('p1', 'a'),
							placedCode('p2', 'b'),
						],
						['a', 'b', 'c'],
					).order,
				),
			).toEqual([
				['p0', 'wrong-order'],
				['p1', 'correct'],
				['p2', 'correct'],
			]);
		});

		it('treats duplicate lines as interchangeable: [x,y,x] in model order is all correct, each at its own model index', () => {
			const result = evaluateLineOrder(
				[placedCode('p0', 'x'), placedCode('p1', 'y'), placedCode('p2', 'x')],
				['x', 'y', 'x'],
			);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({
				order: [
					['p0', 'correct'],
					['p1', 'correct'],
					['p2', 'correct'],
				],
				matched: [
					['p0', 0],
					['p1', 1],
					['p2', 2],
				],
			});
		});

		it('flags a misordered duplicate: [x,x,y] against model [x,y,x]', () => {
			const result = evaluateLineOrder(
				[placedCode('p0', 'x'), placedCode('p1', 'x'), placedCode('p2', 'y')],
				['x', 'y', 'x'],
			);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({
				order: [
					['p0', 'correct'],
					['p1', 'wrong-order'],
					['p2', 'correct'],
				],
				matched: [
					['p0', 0],
					['p2', 1],
				],
			});
		});

		it('matches a same-code distractor as a solution duplicate (by-design, code-based matching)', () => {
			expect(
				Array.from(
					evaluateLineOrder(
						[
							placedCode('px', 'x'),
							placedCode('pd', 'x'),
							placedCode('pzzz', 'yyy'),
						],
						['x'],
					).order,
				),
			).toEqual([
				['px', 'correct'],
				['pd', 'wrong-order'],
				['pzzz', 'distractor'],
			]);
		});
	});

	describe('Exceptions — extra duplicate beyond the model count', () => {
		it('flags an extra copy when the learner places more than the model has', () => {
			const result = evaluateLineOrder(
				[placedCode('p0', 'x'), placedCode('p1', 'x')],
				['x'],
			);
			expect({
				order: Array.from(result.order),
				matched: Array.from(result.matchedModelIndex),
			}).toEqual({
				order: [
					['p0', 'correct'],
					['p1', 'wrong-order'],
				],
				matched: [['p0', 0]],
			});
		});
	});
});
