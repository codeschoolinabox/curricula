import { describe, expect, it } from 'vitest';

import createFunctionReturnEvent from '../create-function-return-event.js';

describe('createFunctionReturnEvent', () => {
	describe('category and event', () => {
		it('category is function', () => {
			const event = createFunctionReturnEvent({
				name: 'prompt',
				value: { type: 'string', value: 'Alice' },
			});
			expect(event.category).toBe('function');
		});

		it('event is return', () => {
			const event = createFunctionReturnEvent({
				name: 'prompt',
				value: { type: 'string', value: 'Alice' },
			});
			expect(event.event).toBe('return');
		});
	});

	describe('fields', () => {
		it('name is preserved', () => {
			const event = createFunctionReturnEvent({
				name: 'Number',
				value: { type: 'number', value: 42 },
			});
			expect(event.name).toBe('Number');
		});

		it('value is preserved', () => {
			const value = {
				type: 'object' as const,
				value: null,
				isNull: true as const,
			};
			const event = createFunctionReturnEvent({ name: 'prompt', value });
			expect(event.value).toEqual(value);
		});
	});

	describe('errors', () => {
		it('throws on empty name', () => {
			expect(() =>
				createFunctionReturnEvent({ name: '', value: { type: 'undefined' } }),
			).toThrow();
		});

		it('throws on missing value', () => {
			expect(() =>
				createFunctionReturnEvent({ name: 'test' } as any),
			).toThrow();
		});
	});
});
