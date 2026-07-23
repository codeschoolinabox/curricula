import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import easterEggAnalyzers from '../analyzers/easter-egg.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (
	source: string,
	sourceType: 'module' | 'script' = 'module',
): acorn.Program => acorn.parse(source, { ecmaVersion: 'latest', sourceType });

/** The easter-egg analyzers ignore scope; an empty ScopeUsage suffices. */
const NO_SCOPE: ScopeUsage = { allDeclarations: [] };

/** Runs a point analyzer over every node (pre-order) and collects its hits. */
function analyzeAll(
	source: string,
	analyze: PointAnalyzer,
	sourceType: 'module' | 'script' = 'module',
): CodeQuestion[] {
	const ast = parseSource(source, sourceType);
	const walk = (node: Node): CodeQuestion[] => {
		const self = analyze(node, NO_SCOPE, source);
		const fromChildren = getChildNodes(node).flatMap((child) => walk(child));
		return self === null ? fromChildren : [self, ...fromChildren];
	};
	return walk(ast);
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
			const results = analyzeAll(
				'loop: while (true) { console.log("hi"); }',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('easter-egg');
		});

		it('does not fire on a plain (unlabeled) while loop', () => {
			const results = analyzeAll(
				'while (true) { console.log("hi"); }',
				analyze,
			);
			expect(results).toHaveLength(0);
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
			const results = analyzeAll(
				'let x = 0;\nlet y = 0;\nx = (y = 1, 2);',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a plain assignment', () => {
			const results = analyzeAll('let x = 0;\nx = 1;', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('with-statement', () => {
		const analyze = getAnalyzer('with-statement');

		it('fires on with statements', () => {
			const results = analyzeAll(
				'with (console) { log("hi"); }',
				analyze,
				'script',
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire without a with statement', () => {
			const results = analyzeAll('console.log("hi");', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('typeof-operator', () => {
		const analyze = getAnalyzer('typeof-operator');

		it('fires on typeof', () => {
			const results = analyzeAll('const x = 5;\nconst t = typeof x;', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on other unary operators', () => {
			const results = analyzeAll('const x = 5;\nconst y = !x;', analyze);
			expect(results).toHaveLength(0);
		});
	});

	describe('optional-chaining', () => {
		const analyze = getAnalyzer('optional-chaining');

		it('fires on ?. operator', () => {
			const results = analyzeAll(
				'const x = null;\nconst y = x?.toString();',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on non-optional member access', () => {
			const results = analyzeAll(
				'const x = {};\nconst y = x.toString();',
				analyze,
			);
			expect(results).toHaveLength(0);
		});
	});
});
