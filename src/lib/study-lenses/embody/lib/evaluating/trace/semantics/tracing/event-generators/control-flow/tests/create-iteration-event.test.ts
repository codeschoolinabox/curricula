import { describe, expect, it } from 'vitest';

import createIterationEvent from '../create-iteration-event.js';

describe('createIterationEvent', () => {
	it('category is loop', () => {
		const event = createIterationEvent({
			kind: 'while',
			index: 0,
			scopeCreationStep: 3,
		});
		expect(event.category).toBe('loop');
	});

	it('event is iteration', () => {
		const event = createIterationEvent({
			kind: 'while',
			index: 0,
			scopeCreationStep: 3,
		});
		expect(event.event).toBe('iteration');
	});

	it.each(['while', 'doWhile', 'for', 'forOf'] as const)(
		'%s → kind threaded',
		(kind) => {
			const event = createIterationEvent({
				kind,
				index: 0,
				scopeCreationStep: 3,
				...(kind === 'forOf' && {
					iterable: { type: 'string', value: 'hi' },
					iterationValue: { type: 'string', value: 'h' },
					iterationVariable: 'c',
				}),
			});
			expect(event.kind).toBe(kind);
		},
	);

	it('index threaded', () => {
		const event = createIterationEvent({
			kind: 'for',
			index: 2,
			scopeCreationStep: 3,
		});
		expect(event.index).toBe(2);
	});

	it('scopeCreationStep threaded', () => {
		const event = createIterationEvent({
			kind: 'while',
			index: 0,
			scopeCreationStep: 8,
		});
		expect(event.scopeCreationStep).toBe(8);
	});

	describe('forOf triple present together', () => {
		it('iterable present', () => {
			const event = createIterationEvent({
				kind: 'forOf',
				index: 0,
				scopeCreationStep: 5,
				iterable: { type: 'string', value: 'hello' },
				iterationValue: { type: 'string', value: 'h' },
				iterationVariable: 'c',
			});
			expect(event.iterable).toEqual({ type: 'string', value: 'hello' });
		});

		it('iterationValue present', () => {
			const event = createIterationEvent({
				kind: 'forOf',
				index: 0,
				scopeCreationStep: 5,
				iterable: { type: 'string', value: 'hello' },
				iterationValue: { type: 'string', value: 'h' },
				iterationVariable: 'c',
			});
			expect(event.iterationValue).toEqual({ type: 'string', value: 'h' });
		});

		it('iterationVariable present', () => {
			const event = createIterationEvent({
				kind: 'forOf',
				index: 0,
				scopeCreationStep: 5,
				iterable: { type: 'string', value: 'hello' },
				iterationValue: { type: 'string', value: 'h' },
				iterationVariable: 'c',
			});
			expect(event.iterationVariable).toBe('c');
		});
	});

	describe('forOf fields absent for non-forOf', () => {
		it('no iterable', () => {
			const event = createIterationEvent({
				kind: 'for',
				index: 2,
				scopeCreationStep: 3,
			});
			expect(event).not.toHaveProperty('iterable');
		});

		it('no iterationValue', () => {
			const event = createIterationEvent({
				kind: 'for',
				index: 2,
				scopeCreationStep: 3,
			});
			expect(event).not.toHaveProperty('iterationValue');
		});

		it('no iterationVariable', () => {
			const event = createIterationEvent({
				kind: 'for',
				index: 2,
				scopeCreationStep: 3,
			});
			expect(event).not.toHaveProperty('iterationVariable');
		});
	});

	it('no label field', () => {
		const event = createIterationEvent({
			kind: 'while',
			index: 0,
			scopeCreationStep: 3,
		});
		expect(event).not.toHaveProperty('label');
	});

	describe('guards', () => {
		it('throws on negative index', () => {
			expect(() =>
				createIterationEvent({
					kind: 'while',
					index: -1,
					scopeCreationStep: 0,
				}),
			).toThrow('index');
		});

		it('throws when one forOf field is provided', () => {
			expect(() =>
				createIterationEvent({
					kind: 'forOf',
					index: 0,
					scopeCreationStep: 0,
					iterable: { type: 'string', value: 'hello' },
				}),
			).toThrow('iterable');
		});

		it('throws when two forOf fields are provided', () => {
			expect(() =>
				createIterationEvent({
					kind: 'forOf',
					index: 0,
					scopeCreationStep: 0,
					iterable: { type: 'string', value: 'hello' },
					iterationValue: { type: 'string', value: 'h' },
				}),
			).toThrow('iterable');
		});
	});
});
