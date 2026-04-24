/**
 * @file Per-instance typed pub/sub EventBus for the study-lenses
 * orchestrator.
 *
 * `createEventBus` returns a bus with `dispatch` / `subscribe` /
 * `unsubscribe` / `clear` methods keyed by the canonical `EventName`
 * union. Each `<StudyLenses>` orchestrator owns its own bus —
 * isolation between page-level instances is structural (no DOM, no
 * global registry).
 *
 * @remarks Dispatch semantics (pinned in DOCS.md §7 EventBus lifecycle):
 * - **Synchronous**: `dispatch` returns only after all listeners
 *   have run (or thrown).
 * - **Registration order**: first subscribed, first invoked.
 * - **Thrown listener is caught**: logged via `console.warn`, does
 *   NOT abort remaining listeners.
 * - **Re-entrant dispatch permitted (depth-first)**: a listener that
 *   dispatches another event during its callback fires the nested
 *   dispatch synchronously before the outer dispatch's next listener
 *   runs.
 * - **Snapshot-before-iterate**: listeners that `subscribe` or
 *   `unsubscribe` during the current dispatch do NOT affect this
 *   dispatch's listener list; changes apply to the next dispatch.
 * - **Set de-duplication**: subscribing the same listener twice for
 *   the same event is a no-op on the second call.
 * - **clear()**: removes every listener across every event, used at
 *   orchestrator unmount.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type {
	EventBus,
	EventListener,
	EventName,
	EventPayload,
} from './types.js';

type InternalListener = (payload: unknown) => void;

/**
 * Creates a new, empty per-instance EventBus.
 *
 * @returns A frozen `EventBus` handle. Populate at orchestrator mount
 *   by calling `subscribe(name, listener)` for each wire; tear down at
 *   unmount by calling `clear()`.
 */
function createEventBus(): EventBus {
	const listenersByEvent = new Map<EventName, Set<InternalListener>>();

	function dispatch<N extends EventName>(
		name: N,
		payload: EventPayload<N>,
	): void {
		const perEvent = listenersByEvent.get(name);
		if (!perEvent) return;
		const snapshot = [...perEvent];
		for (const listener of snapshot) {
			try {
				listener(payload);
			} catch (error) {
				console.warn(
					`EventBus: listener for "${name}" threw; continuing with remaining listeners`,
					error,
				);
			}
		}
	}

	function subscribe<N extends EventName>(
		name: N,
		listener: EventListener<N>,
	): void {
		const existing = listenersByEvent.get(name);
		if (existing) {
			existing.add(listener as InternalListener);
			return;
		}
		listenersByEvent.set(name, new Set([listener as InternalListener]));
	}

	function unsubscribe<N extends EventName>(
		name: N,
		listener: EventListener<N>,
	): void {
		const perEvent = listenersByEvent.get(name);
		if (!perEvent) return;
		perEvent.delete(listener as InternalListener);
	}

	function clear(): void {
		listenersByEvent.clear();
	}

	return freezeInPlace({ dispatch, subscribe, unsubscribe, clear });
}

export default createEventBus;
