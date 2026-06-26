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
		it('generates one item for a single-token snippet', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))).toHaveLength(1);
		});

		it('marks the item as an mcq question', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.mode).toBe('mcq');
		});

		it('tags the item with the V1 form', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.form).toBe('V1');
		});

		it('sets the family to variables for the V1 form', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.family).toBe(
				'variables',
			);
		});

		it('anchors the item to the token range', () => {
			const snippet = embody('x');
			expect(
				generateQuiz(snippet, classifyOf(snippet))[0]?.anchorRange,
			).toEqual([0, 1]);
		});

		it('keys the answer to the token primary category', () => {
			const snippet = embody('x');
			expect(
				generateQuiz(snippet, classifyOf(snippet))[0]?.answerOptionIds,
			).toEqual(['identifier']);
		});

		it('ids the item as V1 at the token range', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.id).toBe('V1@0-1');
		});

		it('keys the propagation group on the bare category for a role-less token', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.groupKey).toBe(
				'category:identifier',
			);
		});

		it('places the item on the text-surface atom cell', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.cells).toEqual([
				{ dimension: 'text-surface', level: 'atom' },
			]);
		});

		it('omits anchorPath for a token-anchored item', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]).not.toHaveProperty(
				'anchorPath',
			);
		});

		it('omits unlocks for the V1 form', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]).not.toHaveProperty(
				'unlocks',
			);
		});

		it('offers the five category options in order', () => {
			const snippet = embody('x');
			expect(
				generateQuiz(snippet, classifyOf(snippet))[0]?.options.map(
					(option) => option.id,
				),
			).toEqual(['identifier', 'keyword', 'operator', 'literal', 'delimiter']);
		});

		it('labels every option with non-empty text', () => {
			const snippet = embody('x');
			const options = generateQuiz(snippet, classifyOf(snippet))[0]?.options;
			expect(options?.every((option) => option.text.length > 0)).toBe(true);
		});

		it('prompts for the syntax-element category', () => {
			const snippet = embody('x');
			expect(generateQuiz(snippet, classifyOf(snippet))[0]?.prompt).toBe(
				'What kind of syntax element is this?',
			);
		});

		it('carries non-empty feedback', () => {
			const snippet = embody('x');
			const feedback = generateQuiz(snippet, classifyOf(snippet))[0]?.feedback;
			expect(feedback?.length).toBeGreaterThan(0);
		});
	});

	describe('Many', () => {
		it('generates one source-ordered item per token with its half-open range', () => {
			const snippet = embody('x; y');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map(
					(item) => item.anchorRange,
				),
			).toEqual([
				[0, 1],
				[1, 2],
				[3, 4],
			]);
		});

		it('keeps family variables for every item regardless of category', () => {
			const snippet = embody('a + b');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map((item) => item.family),
			).toEqual(['variables', 'variables', 'variables']);
		});

		it('refines the propagation group with the role for a role-bearing token', () => {
			const snippet = embody('a + b');
			expect(generateQuiz(snippet, classifyOf(snippet))[1]?.groupKey).toBe(
				'category:operator:binary',
			);
		});
	});

	describe('Boundaries', () => {
		it('covers every category present in the snippet', () => {
			const snippet = embody('let x = null;');
			const answered = new Set(
				generateQuiz(snippet, classifyOf(snippet)).flatMap(
					(item) => item.answerOptionIds,
				),
			);
			expect(answered).toEqual(
				new Set(['keyword', 'identifier', 'operator', 'literal', 'delimiter']),
			);
		});

		it('refines the propagation group for a role-bearing delimiter', () => {
			const snippet = embody('let x = null;');
			expect(generateQuiz(snippet, classifyOf(snippet))[4]?.groupKey).toBe(
				'category:delimiter:statement-end',
			);
		});
	});

	describe('Interfaces', () => {
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

		it('freezes the nested arrays of each item', () => {
			const snippet = embody('x');
			const item = generateQuiz(snippet, classifyOf(snippet))[0];
			expect(
				[item?.options, item?.cells, item?.answerOptionIds].every((value) =>
					Object.isFrozen(value),
				),
			).toBe(true);
		});

		it('accepts a filter argument as a no-op', () => {
			const snippet = embody('x; y');
			expect(
				generateQuiz(snippet, classifyOf(snippet), { count: 1 }),
			).toHaveLength(3);
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
