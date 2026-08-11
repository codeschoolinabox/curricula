/**
 * @file The backend→kind bridge: map a terminal backend `DangerResult` onto the
 * evaluator kind's `DangerSettlement`, attaching danger's `reason` discriminant.
 * The backend speaks of a run's **outcome**; the kind speaks of a **settlement** —
 * this is where `main` translates the one into the other, one-to-one. Engine-forced
 * stops (a loop-cap trip, the wall-clock timeout) are `error` settlements, not a
 * separate arm, so the learner sees why the run ended in the machine's own words.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { DangerResult } from './backend/types.js';
import type { DangerErrorReason, DangerSettlement } from './types.js';

/**
 * Map a settled backend result to the kind's settlement.
 *
 * - `completed` → `clean`.
 * - `errored` / `limit-exceeded` / `timed-out` → `error`, carrying the machine's
 *   `{ name, message }` plus danger's `reason` (`threw` / `loop-cap` / `timeout`).
 * - `cancelled` → `canceled`.
 *
 * @param result - The backend's terminal result (it resolves once, never rejects).
 * @returns The kind's settlement, with danger's richer error on the error arm.
 */
export default function toSettlement(result: DangerResult): DangerSettlement {
	if (result.outcome === 'completed') {
		return freezeInPlace<DangerSettlement>({ ended: 'clean' });
	}
	if (result.outcome === 'cancelled') {
		return freezeInPlace<DangerSettlement>({ ended: 'canceled' });
	}
	// The three error outcomes carry the machine's { name, message } plus danger's
	// reason (a lookup — `switch` is disallowed here). The backend guarantees the
	// error payload on these; a missing one is an unreachable backend defect, mapped
	// to a loud, well-formed fallback (never undefined/undefined at the learner).
	const reasonByOutcome: Record<
		'errored' | 'limit-exceeded' | 'timed-out',
		DangerErrorReason
	> = {
		errored: 'threw',
		'limit-exceeded': 'loop-cap',
		'timed-out': 'timeout',
	};
	const reason = reasonByOutcome[result.outcome];
	const error = result.error ?? {
		name: 'Error',
		message: 'danger run ended in error with no error payload (backend defect)',
	};
	return freezeInPlace<DangerSettlement>({
		ended: 'error',
		error: { name: error.name, message: error.message, reason },
	});
}
