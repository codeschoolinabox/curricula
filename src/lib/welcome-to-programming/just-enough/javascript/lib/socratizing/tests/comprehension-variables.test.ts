import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../scope/build-scope.js';
import getChildNodes from '../../validating/get-child-nodes.js';

import comprehensionVariableAnalyzers from '../analyzers/comprehension-variables.js';
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
	const entry = comprehensionVariableAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension variable analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension variable analyzers', () => {
	it('exports 4 analyzers', () => {
		expect(comprehensionVariableAnalyzers).toHaveLength(4);
	});

	describe('what-is-declared', () => {
		const analyze = getAnalyzer('what-is-declared');

		it('fires on a variable declaration', () => {
			const results = analyzeAll('let count = 0;', analyze);
			expect(results).toHaveLength(1);
		});

		it('includes the variable name in context', () => {
			const results = analyzeAll('const name = "Alice";', analyze);
			expect(results[0].context).toContain('name');
		});

		it('includes the declaration kind in context', () => {
			const results = analyzeAll('let x = 5;', analyze);
			expect(results[0].context).toContain('let');
		});

		it('does not fire on non-declaration nodes', () => {
			const results = analyzeAll('console.log("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('let x = 1;', analyze);
			expect(results[0].id).toBe('what-is-declared');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('variables');
		});
	});

	describe('what-value-stored', () => {
		const analyze = getAnalyzer('what-value-stored');

		it('fires on a declaration with a non-literal initializer', () => {
			const results = analyzeAll(
				'const x = 5;\nconst y = x + 1;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a declaration with a simple literal initializer', () => {
			const results = analyzeAll('const name = "Alice";', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on declarations without an initializer', () => {
			const results = analyzeAll('let x;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll(
				'const x = 5;\nconst y = x + 1;',
				analyze,
			);
			expect(results[0].id).toBe('what-value-stored');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('variables');
		});
	});

	describe('how-variable-changes', () => {
		const analyze = getAnalyzer('how-variable-changes');

		it('fires on an assignment expression for a declared variable', () => {
			const results = analyzeAll('let x = 0;\nx = 5;', analyze);
			expect(results).toHaveLength(1);
		});

		it('includes the variable name in context', () => {
			const results = analyzeAll('let count = 0;\ncount = count + 1;', analyze);
			expect(results[0].context).toContain('count');
		});

		it('does not fire on code without reassignment', () => {
			const results = analyzeAll('const x = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('let x = 0;\nx = 5;', analyze);
			expect(results[0].id).toBe('how-variable-changes');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('variables');
		});
	});

	describe('variable-role', () => {
		const analyze = getAnalyzer('variable-role');

		it('fires on a let variable that is reassigned', () => {
			const results = analyzeAll('let count = 0;\ncount = count + 1;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on const declarations', () => {
			const results = analyzeAll('const x = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on let that is never reassigned', () => {
			const results = analyzeAll('let x = 5;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct id, kind, category', () => {
			const results = analyzeAll('let count = 0;\ncount = count + 1;', analyze);
			expect(results[0].id).toBe('variable-role');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('variables');
		});
	});
});
