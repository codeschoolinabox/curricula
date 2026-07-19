// cspell:ignore quasis

import { describe, expect, it } from 'vitest';

import deriveAst from '../derive-ast.js';
import deriveEntwined from '../derive-entwined.js';
import deriveTokens from '../derive-tokens.js';

describe('deriveEntwined', () => {
	describe('success arm', () => {
		describe('empty program', () => {
			it('the root path is $', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.path).toBe('$');
			});

			it('the root parent is null', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.parent).toBe(null);
			});

			it('the root has no children', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.children).toHaveLength(0);
			});

			it('byPath holds exactly the root', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && Object.keys(stage.value.byPath),
				).toHaveLength(1);
			});

			it('byOffset is empty', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.byOffset).toHaveLength(0);
			});

			it('the root ties no tokens', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.tokens).toHaveLength(0);
			});
		});

		describe('single statement', () => {
			it('the root has one child', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.children).toHaveLength(1);
			});

			it('the child path resolves through byPath', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.byPath['$.body.0']?.path).toBe(
					'$.body.0',
				);
			});

			it("the child's parent is the root — one wired graph", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.root.children[0].parent === entwined.root,
				).toBe(true);
			});

			it('byPath and the children walk share one graph — never copies', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.byPath['$.body.0'] === entwined.root.children[0],
				).toBe(true);
			});

			it('the root holds the very tree the parse built', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(ast.ok && entwined && entwined.root.node === ast.value).toBe(
					true,
				);
			});

			it('a child holds the very node the parse built', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					ast.ok &&
						entwined &&
						entwined.byPath['$.body.0']?.node === ast.value.body[0],
				).toBe(true);
			});
		});

		describe('sibling object children', () => {
			it('a declarator ties both its id and its init', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.children,
				).toHaveLength(2);
			});

			it('the id comes first', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.children[0].path,
				).toBe('$.body.0.declarations.0.id');
			});

			it('the init comes second', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.children[1].path,
				).toBe('$.body.0.declarations.0.init');
			});
		});

		describe('nested statements', () => {
			it('a deep path resolves', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.path,
				).toBe('$.body.0.declarations.0');
			});

			it('the deepest node resolves — the initializer literal', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
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
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.children[0].path).toBe(
					'$.body.0',
				);
			});

			it('children keep source order — second', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.children[1].path).toBe(
					'$.body.1',
				);
			});
		});

		describe('byOffset', () => {
			it('covers every source offset', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.byOffset).toHaveLength(9);
			});

			it('leaves no holes', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && stage.value.byOffset.filter(Boolean),
				).toHaveLength(9);
			});

			it('the keyword resolves to the declaration, not the program', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.byOffset[0] === entwined.byPath['$.body.0'],
				).toBe(true);
			});

			it('the identifier resolves to its own node', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[4] ===
							entwined.byPath['$.body.0.declarations.0.id'],
				).toBe(true);
			});

			it('the literal resolves to its own node', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[8] ===
							entwined.byPath['$.body.0.declarations.0.init'],
				).toBe(true);
			});

			it('an inter-token gap resolves to its enclosing declaration', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined && entwined.byOffset[3] === entwined.byPath['$.body.0'],
				).toBe(true);
			});

			it("a node's end is exclusive — the offset after it belongs to the parent", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[5] === entwined.byPath['$.body.0.declarations.0'],
				).toBe(true);
			});

			it('leading trivia resolves to the root', () => {
				const snippet = { source: '   let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(entwined && entwined.byOffset[0] === entwined.root).toBe(true);
			});

			it("a second statement's offsets resolve into it", () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[15] ===
							entwined.byPath['$.body.1.declarations.0.id'],
				).toBe(true);
			});

			it('a zero-width quasi covers no offset — its ancestor stands', () => {
				const snippet = { source: '`${x}`', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[1] === entwined.byPath['$.body.0.expression'],
				).toBe(true);
			});

			it('a zero-width quasi is still reachable via byPath', () => {
				const snippet = { source: '`${x}`', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.expression.quasis.0']?.node.type,
				).toBe('TemplateElement');
			});

			it('identical-span siblings: the later-enumerated value wins', () => {
				const snippet = { source: 'const o = {x}', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[11] ===
							entwined.byPath[
								'$.body.0.declarations.0.init.properties.0.value'
							],
				).toBe(true);
			});

			it('offsets count UTF-16 code units — an emoji spans two', () => {
				const snippet = { source: 'const a="😀"', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.byOffset).toHaveLength(12);
			});

			it("a surrogate's second unit resolves into the string literal", () => {
				const snippet = { source: 'const a="😀"', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byOffset[10] ===
							entwined.byPath['$.body.0.declarations.0.init'],
				).toBe(true);
			});
		});

		describe('token ties', () => {
			it('the root ties every token', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.tokens).toHaveLength(4);
			});

			it('the declarator excludes the let keyword — three tokens', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.tokens,
				).toHaveLength(3);
			});

			it("the declarator's first tied token is the identifier", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.tokens[0].token
							.start,
				).toBe(4);
			});

			it('a leaf ties exactly its own token', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0.init']?.tokens,
				).toHaveLength(1);
			});

			it("a leaf's tied token is its num token", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0.init']?.tokens[0].token
							.type.label,
				).toBe('num');
			});

			it('one wrapper per token, shared across nodes — never copies', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.tokens[3] ===
							entwined.byPath['$.body.0.declarations.0.init']?.tokens[0],
				).toBe(true);
			});

			it('the root ties tokens in stream order', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && stage.value.root.tokens[0]?.token.start,
				).toBe(0);
			});

			it("a statement excludes its sibling's tokens", () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && stage.value.byPath['$.body.0']?.tokens,
				).toHaveLength(5);
			});

			it("the second statement's ties start at its own let", () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.1']?.tokens[0].token.start,
				).toBe(11);
			});

			it('a zero-width quasi ties no tokens', () => {
				const snippet = { source: '`${x}`', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.expression.quasis.0']?.tokens,
				).toHaveLength(0);
			});
		});

		describe('comment ties', () => {
			it('an empty program ties no comments', () => {
				const snippet = { source: '', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.comments).toHaveLength(0);
			});

			it('a comment-free program ties no comments', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.comments).toHaveLength(0);
			});

			it('the root ties every comment', () => {
				const snippet = {
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.comments).toHaveLength(2);
			});

			it('a between-statement comment ties to no statement', () => {
				const snippet = {
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && stage.value.byPath['$.body.0']?.comments,
				).toHaveLength(0);
			});

			it('root comments keep source order', () => {
				const snippet = {
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage && stage.ok && stage.value.root.comments[0]?.comment.start,
				).toBe(11);
			});

			it('an interior comment ties to its enclosing declarator', () => {
				const snippet = {
					source: 'let x = /* c */ 1',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0']?.comments,
				).toHaveLength(1);
			});

			it('an interior comment does not tie to the literal beside it', () => {
				const snippet = {
					source: 'let x = /* c */ 1',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.declarations.0.init']?.comments,
				).toHaveLength(0);
			});

			it('one wrapper per comment, shared across nodes — never copies', () => {
				const snippet = {
					source: 'let x = /* c */ 1',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.comments[0] ===
							entwined.byPath['$.body.0.declarations.0']?.comments[0],
				).toBe(true);
			});

			it('a leading comment resolves to the root', () => {
				const snippet = {
					source: '/* header */let x = 1',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.comments).toHaveLength(1);
			});

			it('a trailing comment resolves to the root', () => {
				const snippet = {
					source: 'let x = 1 // tail',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.comments).toHaveLength(1);
			});
		});

		describe('token chain', () => {
			it.each([
				[0, 1],
				[1, 2],
				[2, 3],
			])('token %i chains forward to token %i', (index, nextIndex) => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.tokens[index].next ===
							entwined.root.tokens[nextIndex],
				).toBe(true);
			});

			it.each([
				[1, 0],
				[2, 1],
				[3, 2],
			])('token %i chains backward to token %i', (index, previousIndex) => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.tokens[index].previous ===
							entwined.root.tokens[previousIndex],
				).toBe(true);
			});

			it("the first token's previous is null", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.tokens[0]?.previous).toBe(
					null,
				);
			});

			it("the last token's next is null", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(stage && stage.ok && stage.value.root.tokens[3]?.next).toBe(
					null,
				);
			});

			it('the chain crosses statement boundaries — stream-wide, not per-node', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byPath['$.body.0']?.tokens[4]?.next ===
							entwined.byPath['$.body.1']?.tokens[0],
				).toBe(true);
			});

			it("a per-node list's first wrapper still chains to a token the node excludes", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.byPath['$.body.0.declarations.0']?.tokens[0]?.previous ===
							entwined.root.tokens[0],
				).toBe(true);
			});
		});

		describe('innermostNode', () => {
			it("a token's innermostNode is the deepest node at its start offset", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.tokens[3].innermostNode ===
							entwined.byPath['$.body.0.declarations.0.init'],
				).toBe(true);
			});

			it("an ancestor-only token's innermostNode is the ancestor, not the root", () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				const entwined = stage && stage.ok && stage.value;
				expect(
					entwined &&
						entwined.root.tokens[0].innermostNode ===
							entwined.byPath['$.body.0'],
				).toBe(true);
			});
		});

		describe('array hole', () => {
			it('a surviving element keeps its source index in the path', () => {
				const snippet = { source: '[,1]', type: 'script' } as const;
				const tokens = deriveTokens(snippet);
				const ast = deriveAst(snippet, tokens);
				const stage =
					ast.ok && tokens.ok && deriveEntwined(ast.value, tokens.value);
				expect(
					stage &&
						stage.ok &&
						stage.value.byPath['$.body.0.expression.elements.1']?.node.type,
				).toBe('Literal');
			});
		});
	});
});
