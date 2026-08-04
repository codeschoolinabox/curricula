import { parse } from 'acorn';
import type {
	ArrayExpression,
	AssignmentExpression,
	BinaryExpression,
	CallExpression,
	ExpressionStatement,
	IfStatement,
	MemberExpression,
	NewExpression,
} from 'acorn';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PARSE_SETTINGS from '../../lib/screening/parse-settings.js';
import deriveAst from '../derive-ast.js';
import deriveTokens from '../derive-tokens.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('deriveAst', () => {
	describe('success arm', () => {
		it('empty source → a Program with an empty body', () => {
			const snippet = { source: '', type: 'script' } as const;
			const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
			expect(stage.ok && stage.value.body).toHaveLength(0);
		});

		describe('single statement', () => {
			it('parses to one body node', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body).toHaveLength(1);
			});

			it('holds acorn nodes — a VariableDeclaration', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body[0].type).toBe(
					'VariableDeclaration',
				);
			});

			it('range marks the source span end at 9', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				// PINNED(human ruling 2026-07-30: parse facts carry source spans — the scope analyzer reads node ranges)
				expect(stage.ok && stage.value.range?.[1]).toBe(9);
			});
		});

		describe('parenthesized source', () => {
			it('a parenthesized operand folds — no ParenthesizedExpression is published', () => {
				const snippet = { source: '(1 + 2) * 3', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				// PINNED(human ruling 2026-07-30: published ast is ESTree-shaped — parens fold away)
				expect(
					statement && (statement.expression as BinaryExpression).left.type,
				).toBe('BinaryExpression');
			});

			it('a doubly-wrapped operand folds at every depth', () => {
				const snippet = { source: '((x)) + 0', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as BinaryExpression).left.type,
				).toBe('Identifier');
			});

			it("a folded operand keeps its own span, not the enclosing pair's", () => {
				const snippet = { source: '((1))', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(statement && statement.expression.start).toBe(2);
			});

			it('the published tree names no parenthesis anywhere', () => {
				const snippet = {
					source: 'let a = (((1))) + f((b)); if ((c)) { (d); }',
					type: 'script',
				} as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				// PINNED(human ruling 2026-07-30 Q1: the published ast is ESTree-shaped — no node names a parenthesis)
				expect(stage.ok && JSON.stringify(stage.value)).not.toContain(
					'ParenthesizedExpression',
				);
			});
		});

		describe('grouping parentheses that change the parse', () => {
			it('(a?.b).c → the member object is a ChainExpression', () => {
				const snippet = { source: '(a?.b).c', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as MemberExpression).object.type,
				).toBe('ChainExpression');
			});

			it('new (a?.b)() → the callee is a ChainExpression', () => {
				const snippet = { source: 'new (a?.b)()', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as NewExpression).callee.type,
				).toBe('ChainExpression');
			});

			it('(a) = 5 → the assignment target is an Identifier', () => {
				const snippet = { source: '(a) = 5', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as AssignmentExpression).left.type,
				).toBe('Identifier');
			});

			it('(a.b) = 5 → the assignment target is a MemberExpression', () => {
				const snippet = { source: '(a.b) = 5', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as AssignmentExpression).left.type,
				).toBe('MemberExpression');
			});

			it('[(1), , (2)] → the array keeps its hole at index 1', () => {
				const snippet = { source: '[(1), , (2)]', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					stage.ok && (stage.value.body[0] as ExpressionStatement);
				expect(
					statement && (statement.expression as ArrayExpression).elements[1],
				).toBe(null);
			});
		});

		describe('grouping-parentheses record', () => {
			it('a source with no grouping parentheses records nothing', () => {
				const snippet = { source: 'let x = 1 + 2', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				expect(derivation.parenSpansByNode.size).toBe(0);
			});

			it('records the pair at the operand it wrapped', () => {
				const snippet = { source: '(1 + 2) * 3', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const operand =
					statement && (statement.expression as BinaryExpression).left;
				expect(operand && derivation.parenSpansByNode.get(operand)).toEqual([
					{ start: 0, end: 7 },
				]);
			});

			it('an unwrapped sibling in the same tree has no entry', () => {
				const snippet = { source: '(1 + 2) * 3', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const sibling =
					statement && (statement.expression as BinaryExpression).right;
				expect(
					sibling && derivation.parenSpansByNode.get(sibling),
				).toBeUndefined();
			});

			it('one wrapped operand → exactly one entry in the whole tree', () => {
				const snippet = { source: '(1 + 2) * 3', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				expect(derivation.parenSpansByNode.size).toBe(1);
			});

			it('two independent pairs → the left operand carries its own', () => {
				const snippet = { source: '(1) + (2)', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const operand =
					statement && (statement.expression as BinaryExpression).left;
				expect(operand && derivation.parenSpansByNode.get(operand)).toEqual([
					{ start: 0, end: 3 },
				]);
			});

			it('two independent pairs → the right operand carries its own', () => {
				const snippet = { source: '(1) + (2)', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const operand =
					statement && (statement.expression as BinaryExpression).right;
				expect(operand && derivation.parenSpansByNode.get(operand)).toEqual([
					{ start: 6, end: 9 },
				]);
			});

			it('a doubly-wrapped operand carries both pairs, outermost first', () => {
				const snippet = { source: '((x)) + 0', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const operand =
					statement && (statement.expression as BinaryExpression).left;
				// PINNED(Phase-0 2ad2407b: one span per pair, outermost first — ascending start, the order the source reads)
				expect(operand && derivation.parenSpansByNode.get(operand)).toEqual([
					{ start: 0, end: 5 },
					{ start: 1, end: 4 },
				]);
			});

			it("a control head's parentheses are not a grouping", () => {
				const snippet = { source: 'if (x) (y);', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok && (derivation.ast.value.body[0] as IfStatement);
				expect(
					statement && derivation.parenSpansByNode.get(statement.test),
				).toBeUndefined();
			});

			it("the expression inside a control head's body is a grouping", () => {
				const snippet = { source: 'if (x) (y);', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok && (derivation.ast.value.body[0] as IfStatement);
				const consequent =
					statement && (statement.consequent as ExpressionStatement);
				expect(
					consequent && derivation.parenSpansByNode.get(consequent.expression),
				).toEqual([{ start: 7, end: 10 }]);
			});

			it("a call's own parentheses are not a grouping", () => {
				const snippet = { source: 'f((a))', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				expect(derivation.parenSpansByNode.size).toBe(1);
			});

			it('the wrapped argument inside a call carries the pair', () => {
				const snippet = { source: 'f((a))', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				const statement =
					derivation.ast.ok &&
					(derivation.ast.value.body[0] as ExpressionStatement);
				const argument =
					statement && (statement.expression as CallExpression).arguments[0];
				expect(argument && derivation.parenSpansByNode.get(argument)).toEqual([
					{ start: 2, end: 5 },
				]);
			});
		});

		describe('the published settings reproduce the published tree', () => {
			it.each([
				'let x = 1 + 2',
				'(1 + 2) * 3',
				'((x)) + 0',
				'(((x))) + 0',
				'(a?.b).c',
				'new (a?.b)()',
				'(a) = 5',
				'(a.b) = 5',
				'[(1), , (2)]',
				'f((a), (b))',
				'if ((c)) { (d); }',
			])('%s → identical to a parse with the published settings', (source) => {
				const snippet = { source, type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value).toStrictEqual(
					parse(source, { ...PARSE_SETTINGS, sourceType: 'script' }),
				);
			});
		});

		describe('multiple statements', () => {
			it('parses both statements', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body).toHaveLength(2);
			});
		});

		describe('import in a module — the module half of the sourceType pair', () => {
			it('parses to an ImportDeclaration', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'module',
				} as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body[0].type).toBe('ImportDeclaration');
			});
		});
	});

	describe('failure arm', () => {
		describe('a failed tokens stage short-circuits', () => {
			it('carries the tokens cause by identity — a rebuilt equal cause must not pass', () => {
				const cause = {
					stage: 'tokens',
					message: 'sentinel — no parser says this',
					offset: 99,
				} as const;
				const { ast: stage } = deriveAst(
					{ source: 'let x = 1', type: 'script' },
					{ ok: false, cause },
				);
				expect(!stage.ok && stage.cause).toBe(cause);
			});

			it('reports nothing to console.error when carrying', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				deriveAst(
					{ source: 'let x = 1', type: 'script' },
					{
						ok: false,
						cause: { stage: 'tokens', message: 'sentinel', offset: 0 },
					},
				);
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn when carrying', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				deriveAst(
					{ source: 'let x = 1', type: 'script' },
					{
						ok: false,
						cause: { stage: 'tokens', message: 'sentinel', offset: 0 },
					},
				);
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});
		});

		describe('grammar error originates an ast cause', () => {
			it('→ an ast-stage cause', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.stage).toBe('ast');
			});

			it('→ offset 5', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.offset).toBe(5);
			});

			it("→ the parser's own message", () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.message).toContain('Unexpected token');
			});
		});

		describe('grouping-parentheses record', () => {
			it('a grammar error records nothing', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const derivation = deriveAst(snippet, deriveTokens(snippet));
				expect(derivation.parenSpansByNode.size).toBe(0);
			});

			it('a failed tokens stage records nothing', () => {
				const derivation = deriveAst(
					{ source: '(1 + 2) * 3', type: 'script' },
					{
						ok: false,
						cause: { stage: 'tokens', message: 'sentinel', offset: 0 },
					},
				);
				expect(derivation.parenSpansByNode.size).toBe(0);
			});
		});

		describe('import in a script — the script half of the sourceType pair', () => {
			it('→ an ast-stage cause', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'script',
				} as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.stage).toBe('ast');
			});

			it('→ offset 0, kept', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'script',
				} as const;
				const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.offset).toBe(0);
			});
		});

		describe('quiet, not loud', () => {
			it('reports nothing to console.error on a grammar error', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				const snippet = { source: 'const', type: 'script' } as const;
				deriveAst(snippet, deriveTokens(snippet));
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn on a grammar error', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const snippet = { source: 'const', type: 'script' } as const;
				deriveAst(snippet, deriveTokens(snippet));
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});
		});
	});
});
