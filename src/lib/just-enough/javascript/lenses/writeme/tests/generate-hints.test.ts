import { describe, expect, it } from 'vitest';

import generateHints from '../lib/generate-hints.js';

describe('generateHints', () => {
	describe('Zero — empty source', () => {
		it('yields the three structural hints', () => {
			expect(generateHints('', true)).toHaveLength(3);
		});

		it('the first structural hint reports the (zero) line count', () => {
			expect(generateHints('', true)[0].text).toBe(
				'This program has 0 lines of code',
			);
		});

		it('structural ids follow the structural_<n> scheme', () => {
			expect(generateHints('', true)[0].id).toBe('structural_0');
		});

		it('the second structural hint carries id structural_1', () => {
			expect(generateHints('', true)[1].id).toBe('structural_1');
		});

		it('the third structural hint carries id structural_2', () => {
			expect(generateHints('', true)[2].id).toBe('structural_2');
		});
	});

	describe('One — concept hints from code', () => {
		it('interpolates the captured name into the concept hint', () => {
			expect(generateHints('function classify(n) {}', false)[0].text).toBe(
				'Define a function named "classify"',
			);
		});

		it('tags a pattern-derived hint as concept', () => {
			expect(generateHints('function classify(n) {}', false)[0].type).toBe(
				'concept',
			);
		});

		it('concept ids follow the hint_<n> scheme', () => {
			expect(generateHints('function classify(n) {}', false)[0].id).toBe(
				'hint_0',
			);
		});

		it('a single concept match yields four hints (1 concept + 3 structural)', () => {
			expect(generateHints('function classify(n) {}', false)).toHaveLength(4);
		});
	});

	describe('keepComments selects a different pattern set', () => {
		it('comments-kept uses the implementation-focused wording', () => {
			expect(generateHints('function f() {}', true)[0].text).toBe(
				'Implement the function body for "f"',
			);
		});

		it('comments-off uses the structure-focused wording', () => {
			expect(generateHints('function f() {}', false)[0].text).toBe(
				'Define a function named "f"',
			);
		});

		it('a structure-only pattern (while) matches in comments-off mode', () => {
			expect(generateHints('while (x) {}', false)[0].text).toBe(
				'Add a while loop',
			);
		});

		it('that structure-only pattern yields no concept hint in comments-on mode', () => {
			expect(
				generateHints('while (x) {}', true).every(
					(hint) => hint.type === 'structure',
				),
			).toBe(true);
		});
	});

	describe('comment stripping applies only when comments are off', () => {
		it('comments-off strips commented-out code before matching', () => {
			const hints = generateHints('// const ghost = 1;', false);
			expect(hints.some((hint) => hint.text.includes('ghost'))).toBe(false);
		});

		it('comments-kept matches identifiers inside comments', () => {
			const hints = generateHints('// const ghost = 1;', true);
			expect(hints.some((hint) => hint.text.includes('ghost'))).toBe(true);
		});

		it('comments-off on a comment-only source yields only the structural hints', () => {
			expect(generateHints('// const ghost = 1;', false)).toHaveLength(3);
		});
	});

	describe('Many — the 8-hint cap drops structural hints first', () => {
		it('caps the combined list at 8', () => {
			const source = Array.from(
				{ length: 9 },
				(_, i) => `const v${i} = ${i};`,
			).join('\n');
			expect(generateHints(source, true)).toHaveLength(8);
		});

		it('keeps only concept hints when concept matches exceed the cap', () => {
			const source = Array.from(
				{ length: 9 },
				(_, i) => `const v${i} = ${i};`,
			).join('\n');
			expect(
				generateHints(source, true).every((hint) => hint.type === 'concept'),
			).toBe(true);
		});

		it('a second concept match increments the id to hint_1', () => {
			expect(generateHints('const a = 1;\nconst b = 2;', true)[1].id).toBe(
				'hint_1',
			);
		});
	});

	describe('Boundaries — structural line count', () => {
		it('counts non-blank lines for the line-count hint', () => {
			const hints = generateHints('a;\n\nb;\nc;', true);
			expect(
				hints.some((hint) => hint.text === 'This program has 3 lines of code'),
			).toBe(true);
		});
	});

	describe('Interfaces — Hint shape + frozen return', () => {
		it('a hint carries exactly id, text, and type (no revealed flag)', () => {
			expect(
				Object.keys(generateHints('function f() {}', false)[0]).sort(),
			).toEqual(['id', 'text', 'type']);
		});

		it('returns a deep-frozen array', () => {
			expect(Object.isFrozen(generateHints('function f() {}', false))).toBe(
				true,
			);
		});

		it('returns frozen hint objects', () => {
			expect(Object.isFrozen(generateHints('function f() {}', false)[0])).toBe(
				true,
			);
		});
	});
});
