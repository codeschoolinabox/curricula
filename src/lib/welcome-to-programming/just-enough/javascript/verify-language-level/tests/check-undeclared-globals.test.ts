import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import checkUndeclaredGlobals from '../check-undeclared-globals.js';

// -- helper: parse source to AST --
function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

const ALLOWED_GLOBALS = Object.freeze(
	new Set([
		'console',
		'alert',
		'confirm',
		'prompt',
		'String',
		'Number',
		'Boolean',
		'undefined',
		'NaN',
		'Infinity',
	]),
);

describe('checkUndeclaredGlobals', () => {
	describe('undeclared globals — rejections', () => {
		it('flags an undeclared identifier', () => {
			const ast = parseSource('x;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('x'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('rejection');
		});

		it('flags parseInt as undeclared', () => {
			const ast = parseSource('parseInt("42");');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('parseInt'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('rejection');
		});

		it('flags Math as undeclared', () => {
			const ast = parseSource('Math;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('Math'));
			expect(v).toBeDefined();
		});

		it('flags identifier used after block scope ends', () => {
			const ast = parseSource('if (true) { let x = 1; }\nx;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes('x'),
			);
			expect(v).toBeDefined();
		});

		it('does not flag declared variables', () => {
			const ast = parseSource('let x = 1;\nx;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag allowed globals', () => {
			const ast = parseSource('console.log("hi");');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag allowed global used as value', () => {
			const ast = parseSource('let x = alert;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag undefined as undeclared', () => {
			const ast = parseSource('let x = undefined;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag for-of iteration variable inside loop body', () => {
			const ast = parseSource('for (const c of "hi") { c; }');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag MemberExpression property names as undeclared', () => {
			const ast = parseSource('let x = "hi";\nx.length;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'rejection' && v.message.includes('length'),
			);
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag VariableDeclarator id as a reference', () => {
			const ast = parseSource('let foo = 1;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'rejection' && v.message.includes('foo'),
			);
			expect(undeclared).toHaveLength(0);
		});
	});

	describe('unused variables — warnings', () => {
		it('warns about an unused declared variable', () => {
			const ast = parseSource('let x = 1;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'warning' && v.message.includes('x'),
			);
			expect(v).toBeDefined();
			expect(v!.nodeType).toBe('Identifier');
		});

		it('does not warn when variable is used', () => {
			const ast = parseSource('let x = 1;\nconsole.log(x);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const unused = violations.filter(
				(v) => v.severity === 'warning' && v.message.includes('unused'),
			);
			expect(unused).toHaveLength(0);
		});

		it('does not warn about unused for-of variable that is used', () => {
			const ast = parseSource('for (const c of "hi") { console.log(c); }');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const unused = violations.filter(
				(v) => v.severity === 'warning' && v.message.includes('unused'),
			);
			expect(unused).toHaveLength(0);
		});

		it('warns about unused for-of variable', () => {
			const ast = parseSource(
				'for (const c of "hi") { console.log("hello"); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'warning' && v.message.includes('c'),
			);
			expect(v).toBeDefined();
		});

		it('warns about unused const', () => {
			const ast = parseSource('const PI = 3.14;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'warning' && v.message.includes('PI'),
			);
			expect(v).toBeDefined();
		});
	});

	describe('variable shadowing — warnings', () => {
		it('warns when inner block shadows outer variable', () => {
			const ast = parseSource('let x = 1;\nif (true) { let x = 2; }');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'warning' && v.message.includes('shadow'),
			);
			expect(v).toBeDefined();
		});

		it('does not warn for sibling scope same-name declarations', () => {
			const ast = parseSource(
				'if (true) { let x = 1; }\nif (true) { let x = 2; }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const shadow = violations.filter(
				(v) => v.severity === 'warning' && v.message.includes('shadow'),
			);
			expect(shadow).toHaveLength(0);
		});

		it('warns when for-of variable shadows outer variable', () => {
			const ast = parseSource(
				'let c = "x";\nfor (const c of "hi") { console.log(c); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'warning' && v.message.includes('shadow'),
			);
			expect(v).toBeDefined();
		});
	});

	describe('scope boundaries', () => {
		it('respects block scope — inner declaration not visible outside', () => {
			const ast = parseSource(
				'if (true) { let inner = 1; }\nconsole.log(inner);',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes('inner'),
			);
			expect(v).toBeDefined();
		});

		it('nested scopes can access outer declarations', () => {
			const ast = parseSource(
				'let outer = 1;\nif (true) { console.log(outer); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('for-of iteration variable is scoped to the loop', () => {
			const ast = parseSource(
				'for (const c of "hi") { console.log(c); }\nc;',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes("'c'"),
			);
			expect(v).toBeDefined();
		});
	});

	describe('edge cases', () => {
		it('does not flag x in its own initializer (TDZ not modeled in v1)', () => {
			const ast = parseSource('let x = x + 1;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'rejection' && v.message.includes("'x'"),
			);
			expect(undeclared).toHaveLength(0);
		});

		it('assignment target resolves declared variable (no unused warning)', () => {
			const ast = parseSource('let x = 1;\nx = 5;\nconsole.log(x);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const unused = violations.filter(
				(v) => v.severity === 'warning' && v.message.includes('unused'),
			);
			expect(unused).toHaveLength(0);
		});

		it('resolves identifiers in template literal interpolation', () => {
			const ast = parseSource('let x = 1;\nlet y = `${x}`;\nconsole.log(y);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('resolves identifiers in conditional expression branches', () => {
			const ast = parseSource(
				'let x = 1;\nlet y = true ? x : 2;\nconsole.log(y);',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('nested for-of loops access outer iteration variable', () => {
			const ast = parseSource(
				'for (const a of "x") {\n  for (const b of "y") {\n    console.log(a);\n    console.log(b);\n  }\n}',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('multiple reads prevent unused warning', () => {
			const ast = parseSource('let x = 1;\nconsole.log(x);\nconsole.log(x);\nconsole.log(x);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const unused = violations.filter(
				(v) => v.severity === 'warning' && v.message.includes('unused'),
			);
			expect(unused).toHaveLength(0);
		});
	});

	describe('for-of var reassigned — warnings', () => {
		it('warns when for-of iteration variable is reassigned', () => {
			const ast = parseSource(
				'for (let c of "hi") {\n\tc = "x";\n\tconsole.log(c);\n}\n',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) =>
					v.severity === 'warning' &&
					v.message.includes('iteration variable'),
			);
			expect(v).toBeDefined();
		});

		it('does not warn when for-of variable is only read', () => {
			const ast = parseSource(
				'for (const c of "hi") {\n\tlet x = c;\n\tconsole.log(x);\n}\n',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) =>
					v.severity === 'warning' &&
					v.message.includes('iteration variable'),
			);
			expect(v).toBeUndefined();
		});

		it('warns only on inner for-of in nested loops', () => {
			const ast = parseSource(
				'for (const a of "x") {\n\tfor (let b of "y") {\n\t\tb = "z";\n\t\tconsole.log(a);\n\t\tconsole.log(b);\n\t}\n}\n',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const reassignWarnings = violations.filter(
				(v) =>
					v.severity === 'warning' &&
					v.message.includes('iteration variable'),
			);
			expect(reassignWarnings).toHaveLength(1);
		});
	});

	describe('return value', () => {
		it('returns a frozen array', () => {
			const ast = parseSource('let x = 1;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(Object.isFrozen(violations)).toBe(true);
		});

		it('returns empty array for clean program', () => {
			const ast = parseSource(
				'let x = 1;\nconsole.log(x);',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(violations).toHaveLength(0);
		});
	});
});
