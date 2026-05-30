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

import type { EventBus } from './types.js';

/**
 * Creates a new per-instance EventBus.
 *
 * @returns A fresh bus with no listeners. Dispatching on an empty bus is a
 * synchronous no-op. Two `createEventBus()` calls produce isolated bus
 * instances that do not share listeners.
 *
 * @remarks The returned bus is intentionally not frozen — `subscribe` and
 * `unsubscribe` mutate the internal listener store. The bus's reference
 * identity is stable for the lifetime of the holding `useRef`; callers
 * should treat the bus value as a long-lived handle, not a per-render
 * value.
 */
function createEventBus(): EventBus {
	const bus: EventBus = {
		// Fake It: listener store absent at F5a.1; F5a.2 introduces real dispatch.
		dispatch() {},
		// Fake It: no registration; F5a.2 introduces real subscribe + teardown.
		subscribe() {
			return function noopTeardown() {};
		},
		unsubscribe() {},
		clear() {},
	};
	return freezeInPlace(bus);
}

export default createEventBus;
