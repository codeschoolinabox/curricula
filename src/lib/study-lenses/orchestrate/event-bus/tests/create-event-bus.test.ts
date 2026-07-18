import { afterEach, describe, expect, it, vi } from 'vitest';

import createEventBus from '../create-event-bus.js';

describe('createEventBus', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Zero — empty bus: no listeners registered', () => {
		it('dispatch of lens-opened returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('lens-opened', { lens: 'test-lens' }),
			).not.toThrow();
		});

		it('dispatch of level-selected returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('level-selected', { key: 'jej' }),
			).not.toThrow();
		});

		it('dispatch of posture-toggled returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('posture-toggled', { strict: false }),
			).not.toThrow();
		});

		it('dispatch of type-toggled returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('type-toggled', { type: 'module' }),
			).not.toThrow();
		});

		it('dispatch of settled returns without throwing', () => {
			const bus = createEventBus();
			expect(() =>
				bus.dispatch('settled', { source: 'x = 1;', type: 'module' }),
			).not.toThrow();
		});
	});

	describe('One — single subscribed listener', () => {
		it('dispatch invokes the listener exactly once', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('listener receives the dispatched payload', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('posture-toggled', listener);
			bus.dispatch('posture-toggled', { strict: true });
			expect(listener).toHaveBeenCalledWith({ strict: true });
		});
	});

	describe('Many — multiple listeners on the same event', () => {
		it('listeners fire in registration order', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			bus.subscribe('lens-opened', function listenerA() {
				calls.push('A');
			});
			bus.subscribe('lens-opened', function listenerB() {
				calls.push('B');
			});
			bus.subscribe('lens-opened', function listenerC() {
				calls.push('C');
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(calls).toEqual(['A', 'B', 'C']);
		});

		it('subscribing the same listener twice does not duplicate invocations', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			bus.subscribe('lens-opened', listener);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe('Many — listeners spanning multiple events', () => {
		it('dispatching level-selected invokes the level-selected listener', () => {
			const bus = createEventBus();
			const lensOpenedListener = vi.fn();
			const levelSelectedListener = vi.fn();
			bus.subscribe('lens-opened', lensOpenedListener);
			bus.subscribe('level-selected', levelSelectedListener);
			bus.dispatch('level-selected', { key: 'jej' });
			expect(levelSelectedListener).toHaveBeenCalledTimes(1);
		});

		it('dispatching level-selected does not invoke a lens-opened listener', () => {
			const bus = createEventBus();
			const lensOpenedListener = vi.fn();
			const levelSelectedListener = vi.fn();
			bus.subscribe('lens-opened', lensOpenedListener);
			bus.subscribe('level-selected', levelSelectedListener);
			bus.dispatch('level-selected', { key: 'jej' });
			expect(lensOpenedListener).not.toHaveBeenCalled();
		});

		it('dispatching type-toggled delivers its payload to the type-toggled listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('type-toggled', listener);
			bus.dispatch('type-toggled', { type: 'module' });
			expect(listener).toHaveBeenCalledWith({ type: 'module' });
		});

		it('dispatching settled delivers its payload to the settled listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('settled', listener);
			bus.dispatch('settled', { source: 'x = 1;', type: 'module' });
			expect(listener).toHaveBeenCalledWith({
				source: 'x = 1;',
				type: 'module',
			});
		});
	});

	describe('Boundary — lens-opened null payload', () => {
		it('a lens-opened listener receives a null lens payload', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			bus.dispatch('lens-opened', { lens: null });
			expect(listener).toHaveBeenCalledWith({ lens: null });
		});
	});

	describe('Boundary — teardown (idempotent unsubscribe)', () => {
		it('the teardown returned from subscribe removes the listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const teardown = bus.subscribe('lens-opened', listener);
			teardown();
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).not.toHaveBeenCalled();
		});

		it('tearing down one listener does not affect a concurrently subscribed listener', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			const teardownA = bus.subscribe('lens-opened', listenerA);
			bus.subscribe('lens-opened', listenerB);
			teardownA();
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listenerB).toHaveBeenCalledTimes(1);
		});

		it('calling the teardown twice does not re-register the listener', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const teardown = bus.subscribe('lens-opened', listener);
			teardown();
			teardown();
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).not.toHaveBeenCalled();
		});

		it('the teardown from a duplicate subscribe of the same listener removes it', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			const teardownFromDuplicate = bus.subscribe('lens-opened', listener);
			teardownFromDuplicate();
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).not.toHaveBeenCalled();
		});

		it('a teardown removes its listener from only the event it subscribed to', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const teardownOnLensOpened = bus.subscribe('lens-opened', listener);
			bus.subscribe('level-selected', listener);
			teardownOnLensOpened();
			bus.dispatch('level-selected', { key: 'jej' });
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe('Exception — thrown listener', () => {
		it('throw inside a listener does not propagate to the dispatch caller', () => {
			const bus = createEventBus();
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			bus.subscribe('lens-opened', function thrower() {
				throw new Error('boom');
			});
			expect(() =>
				bus.dispatch('lens-opened', { lens: 'test-lens' }),
			).not.toThrow();
		});

		it('throw inside a listener triggers a console.warn', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			bus.subscribe('lens-opened', function thrower() {
				throw new Error('boom');
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(warn).toHaveBeenCalledTimes(1);
		});

		it('console.warn receives the thrown error as an argument', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const error = new Error('boom');
			bus.subscribe('lens-opened', function thrower() {
				throw error;
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(warn).toHaveBeenCalledWith(expect.anything(), error);
		});

		it('a thrown listener does not prevent subsequent listeners from firing', () => {
			const bus = createEventBus();
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const subsequent = vi.fn();
			bus.subscribe('lens-opened', function thrower() {
				throw new Error('boom');
			});
			bus.subscribe('lens-opened', subsequent);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(subsequent).toHaveBeenCalledTimes(1);
		});

		it('two thrown listeners produce two console.warn calls', () => {
			const bus = createEventBus();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			bus.subscribe('lens-opened', function throwerA() {
				throw new Error('boom A');
			});
			bus.subscribe('lens-opened', function throwerB() {
				throw new Error('boom B');
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(warn).toHaveBeenCalledTimes(2);
		});
	});

	describe('Interface — re-entrant dispatch and mid-dispatch mutation', () => {
		it('inner dispatch completes before the outer dispatch resumes (depth-first)', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			bus.subscribe('lens-opened', function outerA() {
				calls.push('outer-A');
				bus.dispatch('level-selected', { key: 'jej' });
				calls.push('outer-A-after-inner');
			});
			bus.subscribe('level-selected', function innerListener() {
				calls.push('inner');
			});
			bus.subscribe('lens-opened', function outerB() {
				calls.push('outer-B');
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
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
			bus.subscribe('lens-opened', function subscribesLateJoiner() {
				bus.subscribe('lens-opened', lateJoiner);
			});
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(lateJoiner).not.toHaveBeenCalled();
		});

		it('a listener that tears down a sibling mid-dispatch does not prevent the sibling from firing in the current dispatch', () => {
			const bus = createEventBus();
			const sibling = vi.fn();
			const siblingTeardown: { call?: () => void } = {};
			bus.subscribe('lens-opened', function tearsDownSibling() {
				siblingTeardown.call?.();
			});
			siblingTeardown.call = bus.subscribe('lens-opened', sibling);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(sibling).toHaveBeenCalledTimes(1);
		});

		it('a thrown listener inside an inner dispatch does not abort the outer dispatch loop', () => {
			const bus = createEventBus();
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const subsequentOuter = vi.fn();
			bus.subscribe('lens-opened', function outerListener() {
				bus.dispatch('level-selected', { key: 'jej' });
			});
			bus.subscribe('level-selected', function innerThrower() {
				throw new Error('inner boom');
			});
			bus.subscribe('lens-opened', subsequentOuter);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(subsequentOuter).toHaveBeenCalledTimes(1);
		});

		it('a re-entrant same-event dispatch takes its own snapshot at inner-dispatch time', () => {
			const calls: string[] = [];
			const bus = createEventBus();
			let alreadyReDispatched = false;
			function lateJoiner(): void {
				calls.push('lateJoiner');
			}
			bus.subscribe('lens-opened', function outerListener() {
				calls.push('outer-pre');
				if (!alreadyReDispatched) {
					alreadyReDispatched = true;
					bus.subscribe('lens-opened', lateJoiner);
					bus.dispatch('lens-opened', { lens: 'inner' });
				}
				calls.push('outer-post');
			});
			bus.dispatch('lens-opened', { lens: 'outer' });
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
			busA.subscribe('lens-opened', listenerOnA);
			busB.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listenerOnA).not.toHaveBeenCalled();
		});

		it('clearing bus A does not affect a listener on bus B', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const listenerOnB = vi.fn();
			busB.subscribe('lens-opened', listenerOnB);
			busA.clear();
			busB.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listenerOnB).toHaveBeenCalledTimes(1);
		});

		it('the same listener subscribed on two buses fires once per dispatch on each', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const shared = vi.fn();
			busA.subscribe('lens-opened', shared);
			busB.subscribe('lens-opened', shared);
			busA.dispatch('lens-opened', { lens: 'test-lens' });
			busB.dispatch('lens-opened', { lens: 'test-lens' });
			expect(shared).toHaveBeenCalledTimes(2);
		});
	});

	describe('Simple — clear', () => {
		it('after clear, a previously subscribed listener does not fire', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			bus.clear();
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).not.toHaveBeenCalled();
		});

		it('clear on a bus with no listeners does not throw', () => {
			const bus = createEventBus();
			expect(() => bus.clear()).not.toThrow();
		});

		it('a teardown retained across clear does not throw when called', () => {
			const bus = createEventBus();
			const teardown = bus.subscribe('lens-opened', vi.fn());
			bus.clear();
			expect(() => teardown()).not.toThrow();
		});

		it('after clear, a newly subscribed listener fires on subsequent dispatch', () => {
			const bus = createEventBus();
			bus.clear();
			const listener = vi.fn();
			bus.subscribe('lens-opened', listener);
			bus.dispatch('lens-opened', { lens: 'test-lens' });
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('clear on bus A does not remove a listener registered on bus B', () => {
			const busA = createEventBus();
			const busB = createEventBus();
			const shared = vi.fn();
			busA.subscribe('lens-opened', shared);
			busB.subscribe('lens-opened', shared);
			busA.clear();
			busB.dispatch('lens-opened', { lens: 'test-lens' });
			expect(shared).toHaveBeenCalledTimes(1);
		});
	});
});
