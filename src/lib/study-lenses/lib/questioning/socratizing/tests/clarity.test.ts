import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../../scoping/types.js';
import clarityAnalyzers from '../analyzers/clarity.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The clarity analyzers ignore scope; an empty ScopeUsage suffices. */
const NO_SCOPE: ScopeUsage = { allDeclarations: [] };

/** Runs a point analyzer over every node (pre-order) and collects its hits. */
function analyzeAll(source: string, analyze: PointAnalyzer): CodeQuestion[] {
	const ast = parseSource(source);
	const walk = (node: Node): CodeQuestion[] => {
		const self = analyze(node, NO_SCOPE, source);
		const fromChildren = getChildNodes(node).flatMap((child) => walk(child));
		return self === null ? fromChildren : [self, ...fromChildren];
	};
	return walk(ast);
}

function getAnalyzer(id: string): PointAnalyzer {
	const entry = clarityAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Clarity analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('clarity analyzers', () => {
	it('exports 5 analyzers', () => {
		expect(clarityAnalyzers).toHaveLength(5);
	});

	describe('nested-conditions', () => {
		const analyze = getAnalyzer('nested-conditions');

		it('fires when an if-body contains another if', () => {
			const results = analyzeAll(
				'const x = 1;\nif (x > 0) {\n  if (x < 10) {\n    console.log("in range");\n  }\n}',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('clarity');
		});

		it('does not fire on flat if/else', () => {
			const results = analyzeAll(
				'const x = 1;\nif (x > 0) {\n  console.log("positive");\n} else {\n  console.log("not positive");\n}',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('boolean-coercion', () => {
		const analyze = getAnalyzer('boolean-coercion');

		it('fires on if(identifier)', () => {
			const results = analyzeAll(
				'const input = prompt("test");\nif (input) { console.log(input); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on if(!identifier)', () => {
			const results = analyzeAll(
				'const input = prompt("test");\nif (!input) { console.log("empty"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on explicit comparison', () => {
			const results = analyzeAll(
				'const input = prompt("test");\nif (input !== null) { console.log(input); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('condition-specificity', () => {
		const analyze = getAnalyzer('condition-specificity');

		it('fires on === null checks', () => {
			const results = analyzeAll(
				'const input = prompt("test");\nif (input === null) { console.log("cancelled"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('fires on !== null checks', () => {
			const results = analyzeAll(
				'const input = prompt("test");\nif (input !== null) { console.log(input); }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on non-null comparisons', () => {
			const results = analyzeAll(
				'const count = 5;\nif (count === 0) { console.log("zero"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('simple-if-else', () => {
		const analyze = getAnalyzer('simple-if-else');

		it('fires when both branches have exactly one statement', () => {
			const results = analyzeAll(
				'let msg = "";\nif (true) { msg = "yes"; } else { msg = "no"; }',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire when one branch has multiple statements', () => {
			const results = analyzeAll(
				'let msg = "";\nif (true) {\n  msg = "yes";\n  console.log(msg);\n} else {\n  msg = "no";\n}',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire on if without else', () => {
			const results = analyzeAll(
				'let msg = "";\nif (true) { msg = "yes"; }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});

	describe('plus-overloading', () => {
		const analyze = getAnalyzer('plus-overloading');

		it('fires on + with two variables', () => {
			const results = analyzeAll(
				'const left = "hello";\nconst right = "world";\nconst result = left + right;',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on + with a literal', () => {
			const results = analyzeAll(
				'const name = "world";\nconst greeting = "hello " + name;',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire on numeric literal addition', () => {
			const results = analyzeAll('const sum = 1 + 2;', analyze);
			expect(results).toHaveLength(0);
		});
	});
});
