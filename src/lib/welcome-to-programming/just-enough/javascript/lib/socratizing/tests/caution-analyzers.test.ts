import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../scope/build-scope.js';
import getChildNodes from '../../validating/get-child-nodes.js';

import cautionAnalyzers from '../analyzers/caution.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

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
	const entry = cautionAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Caution analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('caution analyzers', () => {
	it('exports 5 analyzers', () => {
		expect(cautionAnalyzers).toHaveLength(5);
	});

	describe('assignment-in-condition', () => {
		const analyze = getAnalyzer('assignment-in-condition');

		it('fires on assignment in if condition', () => {
			const results = analyzeAll(
				'let value = 0;\nif (value = 5) { console.log(value); }',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('caution');
		});

		it('does not fire on comparison in condition', () => {
			const results = analyzeAll(
				'const value = 5;\nif (value === 5) { console.log("five"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('empty-block', () => {
		const analyze = getAnalyzer('empty-block');

		it('fires on empty if body', () => {
			const results = analyzeAll('if (true) { }', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on block with statements', () => {
			const results = analyzeAll(
				'if (true) { console.log("hi"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('unused-expression', () => {
		const analyze = getAnalyzer('unused-expression');

		it('fires on standalone identifier expression', () => {
			const results = analyzeAll('const x = 5;\nx;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on standalone binary expression', () => {
			const results = analyzeAll('const x = 5;\nx + 1;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on function calls', () => {
			const results = analyzeAll('console.log("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on assignments', () => {
			const results = analyzeAll('let x = 1;\nx = 2;', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('unused-variable', () => {
		const analyze = getAnalyzer('unused-variable');

		it('fires on a declared variable that is never read', () => {
			const results = analyzeAll('const unused = 42;', analyze);
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('unused');
		});

		it('does not fire on a variable that is read', () => {
			const results = analyzeAll(
				'const used = 42;\nconsole.log(used);',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('fires on a variable that is only written, never read', () => {
			const results = analyzeAll('let counter = 0;\ncounter = 1;', analyze);
			expect(results).toHaveLength(1);
		});
	});

	describe('chained-assignment', () => {
		const analyze = getAnalyzer('chained-assignment');

		it('fires on chained assignments', () => {
			const results = analyzeAll(
				'let first = 0;\nlet second = 0;\nfirst = second = 5;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on simple assignments', () => {
			const results = analyzeAll('let x = 0;\nx = 5;', analyze);
			expect(results).toHaveLength(0);
		});
	});
});
