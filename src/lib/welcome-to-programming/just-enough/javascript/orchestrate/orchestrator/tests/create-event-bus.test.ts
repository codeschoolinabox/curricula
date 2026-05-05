/**
 * @file Unit tests for `createEventBus`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces → Simple.
 * No E (Exceptions) — the factory itself has no failure modes; listener
 * throws are tested under I (interfaces) since catching-and-warning is
 * part of the contract surface.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import createEventBus from '../create-event-bus.js';
import type { SnippetChangedPayload } from '../types.js';

describe('createEventBus', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Z — fresh bus', () => {
		it('dispatch with no subscribers is a no-op (no throw)', () => {
			const bus = createEventBus();

			expect(() =>
				bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' }),
			).not.toThrow();
		});

		it('clear on a fresh bus is a no-op (no throw)', () => {
			const bus = createEventBus();

			expect(() => bus.clear()).not.toThrow();
		});
	});

	describe('O — one listener', () => {
		it('dispatch invokes the subscribed listener with the payload', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			const payload: SnippetChangedPayload = { snippet: 'x', source: 'test' };
			bus.subscribe('snippet-changed', listener);

			bus.dispatch('snippet-changed', payload);

			expect(listener).toHaveBeenCalledWith(payload);
		});

		it('unsubscribed listener is not invoked by subsequent dispatch', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('snippet-changed', listener);
			bus.unsubscribe('snippet-changed', listener);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('M — multiple listeners', () => {
		it('all listeners on the same event fire on dispatch', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			bus.subscribe('snippet-changed', listenerA);
			bus.subscribe('snippet-changed', listenerB);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(listenerA).toHaveBeenCalledTimes(1);
		});

		it('second of two listeners also fires', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			bus.subscribe('snippet-changed', listenerA);
			bus.subscribe('snippet-changed', listenerB);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(listenerB).toHaveBeenCalledTimes(1);
		});

		it('listeners fire in registration order', () => {
			const bus = createEventBus();
			const calls: string[] = [];
			bus.subscribe('snippet-changed', () => calls.push('A'));
			bus.subscribe('snippet-changed', () => calls.push('B'));
			bus.subscribe('snippet-changed', () => calls.push('C'));

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(calls).toEqual(['A', 'B', 'C']);
		});

		it('listeners on different events are independent', () => {
			const bus = createEventBus();
			const snippetListener = vi.fn();
			const resetListener = vi.fn();
			bus.subscribe('snippet-changed', snippetListener);
			bus.subscribe('state-reset', resetListener);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(resetListener).not.toHaveBeenCalled();
		});
	});

	describe('B — boundaries', () => {
		it('subscribing the same listener twice invokes it only once per dispatch', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('snippet-changed', listener);
			bus.subscribe('snippet-changed', listener);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('unsubscribing a listener that was never subscribed is a no-op', () => {
			const bus = createEventBus();
			const listener = vi.fn();

			expect(() => bus.unsubscribe('snippet-changed', listener)).not.toThrow();
		});

		it('dispatch passes the exact payload reference to the listener', () => {
			const bus = createEventBus();
			const received: SnippetChangedPayload[] = [];
			const payload: SnippetChangedPayload = { snippet: 'x', source: 'test' };
			bus.subscribe('snippet-changed', (p) => {
				received.push(p);
			});

			bus.dispatch('snippet-changed', payload);

			expect(received[0]).toBe(payload);
		});

		it('clear removes all listeners across all events', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			bus.subscribe('snippet-changed', listenerA);
			bus.subscribe('state-reset', listenerB);

			bus.clear();
			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });
			bus.dispatch('state-reset', { snippet: 'x' });

			expect(listenerA).not.toHaveBeenCalled();
		});

		it('clear also clears listeners for other event names', () => {
			const bus = createEventBus();
			const listenerA = vi.fn();
			const listenerB = vi.fn();
			bus.subscribe('snippet-changed', listenerA);
			bus.subscribe('state-reset', listenerB);

			bus.clear();
			bus.dispatch('state-reset', { snippet: 'x' });

			expect(listenerB).not.toHaveBeenCalled();
		});
	});

	describe('I — interface contract', () => {
		it('a thrown listener is caught, console.warn is emitted with the error', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const bus = createEventBus();
			const boomError = new Error('boom');
			bus.subscribe('snippet-changed', () => {
				throw boomError;
			});

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('snippet-changed'),
				boomError,
			);
		});

		it('a thrown listener does not abort remaining listeners', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const bus = createEventBus();
			const after = vi.fn();
			bus.subscribe('snippet-changed', () => {
				throw new Error('boom');
			});
			bus.subscribe('snippet-changed', after);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(after).toHaveBeenCalledTimes(1);
		});

		it('re-entrant dispatch (listener dispatches a nested event) fires depth-first', () => {
			const bus = createEventBus();
			const calls: string[] = [];
			bus.subscribe('snippet-changed', () => {
				calls.push('outer-before-nested');
				bus.dispatch('state-reset', { snippet: 'nested' });
				calls.push('outer-after-nested');
			});
			bus.subscribe('state-reset', () => {
				calls.push('nested');
			});

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(calls).toEqual([
				'outer-before-nested',
				'nested',
				'outer-after-nested',
			]);
		});

		it('a listener that subscribes a new listener during dispatch does NOT fire the new one in this dispatch (snapshot)', () => {
			const bus = createEventBus();
			const added = vi.fn();
			bus.subscribe('snippet-changed', () => {
				bus.subscribe('snippet-changed', added);
			});

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(added).not.toHaveBeenCalled();
		});

		it('a listener subscribed during dispatch DOES fire on the next dispatch', () => {
			const bus = createEventBus();
			const added = vi.fn();
			let subscribedAlready = false;
			bus.subscribe('snippet-changed', () => {
				if (!subscribedAlready) {
					bus.subscribe('snippet-changed', added);
					subscribedAlready = true;
				}
			});
			bus.dispatch('snippet-changed', { snippet: 'first', source: 'test' });

			bus.dispatch('snippet-changed', { snippet: 'second', source: 'test' });

			expect(added).toHaveBeenCalledTimes(1);
		});

		it('a listener that unsubscribes another listener during dispatch still fires the other in this dispatch (snapshot)', () => {
			const bus = createEventBus();
			const second = vi.fn();
			bus.subscribe('snippet-changed', () => {
				bus.unsubscribe('snippet-changed', second);
			});
			bus.subscribe('snippet-changed', second);

			bus.dispatch('snippet-changed', { snippet: 'x', source: 'test' });

			expect(second).toHaveBeenCalledTimes(1);
		});

		it('a listener unsubscribed during dispatch does NOT fire on the next dispatch', () => {
			const bus = createEventBus();
			const second = vi.fn();
			bus.subscribe('snippet-changed', () => {
				bus.unsubscribe('snippet-changed', second);
			});
			bus.subscribe('snippet-changed', second);
			bus.dispatch('snippet-changed', { snippet: 'first', source: 'test' });

			bus.dispatch('snippet-changed', { snippet: 'second', source: 'test' });

			expect(second).toHaveBeenCalledTimes(1);
		});

		it('the returned bus is frozen', () => {
			const bus = createEventBus();

			expect(Object.isFrozen(bus)).toBe(true);
		});
	});

	describe('S — full round-trip', () => {
		it('subscribe → dispatch → unsubscribe → dispatch → clear → dispatch produces exactly one invocation', () => {
			const bus = createEventBus();
			const listener = vi.fn();
			bus.subscribe('snippet-changed', listener);
			bus.dispatch('snippet-changed', { snippet: '1', source: 'test' });
			bus.unsubscribe('snippet-changed', listener);
			bus.dispatch('snippet-changed', { snippet: '2', source: 'test' });
			bus.clear();
			bus.dispatch('snippet-changed', { snippet: '3', source: 'test' });

			expect(listener).toHaveBeenCalledTimes(1);
		});
	});
});
