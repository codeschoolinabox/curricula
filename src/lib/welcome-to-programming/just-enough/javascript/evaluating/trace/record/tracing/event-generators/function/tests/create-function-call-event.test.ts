import { describe, expect, it } from 'vitest';

import createFunctionCallEvent from '../create-function-call-event.js';

describe('createFunctionCallEvent', () => {
	describe('category and event', () => {
		it('category is function', () => {
			const event = createFunctionCallEvent({
				name: 'prompt',
				args: [{ type: 'string', value: 'enter name' }],
			});
			expect(event.category).toBe('function');
		});

		it('event is call', () => {
			const event = createFunctionCallEvent({
				name: 'prompt',
				args: [],
			});
			expect(event.event).toBe('call');
		});
	});

	describe('fields', () => {
		it('name is preserved', () => {
			const event = createFunctionCallEvent({ name: 'Math.floor', args: [] });
			expect(event.name).toBe('Math.floor');
		});

		it('args are preserved', () => {
			const args = [
				{ type: 'number' as const, value: 3.7 },
			];
			const event = createFunctionCallEvent({ name: 'Math.floor', args });
			expect(event.args).toEqual(args);
		});

		it('empty args', () => {
			const event = createFunctionCallEvent({ name: 'Math.random', args: [] });
			expect(event.args).toEqual([]);
		});
	});

	describe('errors', () => {
		it('throws on empty name', () => {
			expect(() => createFunctionCallEvent({ name: '', args: [] })).toThrow();
		});

		it('throws on missing name', () => {
			expect(() => createFunctionCallEvent({ args: [] } as any)).toThrow();
		});
	});
});
