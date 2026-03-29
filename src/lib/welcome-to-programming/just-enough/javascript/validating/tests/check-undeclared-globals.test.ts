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

function parseSourceScript(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'script',
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
	describe('disallowed globals — rejections', () => {
		it('rejects known global not in allowedGlobals', () => {
			const ast = parseSource('parseInt("42");');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('parseInt'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('rejection');
			expect(v!.message).toContain('not available at this language level');
		});

		it('rejects Math', () => {
			const ast = parseSource('Math;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('Math'));
			expect(v).toBeDefined();
		});

		it('rejects Date', () => {
			const ast = parseSource('Date;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('Date'));
			expect(v).toBeDefined();
		});

		it('rejects document', () => {
			const ast = parseSource('document;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('document'));
			expect(v).toBeDefined();
		});

		it('rejects fetch', () => {
			const ast = parseSource('fetch;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('fetch'));
			expect(v).toBeDefined();
		});

		it('rejects setTimeout', () => {
			const ast = parseSource('setTimeout;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find((v) => v.message.includes('setTimeout'));
			expect(v).toBeDefined();
		});
	});

	describe('allowed globals — no rejection', () => {
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

	describe('unknown identifiers — no rejection (runtime catches)', () => {
		it('does not reject unknown identifier (typo)', () => {
			const ast = parseSource('xyzNotAThing;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(violations).toHaveLength(0);
		});

		it('does not reject identifier after block scope ends', () => {
			const ast = parseSource('if (true) { let x = 1; }\nx;');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(violations).toHaveLength(0);
		});
	});

	describe('user declarations shadow known globals', () => {
		it('allows user-declared Math', () => {
			const ast = parseSource('let Math = 5;\nconsole.log(Math);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(violations).toHaveLength(0);
		});

		it('allows user-declared Array', () => {
			const ast = parseSource('let Array = "test";\nconsole.log(Array);');
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			expect(violations).toHaveLength(0);
		});
	});

	describe('scope boundaries', () => {
		it('nested scopes can access outer declarations', () => {
			const ast = parseSource(
				'let outer = 1;\nif (true) { console.log(outer); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter((v) => v.severity === 'rejection');
			expect(undeclared).toHaveLength(0);
		});

		it('for-of iteration variable is scoped to the loop', () => {
			// WHY: c is not a known global, so it won't be rejected after the loop.
			// But a known global declared inside for-of IS scoped to the loop.
			const ast = parseSource(
				'for (const Date of "hi") { console.log(Date); }\nDate;',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const dateViolations = violations.filter(
				(v) => v.message.includes("'Date'"),
			);
			// WHY: exactly 1 — only the Date AFTER the loop, not inside
			expect(dateViolations).toHaveLength(1);
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

	});

	describe('with statement — scope suppression', () => {
		it('does not reject known global inside with body', () => {
			const ast = parseSourceScript(
				'with ({}) { Map; }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes("'Map'"),
			);
			expect(v).toBeUndefined();
		});

		it('does not flag deeply nested identifiers inside with body', () => {
			const ast = parseSourceScript(
				'with ({}) { if (true) { JSON; } }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes("'JSON'"),
			);
			expect(v).toBeUndefined();
		});

		it('still rejects known globals outside with body', () => {
			const ast = parseSourceScript(
				'with ({}) { console.log("hi"); }\nMath;',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes("'Math'"),
			);
			expect(v).toBeDefined();
		});

		it('does not reject known global inside with body', () => {
			const ast = parseSourceScript(
				'with ({}) { Math.random(); }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const v = violations.find(
				(v) => v.severity === 'rejection' && v.message.includes("'Math'"),
			);
			expect(v).toBeUndefined();
		});

		it('does not flag identifiers inside nested with', () => {
			const ast = parseSourceScript(
				'with ({}) { with ({}) { console.log(x); } }',
			);
			const violations = checkUndeclaredGlobals(ast, ALLOWED_GLOBALS);
			const undeclared = violations.filter(
				(v) => v.severity === 'rejection' && v.message.includes("'x'"),
			);
			expect(undeclared).toHaveLength(0);
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
