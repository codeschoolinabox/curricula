import { describe, expect, it } from 'vitest';

import createForInitializeEvent from '../create-for-initialize-event.js';

describe('createForInitializeEvent', () => {
	it('category is controlFlow', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.category).toBe('controlFlow');
	});

	it('event is initialize', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.event).toBe('initialize');
	});

	it('kind is always for', () => {
		const event = createForInitializeEvent({ scopeCreationStep: 5 });
		expect(event.kind).toBe('for');
	});
});
