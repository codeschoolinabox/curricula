import { describe, expect, it } from 'vitest';

import createTemplateBeginEvent from '../create-template-begin-event.js';

describe('createTemplateBeginEvent', () => {
	describe('category and event', () => {
		it('category is template', () => {
			const event = createTemplateBeginEvent({ strings: ['hello'], expressionCount: 0 });
			expect(event.category).toBe('template');
		});

		it('event is begin', () => {
			const event = createTemplateBeginEvent({ strings: ['hello'], expressionCount: 0 });
			expect(event.event).toBe('begin');
		});
	});

	describe('fields', () => {
		it('no expressions — strings has 1 part', () => {
			const event = createTemplateBeginEvent({ strings: ['hello'], expressionCount: 0 });
			expect(event.strings).toEqual(['hello']);
			expect(event.expressionCount).toBe(0);
		});

		it('one expression — strings has 2 parts', () => {
			const event = createTemplateBeginEvent({
				strings: ['Hello, ', '!'],
				expressionCount: 1,
			});
			expect(event.strings).toEqual(['Hello, ', '!']);
		});

		it('two expressions — strings has 3 parts', () => {
			const event = createTemplateBeginEvent({
				strings: ['a', 'b', 'c'],
				expressionCount: 2,
			});
			expect(event.expressionCount).toBe(2);
		});
	});

	describe('errors', () => {
		it('throws when strings.length !== expressionCount + 1', () => {
			expect(() =>
				createTemplateBeginEvent({ strings: ['a', 'b'], expressionCount: 0 }),
			).toThrow();
		});
	});
});
