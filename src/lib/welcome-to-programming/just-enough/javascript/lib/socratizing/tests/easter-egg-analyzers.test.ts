import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../scope/build-scope.js';
import getChildNodes from '../../parse/get-child-nodes.js';

import easterEggAnalyzers from '../analyzers/easter-egg.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

function parseSource(source: string, sourceType: 'module' | 'script' = 'module'): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType,
		locations: true,
	});
}

function analyzeAll(source: string, analyzerFn: PointAnalyzer, sourceType: 'module' | 'script' = 'module'): CodeQuestion[] {
	const ast = parseSource(source, sourceType);
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
	const entry = easterEggAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Easter-egg analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('easter-egg analyzers', () => {
	it('exports 6 analyzers', () => {
		expect(easterEggAnalyzers).toHaveLength(6);
	});

	describe('labeled-statement', () => {
		const analyze = getAnalyzer('labeled-statement');

		it('fires on labeled statements', () => {
			const results = analyzeAll('loop: while (true) { console.log("hi"); }', analyze);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('easter-egg');
		});
	});

	describe('void-operator', () => {
		const analyze = getAnalyzer('void-operator');

		it('fires on void expressions', () => {
			const results = analyzeAll('const x = void 0;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on other unary operators', () => {
			const results = analyzeAll('const x = !true;', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('comma-operator', () => {
		const analyze = getAnalyzer('comma-operator');

		it('fires on sequence expressions', () => {
			const results = analyzeAll('let x = 0;\nlet y = 0;\nx = (y = 1, 2);', analyze);
			expect(results).toHaveLength(1);
		});
	});

	describe('with-statement', () => {
		const analyze = getAnalyzer('with-statement');

		it('fires on with statements', () => {
			const results = analyzeAll('with (console) { log("hi"); }', analyze, 'script');
			expect(results).toHaveLength(1);
		});
	});

	describe('typeof-operator', () => {
		const analyze = getAnalyzer('typeof-operator');

		it('fires on typeof', () => {
			const results = analyzeAll('const x = 5;\nconst t = typeof x;', analyze);
			expect(results).toHaveLength(1);
		});
	});

	describe('optional-chaining', () => {
		const analyze = getAnalyzer('optional-chaining');

		it('fires on ?. operator', () => {
			const results = analyzeAll('const x = null;\nconst y = x?.toString();', analyze);
			expect(results).toHaveLength(1);
		});
	});
});
