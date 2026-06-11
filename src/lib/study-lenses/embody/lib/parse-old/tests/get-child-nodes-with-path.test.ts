import { parse } from 'acorn';
import { describe, it, expect } from 'vitest';

import getChildNodesWithPath from '../get-child-nodes-with-path.js';

function parseToAst(source: string) {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		locations: true,
	});
}

describe('getChildNodesWithPath', () => {
	describe('leaf nodes', () => {
		it('returns empty array for a leaf node', () => {
			const ast = parseToAst('42;');
			const [{ child: literal }] = getChildNodesWithPath(ast.body[0]);
			expect(getChildNodesWithPath(literal)).toHaveLength(0);
		});
	});

	describe('single object-valued child', () => {
		describe('ExpressionStatement expression', () => {
			it('has segment "expression"', () => {
				const ast = parseToAst('42;');
				const segments = getChildNodesWithPath(ast.body[0]).map(
					(c) => c.segment,
				);
				expect(segments).toEqual(['expression']);
			});

			it('pairs the segment with the matching child node', () => {
				const ast = parseToAst('42;');
				const [{ child }] = getChildNodesWithPath(ast.body[0]);
				expect(child.type).toBe('Literal');
			});
		});
	});

	describe('multiple object-valued children on one node', () => {
		it('segments a VariableDeclarator as id and init', () => {
			const ast = parseToAst('let x = 1;');
			const [{ child: declarator }] = getChildNodesWithPath(ast.body[0]);
			const segments = getChildNodesWithPath(declarator).map((c) => c.segment);
			expect(segments).toEqual(['id', 'init']);
		});
	});

	describe('array-valued properties', () => {
		it('segments two Program statements as body.0 and body.1', () => {
			const ast = parseToAst('let x = 1; let y = 2;');
			const segments = getChildNodesWithPath(ast).map((c) => c.segment);
			expect(segments).toEqual(['body.0', 'body.1']);
		});

		it('segments a single BlockStatement body element as body.0', () => {
			const ast = parseToAst('{ let a = 1; }');
			const segments = getChildNodesWithPath(ast.body[0]).map((c) => c.segment);
			expect(segments).toEqual(['body.0']);
		});
	});

	describe('mixed object-valued and array-valued children', () => {
		it('segments a CallExpression callee and arguments separately', () => {
			const ast = parseToAst('foo(1, 2);');
			const [{ child: callExpr }] = getChildNodesWithPath(ast.body[0]);
			const segments = getChildNodesWithPath(callExpr).map((c) => c.segment);
			expect(segments).toEqual(['callee', 'arguments.0', 'arguments.1']);
		});
	});

	describe('null holes in arrays', () => {
		it('skips a null element without shifting later indices', () => {
			const ast = parseToAst('[1, , 3];');
			const [{ child: arrayExpr }] = getChildNodesWithPath(ast.body[0]);
			const segments = getChildNodesWithPath(arrayExpr).map((c) => c.segment);
			expect(segments).toEqual(['elements.0', 'elements.2']);
		});

		it('keeps the source index when a leading element is a hole', () => {
			const ast = parseToAst('[, 5];');
			const [{ child: arrayExpr }] = getChildNodesWithPath(ast.body[0]);
			const segments = getChildNodesWithPath(arrayExpr).map((c) => c.segment);
			expect(segments).toEqual(['elements.1']);
		});
	});

	describe('empty array-valued property', () => {
		it('returns no children for an empty array literal', () => {
			const ast = parseToAst('[];');
			const [{ child: arrayExpr }] = getChildNodesWithPath(ast.body[0]);
			expect(getChildNodesWithPath(arrayExpr)).toHaveLength(0);
		});
	});
});
