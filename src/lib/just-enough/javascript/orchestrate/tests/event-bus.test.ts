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

	describe('Many — multiple listeners on the same event', () => {
		it('listeners fire in registration order', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			bus.subscribe('lens-switched', function listenerA() {
				calls.push('A');
			});
			bus.subscribe('lens-switched', function listenerB() {
				calls.push('B');
			});
			bus.subscribe('lens-switched', function listenerC() {
				calls.push('C');
			});
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(calls).toEqual(['A', 'B', 'C']);
		});

		it('subscribing the same listener twice does not duplicate invocations', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.subscribe('lens-switched', listener);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe('Many — listeners spanning multiple events', () => {
		it('dispatching mode-changed invokes the mode-changed listener', () => {
			const bus = createEventBus();
			const lensSwitchedListener = vi.fn();
			const modeChangedListener = vi.fn();
			bus.subscribe('lens-switched', lensSwitchedListener);
			bus.subscribe('mode-changed', modeChangedListener);
			bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
			expect(modeChangedListener).toHaveBeenCalledTimes(1);
		});

		it('dispatching mode-changed does not invoke a lens-switched listener', () => {
			const bus = createEventBus();
			const lensSwitchedListener = vi.fn();
			const modeChangedListener = vi.fn();
			bus.subscribe('lens-switched', lensSwitchedListener);
			bus.subscribe('mode-changed', modeChangedListener);
			bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
			expect(lensSwitchedListener).not.toHaveBeenCalled();
		});
	});
});
