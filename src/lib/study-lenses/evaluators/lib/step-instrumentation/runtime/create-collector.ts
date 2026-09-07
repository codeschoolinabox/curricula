/**
 * One run's collector (program realm): the injectable global, the four
 * counting concerns (sites — text-derived observation points, anchor
 * family contributing its one ratified count; emission ordinals;
 * per-loop-entry iteration counters; per-nodePath visit counts), VR at
 * capture, latched intrinsics, log parking, the three caps as marked
 * throws, and the lifecycle-anchor family minted from the programStamp.
 *
 * Adapts the klve collector protocol (Kelley van Evert, jsviz.klve.nl)
 * and the semantics tracer's emit discipline (count → gate → number →
 * stamp → freeze).
 *
 * @param input - namespace + programStamp + the residual runtime options
 *   + the caps.
 * @returns The collector: the injectable `global`, `events()`,
 *   `visitCounts()`.
 */
import type { Collector, CollectorInput } from '../types.js';

export default function createCollector(_input: CollectorInput): Collector {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
