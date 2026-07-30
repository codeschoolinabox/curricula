import {
	parse,
	type ExpressionStatement,
	type Node,
	type Program,
} from 'acorn';
import { describe, expect, it } from 'vitest';

import type { ConstraintCheck } from '../../../lib/screening/types.js';
import justEnoughJs from '../just-enough-js.js';

function programOf(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function expressionOf(source: string): Node {
	return (programOf(source).body[0] as ExpressionStatement).expression;
}

describe('justEnoughJs', () => {
	describe('the allowlist as data', () => {
		it("admits exactly the realm's 17 names as globals", () => {
			expect(justEnoughJs.admittedGlobals).toEqual(
				new Set([
					'Math',
					'String',
					'Number',
					'Date',
					'RegExp',
					'Boolean',
					'BigInt',
					'parseInt',
					'parseFloat',
					'eval',
					'Infinity',
					'NaN',
					'undefined',
					'console',
					'alert',
					'confirm',
					'prompt',
				]),
			);
		});

		it('carries no name field', () => {
			expect('name' in justEnoughJs).toBe(false);
		});

		it('carries no blockedMemberNames field', () => {
			expect('blockedMemberNames' in justEnoughJs).toBe(false);
		});

		it('the allowlist is frozen', () => {
			expect(Object.isFrozen(justEnoughJs)).toBe(true);
		});

		it('the nodes record is frozen', () => {
			expect(Object.isFrozen(justEnoughJs.nodes)).toBe(true);
		});
	});

	describe('default-deny omissions', () => {
		it('WithStatement has no rule — with is a module SyntaxError upstream', () => {
			expect('WithStatement' in justEnoughJs.nodes).toBe(false);
		});

		it('FunctionDeclaration has no rule — absence is refusal', () => {
			expect('FunctionDeclaration' in justEnoughJs.nodes).toBe(false);
		});

		it('ParenthesizedExpression has no rule — the published ast never carries one', () => {
			// PINNED(human ruling 2026-07-30: published ast is ESTree-shaped — parens fold away; the table carries no entry for a node type the parse never publishes)
			expect('ParenthesizedExpression' in justEnoughJs.nodes).toBe(false);
		});
	});

	describe('unconditionally admitted node types', () => {
		it.each([
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
			'Literal',
			'ConditionalExpression',
			'ChainExpression',
			'CallExpression',
			'LabeledStatement',
			'SequenceExpression',
		])('%s is admitted outright', (nodeType) => {
			expect(justEnoughJs.nodes[nodeType]).toBe(true);
		});
	});

	describe('VariableDeclaration', () => {
		const check = justEnoughJs.nodes.VariableDeclaration as ConstraintCheck;

		it.each([
			'let x = 1;',
			'const x = 1;',
			'let a = 1, b = 2;',
			'const a = 1, b = 2;',
		])('admits %s', (source) => {
			expect(check(programOf(source).body[0])).toBe(true);
		});

		it('refuses var with the exact message', () => {
			expect(check(programOf('var x = 1;').body[0])).toBe(
				"'var' declarations are not allowed — use 'let' or 'const'",
			);
		});
	});

	describe('AssignmentExpression', () => {
		const check = justEnoughJs.nodes.AssignmentExpression as ConstraintCheck;

		describe('the operator constraint', () => {
			it.each([
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
				'&=',
				'|=',
				'^=',
				'<<=',
				'>>=',
				'>>>=',
			])('admits %s to a variable', (operator) => {
				expect(check(expressionOf(`x ${operator} y;`))).toBe(true);
			});

			it('refuses an operator outside the set with the exact message', () => {
				const synthetic = {
					type: 'AssignmentExpression',
					operator: '~=',
					left: { type: 'Identifier', name: 'x' },
				} as unknown as Node;
				expect(check(synthetic)).toBe(
					"Assignment operator '~=' is not allowed",
				);
			});
		});

		describe('the assignment-target constraint', () => {
			it('refuses x.y = 1 with the exact message', () => {
				expect(check(expressionOf('x.y = 1;'))).toBe(
					'You can only assign to variables — property assignment is not allowed',
				);
			});

			it('refuses x.y += 1 with the exact message', () => {
				expect(check(expressionOf('x.y += 1;'))).toBe(
					'You can only assign to variables — property assignment is not allowed',
				);
			});
		});
	});

	describe('UpdateExpression', () => {
		const check = justEnoughJs.nodes.UpdateExpression as ConstraintCheck;

		it.each(['++x;', 'x++;', '--x;', 'x--;'])('admits %s', (source) => {
			expect(check(expressionOf(source))).toBe(true);
		});

		it('admits x.y++ — the target is not constrained', () => {
			expect(check(expressionOf('x.y++;'))).toBe(true);
		});

		it('refuses an operator outside ++/-- with the exact message', () => {
			const synthetic = {
				type: 'UpdateExpression',
				operator: '+++',
				prefix: true,
			} as unknown as Node;
			expect(check(synthetic)).toBe("Update operator '+++' is not allowed");
		});
	});

	describe('BinaryExpression', () => {
		const check = justEnoughJs.nodes.BinaryExpression as ConstraintCheck;

		it.each([
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
			'&',
			'|',
			'^',
			'<<',
			'>>',
			'>>>',
			'in',
		])('admits %s', (operator) => {
			expect(check(expressionOf(`a ${operator} b;`))).toBe(true);
		});

		it.each(['==', '!=', 'instanceof'])(
			'refuses %s with the exact message',
			(operator) => {
				expect(check(expressionOf(`a ${operator} b;`))).toBe(
					`Binary operator '${operator}' is not allowed`,
				);
			},
		);
	});

	describe('LogicalExpression', () => {
		const check = justEnoughJs.nodes.LogicalExpression as ConstraintCheck;

		it.each(['&&', '||', '??'])('admits %s', (operator) => {
			expect(check(expressionOf(`a ${operator} b;`))).toBe(true);
		});

		it('refuses an operator outside the set with the exact message', () => {
			const synthetic = {
				type: 'LogicalExpression',
				operator: 'or',
			} as unknown as Node;
			expect(check(synthetic)).toBe("Logical operator 'or' is not allowed");
		});
	});

	describe('UnaryExpression', () => {
		const check = justEnoughJs.nodes.UnaryExpression as ConstraintCheck;

		it.each(['typeof a;', '!a;', '-a;', '~a;', 'void a;'])(
			'admits %s',
			(source) => {
				expect(check(expressionOf(source))).toBe(true);
			},
		);

		it('refuses delete with the exact message', () => {
			expect(check(expressionOf('delete x.y;'))).toBe(
				"Unary operator 'delete' is not allowed",
			);
		});

		it('refuses unary + with the exact message', () => {
			expect(check(expressionOf('+a;'))).toBe(
				"Unary operator '+' is not allowed",
			);
		});
	});

	describe('IfStatement', () => {
		const check = justEnoughJs.nodes.IfStatement as ConstraintCheck;

		describe('the consequent constraint', () => {
			it('admits a block consequent with no alternate', () => {
				expect(check(programOf('if (a) { b(); }').body[0])).toBe(true);
			});

			it('refuses a braceless consequent with the exact message', () => {
				expect(check(programOf('if (a) b();').body[0])).toBe(
					'if/else bodies must use curly braces `{}`',
				);
			});
		});

		describe('the alternate constraint', () => {
			it('admits a block alternate', () => {
				expect(check(programOf('if (a) { b(); } else { c(); }').body[0])).toBe(
					true,
				);
			});

			it('admits an else-if chain', () => {
				expect(
					check(programOf('if (a) { b(); } else if (c) { d(); }').body[0]),
				).toBe(true);
			});

			it('refuses a braceless alternate with the exact message', () => {
				expect(check(programOf('if (a) { b(); } else c();').body[0])).toBe(
					'if/else bodies must use curly braces `{}`',
				);
			});
		});
	});

	describe('WhileStatement', () => {
		const check = justEnoughJs.nodes.WhileStatement as ConstraintCheck;

		it('admits a block body', () => {
			expect(check(programOf('while (a) { b(); }').body[0])).toBe(true);
		});

		it('refuses a braceless body with the exact message', () => {
			expect(check(programOf('while (a) b();').body[0])).toBe(
				'while body must use curly braces `{}`',
			);
		});
	});

	describe('DoWhileStatement', () => {
		const check = justEnoughJs.nodes.DoWhileStatement as ConstraintCheck;

		it('admits a block body', () => {
			expect(check(programOf('do { b(); } while (a);').body[0])).toBe(true);
		});

		it('refuses a braceless body with the exact message', () => {
			expect(check(programOf('do b(); while (a);').body[0])).toBe(
				'do-while body must use curly braces `{}`',
			);
		});
	});

	describe('ForStatement', () => {
		const check = justEnoughJs.nodes.ForStatement as ConstraintCheck;

		it('admits a block body', () => {
			expect(check(programOf('for (;;) { b(); }').body[0])).toBe(true);
		});

		it('refuses a braceless body with the exact message', () => {
			expect(check(programOf('for (;;) b();').body[0])).toBe(
				'for body must use curly braces `{}`',
			);
		});
	});

	describe('ForOfStatement', () => {
		const check = justEnoughJs.nodes.ForOfStatement as ConstraintCheck;

		it('admits a block body with a const head', () => {
			expect(check(programOf('for (const x of y) { b(); }').body[0])).toBe(
				true,
			);
		});

		it('admits a block body with a let head', () => {
			expect(check(programOf('for (let x of y) { b(); }').body[0])).toBe(true);
		});

		it('refuses a braceless body with the exact message', () => {
			expect(check(programOf('for (const x of y) b();').body[0])).toBe(
				'for-of body must use curly braces `{}`',
			);
		});
	});

	describe('MemberExpression', () => {
		const check = justEnoughJs.nodes.MemberExpression as ConstraintCheck;

		describe('computed access is never gated', () => {
			it('admits bracket indexing', () => {
				expect(check(expressionOf('x[0];'))).toBe(true);
			});

			it("admits x['split'] — the documented residual hole", () => {
				expect(check(expressionOf("x['split'];"))).toBe(true);
			});
		});

		describe('dot access is allow-all-except', () => {
			it.each(['length', 'log', 'warn', 'charAt', 'toString'])(
				'admits .%s',
				(name) => {
					expect(check(expressionOf(`x.${name};`))).toBe(true);
				},
			);

			it('admits .charCodeAt — never on any list, proving allow-all', () => {
				expect(check(expressionOf('x.charCodeAt;'))).toBe(true);
			});

			it.each([
				'split',
				'match',
				'matchAll',
				'constructor',
				'__proto__',
				'prototype',
				'call',
				'apply',
				'bind',
				'__defineGetter__',
				'__defineSetter__',
				'__lookupGetter__',
				'__lookupSetter__',
				'caller',
				'arguments',
			])('refuses .%s with the exact message', (name) => {
				expect(check(expressionOf(`x.${name};`))).toBe(
					`Property '.${name}' is not available at this language level`,
				);
			});
		});
	});

	describe('NewExpression', () => {
		const check = justEnoughJs.nodes.NewExpression as ConstraintCheck;

		it('admits new Date()', () => {
			expect(check(expressionOf('new Date();'))).toBe(true);
		});

		it('refuses new Foo() with the exact message', () => {
			expect(check(expressionOf('new Foo();'))).toBe(
				"'new' is only allowed with Date (new Date()) at this language level",
			);
		});

		it('refuses new RegExp() with the exact message', () => {
			expect(check(expressionOf("new RegExp('a');"))).toBe(
				"'new' is only allowed with Date (new Date()) at this language level",
			);
		});

		it('refuses a member-expression callee with the exact message', () => {
			expect(check(expressionOf('new a.b();'))).toBe(
				"'new' is only allowed with Date (new Date()) at this language level",
			);
		});

		it('refuses a non-Identifier callee even when it carries name Date', () => {
			const synthetic = {
				type: 'NewExpression',
				callee: { type: 'CallExpression', name: 'Date' },
			} as unknown as Node;
			expect(check(synthetic)).toBe(
				"'new' is only allowed with Date (new Date()) at this language level",
			);
		});
	});
});
