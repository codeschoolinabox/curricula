import { describe, expect, it } from 'vitest';

import createParenthesisEvent from '../create-parenthesis-event.js';

describe('createParenthesisEvent', () => {
	describe('category and event', () => {
		it('category is parenthesis', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 1 });
			expect(event.category).toBe('parenthesis');
		});

		it('event matches input — enter', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 1 });
			expect(event.event).toBe('enter');
		});

		it('event matches input — leave', () => {
			const event = createParenthesisEvent({ event: 'leave', depth: 1 });
			expect(event.event).toBe('leave');
		});
	});

	describe('depth', () => {
		it('depth 1 for outermost', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 1 });
			expect(event.depth).toBe(1);
		});

		it('depth 3 for nested', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 3 });
			expect(event.depth).toBe(3);
		});
	});

	describe('parentStep', () => {
		it('absent on outermost (depth 1)', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 1 });
			expect(event).not.toHaveProperty('parentStep');
		});

		it('present on nested', () => {
			const event = createParenthesisEvent({ event: 'enter', depth: 2, parentStep: 5 });
			expect(event.parentStep).toBe(5);
		});
	});

	describe('errors', () => {
		it('throws on depth < 1', () => {
			expect(() => createParenthesisEvent({ event: 'enter', depth: 0 })).toThrow();
		});

		it('throws on missing event', () => {
			expect(() => createParenthesisEvent({ depth: 1 } as any)).toThrow();
		});

		it('throws when parentStep provided at depth 1', () => {
			expect(() =>
				createParenthesisEvent({ event: 'enter', depth: 1, parentStep: 3 }),
			).toThrow();
		});
	});
});
