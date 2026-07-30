import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import collectNodes from '../analyzers/collect-nodes.js';

/**
 * `collectNodes` flattens the AST in pre-order (a node before its descendants)
 * and keeps every node whose `type` is in the given set. These tests pin the
 * OUTER traversal: membership, self before descendant, and siblings in source
 * order. The INNER child-walk it delegates to is separately anchored by
 * `get-child-nodes.test.ts` — this file does not re-prove the walker.
 */

const parse = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest' });

describe('collectNodes', () => {
	describe('zero', () => {
		it('returns an empty array when no type matches', () => {
			expect(
				collectNodes(parse('x;'), new Set(['FunctionDeclaration'])),
			).toEqual([]);
		});

		it('returns an empty array for an empty type set', () => {
			expect(collectNodes(parse('x;'), new Set())).toEqual([]);
		});
	});

	describe('one', () => {
		it('includes the root node when it matches', () => {
			const program = parse('x;');
			expect(collectNodes(program, new Set(['Program']))).toEqual([program]);
		});
	});

	describe('many', () => {
		it('collects every node of a single type', () => {
			// `a + b + c` — three Identifiers.
			const found = collectNodes(parse('a + b + c;'), new Set(['Identifier']));
			expect(found.map((node) => node.type)).toEqual([
				'Identifier',
				'Identifier',
				'Identifier',
			]);
		});

		it('collects nodes across multiple types (self before nested child)', () => {
			const found = collectNodes(
				parse('let x = 1;'),
				new Set(['VariableDeclaration', 'Literal']),
			);
			// pre-order: the declaration precedes the literal nested inside it.
			expect(found.map((node) => node.type)).toEqual([
				'VariableDeclaration',
				'Literal',
			]);
		});

		it('visits siblings in source order — the first statement before the second', () => {
			const found = collectNodes(
				parse('f(); g();'),
				new Set(['CallExpression']),
			);
			expect(found.map((node) => node.start)).toEqual([0, 5]);
		});
	});

	describe('boundaries', () => {
		it('visits in pre-order — an enclosing node before the node it contains', () => {
			// `f(g())` — the outer call (offset 0) precedes the inner call (offset 2).
			const found = collectNodes(parse('f(g());'), new Set(['CallExpression']));
			expect(found.map((node) => node.start)).toEqual([0, 2]);
		});
	});
});
