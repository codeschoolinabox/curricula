import { afterEach, describe, expect, it, vi } from 'vitest';

import deriveAst from '../derive-ast.js';
import deriveTokens from '../derive-tokens.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('deriveAst', () => {
	describe('success arm', () => {
		it('empty source → a Program with an empty body', () => {
			const snippet = { source: '', type: 'script' } as const;
			const stage = deriveAst(snippet, deriveTokens(snippet));
			expect(stage.ok && stage.value.body).toHaveLength(0);
		});

		describe('single statement', () => {
			it('parses to one body node', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body).toHaveLength(1);
			});

			it('holds acorn nodes — a VariableDeclaration', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body[0].type).toBe(
					'VariableDeclaration',
				);
			});

			it('range marks the source span end at 9', () => {
				const snippet = { source: 'let x = 1', type: 'script' } as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.range?.[1]).toBe(9);
			});
		});

		describe('multiple statements', () => {
			it('parses both statements', () => {
				const snippet = {
					source: 'let a = 1; let b = 2;',
					type: 'script',
				} as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(stage.ok && stage.value.body).toHaveLength(2);
			});
		});

		describe('import in a module — the module half of the sourceType pair', () => {
			it('parses to an ImportDeclaration', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'module',
				} as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
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
				const stage = deriveAst(
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
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.stage).toBe('ast');
			});

			it('→ offset 5', () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.offset).toBe(5);
			});

			it("→ the parser's own message", () => {
				const snippet = { source: 'const', type: 'script' } as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.message).toContain('Unexpected token');
			});
		});

		describe('import in a script — the script half of the sourceType pair', () => {
			it('→ an ast-stage cause', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'script',
				} as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
				expect(!stage.ok && stage.cause.stage).toBe('ast');
			});

			it('→ offset 0, kept', () => {
				const snippet = {
					source: "import x from 'y'",
					type: 'script',
				} as const;
				const stage = deriveAst(snippet, deriveTokens(snippet));
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
