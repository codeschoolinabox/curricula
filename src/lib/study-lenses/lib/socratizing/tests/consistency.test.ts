import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import deriveScopeUsage from '../../scoping/derive-scope-usage.js';
import consistencyAnalyzers from '../analyzers/consistency.js';
import type { CodeQuestion, ProgramAnalyzer } from '../types.js';

/**
 * Runs a program analyzer once over the full AST against a REAL scope built
 * from the same embody parse — so mixed-declaration-style reads the actual
 * eslint-scope kind/write-count classification.
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

function getAnalyzer(id: string): ProgramAnalyzer {
	const entry = consistencyAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Consistency analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('consistency analyzers', () => {
	it('exports 4 analyzers', () => {
		expect(consistencyAnalyzers).toHaveLength(4);
	});

	describe('mixed-declaration-style', () => {
		const analyze = getAnalyzer('mixed-declaration-style');

		it('fires when program has const AND unreassigned let', () => {
			const results = analyzeProgram(
				'const name = "hello";\nlet count = 5;\nconsole.log(name, count);',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('consistency');
		});

		it('does not fire when all lets are reassigned', () => {
			const results = analyzeProgram(
				'const name = "hello";\nlet count = 0;\ncount = 5;\nconsole.log(name, count);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when only const is used', () => {
			const results = analyzeProgram(
				'const name = "hello";\nconst count = 5;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when program has only let (no const)', () => {
			// Mirror case: proves the `hasConst` operand of the AND-gate, not just
			// `hasUnreassignedLet`.
			const results = analyzeProgram(
				'let count = 5;\nconsole.log(count);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-string-construction', () => {
		const analyze = getAnalyzer('mixed-string-construction');

		it('fires when program uses both template literals and concatenation', () => {
			const results = analyzeProgram(
				'const name = "world";\nconst greeting = `hello ${name}`;\nconst farewell = "bye " + name;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only one style is used', () => {
			const results = analyzeProgram(
				'const name = "world";\nconst greeting = `hello ${name}`;\nconst farewell = `bye ${name}`;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when only concatenation is used', () => {
			// Mirror case: proves the `hasTemplateLiteral` operand of the AND-gate.
			const results = analyzeProgram(
				'const name = "world";\nconst greeting = "hello " + name;\nconst farewell = "bye " + name;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-equality', () => {
		const analyze = getAnalyzer('mixed-equality');

		it('fires when program uses both strict and loose equality', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst a = x === 5;\nconst b = x == "5";',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only strict equality is used', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst a = x === 5;\nconst b = x !== 3;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when only loose equality is used', () => {
			// Mirror case: proves the `hasStrict` operand of the AND-gate.
			const results = analyzeProgram(
				'const x = 5;\nconst a = x == 5;\nconst b = x != "3";',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('mixed-condition-style', () => {
		const analyze = getAnalyzer('mixed-condition-style');

		it('fires when program uses both truthy and explicit checks', () => {
			const results = analyzeProgram(
				'const input = prompt("test");\nif (input) { console.log(input); }\nif (input !== null) { console.log("not null"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when only explicit checks are used', () => {
			const results = analyzeProgram(
				'const input = prompt("test");\nif (input !== null) { console.log(input); }\nif (input !== "") { console.log("not empty"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when only truthy checks are used', () => {
			// Mirror case: proves the `hasExplicitCheck` operand of the AND-gate.
			const results = analyzeProgram(
				'const input = prompt("test");\nif (input) { console.log(input); }\nif (!input) { console.log("empty"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('asks about the one value checked both ways, not about every condition', () => {
			const results = analyzeProgram(
				'if (user.active) {\n  render();\n}\nif (user.active === true) {\n  audit();\n}',
				analyze,
			);
			expect(results[0].questions.map((q) => q.text)).toEqual([
				'Is the mix of a truthy check and an explicit comparison on the same value deliberate?',
				'How would the code read if that value used one style?',
			]);
		});

		it('does not fire when different subjects each use their idiomatic style', () => {
			// A boolean flag checked truthily and a DIFFERENT value checked by
			// equality is correct, not mixed — this must not fire (the harmful case).
			const results = analyzeProgram(
				'if (isLoggedIn) {\n  showDashboard();\n}\nif (role === "admin") {\n  showAdmin();\n}',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('fires when the SAME subject is checked both ways (incl. member expressions)', () => {
			const results = analyzeProgram(
				'if (user.active) {\n  render();\n}\nif (user.active === true) {\n  audit();\n}',
				analyze,
			);
			expect(results).toHaveLength(1);
		});
	});
});
