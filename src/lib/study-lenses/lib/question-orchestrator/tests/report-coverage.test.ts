import { describe, expect, it } from 'vitest';

import type { BlockCell } from '../../../orchestrate/lib/socratizing/types.js';
import type { QuizItem } from '../../quizzing/types.js';
import reportCoverage from '../report-coverage.js';
import type { OrchestratedItem } from '../types.js';

function itemWith(id: string, cells: readonly BlockCell[]): OrchestratedItem {
	return {
		id,
		sourceId: 'quizzing',
		register: 'closed',
		anchorOffsets: [0, 0],
		cells,
		item: {} as unknown as QuizItem,
	};
}

function keys(cells: readonly BlockCell[]): readonly string[] {
	return cells
		.map((cell) => `${cell.dimension}:${cell.level}`)
		.toSorted((a, b) => a.localeCompare(b));
}

describe('reportCoverage', () => {
	describe('Zero', () => {
		it('returns an empty report for no items and no targets', () => {
			expect(reportCoverage([], [])).toEqual({ spanned: [], gaps: [] });
		});

		it('reports no gaps when no target cells are configured', () => {
			expect(
				reportCoverage(
					[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
					[],
				).gaps,
			).toEqual([]);
		});
	});

	describe('One', () => {
		it('spans the single cell an item covers', () => {
			expect(
				keys(
					reportCoverage(
						[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
						[],
					).spanned,
				),
			).toEqual(['execution:atom']);
		});
	});

	describe('Many', () => {
		it('accumulates different cells contributed by different items', () => {
			expect(
				keys(
					reportCoverage(
						[
							itemWith('a', [{ dimension: 'execution', level: 'atom' }]),
							itemWith('b', [{ dimension: 'purpose', level: 'macro' }]),
						],
						[],
					).spanned,
				),
			).toEqual(['execution:atom', 'purpose:macro']);
		});

		it('spans every cell an item with multiple cells contributes', () => {
			expect(
				keys(
					reportCoverage(
						[
							itemWith('a', [
								{ dimension: 'execution', level: 'atom' },
								{ dimension: 'purpose', level: 'macro' },
							]),
						],
						[],
					).spanned,
				),
			).toEqual(['execution:atom', 'purpose:macro']);
		});
	});

	describe('value-equality (never reference)', () => {
		it('dedups value-equal cells from different items to one spanned cell', () => {
			const cellA: BlockCell = { dimension: 'execution', level: 'atom' };
			const cellB: BlockCell = { dimension: 'execution', level: 'atom' };
			expect(
				reportCoverage([itemWith('a', [cellA]), itemWith('b', [cellB])], [])
					.spanned.length,
			).toBe(1);
		});

		it('a target value-equal to a spanned cell is not a gap', () => {
			const spannedCell: BlockCell = { dimension: 'execution', level: 'atom' };
			const targetCell: BlockCell = { dimension: 'execution', level: 'atom' };
			expect(
				reportCoverage([itemWith('a', [spannedCell])], [targetCell]).gaps,
			).toEqual([]);
		});

		it('dedups value-equal target cells before scoring gaps', () => {
			const targetA: BlockCell = { dimension: 'purpose', level: 'macro' };
			const targetB: BlockCell = { dimension: 'purpose', level: 'macro' };
			expect(reportCoverage([], [targetA, targetB]).gaps.length).toBe(1);
		});

		it('returns the borrowed spanned cell by reference, not a reconstruction', () => {
			const cell: BlockCell = { dimension: 'execution', level: 'atom' };
			expect(reportCoverage([itemWith('a', [cell])], []).spanned[0]).toBe(cell);
		});

		it('returns the borrowed gap cell by reference, not a reconstruction', () => {
			const cell: BlockCell = { dimension: 'purpose', level: 'macro' };
			expect(reportCoverage([], [cell]).gaps[0]).toBe(cell);
		});
	});

	describe('gaps', () => {
		it('reports a target cell no item covers as a gap', () => {
			expect(
				keys(
					reportCoverage(
						[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
						[{ dimension: 'purpose', level: 'macro' }],
					).gaps,
				),
			).toEqual(['purpose:macro']);
		});

		it('reports only the uncovered subset of the targets', () => {
			expect(
				keys(
					reportCoverage(
						[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
						[
							{ dimension: 'execution', level: 'atom' },
							{ dimension: 'purpose', level: 'macro' },
						],
					).gaps,
				),
			).toEqual(['purpose:macro']);
		});

		it('reports every target as a gap when there are no items (honest degenerate path)', () => {
			expect(
				keys(
					reportCoverage(
						[],
						[
							{ dimension: 'execution', level: 'atom' },
							{ dimension: 'purpose', level: 'macro' },
						],
					).gaps,
				),
			).toEqual(['execution:atom', 'purpose:macro']);
		});
	});

	describe('purity', () => {
		it('accepts frozen items and frozen targetCells without throwing', () => {
			expect(() =>
				reportCoverage(
					Object.freeze([
						itemWith('a', [{ dimension: 'execution', level: 'atom' }]),
					]),
					Object.freeze([{ dimension: 'purpose', level: 'macro' }]),
				),
			).not.toThrow();
		});
	});

	describe('Interface', () => {
		it('returns a frozen report', () => {
			expect(
				Object.isFrozen(
					reportCoverage(
						[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
						[],
					),
				),
			).toBe(true);
		});

		it('returns a frozen spanned array', () => {
			expect(
				Object.isFrozen(
					reportCoverage(
						[itemWith('a', [{ dimension: 'execution', level: 'atom' }])],
						[],
					).spanned,
				),
			).toBe(true);
		});

		it('returns a frozen gaps array', () => {
			expect(
				Object.isFrozen(
					reportCoverage([], [{ dimension: 'purpose', level: 'macro' }]).gaps,
				),
			).toBe(true);
		});
	});
});
