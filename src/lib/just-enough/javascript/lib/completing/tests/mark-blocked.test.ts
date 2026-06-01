import { describe, expect, it } from 'vitest';

import markBlocked from '../mark-blocked.js';
import type { Suggestion } from '../types.js';

describe('markBlocked', () => {
	describe('pass-through — label not in blocked-set', () => {
		it('returns the suggestion with source-derived type and no extra fields', () => {
			const input: readonly Suggestion[] = [
				{ label: 'console', source: 'global' },
			];
			const result = markBlocked(input);
			const console = result.find((candidate) => candidate.label === 'console');
			expect(console).toEqual({ label: 'console', type: 'global' });
		});

		it('JEJ-valid advisory keywords (new, null) pass through without info attached', () => {
			// Advisory caveats for new/null live as their keywords.ts
			// entries in documenting/, surfaced on hover. mark-blocked
			// no longer attaches per-suggestion info to JEJ-valid items.
			const input: readonly Suggestion[] = [
				{ label: 'new', source: 'keyword' },
				{ label: 'null', source: 'keyword' },
			];
			const result = markBlocked(input);
			const newItem = result.find((candidate) => candidate.label === 'new');
			const nullItem = result.find((candidate) => candidate.label === 'null');
			expect(newItem).toEqual({ label: 'new', type: 'keyword' });
			expect(nullItem).toEqual({ label: 'null', type: 'keyword' });
		});
	});

	describe('blocked synthesis — identifier-context', () => {
		describe('var (JEJ-blocked declaration)', () => {
			const result = markBlocked([]);
			const variableItem = result.find((candidate) => candidate.label === 'var');

			it('appears as a synthesized item', () => {
				expect(variableItem).toBeDefined();
			});

			it('has type blocked', () => {
				expect(variableItem?.type).toBe('blocked');
			});

			it('does not set detail (badge is derived from entry.isJEJ in the UI)', () => {
				expect(variableItem?.detail).toBeUndefined();
			});

			it('has apply noop', () => {
				expect(variableItem?.apply).toBe('noop');
			});

			it('carries the rich DocEntry from documenting/not-in-jej.ts', () => {
				expect(variableItem?.entry).toBeDefined();
				expect(variableItem?.entry?.isJEJ).toBe(false);
				expect(variableItem?.entry?.description).toBeTruthy();
			});

			it('carries the whyNotInJej rationale', () => {
				expect(typeof variableItem?.entry?.whyNotInJej).toBe('string');
				expect((variableItem?.entry?.whyNotInJej ?? '').length).toBeGreaterThan(
					0,
				);
			});
		});

		it.each(['var', 'function', 'class', '=>', 'this', 'throw', 'try', 'import', 'async', 'await'])(
			'%s appears as blocked when not in input',
			(label) => {
				const result = markBlocked([]);
				const item = result.find((candidate) => candidate.label === label);
				expect(item?.type).toBe('blocked');
				expect(item?.entry?.isJEJ).toBe(false);
			},
		);

		it.each(['new', 'null'])(
			'%s does NOT appear as blocked (advisory stumbles live in documenting/keywords.ts)',
			(label) => {
				const result = markBlocked([]);
				const item = result.find((candidate) => candidate.label === label);
				expect(item).toBeUndefined();
			},
		);

		it.each(['split', 'match', 'matchAll', 'constructor', 'call', 'apply'])(
			'%s does NOT appear in identifier-context (dot-member partition)',
			(label) => {
				const result = markBlocked([]);
				expect(result.find((candidate) => candidate.label === label)).toBeUndefined();
			},
		);
	});

	describe('blocked synthesis — dot-context', () => {
		it.each(['split', 'match', 'matchAll', 'constructor', '__proto__', 'prototype', 'call', 'apply', 'bind', 'caller', 'arguments'])(
			'%s appears as blocked in dot-receiver context',
			(label) => {
				const result = markBlocked([], true);
				const item = result.find((candidate) => candidate.label === label);
				expect(item?.type).toBe('blocked');
				expect(item?.entry?.isJEJ).toBe(false);
				expect(item?.entry?.whyNotInJej).toBeTruthy();
			},
		);

		it.each(['var', 'function', 'class', '=>'])(
			'%s does NOT appear in dot-context (identifier partition)',
			(label) => {
				const result = markBlocked([], true);
				expect(result.find((candidate) => candidate.label === label)).toBeUndefined();
			},
		);
	});

	describe('input-suppression — synthesis skips labels already in input', () => {
		it('var does not double-emit when already in suggestions', () => {
			const input: readonly Suggestion[] = [{ label: 'var', source: 'local' }];
			const result = markBlocked(input);
			const varItems = result.filter((candidate) => candidate.label === 'var');
			expect(varItems).toHaveLength(1);
			// passthrough wins; type stays as source-derived
			expect(varItems[0]?.type).toBe('local');
		});
	});
});
