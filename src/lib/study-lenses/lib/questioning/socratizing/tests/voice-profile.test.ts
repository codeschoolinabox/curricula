import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import deriveScopeUsage from '../../../scoping/derive-scope-usage.js';
import voiceProfileAnalyzers from '../analyzers/voice-profile.js';
import type { CodeQuestion, ProgramAnalyzer } from '../types.js';

/**
 * Runs the program analyzer once over the full AST against a REAL scope built
 * from the same embody parse — voice-profile's `avgNameLength` metric reads
 * `scope.allDeclarations.map(d => d.name)`, so real scope is required.
 *
 * This analyzer has no quarry test; the cases below are authored by mirroring
 * its emit condition (fires iff `totalStatements >= 3`) and its trait
 * thresholds (descriptive naming `avgNameLength > 6`, terse `<= 3`, modern
 * idioms, structured control flow `maxNestingDepth >= 2`).
 */
function analyzeProgram(
	source: string,
	analyze: ProgramAnalyzer,
): readonly CodeQuestion[] {
	const { ast, environment } = embody(source).facts;
	if (!ast.ok || !environment.ok) {
		throw new Error('setup: facts did not derive');
	}
	const scope = deriveScopeUsage(environment.value);
	return analyze(ast.value, scope, source);
}

describe('voice-profile analyzer', () => {
	const { analyze } = voiceProfileAnalyzers[0];

	it('exports 1 analyzer', () => {
		expect(voiceProfileAnalyzers).toHaveLength(1);
	});

	describe('emit condition — at least 3 statements', () => {
		it('fires on a program with 3+ statements', () => {
			const results = analyzeProgram(
				'const a = 1;\nconst b = 2;\nconsole.log(a, b);',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('voice-profile');
			expect(results[0].category).toBe('voice');
		});

		it('does not fire on a program with fewer than 3 statements', () => {
			const results = analyzeProgram('const a = 1;\nconst b = 2;', analyze);
			expect(results).toHaveLength(0);
		});

		it('counts classic loop/switch statements toward the threshold', () => {
			// A for-loop program (ForStatement + let init + body call = 3) must
			// fire; before the statementTypes fix, for/switch/try were uncounted
			// and the whole voice-profile question was silently suppressed.
			const forProgram = analyzeProgram(
				'for (let i = 0; i < 3; i = i + 1) {\n  console.log(i);\n}',
				analyze,
			);
			expect(forProgram).toHaveLength(1);
			const switchProgram = analyzeProgram(
				'switch (n) {\n  case 1:\n    a();\n    break;\n  case 2:\n    b();\n    break;\n}',
				analyze,
			);
			expect(switchProgram).toHaveLength(1);
		});
	});

	describe('traits — the scope-derived naming metric', () => {
		it('reports descriptive naming for long declaration names (avgNameLength > 6)', () => {
			// Reads scope.allDeclarations names; under an empty scope this would
			// read as neutral, so this case anchors the real-scope wiring.
			const results = analyzeProgram(
				'const configuration = 1;\nconst initialization = 2;\nconsole.log(configuration, initialization);',
				analyze,
			);
			expect(results[0].context).toContain('descriptive naming');
		});

		it('reports terse naming for short declaration names (avgNameLength <= 3)', () => {
			const results = analyzeProgram(
				'const a = 1;\nconst b = 2;\nconsole.log(a, b);',
				analyze,
			);
			expect(results[0].context).toContain('terse naming');
		});
	});

	describe('traits — AST-derived dimensions', () => {
		// Neutral-length names (avg 5–5.5) isolate the modern-idioms trait from the
		// naming trait, so each of the three OR-disjuncts is proven independently.
		it('reports modern idioms for an interpolated template literal', () => {
			const results = analyzeProgram(
				'const label = "Alice";\nconst output = `hi ${label}`;\nconsole.log(output);',
				analyze,
			);
			expect(results[0].context).toContain('modern idioms');
		});

		it('reports modern idioms for nullish coalescing', () => {
			const results = analyzeProgram(
				'const value = 1;\nconst input = value ?? 0;\nconsole.log(input);',
				analyze,
			);
			expect(results[0].context).toContain('modern idioms');
		});

		it('reports modern idioms for optional chaining', () => {
			const results = analyzeProgram(
				'const state = {};\nconst value = state?.data;\nconsole.log(value);',
				analyze,
			);
			expect(results[0].context).toContain('modern idioms');
		});

		it('reports structured control flow for two levels of block nesting', () => {
			// A block nested inside another block (maxNestingDepth 2, 1-indexed) is
			// enough — the old 0-indexed count needed three levels.
			const results = analyzeProgram(
				'if (true) {\n  if (true) {\n    console.log(1);\n  }\n}',
				analyze,
			);
			expect(results[0].context).toContain('structured control flow');
			// Zero declarations → avgNameLength 0 → no naming trait: pins the `> 0` guard.
			expect(results[0].context).not.toContain('naming');
		});

		it('reports a neutral voice when no trait threshold is crossed', () => {
			const results = analyzeProgram(
				'const num1 = 1;\nconst num2 = 2;\nconsole.log(num1);',
				analyze,
			);
			expect(results[0].context).toContain('neutral');
		});
	});
});
