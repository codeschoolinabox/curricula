import { describe, it, expect } from 'vitest';

import embody from '../../../../embody/index.js';

import analyzeMicroDecisions from '../analyze-micro-decisions.js';

// Phase B followup: Phase A reduces these tests to "pipeline shape" only because
// the mock embody factory returns a stub Program with body: [] — all AST-dependent
// analyzers produce zero questions. When real parsing is wired in (Phase B), restore
// end-to-end tests verifying specific analyzer outputs for representative source
// strings (e.g., let-vs-const, mixed-equality, voice profile).
// Per-analyzer coverage in Phase A lives in the 16 sibling test files.
//
// Dual-guard gap (untestable in Phase A): the branch `status.parsed:true &&
// parse.ast:undefined` in analyze-micro-decisions.ts cannot be produced by the
// Phase A mock — buildFailAtCreateSnippet and buildApexSnippet both populate
// parse.ast when status.parsed is true. This defensive fallback is dead code
// in Phase A and cannot be covered until Phase B wires real parsing.

describe('analyzeMicroDecisions — integration', () => {
	describe('parse failure path (Zero)', () => {
		it('returns ok: false when tokenization failed', () => {
			const result = analyzeMicroDecisions(embody('FAIL_AT_TOKENIZE'));
			expect(result.ok).toBe(false);
		});

		it('returns ok: false when parse failed', () => {
			const result = analyzeMicroDecisions(embody('FAIL_AT_PARSE'));
			expect(result.ok).toBe(false);
		});

		it('error has a message string', () => {
			const result = analyzeMicroDecisions(embody('FAIL_AT_TOKENIZE'));
			if (result.ok) throw new Error('Expected ok: false');
			expect(typeof result.error.message).toBe('string');
			expect(result.error.message.length).toBeGreaterThan(0);
		});
	});

	describe('parsed path (One)', () => {
		// Triangulation: FAIL_AT_PARSE → ok:false, FAIL_AT_CREATE → ok:true.
		// These two together rule out any hardcoded return.

		it('returns ok: true when embodiment is parsed (OK)', () => {
			const result = analyzeMicroDecisions(embody('OK'));
			expect(result.ok).toBe(true);
		});

		it('returns ok: true for create-failure embodiment (parsed=true, ast present)', () => {
			// Dual-guard truth-branch: status.parsed=T and parse.ast present even
			// when status.created=F. Confirms ok:true is driven by AST availability,
			// not by full-success status.
			const result = analyzeMicroDecisions(embody('FAIL_AT_CREATE'));
			expect(result.ok).toBe(true);
		});

		it('returns ok: true for apex eval-outcome scenarios', () => {
			// All apex scenarios (OK, VALIDATION_FAIL, NON_DETERMINISTIC, PAUSES,
			// EVAL_*) have status.parsed:true and parse.ast populated with a stub
			// Program. analyzeMicroDecisions reads only parse.ast — not static,
			// streams.evaluate, or status.created — so all apex scenarios return
			// ok:true regardless of eval outcome.
			const result = analyzeMicroDecisions(embody('EVAL_ERROR'));
			expect(result.ok).toBe(true);
		});

		it('questions is an array (empty with Phase A stub AST)', () => {
			const result = analyzeMicroDecisions(embody('OK'));
			if (!result.ok) throw new Error('Expected ok: true');
			expect(Array.isArray(result.questions)).toBe(true);
		});

		it('analyzerErrors is absent when no analyzer threw', () => {
			// Tests the conditional spread: analyzerErrors must be absent (not an
			// empty array) when all analyzers complete without throwing.
			const result = analyzeMicroDecisions(embody('OK'));
			if (!result.ok) throw new Error('Expected ok: true');
			expect(result.analyzerErrors).toBeUndefined();
		});
	});

	describe('config filtering (does not crash on empty result set)', () => {
		// Cap logic is exercised in filter-questions.test.ts; these tests guard
		// the integration path only (pipeline does not throw for non-default config
		// even when the stub AST produces zero questions).

		it('kind filter on empty result returns empty array', () => {
			const result = analyzeMicroDecisions(embody('OK'), {
				kind: { microDecision: false },
			});
			if (!result.ok) throw new Error('Expected ok: true');
			expect(Array.isArray(result.questions)).toBe(true);
		});

		it('count cap on empty result returns empty array', () => {
			const result = analyzeMicroDecisions(embody('OK'), { count: 1 });
			if (!result.ok) throw new Error('Expected ok: true');
			expect(result.questions.length).toBeLessThanOrEqual(1);
		});
	});

	describe('result immutability', () => {
		it('ok:true result is frozen', () => {
			const result = analyzeMicroDecisions(embody('OK'));
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('ok:true questions array is frozen', () => {
			const result = analyzeMicroDecisions(embody('OK'));
			if (!result.ok) throw new Error('Expected ok: true');
			expect(Object.isFrozen(result.questions)).toBe(true);
		});

		it('ok:false result is frozen', () => {
			const result = analyzeMicroDecisions(embody('FAIL_AT_TOKENIZE'));
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
