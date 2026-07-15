/**
 * @file Reduce a fallback-chain attempts ledger to the ONE terminal
 * {@link LoadFailureCause} a consumer sees, by precedence. The chain's loader records a
 * {@link LoadAttempt} per failed candidate (classify-load-error.ts); when the chain is
 * exhausted this folds the ledger into the single cause the refusal carries.
 *
 * Precedence (most-actionable-first): an actionable storage problem wins outright
 * (`storage-quota`, then `cache-evicted`) even from one attempt among many — surfacing it
 * gives the learner a real next step. Absent those, a UNIFORM network failure (every
 * attempt `fetch-failed`) surfaces as `fetch-failed`; anything else — a mix, or a
 * diagnostic-only `device-lost` / `unknown` — is the honest `all-candidates-exhausted`.
 * `device-lost` / `unknown` are never terminal: they fold into `all-candidates-exhausted`.
 *
 * The `fetch-failed` rule is ALL (every attempt), while the storage rules are ANY (one is
 * enough): a lone evicted cache among network failures is still worth surfacing, but a lone
 * network failure among undiagnosed drops is not honestly "the network".
 */

import type { LoadAttempt, LoadFailureCause } from './types.js';

/**
 * Fold the attempts ledger to one terminal cause.
 *
 * @param attempts - The non-empty ledger of failed bring-ups (the chain ran ≥1 candidate
 *   before exhausting). The non-empty tuple type matches {@link LoadFailure.attempts} and
 *   makes an empty ledger a compile error at the construction site, not a wrong answer here.
 * @returns The single terminal {@link LoadFailureCause} — never the pre-flight
 *   `'no-feasible-model'` (that cause means the chain never ran).
 */
export default function promoteTerminal(
	attempts: readonly [LoadAttempt, ...LoadAttempt[]],
): Exclude<LoadFailureCause, 'no-feasible-model'> {
	if (attempts.some((attempt) => attempt.cause === 'storage-quota')) {
		return 'storage-quota';
	}
	if (attempts.some((attempt) => attempt.cause === 'cache-evicted')) {
		return 'cache-evicted';
	}
	if (attempts.every((attempt) => attempt.cause === 'fetch-failed')) {
		return 'fetch-failed';
	}
	return 'all-candidates-exhausted';
}
