import { describe, expect, it } from 'vitest';

import createForInitializeEvent from '../create-for-initialize-event.js';

describe('createForInitializeEvent', () => {
	it('category is loop', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.category).toBe('loop');
	});

	it('event is setup', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.event).toBe('setup');
	});

	it('kind is always for', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.kind).toBe('for');
	});

	describe('scopeCreationStep threaded', () => {
		it('step 5', () => {
			const event = createForInitializeEvent({ scopeCreationStep: 5 });
			expect(event.scopeCreationStep).toBe(5);
		});

		it('step 2', () => {
			const event = createForInitializeEvent({ scopeCreationStep: 2 });
			expect(event.scopeCreationStep).toBe(2);
		});
	});

	it('no label field', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event).not.toHaveProperty('label');
	});
});
