import { describe, expect, it } from 'vitest';

import evaluateCorrectness from '../lib/evaluate-correctness.js';
import type { Blank, BlankCorrectness } from '../types.js';

const blank = (
	id: string,
	original: string,
	start: number,
	end: number,
	type: Blank['type'] = 'identifier',
): Blank => ({ id, original, type, start, end });

describe('evaluateCorrectness', () => {
	describe('Zero — no blanks', () => {
		it('returns total=0', () => {
			const result = evaluateCorrectness('', [], '');
			expect(result.total).toBe(0);
		});

		it('returns score=100 (vacuously complete) when no blanks', () => {
			const result = evaluateCorrectness('', [], '');
			expect(result.score).toBe(100);
		});

		it('returns empty correctnessMap when no blanks', () => {
			const result = evaluateCorrectness('', [], '');
			expect([...result.correctnessMap]).toEqual([]);
		});
	});

	describe('One — single blank', () => {
		it('marks the blank correct when learner types the original token', () => {
			const result = evaluateCorrectness(
				'let x = 1;', // learner typed 'x' over the blank
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
		});

		it('marks the blank incorrect when learner types a wrong token', () => {
			const result = evaluateCorrectness(
				'let y = 1;', // learner typed 'y' over the 'x' blank
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.correctnessMap.get('b0')).toBe('incorrect');
		});

		it('marks the blank unfilled when the __ placeholder remains', () => {
			const result = evaluateCorrectness(
				'let __ = 1;', // learner has not typed anything
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.correctnessMap.get('b0')).toBe('unfilled');
		});

		it('scores 100 when the only blank is correct', () => {
			const result = evaluateCorrectness(
				'let x = 1;',
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.score).toBe(100);
		});

		it('scores 0 when the only blank is incorrect', () => {
			const result = evaluateCorrectness(
				'let y = 1;',
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.score).toBe(0);
		});
	});

	describe('Many — multiple blanks', () => {
		it('marks each blank independently (mix of correct/incorrect)', () => {
			// originalCode: 'let x = 1; let y = 2;'
			// blanks: 'x' at [4,5), 'y' at [15,16)
			// learnerCode: 'let x = 1; let z = 2;' — x correct, z wrong
			const result = evaluateCorrectness(
				'let x = 1; let z = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
			expect(result.correctnessMap.get('b1')).toBe('incorrect');
		});

		it('fixes the legacy bug: same-token blanks are tracked per-position', () => {
			// Two blanks of the same token 'x'; legacy would mark both correct
			// if 'x' appeared once. Position-aware should distinguish.
			// originalCode: 'let x = x;'  (degenerate; x at [4,5) and [8,9))
			// learnerCode: 'let x = z;' — first correct, second wrong
			const result = evaluateCorrectness(
				'let x = z;',
				[blank('b0', 'x', 4, 5), blank('b1', 'x', 8, 9)],
				'let x = x;',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
			expect(result.correctnessMap.get('b1')).toBe('incorrect');
		});

		it('fixes the legacy bug: substring-containment false positive avoided', () => {
			// Legacy: learnerText.includes('function') would match
			// 'functionPriority' from an unrelated context.
			// originalCode: 'function foo() {}'   blank 'function' at [0,8)
			// learnerCode: 'functionX foo() {}'  — learner typed 'functionX'
			// Legacy would mark correct (substring containment); we want incorrect.
			const result = evaluateCorrectness(
				'functionX foo() {}',
				[blank('b0', 'function', 0, 8, 'keyword')],
				'function foo() {}',
			);
			expect(result.correctnessMap.get('b0')).toBe('incorrect');
		});

		it('counts correct/incorrect/unfilled accurately for mixed blanks', () => {
			// 3 blanks: 1 correct, 1 incorrect, 1 unfilled
			const result = evaluateCorrectness(
				'let x = 1; let z = 2; let __ = 3;',
				[
					blank('b0', 'x', 4, 5),
					blank('b1', 'y', 15, 16),
					blank('b2', 'w', 26, 27),
				],
				'let x = 1; let y = 2; let w = 3;',
			);
			expect(result.correct).toBe(1);
			expect(result.incorrect).toBe(1);
			expect(result.unfilled).toBe(1);
		});

		it('rounds the score correctly for mixed blanks', () => {
			// 3 blanks: 1 correct, 1 incorrect, 1 unfilled
			// score = round(1/3 * 100) = 33
			const result = evaluateCorrectness(
				'let x = 1; let z = 2; let __ = 3;',
				[
					blank('b0', 'x', 4, 5),
					blank('b1', 'y', 15, 16),
					blank('b2', 'w', 26, 27),
				],
				'let x = 1; let y = 2; let w = 3;',
			);
			expect(result.score).toBe(33);
		});
	});

	describe('Boundaries — all-or-none correctness', () => {
		it('scores 100 when every blank is correct', () => {
			const result = evaluateCorrectness(
				'let x = 1; let y = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect(result.score).toBe(100);
		});

		it('scores 0 when every blank is incorrect', () => {
			const result = evaluateCorrectness(
				'let a = 1; let b = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect(result.score).toBe(0);
		});

		it('scores 0 when every blank is unfilled', () => {
			const result = evaluateCorrectness(
				'let __ = 1; let __ = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect(result.score).toBe(0);
		});
	});

	describe('Interfaces — return shape', () => {
		it('total = correct + incorrect + unfilled', () => {
			const result = evaluateCorrectness(
				'let x = 1; let z = 2; let __ = 3;',
				[
					blank('b0', 'x', 4, 5),
					blank('b1', 'y', 15, 16),
					blank('b2', 'w', 26, 27),
				],
				'let x = 1; let y = 2; let w = 3;',
			);
			expect(result.total).toBe(
				result.correct + result.incorrect + result.unfilled,
			);
		});

		it('correctnessMap keys are blank.id values', () => {
			const result = evaluateCorrectness(
				'let x = 1; let y = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect([...result.correctnessMap.keys()].sort()).toEqual(['b0', 'b1']);
		});

		it('returned result is frozen', () => {
			const result = evaluateCorrectness('', [], '');
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('Many — structural variants (leading/trailing/adjacent blanks)', () => {
		it('leading blank correct (zero-length leading anchor)', () => {
			const result = evaluateCorrectness(
				'function foo() {}',
				[blank('b0', 'function', 0, 8, 'keyword')],
				'function foo() {}',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
		});

		it('leading blank unfilled (zero-length leading anchor)', () => {
			const result = evaluateCorrectness(
				'__ foo() {}',
				[blank('b0', 'function', 0, 8, 'keyword')],
				'function foo() {}',
			);
			expect(result.correctnessMap.get('b0')).toBe('unfilled');
		});

		it('trailing blank correct (zero-length trailing anchor)', () => {
			const result = evaluateCorrectness(
				'let x',
				[blank('b0', 'x', 4, 5)],
				'let x',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
		});

		it('trailing blank incorrect (zero-length trailing anchor)', () => {
			const result = evaluateCorrectness(
				'let y',
				[blank('b0', 'x', 4, 5)],
				'let x',
			);
			expect(result.correctnessMap.get('b0')).toBe('incorrect');
		});

		it('adjacent blanks correct (zero-length inter-anchor: i++)', () => {
			const result = evaluateCorrectness(
				'i++',
				[
					blank('b0', 'i', 0, 1, 'identifier'),
					blank('b1', '++', 1, 3, 'operator'),
				],
				'i++',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
			expect(result.correctnessMap.get('b1')).toBe('correct');
		});

		it('adjacent blanks distinguish first-correct/second-incorrect', () => {
			const result = evaluateCorrectness(
				'i--',
				[
					blank('b0', 'i', 0, 1, 'identifier'),
					blank('b1', '++', 1, 3, 'operator'),
				],
				'i++',
			);
			expect(result.correctnessMap.get('b0')).toBe('correct');
			expect(result.correctnessMap.get('b1')).toBe('incorrect');
		});

		it('adjacent blanks length mismatch falls back to unfilled for the group', () => {
			// learner typed 4 chars for a 3-char ('i' + '++') expected group;
			// length-mismatch defensive: both blanks fall back to unfilled.
			const result = evaluateCorrectness(
				'i+++',
				[
					blank('b0', 'i', 0, 1, 'identifier'),
					blank('b1', '++', 1, 3, 'operator'),
				],
				'i++',
			);
			expect(result.correctnessMap.get('b0')).toBe('unfilled');
			expect(result.correctnessMap.get('b1')).toBe('unfilled');
		});
	});

	describe('Boundaries — score formula triangulation', () => {
		it('rounds 2-of-3 correct to 67 (not 66 — distinguishes Math.round from Math.floor)', () => {
			// 2 correct, 1 incorrect; score = round(2/3 * 100) = 67
			const result = evaluateCorrectness(
				'let x = 1; let y = 2; let z = 3;',
				[
					blank('b0', 'x', 4, 5),
					blank('b1', 'y', 15, 16),
					blank('b2', 'w', 26, 27),
				],
				'let x = 1; let y = 2; let w = 3;',
			);
			expect(result.score).toBe(67);
		});
	});

	describe('Exceptions — anchor mismatch defensive', () => {
		it('returns all unfilled when learner edited outside placeholder ranges (single-blank)', () => {
			// Learner corrupted the anchor "let " → "let\t"
			const result = evaluateCorrectness(
				'let\tx = 1;', // changed space to tab
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			const status: BlankCorrectness | undefined =
				result.correctnessMap.get('b0');
			expect(status).toBe('unfilled');
		});

		it('returns all unfilled for multi-blank when ANY anchor fails (all-or-nothing)', () => {
			// First anchor 'let ' matches; second anchor ' = 1; let ' is
			// corrupted to ' = 1;\tlet '. All blanks fall back to unfilled.
			const result = evaluateCorrectness(
				'let x = 1;\tlet y = 2;',
				[blank('b0', 'x', 4, 5), blank('b1', 'y', 15, 16)],
				'let x = 1; let y = 2;',
			);
			expect(result.correctnessMap.get('b0')).toBe('unfilled');
			expect(result.correctnessMap.get('b1')).toBe('unfilled');
		});

		it('returns all unfilled when learnerCode is empty (defensive)', () => {
			const result = evaluateCorrectness(
				'',
				[blank('b0', 'x', 4, 5)],
				'let x = 1;',
			);
			expect(result.correctnessMap.get('b0')).toBe('unfilled');
			expect(result.score).toBe(0);
		});
	});
});
