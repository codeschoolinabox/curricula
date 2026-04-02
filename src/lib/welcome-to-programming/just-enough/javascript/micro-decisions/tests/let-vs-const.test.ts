import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import buildScope from '../../scope/build-scope.js';
import getChildNodes from '../../validating/get-child-nodes.js';

import letVsConst from '../analyzers/voice.js';
import type { CodeQuestion } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

/**
 * Runs the let-vs-const analyzer on every node in the AST,
 * collecting all results.
 */
function analyzeAll(source: string): CodeQuestion[] {
	const ast = parseSource(source);
	const scope = buildScope(ast);
	const results: CodeQuestion[] = [];

	function walk(node: Node): void {
		const result = letVsConst(node, scope, source);
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

// ─── Tests ──────────────────────────────────────────────────

describe('let-vs-const analyzer', () => {
	describe('detection', () => {
		it('detects a let that is never reassigned', () => {
			const results = analyzeAll('let x = 5;');
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('let-vs-const');
		});

		it('does not fire on const declarations', () => {
			const results = analyzeAll('const x = 5;');
			expect(results).toHaveLength(0);
		});

		it('does not fire on let that is reassigned', () => {
			const results = analyzeAll('let x = 5;\nx = 10;');
			expect(results).toHaveLength(0);
		});

		it('does not fire on let that is reassigned with compound operator', () => {
			const results = analyzeAll('let x = 5;\nx += 1;');
			expect(results).toHaveLength(0);
		});

		it('fires on let that is only read, never written', () => {
			const results = analyzeAll('let x = 5;\nconsole.log(x);');
			expect(results).toHaveLength(1);
		});

		it('fires on uninitialized let that is never written', () => {
			const results = analyzeAll('let x;');
			expect(results).toHaveLength(1);
		});
	});

	describe('metadata', () => {
		it('has correct kind and category', () => {
			const results = analyzeAll('let x = 5;');
			const q = results[0];
			expect(q.kind).toBe('micro-decision');
			expect(q.category).toBe('voice');
		});

		it('has correct feature and levels', () => {
			const results = analyzeAll('let x = 5;');
			const q = results[0];
			expect(q.feature).toBe('variables');
			expect(q.levels).toContain('syntax');
		});

		it('includes the variable name in context', () => {
			const results = analyzeAll('let myVar = 5;');
			const q = results[0];
			expect(q.context).toContain('myVar');
		});

		it('has three question registers', () => {
			const results = analyzeAll('let x = 5;');
			const q = results[0];
			expect(q.questions).toHaveLength(3);

			const registers = q.questions.map((q) => q.register);
			expect(registers).toContain('open');
			expect(registers).toContain('pointed');
			expect(registers).toContain('comparative');
		});

		it('has BLOCK model tags', () => {
			const results = analyzeAll('let x = 5;');
			expect(results[0].block.length).toBeGreaterThan(0);
		});

		it('has PBSI tags', () => {
			const results = analyzeAll('let x = 5;');
			expect(results[0].pbsi).toContain('implementation');
		});

		it('has audience tags', () => {
			const results = analyzeAll('let x = 5;');
			expect(results[0].audiences).toContain('developers');
		});

		it('question is frozen', () => {
			const results = analyzeAll('let x = 5;');
			expect(Object.isFrozen(results[0])).toBe(true);
		});
	});

	describe('scope awareness', () => {
		it('detects let in a block scope that is never reassigned', () => {
			const results = analyzeAll('if (true) { let y = 1; }');
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('y');
		});

		it('does not fire when let is reassigned from an inner scope', () => {
			const results = analyzeAll(
				'let x = 1;\nif (true) { x = 2; }',
			);
			expect(results).toHaveLength(0);
		});

		it('detects for-of iterator that could be const (already is const usually)', () => {
			// for-of iterators are typically const, but if let is used:
			const results = analyzeAll(
				'const items = "hello";\nfor (let item of items) { console.log(item); }',
			);
			// The let in for-of is never reassigned — should fire
			expect(results).toHaveLength(1);
			expect(results[0].context).toContain('item');
		});
	});
});
