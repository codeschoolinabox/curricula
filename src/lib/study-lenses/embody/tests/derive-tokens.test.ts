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
				value: { tokens: [], comments: [], inputElements: [] },
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

			it('the num token carries its range — [8, 9]', () => {
				const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
				// PINNED(human ruling 2026-07-30 Q6: token ranges give cross-navigation parity with the ast stage — infra precedes consumers)
				expect(stage.ok && stage.value.tokens[3].range).toEqual([8, 9]);
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

			it('the line comment carries its range — [11, 17]', () => {
				const stage = deriveTokens({
					source: 'let a = 1; // one\nlet b = 2; /* two */',
					type: 'script',
				});
				// PINNED(human ruling 2026-07-30 Q6: token ranges give cross-navigation parity with the ast stage — infra precedes consumers)
				expect(stage.ok && stage.value.comments[0].range).toEqual([11, 17]);
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

	describe('input elements — the tokens-stage enrichment', () => {
		it('empty source → the empty element sequence, present', () => {
			const stage = deriveTokens({ source: '', type: 'script' });
			expect(stage.ok && stage.value.inputElements).toEqual([]);
		});

		it('a spelling failure publishes only its cause — no sequence anywhere', () => {
			const stage = deriveTokens({ source: '01', type: 'module' });
			expect(
				!stage.ok && !('value' in stage) && !('inputElements' in stage),
			).toBe(true);
		});

		it('a one-token program → one NumericLiteral element', () => {
			const stage = deriveTokens({ source: '1', type: 'script' });
			expect(stage.ok && stage.value.inputElements?.[0]?.kind).toBe(
				'NumericLiteral',
			);
		});

		it("its indices point at the stream's only token", () => {
			const stage = deriveTokens({ source: '1', type: 'script' });
			expect(stage.ok && stage.value.inputElements?.[0]?.tokenIndices).toEqual([
				0,
			]);
		});

		it('the element texts join to the exact source', () => {
			const source = 'let a = 1; // one\nlet b = 2;';
			const stage = deriveTokens({ source, type: 'script' });
			expect(
				stage.ok &&
					stage.value.inputElements?.map((element) => element.text).join(''),
			).toBe(source);
		});

		it('the sequence carries trivia the stream skips', () => {
			const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
			expect(
				stage.ok &&
					stage.value.inputElements?.some(
						(element) => element.kind === 'WhiteSpace',
					),
			).toBe(true);
		});

		it.skip('a template with a substitution → Template then TemplateSubstitutionTail', () => {
			const stage = deriveTokens({ source: '`a${b}c`', type: 'script' });
			expect(
				stage.ok &&
					stage.value.inputElements
						?.filter((element) => element.kind !== 'IdentifierName')
						.map((element) => element.kind),
			).toEqual(['Template', 'TemplateSubstitutionTail']);
		});

		it.skip('`const` names the identifier production', () => {
			const stage = deriveTokens({ source: 'const x = 1', type: 'script' });
			expect(stage.ok && stage.value.inputElements?.[0]?.kind).toBe(
				'IdentifierName',
			);
		});

		it.skip('an element resolves through its indices to a token with the same span', () => {
			const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
			const element = stage.ok
				? stage.value.inputElements?.find(
						(element) => element.tokenIndices.length === 1,
					)
				: undefined;
			const token =
				stage.ok && element
					? stage.value.tokens[element.tokenIndices[0]]
					: undefined;
			// PINNED(human ruling 2026-08-14: indices, never token references — the join key into the stage's own stream)
			expect({
				present: element !== undefined,
				span: [element?.start, element?.end],
			}).toEqual({ present: true, span: [token?.start, token?.end] });
		});

		it.skip("an element's text is the snippet's own source slice", () => {
			const source = 'let x = 1 // done';
			const stage = deriveTokens({ source, type: 'script' });
			// PINNED(human ruling 2026-08-18: tokens-stage residence — embody closes the leaf's input-coherence precondition by construction)
			expect(
				stage.ok &&
					stage.value.inputElements?.every(
						(element) =>
							element.text === source.slice(element.start, element.end),
					),
			).toBe(true);
		});

		it.skip('derivation stays quiet on a clean program', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			deriveTokens({ source: 'let x = 1', type: 'script' });
			expect(errorSpy).toHaveBeenCalledTimes(0);
		});

		it.skip('a CRLF pair is one LineTerminator element', () => {
			const stage = deriveTokens({
				source: 'let a = 1\r\nlet b = 2',
				type: 'script',
			});
			expect(
				stage.ok &&
					stage.value.inputElements?.filter(
						(element) => element.kind === 'LineTerminator',
					),
			).toHaveLength(1);
		});
	});
});
