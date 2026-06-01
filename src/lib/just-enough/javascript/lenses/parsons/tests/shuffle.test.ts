/**
 * @file Pure-TS tests for the `parsons` lens shuffle. No React, no
 * jsdom. ZOMBIES coverage per `../README.md` § Shuffle contract and
 * `../DOCS.md` § Execution phases 3.
 */

import { describe, expect, it } from 'vitest';

import shuffle from '../shuffle.js';

describe('shuffle', () => {
	describe('degenerate inputs', () => {
		it('empty source → empty row sequence', () => {
			expect(shuffle('', 1)).toEqual([]);
		});

		it('single-line source → single row, originalIndex 0', () => {
			expect(shuffle('let x = 1;', 1)).toEqual([
				{ text: 'let x = 1;', originalIndex: 0 },
			]);
		});

		it('single line is not shuffled (rowCount < 2 → no permutation)', () => {
			// Triangulation: this confirms the `rows.length < 2 → pass
			// through` branch in shuffle.ts is actually exercised.
			const result = shuffle('only one;', 999);
			expect(result).toEqual([{ text: 'only one;', originalIndex: 0 }]);
		});
	});

	describe('split semantics', () => {
		it('two lines → two rows with sequential originalIndex', () => {
			const rows = shuffle('a;\nb;', 1);
			expect(
				rows.map((row) => row.originalIndex).toSorted((a, b) => a - b),
			).toEqual([0, 1]);
		});

		it('empty lines are preserved as rows', () => {
			const rows = shuffle('a;\n\nb;', 1);
			expect(rows).toHaveLength(3);
		});

		it('trailing newline produces a trailing empty row', () => {
			// `'a;\nb;\n'.split('\n')` → `['a;', 'b;', '']` (three entries).
			const rows = shuffle('a;\nb;\n', 1);
			expect(rows).toHaveLength(3);
		});

		it('each row text matches the source line at its originalIndex', () => {
			const source = 'let a = 1;\nlet b = 2;\nlet c = 3;';
			const rows = shuffle(source, 1);
			const lines = source.split('\n');
			for (const row of rows) {
				expect(row.text).toBe(lines[row.originalIndex]);
			}
		});
	});

	describe('seeded determinism', () => {
		it('same seed → same row sequence', () => {
			const source = 'a;\nb;\nc;\nd;\ne;';
			const first = shuffle(source, 42);
			const second = shuffle(source, 42);
			expect(first).toEqual(second);
		});

		it('different fixed seeds → different sequences', () => {
			const source = 'a;\nb;\nc;\nd;\ne;';
			const first = shuffle(source, 1);
			const second = shuffle(source, 999);
			const firstIndices = first.map((row) => row.originalIndex);
			const secondIndices = second.map((row) => row.originalIndex);
			expect(firstIndices).not.toEqual(secondIndices);
		});

		it('seed=42 on five lines → exact known permutation (LCG ground-truth snapshot)', () => {
			const rows = shuffle('a;\nb;\nc;\nd;\ne;', 42);
			expect(rows.map((row) => row.originalIndex)).toEqual([2, 3, 4, 0, 1]);
		});

		it('seed=0 on two lines → swap (exercises rowCount >= 2 → Fisher-Yates branch)', () => {
			const rows = shuffle('a;\nb;', 0);
			expect(rows.map((row) => row.originalIndex)).toEqual([1, 0]);
		});
	});

	describe('invariants', () => {
		it('returned array is frozen', () => {
			expect(Object.isFrozen(shuffle('a;\nb;\nc;', 1))).toBe(true);
		});

		it('row count equals line count', () => {
			const rows = shuffle('a;\nb;\nc;\nd;', 1);
			expect(rows).toHaveLength(4);
		});

		it('all originalIndex values are unique and span [0, rowCount)', () => {
			const rows = shuffle('a;\nb;\nc;\nd;\ne;\nf;', 7);
			const indices = rows
				.map((row) => row.originalIndex)
				.toSorted((a, b) => a - b);
			expect(indices).toEqual([0, 1, 2, 3, 4, 5]);
		});

		it('original source reconstructs by joining rows in originalIndex order', () => {
			const source = 'let a = 1;\nlet b = 2;\nlet c = 3;';
			const rows = shuffle(source, 1);
			const inOriginalOrder = rows.toSorted(
				(a, b) => a.originalIndex - b.originalIndex,
			);
			const reconstructed = inOriginalOrder.map((row) => row.text).join('\n');
			expect(reconstructed).toBe(source);
		});
	});

	describe('simple realistic snippets', () => {
		it('three-line snippet at seed 1 produces some non-identity permutation', () => {
			// Sanity check: the shuffle actually moves at least one row
			// from its original position for this snippet + seed.
			const source = 'a;\nb;\nc;';
			const rows = shuffle(source, 1);
			const movedRows = rows.filter(
				(row, currentIndex) => row.originalIndex !== currentIndex,
			);
			expect(movedRows.length).toBeGreaterThan(0);
		});
	});
});
