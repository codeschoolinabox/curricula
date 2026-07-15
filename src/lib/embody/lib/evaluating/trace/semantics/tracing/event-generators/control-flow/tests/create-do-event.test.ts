import { describe, expect, it } from 'vitest';

import createDoEvent from '../create-do-event.js';

describe('createDoEvent', () => {
	it('category is loop', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.category).toBe('loop');
	});

	it('event is do', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.event).toBe('do');
	});

	it('kind is always doWhile', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.kind).toBe('doWhile');
	});

	describe('scopeCreationStep threaded', () => {
		it('step 3', () => {
			const event = createDoEvent({ scopeCreationStep: 3 });
			expect(event.scopeCreationStep).toBe(3);
		});

		it('step 7', () => {
			const event = createDoEvent({ scopeCreationStep: 7 });
			expect(event.scopeCreationStep).toBe(7);
		});
	});

	it('no label field', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event).not.toHaveProperty('label');
	});
});
