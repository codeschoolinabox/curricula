import { describe, expect, it } from 'vitest';

import createJumpEvent from '../create-jump-event.js';

describe('createJumpEvent', () => {
	it('break event', () => {
		const event = createJumpEvent({
			kind: 'break',
			target: 'while',
			targetScopeCreationStep: 3,
		});
		expect(event.category).toBe('controlFlow');
		expect(event.event).toBe('jump');
		expect(event.kind).toBe('break');
		expect(event.target).toBe('while');
	});

	it('continue event', () => {
		const event = createJumpEvent({
			kind: 'continue',
			target: 'for',
			targetScopeCreationStep: 5,
		});
		expect(event.kind).toBe('continue');
	});

	it('label present when provided', () => {
		const event = createJumpEvent({
			kind: 'break',
			target: 'while',
			targetScopeCreationStep: 3,
			label: 'outer',
		});
		expect(event.label).toBe('outer');
	});
});
