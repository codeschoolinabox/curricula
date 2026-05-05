/**
 * @file Integration tests verifying each YAML explanation file
 * produces a non-generic interpretation for realistic error inputs.
 */

import { describe, it, expect } from 'vitest';

import interpretError from '../interpret-error.js';

// ─── Helper ─────────────────────────────────────────────────

function expectSpecificInterpretation(
	source: string,
	error: { name: string; message: string; line?: number },
	options?: { phase?: 'parse' | 'runtime' },
): void {
	const result = interpretError(source, error, options);
	// a generic fallback contains "does not have a specific explanation"
	expect(result.whatWentWrong).not.toContain(
		'does not have a specific explanation',
	);
}

// ─── Parse errors ───────────────────────────────────────────

describe('parse error interpretations', () => {
	it('unexpected-token', () => {
		expectSpecificInterpretation(
			'let x = ;',
			{ name: 'SyntaxError', message: 'Unexpected token (1:8)', line: 1 },
			{ phase: 'parse' },
		);
	});

	it('unterminated-string', () => {
		expectSpecificInterpretation(
			"let x = 'hello;",
			{
				name: 'SyntaxError',
				message: 'Unterminated string constant (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unterminated-template', () => {
		expectSpecificInterpretation(
			'let x = `hello;',
			{
				name: 'SyntaxError',
				message: 'Unterminated template (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unterminated-regexp', () => {
		expectSpecificInterpretation(
			'let x = /hello;',
			{
				name: 'SyntaxError',
				message: 'Unterminated regular expression (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('missing-semicolon', () => {
		expectSpecificInterpretation(
			'let x = 5 let y = 10',
			{
				name: 'SyntaxError',
				message: 'Missing semicolon (1:11)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('bad-escape-sequence', () => {
		expectSpecificInterpretation(
			"let x = '\\q';",
			{
				name: 'SyntaxError',
				message: 'Bad escape sequence in untagged template literal',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('identifier-after-number', () => {
		expectSpecificInterpretation(
			'let x = 42abc;',
			{
				name: 'SyntaxError',
				message: 'Identifier directly after number (1:11)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unexpected-reserved-word', () => {
		expectSpecificInterpretation(
			'let class = 5;',
			{
				name: 'SyntaxError',
				message: "Unexpected reserved word 'class'",
				line: 1,
			},
			{ phase: 'parse' },
		);
	});
});

// ─── Runtime errors ─────────────────────────────────────────

describe('runtime error interpretations', () => {
	it('reference-error-not-defined', () => {
		expectSpecificInterpretation(
			'console.log(userName);',
			{
				name: 'ReferenceError',
				message: 'userName is not defined',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('reference-error-tdz', () => {
		expectSpecificInterpretation(
			'console.log(x);\nlet x = 5;',
			{
				name: 'ReferenceError',
				message: "Cannot access 'x' before initialization",
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-null-property', () => {
		expectSpecificInterpretation(
			"let input = prompt('name');\ninput.toLowerCase();",
			{
				name: 'TypeError',
				message: "Cannot read properties of null (reading 'toLowerCase')",
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-undefined-property', () => {
		expectSpecificInterpretation(
			'let x;\nx.length;',
			{
				name: 'TypeError',
				message: "Cannot read properties of undefined (reading 'length')",
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-not-a-function', () => {
		expectSpecificInterpretation(
			"let x = 'hello';\nx.length();",
			{
				name: 'TypeError',
				message: 'x.length is not a function',
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-const-assignment', () => {
		expectSpecificInterpretation(
			"const name = 'Alice';\nname = 'Bob';",
			{
				name: 'TypeError',
				message: 'Assignment to constant variable.',
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-invalid-count', () => {
		expectSpecificInterpretation(
			"'-'.repeat(-1);",
			{
				name: 'RangeError',
				message: 'Invalid count value: -1',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-iteration-limit', () => {
		expectSpecificInterpretation(
			'while (true) {}',
			{
				name: 'RangeError',
				message: 'loop 1 exceeded 100 iterations',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-call-stack', () => {
		expectSpecificInterpretation(
			'let x = 1;',
			{
				name: 'RangeError',
				message: 'Maximum call stack size exceeded',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('uri-error-malformed', () => {
		expectSpecificInterpretation(
			"decodeURI('%');",
			{
				name: 'URIError',
				message: 'URI malformed',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('internal-error-recursion', () => {
		expectSpecificInterpretation(
			'let x = 1;',
			{
				name: 'InternalError',
				message: 'too much recursion',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('syntax-error-runtime-regex', () => {
		expectSpecificInterpretation(
			'let re = /[/;',
			{
				name: 'SyntaxError',
				message:
					'Invalid regular expression: /[/: Unterminated character class',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});
});
