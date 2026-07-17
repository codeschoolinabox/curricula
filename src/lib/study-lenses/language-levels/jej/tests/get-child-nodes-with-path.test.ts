import { parse, type Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import getChildNodesWithPath from '../get-child-nodes-with-path.js';

function programOf(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

describe('getChildNodesWithPath', () => {
	describe('leaf nodes have no children', () => {
		it('a Literal', () => {
			const program = programOf('42;');
			const [{ child: literal }] = getChildNodesWithPath(program.body[0]);
			expect(getChildNodesWithPath(literal)).toHaveLength(0);
		});

		it('a regex Literal whose regex metadata is not a node', () => {
			const program = programOf('/ab/;');
			const [{ child: literal }] = getChildNodesWithPath(program.body[0]);
			expect(getChildNodesWithPath(literal)).toHaveLength(0);
		});
	});

	describe('an empty array-valued property has no children', () => {
		it('an empty array literal', () => {
			const program = programOf('[];');
			const [{ child: array }] = getChildNodesWithPath(program.body[0]);
			expect(getChildNodesWithPath(array)).toHaveLength(0);
		});
	});

	describe('a single object-valued child', () => {
		it("an ExpressionStatement's child has segment 'expression'", () => {
			const program = programOf('42;');
			const segments = getChildNodesWithPath(program.body[0]).map(
				(pair) => pair.segment,
			);
			expect(segments).toEqual(['expression']);
		});

		it('the segment is paired with its matching child node', () => {
			const program = programOf('42;');
			const [{ child }] = getChildNodesWithPath(program.body[0]);
			expect(child.type).toBe('Literal');
		});
	});

	describe('a single array-valued child', () => {
		it("a BlockStatement's one statement has segment 'body.0'", () => {
			const program = programOf('{ let a = 1; }');
			const segments = getChildNodesWithPath(program.body[0]).map(
				(pair) => pair.segment,
			);
			expect(segments).toEqual(['body.0']);
		});
	});

	describe('multiple object-valued children', () => {
		it("a VariableDeclarator segments as 'id' and 'init'", () => {
			const program = programOf('let x = 1;');
			const [{ child: declarator }] = getChildNodesWithPath(program.body[0]);
			const segments = getChildNodesWithPath(declarator).map(
				(pair) => pair.segment,
			);
			expect(segments).toEqual(['id', 'init']);
		});
	});

	describe('a null object-valued property is skipped', () => {
		it('an omitted initializer produces no init segment', () => {
			const program = programOf('let x;');
			const [{ child: declarator }] = getChildNodesWithPath(program.body[0]);
			const segments = getChildNodesWithPath(declarator).map(
				(pair) => pair.segment,
			);
			expect(segments).toEqual(['id']);
		});
	});

	describe('multiple array-valued children', () => {
		it("a Program segments its statements as 'body.0' and 'body.1'", () => {
			const program = programOf('let x = 1; let y = 2;');
			const segments = getChildNodesWithPath(program).map(
				(pair) => pair.segment,
			);
			expect(segments).toEqual(['body.0', 'body.1']);
		});

		it('each array segment is paired with its own child node', () => {
			const program = programOf('let x = 1; "text";');
			const types = getChildNodesWithPath(program).map(
				(pair) => pair.child.type,
			);
			expect(types).toEqual(['VariableDeclaration', 'ExpressionStatement']);
		});
	});

	describe('mixed object-valued and array-valued children', () => {
		it('a CallExpression segments callee then each argument', () => {
			const program = programOf('foo(1, 2);');
			const [{ child: call }] = getChildNodesWithPath(program.body[0]);
			const segments = getChildNodesWithPath(call).map((pair) => pair.segment);
			expect(segments).toEqual(['callee', 'arguments.0', 'arguments.1']);
		});
	});

	describe('null holes keep the source index', () => {
		it('a hole between elements does not shift later indices', () => {
			const program = programOf('[1, , 3];');
			const [{ child: array }] = getChildNodesWithPath(program.body[0]);
			const segments = getChildNodesWithPath(array).map((pair) => pair.segment);
			expect(segments).toEqual(['elements.0', 'elements.2']);
		});

		it('a leading hole keeps the following index', () => {
			const program = programOf('[, 5];');
			const [{ child: array }] = getChildNodesWithPath(program.body[0]);
			const segments = getChildNodesWithPath(array).map((pair) => pair.segment);
			expect(segments).toEqual(['elements.1']);
		});
	});
});
