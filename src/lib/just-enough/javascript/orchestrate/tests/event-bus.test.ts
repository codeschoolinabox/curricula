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

	describe('Boundary — unsubscribe', () => {
		it('unsubscribed listener does not fire on subsequent dispatch', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.unsubscribe('lens-switched', listener);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).not.toHaveBeenCalled();
		});

		it('unsubscribing one listener does not affect a concurrently subscribed listener', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			bus.subscribe('lens-switched', listenerA);
			bus.subscribe('lens-switched', listenerB);
			bus.unsubscribe('lens-switched', listenerA);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listenerB).toHaveBeenCalledTimes(1);
		});

		it('the teardown returned from subscribe removes the listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const teardown = bus.subscribe('lens-switched', listener);
			teardown();
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).not.toHaveBeenCalled();
		});

		it('calling the teardown twice does not re-register the listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const teardown = bus.subscribe('lens-switched', listener);
			teardown();
			teardown();
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).not.toHaveBeenCalled();
		});

		it('unsubscribing a listener that was never registered does not throw', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			expect(() => bus.unsubscribe('lens-switched', listener)).not.toThrow();
		});

		it('unsubscribing a listener from a different event than it was registered to does not remove it', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.unsubscribe('mode-changed', listener);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe('Exception — thrown listener', () => {
		it('throw inside a listener does not propagate to the dispatch caller', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				bus.subscribe('lens-switched', function thrower() {
					throw new Error('boom');
				});
				expect(() =>
					bus.dispatch('lens-switched', {
						previous: null,
						next: 'test-lens',
						source: 'initial',
					}),
				).not.toThrow();
			} finally {
				warn.mockRestore();
			}
		});

		it('throw inside a listener triggers a console.warn', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				bus.subscribe('lens-switched', function thrower() {
					throw new Error('boom');
				});
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				});
				expect(warn).toHaveBeenCalledTimes(1);
			} finally {
				warn.mockRestore();
			}
		});

		it('console.warn receives the thrown error as an argument', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const error = new Error('boom');
			try {
				bus.subscribe('lens-switched', function thrower() {
					throw error;
				});
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				});
				expect(warn).toHaveBeenCalledWith(expect.anything(), error);
			} finally {
				warn.mockRestore();
			}
		});

		it('a thrown listener does not prevent subsequent listeners from firing', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const subsequent = vi.fn();
				bus.subscribe('lens-switched', function thrower() {
					throw new Error('boom');
				});
				bus.subscribe('lens-switched', subsequent);
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				});
				expect(subsequent).toHaveBeenCalledTimes(1);
			} finally {
				warn.mockRestore();
			}
		});

		it('two thrown listeners produce two console.warn calls', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				bus.subscribe('lens-switched', function throwerA() {
					throw new Error('boom A');
				});
				bus.subscribe('lens-switched', function throwerB() {
					throw new Error('boom B');
				});
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				});
				expect(warn).toHaveBeenCalledTimes(2);
			} finally {
				warn.mockRestore();
			}
		});
	});
});
