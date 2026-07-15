import { describe, expect, it } from 'vitest';

import representValue from '../represent-value.js';

describe('representValue', () => {
	describe('string', () => {
		it('type is string', () => {
			expect(representValue('hello').type).toBe('string');
		});

		it('value is the string', () => {
			expect(representValue('hello')).toEqual({
				type: 'string',
				value: 'hello',
			});
		});

		it('empty string', () => {
			expect(representValue('')).toEqual({ type: 'string', value: '' });
		});
	});

	describe('number', () => {
		it('positive integer', () => {
			expect(representValue(42)).toEqual({ type: 'number', value: 42 });
		});

		it('zero', () => {
			expect(representValue(0)).toEqual({ type: 'number', value: 0 });
		});

		it('negative number has isNegative', () => {
			expect(representValue(-5)).toEqual({
				type: 'number',
				value: -5,
				isNegative: true,
			});
		});

		it('NaN has isNaN', () => {
			expect(representValue(NaN)).toEqual({
				type: 'number',
				value: NaN,
				isNaN: true,
			});
		});

		it('Infinity has isInfinity', () => {
			expect(representValue(Infinity)).toEqual({
				type: 'number',
				value: Infinity,
				isInfinity: true,
			});
		});

		it('-Infinity has isInfinity and isNegative', () => {
			expect(representValue(-Infinity)).toEqual({
				type: 'number',
				value: -Infinity,
				isInfinity: true,
				isNegative: true,
			});
		});

		it('-0 has isNegative', () => {
			const result = representValue(-0);
			expect(result).toEqual({ type: 'number', value: -0, isNegative: true });
		});

		it('float', () => {
			expect(representValue(3.14)).toEqual({ type: 'number', value: 3.14 });
		});
	});

	describe('boolean', () => {
		it('true', () => {
			expect(representValue(true)).toEqual({ type: 'boolean', value: true });
		});

		it('false', () => {
			expect(representValue(false)).toEqual({ type: 'boolean', value: false });
		});
	});

	describe('undefined', () => {
		it('type is undefined with no value field', () => {
			expect(representValue(undefined)).toEqual({ type: 'undefined' });
		});
	});

	describe('null', () => {
		it('type is object with isNull', () => {
			expect(representValue(null)).toEqual({
				type: 'object',
				value: null,
				isNull: true,
			});
		});
	});

	describe('function', () => {
		it('named function', () => {
			function foo(a: number, b: number) {
				return a + b;
			}
			expect(representValue(foo)).toEqual({
				type: 'function',
				name: 'foo',
				arity: 2,
			});
		});

		it('anonymous function', () => {
			expect(representValue(function () {})).toEqual({
				type: 'function',
				name: '',
				arity: 0,
			});
		});

		it('arrow function', () => {
			const fn = (x: number) => x;
			expect(representValue(fn)).toEqual({
				type: 'function',
				name: 'fn',
				arity: 1,
			});
		});
	});

	describe('regexp', () => {
		it('pattern and flags', () => {
			expect(representValue(/abc/gi)).toEqual({
				type: 'regexp',
				pattern: 'abc',
				flags: 'gi',
			});
		});

		it('no flags', () => {
			expect(representValue(/\d+/)).toEqual({
				type: 'regexp',
				pattern: '\\d+',
				flags: '',
			});
		});
	});

	describe('fallback', () => {
		it('plain object falls back to null representation', () => {
			expect(representValue({})).toEqual({
				type: 'object',
				value: null,
				isNull: true,
			});
		});

		it('array falls back to null representation', () => {
			expect(representValue([1, 2])).toEqual({
				type: 'object',
				value: null,
				isNull: true,
			});
		});
	});
});
