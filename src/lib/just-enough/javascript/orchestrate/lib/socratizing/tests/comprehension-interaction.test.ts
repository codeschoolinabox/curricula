import { parse } from 'acorn';
import type { Node } from 'acorn';
import { describe, it, expect } from 'vitest';

import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';
import buildScope from '../../../../embody/lib/scope/build-scope.js';
import comprehensionInteractionAnalyzers from '../analyzers/comprehension-interaction.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function analyzeAll(source: string, analyzerFunction: PointAnalyzer): CodeQuestion[] {
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
	const entry = comprehensionInteractionAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension interaction analyzer '${id}' not found`);
	}
	return entry.analyze;
}

// ─── Tests ──────────────────────────────────────────────────

describe('comprehension interaction analyzers', () => {
	it('exports 3 analyzers', () => {
		expect(comprehensionInteractionAnalyzers).toHaveLength(3);
	});

	describe('prompt-return-value', () => {
		const analyze = getAnalyzer('prompt-return-value');

		it('fires on a prompt() call', () => {
			const results = analyzeAll(
				'const input = prompt("enter something:");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on an alert() call', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a confirm() call', () => {
			const results = analyzeAll('confirm("are you sure?");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results[0].id).toBe('prompt-return-value');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});

	describe('alert-effect', () => {
		const analyze = getAnalyzer('alert-effect');

		it('fires on an alert() call', () => {
			const results = analyzeAll('alert("hello world");', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a prompt() call', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on console.log()', () => {
			const results = analyzeAll('console.log("debug");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('alert("msg");', analyze);
			expect(results[0].id).toBe('alert-effect');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});

	describe('confirm-behavior', () => {
		const analyze = getAnalyzer('confirm-behavior');

		it('fires on a confirm() call', () => {
			const results = analyzeAll(
				'const answer = confirm("are you sure?");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a prompt() call', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on an alert() call', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('confirm("ok?");', analyze);
			expect(results[0].id).toBe('confirm-behavior');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});
});
