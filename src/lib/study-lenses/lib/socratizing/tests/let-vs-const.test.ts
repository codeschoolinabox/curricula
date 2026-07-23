import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import deriveScopeUsage from '../../scoping/derive-scope-usage.js';
import voiceAnalyzers from '../analyzers/voice.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

function getLetVsConst(): PointAnalyzer {
	const entry = voiceAnalyzers.find((a) => a.id === 'let-vs-const');
	if (!entry) {
		throw new Error('Voice analyzer "let-vs-const" not found');
	}
	return entry.analyze;
}

const letVsConst = getLetVsConst();

/**
 * Runs the let-vs-const analyzer on every node against a REAL scope built from
 * the same embody parse — its `writeCount === 0` check reads the eslint-scope
 * classification, so the walked AST and the scope must share one parse.
 */
function analyzeAll(source: string): CodeQuestion[] {
	const { ast, environment } = embody(source).facts;
	if (!ast.ok || !environment.ok) {
		throw new Error('setup: facts did not derive');
	}
	const scope = deriveScopeUsage(environment.value);
	const walk = (node: Node): CodeQuestion[] => {
		const self = letVsConst(node, scope, source);
		const fromChildren = getChildNodes(node).flatMap((child) => walk(child));
		return self === null ? fromChildren : [self, ...fromChildren];
	};
	return walk(ast.value);
}

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

		it('does not fire on a let used as an increment counter', () => {
			// `i++` is a readwrite reference (write not init-excluded) → writeCount 1
			// — the most common real-world reassigned-let pattern.
			const results = analyzeAll('let i = 0;\ni++;');
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
			const question = results[0];
			expect(question.kind).toBe('micro-decision');
			expect(question.category).toBe('voice');
		});

		it('has correct feature and levels', () => {
			const results = analyzeAll('let x = 5;');
			const question = results[0];
			expect(question.feature).toBe('variables');
			expect(question.levels).toContain('syntax');
		});

		it('includes the variable name in context', () => {
			const results = analyzeAll('let myVar = 5;');
			const question = results[0];
			expect(question.context).toContain('myVar');
		});

		it('has three question registers', () => {
			const results = analyzeAll('let x = 5;');
			const question = results[0];
			expect(question.questions).toHaveLength(3);

			const registers = question.questions.map((entry) => entry.register);
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
			const results = analyzeAll('let x = 1;\nif (true) { x = 2; }');
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
