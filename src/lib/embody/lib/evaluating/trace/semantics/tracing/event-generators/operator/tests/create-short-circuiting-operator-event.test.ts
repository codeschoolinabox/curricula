import { describe, expect, it } from 'vitest';

import createShortCircuitingOperatorEvent from '../create-short-circuiting-operator-event.js';

describe('createShortCircuitingOperatorEvent', () => {
	describe('category and kind', () => {
		it('category is operator', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '&&',
				left: { type: 'string', value: 'hello' },
				right: { type: 'string', value: 'world' },
			});
			expect(event.category).toBe('operator');
		});

		it('kind is shortCircuiting', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '||',
				left: { type: 'string', value: 'hello' },
				shortCircuited: true,
			});
			expect(event.kind).toBe('shortCircuiting');
		});
	});

	describe('non-short-circuited', () => {
		it('includes right when not short-circuited', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '&&',
				left: { type: 'boolean', value: true },
				right: { type: 'string', value: 'yes' },
			});
			expect(event.right).toEqual({ type: 'string', value: 'yes' });
		});

		it('no shortCircuited field', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '??',
				left: { type: 'string', value: 'hello' },
				right: { type: 'string', value: 'fallback' },
			});
			expect(event).not.toHaveProperty('shortCircuited');
		});
	});

	describe('short-circuited', () => {
		it('no right when short-circuited', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '||',
				left: { type: 'string', value: 'hello' },
				shortCircuited: true,
			});
			expect(event).not.toHaveProperty('right');
		});

		it('shortCircuited is true', () => {
			const event = createShortCircuitingOperatorEvent({
				operator: '&&',
				left: { type: 'boolean', value: false },
				shortCircuited: true,
			});
			expect(event.shortCircuited).toBe(true);
		});
	});

	describe('errors', () => {
		it('throws when short-circuited but right provided', () => {
			expect(() =>
				createShortCircuitingOperatorEvent({
					operator: '||',
					left: { type: 'string', value: 'hi' },
					right: { type: 'string', value: 'nope' },
					shortCircuited: true,
				}),
			).toThrow();
		});

		it('throws when not short-circuited and right missing', () => {
			expect(() =>
				createShortCircuitingOperatorEvent({
					operator: '&&',
					left: { type: 'boolean', value: true },
				}),
			).toThrow();
		});
	});
});
