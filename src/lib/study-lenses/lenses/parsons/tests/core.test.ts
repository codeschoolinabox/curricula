// cspell:ignore distractors

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Gateable } from '../../../embody/types.js';
import type { Lens } from '../../types.js';
import core from '../core.js';

const {
	applicability,
	recommend,
}: {
	applicability: Gateable['applicability'];
	recommend: Required<Lens>['recommend'];
} = core;

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

		describe('Boundaries — open-shape + the kind contract edge rules', () => {
			it('preserves unknown keys verbatim', () => {
				expect(core.config({ unknownField: 'preserved' })['unknownField']).toBe(
					'preserved',
				);
			});

			it('still applies defaults alongside unknown keys', () => {
				expect(core.config({ unknownField: 'x' }).maxDistractors).toBe(10);
			});

			it('null override is a value and wins verbatim (not coerced to default)', () => {
				expect(core.config({ maxDistractors: null }).maxDistractors).toBe(null);
			});

			it('an override key present with undefined is treated as absent (default applies)', () => {
				expect(core.config({ maxDistractors: undefined }).maxDistractors).toBe(
					10,
				);
			});

			it('an array-valued unknown key is deep-frozen in the returned config', () => {
				expect(Object.isFrozen(core.config({ extra: [1, 2] })['extra'])).toBe(
					true,
				);
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

			it('accepts an empty-object overrides (defaults still apply)', () => {
				expect(core.config({}).viewMode).toBe('work');
			});
		});

		describe('Many — all four fields overridden simultaneously', () => {
			it('all four documented fields can be overridden in one call', () => {
				expect(
					core.config({
						canIndent: false,
						maxDistractors: 0,
						indentSize: 2,
						viewMode: 'complete',
					}),
				).toMatchObject({
					canIndent: false,
					maxDistractors: 0,
					indentSize: 2,
					viewMode: 'complete',
				});
			});
		});
	});

	describe('applicability (always applicable — text-only, no parse gate)', () => {
		it('holds over the facts of a clean program', () => {
			expect(applicability(embody('let x = 1').facts)).toBe(true);
		});

		it('holds over the facts of a grammar-failing program (no syntax tree needed)', () => {
			expect(applicability(embody('1 +').facts)).toBe(true);
		});

		it('holds over the facts of a spelling-failing program (no token stream needed)', () => {
			expect(applicability(embody('01').facts)).toBe(true);
		});
	});

	describe('recommend (empty until a recommender lands)', () => {
		it('returns an empty array', () => {
			expect(recommend(embody('let x = 1'))).toEqual([]);
		});

		it('returns a frozen array', () => {
			expect(Object.isFrozen(recommend(embody('let x = 1')))).toBe(true);
		});

		it('returns the same reference across calls (no per-call allocation)', () => {
			expect(recommend(embody('let x = 1'))).toBe(
				recommend(embody('let y = 2')),
			);
		});
	});
});
