// cspell:ignore quasis

import { parse, type Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import collectViolations from '../collect-violations.js';
import PARSE_SETTINGS from '../parse-settings.js';

function programOf(source: string): Program {
	return parse(source, { ...PARSE_SETTINGS, sourceType: 'module' });
}

describe('collectViolations', () => {
	describe('an empty program', () => {
		it('yields no violations under a table admitting the envelope', () => {
			const program = programOf('');
			const violations = collectViolations(program, { Program: true });
			expect(violations).toEqual([]);
		});

		it('yields exactly one violation under a table admitting nothing', () => {
			const program = programOf('');
			const violations = collectViolations(program, {});
			expect(violations).toHaveLength(1);
		});

		it('refuses the program envelope itself', () => {
			const program = programOf('');
			const violations = collectViolations(program, {});
			expect(violations[0].nodePath).toBe('$');
		});
	});

	describe('a program the allowlist fully admits', () => {
		it('produces no violations', () => {
			const program = programOf('x;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				Identifier: true,
			});
			expect(violations).toEqual([]);
		});
	});

	describe('a node type absent from the allowlist is refused', () => {
		it('produces exactly one violation', () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations).toHaveLength(1);
		});

		it('names the refused node type', () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations[0].nodeType).toBe('Literal');
		});

		it('carries the default-deny message for the node type', () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations[0].message).toBe(
				"'Literal' isn't in the admitted syntax",
			);
		});

		it("carries the node's own character offsets", () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations[0].location).toEqual({ start: 0, end: 2 });
		});

		it("carries the node's Program-rooted path", () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations[0].nodePath).toBe('$.body.0.expression');
		});
	});

	describe('collects every violation across sibling statements', () => {
		it('two refused nodes produce two violations in traversal order', () => {
			const program = programOf('42; 43;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.0.expression',
				'$.body.1.expression',
			]);
		});
	});

	describe('traversal order is property order, not source order', () => {
		it('a template literal reports its interpolation before its text chunks', () => {
			// PINNED(Phase-0 2437801d: the walk publishes the order it delivers —
			// a template literal enumerates expressions before quasis, so offsets
			// run 4, 1, 6; a consumer needing source order sorts by offset itself)
			const program = programOf('`a${b}c`;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				TemplateLiteral: true,
			});
			expect(
				violations.map((violation) => ({
					path: violation.nodePath,
					start: violation.location.start,
				})),
			).toEqual([
				{ path: '$.body.0.expression.expressions.0', start: 4 },
				{ path: '$.body.0.expression.quasis.0', start: 1 },
				{ path: '$.body.0.expression.quasis.1', start: 6 },
			]);
		});
	});

	describe('the walk is complete, never first-hit', () => {
		it("a violating parent's child is still screened and reported", () => {
			// PINNED(Phase-0 2437801d: completeness is carried by this test, never
			// by a guard — a first-hit walk under-reports silently, and a violation
			// count quietly stops meaning what consumers read it as)
			const program = programOf('{ 42; }');
			const violations = collectViolations(program, {
				Program: true,
				BlockStatement: true,
			});
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.0.body.0',
				'$.body.0.body.0.expression',
			]);
		});

		it('a deep violation precedes a later shallow one (depth-first)', () => {
			const program = programOf('{ 42; } 43;');
			const violations = collectViolations(program, {
				Program: true,
				BlockStatement: true,
				ExpressionStatement: true,
			});
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.0.body.0.expression',
				'$.body.1.expression',
			]);
		});
	});

	describe('path segments mirror the tree shape', () => {
		it('a violation in the second statement carries the array index', () => {
			const program = programOf('x; 42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				Identifier: true,
			});
			expect(violations[0].nodePath).toBe('$.body.1.expression');
		});

		it('an array segment under an object segment keeps both', () => {
			const program = programOf('foo(1);');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				CallExpression: true,
				Identifier: true,
			});
			expect(violations[0].nodePath).toBe('$.body.0.expression.arguments.0');
		});
	});

	describe('the answer is frozen', () => {
		it('the returned array is frozen', () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(Object.isFrozen(violations)).toBe(true);
		});

		it('each violation is frozen', () => {
			const program = programOf('42;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
			});
			expect(Object.isFrozen(violations[0])).toBe(true);
		});
	});

	describe('a conditional rule decides one node at a time', () => {
		it("a check's refusal message is the violation's message", () => {
			const program = programOf('abcdef;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				Identifier: (node) =>
					node.end - node.start > 3
						? 'names longer than 3 characters are outside this fixture'
						: true,
			});
			expect(violations[0].message).toBe(
				'names longer than 3 characters are outside this fixture',
			);
		});

		it('a check answering true admits the node', () => {
			const program = programOf('abc;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				Identifier: (node) =>
					node.end - node.start > 3
						? 'names longer than 3 characters are outside this fixture'
						: true,
			});
			expect(violations).toEqual([]);
		});

		it("a check-refused parent's children are still screened", () => {
			const program = programOf('{ 42; 43; }');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				BlockStatement: (node) =>
					node.end - node.start > 8
						? 'blocks wider than 8 characters are outside this fixture'
						: true,
			});
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.0',
				'$.body.0.body.0.expression',
				'$.body.0.body.1.expression',
			]);
		});
	});

	describe('both refusal arms can meet in one program', () => {
		it('an absent-type violation and a check violation report in order', () => {
			const program = programOf('42; abcdef;');
			const violations = collectViolations(program, {
				Program: true,
				ExpressionStatement: true,
				Identifier: (node) =>
					node.end - node.start > 3
						? 'names longer than 3 characters are outside this fixture'
						: true,
			});
			expect(violations.map((violation) => violation.message)).toEqual([
				"'Literal' isn't in the admitted syntax",
				'names longer than 3 characters are outside this fixture',
			]);
		});
	});
});
