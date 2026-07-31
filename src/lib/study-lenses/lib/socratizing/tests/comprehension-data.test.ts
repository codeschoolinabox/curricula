import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import comprehensionDataAnalyzers from '../analyzers/comprehension-data.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The comprehension data analyzers ignore scope; an empty ScopeUsage suffices. */
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
	const entry = comprehensionDataAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension data analyzer '${id}' not found`);
	}
	return entry.analyze;
}

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

		it('fires on a bigint literal', () => {
			const results = analyzeAll('const x = 10n;', analyze);
			expect(results).toHaveLength(1);
		});

		it('names bigint as the type of a bigint literal', () => {
			const results = analyzeAll('const x = 10n;', analyze);
			expect(results[0].context).toBe(
				'A literal bigint value appears in the code.',
			);
		});

		it('does not fire on regex literals', () => {
			const results = analyzeAll('const x = /a+/gi;', analyze);
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
