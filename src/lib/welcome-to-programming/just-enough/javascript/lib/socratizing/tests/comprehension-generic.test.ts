import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../scope/build-scope.js';

import comprehensionGenericAnalyzers from '../analyzers/comprehension-generic.js';
import type { CodeQuestion, ProgramAnalyzer } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function analyzeProgram(
	source: string,
	analyzerFn: ProgramAnalyzer,
): readonly CodeQuestion[] {
	const ast = parseSource(source);
	const scope = buildScope(ast);
	return analyzerFn(ast, scope, source);
}

function getAnalyzer(id: string): ProgramAnalyzer {
	const entry = comprehensionGenericAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension generic analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension generic analyzers', () => {
	it('exports 3 analyzers', () => {
		expect(comprehensionGenericAnalyzers).toHaveLength(3);
	});

	describe('read-aloud', () => {
		const analyze = getAnalyzer('read-aloud');

		it('fires on programs with 2 or more statements', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst y = 10;',
				analyze,
			);
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
			const results = analyzeProgram(
				'const x = 5;\nconst y = 10;',
				analyze,
			);
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

		it('does not fire on linear programs without branching', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst y = 10;\nalert(x + y);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeProgram(
				'if (true) { alert("yes"); }',
				analyze,
			);
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
			const results = analyzeProgram(
				'alert("Hello!");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on programs without interaction calls', () => {
			const results = analyzeProgram(
				'const x = 5;\nconst y = x + 1;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});
});
