import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import getChildNodes from '../get-child-nodes.js';

/**
 * Drift guard for the micro-vendored point-analyzer walker. This is the
 * THIRD copy of the walk (see the provenance note in the source); these
 * tests pin the behaviours the socratizing analyzers rely on so a future
 * hand-reconciliation with the embody source cannot silently regress.
 *
 * ZOMBIES-ordered: Zero → One → Many → Boundaries. The Boundaries block
 * carries the branches most at risk under a careless "fix" — regex
 * non-node objects, sparse-array null elision, generic own-key walking
 * (vs an allow-list of known node types), and the load-bearing metadata
 * skip.
 */

const parse = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', locations: true });

/** The `expression` of the program's first statement (no erasing cast). */
const expressionOf = (source: string): Node =>
	(parse(source).body[0] as acorn.ExpressionStatement).expression;

/**
 * Builds a synthetic node-shaped object — a shape acorn never emits — to
 * prove the walk reads *any* own key rather than an allow-list of known
 * ESTree types. Casting a made-up shape is legitimate here (unlike casting
 * a real acorn node, which would erase precise typings).
 */
const fakeNode = (shape: Record<string, unknown>): Node =>
	shape as unknown as Node;

describe('getChildNodes', () => {
	describe('zero', () => {
		it('returns [] for a childless identifier', () => {
			expect(getChildNodes(expressionOf('x;'))).toEqual([]);
		});

		it('returns [] for a numeric literal (primitive value, string raw — no nodes)', () => {
			expect(getChildNodes(expressionOf('42;'))).toEqual([]);
		});
	});

	describe('one', () => {
		it('collects exactly one single node-valued child (UnaryExpression.argument)', () => {
			// `!x` — operator (string) and prefix (bool) are skipped; argument is the sole node.
			const children = getChildNodes(expressionOf('!x;'));
			expect(children.map((child) => child.type)).toEqual(['Identifier']);
		});
	});

	describe('many', () => {
		it('collects array-valued children (Program.body) in source order', () => {
			const children = getChildNodes(parse('let a = 1; let b = 2; let c = 3;'));
			expect(children.map((child) => child.type)).toEqual([
				'VariableDeclaration',
				'VariableDeclaration',
				'VariableDeclaration',
			]);
			// source order = ascending start offset
			expect(children[0].start).toBeLessThan(children[1].start);
			expect(children[1].start).toBeLessThan(children[2].start);
		});
	});

	describe('boundaries', () => {
		it('skips a null single-valued child (IfStatement.alternate with no else)', () => {
			// body[0] is the IfStatement; test + consequent only, no phantom alternate.
			const children = getChildNodes(parse('if (x) y;').body[0]);
			expect(children.map((child) => child.type)).toEqual([
				'Identifier',
				'ExpressionStatement',
			]);
		});

		it('elides null elements inside an array-valued property (sparse array)', () => {
			// `[1, , 3]` — elements is [Literal, null, Literal]; the hole must not appear.
			const children = getChildNodes(expressionOf('[1, , 3];'));
			expect(children.map((child) => child.type)).toEqual([
				'Literal',
				'Literal',
			]);
		});

		it('skips a non-node object value (regex literal internals)', () => {
			// `/ab/g` — value is a RegExp instance and `regex` is {pattern,flags}; neither is node-shaped.
			expect(getChildNodes(expressionOf('/ab/g;'))).toEqual([]);
		});

		it('walks arbitrary own keys, not an allow-list of known node types', () => {
			// A shape acorn never emits: proves the walk is generic. `junk` (no type)
			// and `count` (number) are skipped; the single node and the array of nodes are kept.
			const synthetic = fakeNode({
				type: 'MadeUpNode',
				start: 0,
				end: 9,
				loc: null,
				soleChild: { type: 'ChildA', start: 0, end: 1 },
				childList: [
					{ type: 'ChildB', start: 2, end: 3 },
					{ type: 'ChildC', start: 4, end: 5 },
				],
				junk: { pattern: 'x', flags: 'g' },
				count: 7,
			});
			expect(getChildNodes(synthetic).map((child) => child.type)).toEqual([
				'ChildA',
				'ChildB',
				'ChildC',
			]);
		});

		it('skips metadata keys even when their value is node-shaped (explicit skip is load-bearing)', () => {
			// A node-shaped value hidden under `loc` must be dropped by the explicit
			// key skip — without it, `isNode(loc)` would be true and leak a phantom child.
			const synthetic = fakeNode({
				type: 'MadeUpNode',
				start: 0,
				end: 1,
				loc: { type: 'PhantomFromLoc', start: 0, end: 1 },
				real: { type: 'RealChild', start: 0, end: 1 },
			});
			expect(getChildNodes(synthetic).map((child) => child.type)).toEqual([
				'RealChild',
			]);
		});
	});
});
