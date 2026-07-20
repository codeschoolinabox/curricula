import { describe, expect, it } from 'vitest';

import diffLines from '../lib/diff-lines.js';

describe('diffLines', () => {
	describe('Zero — empty source', () => {
		it('empty solution has zero code lines to grade', () => {
			expect(diffLines('', '').total).toBe(0);
		});

		it('empty solution has zero matches', () => {
			expect(diffLines('', '').matched).toBe(0);
		});
	});

	describe('One — single solution line', () => {
		it('an exactly-reproduced code line is a match', () => {
			expect(diffLines('const x = 1;', 'const x = 1;').perLine[0]).toBe(
				'match',
			);
		});

		it('a reproduced code line counts toward matched', () => {
			expect(diffLines('const x = 1;', 'const x = 1;').matched).toBe(1);
		});

		it('a wrongly-typed code line is a diff', () => {
			expect(diffLines('const y = 2;', 'const x = 1;').perLine[0]).toBe('diff');
		});

		it('a wrongly-typed code line does NOT count toward matched', () => {
			expect(diffLines('const y = 2;', 'const x = 1;').matched).toBe(0);
		});

		it('a blank learner line against a code line is empty, not diff', () => {
			expect(diffLines('', 'const x = 1;').perLine[0]).toBe('empty');
		});

		it('an unattempted code line still counts toward total', () => {
			expect(diffLines('', 'const x = 1;').total).toBe(1);
		});

		it('a comment-only solution line is comment, not graded', () => {
			expect(diffLines('// note', '// note').perLine[0]).toBe('comment');
		});

		it('a comment-only solution line is excluded from total', () => {
			expect(diffLines('// note', '// note').total).toBe(0);
		});

		it('a multi-line all-comment solution is vacuously complete (total 0, no NaN)', () => {
			// The named DOCS § Honest tally constraint: total === 0 (no code lines)
			// is vacuously complete, never NaN. Guards it for a non-empty solution.
			const result = diffLines('anything', '// a\n// b\n// c');
			expect(result.total).toBe(0);
			expect(result.matched).toBe(0);
		});
	});

	describe('Boundaries — trimmed compare + short learner', () => {
		it('trailing-whitespace-only difference still counts as a match', () => {
			expect(diffLines('const x = 1;   ', 'const x = 1;').perLine[0]).toBe(
				'match',
			);
		});

		it('leading-indentation difference still counts as a match (trimmed)', () => {
			expect(diffLines('\t\tconst x = 1;', 'const x = 1;').perLine[0]).toBe(
				'match',
			);
		});

		it('a solution code line past the end of the learner text is empty', () => {
			const result = diffLines('const a = 1;', 'const a = 1;\nconst b = 2;');
			expect(result.perLine[1]).toBe('empty');
		});
	});

	describe('Many — mixed multi-line', () => {
		it('perLine length equals the solution line count', () => {
			const solution = 'const a = 1;\n// note\n\nconst b = 2;';
			expect(diffLines('', solution).perLine).toHaveLength(
				solution.split('\n').length,
			);
		});

		it('counts only code lines in total (comment + blank excluded)', () => {
			const solution = 'const a = 1;\n// note\n\nconst b = 2;';
			expect(diffLines('', solution).total).toBe(2);
		});

		it('matched reflects only the exactly-reproduced code lines', () => {
			const solution = 'const a = 1;\n// note\nconst b = 2;';
			const learner = 'const a = 1;\n// note\nWRONG';
			expect(diffLines(learner, solution).matched).toBe(1);
		});

		it('classifies each line of a mixed solution by index', () => {
			const solution = 'const a = 1;\n// note\nconst b = 2;';
			const learner = 'const a = 1;\n// note\nWRONG';
			expect(diffLines(learner, solution).perLine).toEqual([
				'match',
				'comment',
				'diff',
			]);
		});
	});

	describe('Block comments — B1 honesty (skeleton-seeded lines uncounted)', () => {
		it('excludes JSDoc inner lines from total (only the real code line counts)', () => {
			const solution = '/**\n * @param x\n */\nconst x = 1;';
			expect(diffLines('', solution).total).toBe(1);
		});

		it('reports zero matched for a just-seeded skeleton (no inflation)', () => {
			const solution = '/**\n * @param x\n */\nconst x = 1;';
			const learner = '/**\n * @param x\n */\n';
			expect(diffLines(learner, solution).matched).toBe(0);
		});

		it('marks a JSDoc inner line as comment, not diff', () => {
			const solution = '/**\n * @param x\n */\nconst x = 1;';
			const learner = '/**\n * @param x\n */\n';
			expect(diffLines(learner, solution).perLine[1]).toBe('comment');
		});
	});

	describe('Interfaces — frozen return', () => {
		it('returns a deep-frozen result', () => {
			expect(Object.isFrozen(diffLines('a', 'a'))).toBe(true);
		});

		it('returns a frozen perLine array', () => {
			expect(Object.isFrozen(diffLines('a', 'a').perLine)).toBe(true);
		});
	});
});
