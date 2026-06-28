/**
 * Pure-TS tests for the `quiz` lens core — the `LensModule` defaults
 * (`config`, `applicableTo`, `recommend`). No jsdom: these are pure functions
 * over a `Snippet` and a config bundle. Slice A has NO config defaults (the V1
 * form is parameterless), so `config()` is an open-shape passthrough; the gate
 * is Tier-2 (`status.parsed`); `recommend` is the frozen empty array.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { LensConfig } from '../../types.js';
import core from '../core.js';

describe('quiz core', () => {
	describe('config', () => {
		it('Zero — no overrides returns an empty object (no Slice-A defaults)', () => {
			expect(core.config()).toEqual({});
		});

		it('returns a frozen object', () => {
			expect(Object.isFrozen(core.config())).toBe(true);
		});

		it('preserves an override verbatim (open-shape)', () => {
			const resolved = core.config({
				categories: ['identifier', 'keyword'],
			} as Partial<LensConfig>);
			expect(resolved.categories).toEqual(['identifier', 'keyword']);
		});

		it('preserves a null override (no `??` coercion)', () => {
			const resolved = core.config({ extra: null } as Partial<LensConfig>);
			expect(resolved.extra).toBeNull();
		});

		it('clones array overrides — the caller-side array stays mutable', () => {
			const input = ['identifier'];
			core.config({ categories: input } as Partial<LensConfig>);
			// cloneAndFreeze froze a copy, not the caller's array.
			expect(Object.isFrozen(input)).toBe(false);
		});
	});

	describe('applicableTo (Tier 2 — status.parsed)', () => {
		it('returns true for a parseable snippet', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns false for an unparseable snippet', () => {
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(false);
		});
	});

	describe('recommend (Slice A — frozen empty array)', () => {
		it('returns an empty array', () => {
			expect(core.recommend(embody('OK'))).toEqual([]);
		});

		it('returns a frozen array', () => {
			expect(Object.isFrozen(core.recommend(embody('OK')))).toBe(true);
		});

		it('returns the same reference across calls (module-level constant)', () => {
			expect(core.recommend(embody('OK'))).toBe(core.recommend(embody('OK')));
		});
	});
});
