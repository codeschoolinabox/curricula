/**
 * ZOMBIES tests for the JEJ-admission seam `isJejCompliant`. Pure function over
 * a `Snippet` — no jsdom. Fixtures come from the real `embody` engine: arbitrary
 * source goes through real composition (parses, `validation: null`), while the
 * named scenarios (`'OK'`, `'VALIDATION_FAIL'`) carry a recorded `validation`,
 * exercising the verdict-first branch. See `../DOCS.md` for the two-arm design.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import isJejCompliant from '../is-jej-compliant.js';

describe('isJejCompliant', () => {
	describe('Zero', () => {
		it('empty program → true (parses, no violations)', () => {
			expect(isJejCompliant(embody(''))).toBe(true);
		});
	});

	describe('One', () => {
		it('a compliant JEJ snippet → true', () => {
			expect(isJejCompliant(embody('let x = 1; x;'))).toBe(true);
		});

		it('a single JEJ violation (var) → false', () => {
			expect(isJejCompliant(embody('var x = 1;'))).toBe(false);
		});
	});

	describe('Many', () => {
		it('several compliant statements → true', () => {
			expect(isJejCompliant(embody('let a = 1; let b = 2; a + b;'))).toBe(true);
		});

		it('one violation among compliant statements → false', () => {
			expect(isJejCompliant(embody('let x = 1; function f() {}'))).toBe(false);
		});
	});

	// The other constructs the quiz gate excludes (`var` is covered under One).
	// These duplicate validate()-level coverage
	// (`embody/lib/validating/tests/collect-violations.test.ts`) but stand as
	// living documentation of exactly what the quiz gate refuses; each hits the
	// same re-validation arm as the `var` case, so they add catalog value, not
	// new branch coverage.
	describe('Denials the quiz gate excludes', () => {
		it('function → false', () => {
			expect(isJejCompliant(embody('function f() {}'))).toBe(false);
		});

		it('class → false', () => {
			expect(isJejCompliant(embody('class C {}'))).toBe(false);
		});

		it('try/catch → false', () => {
			expect(
				isJejCompliant(embody('try { let x = 1; } catch (e) { e; }')),
			).toBe(false);
		});
	});

	describe('Boundary — module-type guard (shadows status.validated)', () => {
		it('a script-type snippet with JEJ-valid source → false', () => {
			// embody() only produces module snippets today; override `type` to
			// exercise the `type === 'module'` guard directly. The seam must shadow
			// `status.validated` (structurally false under script), NOT
			// `validate(source.code).ok` alone (which would be true for this source).
			// This is a minimal single-field override, NOT a faithful script-shaped
			// Snippet (a real script snippet would also null `realm`/`validation`/…);
			// the seam reads only `validation`, `type`, `source.code`, so it suffices.
			const scriptSnippet = {
				...embody('let x = 1; x;'),
				type: 'script' as const,
			} satisfies Snippet;
			expect(isJejCompliant(scriptSnippet)).toBe(false);
		});
	});

	describe('Interface — verdict-first (reads the recorded verdict, not sentinel source)', () => {
		it("the apex scenario 'OK' → true (validation.isJeJ true flows through)", () => {
			expect(isJejCompliant(embody('OK'))).toBe(true);
		});

		it("the 'VALIDATION_FAIL' scenario → false — the divergence proof", () => {
			// This is the test that distinguishes verdict-first from
			// always-re-validate: the recorded verdict is `false` (canned
			// violation), yet re-validating its 'VALIDATION_FAIL' sentinel string
			// gives `ok: true` (a bare undeclared identifier is not a JEJ
			// violation). Only reading the verdict first yields the correct false.
			expect(isJejCompliant(embody('VALIDATION_FAIL'))).toBe(false);
		});
	});

	describe('Exception — never throws', () => {
		it('unparseable source → false (a throw would fail this test; validate never throws for string)', () => {
			expect(isJejCompliant(embody('let x = ;'))).toBe(false);
		});
	});

	describe('Simple — a richer JEJ program (re-point anchor)', () => {
		it('a ternary over a comparison stays admitted', () => {
			// A genuinely new JEJ-legal shape (ConditionalExpression + comparison),
			// not a re-run of the `let x = 1; x;` case. Doubles as the re-point
			// anchor: when embody wires validation into real composition, the body
			// collapses to `return embodiment.status.validated;` — this must stay true.
			expect(
				isJejCompliant(embody('let n = 3; let m = n > 0 ? n : 0; m;')),
			).toBe(true);
		});
	});
});
