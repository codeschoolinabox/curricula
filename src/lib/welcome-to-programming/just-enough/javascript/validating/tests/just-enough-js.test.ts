import { describe, it, expect } from 'vitest';
import type { Node } from 'acorn';

import justEnoughJs from '../just-enough-js.js';
import type { NodeValidator } from '../types.js';

// -- helper: create a minimal fake node for testing validators --
function fakeNode(props: Record<string, unknown>): Node {
	return {
		start: 0,
		end: 1,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
		...props,
	} as Node;
}

function fakeBlockStatement(): Record<string, unknown> {
	return { type: 'BlockStatement', body: [] };
}

describe('justEnoughJs', () => {
	describe('level configuration', () => {
		it('has a name', () => {
			expect(justEnoughJs.name).toBe('Just Enough JavaScript');
		});

		it('does not have a meta field', () => {
			expect('meta' in justEnoughJs).toBe(false);
		});

		it('has a frozen allowedGlobals Set', () => {
			expect(justEnoughJs.allowedGlobals).toBeInstanceOf(Set);
			expect(Object.isFrozen(justEnoughJs.allowedGlobals)).toBe(true);
		});

		it('includes expected globals', () => {
			expect(justEnoughJs.allowedGlobals.has('console')).toBe(true);
			expect(justEnoughJs.allowedGlobals.has('alert')).toBe(true);
			expect(justEnoughJs.allowedGlobals.has('undefined')).toBe(true);
		});

		it('includes eval as easter egg global', () => {
			expect(justEnoughJs.allowedGlobals.has('eval')).toBe(true);
		});

		it('excludes disallowed globals', () => {
			expect(justEnoughJs.allowedGlobals.has('Math')).toBe(false);
			expect(justEnoughJs.allowedGlobals.has('isNaN')).toBe(false);
			expect(justEnoughJs.allowedGlobals.has('document')).toBe(false);
		});

		it('has a frozen allowedMemberNames Set', () => {
			expect(justEnoughJs.allowedMemberNames).toBeInstanceOf(Set);
			expect(Object.isFrozen(justEnoughJs.allowedMemberNames)).toBe(true);
		});

		it('includes expected member names', () => {
			expect(justEnoughJs.allowedMemberNames.has('length')).toBe(true);
			expect(justEnoughJs.allowedMemberNames.has('toLowerCase')).toBe(true);
			expect(justEnoughJs.allowedMemberNames.has('log')).toBe(true);
		});

		it('excludes disallowed member names', () => {
			expect(justEnoughJs.allowedMemberNames.has('match')).toBe(false);
			expect(justEnoughJs.allowedMemberNames.has('split')).toBe(false);
			expect(justEnoughJs.allowedMemberNames.has('warn')).toBe(false);
		});
	});

	describe('unconditionally allowed nodes are true', () => {
		const unconditional = [
			'Program',
			'ExpressionStatement',
			'Identifier',
			'VariableDeclarator',
			'BlockStatement',
			'BreakStatement',
			'ContinueStatement',
			'EmptyStatement',
			'TemplateLiteral',
			'TemplateElement',
			'ConditionalExpression',
			'ChainExpression',
			'ParenthesizedExpression',
			'LabeledStatement',
			'SequenceExpression',
			'WithStatement',
		];

		for (const nodeType of unconditional) {
			it(`allows ${nodeType}`, () => {
				expect(justEnoughJs.nodes[nodeType]).toBe(true);
			});
		}
	});

	describe('VariableDeclaration constraint', () => {
		const validate = justEnoughJs.nodes.VariableDeclaration as NodeValidator;

		it('allows let', () => {
			const result = validate(
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'let',
					declarations: [{}],
				}),
			);
			expect(result).toBe(true);
		});

		it('allows const', () => {
			const result = validate(
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [{}],
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects var', () => {
			const result = validate(
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'var',
					declarations: [{}],
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'VariableDeclaration');
		});

		it('rejects multi-declaration (let a, b)', () => {
			const result = validate(
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'let',
					declarations: [{}, {}],
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'VariableDeclaration');
		});

		it('rejects multi-declaration with const', () => {
			const result = validate(
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [{}, {}],
				}),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('IfStatement constraint', () => {
		const validate = justEnoughJs.nodes.IfStatement as NodeValidator;

		it('allows if with block consequent and no alternate', () => {
			const result = validate(
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: null,
				}),
			);
			expect(result).toBe(true);
		});

		it('allows if/else with block consequent and block alternate', () => {
			const result = validate(
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: fakeBlockStatement(),
				}),
			);
			expect(result).toBe(true);
		});

		it('allows if/else if (alternate is IfStatement)', () => {
			const result = validate(
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: { type: 'IfStatement' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless consequent', () => {
			const result = validate(
				fakeNode({
					type: 'IfStatement',
					consequent: { type: 'ExpressionStatement' },
					alternate: null,
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'IfStatement');
		});

		it('rejects braceless alternate', () => {
			const result = validate(
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: { type: 'ExpressionStatement' },
				}),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('WhileStatement constraint', () => {
		const validate = justEnoughJs.nodes.WhileStatement as NodeValidator;

		it('allows while with block body', () => {
			const result = validate(
				fakeNode({
					type: 'WhileStatement',
					body: fakeBlockStatement(),
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless body', () => {
			const result = validate(
				fakeNode({
					type: 'WhileStatement',
					body: { type: 'ExpressionStatement' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'WhileStatement');
		});
	});

	describe('ForOfStatement constraint', () => {
		const validate = justEnoughJs.nodes.ForOfStatement as NodeValidator;

		it('allows for-of with block body and const head', () => {
			const result = validate(
				fakeNode({
					type: 'ForOfStatement',
					body: fakeBlockStatement(),
					left: { type: 'VariableDeclaration', kind: 'const' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless body', () => {
			const result = validate(
				fakeNode({
					type: 'ForOfStatement',
					body: { type: 'ExpressionStatement' },
					left: { type: 'VariableDeclaration', kind: 'const' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('severity', 'rejection');
		});

		it('accepts let in for-of head', () => {
			const result = validate(
				fakeNode({
					type: 'ForOfStatement',
					body: fakeBlockStatement(),
					left: { type: 'VariableDeclaration', kind: 'let' },
				}),
			);
			expect(result).toBe(true);
		});

		it('returns rejection (not warning) when body is braceless even with let head', () => {
			const result = validate(
				fakeNode({
					type: 'ForOfStatement',
					body: { type: 'ExpressionStatement' },
					left: { type: 'VariableDeclaration', kind: 'let' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('severity', 'rejection');
		});
	});

	describe('MemberExpression constraint', () => {
		const validate = justEnoughJs.nodes.MemberExpression as NodeValidator;

		it('allows computed access (bracket indexing)', () => {
			const result = validate(
				fakeNode({
					type: 'MemberExpression',
					computed: true,
					property: { type: 'Literal', value: 0 },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to allowed property name', () => {
			const result = validate(
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'length' },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to log', () => {
			const result = validate(
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'log' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects non-computed access to disallowed property name', () => {
			const result = validate(
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'match' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'MemberExpression');
		});

		it('rejects non-computed access to warn', () => {
			const result = validate(
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'warn' },
				}),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('CallExpression constraint', () => {
		const validate = justEnoughJs.nodes.CallExpression as NodeValidator;

		it('allows call with non-computed callee', () => {
			const result = validate(
				fakeNode({
					type: 'CallExpression',
					callee: {
						type: 'MemberExpression',
						computed: false,
						property: { type: 'Identifier', name: 'log' },
					},
				}),
			);
			expect(result).toBe(true);
		});

		it('allows call with identifier callee', () => {
			const result = validate(
				fakeNode({
					type: 'CallExpression',
					callee: { type: 'Identifier', name: 'alert' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects call with computed MemberExpression callee', () => {
			const result = validate(
				fakeNode({
					type: 'CallExpression',
					callee: {
						type: 'MemberExpression',
						computed: true,
						property: { type: 'Literal', value: 'toLowerCase' },
					},
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'CallExpression');
		});
	});

	describe('AssignmentExpression constraint', () => {
		const validate = justEnoughJs.nodes.AssignmentExpression as NodeValidator;

		const allowedOperators = [
			'=',
			'+=',
			'-=',
			'*=',
			'/=',
			'%=',
			'**=',
			'??=',
			'||=',
			'&&=',
		];

		for (const op of allowedOperators) {
			it(`allows ${op} to Identifier`, () => {
				const result = validate(
					fakeNode({
						type: 'AssignmentExpression',
						operator: op,
						left: { type: 'Identifier', name: 'x' },
					}),
				);
				expect(result).toBe(true);
			});
		}

		const rejectedOperators = ['&=', '|=', '^=', '<<=', '>>=', '>>>='];

		for (const op of rejectedOperators) {
			it(`rejects ${op}`, () => {
				const result = validate(
					fakeNode({
						type: 'AssignmentExpression',
						operator: op,
						left: { type: 'Identifier', name: 'x' },
					}),
				);
				expect(result).not.toBe(true);
				expect(result).toHaveProperty('nodeType', 'AssignmentExpression');
			});
		}

		it('rejects property assignment with =', () => {
			const result = validate(
				fakeNode({
					type: 'AssignmentExpression',
					operator: '=',
					left: { type: 'MemberExpression' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('message');
			expect((result as { message: string }).message).toContain(
				'property assignment',
			);
		});

		it('rejects property assignment with compound operator', () => {
			const result = validate(
				fakeNode({
					type: 'AssignmentExpression',
					operator: '+=',
					left: { type: 'MemberExpression' },
				}),
			);
			expect(result).not.toBe(true);
			expect((result as { message: string }).message).toContain(
				'property assignment',
			);
		});
	});

	describe('BinaryExpression constraint', () => {
		const validate = justEnoughJs.nodes.BinaryExpression as NodeValidator;
		const allowed = [
			'===',
			'!==',
			'+',
			'-',
			'*',
			'/',
			'%',
			'**',
			'>',
			'<',
			'>=',
			'<=',
		];

		for (const op of allowed) {
			it(`allows ${op}`, () => {
				const result = validate(
					fakeNode({ type: 'BinaryExpression', operator: op }),
				);
				expect(result).toBe(true);
			});
		}

		it('rejects ==', () => {
			const result = validate(
				fakeNode({ type: 'BinaryExpression', operator: '==' }),
			);
			expect(result).not.toBe(true);
		});

		it('rejects !=', () => {
			const result = validate(
				fakeNode({ type: 'BinaryExpression', operator: '!=' }),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('LogicalExpression constraint', () => {
		const validate = justEnoughJs.nodes.LogicalExpression as NodeValidator;

		it('allows &&', () => {
			const result = validate(
				fakeNode({ type: 'LogicalExpression', operator: '&&' }),
			);
			expect(result).toBe(true);
		});

		it('allows ||', () => {
			const result = validate(
				fakeNode({ type: 'LogicalExpression', operator: '||' }),
			);
			expect(result).toBe(true);
		});

		it('allows ??', () => {
			const result = validate(
				fakeNode({ type: 'LogicalExpression', operator: '??' }),
			);
			expect(result).toBe(true);
		});
	});

	describe('UnaryExpression constraint', () => {
		const validate = justEnoughJs.nodes.UnaryExpression as NodeValidator;

		it('allows typeof', () => {
			const result = validate(
				fakeNode({ type: 'UnaryExpression', operator: 'typeof' }),
			);
			expect(result).toBe(true);
		});

		it('allows !', () => {
			const result = validate(
				fakeNode({ type: 'UnaryExpression', operator: '!' }),
			);
			expect(result).toBe(true);
		});

		it('allows - (unary minus)', () => {
			const result = validate(
				fakeNode({ type: 'UnaryExpression', operator: '-' }),
			);
			expect(result).toBe(true);
		});

		it('allows void (easter egg)', () => {
			const result = validate(
				fakeNode({ type: 'UnaryExpression', operator: 'void' }),
			);
			expect(result).toBe(true);
		});

		it('rejects delete', () => {
			const result = validate(
				fakeNode({ type: 'UnaryExpression', operator: 'delete' }),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('Literal constraint', () => {
		const validate = justEnoughJs.nodes.Literal as NodeValidator;

		it('allows string literals', () => {
			const result = validate(fakeNode({ type: 'Literal', value: 'hello' }));
			expect(result).toBe(true);
		});

		it('allows number literals', () => {
			const result = validate(fakeNode({ type: 'Literal', value: 42 }));
			expect(result).toBe(true);
		});

		it('allows boolean literals', () => {
			const result = validate(fakeNode({ type: 'Literal', value: true }));
			expect(result).toBe(true);
		});

		it('allows null', () => {
			const result = validate(fakeNode({ type: 'Literal', value: null }));
			expect(result).toBe(true);
		});

		it('rejects regex literals', () => {
			const result = validate(
				fakeNode({
					type: 'Literal',
					value: /abc/,
					regex: { pattern: 'abc', flags: '' },
				}),
			);
			expect(result).not.toBe(true);
		});

		it('rejects bigint literals', () => {
			const result = validate(fakeNode({ type: 'Literal', bigint: '42' }));
			expect(result).not.toBe(true);
		});
	});

	describe('object is frozen', () => {
		it('top-level object is frozen', () => {
			expect(Object.isFrozen(justEnoughJs)).toBe(true);
		});

		it('nodes record is frozen', () => {
			expect(Object.isFrozen(justEnoughJs.nodes)).toBe(true);
		});
	});
});
