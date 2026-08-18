// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/grade.test.ts
// @ blob 0a993c876a19fab54b09435864d0dba5e2b178d1
// rewires: import re-points only
import { describe, expect, it } from 'vitest';

import grade from '../grade.js';
import type {
	CodeSurfaceQuizItem,
	LearnerResponse,
	McqQuizItem,
	SelectInCodeQuizItem,
} from '../types.js';

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

function codeSurfaceItem(
	targetRanges: ReadonlyArray<readonly [number, number]>,
	mode: 'click-token' | 'click-line' = 'click-token',
	feedback = 'where x is declared',
): CodeSurfaceQuizItem {
	return {
		mode,
		id: 'V8@10-11',
		family: 'variables',
		form: 'V8',
		anchorRange: [10, 11],
		cells: [{ dimension: 'text-surface', level: 'relation' }],
		prompt: 'Click where `x` is declared.',
		groupKey: 'binding:4-5',
		feedback,
		targetRanges,
	};
}

function clickResponse(
	clickedRanges: ReadonlyArray<readonly [number, number]>,
	mode: 'click-token' | 'click-line' = 'click-token',
): LearnerResponse {
	return { mode, clickedRanges };
}

function selectInCodeItem(
	targetRanges: ReadonlyArray<readonly [number, number]>,
	feedback = 'every occurrence of x',
): SelectInCodeQuizItem {
	return {
		mode: 'select-in-code',
		id: 'V10a@4-5',
		family: 'variables',
		form: 'V10a',
		anchorRange: [4, 5],
		cells: [{ dimension: 'execution', level: 'relation' }],
		prompt: 'Click every occurrence of `x`.',
		groupKey: 'binding:4-5',
		feedback,
		targetRanges,
	};
}

function selectResponse(
	selectedRanges: ReadonlyArray<readonly [number, number]>,
): LearnerResponse {
	return { mode: 'select-in-code', selectedRanges };
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

describe('grade — code-surface modes', () => {
	describe('Zero', () => {
		it('grades empty clicks against a non-empty target as incorrect', () => {
			expect(grade(codeSurfaceItem([[4, 5]]), clickResponse([]))).toEqual({
				status: 'incorrect',
				feedback: 'where x is declared',
			});
		});
	});

	describe('One', () => {
		it('grades an exact single-range click as correct', () => {
			expect(grade(codeSurfaceItem([[4, 5]]), clickResponse([[4, 5]]))).toEqual(
				{ status: 'correct', feedback: 'where x is declared' },
			);
		});

		it('grades a wrong single range as incorrect', () => {
			expect(grade(codeSurfaceItem([[4, 5]]), clickResponse([[0, 1]]))).toEqual(
				{ status: 'incorrect', feedback: 'where x is declared' },
			);
		});

		it('surfaces the item feedback verbatim on a correct verdict', () => {
			expect(
				grade(
					codeSurfaceItem(
						[[4, 5]],
						'click-token',
						'the binding is introduced here',
					),
					clickResponse([[4, 5]]),
				),
			).toEqual({
				status: 'correct',
				feedback: 'the binding is introduced here',
			});
		});
	});

	describe('Many', () => {
		it('matches a multi-range target regardless of click order', () => {
			expect(
				grade(
					codeSurfaceItem([
						[4, 5],
						[10, 11],
					]),
					clickResponse([
						[10, 11],
						[4, 5],
					]),
				),
			).toEqual({ status: 'correct', feedback: 'where x is declared' });
		});
	});

	describe('Boundaries', () => {
		it('grades a superset of clicks as incorrect (exact match, not subset)', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]]),
					clickResponse([
						[4, 5],
						[10, 11],
					]),
				),
			).toEqual({ status: 'incorrect', feedback: 'where x is declared' });
		});

		it('grades a partial click of a multi-range target as incorrect', () => {
			expect(
				grade(
					codeSurfaceItem([
						[4, 5],
						[10, 11],
					]),
					clickResponse([[4, 5]]),
				),
			).toEqual({ status: 'incorrect', feedback: 'where x is declared' });
		});

		it('collapses a duplicated correct click to correct', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]]),
					clickResponse([
						[4, 5],
						[4, 5],
					]),
				),
			).toEqual({ status: 'correct', feedback: 'where x is declared' });
		});

		it('grades a click whose start matches but end differs as incorrect', () => {
			expect(grade(codeSurfaceItem([[4, 5]]), clickResponse([[4, 9]]))).toEqual(
				{ status: 'incorrect', feedback: 'where x is declared' },
			);
		});

		it('grades a click whose end matches but start differs as incorrect', () => {
			expect(grade(codeSurfaceItem([[4, 5]]), clickResponse([[0, 5]]))).toEqual(
				{ status: 'incorrect', feedback: 'where x is declared' },
			);
		});
	});

	describe('Interfaces', () => {
		it('omits the answer key from the verdict', () => {
			expect(
				grade(codeSurfaceItem([[4, 5]]), clickResponse([[4, 5]])),
			).not.toHaveProperty('targetRanges');
		});

		it('returns a frozen verdict', () => {
			expect(
				Object.isFrozen(
					grade(codeSurfaceItem([[4, 5]]), clickResponse([[4, 5]])),
				),
			).toBe(true);
		});

		it('grades a click-line item and response by the same range comparison', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 9]], 'click-line'),
					clickResponse([[4, 9]], 'click-line'),
				),
			).toEqual({ status: 'correct', feedback: 'where x is declared' });
		});
	});

	describe('Exceptions', () => {
		it('grades a code-surface item against an mcq response as malformed', () => {
			expect(
				grade(codeSurfaceItem([[4, 5]]), mcqResponse(['identifier'])).status,
			).toBe('malformed');
		});

		it('grades an mcq item against a click response as malformed', () => {
			expect(
				grade(mcqItem(['identifier']), clickResponse([[4, 5]])).status,
			).toBe('malformed');
		});

		it('grades a click-token item against a click-line response as malformed', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]], 'click-token'),
					clickResponse([[4, 5]], 'click-line'),
				).status,
			).toBe('malformed');
		});

		it('grades a click-line item against a click-token response as malformed', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]], 'click-line'),
					clickResponse([[4, 5]], 'click-token'),
				).status,
			).toBe('malformed');
		});

		it('grades a click-line item against an mcq response as malformed', () => {
			expect(
				grade(codeSurfaceItem([[4, 5]], 'click-line'), mcqResponse(['x']))
					.status,
			).toBe('malformed');
		});

		it('reports a developer reason on a malformed verdict', () => {
			expect(
				grade(codeSurfaceItem([[4, 5]]), mcqResponse(['identifier'])),
			).toHaveProperty('reason', expect.any(String));
		});

		it('reports a developer reason on a click-token vs click-line mismatch', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]], 'click-token'),
					clickResponse([[4, 5]], 'click-line'),
				),
			).toHaveProperty('reason', expect.any(String));
		});
	});

	describe('Simple', () => {
		it('grades the same item and response equally on repeat', () => {
			const item = codeSurfaceItem([[4, 5]]);
			const response = clickResponse([[4, 5]]);
			expect(grade(item, response)).toEqual(grade(item, response));
		});
	});
});

describe('grade — select-in-code mode', () => {
	describe('Zero', () => {
		it('grades an empty selection against a non-empty target as incorrect', () => {
			expect(grade(selectInCodeItem([[4, 5]]), selectResponse([]))).toEqual({
				status: 'incorrect',
				feedback: 'every occurrence of x',
			});
		});
	});

	describe('One', () => {
		it('grades an exact single-range selection as correct', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), selectResponse([[4, 5]])),
			).toEqual({ status: 'correct', feedback: 'every occurrence of x' });
		});

		it('grades a wrong single range as incorrect', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), selectResponse([[0, 1]])),
			).toEqual({ status: 'incorrect', feedback: 'every occurrence of x' });
		});

		it('surfaces the item feedback verbatim on a correct verdict', () => {
			expect(
				grade(
					selectInCodeItem([[4, 5]], 'all the same binding'),
					selectResponse([[4, 5]]),
				),
			).toEqual({ status: 'correct', feedback: 'all the same binding' });
		});
	});

	describe('Many', () => {
		it('matches a complete multi-range selection regardless of order', () => {
			expect(
				grade(
					selectInCodeItem([
						[4, 5],
						[10, 11],
						[20, 21],
					]),
					selectResponse([
						[20, 21],
						[4, 5],
						[10, 11],
					]),
				),
			).toEqual({ status: 'correct', feedback: 'every occurrence of x' });
		});
	});

	describe('Boundaries', () => {
		it('grades a partial selection of a multi-range target as incorrect (exhaustiveness — no partial credit)', () => {
			expect(
				grade(
					selectInCodeItem([
						[4, 5],
						[10, 11],
					]),
					selectResponse([[4, 5]]),
				),
			).toEqual({ status: 'incorrect', feedback: 'every occurrence of x' });
		});

		it('grades a superset of the target as incorrect (exact match, not subset)', () => {
			expect(
				grade(
					selectInCodeItem([[4, 5]]),
					selectResponse([
						[4, 5],
						[10, 11],
					]),
				),
			).toEqual({ status: 'incorrect', feedback: 'every occurrence of x' });
		});

		it('collapses a duplicated correct range to correct', () => {
			expect(
				grade(
					selectInCodeItem([
						[4, 5],
						[10, 11],
					]),
					selectResponse([
						[4, 5],
						[10, 11],
						[4, 5],
					]),
				),
			).toEqual({ status: 'correct', feedback: 'every occurrence of x' });
		});

		it('grades a range whose start matches but end differs as incorrect', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), selectResponse([[4, 9]])),
			).toEqual({ status: 'incorrect', feedback: 'every occurrence of x' });
		});

		it('grades a range whose end matches but start differs as incorrect', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), selectResponse([[0, 5]])),
			).toEqual({ status: 'incorrect', feedback: 'every occurrence of x' });
		});

		it("does not police the non-empty generator invariant: an empty target and empty selection vacuously match as correct (a zero-target item is a generator bug, not grade's to catch)", () => {
			expect(grade(selectInCodeItem([]), selectResponse([]))).toEqual({
				status: 'correct',
				feedback: 'every occurrence of x',
			});
		});
	});

	describe('Interfaces', () => {
		it('omits the answer key from the verdict', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), selectResponse([[4, 5]])),
			).not.toHaveProperty('targetRanges');
		});

		it('returns a frozen verdict', () => {
			expect(
				Object.isFrozen(
					grade(selectInCodeItem([[4, 5]]), selectResponse([[4, 5]])),
				),
			).toBe(true);
		});
	});

	describe('Exceptions', () => {
		// Each mismatch pins the `reason` to the mode-mismatch signature
		// ("…does not match…"), which the un-implemented fall-through
		// ("unsupported answer mode: …") does NOT produce — so the new-arm cases
		// fail until the guard is real, rather than passing on the fall-through.
		it('grades a select-in-code item against a click-token response as malformed', () => {
			expect(
				grade(
					selectInCodeItem([[4, 5]]),
					clickResponse([[4, 5]], 'click-token'),
				),
			).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});

		it('grades a select-in-code item against a click-line response as malformed', () => {
			expect(
				grade(
					selectInCodeItem([[4, 5]]),
					clickResponse([[4, 5]], 'click-line'),
				),
			).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});

		it('grades a select-in-code item against an mcq response as malformed', () => {
			expect(
				grade(selectInCodeItem([[4, 5]]), mcqResponse(['identifier'])),
			).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});

		it('grades a click-token item against a select-in-code response as malformed', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]], 'click-token'),
					selectResponse([[4, 5]]),
				),
			).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});

		it('grades a click-line item against a select-in-code response as malformed', () => {
			expect(
				grade(
					codeSurfaceItem([[4, 5]], 'click-line'),
					selectResponse([[4, 5]]),
				),
			).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});

		it('grades an mcq item against a select-in-code response as malformed', () => {
			expect(grade(mcqItem(['identifier']), selectResponse([[4, 5]]))).toEqual({
				status: 'malformed',
				reason: expect.stringContaining('does not match'),
			});
		});
	});

	describe('Simple', () => {
		it('grades the same item and response equally on repeat', () => {
			const item = selectInCodeItem([[4, 5]]);
			const response = selectResponse([[4, 5]]);
			expect(grade(item, response)).toEqual(grade(item, response));
		});
	});
});
