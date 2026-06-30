import { describe, it, expect } from 'vitest';

import assertVaryExclusive from '../assert-vary-exclusive.js';
import type { AithorConfig } from '../types.js';

// Increment 2 — the mutual-exclusivity guard (config-shape throw 1). A `vary`
// that DECLARES any aspect is the higher-level way to set the raw subset/size, so
// pairing it with a raw include/exclude/lines/complexity is a contradiction that
// throws synchronously, before the model runs. `vary: {}` declares nothing (inert).
//
// The guard reads the RAW config (before resolveConfig defaults include/exclude to
// []), so an omitted field is `undefined`, distinguishable from a set one.

const base: AithorConfig = { prompt: '', model: 'm' };

describe('assertVaryExclusive', () => {
	describe('throws — vary declares an aspect beside a raw constraint', () => {
		it.each([
			['include', { include: ['if'] as const }],
			['exclude', { exclude: ['for'] as const }],
			['lines', { lines: 10 }],
			['complexity', { complexity: 2 }],
		])('a held languageLevel beside raw %s throws', (_label, raw) => {
			expect(() =>
				assertVaryExclusive({
					...base,
					vary: { languageLevel: false },
					...raw,
				}),
			).toThrow();
		});

		it('an explicitly-freed aspect (true) still counts as declared, so it conflicts', () => {
			expect(() =>
				assertVaryExclusive({
					...base,
					vary: { languageLevel: true },
					include: ['if'],
				}),
			).toThrow();
		});

		it('a soft aspect declared beside a raw constraint also throws (any aspect)', () => {
			expect(() =>
				assertVaryExclusive({ ...base, vary: { behavior: false }, lines: 5 }),
			).toThrow();
		});

		it('all four raw fields at once still throw (any one is enough)', () => {
			expect(() =>
				assertVaryExclusive({
					...base,
					vary: { languageLevel: true },
					include: ['if'],
					exclude: ['for'],
					lines: 10,
					complexity: 2,
				}),
			).toThrow();
		});
	});

	describe('does not throw — no contradiction', () => {
		it('vary: {} (inert) beside a raw constraint is fine', () => {
			expect(() =>
				assertVaryExclusive({ ...base, vary: {}, include: ['if'] }),
			).not.toThrow();
		});

		it('a declaring vary with no raw constraint is fine', () => {
			expect(() =>
				assertVaryExclusive({ ...base, vary: { languageLevel: false } }),
			).not.toThrow();
		});

		it('a raw constraint with no vary at all is fine', () => {
			expect(() =>
				assertVaryExclusive({ ...base, include: ['if'], lines: 10 }),
			).not.toThrow();
		});

		it('neither vary nor raw constraints is fine', () => {
			expect(() => assertVaryExclusive(base)).not.toThrow();
		});
	});
});
