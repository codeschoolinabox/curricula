import { describe, expect, it } from 'vitest';

import createTestEvent from '../create-test-event.js';

describe('createTestEvent', () => {
	it('category is controlFlow', () => {
		const event = createTestEvent({
			kind: 'conditional',
			value: { type: 'boolean', value: true },
			result: true,
			scopeCreationStep: 0,
		});
		expect(event.category).toBe('controlFlow');
	});

	it('event is test', () => {
		const event = createTestEvent({
			kind: 'while',
			value: { type: 'string', value: 'hello' },
			result: true,
			scopeCreationStep: 3,
		});
		expect(event.event).toBe('test');
	});

	it('coercion present when value is not boolean', () => {
		const event = createTestEvent({
			kind: 'while',
			value: { type: 'string', value: 'hello' },
			result: true,
			scopeCreationStep: 3,
			coercion: { type: 'boolean', value: true },
		});
		expect(event.coercion).toEqual({ type: 'boolean', value: true });
	});

	it('coercion absent when value is already boolean', () => {
		const event = createTestEvent({
			kind: 'conditional',
			value: { type: 'boolean', value: false },
			result: false,
			scopeCreationStep: 0,
		});
		expect(event).not.toHaveProperty('coercion');
	});

	it('label present when provided', () => {
		const event = createTestEvent({
			kind: 'while',
			value: { type: 'boolean', value: true },
			result: true,
			scopeCreationStep: 0,
			label: 'outer',
		});
		expect(event.label).toBe('outer');
	});
});
