import { describe, expect, it } from 'vitest';

import createWithEvent from '../create-with-event.js';

import type { NullValue } from '../../../types.js';

describe('createWithEvent', () => {
	describe('category and event', () => {
		it('category is with', () => {
			const event = createWithEvent({
				event: 'enter',
				object: { type: 'string', value: 'test' },
			});
			expect(event.category).toBe('with');
		});

		it('event enter', () => {
			const event = createWithEvent({
				event: 'enter',
				object: { type: 'string', value: 'test' },
			});
			expect(event.event).toBe('enter');
		});

		it('event leave', () => {
			const event = createWithEvent({
				event: 'leave',
				object: { type: 'string', value: 'test' },
			});
			expect(event.event).toBe('leave');
		});
	});

	describe('object field', () => {
		it('carries the object value', () => {
			const object: NullValue = { type: 'object', value: null, isNull: true };
			const event = createWithEvent({ event: 'enter', object });
			expect(event.object).toEqual(object);
		});
	});

	describe('errors', () => {
		it('throws on missing event', () => {
			expect(() =>
				createWithEvent({ object: { type: 'string', value: '' } } as any),
			).toThrow();
		});

		it('throws on missing object', () => {
			expect(() => createWithEvent({ event: 'enter' } as any)).toThrow();
		});
	});
});
