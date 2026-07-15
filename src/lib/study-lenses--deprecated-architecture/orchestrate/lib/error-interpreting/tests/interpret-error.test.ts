import { describe, it, expect } from 'vitest';

import embody from '../../../../../embody/index.js';
import interpretError from '../interpret-error.js';

// Phase B coverage gap: the dual guard `status.parsed && parse.ast`
// has three logical cases. The Phase A mock only exercises two:
//   (a) `status.parsed: true && parse.ast` present  → `embody('OK')`
//                                                     `embody('FAIL_AT_CREATE')`
//   (b) `status.parsed: false`                       → `embody('FAIL_AT_TOKENIZE')`
//                                                     `embody('FAIL_AT_PARSE')`
// The third case (`status.parsed: true && parse.ast` absent) is a valid
// `Partial<ParseGraph>` state that Phase B's real `embody/lib/parse/`
// may produce mid-construction. No Phase A mock scenario hits it; the
// AND-clause's protection is currently exercised only via the false
// side. Add coverage when Phase B introduces a scenario for it.

describe('interpretError', () => {
	// ── Z (Zero) ────────────────────────────────────────────
	describe('unknown error type', () => {
		it('returns a generic fallback for unknown errors', () => {
			// Degenerate embodiment (no AST, status all false) + an
			// error whose `name` matches no explanation pattern → the
			// generic fallback path. Drives the new (embodiment, error)
			// signature; exercises the dual guard's false-branch
			// (returns null AST → context extraction falls back to
			// error-message regex only).
			const result = interpretError(embody('FAIL_AT_TOKENIZE'), {
				name: 'WeirdError',
				message: 'something completely unknown',
				line: 1,
			});
			expect(result.whatWentWrong).toContain('WeirdError');
		});
	});

	// ── O (One) ─────────────────────────────────────────────
	describe('matched explanation pattern', () => {
		it('does not return the generic fallback for a known ReferenceError', () => {
			// Triangulates the Z-test: a hardcoded `buildFallback`
			// return would still pass the Z-assertion (which only
			// checks for "WeirdError" in the fallback message). The
			// `'does not have a specific explanation'` sentinel lives
			// in `buildFallback.likelyMisunderstanding` (per
			// `interpret-error.ts` line ~67) — asserting it is ABSENT
			// from `likelyMisunderstanding` proves a real pattern
			// matched and `buildFallback` did NOT fire.
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'myVar is not defined',
				line: 1,
			});
			expect(result.likelyMisunderstanding).not.toContain(
				'does not have a specific explanation',
			);
		});

		it('extracts the identifier name from the error message', () => {
			// `extractName`'s regex on `error.message` doesn't depend
			// on the AST — works against the apex mock's stub Program
			// (which has body: []). Demonstrates the static-side
			// extraction path remains intact.
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'myVar is not defined',
				line: 1,
			});
			expect(result.context?.name).toBe('myVar');
		});
	});

	// ── M (Many) ────────────────────────────────────────────
	describe('different error classes match different patterns', () => {
		it('matches a TypeError "Cannot read properties of null" pattern', () => {
			// Different error class than the O-test (TypeError vs
			// ReferenceError) — demonstrates the interpreter
			// generalizes across error classes, not just one.
			// Same triangulating assertion: the fallback-sentinel
			// phrase only appears in `buildFallback.likelyMisunderstanding`,
			// so its absence proves a real pattern fired.
			const result = interpretError(embody('OK'), {
				name: 'TypeError',
				message: "Cannot read properties of null (reading 'foo')",
				line: 1,
			});
			expect(result.likelyMisunderstanding).not.toContain(
				'does not have a specific explanation',
			);
		});
	});

	// ── Create-failure path (AR-3 Concern 4) ────────────────
	describe('create-failure embodiment', () => {
		it('does not throw when status.parsed:T but status.created:F', () => {
			// Scope of this test: verify the dual guard's
			// truth-branch (status.parsed && parse.ast) does not
			// crash on a non-apex embodiment. `embody('FAIL_AT_CREATE')`
			// has status: {parsed:T, created:F} with a populated
			// `parse.ast` (stub Program) — distinct from `embody('OK')`
			// (apex) and `embody('FAIL_AT_TOKENIZE')` (no AST). NOT
			// asserting a specific interpretation — only that the
			// guard's truth-branch on a create-failure embodiment
			// runs to completion without throwing.
			const result = interpretError(
				embody('FAIL_AT_CREATE'),
				{ name: 'SyntaxError', message: 'mock create-phase failure', line: 1 },
				{ phase: 'parse' },
			);
			expect(result.whatWentWrong).toBeDefined();
		});
	});

	// ── B (Boundaries) ──────────────────────────────────────
	describe('frozen output', () => {
		it('returns a frozen object', () => {
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('all fields populated', () => {
		// AR-3 Concern 5: split from one-assertion-each per
		// DEV.md § One Assertion Per Test convention.
		it('whatWentWrong is non-empty', () => {
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(result.whatWentWrong.length).toBeGreaterThan(0);
		});

		it('howToFix is non-empty', () => {
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(result.howToFix.length).toBeGreaterThan(0);
		});

		it('likelyMisunderstanding is non-empty', () => {
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(result.likelyMisunderstanding.length).toBeGreaterThan(0);
		});

		it('howToAdjust is non-empty', () => {
			const result = interpretError(embody('OK'), {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(result.howToAdjust.length).toBeGreaterThan(0);
		});
	});

	describe('handles missing line number', () => {
		it('returns a result without crashing when line is absent', () => {
			const result = interpretError(embody('OK'), {
				name: 'TypeError',
				message: 'something broke',
			});
			expect(result.whatWentWrong).toBeDefined();
		});
	});

	// ── Renamed per AR-3 Concern 6 ──────────────────────────
	// The original test was titled "handles empty source" and passed
	// `''` as the source string. Phase A's `embody()` mock does not
	// accept the empty-string sentinel, so that exact scenario is
	// untestable here. The closest analogue is a tokenize-failure
	// embodiment: no AST, status all false, source is the sentinel.
	describe('handles tokenize-failure embodiment', () => {
		it('returns a result for a FAIL_AT_TOKENIZE embodiment', () => {
			const result = interpretError(embody('FAIL_AT_TOKENIZE'), {
				name: 'SyntaxError',
				message: 'Unexpected end of input',
				line: 1,
			});
			expect(result.whatWentWrong).toBeDefined();
		});
	});

	// ── E (Exceptions) ──────────────────────────────────────
	describe('never throws', () => {
		it('handles pathological input without throwing', () => {
			expect(() =>
				interpretError(embody('FAIL_AT_TOKENIZE'), {
					name: '',
					message: '',
				}),
			).not.toThrow();
		});
	});
});
