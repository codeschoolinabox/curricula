import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Program } from 'acorn';

import collectViolations from '../collect-violations.js';
import justEnoughJs from '../just-enough-js.js';

function parseToAst(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		locations: true,
	});
}

describe('collectViolations', () => {
	describe('valid programs produce no violations', () => {
		it('returns empty array for a use-strict directive', () => {
			const ast = parseToAst('"use strict";');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(violations).toHaveLength(0);
		});

		it('returns empty array for let declaration', () => {
			const ast = parseToAst('let x = 5;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(violations).toHaveLength(0);
		});

		it('returns empty array for allowed binary operators', () => {
			const ast = parseToAst('let x = 4 + 2;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(violations).toHaveLength(0);
		});
	});

	describe('disallowed node types produce violations', () => {
		it('flags var declaration', () => {
			const ast = parseToAst('var x = 5;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(violations).toHaveLength(1);
			expect(violations[0].nodeType).toBe('VariableDeclaration');
			expect(violations[0].message).toContain('var');
		});

		it('flags FunctionDeclaration (not in allowlist)', () => {
			const ast = parseToAst('function foo() {}');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			const funcViolation = violations.find(
				(v) => v.nodeType === 'FunctionDeclaration',
			);
			expect(funcViolation).toBeDefined();
		});

		it('flags += assignment operator', () => {
			const ast = parseToAst('let x = 5; x += 1;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			const assignViolation = violations.find(
				(v) => v.nodeType === 'AssignmentExpression',
			);
			expect(assignViolation).toBeDefined();
			expect(assignViolation!.message).toContain('+=');
		});
	});

	describe('collects multiple violations', () => {
		it('finds all violations in a program with several issues', () => {
			const ast = parseToAst('var x = 5; var y = 10;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(violations.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('traverses nested structures', () => {
		it('finds violations inside if bodies', () => {
			const ast = parseToAst('if (true) { var x = 1; }');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			const varViolation = violations.find((v) => v.message.includes('var'));
			expect(varViolation).toBeDefined();
		});

		it('finds violations inside while loops', () => {
			const ast = parseToAst('while (true) { var i = 0; }');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			const varViolation = violations.find((v) => v.message.includes('var'));
			expect(varViolation).toBeDefined();
		});
	});

	describe('false rule explicitly forbids a node type', () => {
		it('produces a violation for a node with false rule', () => {
			const ast = parseToAst('let x = 5;');
			const noLetLevel = {
				...justEnoughJs.nodes,
				VariableDeclaration: false as const,
			};
			const violations = collectViolations(ast, noLetLevel);
			const forbidden = violations.find(
				(v) => v.nodeType === 'VariableDeclaration',
			);
			expect(forbidden).toBeDefined();
			expect(forbidden!.message).toContain('explicitly forbidden');
		});
	});

	describe('true rule unconditionally allows a node type', () => {
		it('produces no violation for a node with true rule', () => {
			const ast = parseToAst('let x = 5;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			const identViolation = violations.find(
				(v) => v.nodeType === 'Identifier',
			);
			expect(identViolation).toBeUndefined();
		});
	});

	describe('returned array is frozen', () => {
		it('returns a frozen array', () => {
			const ast = parseToAst('let x = 5;');
			const violations = collectViolations(ast, justEnoughJs.nodes);
			expect(Object.isFrozen(violations)).toBe(true);
		});
	});
});
