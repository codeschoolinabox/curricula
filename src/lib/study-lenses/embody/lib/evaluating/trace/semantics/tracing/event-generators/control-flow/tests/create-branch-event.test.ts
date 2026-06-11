import { describe, expect, it } from 'vitest';

import createBranchEvent from '../create-branch-event.js';

describe('createBranchEvent', () => {
	it('category is controlFlow', () => {
		const event = createBranchEvent({
			branch: 'consequent',
			scopeCreationStep: 0,
		});
		expect(event.category).toBe('controlFlow');
	});

	it('kind is always conditional', () => {
		const event = createBranchEvent({
			branch: 'alternate',
			scopeCreationStep: 0,
		});
		expect(event.kind).toBe('conditional');
	});

	it('branch consequent', () => {
		const event = createBranchEvent({
			branch: 'consequent',
			scopeCreationStep: 0,
		});
		expect(event.branch).toBe('consequent');
	});

	it('branch none', () => {
		const event = createBranchEvent({ branch: 'none', scopeCreationStep: 0 });
		expect(event.branch).toBe('none');
	});
});
