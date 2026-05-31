/**
 * @file Pure-TS tests for the `parsons` lens core. No React, no jsdom.
 * ZOMBIES coverage of the LensModule-defaults trio (`config`,
 * `applicableTo`, `recommend`) per `../README.md` § Public API and
 * `../DOCS.md` § Architectural sketch.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import core from '../core.js';

describe('parsons core', () => {
	describe('config', () => {
		describe('no overrides → empty config (v1 has no defaults)', () => {
			it('returns an empty object', () => {
				expect(Object.keys(core.config())).toEqual([]);
			});

			it('seed key is absent (wrapper computes per-mount)', () => {
				expect(Object.hasOwn(core.config(), 'seed')).toBe(false);
			});
		});

		describe('{ seed: 42 } override', () => {
			it('seed is 42', () => {
				expect(core.config({ seed: 42 }).seed).toBe(42);
			});
		});

		describe('unknown-field passthrough (open-shape contract)', () => {
			it('unknown field is preserved verbatim', () => {
				expect(core.config({ futureKnob: 'x' }).futureKnob).toBe('x');
			});
		});

		describe('null value override (open-shape contract — overrides win)', () => {
			it('null override is preserved verbatim', () => {
				expect(core.config({ seed: null }).seed).toBe(null);
			});
		});

		describe('deep-freeze invariant', () => {
			it('returned config object is frozen', () => {
				expect(Object.isFrozen(core.config())).toBe(true);
			});

			it('mutating the returned config object throws', () => {
				const resolved = core.config({ seed: 7 });
				expect(() => {
					(resolved as { seed: number }).seed = 99;
				}).toThrow();
			});

			it('nested array in override is also frozen (deep-freeze contract)', () => {
				const resolved = core.config({ futureArray: ['a', 'b'] });
				expect(
					Object.isFrozen((resolved as { futureArray: string[] }).futureArray),
				).toBe(true);
			});
		});
	});

	describe('applicableTo (Tier 1 — always applies)', () => {
		it('returns true for the apex snippet', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns true for a parse-fail snippet (Tier 1 ignores parse status)', () => {
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(true);
		});

		it('returns true for a tokenize-fail snippet', () => {
			expect(core.applicableTo(embody('FAIL_AT_TOKENIZE'))).toBe(true);
		});
	});

	describe('recommend (WS2-deferred placeholder — always empty)', () => {
		it('returns an empty array regardless of embodiment status', () => {
			expect(core.recommend(embody('OK'))).toEqual([]);
		});

		it('also returns an empty array on parse-fail', () => {
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
