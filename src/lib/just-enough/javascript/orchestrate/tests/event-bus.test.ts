import { describe, expect, it } from 'vitest';

import createEventBus from '../event-bus.js';

describe('createEventBus', () => {
	describe('Zero — empty bus: no listeners registered', () => {
		it('dispatch of lens-switched returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				}),
			).not.toThrow();
		});

		it('dispatch of mode-changed returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('mode-changed', { from: 'editor', to: 'lens' }),
			).not.toThrow();
		});
	});
});
