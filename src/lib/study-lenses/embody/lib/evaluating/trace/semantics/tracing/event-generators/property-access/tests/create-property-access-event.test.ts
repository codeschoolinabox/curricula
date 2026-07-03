import { describe, expect, it } from 'vitest';

import createPropertyAccessEvent from '../create-property-access-event.js';

describe('createPropertyAccessEvent', () => {
	describe('category and kind', () => {
		it('category is property', () => {
			const event = createPropertyAccessEvent({
				kind: 'dot',
				object: 'Math',
				key: 'PI',
				value: { type: 'number', value: 3.141592653589793 },
			});
			expect(event.category).toBe('property');
		});

		it('kind dot', () => {
			const event = createPropertyAccessEvent({
				kind: 'dot',
				object: 'str',
				key: 'length',
				value: { type: 'number', value: 5 },
			});
			expect(event.kind).toBe('dot');
		});

		it('kind bracket', () => {
			const event = createPropertyAccessEvent({
				kind: 'bracket',
				object: 'str',
				key: 0,
				value: { type: 'string', value: 'h' },
			});
			expect(event.kind).toBe('bracket');
		});
	});

	describe('fields', () => {
		it('object name', () => {
			const event = createPropertyAccessEvent({
				kind: 'dot',
				object: 'console',
				key: 'log',
				value: { type: 'function', name: 'log' },
			});
			expect(event.object).toBe('console');
		});

		it('string key', () => {
			const event = createPropertyAccessEvent({
				kind: 'dot',
				object: 'Math',
				key: 'PI',
				value: { type: 'number', value: 3.14 },
			});
			expect(event.key).toBe('PI');
		});

		it('numeric key', () => {
			const event = createPropertyAccessEvent({
				kind: 'bracket',
				object: 'str',
				key: 2,
				value: { type: 'string', value: 'c' },
			});
			expect(event.key).toBe(2);
		});
	});

	describe('optional chaining', () => {
		it('no shortCircuited when access succeeds', () => {
			const event = createPropertyAccessEvent({
				kind: 'optionalChaining',
				object: 'input',
				key: 'length',
				value: { type: 'number', value: 5 },
			});
			expect(event).not.toHaveProperty('shortCircuited');
		});

		it('shortCircuited when base is nullish', () => {
			const event = createPropertyAccessEvent({
				kind: 'optionalChaining',
				object: 'input',
				key: 'length',
				value: { type: 'undefined' },
				shortCircuited: true,
			});
			expect(event.shortCircuited).toBe(true);
		});
	});

	describe('errors', () => {
		it('throws when shortCircuited on non-optionalChaining', () => {
			expect(() =>
				createPropertyAccessEvent({
					kind: 'dot',
					object: 'str',
					key: 'length',
					value: { type: 'number', value: 5 },
					shortCircuited: true,
				}),
			).toThrow();
		});
	});
});
