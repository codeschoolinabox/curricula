/**
 * @file Classify a settled danger run's caught throw into a terminal
 * {@link DangerResult}. This is the outcome classifier named in DOCS.md
 * § Structural constraints: a message-match PREDICATE (embody's `intercept.ts`
 * mirrors the same `includes`-form), deliberately NOT the anchored regex the run
 * engine uses — a learner who literally throws the guard's message is an accepted,
 * documented false-positive (there is no sentinel; a sentinel would need a
 * forbidden `guardLoops` edit, and embody itself message-matches).
 *
 * Error identity is read INSIDE the iframe realm (the injected script's `catch`
 * passes out `e.name` / `e.message` primitives) — a cross-realm `instanceof` in
 * the parent is unsound (the iframe has its own `RangeError`), so this classifier
 * takes primitives, never a live `Error`.
 */

import type { DangerResult } from './types.js';

/**
 * Map a caught throw's `{ name, message }` (plus the run's `iterations` cap) to a
 * terminal {@link DangerResult}.
 *
 * A loop-guard trip is a `RangeError` whose message the guard injects as
 * ``Loop N exceeded M iterations.`` — recognised by the DDD-locked predicate
 * (`name === 'RangeError'` AND `iterations` set AND the message `includes` both
 * `'exceeded'` and `'iterations'`) and mapped to the PUBLIC `limit-exceeded`
 * literal (embody's internal `iteration-limit` is remapped upstream, not copied
 * here). Every other throw is `errored`. Both non-clean outcomes carry the
 * machine's `{ name, message }` — the kind's error floor rides `limit-exceeded`
 * too (`backend/types.ts`), the two distinguished only by `outcome`.
 *
 * @param name - The thrown value's `name`, read in-realm (e.g. `'RangeError'`).
 * @param message - The thrown value's `message`, read in-realm.
 * @param iterations - The run's loop-guard cap; omitted/`undefined` when no guard
 *   was applied. The predicate gates on this: an unguarded `RangeError` is the
 *   learner's own error (`errored`), never a limit trip.
 * @returns `{ outcome: 'limit-exceeded', error: { name, message } }` on a
 *   recognised guard trip, else `{ outcome: 'errored', error: { name, message } }`
 *   — the `{ name, message }` floor rides both.
 */
export default function classifyDangerError(
	name: string,
	message: string,
	iterations?: number,
): DangerResult {
	// The guard trip: a RangeError, only when a cap was applied, whose message
	// carries both marker substrings. `iterations !== undefined` (NOT a truthy
	// check) so a cap of 0 still gates. Mirrors embody's intercept.ts predicate;
	// emits the PUBLIC `limit-exceeded` literal, carrying the machine's own
	// `{ name, message }` (the guard's RangeError) like every non-clean outcome.
	if (
		name === 'RangeError' &&
		iterations !== undefined &&
		message.includes('exceeded') &&
		message.includes('iterations')
	) {
		return { outcome: 'limit-exceeded', error: { name, message } };
	}
	return { outcome: 'errored', error: { name, message } };
}
