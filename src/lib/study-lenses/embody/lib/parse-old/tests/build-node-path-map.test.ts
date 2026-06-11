import { parse } from 'acorn';
import { describe, it, expect } from 'vitest';

import buildNodePathMap from '../build-node-path-map.js';
import getChildNodesWithPath from '../get-child-nodes-with-path.js';

function parseToAst(source: string) {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		locations: true,
	});
}

describe('buildNodePathMap', () => {
	describe('empty program', () => {
		it('contains only the root', () => {
			const ast = parseToAst('');
			const map = buildNodePathMap(ast);
			expect(map.size).toBe(1);
		});

		it('maps the root to "$"', () => {
			const ast = parseToAst('');
			const map = buildNodePathMap(ast);
			expect(map.get(ast)).toBe('$');
		});
	});

	describe('minimal non-empty tree', () => {
		it('maps a top-level statement to "$.body.0"', () => {
			const ast = parseToAst('42;');
			const [{ child: statement }] = getChildNodesWithPath(ast);
			const map = buildNodePathMap(ast);
			expect(map.get(statement)).toBe('$.body.0');
		});

		it('includes every node, leaves included', () => {
			const ast = parseToAst('42;');
			const map = buildNodePathMap(ast);
			expect(map.size).toBe(3);
		});
	});

	describe('multiple children', () => {
		it('maps the second top-level statement to "$.body.1"', () => {
			const ast = parseToAst('1; 2;');
			const second = getChildNodesWithPath(ast)[1].child;
			const map = buildNodePathMap(ast);
			expect(map.get(second)).toBe('$.body.1');
		});
	});

	describe('nested descendants', () => {
		it('maps a VariableDeclarator to "$.body.0.declarations.0"', () => {
			const ast = parseToAst('let x = 1;');
			const [{ child: declaration }] = getChildNodesWithPath(ast);
			const [{ child: declarator }] = getChildNodesWithPath(declaration);
			const map = buildNodePathMap(ast);
			expect(map.get(declarator)).toBe('$.body.0.declarations.0');
		});

		it('maps a leaf init Literal to its full path', () => {
			const ast = parseToAst('let x = 1;');
			const [{ child: declaration }] = getChildNodesWithPath(ast);
			const [{ child: declarator }] = getChildNodesWithPath(declaration);
			const initEntry = getChildNodesWithPath(declarator).find(
				(c) => c.segment === 'init',
			);
			const map = buildNodePathMap(ast);
			expect(initEntry && map.get(initEntry.child)).toBe(
				'$.body.0.declarations.0.init',
			);
		});

		it('maps a statement inside a block to "$.body.0.body.0"', () => {
			const ast = parseToAst('{ let a = 1; }');
			const [{ child: block }] = getChildNodesWithPath(ast);
			const [{ child: inner }] = getChildNodesWithPath(block);
			const map = buildNodePathMap(ast);
			expect(map.get(inner)).toBe('$.body.0.body.0');
		});

		it('preserves the source index for a sparse-array element', () => {
			const ast = parseToAst('[, 5];');
			const [{ child: statement }] = getChildNodesWithPath(ast);
			const [{ child: arrayExpr }] = getChildNodesWithPath(statement);
			const [{ child: five }] = getChildNodesWithPath(arrayExpr);
			const map = buildNodePathMap(ast);
			expect(map.get(five)).toBe('$.body.0.expression.elements.1');
		});
	});
});
