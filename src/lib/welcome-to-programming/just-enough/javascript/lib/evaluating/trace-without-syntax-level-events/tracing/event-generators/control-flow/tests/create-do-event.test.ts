import { describe, expect, it } from 'vitest';

import createDoEvent from '../create-do-event.js';

describe('createDoEvent', () => {
	it('category is controlFlow', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.category).toBe('controlFlow');
	});

	it('event is do', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.event).toBe('do');
	});

	it('kind is always doWhile', () => {
		const event = createDoEvent({ scopeCreationStep: 3 });
		expect(event.kind).toBe('doWhile');
	});
});
