import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import collectWarnings from '../collect-warnings.js';

// -- helper: parse source to AST --
function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

describe('collectWarnings', () => {
	describe("'use strict' directive", () => {
		it('warns about use strict directive', () => {
			const source = '"use strict";\nlet x = 1;\nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('use strict'));
			expect(v).toBeDefined();
			expect(v!.severity).toBe('warning');
		});

		it('does not warn when no use strict', () => {
			const source = 'let x = 1;\nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('use strict'));
			expect(v).toBeUndefined();
		});
	});

	describe('unused expression', () => {
		it('warns about a bare literal expression', () => {
			const source = '5;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeDefined();
		});

		it('warns about a bare binary expression', () => {
			const source = 'let x = 1;\nx + 1;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeDefined();
		});

		it('warns about a bare member expression', () => {
			const source = 'let x = "hi";\nx.length;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeDefined();
		});

		it('warns about typeof used as statement', () => {
			const source = 'let x = 1;\ntypeof x;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeDefined();
		});

		it('does not warn about function calls', () => {
			const source = 'console.log("hi");';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeUndefined();
		});

		it('does not warn about assignment expressions', () => {
			const source = 'let x = 1;\nx = 5;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeUndefined();
		});

		it('does not warn about bare identifier calls', () => {
			const source = 'alert("hi");';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('not used'));
			expect(v).toBeUndefined();
		});
	});

	describe('camelCase naming', () => {
		it('warns about snake_case variable', () => {
			const source = 'let my_var = 1;\nconsole.log(my_var);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('camelCase'));
			expect(v).toBeDefined();
		});

		it('warns about UPPER_CASE variable', () => {
			const source = 'let MY_CONST = 1;\nconsole.log(MY_CONST);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('camelCase'));
			expect(v).toBeDefined();
		});

		it('does not warn about camelCase variable', () => {
			const source = 'let myVar = 1;\nconsole.log(myVar);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('camelCase'));
			expect(v).toBeUndefined();
		});

		it('does not warn about single-letter variable', () => {
			const source = 'let x = 1;\nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('camelCase'));
			expect(v).toBeUndefined();
		});
	});

	describe('empty blocks', () => {
		it('warns about empty if block', () => {
			const source = 'if (true) {}';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Empty block'));
			expect(v).toBeDefined();
		});

		it('warns about empty while block', () => {
			const source = 'while (false) {}';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Empty block'));
			expect(v).toBeDefined();
		});

		it('does not warn about non-empty block', () => {
			const source = 'if (true) { console.log("hi"); }';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Empty block'));
			expect(v).toBeUndefined();
		});
	});

	describe('assignment in condition', () => {
		it('warns about assignment in if condition', () => {
			const source = 'let x = 1;\nif (x = 5) { console.log(x); }';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Assignment'));
			expect(v).toBeDefined();
		});

		it('warns about assignment in while condition', () => {
			const source = 'let x = 1;\nwhile (x = 0) { console.log(x); }';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Assignment'));
			expect(v).toBeDefined();
		});

		it('does not warn about comparison in condition', () => {
			const source = 'let x = 1;\nif (x === 5) { console.log(x); }';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Assignment'));
			expect(v).toBeUndefined();
		});
	});

	describe('unreachable code', () => {
		it('warns about code after break', () => {
			const source =
				'while (true) {\n  break;\n  console.log("unreachable");\n}';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Unreachable'));
			expect(v).toBeDefined();
		});

		it('warns about code after continue', () => {
			const source =
				'while (true) {\n  continue;\n  console.log("unreachable");\n}';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Unreachable'));
			expect(v).toBeDefined();
		});

		it('does not warn when break is last statement', () => {
			const source = 'while (true) {\n  console.log("hi");\n  break;\n}';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('Unreachable'));
			expect(v).toBeUndefined();
		});
	});

	describe('tabs not spaces', () => {
		it('warns about leading spaces', () => {
			const source = '  let x = 1;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('tab'));
			expect(v).toBeDefined();
		});

		it('does not warn about tab indentation', () => {
			const source = '\tlet x = 1;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('tab'));
			expect(v).toBeUndefined();
		});

		it('does not warn about blank lines', () => {
			const source = 'let x = 1;\n\nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('tab'));
			expect(v).toBeUndefined();
		});

		it('does not warn about whitespace-only lines', () => {
			const source = 'let x = 1;\n   \nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('tab'));
			expect(v).toBeUndefined();
		});
	});

	describe('trailing newline', () => {
		it('warns when source has no trailing newline', () => {
			const source = 'let x = 1;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('newline'));
			expect(v).toBeDefined();
		});

		it('warns when source has multiple trailing newlines', () => {
			const source = 'let x = 1;\n\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('newline'));
			expect(v).toBeDefined();
		});

		it('does not warn when source ends with exactly one newline', () => {
			const source = 'let x = 1;\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('newline'));
			expect(v).toBeUndefined();
		});

		it('does not warn for empty source', () => {
			const source = '';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('newline'));
			expect(v).toBeUndefined();
		});
	});

	describe('missing semicolons', () => {
		it('warns about missing semicolon on variable declaration', () => {
			const source = 'let x = 1\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) => w.message.includes('semicolon'));
			expect(v).toBeDefined();
		});

		it('does not warn when semicolon is present', () => {
			const source = 'let x = 1;\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find(
				(w) =>
					w.message.includes('semicolon') &&
					w.message.includes('Missing'),
			);
			expect(v).toBeUndefined();
		});

		it('does not warn about if/while/for-of (block-bodied)', () => {
			const source = 'if (true) {}\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find(
				(w) =>
					w.message.includes('semicolon') &&
					w.message.includes('Missing'),
			);
			expect(v).toBeUndefined();
		});

		it('warns about missing semicolon on expression statement', () => {
			const source = 'let x = 1;\nx = 5\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find(
				(w) =>
					w.message.includes('semicolon') &&
					w.message.includes('Missing'),
			);
			expect(v).toBeDefined();
		});

		it('warns about missing semicolon on break statement', () => {
			const source = 'while (true) {\n\tbreak\n}\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find(
				(w) =>
					w.message.includes('semicolon') &&
					w.message.includes('Missing'),
			);
			expect(v).toBeDefined();
		});
	});

	describe('unnecessary semicolons', () => {
		it('warns about EmptyStatement', () => {
			const source = 'let x = 1;;\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) =>
				w.message.includes('Unnecessary semicolon'),
			);
			expect(v).toBeDefined();
		});

		it('warns about semicolon after if block', () => {
			const source = 'if (true) {};\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) =>
				w.message.includes('Unnecessary semicolon'),
			);
			expect(v).toBeDefined();
		});

		it('warns about semicolon after while block', () => {
			const source = 'while (false) {};\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) =>
				w.message.includes('Unnecessary semicolon'),
			);
			expect(v).toBeDefined();
		});

		it('does not warn about normal semicolons', () => {
			const source = 'let x = 1;\nconsole.log(x);\n';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			const v = warnings.find((w) =>
				w.message.includes('Unnecessary semicolon'),
			);
			expect(v).toBeUndefined();
		});
	});

	describe('return value', () => {
		it('returns a frozen array', () => {
			const source = 'let x = 1;\nconsole.log(x);';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			expect(Object.isFrozen(warnings)).toBe(true);
		});

		it('all violations have warning severity', () => {
			const source = '  5;';
			const ast = parseSource(source);
			const warnings = collectWarnings(ast, source);
			for (const w of warnings) {
				expect(w.severity).toBe('warning');
			}
		});
	});
});
