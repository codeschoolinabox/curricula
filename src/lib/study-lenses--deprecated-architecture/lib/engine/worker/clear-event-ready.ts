/**
 * @file Thread-side writer: clears the event-ready flag after the
 * thread has disposed of an emission.
 */

import PROTOCOL from './protocol.js';
import type { BufferViews } from './types.js';

/**
 * Clears the event-ready flag.
 *
 * @remarks Ordering (DOCS.md § Structural constraints): the thread
 * clears event-ready BEFORE releasing the pause, so the timer's next
 * read observes the worker's next signal, never a stale one.
 */
export default function clearEventReady(views: BufferViews): void {
	Atomics.store(
		views.control,
		PROTOCOL.EVENT_READY_INDEX,
		PROTOCOL.EVENT_NOT_READY,
	);
}
