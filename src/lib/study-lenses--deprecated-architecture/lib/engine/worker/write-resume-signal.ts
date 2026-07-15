/**
 * @file Thread-side writer: releases the worker's pause.
 */

import PROTOCOL from './protocol.js';
import type { BufferViews } from './types.js';

/**
 * Clears the pause flag and wakes the worker blocked on it.
 *
 * @remarks The notify is what actually wakes the worker's
 * `Atomics.wait`; the store alone never does. Node unit tests can pin
 * only the flag value — the wake itself is evidenced by the browser
 * suites, where a real worker blocks on the flag.
 */
export default function writeResumeSignal(views: BufferViews): void {
	Atomics.store(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_RUNNING);
	Atomics.notify(views.control, PROTOCOL.PAUSE_INDEX);
}
