import { describe, expect, it } from 'vitest';

import createForIncrementEvent from '../create-for-increment-event.js';

describe('createForIncrementEvent', () => {
	it('category is loop', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.category).toBe('loop');
	});

	it('event is increment', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.event).toBe('increment');
	});

	it('kind is always for', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.kind).toBe('for');
	});

	describe('scopeCreationStep threaded', () => {
		it('step 5', () => {
			const event = createForIncrementEvent({ scopeCreationStep: 5 });
			expect(event.scopeCreationStep).toBe(5);
		});

		it('step 1', () => {
			const event = createForIncrementEvent({ scopeCreationStep: 1 });
			expect(event.scopeCreationStep).toBe(1);
		});
	});

	it('no label field', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event).not.toHaveProperty('label');
	});
});
