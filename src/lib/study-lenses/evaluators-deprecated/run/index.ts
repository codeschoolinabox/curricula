/**
 * @file run's `Evaluator` object — the kind's identity for the baseline
 * engine-backed evaluator.
 *
 * `main` probes the environment for the engine's two synchronously probeable
 * prerequisites and, missing either, answers with ONE structured refusal
 * naming the absent capability — never a throw, never a second refusal.
 * Otherwise it hands back the eventless stream, having executed nothing:
 * laziness rides the pull, not this call.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EvaluationSpec, Evaluator, EvaluatorRefusal } from '../types.js';

import createRunStream from './create-run-stream.js';
import type { RunStream } from './types.js';

const run = {
	name: 'run',
	applicability,
	main,
} satisfies Evaluator;

export default run;

/**
 * Pure over the spec and constant-true: run is level-agnostic and serves both
 * execution axes, so the options list a consuming lens builds is never
 * environment-dependent. Whether this environment can host a run is answered
 * at `main`, as data.
 */
function applicability(_spec: EvaluationSpec): boolean {
	return true;
}

/**
 * Serve the spec, or refuse as data.
 *
 * The refusal covers both engine prerequisites: no `Worker` (server-side
 * rendering, plain Node) and no `SharedArrayBuffer` (the page is not
 * cross-origin isolated, so the pause protocol has no shared memory). The
 * residual — both present but the spawn still fails — is not a refusal; it
 * surfaces as the machinery defect it is.
 */
function main(spec: EvaluationSpec): RunStream | EvaluatorRefusal {
	const missing = missingCapability();
	if (missing !== null) {
		return freezeInPlace<EvaluatorRefusal>({
			refused: true,
			reason: `run needs ${missing} to sandbox a program; this environment has none`,
		});
	}
	return createRunStream(spec);
}

/**
 * The engine's two synchronously probeable prerequisites, in the order a
 * reader would want them named: a worker to run in, then the shared memory
 * its pause protocol lives on. `null` when the environment can host a run.
 */
function missingCapability(): string | null {
	if (typeof Worker === 'undefined') {
		return 'a Worker (this looks like server-side rendering or plain Node)';
	}
	if (typeof SharedArrayBuffer === 'undefined') {
		return 'SharedArrayBuffer (the page is not cross-origin isolated — it needs COOP/COEP headers)';
	}
	return null;
}
