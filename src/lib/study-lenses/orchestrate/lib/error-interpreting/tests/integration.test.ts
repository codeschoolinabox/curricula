/**
 * @file Integration tests verifying each YAML explanation file
 * produces a non-generic interpretation for realistic error inputs.
 *
 * Step 7 sweep: rewritten to take an embodiment instead of a raw
 * source string. Fixture choice by `phase`: parse-phase tests use
 * `embody('FAIL_AT_PARSE')` (status: tokenized:T parsed:F created:F);
 * runtime-phase tests use `embody('OK')` (apex; runtime errors fire
 * post-evaluation against an apex-status snippet). The original
 * source strings are retained as `// source:` comments above each
 * call so the suite still documents the real JEJ scenarios each
 * pattern was authored to interpret.
 */

import { describe, it, expect } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import interpretError from '../interpret-error.js';

// ─── Helper ─────────────────────────────────────────────────

function expectSpecificInterpretation(
	embodiment: Snippet,
	error: { name: string; message: string; line?: number },
	options?: { phase?: 'parse' | 'runtime' },
): void {
	const result = interpretError(embodiment, error, options);
	// a generic fallback contains "does not have a specific explanation"
	expect(result.whatWentWrong).not.toContain(
		'does not have a specific explanation',
	);
}

// ─── Parse errors ───────────────────────────────────────────

describe('parse error interpretations', () => {
	it('unexpected-token', () => {
		// source: 'let x = ;'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{ name: 'SyntaxError', message: 'Unexpected token (1:8)', line: 1 },
			{ phase: 'parse' },
		);
	});

	it('unterminated-string', () => {
		// source: "let x = 'hello;"
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Unterminated string constant (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unterminated-template', () => {
		// source: 'let x = `hello;'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Unterminated template (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unterminated-regexp', () => {
		// source: 'let x = /hello;'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Unterminated regular expression (1:8)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('missing-semicolon', () => {
		// source: 'let x = 5 let y = 10'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Missing semicolon (1:11)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('bad-escape-sequence', () => {
		// source: "let x = '\\q';"
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Bad escape sequence in untagged template literal',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('identifier-after-number', () => {
		// source: 'let x = 42abc;'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
			{
				name: 'SyntaxError',
				message: 'Identifier directly after number (1:11)',
				line: 1,
			},
			{ phase: 'parse' },
		);
	});

	it('unexpected-reserved-word', () => {
		// source: 'let class = 5;'
		expectSpecificInterpretation(
			embody('FAIL_AT_PARSE'),
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
		// source: 'console.log(userName);'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'ReferenceError',
				message: 'userName is not defined',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('reference-error-tdz', () => {
		// source: 'console.log(x);\nlet x = 5;'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'ReferenceError',
				message: "Cannot access 'x' before initialization",
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-null-property', () => {
		// source: "let input = prompt('name');\ninput.toLowerCase();"
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'TypeError',
				message: "Cannot read properties of null (reading 'toLowerCase')",
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-undefined-property', () => {
		// source: 'let x;\nx.length;'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'TypeError',
				message: "Cannot read properties of undefined (reading 'length')",
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-not-a-function', () => {
		// source: "let x = 'hello';\nx.length();"
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'TypeError',
				message: 'x.length is not a function',
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('type-error-const-assignment', () => {
		// source: "const name = 'Alice';\nname = 'Bob';"
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'TypeError',
				message: 'Assignment to constant variable.',
				line: 2,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-invalid-count', () => {
		// source: "'-'.repeat(-1);"
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'RangeError',
				message: 'Invalid count value: -1',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-iteration-limit', () => {
		// source: 'while (true) {}'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'RangeError',
				message: 'loop 1 exceeded 100 iterations',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('range-error-call-stack', () => {
		// source: 'let x = 1;'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'RangeError',
				message: 'Maximum call stack size exceeded',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('uri-error-malformed', () => {
		// source: "decodeURI('%');"
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'URIError',
				message: 'URI malformed',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('internal-error-recursion', () => {
		// source: 'let x = 1;'
		expectSpecificInterpretation(
			embody('OK'),
			{
				name: 'InternalError',
				message: 'too much recursion',
				line: 1,
			},
			{ phase: 'runtime' },
		);
	});

	it('syntax-error-runtime-regex', () => {
		// source: 'let re = /[/;'
		expectSpecificInterpretation(
			embody('OK'),
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
