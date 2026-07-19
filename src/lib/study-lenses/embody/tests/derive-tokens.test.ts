import { describe, expect, it } from 'vitest';

import deriveTokens from '../derive-tokens.js';

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
	});
});
