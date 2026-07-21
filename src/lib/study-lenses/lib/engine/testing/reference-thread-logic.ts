/**
 * @file Engine-owned trivial thread logic for the engine's own suites —
 * the thread-side half of the engine's test independence from the
 * evaluators.
 */

import type { CallResponse, ThreadLogic } from '../types.js';

/**
 * Drop-a-sentinel / yield-the-rest message hook, echo call hook, and a
 * refiner that recognizes the reference limit shape.
 *
 * - `onMessage` — drops the literal string `'reference:drop'`
 *   (returning undefined); yields every other message unchanged.
 * - `onCall` — echoes a string request back; answers null otherwise.
 * - `refineError` — returns `{ limit: 'reference' }` for halt payloads
 *   stamped `isReferenceLimit`; undefined otherwise.
 */
const REFERENCE_THREAD_LOGIC: ThreadLogic = Object.freeze({
	onMessage(message: unknown): unknown {
		return message === 'reference:drop' ? undefined : message;
	},
	onCall(request: unknown): CallResponse {
		return typeof request === 'string' ? request : null;
	},
	refineError(haltPayload: unknown): unknown {
		// WHY the cast: halt payloads are contractually opaque at the
		// engine boundary; this refiner recognizes its own stamp by shape.
		const payload = haltPayload as { isReferenceLimit?: boolean } | null;
		return payload?.isReferenceLimit ? { limit: 'reference' } : undefined;
	},
});

export default REFERENCE_THREAD_LOGIC;
