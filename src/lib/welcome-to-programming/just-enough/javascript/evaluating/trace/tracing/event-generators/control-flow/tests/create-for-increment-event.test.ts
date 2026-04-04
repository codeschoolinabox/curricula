import { describe, expect, it } from 'vitest';

import createForIncrementEvent from '../create-for-increment-event.js';

describe('createForIncrementEvent', () => {
	it('category is controlFlow', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.category).toBe('controlFlow');
	});

	it('event is increment', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.event).toBe('increment');
	});

	it('kind is always for', () => {
		const event = createForIncrementEvent({ scopeCreationStep: 5 });
		expect(event.kind).toBe('for');
	});
});
