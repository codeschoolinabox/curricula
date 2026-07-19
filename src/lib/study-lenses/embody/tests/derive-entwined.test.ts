import { describe, expect, it } from 'vitest';

import deriveAst from '../derive-ast.js';
import deriveEntwined from '../derive-entwined.js';
import deriveTokens from '../derive-tokens.js';

describe('deriveEntwined', () => {
	describe('success arm', () => {
		describe('empty program', () => {
			it('the root path is $', () => {
				const snippet = { source: '', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.path).toBe('$');
			});

			it('the root parent is null', () => {
				const snippet = { source: '', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.parent).toBe(null);
			});

			it('the root has no children', () => {
				const snippet = { source: '', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.children).toHaveLength(0);
			});

			it('byPath holds exactly the root', () => {
				const snippet = { source: '', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(
					stage && stage.ok && Object.keys(stage.value.byPath),
				).toHaveLength(1);
			});
		});

		describe('single statement', () => {
			it('the root has one child', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.children).toHaveLength(1);
			});

			it('the child path resolves through byPath', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.byPath['$.body.0']?.path).toBe(
					'$.body.0',
				);
			});

			it("the child's parent is the root — one wired graph", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.root.children[0].parent === entwined.root,
				).toBe(true);
			});

			it('byPath and the children walk share one graph — never copies', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.byPath['$.body.0'] === entwined.root.children[0],
				).toBe(true);
			});

			it('the root holds the very tree the parse built', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				const entwined = stage && stage.ok && stage.value;
				expect(ast.ok && entwined && entwined.root.node === ast.value).toBe(
					true,
				);
			});

			it('a child holds the very node the parse built', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					ast.ok &&
						entwined &&
						entwined.byPath['$.body.0']?.node === ast.value.body[0],
				).toBe(true);
			});
		});

		describe('nested statements', () => {
			it('a deep path resolves', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.path,
				).toBe('$.body.0.declarations.0');
			});

			it('the deepest node resolves — the initializer literal', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0.init']?.node.type,
				).toBe('Literal');
			});
		});

		describe('two statements', () => {
			it('children keep source order — first', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.children[0].path).toBe(
					'$.body.0',
				);
			});

			it('children keep source order — second', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(stage && stage.ok && stage.value.root.children[1].path).toBe(
					'$.body.1',
				);
			});
		});

		describe('array hole', () => {
			it('a surviving element keeps its source index in the path', () => {
				const snippet = { source: '[,1]', type: 'script' } as const;
				const ast = deriveAst(snippet, deriveTokens(snippet));
				const stage = ast.ok && deriveEntwined(ast.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.expression.elements.1']?.node.type,
				).toBe('Literal');
			});
		});
	});
});
