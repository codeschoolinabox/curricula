import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import comprehensionGenericAnalyzers from '../analyzers/comprehension-generic.js';
import type { CodeQuestion, ProgramAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The comprehension analyzers ignore scope; an empty ScopeUsage suffices. */
const NO_SCOPE: ScopeUsage = { allDeclarations: [] };

/** Runs a program analyzer over the full AST once and returns its questions. */
function analyzeProgram(
	source: string,
	analyze: ProgramAnalyzer,
): readonly CodeQuestion[] {
	const ast = parseSource(source);
	return analyze(ast, NO_SCOPE, source);
}

function getAnalyzer(id: string): ProgramAnalyzer {
	const entry = comprehensionGenericAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension generic analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('comprehension generic analyzers', () => {
	it('exports 3 analyzers', () => {
		expect(comprehensionGenericAnalyzers).toHaveLength(3);
	});

	describe('read-aloud', () => {
		const analyze = getAnalyzer('read-aloud');

		it('fires on programs with 2 or more statements', () => {
			const results = analyzeProgram('const x = 5;\nconst y = 10;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on single-statement programs', () => {
			const results = analyzeProgram('const x = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on empty programs', () => {
			const results = analyzeProgram('', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeProgram('const x = 5;\nconst y = 10;', analyze);
			expect(results[0].id).toBe('read-aloud');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('reading');
		});
	});

	describe('program-paths', () => {
		const analyze = getAnalyzer('program-paths');

		it('fires on programs with an if statement', () => {
			const results = analyzeProgram(
				'const x = true;\nif (x) { alert("yes"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a while loop', () => {
			const results = analyzeProgram(
				'let i = 0;\nwhile (i < 3) { i = i + 1; }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a for-of loop', () => {
			const results = analyzeProgram(
				'const word = "hello";\nfor (const char of word) { alert(char); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a classic for loop', () => {
			const results = analyzeProgram(
				'for (let i = 0; i < 3; i = i + 1) { alert(i); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a do-while loop', () => {
			const results = analyzeProgram(
				'let i = 0;\ndo { i = i + 1; } while (i < 3);',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a for-in loop', () => {
			const results = analyzeProgram(
				'const o = { a: 1 };\nfor (const k in o) { alert(k); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with a ternary expression', () => {
			const results = analyzeProgram(
				'const x = true ? 1 : 2;\nalert(x);',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on linear programs without branching', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst y = 10;\nalert(x + y);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire when branching words appear only inside a string', () => {
			const results = analyzeProgram(
				'const msg = "use a for loop or a while loop here";\nalert(msg);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire on logical operators, which branch no statement', () => {
			const results = analyzeProgram(
				'const x = true && false;\nalert(x);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeProgram('if (true) { alert("yes"); }', analyze);
			expect(results[0].id).toBe('program-paths');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('reading');
		});
	});

	describe('audience-perspective-taking', () => {
		const analyze = getAnalyzer('audience-perspective-taking');

		it('fires on programs with prompt() calls', () => {
			const results = analyzeProgram(
				'const name = prompt("What is your name?");\nalert(name);',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on programs with alert() calls', () => {
			const results = analyzeProgram('alert("Hello!");', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on programs without interaction calls', () => {
			const results = analyzeProgram('const x = 5;\nconst y = x + 1;', analyze);
			expect(results).toHaveLength(0);
		});
	});
});
