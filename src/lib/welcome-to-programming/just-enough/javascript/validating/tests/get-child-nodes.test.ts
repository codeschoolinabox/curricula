import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';

import getChildNodes from '../get-child-nodes.js';

// -- helper: parse a snippet and return the Program node --
function parseToAst(source: string) {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		locations: true,
	});
}

describe('getChildNodes', () => {
	describe('extracts children from common node types', () => {
		it('returns body statements from a Program node', () => {
			const ast = parseToAst('let x = 1; let y = 2;');
			const children = getChildNodes(ast);
			expect(children).toHaveLength(2);
			expect(children[0].type).toBe('VariableDeclaration');
			expect(children[1].type).toBe('VariableDeclaration');
		});

		it('returns test, consequent, and alternate from an IfStatement', () => {
			const ast = parseToAst('if (true) { 1; } else { 2; }');
			const ifNode = ast.body[0];
			const children = getChildNodes(ifNode);
			const childTypes = children.map((c) => c.type);
			expect(childTypes).toContain('Literal');
			expect(childTypes).toContain('BlockStatement');
			expect(children.length).toBe(3);
		});
	});

	describe('handles edge cases', () => {
		it('returns empty array for leaf nodes (Literal)', () => {
			const ast = parseToAst('42;');
			const exprStmt = ast.body[0];
			// ExpressionStatement → expression is the Literal
			const literal = getChildNodes(exprStmt).find((n) => n.type === 'Literal');
			expect(literal).toBeDefined();
			expect(getChildNodes(literal!)).toHaveLength(0);
		});

		it('returns empty array for Identifier nodes', () => {
			const ast = parseToAst('x;');
			const exprStmt = ast.body[0];
			const identifier = getChildNodes(exprStmt).find(
				(n) => n.type === 'Identifier',
			);
			expect(identifier).toBeDefined();
			expect(getChildNodes(identifier!)).toHaveLength(0);
		});

		it('handles null alternate in IfStatement (no else)', () => {
			const ast = parseToAst('if (true) { 1; }');
			const ifNode = ast.body[0];
			const children = getChildNodes(ifNode);
			// test + consequent, no alternate
			expect(children).toHaveLength(2);
		});

		it('extracts children from nested arrays (BlockStatement.body)', () => {
			const ast = parseToAst('{ let a = 1; let b = 2; }');
			const block = ast.body[0];
			const children = getChildNodes(block);
			expect(children).toHaveLength(2);
			expect(children[0].type).toBe('VariableDeclaration');
		});
	});
});
