import { describe, expect, it } from 'vitest';

import STUMBLING_LIST from '../stumbling-list.js';

describe('STUMBLING_LIST', () => {
	describe('shape and size', () => {
		it('has exactly 14 entries', () => {
			expect(STUMBLING_LIST).toHaveLength(14);
		});

		it('the array is frozen', () => {
			expect(Object.isFrozen(STUMBLING_LIST)).toBe(true);
		});

		it('every entry is frozen', () => {
			expect(STUMBLING_LIST.every((entry) => Object.isFrozen(entry))).toBe(true);
		});
	});

	describe('per-entry invariants', () => {
		it.each(STUMBLING_LIST.map((entry) => [entry.label]))(
			'%s has a non-empty info string',
			(label) => {
				const entry = STUMBLING_LIST.find((candidate) => candidate.label === label);
				expect(typeof entry?.info).toBe('string');
				expect((entry?.info ?? '').length).toBeGreaterThan(0);
			},
		);
	});

	describe('no duplicate labels', () => {
		it('every label appears at most once', () => {
			const labels = STUMBLING_LIST.map((entry) => entry.label);
			expect(new Set(labels).size).toBe(labels.length);
		});
	});

	describe('locked membership', () => {
		it.each([
			'var',
			'function',
			'class',
			'new',
			'=>',
			'this',
			'null',
			'throw',
			'try',
			'import',
			'async',
			'await',
			'split',
			'match',
		])('%s is in the curated list', (label) => {
			expect(STUMBLING_LIST.some((entry) => entry.label === label)).toBe(true);
		});
	});
});
