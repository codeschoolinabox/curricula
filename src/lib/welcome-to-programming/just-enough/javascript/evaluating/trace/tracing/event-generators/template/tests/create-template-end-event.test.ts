import { describe, expect, it } from 'vitest';

import createTemplateEndEvent from '../create-template-end-event.js';

describe('createTemplateEndEvent', () => {
	describe('category and event', () => {
		it('category is template', () => {
			const event = createTemplateEndEvent({
				value: { type: 'string', value: 'Hello, Alice!' },
				beginStep: 5,
			});
			expect(event.category).toBe('template');
		});

		it('event is end', () => {
			const event = createTemplateEndEvent({
				value: { type: 'string', value: '' },
				beginStep: 0,
			});
			expect(event.event).toBe('end');
		});
	});

	describe('fields', () => {
		it('value preserved', () => {
			const event = createTemplateEndEvent({
				value: { type: 'string', value: 'result' },
				beginStep: 3,
			});
			expect(event.value).toEqual({ type: 'string', value: 'result' });
		});

		it('beginStep preserved', () => {
			const event = createTemplateEndEvent({
				value: { type: 'string', value: '' },
				beginStep: 7,
			});
			expect(event.beginStep).toBe(7);
		});
	});
});
