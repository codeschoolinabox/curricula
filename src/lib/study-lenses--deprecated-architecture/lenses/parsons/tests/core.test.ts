import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';

import core from '../core.js';

describe('parsons core', () => {
	describe('config', () => {
		describe('Zero — no overrides applies all four defaults', () => {
			it('canIndent defaults to true', () => {
				expect(core.config().canIndent).toBe(true);
			});

			it('maxDistractors defaults to 10', () => {
				expect(core.config().maxDistractors).toBe(10);
			});

			it('indentSize defaults to 4', () => {
				expect(core.config().indentSize).toBe(4);
			});

			it('viewMode defaults to "work"', () => {
				expect(core.config().viewMode).toBe('work');
			});
		});

		describe('One — single-field overrides win', () => {
			it('canIndent override wins (false is preserved, not coerced by ||)', () => {
				// `canIndent || true` would wrongly coerce false to the default;
				// spread `{ ...overrides }` preserves it.
				expect(core.config({ canIndent: false }).canIndent).toBe(false);
			});

			it('maxDistractors override wins over default', () => {
				expect(core.config({ maxDistractors: 3 }).maxDistractors).toBe(3);
			});

			it('indentSize override wins over default', () => {
				expect(core.config({ indentSize: 2 }).indentSize).toBe(2);
			});

			it('viewMode override wins over default', () => {
				expect(core.config({ viewMode: 'complete' }).viewMode).toBe('complete');
			});
		});

		describe('Boundaries — open-shape preserves unknown keys', () => {
			it('preserves unknown keys verbatim', () => {
				expect(core.config({ unknownField: 'preserved' })['unknownField']).toBe(
					'preserved',
				);
			});

			it('still applies defaults alongside unknown keys', () => {
				expect(core.config({ unknownField: 'x' }).maxDistractors).toBe(10);
			});

			it('null override is preserved verbatim (not coerced to default)', () => {
				// Triangulates against the `overrides?.field ?? default` anti-pattern.
				expect(core.config({ maxDistractors: null }).maxDistractors).toBe(null);
			});

			it('an array-valued unknown key is deep-frozen in the returned config', () => {
				// Earns the "deep-frozen" claim and pins cloneAndFreeze (which
				// deep-clones+freezes nested values) over a shallow freeze.
				const resolved = core.config({ extra: [1, 2] });
				expect(
					Object.isFrozen(resolved['extra'] as ReadonlyArray<number>),
				).toBe(true);
			});
		});

		describe('Interfaces — frozen return + no caller-side mutation', () => {
			it('returns a deep-frozen LensConfig', () => {
				expect(Object.isFrozen(core.config())).toBe(true);
			});

			it('does not freeze the caller-supplied overrides object (cloneAndFreeze, not in-place)', () => {
				const input = { canIndent: false };
				core.config(input);
				expect(Object.isFrozen(input)).toBe(false);
			});

			it('accepts undefined overrides', () => {
				expect(() => core.config(undefined)).not.toThrow();
			});

			it('accepts an empty-object overrides (defaults still apply)', () => {
				expect(core.config({}).viewMode).toBe('work');
			});
		});

		describe('Many — all four fields overridden simultaneously', () => {
			it('all four documented fields can be overridden in one call', () => {
				const resolved = core.config({
					canIndent: false,
					maxDistractors: 0,
					indentSize: 2,
					viewMode: 'complete',
				});
				expect(resolved.canIndent).toBe(false);
				expect(resolved.maxDistractors).toBe(0);
				expect(resolved.indentSize).toBe(2);
				expect(resolved.viewMode).toBe('complete');
			});
		});
	});

	describe('applicableTo (Tier 1 — always applicable, diverges from blanks)', () => {
		it('returns true for a parsed snippet', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns true for a parse-fail snippet (no AST needed — Tier 1)', () => {
			// The KEY divergence from blanks (Tier 2): parsons reorders text lines
			// and does not require a successful parse.
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(true);
		});

		it('returns true for a tokenize-fail snippet', () => {
			expect(core.applicableTo(embody('FAIL_AT_TOKENIZE'))).toBe(true);
		});
	});

	describe('recommend (WS2-deferred — empty array)', () => {
		it('returns an empty array', () => {
			expect(core.recommend(embody('OK'))).toEqual([]);
		});

		it('returns a frozen array', () => {
			expect(Object.isFrozen(core.recommend(embody('OK')))).toBe(true);
		});

		it('returns the same reference across calls (no per-call allocation)', () => {
			const a = core.recommend(embody('OK'));
			const b = core.recommend(embody('OK'));
			expect(a).toBe(b);
		});
	});
});
