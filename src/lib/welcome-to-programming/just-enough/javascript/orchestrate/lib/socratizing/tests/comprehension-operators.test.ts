import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../../../embody/lib/scope/build-scope.js';
import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';

import comprehensionOperatorAnalyzers from '../analyzers/comprehension-operators.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function analyzeAll(source: string, analyzerFn: PointAnalyzer): CodeQuestion[] {
	const ast = parseSource(source);
	const scope = buildScope(ast);
	const results: CodeQuestion[] = [];

	function walk(node: Node): void {
		const result = analyzerFn(node, scope, source);
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
	const entry = comprehensionOperatorAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension operator analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension operator analyzers', () => {
	it('exports 4 analyzers', () => {
		expect(comprehensionOperatorAnalyzers).toHaveLength(4);
	});

	describe('comparison-result', () => {
		const analyze = getAnalyzer('comparison-result');

		it('fires on === comparison', () => {
			const results = analyzeAll(
				'const x = 5;\nconst eq = x === 5;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on !== comparison', () => {
			const results = analyzeAll(
				'const x = null;\nconst ne = x !== null;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on < comparison', () => {
			const results = analyzeAll(
				'const x = 3;\nconst lt = x < 10;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on arithmetic operators', () => {
			const results = analyzeAll('const sum = 1 + 2;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'const x = 5;\nconst eq = x === 5;',
				analyze,
			);
			expect(results[0].id).toBe('comparison-result');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('operators');
		});
	});

	describe('logical-operator-behavior', () => {
		const analyze = getAnalyzer('logical-operator-behavior');

		it('fires on && operator', () => {
			const results = analyzeAll(
				'const a = true;\nconst b = false;\nconst c = a && b;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on || operator', () => {
			const results = analyzeAll(
				'const a = true;\nconst b = false;\nconst c = a || b;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on ?? operator', () => {
			const results = analyzeAll(
				'const x = null;\nconst y = x ?? "default";',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'const a = true;\nconst b = false;\nconst c = a && b;',
				analyze,
			);
			expect(results[0].id).toBe('logical-operator-behavior');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('operators');
		});
	});

	describe('arithmetic-result', () => {
		const analyze = getAnalyzer('arithmetic-result');

		it('fires on numeric addition', () => {
			const results = analyzeAll(
				'const a = 3;\nconst b = a + 2;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on subtraction', () => {
			const results = analyzeAll(
				'const a = 10;\nconst b = a - 3;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on modulo', () => {
			const results = analyzeAll(
				'const a = 10;\nconst b = a % 3;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on string concatenation with a string literal', () => {
			const results = analyzeAll(
				'const name = "world";\nconst greeting = "hello " + name;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire on comparison operators', () => {
			const results = analyzeAll(
				'const x = 5;\nconst lt = x < 10;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'const a = 3;\nconst b = a + 2;',
				analyze,
			);
			expect(results[0].id).toBe('arithmetic-result');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('operators');
		});
	});

	describe('operator-swap', () => {
		const analyze = getAnalyzer('operator-swap');

		it('fires on === comparisons', () => {
			const results = analyzeAll(
				'const x = 5;\nconst eq = x === 5;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on < comparisons', () => {
			const results = analyzeAll(
				'const x = 3;\nconst lt = x < 10;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on arithmetic operators', () => {
			const results = analyzeAll('const sum = 1 + 2;', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on logical operators', () => {
			const results = analyzeAll(
				'const a = true;\nconst b = false;\nconst c = a && b;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});
});
