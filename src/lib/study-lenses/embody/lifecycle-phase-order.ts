import type { LifecyclePhaseOrder } from './types.js';

/**
 * The runtime order constant `LifecyclePhaseOrder` promises: the five phases
 * in the specification's own order, for anything that iterates or displays
 * them in sequence.
 *
 * @remarks
 * The record-building files keep their literal five-key objects — an object
 * literal carries compile-time totality this constant cannot — and their
 * tests pin key order against this constant, so a reorder or sixth phase
 * fails loudly everywhere at once.
 */
const LIFECYCLE_PHASE_ORDER = [
	'source',
	'tokens',
	'ast',
	'environment',
	'evaluation',
] as const satisfies LifecyclePhaseOrder;

export default LIFECYCLE_PHASE_ORDER;
