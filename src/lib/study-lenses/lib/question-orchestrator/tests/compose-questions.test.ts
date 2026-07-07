import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { BlockCell } from '../../../orchestrate/lib/socratizing/types.js';
import composeQuestions from '../compose-questions.js';
import ladder from '../ladder.js';

function fullItemCount(code: string): number {
	return composeQuestions(embody(code)).items.length;
}

describe('composeQuestions', () => {
	describe('degenerate (unparsed embodiment)', () => {
		it('returns no items', () => {
			expect(composeQuestions(embody('FAIL_AT_PARSE')).items).toEqual([]);
		});

		it('does not throw', () => {
			expect(() => composeQuestions(embody('FAIL_AT_PARSE'))).not.toThrow();
		});

		it('reports configured targets as gaps (honest gaps)', () => {
			expect(
				composeQuestions(embody('FAIL_AT_PARSE'), {
					coverage: { cells: [{ dimension: 'execution', level: 'atom' }] },
				}).coverage.gaps,
			).toEqual([{ dimension: 'execution', level: 'atom' }]);
		});

		it('dedupes duplicate configured targets in the honest-gap report', () => {
			expect(
				composeQuestions(embody('FAIL_AT_PARSE'), {
					coverage: {
						cells: [
							{ dimension: 'execution', level: 'atom' },
							{ dimension: 'execution', level: 'atom' },
						],
					},
				}).coverage.gaps.length,
			).toBe(1);
		});

		it('does not freeze caller-owned coverage cells borrowed into the gaps', () => {
			const cell: BlockCell = { dimension: 'execution', level: 'atom' };
			composeQuestions(embody('FAIL_AT_PARSE'), {
				coverage: { cells: [cell] },
			});
			expect(Object.isFrozen(cell)).toBe(false);
		});
	});

	describe('parsed but empty', () => {
		it('returns no items for a snippet with no questions', () => {
			expect(composeQuestions(embody('')).items).toEqual([]);
		});
	});

	describe('both sources', () => {
		it('includes closed items from the quizzing source', () => {
			expect(
				composeQuestions(embody('let x = 1; x;')).items.some(
					(item) => item.register === 'closed',
				),
			).toBe(true);
		});

		it('includes open items from the socratizing source', () => {
			expect(
				composeQuestions(embody('let x = 1; x;')).items.some(
					(item) => item.register === 'open',
				),
			).toBe(true);
		});

		it('threads config.sources through — the socratizing filter reduces open items', () => {
			const code = 'let x = 1; x;';
			const filtered = composeQuestions(embody(code), {
				sources: { socratizing: { count: 1 } },
			}).items.filter((item) => item.register === 'open').length;
			const unfiltered = composeQuestions(embody(code)).items.filter(
				(item) => item.register === 'open',
			).length;
			expect(filtered).toBeLessThan(unfiltered);
		});
	});

	describe('ladder', () => {
		it('orders the stream by most-concrete Block level by default', () => {
			const { items } = composeQuestions(embody('let x = 1; x;'));
			expect(items).toEqual(ladder(items));
		});

		it('leaves the pool unladdered when ladder is false', () => {
			const { items } = composeQuestions(embody('let x = 1; x;'), {
				ladder: false,
			});
			expect(items).not.toEqual(ladder(items));
		});
	});

	describe('count', () => {
		it('caps the composed set to config.count', () => {
			expect(
				composeQuestions(embody('let x = 1; x;'), { count: 1 }).items.length,
			).toBe(1);
		});

		it('treats count 0 as no cap', () => {
			expect(
				composeQuestions(embody('let x = 1; x;'), { count: 0 }).items.length,
			).toBe(fullItemCount('let x = 1; x;'));
		});

		it('treats a negative count as no cap', () => {
			expect(
				composeQuestions(embody('let x = 1; x;'), { count: -1 }).items.length,
			).toBe(fullItemCount('let x = 1; x;'));
		});

		it('does not truncate when count exceeds the pool', () => {
			expect(
				composeQuestions(embody('let x = 1; x;'), { count: 999 }).items.length,
			).toBe(fullItemCount('let x = 1; x;'));
		});

		it('caps the head of the laddered stream, not raw source order', () => {
			const code = 'let x = 1; x;';
			const { items: full } = composeQuestions(embody(code));
			const k = Math.floor(full.length / 2);
			const { items: capped } = composeQuestions(embody(code), { count: k });
			expect(capped).toEqual(full.slice(0, k));
		});
	});

	describe('coverage over the delivered (capped) items', () => {
		it('reports no gaps when the full span is the target and nothing is capped', () => {
			const code = 'let x = 1; x;';
			const target = composeQuestions(embody(code)).coverage.spanned;
			expect(
				composeQuestions(embody(code), { coverage: { cells: target } }).coverage
					.gaps,
			).toEqual([]);
		});

		it('reports a capped-away cell as a gap', () => {
			const code = 'let x = 1; x;';
			const target = composeQuestions(embody(code)).coverage.spanned;
			expect(
				composeQuestions(embody(code), {
					count: 1,
					coverage: { cells: target },
				}).coverage.gaps.length,
			).toBeGreaterThan(0);
		});
	});

	describe('Interface', () => {
		it('returns a frozen QuestionSet', () => {
			expect(Object.isFrozen(composeQuestions(embody('let x = 1; x;')))).toBe(
				true,
			);
		});

		it('returns a frozen items array', () => {
			expect(
				Object.isFrozen(composeQuestions(embody('let x = 1; x;')).items),
			).toBe(true);
		});

		it('returns frozen items', () => {
			expect(
				Object.isFrozen(composeQuestions(embody('let x = 1; x;')).items[0]),
			).toBe(true);
		});

		it('returns a frozen coverage report', () => {
			expect(
				Object.isFrozen(composeQuestions(embody('let x = 1; x;')).coverage),
			).toBe(true);
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(composeQuestions(embody('let x = 1; x;'))).toEqual(
				composeQuestions(embody('let x = 1; x;')),
			);
		});
	});
});
