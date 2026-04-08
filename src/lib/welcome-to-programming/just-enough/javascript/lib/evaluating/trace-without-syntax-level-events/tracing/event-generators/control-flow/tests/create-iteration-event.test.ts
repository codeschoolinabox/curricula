import { describe, expect, it } from 'vitest';

import createIterationEvent from '../create-iteration-event.js';

describe('createIterationEvent', () => {
	it('basic while iteration', () => {
		const event = createIterationEvent({ kind: 'while', index: 0, scopeCreationStep: 3 });
		expect(event.category).toBe('controlFlow');
		expect(event.event).toBe('iteration');
	});

	it('forOf with iteration fields', () => {
		const event = createIterationEvent({
			kind: 'forOf',
			index: 0,
			scopeCreationStep: 5,
			iterable: { type: 'string', value: 'hello' },
			iterationValue: { type: 'string', value: 'h' },
			iterationVariable: 'c',
		});
		expect(event.iterable).toEqual({ type: 'string', value: 'hello' });
		expect(event.iterationValue).toEqual({ type: 'string', value: 'h' });
		expect(event.iterationVariable).toBe('c');
	});

	it('forOf fields absent for non-forOf', () => {
		const event = createIterationEvent({ kind: 'for', index: 2, scopeCreationStep: 3 });
		expect(event).not.toHaveProperty('iterable');
		expect(event).not.toHaveProperty('iterationValue');
		expect(event).not.toHaveProperty('iterationVariable');
	});

	it('throws on negative index', () => {
		expect(() =>
			createIterationEvent({ kind: 'while', index: -1, scopeCreationStep: 0 }),
		).toThrow();
	});

	it('throws when forOf fields partially provided', () => {
		expect(() =>
			createIterationEvent({
				kind: 'forOf',
				index: 0,
				scopeCreationStep: 0,
				iterable: { type: 'string', value: 'hello' },
			}),
		).toThrow();
	});
});
