import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import generateQuiz from '../generate-quiz.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

describe('generateQuiz', () => {
	describe('Zero', () => {
		it('returns an empty array for a snippet with no tokens', () => {
			const snippet = embody('');
			expect(generateQuiz(snippet, classifyOf(snippet))).toEqual([]);
		});
	});

	describe('One', () => {
		it('runs every registered generator over a single identifier', () => {
			const snippet = embody('x');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
			).toEqual(['V1', 'V7', 'V10c']);
		});
	});

	describe('Many', () => {
		it('keeps family variables for every item regardless of generator', () => {
			const snippet = embody('a + b');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).every(
					(item) => item.family === 'variables',
				),
			).toBe(true);
		});

		it('groups token-anchored items before node-anchored items', () => {
			const snippet = embody('a; b');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
			).toEqual(['V1', 'V1', 'V1', 'V7', 'V7', 'V10c']);
		});

		it('runs every applicable registered generator for a declared, referenced binding', () => {
			const snippet = embody('let x = 1; x;');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(
				new Set(['V1', 'V2', 'V6', 'V7', 'V8', 'V10a', 'V10b', 'V10c']),
			);
		});

		it('adds the const-only V6b form for a declared, referenced const', () => {
			const snippet = embody('const x = 1; x;');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(
				new Set(['V1', 'V2', 'V6', 'V6b', 'V7', 'V8', 'V10a', 'V10b', 'V10c']),
			);
		});
	});

	describe('Interfaces', () => {
		it('emits only the binding-independent forms for an undeclared identifier', () => {
			// V8 / V10a / V10b need a resolvable binding, so they emit nothing for a
			// free global; V10c (cross-variable) fires on any identifier, so an
			// undeclared identifier still yields one code-surface (select-in-code) item.
			const snippet = embody('x');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(new Set(['V1', 'V7', 'V10c']));
		});

		it('returns a deeply frozen array', () => {
			const snippet = embody('x');
			expect(Object.isFrozen(generateQuiz(snippet, classifyOf(snippet)))).toBe(
				true,
			);
		});

		it('returns frozen items', () => {
			const snippet = embody('x');
			expect(
				Object.isFrozen(generateQuiz(snippet, classifyOf(snippet))[0]),
			).toBe(true);
		});

		it('deeply freezes every nested array of each item', () => {
			const snippet = embody('x');
			const item = generateQuiz(snippet, classifyOf(snippet))[0];
			const arrays = Object.values(item ?? {}).filter((value) =>
				Array.isArray(value),
			);
			expect(arrays.every((array) => Object.isFrozen(array))).toBe(true);
		});

		it('accepts a filter argument as a no-op', () => {
			const snippet = embody('x; y');
			expect(generateQuiz(snippet, classifyOf(snippet), { count: 1 })).toEqual(
				generateQuiz(snippet, classifyOf(snippet)),
			);
		});
	});

	describe('Exceptions', () => {
		it('throws on an unparsed snippet', () => {
			const snippet = embody('FAIL_AT_PARSE');
			expect(() => generateQuiz(snippet, [])).toThrow();
		});

		it('throws on an unparsed snippet even when classified is non-empty', () => {
			const snippet = embody('FAIL_AT_PARSE');
			const classified: readonly ClassifiedToken[] = [
				{
					text: 'x',
					start: 0,
					end: 1,
					categories: ['identifier'],
					role: null,
					partner: null,
				},
			];
			expect(() => generateQuiz(snippet, classified)).toThrow();
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			const snippet = embody('x; y');
			expect(generateQuiz(snippet, classifyOf(snippet))).toEqual(
				generateQuiz(snippet, classifyOf(snippet)),
			);
		});
	});
});
