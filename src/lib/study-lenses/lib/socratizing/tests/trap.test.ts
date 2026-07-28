import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import trapAnalyzers from '../analyzers/trap.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The trap analyzers ignore scope; an empty ScopeUsage suffices. */
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
			const results = analyzeAll('if (0) { console.log("never"); }', analyze);
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
			const results = analyzeAll(
				'if (true);\nconsole.log("runs always");',
				analyze,
			);
			expect(results).toHaveLength(1);
			expect(results[0].category).toBe('trap');
		});

		it('fires on while with empty body from semicolon', () => {
			const results = analyzeAll('let x = true;\nwhile (x);', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a do-while loop with an empty body', () => {
			const results = analyzeAll('let x = false;\ndo; while (x);', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a classic for loop with an empty body', () => {
			const results = analyzeAll('for (let i = 0; i < 3; i++);', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on an endless for loop with an empty body', () => {
			const results = analyzeAll('for (;;);', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a for-of loop with an empty body', () => {
			const results = analyzeAll('const xs = [];\nfor (const x of xs);', analyze);
			expect(results).toHaveLength(1);
		});

		it('fires on a for-in loop with an empty body', () => {
			const results = analyzeAll('const o = {};\nfor (const k in o);', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on normal if with block body', () => {
			const results = analyzeAll('if (true) { console.log("ok"); }', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a classic for loop with a block body', () => {
			const results = analyzeAll(
				'for (let i = 0; i < 3; i++) { run(); }',
				analyze,
			);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a do-while loop with a block body', () => {
			const results = analyzeAll('let x = false;\ndo { run(); } while (x);', analyze);
			expect(results).toHaveLength(0);
		});

		it.each([
			['if (true);', 'if'],
			['let x = true;\nwhile (x);', 'while'],
			['let x = false;\ndo; while (x);', 'do...while'],
			['for (let i = 0; i < 3; i++);', 'for'],
			['const xs = [];\nfor (const x of xs);', 'for...of'],
			['const o = {};\nfor (const k in o);', 'for...in'],
		])('names %s as %s', (source, label) => {
			const results = analyzeAll(source, analyze);
			expect(results.map((result) => result.context)).toEqual([
				expect.stringContaining(`after this ${label},`),
			]);
		});
	});
});
