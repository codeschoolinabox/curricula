import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../../../embody/lib/scope/build-scope.js';
import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';

import trapAnalyzers from '../analyzers/trap.js';
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
	const entry = trapAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Trap analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('trap analyzers', () => {
	it('exports 2 analyzers', () => {
		expect(trapAnalyzers).toHaveLength(2);
	});

	describe('constant-condition', () => {
		const analyze = getAnalyzer('constant-condition');

		it('fires on if (true)', () => {
			const results = analyzeAll(
				'if (true) { console.log("always"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('trap');
		});

		it('fires on if (false)', () => {
			const results = analyzeAll(
				'if (false) { console.log("never"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on while (true)', () => {
			const results = analyzeAll(
				'while (true) { console.log("loop"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on if (0)', () => {
			const results = analyzeAll(
				'if (0) { console.log("never"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on variable condition', () => {
			const results = analyzeAll(
				'const flag = true;\nif (flag) { console.log("maybe"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('accidental-semicolon', () => {
		const analyze = getAnalyzer('accidental-semicolon');

		it('fires on if with empty body from semicolon', () => {
			// `if (true);` parses the semicolon as an EmptyStatement body
			const results = analyzeAll('if (true);\nconsole.log("runs always");', analyze);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('trap');
		});

		it('fires on while with empty body from semicolon', () => {
			const results = analyzeAll(
				'let x = true;\nwhile (x);',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on normal if with block body', () => {
			const results = analyzeAll(
				'if (true) { console.log("ok"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});
});
