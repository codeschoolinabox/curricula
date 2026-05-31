/**
 * @file Pure-TS tests for the `blanks` lens's per-blank correctness
 * primitive. No React, no jsdom. ZOMBIES coverage of `validate-answer`
 * per `../README.md` § Validation contract.
 */

import { describe, expect, it } from 'vitest';

import validateAnswer from '../validate-answer.js';

describe('validateAnswer', () => {
	describe('unfilled', () => {
		it('empty learner answer → "unfilled"', () => {
			expect(validateAnswer('let', '')).toBe('unfilled');
		});

		it('whitespace-only learner answer → "unfilled"', () => {
			expect(validateAnswer('let', '   ')).toBe('unfilled');
		});

		it('tab + newline learner answer → "unfilled"', () => {
			expect(validateAnswer('let', '\t\n')).toBe('unfilled');
		});
	});

	describe('correct', () => {
		// Triangulation: the first test here makes returning 'unfilled' impossible.
		it('exact match → "correct"', () => {
			expect(validateAnswer('let', 'let')).toBe('correct');
		});

		it('match with surrounding whitespace → "correct" (learner trimmed)', () => {
			expect(validateAnswer('let', '  let  ')).toBe('correct');
		});

		it('operator answer with exact match → "correct"', () => {
			expect(validateAnswer('==', '==')).toBe('correct');
		});

		it('literal answer with exact match → "correct"', () => {
			expect(validateAnswer('42', '42')).toBe('correct');
		});

		it('string-literal answer including delimiters → "correct"', () => {
			expect(validateAnswer("'hi'", "'hi'")).toBe('correct');
		});
	});

	describe('incorrect', () => {
		it('case-sensitive mismatch → "incorrect"', () => {
			expect(validateAnswer('let', 'Let')).toBe('incorrect');
		});

		it('different keyword → "incorrect"', () => {
			expect(validateAnswer('let', 'const')).toBe('incorrect');
		});

		it('"==" learner vs "===" answer → "incorrect" (no operator-equivalence relaxation)', () => {
			expect(validateAnswer('===', '==')).toBe('incorrect');
		});

		it('"&" learner vs "&&" answer → "incorrect" (no operator-equivalence relaxation)', () => {
			expect(validateAnswer('&&', '&')).toBe('incorrect');
		});

		it('numeric vs string literal → "incorrect"', () => {
			expect(validateAnswer('42', '"42"')).toBe('incorrect');
		});

		it('partial-match (substring) → "incorrect"', () => {
			expect(validateAnswer('return', 'ret')).toBe('incorrect');
		});

		it('surrounded-by-text → "incorrect" (no substring fuzz-match)', () => {
			expect(validateAnswer('let', 'let x')).toBe('incorrect');
		});

		it('answer with surrounding whitespace vs trimmed learner → "incorrect" (only learner side is trimmed)', () => {
			expect(validateAnswer(' let ', 'let')).toBe('incorrect');
		});
	});

	describe('edge — answer parameter', () => {
		it('empty answer, empty learner → "unfilled" (both sides trim-empty)', () => {
			expect(validateAnswer('', '')).toBe('unfilled');
		});

		it('empty answer, non-empty learner → "incorrect" (empty answer never matches non-empty input)', () => {
			expect(validateAnswer('', 'x')).toBe('incorrect');
		});
	});
});
