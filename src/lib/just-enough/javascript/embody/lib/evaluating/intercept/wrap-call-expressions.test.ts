import { describe, it, expect } from 'vitest';

import parseProgram from '../../parse-old/parse-program.js';
import wrapCallExpressions from './wrap-call-expressions.js';
import HELPER_NAME from './wrap-helper-name.js';

function parseAndWrap(source: string): string {
	const program = parseProgram(source, 'module');
	if ('message' in program) {
		throw new Error(`fixture failed to parse: ${program.message}`);
	}
	return wrapCallExpressions(program, source);
}

describe('wrapCallExpressions', () => {
	describe('direct call', () => {
		it('wraps a single console.log call with the right nodePath', () => {
			const out = parseAndWrap('console.log(1);');
			// Single statement → ExpressionStatement → CallExpression at body.0.expression
			expect(out).toBe(
				`${HELPER_NAME}("$.body.0.expression", () => console.log(1));`,
			);
		});

		it('wraps a prompt call', () => {
			const out = parseAndWrap('prompt("?");');
			expect(out).toBe(
				`${HELPER_NAME}("$.body.0.expression", () => prompt("?"));`,
			);
		});
	});

	describe('multiple calls on same line', () => {
		it('wraps each call independently with distinct paths', () => {
			// `let x = console.log(1);` — VariableDeclaration with init = CallExpression
			const out = parseAndWrap('let x = console.log(1);');
			expect(out).toBe(
				`let x = ${HELPER_NAME}("$.body.0.declarations.0.init", () => console.log(1));`,
			);
		});
	});

	describe('nested calls', () => {
		it('wraps both outer and inner calls; inner call is verbatim inside outer arrow', () => {
			const out = parseAndWrap('console.log(prompt("?"));');
			// Outer: $.body.0.expression. Inner prompt: $.body.0.expression.arguments.0
			// Inner is rewritten first (right-to-left), then outer wraps the rewritten inner.
			expect(out).toBe(
				`${HELPER_NAME}("$.body.0.expression", () => console.log(${HELPER_NAME}("$.body.0.expression.arguments.0", () => prompt("?"))));`,
			);
		});
	});

	describe('lines preserved', () => {
		it('keeps the same number of newlines as input', () => {
			const input = ['console.log(1);', 'console.log(2);', 'console.log(3);', ''].join('\n');
			const out = parseAndWrap(input);
			const inLines = input.split('\n').length;
			const outLines = out.split('\n').length;
			expect(outLines).toBe(inLines);
		});

		it('each rewritten call stays on its original line', () => {
			const input = 'console.log(1);\nconsole.log(2);\n';
			const out = parseAndWrap(input);
			const lines = out.split('\n');
			// Line 1 (1-indexed → index 0) should contain the first call's wrap
			expect(lines[0]).toContain('"$.body.0.expression"');
			expect(lines[1]).toContain('"$.body.1.expression"');
		});
	});

	describe('non-trap calls are wrapped too (harmless)', () => {
		it('wraps Math.random()', () => {
			const out = parseAndWrap('let x = Math.random();');
			expect(out).toContain(`${HELPER_NAME}(`);
			expect(out).toContain('Math.random()');
		});

		it('wraps String method calls', () => {
			const out = parseAndWrap('let s = "hi".toUpperCase();');
			expect(out).toContain(`${HELPER_NAME}(`);
			expect(out).toContain('"hi".toUpperCase()');
		});
	});

	describe('calls inside control-flow', () => {
		it('wraps a call inside an if block', () => {
			const out = parseAndWrap('if (true) {\n\tconsole.log(1);\n}');
			// CallExpression nodePath is $.body.0.consequent.body.0.expression
			expect(out).toContain('"$.body.0.consequent.body.0.expression"');
		});

		it('wraps a call inside a while loop body', () => {
			const out = parseAndWrap('let i = 0;\nwhile (i < 3) {\n\tconsole.log(i);\n\ti = i + 1;\n}');
			// CallExpression in body.1.body.body.0.expression
			expect(out).toContain('console.log(i)');
			expect(out).toContain(`${HELPER_NAME}(`);
		});
	});

	describe('source with no calls', () => {
		it('returns the source unchanged', () => {
			const input = 'let x = 1 + 2;\nlet y = x * 3;\n';
			expect(parseAndWrap(input)).toBe(input);
		});

		it('returns empty string unchanged', () => {
			expect(parseAndWrap('')).toBe('');
		});
	});

	describe('this-binding preservation (verbatim arrow body)', () => {
		it('keeps obj.method() intact inside the arrow', () => {
			const out = parseAndWrap('"hi".toUpperCase();');
			// The wrap puts () => "hi".toUpperCase() — the receiver is preserved.
			expect(out).toContain('() => "hi".toUpperCase()');
		});
	});
});
