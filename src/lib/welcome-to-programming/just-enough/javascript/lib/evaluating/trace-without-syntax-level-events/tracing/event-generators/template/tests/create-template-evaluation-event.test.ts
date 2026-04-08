import { describe, expect, it } from 'vitest';

import createTemplateEvaluationEvent from '../create-template-evaluation-event.js';

describe('createTemplateEvaluationEvent', () => {
	describe('category and event', () => {
		it('category is template', () => {
			const event = createTemplateEvaluationEvent({
				index: 0,
				value: { type: 'string', value: 'Alice' },
				beginStep: 5,
			});
			expect(event.category).toBe('template');
		});

		it('event is evaluation', () => {
			const event = createTemplateEvaluationEvent({
				index: 0,
				value: { type: 'string', value: 'Alice' },
				beginStep: 5,
			});
			expect(event.event).toBe('evaluation');
		});
	});

	describe('fields', () => {
		it('index preserved', () => {
			const event = createTemplateEvaluationEvent({
				index: 2,
				value: { type: 'number', value: 42 },
				beginStep: 3,
			});
			expect(event.index).toBe(2);
		});

		it('value preserved', () => {
			const event = createTemplateEvaluationEvent({
				index: 0,
				value: { type: 'string', value: 'test' },
				beginStep: 1,
			});
			expect(event.value).toEqual({ type: 'string', value: 'test' });
		});

		it('beginStep preserved', () => {
			const event = createTemplateEvaluationEvent({
				index: 0,
				value: { type: 'string', value: '' },
				beginStep: 10,
			});
			expect(event.beginStep).toBe(10);
		});
	});

	describe('errors', () => {
		it('throws on negative index', () => {
			expect(() =>
				createTemplateEvaluationEvent({
					index: -1,
					value: { type: 'string', value: '' },
					beginStep: 0,
				}),
			).toThrow();
		});
	});
});
