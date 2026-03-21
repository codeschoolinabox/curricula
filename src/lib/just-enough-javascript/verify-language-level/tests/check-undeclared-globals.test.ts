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
	describe('undeclared globals — errors', () => {
		it('flags an undeclared identifier', () => {
			const ast = parseSource('x;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('x'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('error');
		});

		it('flags parseInt as undeclared', () => {
			const ast = parseSource('parseInt("42");');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('parseInt'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('error');
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
				(v) => v.severity === 'error' && v.message.includes('x'),
			);
			expect(v).toBeDefined();
		});

		it('does not flag declared variables', () => {
			const ast = parseSource('let x = 1;\nx;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag allowed globals', () => {
			const ast = parseSource('console.log("hi");');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag allowed global used as value', () => {
			const ast = parseSource('let x = alert;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag undefined as undeclared', () => {
			const ast = parseSource('let x = undefined;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag for-of iteration variable inside loop body', () => {
			const ast = parseSource('for (const c of "hi") { c; }');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag MemberExpression property names as undeclared', () => {
			const ast = parseSource('let x = "hi";\nx.length;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'error' && v.message.includes('length'),
			);
			expect(undeclared).toHaveLength(0);
		});

		it('does not flag VariableDeclarator id as a reference', () => {
			const ast = parseSource('let foo = 1;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'error' && v.message.includes('foo'),
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
				(v) => v.severity === 'error' && v.message.includes('inner'),
			);
			expect(v).toBeDefined();
		});

		it('nested scopes can access outer declarations', () => {
			const ast = parseSource(
				'let outer = 1;\nif (true) { console.log(outer); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'error');
			expect(undeclared).toHaveLength(0);
		});

		it('for-of iteration variable is scoped to the loop', () => {
			const ast = parseSource(
				'for (const c of "hi") { console.log(c); }\nc;',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'error' && v.message.includes("'c'"),
			);
			expect(v).toBeDefined();
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
