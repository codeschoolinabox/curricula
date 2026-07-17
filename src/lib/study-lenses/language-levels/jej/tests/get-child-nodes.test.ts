import { parse, type Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import getChildNodes from '../get-child-nodes.js';

function programOf(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

describe('getChildNodes', () => {
	describe('leaf nodes have no children', () => {
		it('a numeric Literal', () => {
			const program = programOf('42;');
			const [literal] = getChildNodes(program.body[0]);
			expect(getChildNodes(literal)).toHaveLength(0);
		});

		it('an Identifier', () => {
			const program = programOf('x;');
			const [identifier] = getChildNodes(program.body[0]);
			expect(getChildNodes(identifier)).toHaveLength(0);
		});

		it('a regex Literal whose regex metadata is not a node', () => {
			const program = programOf('/ab/;');
			const [literal] = getChildNodes(program.body[0]);
			expect(getChildNodes(literal)).toHaveLength(0);
		});
	});

	describe('a single non-array child', () => {
		it('an ExpressionStatement yields its one expression', () => {
			const program = programOf('x;');
			expect(getChildNodes(program.body[0])).toHaveLength(1);
		});
	});

	describe('an array-valued property', () => {
		it("a Program yields both of its body's declarations", () => {
			const program = programOf('let x = 1; let y = 2;');
			expect(getChildNodes(program)).toHaveLength(2);
		});

		it('the first child is the first declaration', () => {
			const program = programOf('let x = 1; let y = 2;');
			expect(getChildNodes(program)[0].type).toBe('VariableDeclaration');
		});

		it('the second child is the second declaration', () => {
			const program = programOf('let x = 1; let y = 2;');
			expect(getChildNodes(program)[1].type).toBe('VariableDeclaration');
		});

		it('a BlockStatement yields its body statements', () => {
			const program = programOf('{ let a = 1; let b = 2; }');
			expect(getChildNodes(program.body[0])).toHaveLength(2);
		});
	});

	describe('mixed object-valued properties', () => {
		it('an IfStatement with an else yields test, consequent, and alternate', () => {
			const program = programOf('if (true) { 1; } else { 2; }');
			const types = getChildNodes(program.body[0]).map((child) => child.type);
			expect(types).toEqual(['Literal', 'BlockStatement', 'BlockStatement']);
		});
	});

	describe('holes are skipped', () => {
		it('an IfStatement with no else yields only test and consequent', () => {
			const program = programOf('if (true) { 1; }');
			expect(getChildNodes(program.body[0])).toHaveLength(2);
		});

		it('a sparse array hole is not a child', () => {
			const program = programOf('[1, , 3];');
			const [array] = getChildNodes(program.body[0]);
			expect(getChildNodes(array)).toHaveLength(2);
		});
	});
});
