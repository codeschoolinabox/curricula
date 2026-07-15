import { parse } from 'acorn';
import type { Node } from 'acorn';
import { describe, it, expect } from 'vitest';

import getChildNodes from '../../../../../embody/lib/parse-old/get-child-nodes.js';
import buildScope from '../../../../../embody/lib/scope/build-scope.js';
import voiceAnalyzers from '../analyzers/voice.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function analyzeAll(
	source: string,
	analyzerFunction: PointAnalyzer,
): CodeQuestion[] {
	const ast = parseSource(source);
	const scope = buildScope(ast);
	const results: CodeQuestion[] = [];

	function walk(node: Node): void {
		const result = analyzerFunction(node, scope, source);
		if (result !== null) {
			results.push(result);
		}
		for (const child of getChildNodes(node)) {
			walk(child);
		}
	}

	walk(ast);
	return results;
}

function getAnalyzer(id: string): PointAnalyzer {
	const entry = voiceAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Voice analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('voice analyzers', () => {
	it('exports 10 analyzers', () => {
		expect(voiceAnalyzers).toHaveLength(10);
	});

	describe('naming-descriptiveness', () => {
		const analyze = getAnalyzer('naming-descriptiveness');

		it('fires on single-character variable names', () => {
			const results = analyzeAll('let x = 5;', analyze);
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('x');
		});

		it('fires on two-character variable names', () => {
			const results = analyzeAll('const ab = 10;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on names longer than 2 characters', () => {
			const results = analyzeAll('let count = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('let x = 1;', analyze);
			expect(results[0].category).toBe('voice');
			expect(results[0].feature).toBe('variables');
		});
	});

	describe('string-construction', () => {
		const analyze = getAnalyzer('string-construction');

		it('fires on template literals with expressions', () => {
			const results = analyzeAll(
				'const name = "world";\nconst greeting = `hello ${name}`;',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].nodeType).toBe('TemplateLiteral');
		});

		it('does not fire on template literals without expressions', () => {
			const results = analyzeAll('const msg = `plain string`;', analyze);
			expect(results).toHaveLength(0);
		});

		it('fires on string concatenation with + and a string literal', () => {
			const results = analyzeAll(
				'const name = "world";\nconst greeting = "hello " + name;',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].nodeType).toBe('BinaryExpression');
		});

		it('does not fire on numeric addition', () => {
			const results = analyzeAll('const sum = 1 + 2;', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('ternary-vs-if-else', () => {
		const analyze = getAnalyzer('ternary-vs-if-else');

		it('fires on conditional expressions', () => {
			const results = analyzeAll(
				'const x = true;\nconst y = x ? "yes" : "no";',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].feature).toBe('controlFlow');
		});

		it('does not fire on if statements', () => {
			const results = analyzeAll(
				'let y = "";\nif (true) { y = "yes"; }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('string-method-choice', () => {
		const analyze = getAnalyzer('string-method-choice');

		it('fires on .toLowerCase()', () => {
			const results = analyzeAll(
				'const input = "HELLO";\nconst lower = input.toLowerCase();',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('.toLowerCase()');
		});

		it('fires on .includes()', () => {
			const results = analyzeAll(
				'const text = "hello world";\nconst has = text.includes("hello");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on non-string methods', () => {
			const results = analyzeAll('console.log("hello");', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('nullish-coalescing', () => {
		const analyze = getAnalyzer('nullish-coalescing');

		it('fires on ?? operator', () => {
			const results = analyzeAll(
				'const input = null;\nconst value = input ?? "default";',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on || operator', () => {
			const results = analyzeAll(
				'const input = null;\nconst value = input || "default";',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('for-of-iterator-naming', () => {
		const analyze = getAnalyzer('for-of-iterator-naming');

		it('fires on for-of loops', () => {
			const results = analyzeAll(
				'const items = "hello";\nfor (const char of items) { }',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('char');
		});
	});

	describe('input-validation-strategy', () => {
		const analyze = getAnalyzer('input-validation-strategy');

		it('fires on prompt() calls', () => {
			const results = analyzeAll(
				'const input = prompt("enter something:");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on alert() calls', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('console-log-audience', () => {
		const analyze = getAnalyzer('console-log-audience');

		it('fires on console.log()', () => {
			const results = analyzeAll('console.log("debug");', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on alert()', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('operator-choice', () => {
		const analyze = getAnalyzer('operator-choice');

		it('fires on ===', () => {
			const results = analyzeAll('const x = 5;\nconst eq = x === 5;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on !==', () => {
			const results = analyzeAll(
				'const x = null;\nconst ne = x !== null;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on < or >', () => {
			const results = analyzeAll('const x = 5;\nconst lt = x < 10;', analyze);
			expect(results).toHaveLength(0);
		});
	});
});
