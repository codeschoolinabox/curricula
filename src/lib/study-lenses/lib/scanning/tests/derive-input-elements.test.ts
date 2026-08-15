import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import deriveInputElements from '../derive-input-elements.js';
import type { InputElement, ScanInput } from '../types.js';

function read(
	code: string,
	sourceType: 'module' | 'script' = 'module',
): ScanInput {
	const comments: acorn.Comment[] = [];
	const tokens = Array.from(
		acorn.tokenizer(code, {
			ecmaVersion: 2024,
			sourceType,
			onComment: comments,
			ranges: true,
		}),
	);
	return { code, tokens, comments };
}

function elements(
	code: string,
	sourceType: 'module' | 'script' = 'module',
): readonly InputElement[] {
	return deriveInputElements(read(code, sourceType));
}

function kinds(
	code: string,
	sourceType: 'module' | 'script' = 'module',
): string[] {
	return elements(code, sourceType).map((element) => element.kind);
}

function spans(code: string): Array<[number, number]> {
	return elements(code).map((element) => [element.start, element.end]);
}

describe('deriveInputElements', () => {
	describe('Zero', () => {
		it('returns nothing for an empty source', () => {
			expect(elements('')).toEqual([]);
		});
	});

	describe('One', () => {
		it('names a lone identifier', () => {
			expect(kinds('x')).toEqual(['IdentifierName']);
		});

		it('spans a lone identifier over the whole source', () => {
			expect(spans('x')).toEqual([[0, 1]]);
		});

		it('carries the verbatim source slice', () => {
			expect(elements('x')[0]?.text).toBe('x');
		});

		it('carries the index of the token it wraps', () => {
			expect(elements('x')[0]?.tokenIndices).toEqual([0]);
		});
	});

	describe('Many', () => {
		it('names every element of a short declaration', () => {
			expect(kinds('let x = 1')).toEqual([
				'IdentifierName',
				'WhiteSpace',
				'IdentifierName',
				'WhiteSpace',
				'Punctuator',
				'WhiteSpace',
				'NumericLiteral',
			]);
		});

		it('spans every element of a short declaration', () => {
			expect(spans('let x = 1')).toEqual([
				[0, 3],
				[3, 4],
				[4, 5],
				[5, 6],
				[6, 7],
				[7, 8],
				[8, 9],
			]);
		});

		it('indexes into the caller token array rather than its own output', () => {
			expect(elements('let x = 1')[2]?.tokenIndices).toEqual([1]);
		});
	});

	describe('Boundaries — tiling', () => {
		const corpus = [
			'',
			'x',
			'let x = 1',
			'  ',
			'\n\n',
			'// hi',
			'/* a\nb */',
			'#!/usr/bin/env node\nlet x = 1',
			'`a${b}c`',
			'`${a}${b}`',
			'`a${`n${q}`}c`',
			'a?.5:b',
			'a+++b',
			'a /= b',
			'x**=2',
			'{ }',
			'({ a: 1 })',
			'x = /ab+c/gi',
			'#priv',
			'\r\n\r\n',
			'  x',
			'async function f(){ await /re/ }',
		];

		it.skip('starts every sequence at offset zero or leaves it empty', () => {
			for (const code of corpus) {
				expect(elements(code)[0]?.start ?? 0).toBe(0);
			}
		});

		it.skip('ends every sequence at the source length', () => {
			for (const code of corpus) {
				expect(elements(code).at(-1)?.end ?? 0).toBe(code.length);
			}
		});

		it.skip('leaves no gap and no overlap between consecutive elements', () => {
			for (const code of corpus) {
				const result = elements(code);
				for (const [index, element] of result.entries()) {
					if (index > 0) expect(element.start).toBe(result[index - 1]?.end);
				}
			}
		});

		it.skip('publishes nothing of zero width', () => {
			for (const code of corpus) {
				for (const element of elements(code)) {
					expect(element.end).toBeGreaterThan(element.start);
				}
			}
		});

		it.skip('makes every text the verbatim slice of its own span', () => {
			for (const code of corpus) {
				for (const element of elements(code)) {
					expect(element.text).toBe(code.slice(element.start, element.end));
				}
			}
		});
	});

	describe('The vocabulary', () => {
		it('names a reserved word an IdentifierName', () => {
			expect(kinds('if')).toEqual(['IdentifierName']);
		});

		it('names an operator-shaped reserved word an IdentifierName', () => {
			expect(kinds('typeof x')[0]).toBe('IdentifierName');
		});

		it('names a contextual keyword an IdentifierName', () => {
			expect(kinds('let')).toEqual(['IdentifierName']);
		});

		it('names null an IdentifierName rather than a literal', () => {
			expect(kinds('null')).toEqual(['IdentifierName']);
		});

		it('names true an IdentifierName rather than a literal', () => {
			expect(kinds('true')).toEqual(['IdentifierName']);
		});

		it('names false an IdentifierName rather than a literal', () => {
			expect(kinds('false')).toEqual(['IdentifierName']);
		});

		it('names a private name a PrivateIdentifier', () => {
			expect(kinds('class C { #x }')[6]).toBe('PrivateIdentifier');
		});

		it.skip('names a lone slash a DivPunctuator', () => {
			expect(kinds('a / b')[2]).toBe('DivPunctuator');
		});

		it.skip('names a division assignment a DivPunctuator despite its shared token type', () => {
			expect(kinds('a /= b')[2]).toBe('DivPunctuator');
		});

		it.skip('keeps a different compound assignment of the same token type a Punctuator', () => {
			expect(kinds('x**=2')[1]).toBe('Punctuator');
		});

		it.skip('keeps a two-character compound assignment a Punctuator', () => {
			expect(kinds('a += b')[2]).toBe('Punctuator');
		});

		it.skip('names a brace outside a template a RightBracePunctuator', () => {
			expect(kinds('{ }')[2]).toBe('RightBracePunctuator');
		});

		it.skip('names an optional chain a Punctuator', () => {
			expect(kinds('a?.b')[1]).toBe('Punctuator');
		});

		it.skip('names a regular expression literal', () => {
			expect(kinds('x = /ab+c/gi')[4]).toBe('RegularExpressionLiteral');
		});

		it.skip('names a numeric separator literal a NumericLiteral', () => {
			expect(kinds('1_000')).toEqual(['NumericLiteral']);
		});

		it.skip('names a single-quoted string a StringLiteral', () => {
			expect(kinds("'hi'")).toEqual(['StringLiteral']);
		});
	});

	describe('Template folding', () => {
		it.skip('folds a template with no substitution into one element', () => {
			expect(kinds('`a`')).toEqual(['Template']);
		});

		it.skip('folds a template head into one element', () => {
			expect(kinds('`a${b}c`')[0]).toBe('Template');
		});

		it.skip('spans a template head from backtick through the opening brace', () => {
			expect(spans('`a${b}c`')[0]).toEqual([0, 4]);
		});

		it.skip('names the run after an interpolation a TemplateSubstitutionTail', () => {
			expect(kinds('`a${b}c`')[2]).toBe('TemplateSubstitutionTail');
		});

		it.skip('absorbs the zero-width chunk between adjacent interpolations', () => {
			expect(kinds('`${a}${b}`')).toEqual([
				'Template',
				'IdentifierName',
				'TemplateSubstitutionTail',
				'IdentifierName',
				'TemplateSubstitutionTail',
			]);
		});

		it.skip('absorbs a zero-width chunk into the token indices of its run', () => {
			expect(elements('`${a}${b}`')[0]?.tokenIndices).toEqual([0, 1, 2]);
		});

		it.skip('folds a nested template into five elements', () => {
			expect(kinds('`a${`n${q}`}c`')).toHaveLength(5);
		});

		it.skip('folds a chunk carrying a tag-only escape', () => {
			expect(kinds('tag`a${x}\\unicode`')).toEqual([
				'IdentifierName',
				'Template',
				'IdentifierName',
				'TemplateSubstitutionTail',
			]);
		});

		it.skip('carries every token a folded run spans', () => {
			expect(elements('`a`')[0]?.tokenIndices).toHaveLength(3);
		});
	});

	describe('Right-brace disambiguation', () => {
		it.skip('names a block-closing brace a RightBracePunctuator', () => {
			expect(kinds('{ }')[2]).toBe('RightBracePunctuator');
		});

		it.skip('names an object-literal brace inside an interpolation a RightBracePunctuator', () => {
			expect(kinds('`${ {a:1} }`')[6]).toBe('RightBracePunctuator');
		});

		it.skip('names a template-continuation brace part of its tail run', () => {
			expect(kinds('`a${b}c`')[2]).toBe('TemplateSubstitutionTail');
		});
	});

	describe('Trivia', () => {
		it.skip('collapses a run of spaces into one element', () => {
			expect(kinds('x   y')[1]).toBe('WhiteSpace');
		});

		it.skip('spans a run of spaces as one element', () => {
			expect(spans('x   y')[1]).toEqual([1, 4]);
		});

		it.skip('collapses a carriage return and line feed into one line terminator', () => {
			expect(kinds('x\r\ny')[1]).toBe('LineTerminator');
		});

		it.skip('never merges whitespace with a line terminator', () => {
			expect(kinds('x \n y')).toEqual([
				'IdentifierName',
				'WhiteSpace',
				'LineTerminator',
				'WhiteSpace',
				'IdentifierName',
			]);
		});

		it.skip('publishes a leading gap', () => {
			expect(kinds('  x')[0]).toBe('WhiteSpace');
		});

		it.skip('publishes a trailing gap', () => {
			expect(kinds('x  ')[1]).toBe('WhiteSpace');
		});

		it.skip('publishes a whitespace-only source as trivia alone', () => {
			expect(kinds('   ')).toEqual(['WhiteSpace']);
		});
	});

	describe('Comments and the hashbang', () => {
		it.skip('names a line comment', () => {
			expect(kinds('// hi')).toEqual(['Comment']);
		});

		it.skip('names a block comment', () => {
			expect(kinds('/* hi */')).toEqual(['Comment']);
		});

		it.skip('names a block comment carrying a line terminator', () => {
			expect(kinds('/* a\nb */')).toEqual(['Comment']);
		});

		it.skip('names a hashbang at offset zero a HashbangComment', () => {
			expect(kinds('#!/usr/bin/env node\nlet x = 1')[0]).toBe(
				'HashbangComment',
			);
		});

		it.skip('leaves a line comment at offset zero a Comment', () => {
			expect(kinds('// x\nlet a = 1')[0]).toBe('Comment');
		});

		it.skip('places a comment between the elements that surround it', () => {
			expect(kinds('x // hi')).toEqual([
				'IdentifierName',
				'WhiteSpace',
				'Comment',
			]);
		});
	});

	describe('Interfaces — frozen, pure and deterministic', () => {
		it.skip('freezes the returned sequence', () => {
			expect(Object.isFrozen(elements('let x = 1'))).toBe(true);
		});

		it.skip('freezes every element', () => {
			expect(Object.isFrozen(elements('let x = 1')[0])).toBe(true);
		});

		it.skip('freezes the token-index array of an element', () => {
			expect(Object.isFrozen(elements('x')[0]?.tokenIndices)).toBe(true);
		});

		it.skip('leaves the caller token objects unfrozen', () => {
			const input = read('let x = 1');
			deriveInputElements(input);
			expect(Object.isFrozen(input.tokens[0])).toBe(false);
		});

		it.skip('leaves the parser token-type singletons unfrozen', () => {
			deriveInputElements(read('let x = 1'));
			expect(Object.isFrozen(acorn.tokTypes.name)).toBe(false);
		});

		it.skip('does not mutate the input token array', () => {
			const input = read('let x = 1');
			deriveInputElements(input);
			expect(input.tokens).toHaveLength(4);
		});

		it.skip('returns the same sequence for the same source', () => {
			expect(kinds('let x = 1')).toEqual(kinds('let x = 1'));
		});
	});

	describe('Exceptions', () => {
		it.skip('throws when the source text is absent', () => {
			const input = read('x');
			expect(() =>
				deriveInputElements({
					...input,
					code: undefined,
				} as unknown as ScanInput),
			).toThrow(TypeError);
		});

		it.skip('throws when the token array is absent', () => {
			const input = read('x');
			expect(() =>
				deriveInputElements({
					...input,
					tokens: undefined,
				} as unknown as ScanInput),
			).toThrow(TypeError);
		});

		it.skip('throws when the comment array is absent', () => {
			const input = read('x');
			expect(() =>
				deriveInputElements({
					...input,
					comments: undefined,
				} as unknown as ScanInput),
			).toThrow(TypeError);
		});
	});

	describe('Simple — the recorded departures', () => {
		it.skip('publishes one element for a whitespace run rather than one per character', () => {
			expect(elements('    ')).toHaveLength(1);
		});

		it.skip('yields three elements where the language has one regular expression after await', () => {
			expect(kinds('async function f(){ await /re/ }').slice(11, 14)).toEqual([
				'DivPunctuator',
				'IdentifierName',
				'DivPunctuator',
			]);
		});

		it.skip('still tiles the source it reads wrongly after await', () => {
			const code = 'async function f(){ await /re/ }';
			expect(elements(code).at(-1)?.end).toBe(code.length);
		});
	});
});
