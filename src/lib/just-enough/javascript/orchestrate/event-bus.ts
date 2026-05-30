/**
 * @file `createEventBus()` — factory for per-instance typed pub/sub buses
 * used inside the orchestrator for INTERNAL coordination only.
 *
 * Each `<StudyLenses>` mount owns one bus, held in a `useRef`. The bus is
 * never exposed via a `subscribe` / `onEvent` prop on the public surface
 * (see [`./DOCS.md`](./DOCS.md) § Internal event taxonomy § Why
 * internal-only).
 *
 * Contract (full text in [`./DOCS.md`](./DOCS.md) § Internal event taxonomy
 * § Contract): per-instance isolation; synchronous dispatch in registration
 * order; thrown listeners caught + `console.warn`; depth-first re-entrancy;
 * typed event/payload mapping; listener-identity-based registration (safe
 * under React StrictMode subscribe → cleanup → subscribe pattern); `clear()`
 * as a test-isolation affordance.
 *
 * @remarks This module is a stateful-pattern exception to the codebase's
 * no-mutable-closures rule — the bus's `dispatch` / `subscribe` /
 * `unsubscribe` methods close over a mutable listener store. The exception
 * is the same one that covers low-level library-interfacing code (per
 * [`../../../../../DEV.md`](../../../../../DEV.md) § No Mutable Closures).
 *
 * **Freeze scope**: the bus's own method properties are frozen in place
 * (stable references for the lifetime of the holding `useRef`). The
 * mutable state is the internal listener store, which is a closure
 * variable, NOT a property on the returned object. Freezing the bus
 * object is therefore structurally compatible with the stateful-pattern
 * exception above.
 */

import { freezeInPlace } from '../../../utils/freeze.js';

import type {
	EventBus,
	EventListener,
	EventName,
	EventPayload,
} from './types.js';

/**
 * Creates a new per-instance EventBus.
 *
 * @returns A fresh bus with no listeners. Dispatching on an empty bus is a
 * synchronous no-op. Two `createEventBus()` calls produce isolated bus
 * instances that do not share listeners.
 *
 * @remarks The bus's method properties are frozen (stable references for
 * the lifetime of the holding `useRef`). The internal listener store is a
 * closure variable, NOT a property on the bus object, so `freezeInPlace`
 * does not prevent listener registration — see the file-level `@remarks`
 * for the stateful-pattern exception.
 */
function createEventBus(): EventBus {
	// Mutable listener store — closure variable per the stateful-pattern
	// exception (DEV.md § 8). Per-event-name Sets keep listener registration
	// type-safe (each Set is typed against its specific event's listener
	// signature). Set semantics make re-subscribing the same listener
	// idempotent — the Listener identity-based registration contract in
	// DOCS.md § Internal event taxonomy § Contract.
	type ListenerStore = {
		// eslint-disable-next-line functional/prefer-readonly-type -- stateful bus per DEV.md § 8
		'lens-switched': Set<EventListener<'lens-switched'>>;
		// eslint-disable-next-line functional/prefer-readonly-type -- stateful bus per DEV.md § 8
		'mode-changed': Set<EventListener<'mode-changed'>>;
	};
	const listenersByEvent: ListenerStore = {
		'lens-switched': new Set(),
		'mode-changed': new Set(),
	};

	const bus: EventBus = {
		dispatch<N extends EventName>(name: N, payload: EventPayload<N>): void {
			// Snapshot listeners at dispatch time — each call to dispatch
			// captures its own array independent of any in-flight mutations.
			// Listeners that subscribe new listeners or unsubscribe siblings
			// from inside their own body affect only future dispatches, not
			// the in-flight loop. Re-entrant dispatches take their own
			// snapshot at inner-dispatch time, so the depth-first contract
			// holds per-call rather than per-root.
			const listeners = [...listenersByEvent[name]];
			for (const listener of listeners) {
				try {
					// Cast is safe: each Set in ListenerStore only ever holds
					// EventListener<N> for its own key, by construction at the
					// subscribe boundary. TypeScript can't narrow through a
					// generic indexed access on the discriminated record, so
					// the cast bridges the gap.
					(listener as EventListener<N>)(payload);
				} catch (error) {
					console.warn(
						`EventBus: listener for "${name}" threw; subsequent listeners still fire`,
						error,
					);
				}
			}
		},
		subscribe<N extends EventName>(
			name: N,
			listener: EventListener<N>,
		): () => void {
			// eslint-disable-next-line functional/immutable-data, functional/prefer-readonly-type -- stateful bus per DEV.md § 8
			(listenersByEvent[name] as Set<EventListener<N>>).add(listener);
			// Per-call teardown closure: captures (name, listener) so the
			// caller's `useEffect` cleanup can drop the registration.
			// Set.delete is idempotent — calling teardown twice removes
			// the listener on the first call and is a no-op on the second
			// (Listener identity-based registration contract).
			function teardown(): void {
				// eslint-disable-next-line functional/immutable-data, functional/prefer-readonly-type -- stateful bus per DEV.md § 8
				(listenersByEvent[name] as Set<EventListener<N>>).delete(listener);
			}
			return teardown;
		},
		unsubscribe<N extends EventName>(
			name: N,
			listener: EventListener<N>,
		): void {
			// eslint-disable-next-line functional/immutable-data, functional/prefer-readonly-type -- stateful bus per DEV.md § 8
			(listenersByEvent[name] as Set<EventListener<N>>).delete(listener);
		},
		clear(): void {
			// eslint-disable-next-line functional/immutable-data -- stateful bus per DEV.md § 8
			listenersByEvent['lens-switched'].clear();
			// eslint-disable-next-line functional/immutable-data -- stateful bus per DEV.md § 8
			listenersByEvent['mode-changed'].clear();
		},
	};
	return freezeInPlace(bus);
}

export default createEventBus;
