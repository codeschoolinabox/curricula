import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import classifyTokens from '../classify-tokens.js';
import type { ClassifyInput } from '../types.js';

function parse(code: string): ClassifyInput {
	const tokens: acorn.Token[] = [];
	const ast = acorn.parse(code, {
		ecmaVersion: 2022,
		sourceType: 'module',
		onToken: (token) => tokens.push(token),
	});
	return { code, tokens, ast };
}

describe('classifyTokens', () => {
	describe('Zero', () => {
		it('returns an empty array for an empty source', () => {
			expect(classifyTokens(parse(''))).toEqual([]);
		});
	});

	describe('One', () => {
		it('classifies a lone identifier as a single fully-formed element', () => {
			expect(classifyTokens(parse('x'))).toEqual([
				{
					text: 'x',
					start: 0,
					end: 1,
					categories: ['identifier'],
					role: null,
					partner: null,
				},
			]);
		});
	});

	describe('Many', () => {
		it('returns one element per non-empty token in ascending source order', () => {
			const result = classifyTokens(parse('x; y'));
			expect(result.map((token) => token.start)).toEqual([0, 1, 3]);
		});

		it('classifies each token by its own type', () => {
			const result = classifyTokens(parse('x; y'));
			expect(result.map((token) => token.categories[0])).toEqual([
				'identifier',
				'delimiter',
				'identifier',
			]);
		});
	});

	describe('Boundaries — totality', () => {
		it('emits exactly one element per non-eof non-zero-length token', () => {
			const input = parse('`${a}${b}`');
			const expected = input.tokens.filter(
				(token) => token.type.label !== 'eof' && token.end > token.start,
			).length;
			expect(classifyTokens(input)).toHaveLength(expected);
		});

		it('drops every zero-length token from the output', () => {
			const result = classifyTokens(parse('`${a}${b}`'));
			expect(result.every((token) => token.end > token.start)).toBe(true);
		});
	});

	describe('Home category — precedence', () => {
		it('classifies a prefix keyword-operator as keyword, not operator', () => {
			const result = classifyTokens(parse('typeof x'));
			expect(result[0]?.categories).toEqual(['keyword']);
		});

		it('classifies a binary keyword-operator as keyword, not operator', () => {
			const result = classifyTokens(parse('a in b'));
			expect(result[1]?.categories).toEqual(['keyword']);
		});

		it('classifies instanceof as keyword, not operator', () => {
			const result = classifyTokens(parse('a instanceof b'));
			expect(result[1]?.categories).toEqual(['keyword']);
		});

		it('classifies a prefix keyword unary as keyword, not operator', () => {
			const result = classifyTokens(parse('void x'));
			expect(result[0]?.categories).toEqual(['keyword']);
		});

		it('classifies a contextual keyword as keyword', () => {
			const result = classifyTokens(parse('let x = 1'));
			expect(result[0]?.categories).toEqual(['keyword']);
		});

		it('classifies a contextual keyword used as a plain name as keyword', () => {
			const result = classifyTokens(parse('let of = 3'));
			expect(result[1]?.categories).toEqual(['keyword']);
		});

		it('classifies the flagless ** as operator', () => {
			const result = classifyTokens(parse('2 ** 3'));
			expect(result[1]?.categories).toEqual(['operator']);
		});

		it('classifies a flagged operator as operator', () => {
			const result = classifyTokens(parse('a ?? b'));
			expect(result[1]?.categories).toEqual(['operator']);
		});

		it('classifies a numeric literal as literal', () => {
			const result = classifyTokens(parse('5'));
			expect(result[0]?.categories).toEqual(['literal']);
		});

		it('classifies a delimiter punctuator as delimiter', () => {
			const result = classifyTokens(parse('a.b'));
			expect(result[1]?.categories).toEqual(['delimiter']);
		});

		it('classifies an invalid-escape template chunk as literal', () => {
			const result = classifyTokens(parse('x`\\u`'));
			expect(result[2]?.categories).toEqual(['literal']);
		});
	});

	describe('Role seeds', () => {
		it('seeds a semicolon with statement-end', () => {
			const result = classifyTokens(parse('x;'));
			expect(result[1]?.role).toBe('statement-end');
		});

		it('seeds a member dot with member-access', () => {
			const result = classifyTokens(parse('a.b'));
			expect(result[1]?.role).toBe('member-access');
		});

		it('seeds a template backtick with template-delimiter', () => {
			const result = classifyTokens(parse('`x`'));
			expect(result[0]?.role).toBe('template-delimiter');
		});

		it('seeds a template-expression open with template-expression', () => {
			const result = classifyTokens(parse('`${a}`'));
			expect(result[1]?.role).toBe('template-expression');
		});

		it('seeds a numeric literal with number', () => {
			const result = classifyTokens(parse('5'));
			expect(result[0]?.role).toBe('number');
		});

		it('seeds a string literal with string', () => {
			const result = classifyTokens(parse('"hi"'));
			expect(result[0]?.role).toBe('string');
		});

		it('seeds a regex literal with regexp', () => {
			const result = classifyTokens(parse('const re = /a/'));
			expect(result[3]?.role).toBe('regexp');
		});

		it('seeds a template chunk with template-chunk', () => {
			const result = classifyTokens(parse('`hi${x}`'));
			expect(result[1]?.role).toBe('template-chunk');
		});

		it('seeds an invalid-escape template chunk with template-chunk', () => {
			const result = classifyTokens(parse('x`\\u`'));
			expect(result[2]?.role).toBe('template-chunk');
		});

		it('leaves an identifier role null', () => {
			const result = classifyTokens(parse('x'));
			expect(result[0]?.role).toBeNull();
		});

		it('leaves a keyword role null', () => {
			const result = classifyTokens(parse('const x = 1'));
			expect(result[0]?.role).toBeNull();
		});
	});

	describe('Source authority', () => {
		it('preserves the verbatim source slice including quotes for a string literal', () => {
			const result = classifyTokens(parse('"hi"'));
			expect(result[0]?.text).toBe('"hi"');
		});
	});

	describe('Frozen', () => {
		it('returns a frozen array', () => {
			expect(Object.isFrozen(classifyTokens(parse('x')))).toBe(true);
		});

		it('returns frozen elements', () => {
			const result = classifyTokens(parse('x'));
			expect(Object.isFrozen(result[0])).toBe(true);
		});

		it('returns a frozen categories sub-array', () => {
			const result = classifyTokens(parse('x'));
			expect(Object.isFrozen(result[0]?.categories)).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('throws TypeError when code is missing', () => {
			const { tokens, ast } = parse('x');
			expect(() =>
				classifyTokens({ tokens, ast } as unknown as ClassifyInput),
			).toThrow(TypeError);
		});

		it('throws TypeError when tokens is null', () => {
			const { ast } = parse('x');
			expect(() =>
				classifyTokens({
					code: 'x',
					tokens: null,
					ast,
				} as unknown as ClassifyInput),
			).toThrow(TypeError);
		});

		it('throws TypeError when ast is null', () => {
			const { tokens } = parse('x');
			expect(() =>
				classifyTokens({
					code: 'x',
					tokens,
					ast: null,
				} as unknown as ClassifyInput),
			).toThrow(TypeError);
		});
	});
});
