import { describe, expect, it } from 'vitest';

import markBlocked from '../mark-blocked.js';
import type { Suggestion } from '../types.js';

describe('markBlocked', () => {
	describe('pass-through — label not in stumbling-list', () => {
		it('returns the suggestion with source-derived type and no extra fields', () => {
			const input: readonly Suggestion[] = [
				{ label: 'console', source: 'global' },
			];
			const result = markBlocked(input);
			const console = result.find((candidate) => candidate.label === 'console');
			expect(console).toEqual({ label: 'console', type: 'global' });
		});
	});

	describe('advisory — label in stumbling AND in input', () => {
		describe('new (JEJ-allowed keyword with teaching caveat)', () => {
			const input: readonly Suggestion[] = [
				{ label: 'new', source: 'keyword' },
			];
			const result = markBlocked(input);
			const newItem = result.find((candidate) => candidate.label === 'new');

			it('keeps source-derived type keyword (NOT blocked)', () => {
				expect(newItem?.type).toBe('keyword');
			});

			it('attaches curated info', () => {
				expect(typeof newItem?.info).toBe('string');
				expect((newItem?.info ?? '').length).toBeGreaterThan(0);
			});

			it('does NOT attach apply: noop (advisory keystroke lands normally)', () => {
				expect(newItem?.apply).toBeUndefined();
			});
		});

		describe('null (JEJ-allowed literal with teaching caveat)', () => {
			const input: readonly Suggestion[] = [
				{ label: 'null', source: 'keyword' },
			];
			const result = markBlocked(input);
			const nullItem = result.find((candidate) => candidate.label === 'null');

			it('keeps source-derived type keyword', () => {
				expect(nullItem?.type).toBe('keyword');
			});

			it('attaches curated info', () => {
				expect(typeof nullItem?.info).toBe('string');
			});
		});
	});

	describe('blocked synthesis — label in stumbling but NOT in input', () => {
		describe('var (JEJ-blocked declaration)', () => {
			const result = markBlocked([]);
			const variableItem = result.find((candidate) => candidate.label === 'var');

			it('appears as a synthesized item', () => {
				expect(variableItem).toBeDefined();
			});

			it('has type blocked', () => {
				expect(variableItem?.type).toBe('blocked');
			});

			it('has detail (not in JEJ)', () => {
				expect(variableItem?.detail).toBe('(not in JEJ)');
			});

			it('has apply noop', () => {
				expect(variableItem?.apply).toBe('noop');
			});

			it('has curated info', () => {
				expect(typeof variableItem?.info).toBe('string');
				expect((variableItem?.info ?? '').length).toBeGreaterThan(0);
			});
		});
	});

	describe('identifier-context stumbles synthesize when input is empty', () => {
		it.each(['var', 'function', 'class', '=>', 'this', 'throw', 'try', 'import', 'async', 'await'])(
			'%s appears as blocked',
			(label) => {
				const result = markBlocked([]);
				const item = result.find((candidate) => candidate.label === label);
				expect(item?.type).toBe('blocked');
			},
		);

		it.each(['new', 'null'])(
			'%s appears as blocked when not in input (only goes advisory when it IS in input)',
			(label) => {
				const result = markBlocked([]);
				const item = result.find((candidate) => candidate.label === label);
				expect(item?.type).toBe('blocked');
			},
		);
	});

	describe('MEMBER_ONLY_LABELS are skipped in identifier-context synthesis', () => {
		it.each(['split', 'match'])(
			'%s does NOT appear when input is empty (Inc C dot-receiver branch synthesizes these)',
			(label) => {
				const result = markBlocked([]);
				expect(result.find((candidate) => candidate.label === label)).toBeUndefined();
			},
		);
	});
});
