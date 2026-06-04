import { describe, it, expect } from 'vitest';
import type { Node } from 'acorn';

import justEnoughJs from '../just-enough-js.js';
import type { NodeValidator } from '../types.js';

// LanguageLevel declares allowedGlobals + blockedMemberNames as optional,
// but the justEnoughJs literal always populates them. Destructure here so
// the rest of the file can use them without repeated null-narrowing; the
// throw enforces the test-file invariant.
const { allowedGlobals, blockedMemberNames } = justEnoughJs;
if (!allowedGlobals || !blockedMemberNames) {
	throw new Error(
		'just-enough-js.test.ts requires allowedGlobals and ' +
			'blockedMemberNames to be populated.',
	);
}

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

// -- helper: invoke a NodeValidator with a dummy nodePath. These tests
// exercise legality (nodeType / message), not path assignment, so the
// path value is irrelevant — the walker supplies the real one in prod.
function callRule(rule: NodeValidator, node: Node) {
	return rule(node, '$');
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
			expect(allowedGlobals).toBeInstanceOf(Set);
			expect(Object.isFrozen(allowedGlobals)).toBe(true);
		});

		it('includes expected globals', () => {
			expect(allowedGlobals.has('console')).toBe(true);
			expect(allowedGlobals.has('alert')).toBe(true);
			expect(allowedGlobals.has('undefined')).toBe(true);
		});

		it('includes eval as easter egg global', () => {
			expect(allowedGlobals.has('eval')).toBe(true);
		});

		it('excludes disallowed globals', () => {
			expect(allowedGlobals.has('document')).toBe(false);
			expect(allowedGlobals.has('window')).toBe(false);
			expect(allowedGlobals.has('Array')).toBe(false);
		});

		it('includes Math and RegExp globals', () => {
			expect(allowedGlobals.has('Math')).toBe(true);
			expect(allowedGlobals.has('RegExp')).toBe(true);
			expect(allowedGlobals.has('parseInt')).toBe(true);
			expect(allowedGlobals.has('parseFloat')).toBe(true);
		});

		it('includes Date and BigInt globals', () => {
			expect(allowedGlobals.has('Date')).toBe(true);
			expect(allowedGlobals.has('BigInt')).toBe(true);
		});

		it('has a frozen blockedMemberNames Set', () => {
			expect(blockedMemberNames).toBeInstanceOf(Set);
			expect(Object.isFrozen(blockedMemberNames)).toBe(true);
		});

		it('blocks array-returning string methods', () => {
			expect(blockedMemberNames.has('split')).toBe(true);
			expect(blockedMemberNames.has('match')).toBe(true);
			expect(blockedMemberNames.has('matchAll')).toBe(true);
		});

		it('blocks reflection / prototype-escape names', () => {
			expect(blockedMemberNames.has('constructor')).toBe(true);
			expect(blockedMemberNames.has('__proto__')).toBe(true);
			expect(blockedMemberNames.has('call')).toBe(true);
		});

		it('does not block ordinary or newly-allowed names', () => {
			expect(blockedMemberNames.has('length')).toBe(false);
			expect(blockedMemberNames.has('toLowerCase')).toBe(false);
			expect(blockedMemberNames.has('warn')).toBe(false);
			expect(blockedMemberNames.has('toString')).toBe(false);
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
			const result = callRule(
				validate,
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'let',
					declarations: [{}],
				}),
			);
			expect(result).toBe(true);
		});

		it('allows const', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [{}],
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects var', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'var',
					declarations: [{}],
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'VariableDeclaration');
		});

		it('allows multi-declaration (let a, b)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'let',
					declarations: [{}, {}],
				}),
			);
			expect(result).toBe(true);
		});

		it('allows multi-declaration with const', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [{}, {}],
				}),
			);
			expect(result).toBe(true);
		});
	});

	describe('IfStatement constraint', () => {
		const validate = justEnoughJs.nodes.IfStatement as NodeValidator;

		it('allows if with block consequent and no alternate', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: null,
				}),
			);
			expect(result).toBe(true);
		});

		it('allows if/else with block consequent and block alternate', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: fakeBlockStatement(),
				}),
			);
			expect(result).toBe(true);
		});

		it('allows if/else if (alternate is IfStatement)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'IfStatement',
					consequent: fakeBlockStatement(),
					alternate: { type: 'IfStatement' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless consequent', () => {
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
				fakeNode({
					type: 'WhileStatement',
					body: fakeBlockStatement(),
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless body', () => {
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
				fakeNode({
					type: 'ForOfStatement',
					body: fakeBlockStatement(),
					left: { type: 'VariableDeclaration', kind: 'const' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects braceless body', () => {
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
				fakeNode({
					type: 'ForOfStatement',
					body: fakeBlockStatement(),
					left: { type: 'VariableDeclaration', kind: 'let' },
				}),
			);
			expect(result).toBe(true);
		});

		it('returns rejection (not warning) when body is braceless even with let head', () => {
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: true,
					property: { type: 'Literal', value: 0 },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to allowed property name', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'length' },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to log', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'log' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects non-computed access to disallowed property name', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'match' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'MemberExpression');
		});

		it('allows non-computed access to warn (not blocklisted)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'warn' },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to charAt (newly allowed by inversion)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'charAt' },
				}),
			);
			expect(result).toBe(true);
		});

		// Decisive allow-all probe: charCodeAt was never in the old member
		// allowlist and is not blocklisted. A widened-allowlist impl cannot
		// pass this without re-listing all of String.prototype.
		it('allows non-computed access to charCodeAt (never listed — proves allow-all)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'charCodeAt' },
				}),
			);
			expect(result).toBe(true);
		});

		it('allows non-computed access to toString (intentionally not blocked)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'toString' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects non-computed access to constructor (reflection escape)', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'MemberExpression',
					computed: false,
					property: { type: 'Identifier', name: 'constructor' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'MemberExpression');
		});
	});

	describe('CallExpression', () => {
		it('is unconditionally allowed', () => {
			expect(justEnoughJs.nodes.CallExpression).toBe(true);
		});
	});

	describe('NewExpression constraint', () => {
		const validate = justEnoughJs.nodes.NewExpression as NodeValidator;

		it('is wired as a validator function', () => {
			expect(typeof justEnoughJs.nodes.NewExpression).toBe('function');
		});

		it('allows new Date()', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'NewExpression',
					callee: { type: 'Identifier', name: 'Date' },
				}),
			);
			expect(result).toBe(true);
		});

		it('rejects new with a non-Date identifier callee', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'NewExpression',
					callee: { type: 'Identifier', name: 'Foo' },
				}),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'NewExpression');
		});

		it('rejects new RegExp()', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'NewExpression',
					callee: { type: 'Identifier', name: 'RegExp' },
				}),
			);
			expect(result).not.toBe(true);
		});

		it('rejects new with a non-identifier callee', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'NewExpression',
					callee: { type: 'MemberExpression', computed: false },
				}),
			);
			expect(result).not.toBe(true);
		});

		// Forces the `callee.type === 'Identifier'` guard: a non-Identifier
		// callee that nonetheless carries name 'Date' must still reject.
		it('rejects a non-Identifier callee even when it carries name Date', () => {
			const result = callRule(
				validate,
				fakeNode({
					type: 'NewExpression',
					callee: { type: 'CallExpression', name: 'Date' },
				}),
			);
			expect(result).not.toBe(true);
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
				const result = callRule(
					validate,
					fakeNode({
						type: 'AssignmentExpression',
						operator: op,
						left: { type: 'Identifier', name: 'x' },
					}),
				);
				expect(result).toBe(true);
			});
		}

		const bitwiseAssignmentOperators = ['&=', '|=', '^=', '<<=', '>>=', '>>>='];

		for (const op of bitwiseAssignmentOperators) {
			it(`allows ${op}`, () => {
				const result = callRule(
					validate,
					fakeNode({
						type: 'AssignmentExpression',
						operator: op,
						left: { type: 'Identifier', name: 'x' },
					}),
				);
				expect(result).toBe(true);
			});
		}

		it('rejects property assignment with =', () => {
			const result = callRule(
				validate,
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
			const result = callRule(
				validate,
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

	describe('UpdateExpression constraint', () => {
		const validate = justEnoughJs.nodes.UpdateExpression as NodeValidator;

		it('allows prefix ++', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UpdateExpression', operator: '++', prefix: true }),
			);
			expect(result).toBe(true);
		});

		it('allows postfix ++', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UpdateExpression', operator: '++', prefix: false }),
			);
			expect(result).toBe(true);
		});

		it('allows prefix --', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UpdateExpression', operator: '--', prefix: true }),
			);
			expect(result).toBe(true);
		});

		it('allows postfix --', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UpdateExpression', operator: '--', prefix: false }),
			);
			expect(result).toBe(true);
		});

		it('rejects an unrecognized update operator', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UpdateExpression', operator: '+++', prefix: true }),
			);
			expect(result).not.toBe(true);
			expect(result).toHaveProperty('nodeType', 'UpdateExpression');
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
			'in',
		];

		for (const op of allowed) {
			it(`allows ${op}`, () => {
				const result = callRule(
					validate,
					fakeNode({ type: 'BinaryExpression', operator: op }),
				);
				expect(result).toBe(true);
			});
		}

		it('rejects ==', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'BinaryExpression', operator: '==' }),
			);
			expect(result).not.toBe(true);
		});

		it('rejects !=', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'BinaryExpression', operator: '!=' }),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('LogicalExpression constraint', () => {
		const validate = justEnoughJs.nodes.LogicalExpression as NodeValidator;

		it('allows &&', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'LogicalExpression', operator: '&&' }),
			);
			expect(result).toBe(true);
		});

		it('allows ||', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'LogicalExpression', operator: '||' }),
			);
			expect(result).toBe(true);
		});

		it('allows ??', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'LogicalExpression', operator: '??' }),
			);
			expect(result).toBe(true);
		});
	});

	describe('UnaryExpression constraint', () => {
		const validate = justEnoughJs.nodes.UnaryExpression as NodeValidator;

		it('allows typeof', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UnaryExpression', operator: 'typeof' }),
			);
			expect(result).toBe(true);
		});

		it('allows !', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UnaryExpression', operator: '!' }),
			);
			expect(result).toBe(true);
		});

		it('allows - (unary minus)', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UnaryExpression', operator: '-' }),
			);
			expect(result).toBe(true);
		});

		it('allows void (easter egg)', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UnaryExpression', operator: 'void' }),
			);
			expect(result).toBe(true);
		});

		it('rejects delete', () => {
			const result = callRule(
				validate,
				fakeNode({ type: 'UnaryExpression', operator: 'delete' }),
			);
			expect(result).not.toBe(true);
		});
	});

	describe('Literal', () => {
		it('is unconditionally allowed (all JeJ literal forms, incl. regex and bigint)', () => {
			expect(justEnoughJs.nodes.Literal).toBe(true);
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
