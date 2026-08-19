/**
 * The environment read: probe the two globals and delegate the decision to
 * the pure leaf. This thin wrapper is the only place the module touches the
 * environment, so the leaf stays exhaustively testable with plain fixtures
 * and the tiers cross the node/browser boundary by moving test files —
 * never by mocking the globals away. Hoisted from the deprecated port's
 * byte-identical per-evaluator copies (human ruling 2026-08-18; leaf split
 * and rename ruled 2026-08-19).
 */

import type { EvaluatorRefusal } from '../../types.js';

import refuseAbsentCapability from './refuse-absent-capability.js';

/**
 * Probe the environment for the machinery's two prerequisites.
 *
 * @param evaluatorName - The calling evaluator's `name`; the refusal
 *   sentence opens with it.
 * @returns The frozen environment refusal naming the missing capability,
 *   or `null` when the environment can host a run.
 */
export default function refuseMissingCapability(
	evaluatorName: string,
): EvaluatorRefusal | null {
	return refuseAbsentCapability(evaluatorName, {
		worker: typeof Worker !== 'undefined',
		sharedMemory: typeof SharedArrayBuffer !== 'undefined',
	});
}
