// cspell:ignore entrancy

/**
 * @file `createEventBus()` — factory for per-instance typed pub/sub buses used
 * inside the orchestrate region for INTERNAL coordination only.
 *
 * Each mounted instance owns one bus (held in a `useRef`). The bus is never
 * exposed on the host surface — no `subscribe` / `onEvent` prop exists (see
 * [`./README.md`](./README.md) and [`./DOCS.md`](./DOCS.md)).
 *
 * Contract (full text in [`./README.md`](./README.md) § The contract):
 * per-instance isolation; synchronous dispatch in registration order;
 * snapshot-at-dispatch; thrown listeners caught + `console.warn`; depth-first
 * re-entrancy; listener-identity registration with an idempotent
 * subscribe-returned teardown (safe under React StrictMode's
 * subscribe → cleanup → subscribe); `clear()` as a test-isolation affordance.
 *
 * @remarks This module is a stateful-pattern exception to the codebase's
 * no-mutable-closures rule — `dispatch` / `subscribe` / `clear` close over a
 * mutable per-event listener store. That is the library-interfacing exception
 * in [`../../../../DEV.md`](../../../../DEV.md) § 8.
 *
 * **Freeze scope**: `freezeInPlace` freezes the bus's own method properties
 * (stable references for the lifetime of the holding `useRef`). The mutable
 * listener store is a closure variable, NOT a property on the returned object,
 * so it is transient-internal — never frozen, never serialized — and the
 * `Set`-on-frozen-surfaces ban (§ 13) does not reach it.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

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
 * @remarks The bus's method properties are frozen (stable references for the
 * lifetime of the holding `useRef`). The internal listener store is a closure
 * variable, NOT a property on the bus object, so `freezeInPlace` does not
 * prevent listener registration — see the file-level `@remarks` for the
 * stateful-pattern exception.
 */
export default function createEventBus(): EventBus {
	// Register phase's backing state — a mutable listener store, closure
	// variable per the stateful-pattern exception (DEV.md § 8). Per-event-name
	// Sets keep registration type-safe (each Set is typed against its event's
	// listener signature). Set semantics make re-subscribing the same listener
	// idempotent — the listener-identity registration contract in README.md
	// § The contract, including its accepted aliasing edge (DOCS.md
	// § Decisions).
	type ListenerStore = {
		'level-selected': Set<EventListener<'level-selected'>>;
		'posture-toggled': Set<EventListener<'posture-toggled'>>;
		'type-toggled': Set<EventListener<'type-toggled'>>;
		'lens-opened': Set<EventListener<'lens-opened'>>;
		settled: Set<EventListener<'settled'>>;
	};
	const listenersByEvent: ListenerStore = {
		'level-selected': new Set(),
		'posture-toggled': new Set(),
		'type-toggled': new Set(),
		'lens-opened': new Set(),
		settled: new Set(),
	};

	// WHY the `as Set<EventListener<Name>>` casts below: tsc cannot relate the
	// generic `Name` to the store's indexed access — it widens the lookup to
	// the union over all five events and rejects the call (TS2769/TS2345).
	// The cast restores the per-event association the ListenerStore shape
	// guarantees by construction.
	const bus: EventBus = {
		// Dispatch phase — deliver to the snapshot, synchronously, in
		// registration order.
		dispatch<Name extends EventName>(
			name: Name,
			payload: EventPayload<Name>,
		): void {
			// Snapshot listeners at dispatch time — each call to dispatch
			// captures its own array independent of any in-flight mutations.
			// Listeners that subscribe new listeners or tear down siblings
			// from inside their own body affect only future dispatches, not
			// the in-flight loop. Re-entrant dispatches take their own
			// snapshot at inner-dispatch time, so the depth-first contract
			// holds per-call rather than per-root.
			// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
			const listeners = Array.from(
				listenersByEvent[name] as Set<EventListener<Name>>,
			);
			for (const listener of listeners) {
				try {
					listener(payload);
				} catch (error) {
					console.warn(
						`EventBus: listener for "${name}" threw; subsequent listeners still fire`,
						error,
					);
				}
			}
		},
		// Register phase — listener identity in, idempotent teardown out.
		subscribe<Name extends EventName>(
			name: Name,
			listener: EventListener<Name>,
		): () => void {
			// eslint-disable-next-line functional/immutable-data -- stateful bus per DEV.md § 8
			(listenersByEvent[name] as Set<EventListener<Name>>).add(listener);
			// Per-call teardown closure: captures (name, listener) so the
			// caller's `useEffect` cleanup can drop the registration.
			// Set.delete is idempotent — calling teardown twice removes the
			// listener on the first call and is a no-op on the second (the
			// listener-identity registration contract).
			function teardown(): void {
				// eslint-disable-next-line functional/immutable-data -- stateful bus per DEV.md § 8
				(listenersByEvent[name] as Set<EventListener<Name>>).delete(listener);
			}
			return teardown;
		},
		// Clear phase — every listener drops; a test-isolation affordance.
		// Sweeping the store's values (not a hand-kept list) keeps the
		// taxonomy's one source of truth: a sixth event would clear for free
		// instead of compiling while silently leaking its listeners.
		clear(): void {
			for (const listeners of Object.values(listenersByEvent)) {
				// eslint-disable-next-line functional/immutable-data -- stateful bus per DEV.md § 8
				listeners.clear();
			}
		},
	};
	return freezeInPlace(bus);
}
