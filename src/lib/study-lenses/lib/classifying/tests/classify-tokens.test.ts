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
		it('classifies the reserved-word operator typeof as operator', () => {
			const result = classifyTokens(parse('typeof x'));
			expect(result[0]?.categories).toEqual(['operator']);
		});

		it('classifies the reserved-word operator in as operator', () => {
			const result = classifyTokens(parse('a in b'));
			expect(result[1]?.categories).toEqual(['operator']);
		});

		it('classifies the reserved-word operator instanceof as operator', () => {
			const result = classifyTokens(parse('a instanceof b'));
			expect(result[1]?.categories).toEqual(['operator']);
		});

		it('classifies the reserved-word operator void as operator', () => {
			const result = classifyTokens(parse('void x'));
			expect(result[0]?.categories).toEqual(['operator']);
		});

		it('classifies the reserved-word operator delete as operator', () => {
			const result = classifyTokens(parse('delete a.b'));
			expect(result[0]?.categories).toEqual(['operator']);
		});

		it('classifies the reserved-word literal null as literal', () => {
			const result = classifyTokens(parse('null'));
			expect(result[0]?.categories).toEqual(['literal']);
		});

		it('classifies the reserved-word literal true as literal', () => {
			const result = classifyTokens(parse('true'));
			expect(result[0]?.categories).toEqual(['literal']);
		});

		it('classifies the reserved-word literal false as literal', () => {
			const result = classifyTokens(parse('false'));
			expect(result[0]?.categories).toEqual(['literal']);
		});

		it('classifies the contextual keyword await as keyword', () => {
			const result = classifyTokens(parse('await x'));
			expect(result[0]?.categories).toEqual(['keyword']);
		});

		it('classifies the contextual keyword yield as keyword', () => {
			const result = classifyTokens(parse('function* g() { yield 1; }'));
			expect(result[6]?.categories).toEqual(['keyword']);
		});

		it('classifies a statement keyword as keyword', () => {
			const result = classifyTokens(parse('if (x) {}'));
			expect(result[0]?.categories).toEqual(['keyword']);
		});

		it('classifies a declaration contextual keyword as keyword', () => {
			const result = classifyTokens(parse('let x = 1'));
			expect(result[0]?.categories).toEqual(['keyword']);
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

		it('seeds the null literal with null', () => {
			const result = classifyTokens(parse('null'));
			expect(result[0]?.role).toBe('null');
		});

		it('seeds a boolean literal with boolean', () => {
			const result = classifyTokens(parse('true'));
			expect(result[0]?.role).toBe('boolean');
		});

		it('seeds the false literal with boolean', () => {
			const result = classifyTokens(parse('false'));
			expect(result[0]?.role).toBe('boolean');
		});

		it('seeds a reserved-word operator with other', () => {
			const result = classifyTokens(parse('typeof x'));
			expect(result[0]?.role).toBe('other');
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

	describe('Pairing', () => {
		it('pairs an opener with its closer', () => {
			const result = classifyTokens(parse('(x)'));
			expect(result[0]?.partner).toBe(2);
		});

		it('pairs a closer with its opener', () => {
			const result = classifyTokens(parse('(x)'));
			expect(result[2]?.partner).toBe(0);
		});

		it('pairs nested delimiters by stack order, not nearest type', () => {
			const result = classifyTokens(parse('({a})'));
			expect(result[1]?.partner).toBe(3);
		});

		it('pairs bracket delimiters', () => {
			const result = classifyTokens(parse('[a]'));
			expect(result[0]?.partner).toBe(2);
		});

		it('pairs block brace delimiters', () => {
			const result = classifyTokens(parse('{ x; }'));
			expect(result[0]?.partner).toBe(3);
		});

		it('pairs a template-expression close with its open, not a block brace', () => {
			const result = classifyTokens(parse('`${x}`; { y }'));
			expect(result[3]?.partner).toBe(1);
		});

		it('pairs a block close with its open, not a template-expression open', () => {
			const result = classifyTokens(parse('`${x}`; { y }'));
			expect(result[8]?.partner).toBe(6);
		});

		it('pairs nested template backticks by stack depth', () => {
			const result = classifyTokens(parse('`${`b`}`'));
			expect(result[0]?.partner).toBe(6);
		});

		it('pairs the backticks across a delimiter-looking template chunk', () => {
			const result = classifyTokens(parse('`(`'));
			expect(result[0]?.partner).toBe(2);
		});

		it('leaves a delimiter-looking template chunk unpaired', () => {
			const result = classifyTokens(parse('`(`'));
			expect(result[1]?.partner).toBeNull();
		});

		it('pairs the inner backticks of a nested template', () => {
			const result = classifyTokens(parse('`${`b`}`'));
			expect(result[2]?.partner).toBe(4);
		});

		it('makes every partner link mutual', () => {
			const result = classifyTokens(parse('`${x}`; [a]; (b); { c }'));
			for (const [index, token] of result.entries()) {
				if (token.partner !== null) {
					expect(result[token.partner]?.partner).toBe(index);
				}
			}
		});

		it('leaves a non-delimiter token inside a paired expression unpaired', () => {
			const result = classifyTokens(parse('(x)'));
			expect(result[1]?.partner).toBeNull();
		});
	});

	describe('Delimiter roles', () => {
		it('roles a block-statement open brace as block', () => {
			const result = classifyTokens(parse('{ x; }'));
			expect(result[0]?.role).toBe('block');
		});

		it('roles a block-statement close brace as block via inheritance', () => {
			const result = classifyTokens(parse('{ x; }'));
			expect(result[3]?.role).toBe('block');
		});

		it('roles a function-body open brace as block', () => {
			const result = classifyTokens(parse('function f() {}'));
			expect(result[4]?.role).toBe('block');
		});

		it('roles an arrow-body open brace as block', () => {
			const result = classifyTokens(parse('() => { return 1 }'));
			expect(result[3]?.role).toBe('block');
		});

		it('roles a try-body open brace as block', () => {
			const result = classifyTokens(parse('try { x } catch(e) { y }'));
			expect(result[1]?.role).toBe('block');
		});

		it('roles a switch-body open brace as other, not block', () => {
			const result = classifyTokens(parse('switch (x) {}'));
			expect(result[4]?.role).toBe('other');
		});

		it('roles a switch-body close brace as other via inheritance', () => {
			const result = classifyTokens(parse('switch (x) {}'));
			expect(result[5]?.role).toBe('other');
		});

		it('roles an object-literal open brace as other', () => {
			const result = classifyTokens(parse('({a:1})'));
			expect(result[1]?.role).toBe('other');
		});

		it('inherits a non-block opener role onto its closer', () => {
			const result = classifyTokens(parse('`x`'));
			expect(result[2]?.role).toBe('template-delimiter');
		});

		it('inherits any opener role onto its closer, not only block', () => {
			const result = classifyTokens(parse('(x)'));
			expect(result[2]?.role).toBe('grouping');
		});

		it('makes every paired delimiter share its partner role', () => {
			const result = classifyTokens(parse('{ x } ({a:1})'));
			for (const token of result) {
				if (token.partner !== null) {
					expect(result[token.partner]?.role).toBe(token.role);
				}
			}
		});

		it('leaves a non-delimiter role unchanged', () => {
			const result = classifyTokens(parse('{ x; }'));
			expect(result[2]?.role).toBe('statement-end');
		});
	});

	describe('Paren roles', () => {
		it('roles a call argument open paren as call-arguments', () => {
			const result = classifyTokens(parse('f(x)'));
			expect(result[1]?.role).toBe('call-arguments');
		});

		it('roles a new-expression argument open paren as call-arguments', () => {
			const result = classifyTokens(parse('new Date()'));
			expect(result[2]?.role).toBe('call-arguments');
		});

		it('roles each open paren of a chained call as call-arguments', () => {
			const result = classifyTokens(parse('f(x)(y)'));
			expect(result[4]?.role).toBe('call-arguments');
		});

		it('roles a call open paren after a parenthesized callee as call-arguments', () => {
			const result = classifyTokens(parse('(a.b)()'));
			expect(result[5]?.role).toBe('call-arguments');
		});

		it('roles the grouping paren around a callee as grouping', () => {
			const result = classifyTokens(parse('(a.b)()'));
			expect(result[0]?.role).toBe('grouping');
		});

		it('roles an if head open paren as control-head', () => {
			const result = classifyTokens(parse('if (x) {}'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a while head open paren as control-head', () => {
			const result = classifyTokens(parse('while (a) f(b)'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a for head open paren as control-head', () => {
			const result = classifyTokens(parse('for (let i = 0; i < 3; i++) {}'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a for-in head open paren as control-head', () => {
			const result = classifyTokens(parse('for (x in y) {}'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a for-of head open paren as control-head', () => {
			const result = classifyTokens(parse('for (x of y) {}'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a switch head open paren as control-head', () => {
			const result = classifyTokens(parse('switch (x) {}'));
			expect(result[1]?.role).toBe('control-head');
		});

		it('roles a do-while condition open paren as control-head', () => {
			const result = classifyTokens(parse('do { f(x) } while (y)'));
			expect(result[8]?.role).toBe('control-head');
		});

		it('roles a call paren inside a do body as call-arguments', () => {
			const result = classifyTokens(parse('do { f(x) } while (y)'));
			expect(result[3]?.role).toBe('call-arguments');
		});

		it('roles a catch binding open paren as control-head', () => {
			const result = classifyTokens(parse('try {} catch (e) {}'));
			expect(result[4]?.role).toBe('control-head');
		});

		it('leaves a binding-less catch clause with no control-head paren', () => {
			const result = classifyTokens(parse('try {} catch {}'));
			expect(result.every((token) => token.role !== 'control-head')).toBe(true);
		});

		it('roles a function declaration param open paren as other', () => {
			const result = classifyTokens(parse('function f(a) {}'));
			expect(result[2]?.role).toBe('other');
		});

		it('roles an arrow param open paren as other', () => {
			const result = classifyTokens(parse('(a) => a'));
			expect(result[0]?.role).toBe('other');
		});

		it('roles a zero-param arrow open paren as other', () => {
			const result = classifyTokens(parse('() => x'));
			expect(result[0]?.role).toBe('other');
		});

		it('roles an async arrow param open paren as other', () => {
			const result = classifyTokens(parse('async (x) => x'));
			expect(result[1]?.role).toBe('other');
		});

		it('roles a generator function param open paren as other', () => {
			const result = classifyTokens(parse('function* g() {}'));
			expect(result[3]?.role).toBe('other');
		});

		it('roles a method param open paren as other', () => {
			const result = classifyTokens(parse('class A { m(x) {} }'));
			expect(result[4]?.role).toBe('other');
		});

		it('roles an optional-call open paren as call-arguments', () => {
			const result = classifyTokens(parse('a?.(x)'));
			expect(result[2]?.role).toBe('call-arguments');
		});

		it('roles a grouped new callee paren as grouping', () => {
			const result = classifyTokens(parse('new (Foo)(x)'));
			expect(result[1]?.role).toBe('grouping');
		});

		it('roles a grouped new call paren as call-arguments', () => {
			const result = classifyTokens(parse('new (Foo)(x)'));
			expect(result[4]?.role).toBe('call-arguments');
		});

		it('roles a standalone grouping paren as grouping', () => {
			const result = classifyTokens(parse('(a)'));
			expect(result[0]?.role).toBe('grouping');
		});

		it('roles a paren-less arrow body grouping paren as grouping', () => {
			const result = classifyTokens(parse('() => (b)'));
			expect(result[3]?.role).toBe('grouping');
		});

		it('roles the param paren of an arrow with a grouping body as other', () => {
			const result = classifyTokens(parse('() => (b)'));
			expect(result[0]?.role).toBe('other');
		});

		it('inherits the call-arguments role onto the closer paren', () => {
			const result = classifyTokens(parse('f(x)'));
			expect(result[3]?.role).toBe('call-arguments');
		});

		it('leaves a delimiter-looking template chunk role untouched', () => {
			const result = classifyTokens(parse('`(`'));
			expect(result[1]?.role).toBe('template-chunk');
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
