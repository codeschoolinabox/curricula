import { describe, it, expect } from 'vitest';

import validateProgram from '../validate-program.js';
import justEnoughJs from '../just-enough-js.js';

describe('integration: valid Just Enough JS programs', () => {
	it('accepts a program using all allowed features', () => {
		const source = `let greeting = "hello";
let count = 0;
let isRunning = true;

// a comment
/* block comment */

console.log(greeting);
alert("welcome");

let userInput = prompt("enter text");
let didConfirm = confirm("yes or no");

if (greeting === "hello") {
  count = count + 1;
} else if (greeting !== "bye") {
  count = count - 1;
} else {
  count = 0;
}

while (isRunning) {
  if (count >= 10) {
    break;
  }
  count = count + 1;
  if (count === 5) {
    continue;
  }
  console.log(count);
}

for (const character of "hello") {
  console.log(character);
}

let text = "Hello World";
let upper = text.toUpperCase();
let lower = text.toLowerCase();
let hasH = text.includes("H");
let cleaned = text.trim();
let idx = text.indexOf("o");
let sliced = text.slice(0, 5);
let replaced = text.replaceAll("l", "r");
let len = text.length;
let first = text[0];

let x = 4 + 2;
let y = 4 - 2;
let z = 4 * 2;
let w = 4 / 2;
let mod = 10 % 3;
let exp = 2 ** 8;
let big = 4 > 3;
let small = 4 < 5;
let gte = 4 >= 4;
let lte = 4 <= 5;
let both = true && false;
let either = true || false;
let fallback = null ?? "default";
let nope = !true;
let t = typeof "hello";
let neg = -1;
let nothing = null;
let undef = undefined;
const pi = 3.14;
let message = \`hello \${greeting}\`;
let result = isRunning ? "yes" : "no";
let maybeLen = text?.length;
let nanCheck = Number.isNaN(count);
`;
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const errors = report.violations.filter((v) => v.severity === 'error');
		expect(errors).toHaveLength(0);
	});

	it('accepts optional chaining', () => {
		const source =
			'let x = null;\nlet y = x?.length;\nconsole.log(y);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('accepts Number.isNaN()', () => {
		const source = 'let x = Number.isNaN(5);\nconsole.log(x);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});
});

describe('integration: common student mistakes', () => {
	it('catches var instead of let', () => {
		const report = validateProgram('var x = 5;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.message.includes('var'));
		expect(v).toBeDefined();
	});

	it('catches multi-declaration', () => {
		const report = validateProgram('let a = 1, b = 2;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) =>
			v.message.includes('one variable per declaration'),
		);
		expect(v).toBeDefined();
	});

	it('catches arrow functions', () => {
		const report = validateProgram('let fn = () => 5;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'ArrowFunctionExpression',
		);
		expect(v).toBeDefined();
	});

	it('catches function declarations', () => {
		const report = validateProgram('function foo() {}', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'FunctionDeclaration',
		);
		expect(v).toBeDefined();
	});

	it('catches array literals', () => {
		const report = validateProgram('let x = [1, 2, 3];', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'ArrayExpression');
		expect(v).toBeDefined();
	});

	it('catches object literals', () => {
		const report = validateProgram('let x = { a: 1 };', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'ObjectExpression');
		expect(v).toBeDefined();
	});

	it('catches classic for loop', () => {
		const report = validateProgram(
			'for (let i = 0; i < 10; i = i + 1) {}',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'ForStatement');
		expect(v).toBeDefined();
	});

	it('catches switch statement', () => {
		const report = validateProgram(
			'switch (1) { case 1: break; }',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'SwitchStatement');
		expect(v).toBeDefined();
	});

	it('catches try/catch', () => {
		const report = validateProgram(
			'try { let x = 1; } catch (e) {}',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'TryStatement');
		expect(v).toBeDefined();
	});

	it('catches ++ operator', () => {
		const report = validateProgram('let x = 0; x++;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'UpdateExpression');
		expect(v).toBeDefined();
	});

	it('catches += operator', () => {
		const report = validateProgram('let x = 0; x += 1;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'AssignmentExpression',
		);
		expect(v).toBeDefined();
	});

	it('catches braceless if', () => {
		const report = validateProgram(
			'if (true) console.log("hi");',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'IfStatement');
		expect(v).toBeDefined();
	});

	it('catches braceless while', () => {
		const report = validateProgram('while (true) break;', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'WhileStatement');
		expect(v).toBeDefined();
	});

	it('catches braceless for-of', () => {
		const report = validateProgram(
			'for (const c of "hi") console.log(c);',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'ForOfStatement');
		expect(v).toBeDefined();
	});

	it('catches disallowed property access', () => {
		const report = validateProgram(
			'let x = "hi"; let y = x.match("h");',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'MemberExpression');
		expect(v).toBeDefined();
	});

	it('catches computed method calls', () => {
		const report = validateProgram(
			'let x = "hi"; x["toLowerCase"]();',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'CallExpression');
		expect(v).toBeDefined();
	});
});

describe('integration: location accuracy', () => {
	it('reports correct line number for violations', () => {
		const source = `let x = 5;
var y = 10;`;
		const report = validateProgram(source, justEnoughJs);
		const varViolation = report.violations.find((v) =>
			v.message.includes('var'),
		);
		expect(varViolation).toBeDefined();
		expect(varViolation!.location.start.line).toBe(2);
	});
});

describe('integration: warnings', () => {
	it('for-of with let produces a warning but is still valid', () => {
		const source = `for (let c of "hello") {
  console.log(c);
}`;
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const warning = report.violations.find((v) => v.severity === 'warning');
		expect(warning).toBeDefined();
		expect(warning!.nodeType).toBe('ForOfStatement');
	});
});

describe('integration: scope analysis', () => {
	it('flags undeclared identifier as error', () => {
		const report = validateProgram('parseInt("42");', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'error' && v.message.includes('parseInt'),
		);
		expect(v).toBeDefined();
	});

	it('allows declared variable used later', () => {
		const source = 'let x = 1;\nconsole.log(x);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('allows allowed global used as value', () => {
		const source = 'let y = alert;\nconsole.log(y);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('flags identifier after block scope ends', () => {
		const source = 'if (true) { let x = 1; }\nconsole.log(x);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'error' && v.message.includes("'x'"),
		);
		expect(v).toBeDefined();
	});

	it('warns about unused variable', () => {
		const source = 'let x = 1;';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes("'x'"),
		);
		expect(v).toBeDefined();
	});

	it('warns about variable shadowing', () => {
		const source = 'let x = 1;\nif (true) { let x = 2;\nconsole.log(x); }';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('shadow'),
		);
		expect(v).toBeDefined();
	});

	it('no shadowing for sibling scopes', () => {
		const source =
			'if (true) { let x = 1;\nconsole.log(x); }\nif (true) { let x = 2;\nconsole.log(x); }';
		const report = validateProgram(source, justEnoughJs);
		const shadow = report.violations.filter(
			(v) => v.severity === 'warning' && v.message.includes('shadow'),
		);
		expect(shadow).toHaveLength(0);
	});

	it('for-of variable scoped to loop body', () => {
		const source =
			'for (const c of "hi") { console.log(c); }\nconsole.log(c);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'error' && v.message.includes("'c'"),
		);
		expect(v).toBeDefined();
	});
});

describe('integration: custom language level', () => {
	it('works with a minimal custom level', () => {
		const minimalLevel = {
			name: 'only-literals',
			nodes: {
				Program: true as const,
				ExpressionStatement: true as const,
				Literal: true as const,
			},
		};
		const report = validateProgram('"hello";', minimalLevel);
		expect(report.isValid).toBe(true);
	});

	it('rejects everything not in a custom level', () => {
		const emptyLevel = {
			name: 'nothing-allowed',
			nodes: {
				Program: true as const,
			},
		};
		const report = validateProgram('let x = 5;', emptyLevel);
		expect(report.isValid).toBe(false);
		expect(report.violations.length).toBeGreaterThan(0);
	});
});
