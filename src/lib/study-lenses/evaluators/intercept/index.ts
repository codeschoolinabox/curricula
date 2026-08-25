// cspell:ignore unmocked
/**
 * intercept's `Evaluator` object — the kind's identity for the region's
 * step-through evaluator. `main` answers the environment refusal first
 * (the shared wording, deprecated-port order), then narrows the gate
 * guarantee (`ast` AND `entwined` facts — enrichment resolves through
 * the entwined record), then hands back the inert streaming handle over
 * the execution-handle library, having executed nothing.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body
 * lands across the W4b intercept chain (I1–I8), un-skipping the suite
 * one row at a time.
 */

import type { Evaluator, EvaluatorRefusal } from '../types.js';

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

function main(_spec: InterceptSpec): InterceptHandle | EvaluatorRefusal {
	throw new Error(
		'not implemented — Phase 1 (the W4b intercept chain) un-skips the suite',
	);
}
