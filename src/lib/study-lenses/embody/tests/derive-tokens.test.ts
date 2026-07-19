import { afterEach, describe, expect, it, vi } from 'vitest';

import deriveTokens from '../derive-tokens.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('deriveTokens', () => {
	describe('success arm', () => {
		it('empty source → empty tokens and comments', () => {
			expect(deriveTokens({ source: '', type: 'script' })).toEqual({
				ok: true,
				value: { tokens: [], comments: [] },
			});
		});

		describe('single statement', () => {
			it('tokenizes to four tokens', () => {
				const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
				expect(stage.ok && stage.value.tokens).toHaveLength(4);
			});

			it('holds acorn tokens — the literal is a num token', () => {
				const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
				expect(stage.ok && stage.value.tokens[3].type.label).toBe('num');
			});
		});

		describe('multiple statements with comments', () => {
			it('collects both comments', () => {
				const stage = deriveTokens({
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				});
				expect(stage.ok && stage.value.comments).toHaveLength(2);
			});

			it('holds acorn comments — the first is a Line comment', () => {
				const stage = deriveTokens({
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				});
				expect(stage.ok && stage.value.comments[0].type).toBe('Line');
			});

			it('tokenizes both statements', () => {
				const stage = deriveTokens({
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				});
				expect(stage.ok && stage.value.tokens).toHaveLength(10);
			});
		});

		describe('legacy octal in a script — the script half of the sourceType pair', () => {
			it('tokenizes to one num token', () => {
				const stage = deriveTokens({ source: '01', type: 'script' });
				expect(stage.ok && stage.value.tokens).toHaveLength(1);
			});
		});
	});

	describe('failure arm', () => {
		describe('legacy octal in a module — the module half of the sourceType pair', () => {
			it('→ a tokens-stage cause', () => {
				const stage = deriveTokens({ source: '01', type: 'module' });
				expect(!stage.ok && stage.cause.stage).toBe('tokens');
			});

			it('→ offset 0, kept', () => {
				const stage = deriveTokens({ source: '01', type: 'module' });
				expect(!stage.ok && stage.cause.offset).toBe(0);
			});
		});

		describe('unterminated string at the source start', () => {
			it('→ offset 0, kept', () => {
				const stage = deriveTokens({ source: "'unterminated", type: 'script' });
				expect(!stage.ok && stage.cause.offset).toBe(0);
			});

			it("→ the parser's own message", () => {
				const stage = deriveTokens({ source: "'unterminated", type: 'script' });
				expect(!stage.ok && stage.cause.message).toContain('Unterminated');
			});
		});

		describe('unterminated string after a valid statement', () => {
			it('→ offset 8', () => {
				const stage = deriveTokens({ source: "let s = 'oops", type: 'script' });
				expect(!stage.ok && stage.cause.offset).toBe(8);
			});

			it('→ position column 8', () => {
				const stage = deriveTokens({ source: "let s = 'oops", type: 'script' });
				expect(!stage.ok && stage.cause.position?.column).toBe(8);
			});
		});

		describe('unterminated string on the second line', () => {
			it('→ position line 2', () => {
				const stage = deriveTokens({
					source: "let a = 1\nlet b = 'oops",
					type: 'script',
				});
				expect(!stage.ok && stage.cause.position?.line).toBe(2);
			});

			it('→ offset 18', () => {
				const stage = deriveTokens({
					source: "let a = 1\nlet b = 'oops",
					type: 'script',
				});
				expect(!stage.ok && stage.cause.offset).toBe(18);
			});
		});

		describe('quiet, not loud', () => {
			it('reports nothing to console.error', () => {
				const errorSpy = vi
					.spyOn(console, 'error')
					.mockImplementation(() => {});
				deriveTokens({ source: '01', type: 'module' });
				expect(errorSpy).toHaveBeenCalledTimes(0);
			});

			it('reports nothing to console.warn', () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				deriveTokens({ source: '01', type: 'module' });
				expect(warnSpy).toHaveBeenCalledTimes(0);
			});
		});
	});
});
