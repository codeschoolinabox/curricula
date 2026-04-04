import { describe, expect, it } from 'vitest';

import createLiteralEvent from '../create-literal-event.js';

import type { StringValue, NumberValue, RegExpValue } from '../../../types.js';

describe('createLiteralEvent', () => {
	describe('category and kind', () => {
		it('category is literal', () => {
			const event = createLiteralEvent({
				kind: 'string',
				value: { type: 'string', value: 'hello' },
			});
			expect(event.category).toBe('literal');
		});

		it('kind matches input', () => {
			const event = createLiteralEvent({
				kind: 'number',
				value: { type: 'number', value: 42 },
			});
			expect(event.kind).toBe('number');
		});
	});

	describe('value field', () => {
		it('string literal', () => {
			const value: StringValue = { type: 'string', value: 'hello' };
			const event = createLiteralEvent({ kind: 'string', value });
			expect(event.value).toEqual(value);
		});

		it('number literal', () => {
			const value: NumberValue = { type: 'number', value: 42 };
			const event = createLiteralEvent({ kind: 'number', value });
			expect(event.value).toEqual(value);
		});

		it('boolean literal', () => {
			const event = createLiteralEvent({
				kind: 'boolean',
				value: { type: 'boolean', value: true },
			});
			expect(event.value).toEqual({ type: 'boolean', value: true });
		});

		it('undefined literal', () => {
			const event = createLiteralEvent({
				kind: 'undefined',
				value: { type: 'undefined' },
			});
			expect(event.value).toEqual({ type: 'undefined' });
		});

		it('null literal', () => {
			const event = createLiteralEvent({
				kind: 'null',
				value: { type: 'object', value: null, isNull: true },
			});
			expect(event.value).toEqual({ type: 'object', value: null, isNull: true });
		});

		it('regex literal', () => {
			const value: RegExpValue = { type: 'regexp', pattern: '\\d+', flags: 'g' };
			const event = createLiteralEvent({ kind: 'regex', value });
			expect(event.value).toEqual(value);
		});
	});

	describe('all literal kinds', () => {
		it.each(['string', 'boolean', 'number', 'undefined', 'null', 'regex'] as const)(
			'%s kind is accepted',
			(kind) => {
				const values = {
					string: { type: 'string' as const, value: '' },
					boolean: { type: 'boolean' as const, value: false },
					number: { type: 'number' as const, value: 0 },
					undefined: { type: 'undefined' as const },
					null: { type: 'object' as const, value: null, isNull: true as const },
					regex: { type: 'regexp' as const, pattern: '', flags: '' },
				};
				const event = createLiteralEvent({ kind, value: values[kind] });
				expect(event.kind).toBe(kind);
			},
		);
	});

	describe('errors', () => {
		it('throws on missing kind', () => {
			expect(() =>
				createLiteralEvent({ value: { type: 'string', value: '' } } as any),
			).toThrow();
		});

		it('throws on missing value', () => {
			expect(() => createLiteralEvent({ kind: 'string' } as any)).toThrow();
		});
	});
});
