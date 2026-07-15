import { describe, expect, it } from 'vitest';

import createBranchEvent from '../create-branch-event.js';

describe('createBranchEvent', () => {
	it('category is conditional', () => {
		const event = createBranchEvent({
			branch: 'consequent',
			scopeCreationStep: 0,
		});
		expect(event.category).toBe('conditional');
	});

	it('kind is always if', () => {
		const event = createBranchEvent({
			branch: 'alternate',
			scopeCreationStep: 0,
		});
		expect(event.kind).toBe('if');
	});

	it('event is branch', () => {
		const event = createBranchEvent({
			branch: 'consequent',
			scopeCreationStep: 0,
		});
		expect(event.event).toBe('branch');
	});

	describe('branch direction threaded', () => {
		it('consequent', () => {
			const event = createBranchEvent({
				branch: 'consequent',
				scopeCreationStep: 0,
			});
			expect(event.branch).toBe('consequent');
		});

		it('alternate', () => {
			const event = createBranchEvent({
				branch: 'alternate',
				scopeCreationStep: 0,
			});
			expect(event.branch).toBe('alternate');
		});

		it('none', () => {
			const event = createBranchEvent({ branch: 'none', scopeCreationStep: 0 });
			expect(event.branch).toBe('none');
		});
	});

	it('scopeCreationStep threaded', () => {
		const event = createBranchEvent({ branch: 'consequent', scopeCreationStep: 9 });
		expect(event.scopeCreationStep).toBe(9);
	});

	it('no label field', () => {
		const event = createBranchEvent({
			branch: 'consequent',
			scopeCreationStep: 0,
		});
		expect(event).not.toHaveProperty('label');
	});
});
