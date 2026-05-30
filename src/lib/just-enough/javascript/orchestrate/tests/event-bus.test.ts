import { describe, expect, it, vi } from 'vitest';

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

	describe('One — single subscribed listener', () => {
		it('dispatch invokes the listener exactly once', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('listener receives the dispatched payload', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('mode-changed', listener);
			bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
			expect(listener).toHaveBeenCalledWith({ from: 'editor', to: 'lens' });
		});
	});
});
