import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import comprehensionOperatorAnalyzers from '../analyzers/comprehension-operators.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The comprehension operator analyzers ignore scope; an empty ScopeUsage suffices. */
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
	const entry = comprehensionOperatorAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension operator analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('comprehension operator analyzers', () => {
	it('exports 4 analyzers', () => {
		expect(comprehensionOperatorAnalyzers).toHaveLength(4);
	});

	describe('comparison-result', () => {
		const analyze = getAnalyzer('comparison-result');

		it('fires on === comparison', () => {
			const results = analyzeAll('const x = 5;\nconst eq = x === 5;', analyze);
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
			const results = analyzeAll('const x = 3;\nconst lt = x < 10;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on arithmetic operators', () => {
			const results = analyzeAll('const sum = 1 + 2;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const x = 5;\nconst eq = x === 5;', analyze);
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
			const results = analyzeAll('const a = 3;\nconst b = a + 2;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on subtraction', () => {
			const results = analyzeAll('const a = 10;\nconst b = a - 3;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on modulo', () => {
			const results = analyzeAll('const a = 10;\nconst b = a % 3;', analyze);
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
			const results = analyzeAll('const x = 5;\nconst lt = x < 10;', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const a = 3;\nconst b = a + 2;', analyze);
			expect(results[0].id).toBe('arithmetic-result');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('operators');
		});
	});

	describe('operator-swap', () => {
		const analyze = getAnalyzer('operator-swap');

		it('fires on === comparisons', () => {
			const results = analyzeAll('const x = 5;\nconst eq = x === 5;', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on < comparisons', () => {
			const results = analyzeAll('const x = 3;\nconst lt = x < 10;', analyze);
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
