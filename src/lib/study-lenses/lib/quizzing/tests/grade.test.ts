import { describe, expect, it } from 'vitest';

import grade from '../grade.js';
import type { LearnerResponse, McqQuizItem } from '../types.js';

function mcqItem(
	answerOptionIds: readonly string[],
	feedback = 'the explanation',
): McqQuizItem {
	return {
		mode: 'mcq',
		id: 'V1@0-1',
		family: 'variables',
		form: 'V1',
		anchorRange: [0, 1],
		cells: [{ dimension: 'text-surface', level: 'atom' }],
		prompt: 'What kind of syntax element is this?',
		groupKey: 'category:identifier',
		feedback,
		options: [
			{ id: 'identifier', text: 'Identifier' },
			{ id: 'operator', text: 'Operator' },
		],
		answerOptionIds,
	};
}

function mcqResponse(selectedOptionIds: readonly string[]): LearnerResponse {
	return { mode: 'mcq', selectedOptionIds };
}

describe('grade', () => {
	describe('Zero', () => {
		it('grades an empty selection against a non-empty key as incorrect', () => {
			expect(grade(mcqItem(['identifier']), mcqResponse([]))).toEqual({
				status: 'incorrect',
				feedback: 'the explanation',
			});
		});
	});

	describe('One', () => {
		it('grades the exact correct selection as correct', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['identifier'])),
			).toEqual({ status: 'correct', feedback: 'the explanation' });
		});

		it('grades a wrong known option as incorrect', () => {
			expect(grade(mcqItem(['identifier']), mcqResponse(['operator']))).toEqual(
				{ status: 'incorrect', feedback: 'the explanation' },
			);
		});

		it('surfaces the item feedback verbatim on a correct verdict', () => {
			expect(
				grade(
					mcqItem(['identifier'], 'it names a binding'),
					mcqResponse(['identifier']),
				),
			).toEqual({ status: 'correct', feedback: 'it names a binding' });
		});
	});

	describe('Many', () => {
		it('reads the answer key from the item, not a fixed option', () => {
			expect(grade(mcqItem(['operator']), mcqResponse(['operator']))).toEqual({
				status: 'correct',
				feedback: 'the explanation',
			});
		});

		it('reads the option pool from the item: a known-but-wrong id is incorrect, not malformed', () => {
			const item: McqQuizItem = {
				mode: 'mcq',
				id: 'V1@0-1',
				family: 'variables',
				form: 'V1',
				anchorRange: [0, 1],
				cells: [{ dimension: 'text-surface', level: 'atom' }],
				prompt: 'What kind of syntax element is this?',
				groupKey: 'category:identifier',
				feedback: 'the explanation',
				options: [
					{ id: 'apple', text: 'Apple' },
					{ id: 'banana', text: 'Banana' },
				],
				answerOptionIds: ['apple'],
			};
			expect(grade(item, mcqResponse(['banana']))).toEqual({
				status: 'incorrect',
				feedback: 'the explanation',
			});
		});
	});

	describe('Boundaries', () => {
		it('grades a superset of known options as incorrect (exact match, not subset)', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['identifier', 'operator'])),
			).toEqual({ status: 'incorrect', feedback: 'the explanation' });
		});

		it('collapses a duplicated correct option to correct', () => {
			expect(
				grade(
					mcqItem(['identifier']),
					mcqResponse(['identifier', 'identifier']),
				),
			).toEqual({ status: 'correct', feedback: 'the explanation' });
		});

		it('matches a multi-option key regardless of selection order', () => {
			expect(
				grade(
					mcqItem(['identifier', 'operator']),
					mcqResponse(['operator', 'identifier']),
				),
			).toEqual({ status: 'correct', feedback: 'the explanation' });
		});

		it('grades a partial selection of a multi-option key as incorrect', () => {
			expect(
				grade(mcqItem(['identifier', 'operator']), mcqResponse(['identifier'])),
			).toEqual({ status: 'incorrect', feedback: 'the explanation' });
		});
	});

	describe('Interfaces', () => {
		it('omits the answer key from the verdict', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['identifier'])),
			).not.toHaveProperty('answerOptionIds');
		});

		it('returns a frozen verdict', () => {
			expect(
				Object.isFrozen(
					grade(mcqItem(['identifier']), mcqResponse(['identifier'])),
				),
			).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('grades an unknown option id as malformed', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['banana'])).status,
			).toBe('malformed');
		});

		it('reports a developer reason on a malformed verdict', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['banana'])),
			).toHaveProperty('reason', expect.any(String));
		});

		it('grades a mix of known and unknown options as malformed', () => {
			expect(
				grade(mcqItem(['identifier']), mcqResponse(['identifier', 'banana']))
					.status,
			).toBe('malformed');
		});
	});

	describe('Simple', () => {
		it('grades an empty selection against an empty key as correct', () => {
			expect(grade(mcqItem([]), mcqResponse([]))).toEqual({
				status: 'correct',
				feedback: 'the explanation',
			});
		});
	});
});
