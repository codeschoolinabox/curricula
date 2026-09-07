/**
 * The worker-config narrowing both evaluators' setups shared: the cap as
 * given, or nothing. Reading `unknown` is the narrowing, not a policy
 * gate — `0`, negatives, `Infinity`, and `NaN` are all numbers and all
 * ride through to iteration-guard's documented edges (pass-through is the
 * ruled cap policy, pins run:235 / intercept:394); anything that is not a
 * number reads as no cap: the guard counts and never throws.
 *
 * Mini-Phase-0 stub: the signature is the contract; the body lands under
 * this unit's TDD rows.
 */

export default function readCap(_workerConfig: unknown): number | undefined {
	throw new Error('not implemented — the halt-author TDD rows land the body');
}
