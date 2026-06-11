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

	describe('Interface — re-entrant dispatch and mid-dispatch mutation', () => {
		it('inner dispatch completes before the outer dispatch resumes (depth-first)', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			bus.subscribe('lens-switched', function outerA() {
				calls.push('outer-A');
				bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
				calls.push('outer-A-after-inner');
			});
			bus.subscribe('mode-changed', function innerListener() {
				calls.push('inner');
			});
			bus.subscribe('lens-switched', function outerB() {
				calls.push('outer-B');
			});
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(calls).toEqual([
				'outer-A',
				'inner',
				'outer-A-after-inner',
				'outer-B',
			]);
		});

		it('a listener that subscribes a new listener mid-dispatch does not cause the new listener to fire in the same dispatch', () => {
			const bus = createEventBus();
			const lateJoiner = vi.fn();
			bus.subscribe('lens-switched', function subscribesLateJoiner() {
				bus.subscribe('lens-switched', lateJoiner);
			});
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(lateJoiner).not.toHaveBeenCalled();
		});

		it('a listener that unsubscribes a sibling mid-dispatch does not prevent the sibling from firing in the current dispatch', () => {
			const bus = createEventBus();
			const sibling = vi.fn();
			bus.subscribe('lens-switched', function unsubscribesSibling() {
				bus.unsubscribe('lens-switched', sibling);
			});
			bus.subscribe('lens-switched', sibling);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(sibling).toHaveBeenCalledTimes(1);
		});

		it('a thrown listener inside an inner dispatch does not abort the outer dispatch loop', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const subsequentOuter = vi.fn();
				bus.subscribe('lens-switched', function outerListener() {
					bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
				});
				bus.subscribe('mode-changed', function innerThrower() {
					throw new Error('inner boom');
				});
				bus.subscribe('lens-switched', subsequentOuter);
				bus.dispatch('lens-switched', {
					previous: null,
					next: 'test-lens',
					source: 'initial',
				});
				expect(subsequentOuter).toHaveBeenCalledTimes(1);
			} finally {
				warn.mockRestore();
			}
		});

		it('a re-entrant same-event dispatch takes its own snapshot at inner-dispatch time', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			let alreadyReDispatched = false;
			function lateJoiner(): void {
				calls.push('lateJoiner');
			}
			bus.subscribe('lens-switched', function outerListener() {
				calls.push('outer-pre');
				if (!alreadyReDispatched) {
					alreadyReDispatched = true;
					bus.subscribe('lens-switched', lateJoiner);
					bus.dispatch('lens-switched', {
						previous: null,
						next: 'inner',
						source: 'initial',
					});
				}
				calls.push('outer-post');
			});
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'outer',
				source: 'initial',
			});
			expect(calls).toEqual([
				'outer-pre',
				'outer-pre',
				'outer-post',
				'lateJoiner',
				'outer-post',
			]);
		});
	});

	describe('Boundary — per-instance isolation', () => {
		it('a listener subscribed on bus A does not fire when bus B dispatches', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const listenerOnA = vi.fn();
			busA.subscribe('lens-switched', listenerOnA);
			busB.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listenerOnA).not.toHaveBeenCalled();
		});

		it('clearing or unsubscribing on bus A does not affect bus B', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const listenerOnB = vi.fn();
			busB.subscribe('lens-switched', listenerOnB);
			busA.clear();
			busA.unsubscribe('lens-switched', listenerOnB);
			busB.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listenerOnB).toHaveBeenCalledTimes(1);
		});

		it('the same listener subscribed on two buses fires once per dispatch on each', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const shared = vi.fn();
			busA.subscribe('lens-switched', shared);
			busB.subscribe('lens-switched', shared);
			busA.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			busB.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(shared).toHaveBeenCalledTimes(2);
		});
	});

	describe('Simple — clear', () => {
		it('after clear, a previously subscribed lens-switched listener does not fire', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.clear();
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).not.toHaveBeenCalled();
		});

		it('after clear, a previously subscribed mode-changed listener does not fire', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('mode-changed', listener);
			bus.clear();
			bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
			expect(listener).not.toHaveBeenCalled();
		});

		it('clear on a bus with no listeners does not throw', () => {
			const bus = createEventBus();
			expect(() => bus.clear()).not.toThrow();
		});

		it('after clear, a newly subscribed listener fires on subsequent dispatch', () => {
			const bus = createEventBus();
			bus.clear();
			const listener = vi.fn();
			bus.subscribe('lens-switched', listener);
			bus.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('clear on bus A does not remove a listener registered on bus B', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const shared = vi.fn();
			busA.subscribe('lens-switched', shared);
			busB.subscribe('lens-switched', shared);
			busA.clear();
			busB.dispatch('lens-switched', {
				previous: null,
				next: 'test-lens',
				source: 'initial',
			});
			expect(shared).toHaveBeenCalledTimes(1);
		});
	});
});
