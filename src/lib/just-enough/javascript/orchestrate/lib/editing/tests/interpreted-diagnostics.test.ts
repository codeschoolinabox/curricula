// Pure tests for the supersede merge in interpreted-diagnostics.ts.
//
// Predicate under test: POSITIONAL IDENTITY — an interpreted diagnostic
// supersedes any structural diagnostic at the same (line, column);
// everything else from both feeds coexists. The non-goals fence (no
// range-overlap, no message similarity, no severity arbitration, no
// intra-feed dedup, no source-string dispatch) is documented on the
// merge's JSDoc; these tests deliberately do NOT assert beyond it.
//
// The component-level pipeline tests (does a push repaint the gutter?)
// live in ../../../editor/tests/index.test.tsx — this file covers only
// the pure merge semantics.

import { describe, expect, it } from 'vitest';

import interpretedDiagnostics from '../interpreted-diagnostics.js';
import type { LintDiagnostic } from '../types.js';

const { merge } = interpretedDiagnostics;

function makeDiagnostic(
	line: number,
	column: number,
	message: string,
): LintDiagnostic {
	return Object.freeze({
		line,
		column,
		severity: 'error' as const,
		message,
	});
}

describe('mergeDiagnostics — positional supersede', () => {
	describe('Zero — empty feeds', () => {
		it('returns an empty array when both feeds are empty', () => {
			expect(merge(Object.freeze([]), Object.freeze([]))).toEqual([]);
		});
	});

	describe('One — single-feed pass-through', () => {
		it('passes a structural-only feed through unchanged', () => {
			const structural = Object.freeze([
				makeDiagnostic(1, 0, 'terse-a'),
				makeDiagnostic(2, 4, 'terse-b'),
			]);
			const merged = merge(structural, Object.freeze([]));
			expect(merged).toHaveLength(2);
			expect(merged.map((diagnostic) => diagnostic.message)).toEqual(
				expect.arrayContaining(['terse-a', 'terse-b']),
			);
		});

		it('passes an interpreted-only feed through unchanged', () => {
			const interpreted = Object.freeze([makeDiagnostic(1, 0, 'friendly')]);
			const merged = merge(Object.freeze([]), interpreted);
			expect(merged).toHaveLength(1);
			expect(merged[0]?.message).toBe('friendly');
		});
	});

	describe('Many + Boundaries — the supersede predicate', () => {
		it('an interpreted diagnostic supersedes the structural one at the same (line, column)', () => {
			const structural = Object.freeze([makeDiagnostic(1, 0, 'terse')]);
			const interpreted = Object.freeze([makeDiagnostic(1, 0, 'friendly')]);
			const merged = merge(structural, interpreted);
			expect(merged).toHaveLength(1);
			expect(merged[0]?.message).toBe('friendly');
		});

		it('same line but different column does NOT supersede — both coexist', () => {
			const structural = Object.freeze([makeDiagnostic(1, 0, 'terse')]);
			const interpreted = Object.freeze([makeDiagnostic(1, 4, 'friendly')]);
			const merged = merge(structural, interpreted);
			expect(merged).toHaveLength(2);
			expect(merged.map((diagnostic) => diagnostic.message)).toEqual(
				expect.arrayContaining(['terse', 'friendly']),
			);
		});

		it('supersedes only the colliding structural diagnostic, never the whole feed', () => {
			// Kills a setDiagnostics-style blanket replacement: two structural
			// diagnostics, one interpreted colliding with the first — the
			// second structural must survive.
			const structural = Object.freeze([
				makeDiagnostic(1, 0, 'terse-a'),
				makeDiagnostic(2, 0, 'terse-b'),
			]);
			const interpreted = Object.freeze([makeDiagnostic(1, 0, 'friendly')]);
			const merged = merge(structural, interpreted);
			expect(merged).toHaveLength(2);
			const messages = merged.map((diagnostic) => diagnostic.message);
			expect(messages).toEqual(expect.arrayContaining(['friendly', 'terse-b']));
			expect(messages).not.toContain('terse-a');
		});
	});
});
