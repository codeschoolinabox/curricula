/**
 * @file Pure-TS tests for the `blanks` lens core. No React, no jsdom.
 * ZOMBIES coverage of the LensModule-defaults trio (`config`,
 * `applicableTo`, `recommend`) per `../README.md` § Public API and
 * `../DOCS.md` § Architectural sketch.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import core from '../core.js';

describe('blanks core', () => {
	describe('config', () => {
		describe('no overrides → documented defaults', () => {
			it('difficulty defaults to 50', () => {
				expect(core.config().difficulty).toBe(50);
			});

			it('tokenCategories defaults to all four categories', () => {
				expect(core.config().tokenCategories).toEqual([
					'keywords',
					'identifiers',
					'operators',
					'literals',
				]);
			});

			it('seed is unset by default (wrapper computes per-mount)', () => {
				expect(core.config().seed).toBeUndefined();
			});

			it('seed key is absent (not present-with-undefined)', () => {
				expect(Object.hasOwn(core.config(), 'seed')).toBe(false);
			});
		});

		describe('{ difficulty: 100 } override', () => {
			it('difficulty is 100', () => {
				expect(core.config({ difficulty: 100 }).difficulty).toBe(100);
			});

			it('tokenCategories still defaults to all four', () => {
				expect(core.config({ difficulty: 100 }).tokenCategories).toEqual([
					'keywords',
					'identifiers',
					'operators',
					'literals',
				]);
			});
		});

		describe('{ tokenCategories: ["keywords"] } override', () => {
			it('tokenCategories is the single-category list', () => {
				expect(
					core.config({ tokenCategories: ['keywords'] }).tokenCategories,
				).toEqual(['keywords']);
			});

			it('difficulty still defaults to 50', () => {
				expect(
					core.config({ tokenCategories: ['keywords'] }).difficulty,
				).toBe(50);
			});
		});

		describe('{ seed: 42 } override', () => {
			it('seed is 42', () => {
				expect(core.config({ seed: 42 }).seed).toBe(42);
			});

			it('difficulty still defaults to 50', () => {
				expect(core.config({ seed: 42 }).difficulty).toBe(50);
			});
		});

		describe('all three overridden at once', () => {
			it('difficulty is 0', () => {
				expect(
					core.config({
						difficulty: 0,
						tokenCategories: ['operators'],
						seed: 7,
					}).difficulty,
				).toBe(0);
			});

			it('tokenCategories is the override value', () => {
				expect(
					core.config({
						difficulty: 0,
						tokenCategories: ['operators'],
						seed: 7,
					}).tokenCategories,
				).toEqual(['operators']);
			});

			it('seed is 7', () => {
				expect(
					core.config({
						difficulty: 0,
						tokenCategories: ['operators'],
						seed: 7,
					}).seed,
				).toBe(7);
			});
		});

		describe('unknown-field passthrough (open-shape contract)', () => {
			it('unknown field is preserved verbatim', () => {
				expect(core.config({ futureKnob: 'x' }).futureKnob).toBe('x');
			});
		});

		describe('null value override (open-shape contract — overrides win)', () => {
			it('null override is preserved verbatim', () => {
				expect(core.config({ difficulty: null }).difficulty).toBe(null);
			});
		});

		describe('empty tokenCategories override', () => {
			it('tokenCategories is the empty array', () => {
				expect(core.config({ tokenCategories: [] }).tokenCategories).toEqual(
					[],
				);
			});
		});

		describe('deep-freeze invariant', () => {
			it('returned config object is frozen', () => {
				expect(Object.isFrozen(core.config())).toBe(true);
			});

			it('nested tokenCategories array is frozen', () => {
				expect(Object.isFrozen(core.config().tokenCategories)).toBe(true);
			});

			it('mutating the returned config object throws', () => {
				const resolved = core.config();
				expect(() => {
					(resolved as { difficulty: number }).difficulty = 0;
				}).toThrow();
			});

			it('mutating the nested tokenCategories array throws', () => {
				const resolved = core.config();
				expect(() => {
					(resolved.tokenCategories as string[]).push('newCategory');
				}).toThrow();
			});
		});
	});

	describe('applicableTo (Tier 2 — gates on status.parsed)', () => {
		it('returns true for the apex snippet (parsed implied)', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns false for a parse-fail snippet', () => {
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(false);
		});

		it('returns false for a tokenize-fail snippet', () => {
			expect(core.applicableTo(embody('FAIL_AT_TOKENIZE'))).toBe(false);
		});
	});

	describe('recommend (WS2-deferred placeholder — always empty)', () => {
		it('returns an empty array regardless of embodiment status', () => {
			expect(core.recommend(embody('OK'))).toEqual([]);
		});

		it('also returns an empty array on parse-fail (placeholder invariant)', () => {
			expect(core.recommend(embody('FAIL_AT_PARSE'))).toEqual([]);
		});

		it('also returns an empty array on tokenize-fail (placeholder invariant)', () => {
			expect(core.recommend(embody('FAIL_AT_TOKENIZE'))).toEqual([]);
		});

		it('returned array is frozen', () => {
			expect(Object.isFrozen(core.recommend(embody('OK')))).toBe(true);
		});
	});
});
