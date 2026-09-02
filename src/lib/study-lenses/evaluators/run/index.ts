// cspell:ignore trapless
/**
 * run's `Evaluator` object — the kind's identity for the region's
 * trapless evaluator. `main` answers the environment refusal first (the
 * shared wording, deprecated-port order), then narrows the gate
 * guarantee (a spec whose `ast` fact is not a success is a spec refusal
 * — the lens's bug, said in those words), then hands back the inert
 * result-only handle over the execution-handle library, having executed
 * nothing: laziness rides the first touch, not this call.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import refuseMissingCapability from '../lib/environment-refusal/refuse-missing-capability.js';
import type { Evaluator, EvaluatorRefusal } from '../types.js';

import createRunHandle from './create-run-handle.js';
import type { RunHandle, RunSpec } from './types.js';

const run = {
	name: 'run',
	applicability,
	main,
} satisfies Evaluator<RunSpec, RunHandle>;

export default run;

/**
 * Pure and constant-true: run is level-blind and serves both execution
 * axes, so the options list a consuming lens builds is never
 * environment-dependent. Whether this environment can host a run is
 * answered at `main`, as data.
 */
function applicability(_spec: RunSpec): boolean {
	return true;
}

/**
 * Serve the spec, or refuse as data — never a throw at the learner.
 *
 * The door's order is the deprecated port's, pinned: the ENVIRONMENT
 * refusal answers first (the region's one shared wording, from
 * `../lib/environment-refusal/`), so where both grounds apply the
 * missing capability is what the consumer hears. Then the gate
 * narrowing, exactly once, at the door: a spec whose `ast` fact is not
 * a success was driven outside the evaluation phase's gate — the
 * driving lens's own bug, and the spec refusal says so in those words.
 * The parenthetical in that reason keeps the parser's voice — diagnostic
 * content for the driving lens's author, never the learner (a
 * correctly-wired lens never sees this refusal; learner-worded
 * explanation is lens work, per the embodiment's `StageCause`).
 * Past the door, the inert handle: the echoes are readable, nothing
 * runs, and the first consumption touch is the ignition.
 *
 * The residual — every capability present but the machinery still
 * failing — is never a refusal; it surfaces as the machinery defect it
 * is.
 */
function main(spec: RunSpec): RunHandle | EvaluatorRefusal {
	const environmentRefusal = refuseMissingCapability(run.name);
	if (environmentRefusal !== null) {
		return environmentRefusal;
	}

	if (!spec.facts.ast.ok) {
		return freezeInPlace<EvaluatorRefusal>({
			refused: true,
			reason: `run was driven with a spec outside the evaluation gate — its ast fact is not a success (${spec.facts.ast.cause.message}); facts are gate-guaranteed at drive time, so the driving lens has a bug on its own side`,
		});
	}

	return createRunHandle(spec, spec.facts.ast.value);
}
