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

	describe('applicableTo (Tier 2 + JEJ admission gate)', () => {
		it('returns true for a parseable, JEJ-compliant snippet', () => {
			expect(core.applicableTo(embody('OK'))).toBe(true);
		});

		it('returns true for real JEJ source', () => {
			expect(core.applicableTo(embody('let x = 1; x;'))).toBe(true);
		});

		it('returns false for an unparseable snippet (short-circuits on status.parsed)', () => {
			expect(core.applicableTo(embody('FAIL_AT_PARSE'))).toBe(false);
		});

		it('returns false for parseable-but-non-JEJ code (the new gate)', () => {
			// `function f(){}` parses but is not JEJ — the quiz generators assume the
			// JEJ scope model, so the lens gates itself out. The JEJ matrix is owned by
			// lib/admitting; here we only prove the `status.parsed && isJejCompliant`
			// composition.
			expect(core.applicableTo(embody('function f() {}'))).toBe(false);
		});

		it('returns false for a recorded validation failure (delegation proof — no keyword to pattern-match)', () => {
			// VALIDATION_FAIL's source.code is the bare identifier 'VALIDATION_FAIL'
			// (parseable, no function/var/class keyword), non-JEJ only via its recorded
			// validation.isJeJ=false. This forces genuine delegation to isJejCompliant —
			// a source.code string-match fake could not satisfy it.
			expect(core.applicableTo(embody('VALIDATION_FAIL'))).toBe(false);
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
