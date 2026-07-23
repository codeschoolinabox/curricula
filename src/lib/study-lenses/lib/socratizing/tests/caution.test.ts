import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import deriveScopeUsage from '../../scoping/derive-scope-usage.js';
import cautionAnalyzers from '../analyzers/caution.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

/**
 * Runs a point analyzer over every node (pre-order) against a REAL scope. The
 * walked AST and the scope come from ONE embody parse, so identity-based reads
 * (caution's unused-variable `d.node === id`) resolve — mirroring how the
 * production entry walks `facts.ast` with `deriveScopeUsage(facts.environment)`.
 */
function analyzeAll(source: string, analyze: PointAnalyzer): CodeQuestion[] {
	const { ast, environment } = embody(source).facts;
	if (!ast.ok || !environment.ok) {
		throw new Error('setup: facts did not derive');
	}
	const scope = deriveScopeUsage(environment.value);
	const walk = (node: Node): CodeQuestion[] => {
		const self = analyze(node, scope, source);
		const fromChildren = getChildNodes(node).flatMap((child) => walk(child));
		return self === null ? fromChildren : [self, ...fromChildren];
	};
	return walk(ast.value);
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

		it('fires on assignment in a for-loop condition', () => {
			const results = analyzeAll('for (; x = next(); ) { work(); }', analyze);
			expect(results).toHaveLength(1);
		});
	});

	describe('empty-block', () => {
		const analyze = getAnalyzer('empty-block');

		it('fires on empty if body', () => {
			const results = analyzeAll('if (true) { }', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on an empty loop body', () => {
			const results = analyzeAll('while (waiting) { }', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on block with statements', () => {
			const results = analyzeAll('if (true) { console.log("hi"); }', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on an empty function body (an intentional stub)', () => {
			const results = analyzeAll('function noop() {}', analyze);
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

		it('does not fire on an optional-chained call (side effect)', () => {
			// `user?.save()` parses as a ChainExpression around a CallExpression;
			// it runs for a side effect and must not be flagged unused.
			const results = analyzeAll('user?.save();', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a directive prologue', () => {
			const results = analyzeAll('"use strict";', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a constructor call (new)', () => {
			const results = analyzeAll('new Widget();', analyze);
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

		it('fires on the correct shadowed declaration, matched by node identity not name', () => {
			// Outer `x` is read; the shadowing inner `x` is unused. A name-only
			// match would resolve the inner declaration to the read outer entry and
			// wrongly suppress the fire — only `d.node === id` distinguishes them.
			const results = analyzeAll(
				'const x = 1;\nconsole.log(x);\n{\n  const x = 2;\n}',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('x');
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
