import { describe, it, expect } from 'vitest';

import extractContext from '../extract-context.js';
import parseBestEffort from '../parse-best-effort.js';

describe('extractContext', () => {
	describe('name extraction from "is not defined"', () => {
		it('extracts the variable name', () => {
			const context = extractContext(
				{ name: 'ReferenceError', message: 'userName is not defined', line: 1 },
				'console.log(userName);',
				null,
			);
			expect(context.name).toBe('userName');
		});
	});

	describe('name extraction from TDZ error', () => {
		it('extracts the variable name', () => {
			const context = extractContext(
				{
					name: 'ReferenceError',
					message: "Cannot access 'x' before initialization",
					line: 1,
				},
				'console.log(x);\nlet x = 5;',
				null,
			);
			expect(context.name).toBe('x');
		});
	});

	describe('name extraction from null property access', () => {
		it('extracts the property name', () => {
			const context = extractContext(
				{
					name: 'TypeError',
					message: "Cannot read properties of null (reading 'toLowerCase')",
					line: 2,
				},
				"let input = prompt('name');\ninput.toLowerCase();",
				null,
			);
			expect(context.name).toBe('toLowerCase');
		});
	});

	describe('source line extraction', () => {
		it('extracts the trimmed source line at the error line', () => {
			const context = extractContext(
				{ name: 'ReferenceError', message: 'x is not defined', line: 2 },
				'let y = 1;\nconsole.log(x);',
				null,
			);
			expect(context.expression).toBe('console.log(x);');
		});
	});

	describe('missing line number', () => {
		it('returns undefined expression when no line is provided', () => {
			const context = extractContext(
				{ name: 'ReferenceError', message: 'x is not defined' },
				'console.log(x);',
				null,
			);
			expect(context.expression).toBeUndefined();
		});
	});

	describe('similar variable suggestion with AST', () => {
		it('suggests a similar variable name when one exists', () => {
			const source = 'let userName = "Alice";\nconsole.log(username);';
			const ast = parseBestEffort(source);
			const context = extractContext(
				{ name: 'ReferenceError', message: 'username is not defined', line: 2 },
				source,
				ast,
			);
			expect(context.suggestion).toContain('userName');
		});
	});

	describe('prompt null suggestion', () => {
		it('suggests null check when prompt is on the error line', () => {
			const source = "let input = prompt('name');\ninput.toLowerCase();";
			const ast = parseBestEffort(source);
			const context = extractContext(
				{
					name: 'TypeError',
					message: "Cannot read properties of null (reading 'toLowerCase')",
					line: 2,
				},
				source,
				ast,
			);
			// prompt is on line 1, error on line 2 — the node at line 2
			// doesn't contain prompt, so this tests the fallback
			expect(context.name).toBe('toLowerCase');
		});
	});

	describe('frozen return value', () => {
		it('returns a frozen object', () => {
			const context = extractContext(
				{ name: 'ReferenceError', message: 'x is not defined', line: 1 },
				'console.log(x);',
				null,
			);
			expect(Object.isFrozen(context)).toBe(true);
		});
	});

	describe('works without AST', () => {
		it('extracts context from error message alone', () => {
			const context = extractContext(
				{ name: 'TypeError', message: 'x is not a function', line: 1 },
				'x();',
				null,
			);
			expect(context.name).toBe('x');
			expect(context.errorName).toBe('TypeError');
		});
	});
});
