/**
 * Raw value → ValueRepresentation. Transported from the semantics tracer's
 * represent-value (this repo's own, read-only lineage), widened with the
 * Symbol/Date arms and the Error/className arms its own types define —
 * the null-object fallback mistrace repaired.
 *
 * @param value - Any runtime value.
 * @returns The tagged, honest, wire-safe representation.
 */
import type { ValueRepresentation } from '../types.js';

export default function representValue(_value: unknown): ValueRepresentation {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
