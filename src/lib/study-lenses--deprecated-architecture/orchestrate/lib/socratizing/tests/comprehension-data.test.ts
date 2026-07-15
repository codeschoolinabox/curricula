import { parse } from 'acorn';
import type { Node } from 'acorn';
import { describe, it, expect } from 'vitest';

import getChildNodes from '../../../../../embody/lib/parse-old/get-child-nodes.js';
import buildScope from '../../../../../embody/lib/scope/build-scope.js';
import comprehensionDataAnalyzers from '../analyzers/comprehension-data.js';
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
	const entry = comprehensionDataAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension data analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension data analyzers', () => {
	it('exports 2 analyzers', () => {
		expect(comprehensionDataAnalyzers).toHaveLength(2);
	});

	describe('literal-type', () => {
		const analyze = getAnalyzer('literal-type');

		it('fires on a string literal', () => {
			const results = analyzeAll('const x = "hello";', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a number literal', () => {
			const results = analyzeAll('const x = 42;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a boolean literal', () => {
			const results = analyzeAll('const x = true;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on null literals', () => {
			const results = analyzeAll('const x = null;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const x = "hello";', analyze);
			expect(results[0].id).toBe('literal-type');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('data');
		});
	});

	describe('null-and-undefined', () => {
		const analyze = getAnalyzer('null-and-undefined');

		it('fires on a null literal', () => {
			const results = analyzeAll('const x = null;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a string literal', () => {
			const results = analyzeAll('const x = "hello";', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a number literal', () => {
			const results = analyzeAll('const x = 42;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const x = null;', analyze);
			expect(results[0].id).toBe('null-and-undefined');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('data');
		});
	});
});
