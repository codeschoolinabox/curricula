import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../../../embody/lib/scope/build-scope.js';
import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';

import comprehensionControlFlowAnalyzers from '../analyzers/comprehension-control-flow.js';
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
	const entry = comprehensionControlFlowAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension control flow analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension control flow analyzers', () => {
	it('exports 7 analyzers', () => {
		expect(comprehensionControlFlowAnalyzers).toHaveLength(7);
	});

	describe('if-branches', () => {
		const analyze = getAnalyzer('if-branches');

		it('fires on an if statement', () => {
			const results = analyzeAll(
				'const x = true;\nif (x) { console.log("yes"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on non-if-statement nodes', () => {
			const results = analyzeAll('const x = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('if (true) {}', analyze);
			expect(results[0].id).toBe('if-branches');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('controlFlow');
		});
	});

	describe('while-loop-behavior', () => {
		const analyze = getAnalyzer('while-loop-behavior');

		it('fires on a while statement', () => {
			const results = analyzeAll(
				'let i = 0;\nwhile (i < 3) { i = i + 1; }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a for-of loop', () => {
			const results = analyzeAll(
				'const items = "abc";\nfor (const c of items) {}',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('while (true) {}', analyze);
			expect(results[0].id).toBe('while-loop-behavior');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('controlFlow');
		});
	});

	describe('for-of-iteration', () => {
		const analyze = getAnalyzer('for-of-iteration');

		it('fires on a for-of statement', () => {
			const results = analyzeAll(
				'const word = "hello";\nfor (const char of word) {}',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a while loop', () => {
			const results = analyzeAll('while (true) {}', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'const word = "hello";\nfor (const char of word) {}',
				analyze,
			);
			expect(results[0].id).toBe('for-of-iteration');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('controlFlow');
		});
	});

	describe('else-branch-purpose', () => {
		const analyze = getAnalyzer('else-branch-purpose');

		it('fires on an if statement with an else branch', () => {
			const results = analyzeAll(
				'const x = true;\nif (x) { alert("yes"); } else { alert("no"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on an if statement without an else branch', () => {
			const results = analyzeAll(
				'const x = true;\nif (x) { alert("yes"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'if (true) { } else { }',
				analyze,
			);
			expect(results[0].id).toBe('else-branch-purpose');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('controlFlow');
		});
	});

	describe('describe-condition', () => {
		const analyze = getAnalyzer('describe-condition');

		it('fires on if statements', () => {
			const results = analyzeAll(
				'const x = 5;\nif (x > 3) { alert("big"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on while statements', () => {
			const results = analyzeAll(
				'let i = 0;\nwhile (i < 10) { i = i + 1; }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('includes condition text in context', () => {
			const results = analyzeAll(
				'const x = 5;\nif (x > 3) { alert("big"); }',
				analyze,
			);
			expect(results[0].context).toContain('x > 3');
		});

		it('has correct metadata', () => {
			const results = analyzeAll('if (true) {}', analyze);
			expect(results[0].id).toBe('describe-condition');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('controlFlow');
		});
	});

	describe('control-flow-boundary', () => {
		const analyze = getAnalyzer('control-flow-boundary');

		it('fires on while loops', () => {
			const results = analyzeAll(
				'let i = 0;\nwhile (i < 3) { i = i + 1; }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on for-of loops', () => {
			const results = analyzeAll(
				'const word = "hello";\nfor (const char of word) {}',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on if statements', () => {
			const results = analyzeAll(
				'const x = true;\nif (x) { alert("yes"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('next-lines', () => {
		const analyze = getAnalyzer('next-lines');

		it('fires on branching/looping constructs', () => {
			const results = analyzeAll(
				'const x = true;\nif (x) { alert("yes"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on simple statements', () => {
			const results = analyzeAll('const x = 5;', analyze);
			expect(results).toHaveLength(0);
		});
	});
});
