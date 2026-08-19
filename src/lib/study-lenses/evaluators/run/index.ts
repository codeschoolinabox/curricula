// cspell:ignore trapless
/**
 * run's `Evaluator` object — the kind's identity for the region's
 * trapless evaluator. `main` answers the environment refusal first (the
 * shared wording, deprecated-port order), then narrows the gate
 * guarantee (a spec whose `ast` fact is not a success is a spec refusal
 * — the lens's bug, said in those words), then hands back the inert
 * result-only handle over the execution-handle library, having executed
 * nothing: laziness rides the first touch, not this call.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body
 * lands across the W4b run chain (R1–R5), un-skipping the suite one row
 * at a time.
 */

import type { Evaluator, EvaluatorRefusal } from '../types.js';

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

function main(_spec: RunSpec): RunHandle | EvaluatorRefusal {
	throw new Error(
		'not implemented — Phase 1 (the W4b run chain) un-skips the suite',
	);
}
