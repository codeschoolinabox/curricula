import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ScopeUsage } from '../../scoping/types.js';
import comprehensionInteractionAnalyzers from '../analyzers/comprehension-interaction.js';
import getChildNodes from '../get-child-nodes.js';
import type { CodeQuestion, PointAnalyzer } from '../types.js';

const parseSource = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

/** The comprehension interaction analyzers ignore scope; an empty ScopeUsage suffices. */
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
	const entry = comprehensionInteractionAnalyzers.find((a) => a.id === id);
	if (!entry) {
		throw new Error(`Comprehension interaction analyzer '${id}' not found`);
	}
	return entry.analyze;
}

describe('comprehension interaction analyzers', () => {
	it('exports 3 analyzers', () => {
		expect(comprehensionInteractionAnalyzers).toHaveLength(3);
	});

	describe('prompt-return-value', () => {
		const analyze = getAnalyzer('prompt-return-value');

		it('fires on a prompt() call', () => {
			const results = analyzeAll(
				'const input = prompt("enter something:");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on an alert() call', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on a confirm() call', () => {
			const results = analyzeAll('confirm("are you sure?");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results[0].id).toBe('prompt-return-value');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});

	describe('alert-effect', () => {
		const analyze = getAnalyzer('alert-effect');

		it('fires on an alert() call', () => {
			const results = analyzeAll('alert("hello world");', analyze);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a prompt() call', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on console.log()', () => {
			const results = analyzeAll('console.log("debug");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('alert("msg");', analyze);
			expect(results[0].id).toBe('alert-effect');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});

	describe('confirm-behavior', () => {
		const analyze = getAnalyzer('confirm-behavior');

		it('fires on a confirm() call', () => {
			const results = analyzeAll(
				'const answer = confirm("are you sure?");',
				analyze,
			);
			expect(results).toHaveLength(1);
		});

		it('does not fire on a prompt() call', () => {
			const results = analyzeAll('const input = prompt("enter:");', analyze);
			expect(results).toHaveLength(0);
		});

		it('does not fire on an alert() call', () => {
			const results = analyzeAll('alert("hello");', analyze);
			expect(results).toHaveLength(0);
		});

		it('has correct metadata', () => {
			const results = analyzeAll('confirm("ok?");', analyze);
			expect(results[0].id).toBe('confirm-behavior');
			expect(results[0].kind).toBe('comprehension');
			expect(results[0].category).toBe('clarity');
			expect(results[0].feature).toBe('userInteraction');
		});
	});
});
