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
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts optional chaining', () => {
		const source =
			'let x = null;\nlet y = x?.length;\nconsole.log(y);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('accepts Number.isNaN()', () => {
		const source = 'let x = Number.isNaN(5);\nconsole.log(x);\n';
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
	it('flags undeclared identifier as rejection', () => {
		const report = validateProgram('parseInt("42");', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('parseInt'),
		);
		expect(v).toBeDefined();
	});

	it('allows declared variable used later', () => {
		const source = 'let x = 1;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('allows allowed global used as value', () => {
		const source = 'let y = alert;\nconsole.log(y);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		expect(report.violations).toHaveLength(0);
	});

	it('flags identifier after block scope ends', () => {
		const source = 'if (true) { let x = 1; }\nconsole.log(x);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes("'x'"),
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
			(v) => v.severity === 'rejection' && v.message.includes("'c'"),
		);
		expect(v).toBeDefined();
	});
});

describe('integration: allowed globals coverage', () => {
	it('accepts NaN as a value', () => {
		const source = 'let x = NaN;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts Infinity as a value', () => {
		const source = 'let x = Infinity;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts String as a value', () => {
		const source = 'let s = String;\nconsole.log(s);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts Boolean as a value', () => {
		const source = 'let b = Boolean;\nconsole.log(b);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});
});

describe('integration: allowed member names coverage', () => {
	it('accepts trimStart and trimEnd', () => {
		const source =
			'let text = " hi ";\nlet a = text.trimStart();\nlet b = text.trimEnd();\nconsole.log(a);\nconsole.log(b);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts .at()', () => {
		const source = 'let text = "hello";\nlet c = text.at(0);\nconsole.log(c);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts .concat()', () => {
		const source =
			'let text = "hello";\nlet c = text.concat(" world");\nconsole.log(c);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts .repeat()', () => {
		const source = 'let text = "ha";\nlet r = text.repeat(3);\nconsole.log(r);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts .padStart() and .padEnd()', () => {
		const source =
			'let text = "5";\nlet a = text.padStart(3, "0");\nlet b = text.padEnd(3, "0");\nconsole.log(a);\nconsole.log(b);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});

	it('accepts console.assert()', () => {
		const source = 'console.assert(true);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const rejections = report.violations.filter((v) => v.severity === 'rejection');
		expect(rejections).toHaveLength(0);
	});
});

describe('integration: disallowed globals', () => {
	it('flags Date as undeclared', () => {
		const report = validateProgram('let x = Date;\nconsole.log(x);\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('Date'),
		);
		expect(v).toBeDefined();
	});

	it('flags fetch as undeclared', () => {
		const report = validateProgram('fetch("url");\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('fetch'),
		);
		expect(v).toBeDefined();
	});

	it('flags setTimeout as undeclared', () => {
		const report = validateProgram(
			'setTimeout(alert, 1000);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('setTimeout'),
		);
		expect(v).toBeDefined();
	});

	it('flags eval as undeclared', () => {
		const report = validateProgram('eval("1 + 1");\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('eval'),
		);
		expect(v).toBeDefined();
	});

	it('flags document as undeclared', () => {
		const report = validateProgram('document;\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('document'),
		);
		expect(v).toBeDefined();
	});

	it('flags window as undeclared', () => {
		const report = validateProgram('window;\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.severity === 'rejection' && v.message.includes('window'),
		);
		expect(v).toBeDefined();
	});
});

describe('integration: disallowed methods', () => {
	it('rejects .split()', () => {
		const report = validateProgram(
			'let x = "hi";\nlet y = x.split("");\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'MemberExpression' && v.message.includes('split'),
		);
		expect(v).toBeDefined();
	});

	it('rejects .charAt()', () => {
		const report = validateProgram(
			'let x = "hi";\nlet y = x.charAt(0);\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) =>
				v.nodeType === 'MemberExpression' && v.message.includes('charAt'),
		);
		expect(v).toBeDefined();
	});

	it('rejects .search()', () => {
		const report = validateProgram(
			'let x = "hi";\nlet y = x.search("h");\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) =>
				v.nodeType === 'MemberExpression' && v.message.includes('search'),
		);
		expect(v).toBeDefined();
	});

	it('rejects .replace()', () => {
		const report = validateProgram(
			'let x = "hi";\nlet y = x.replace("h", "b");\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) =>
				v.nodeType === 'MemberExpression' && v.message.includes('replace'),
		);
		expect(v).toBeDefined();
	});

	it('rejects console.error', () => {
		const report = validateProgram('console.error("oops");\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) =>
				v.nodeType === 'MemberExpression' && v.message.includes('error'),
		);
		expect(v).toBeDefined();
	});
});

describe('integration: disallowed operators', () => {
	it('rejects -- operator', () => {
		const report = validateProgram('let x = 1;\nx--;\n', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find((v) => v.nodeType === 'UpdateExpression');
		expect(v).toBeDefined();
	});

	it('rejects >> operator', () => {
		const report = validateProgram(
			'let x = 8;\nlet y = x >> 1;\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'BinaryExpression' && v.message.includes('>>'),
		);
		expect(v).toBeDefined();
	});

	it('rejects & operator', () => {
		const report = validateProgram(
			'let x = 5;\nlet y = x & 3;\nconsole.log(y);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'BinaryExpression' && v.message.includes("'&'"),
		);
		expect(v).toBeDefined();
	});

	it('rejects **= operator', () => {
		const report = validateProgram(
			'let x = 2;\nx **= 3;\nconsole.log(x);\n',
			justEnoughJs,
		);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) =>
				v.nodeType === 'AssignmentExpression' &&
				v.message.includes('**='),
		);
		expect(v).toBeDefined();
	});
});

describe('integration: disallowed declarations', () => {
	it('rejects class declaration', () => {
		const report = validateProgram('class Foo {}', justEnoughJs);
		expect(report.isValid).toBe(false);
		const v = report.violations.find(
			(v) => v.nodeType === 'ClassDeclaration',
		);
		expect(v).toBeDefined();
	});
});

describe('integration: warning types through pipeline', () => {
	it('use strict produces warning', () => {
		const source = '"use strict";\nlet x = 1;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('use strict'),
		);
		expect(v).toBeDefined();
	});

	it('unused expression produces warning', () => {
		const source = 'let x = 1;\n5;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('not used'),
		);
		expect(v).toBeDefined();
	});

	it('non-camelCase name produces warning', () => {
		const source = 'let my_var = 1;\nconsole.log(my_var);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('camelCase'),
		);
		expect(v).toBeDefined();
	});

	it('empty block produces warning', () => {
		const source = 'if (true) {}\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('Empty block'),
		);
		expect(v).toBeDefined();
	});

	it('assignment in condition produces warning', () => {
		const source = 'let x = 1;\nif (x = 5) { console.log(x); }\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('Assignment'),
		);
		expect(v).toBeDefined();
	});

	it('unreachable code produces warning', () => {
		const source = 'while (true) {\n\tbreak;\n\tconsole.log("nope");\n}\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('Unreachable'),
		);
		expect(v).toBeDefined();
	});

	it('missing semicolon produces warning', () => {
		const source = 'let x = 1\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('semicolon'),
		);
		expect(v).toBeDefined();
	});

	it('unnecessary semicolon produces warning', () => {
		const source = 'let x = 1;;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) =>
				v.severity === 'warning' &&
				v.message.includes('Unnecessary semicolon'),
		);
		expect(v).toBeDefined();
	});

	it('tabs not spaces produces warning', () => {
		const source = '  let x = 1;\nconsole.log(x);\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('tab'),
		);
		expect(v).toBeDefined();
	});

	it('missing trailing newline produces warning', () => {
		const source = 'let x = 1;\nconsole.log(x);';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('newline'),
		);
		expect(v).toBeDefined();
	});

	it('for-of var reassigned produces warning', () => {
		const source =
			'for (let c of "hi") {\n\tc = "x";\n\tconsole.log(c);\n}\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) =>
				v.severity === 'warning' &&
				v.message.includes('iteration variable'),
		);
		expect(v).toBeDefined();
	});

	it('variable shadowing produces warning', () => {
		const source =
			'let x = 1;\nif (true) {\n\tlet x = 2;\n\tconsole.log(x);\n}\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('shadow'),
		);
		expect(v).toBeDefined();
	});

	it('unused variable produces warning', () => {
		const source = 'let x = 1;\nconsole.log("hi");\n';
		const report = validateProgram(source, justEnoughJs);
		expect(report.isValid).toBe(true);
		const v = report.violations.find(
			(v) => v.severity === 'warning' && v.message.includes('never used'),
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
