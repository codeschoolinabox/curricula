import { parse, type Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import buildNodePathMap from '../build-node-path-map.js';
import getChildNodesWithPath from '../get-child-nodes-with-path.js';

function programOf(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

describe('buildNodePathMap', () => {
	describe('empty program', () => {
		it("maps the root to '$'", () => {
			const program = programOf('');
			const map = buildNodePathMap(program);
			expect(map.get(program)).toBe('$');
		});

		it('contains only the root', () => {
			const program = programOf('');
			const map = buildNodePathMap(program);
			expect(map.size).toBe(1);
		});
	});

	describe('a single statement', () => {
		it("maps the top-level statement to '$.body.0'", () => {
			const program = programOf('42;');
			const [{ child: statement }] = getChildNodesWithPath(program);
			const map = buildNodePathMap(program);
			expect(map.get(statement)).toBe('$.body.0');
		});

		it('includes every node, leaves included', () => {
			const program = programOf('42;');
			const map = buildNodePathMap(program);
			expect(map.size).toBe(3);
		});
	});

	describe('multiple statements', () => {
		it("maps the second top-level statement to '$.body.1'", () => {
			const program = programOf('1; 2;');
			const second = getChildNodesWithPath(program)[1].child;
			const map = buildNodePathMap(program);
			expect(map.get(second)).toBe('$.body.1');
		});
	});

	describe('nested descendants', () => {
		it("maps a VariableDeclarator to '$.body.0.declarations.0'", () => {
			const program = programOf('let x = 1;');
			const [{ child: declaration }] = getChildNodesWithPath(program);
			const [{ child: declarator }] = getChildNodesWithPath(declaration);
			const map = buildNodePathMap(program);
			expect(map.get(declarator)).toBe('$.body.0.declarations.0');
		});

		it('maps a leaf init Literal to its full path', () => {
			const program = programOf('let x = 1;');
			const [{ child: declaration }] = getChildNodesWithPath(program);
			const [{ child: declarator }] = getChildNodesWithPath(declaration);
			const [, { child: initLiteral }] = getChildNodesWithPath(declarator);
			const map = buildNodePathMap(program);
			expect(map.get(initLiteral)).toBe('$.body.0.declarations.0.init');
		});

		it("maps a statement inside a block to '$.body.0.body.0'", () => {
			const program = programOf('{ let a = 1; }');
			const [{ child: block }] = getChildNodesWithPath(program);
			const [{ child: inner }] = getChildNodesWithPath(block);
			const map = buildNodePathMap(program);
			expect(map.get(inner)).toBe('$.body.0.body.0');
		});
	});

	describe('a sparse-array hole keeps the source index', () => {
		it("maps the element after a hole to '.elements.1'", () => {
			const program = programOf('[, 5];');
			const [{ child: statement }] = getChildNodesWithPath(program);
			const [{ child: arrayExpression }] = getChildNodesWithPath(statement);
			const [{ child: five }] = getChildNodesWithPath(arrayExpression);
			const map = buildNodePathMap(program);
			expect(map.get(five)).toBe('$.body.0.expression.elements.1');
		});
	});
});
