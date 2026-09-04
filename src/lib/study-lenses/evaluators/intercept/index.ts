/**
 * intercept's `Evaluator` object — the kind's identity for the region's
 * step-through evaluator. `main` answers the environment refusal first
 * (the shared wording, deprecated-port order), then narrows the gate
 * guarantee (`ast` AND `entwined` facts — enrichment resolves through
 * the entwined record), then hands back the inert streaming handle over
 * the execution-handle library, having executed nothing.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import refuseMissingCapability from '../lib/environment-refusal/refuse-missing-capability.js';
import type { Evaluator, EvaluatorRefusal } from '../types.js';

import createInterceptHandle from './create-intercept-handle.js';
import type { InterceptHandle, InterceptSpec } from './types.js';

const intercept = {
	name: 'intercept',
	applicability,
	main,
} satisfies Evaluator<InterceptSpec, InterceptHandle>;

export default intercept;

/**
 * Pure and constant-true: intercept is level-blind and serves both
 * execution axes; whether this environment can host a run is answered at
 * `main`, as data.
 */
function applicability(_spec: InterceptSpec): boolean {
	return true;
}

/**
 * Serve the spec, or refuse as data — never a throw at the learner.
 *
 * The door's order is the deprecated port's, pinned: the ENVIRONMENT
 * refusal answers first (the region's one shared wording, from
 * `../lib/environment-refusal/`), so where both grounds apply the
 * missing capability is what the consumer hears. Then the gate
 * narrowing, at the door: a spec whose `ast` or `entwined` fact is not
 * a success was driven outside the evaluation phase's gate — the
 * driving lens's own bug, and the spec refusal says so in those words,
 * naming the failed fact (`ast` first: it is the upstream diagnosis,
 * and an entwining cannot outlive a failed parse). The parenthetical in
 * that reason keeps the parser's voice — diagnostic content for the
 * driving lens's author, never the learner (a correctly-wired lens
 * never sees this refusal; learner-worded explanation is lens work, per
 * the embodiment's `StageCause`). Past the door, the inert handle: the
 * echoes are readable, enrichment holds the narrowed entwined record,
 * nothing runs, and the first consumption touch is the ignition.
 *
 * The residual — every capability present but the machinery still
 * failing — is never a refusal; it surfaces as the machinery defect it
 * is.
 */
function main(spec: InterceptSpec): InterceptHandle | EvaluatorRefusal {
	const environmentRefusal = refuseMissingCapability(intercept.name);
	if (environmentRefusal !== null) {
		return environmentRefusal;
	}

	if (!spec.facts.ast.ok) {
		return refuseOutsideGate('ast', spec.facts.ast.cause.message);
	}

	if (!spec.facts.entwined.ok) {
		return refuseOutsideGate('entwined', spec.facts.entwined.cause.message);
	}

	return createInterceptHandle(spec, spec.facts.entwined.value);
}

/**
 * Word the spec refusal in intercept's own voice, naming the fact the
 * gate found un-narrowed — one wording for both facts, so the two
 * branches cannot drift apart.
 */
function refuseOutsideGate(
	failedFact: 'ast' | 'entwined',
	message: string,
): EvaluatorRefusal {
	return freezeInPlace<EvaluatorRefusal>({
		refused: true,
		reason: `intercept was driven with a spec outside the evaluation gate — its ${failedFact} fact is not a success (${message}); facts are gate-guaranteed at drive time, so the driving lens has a bug on its own side`,
	});
}
