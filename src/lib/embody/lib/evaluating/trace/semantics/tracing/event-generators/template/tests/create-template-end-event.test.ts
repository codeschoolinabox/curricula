import { describe, expect, it } from 'vitest';

import createTemplateEndEvent from '../create-template-end-event.js';

describe('createTemplateEndEvent', () => {
	describe('category and event', () => {
		it('category is template', () => {
			const event = createTemplateEndEvent({
				beginStep: 5,
			});
			expect(event.category).toBe('template');
		});

		it('event is end', () => {
			const event = createTemplateEndEvent({
				beginStep: 0,
			});
			expect(event.event).toBe('end');
		});
	});

	describe('fields', () => {
		it('beginStep preserved', () => {
			const event = createTemplateEndEvent({
				beginStep: 7,
			});
			expect(event.beginStep).toBe(7);
		});
	});
});
