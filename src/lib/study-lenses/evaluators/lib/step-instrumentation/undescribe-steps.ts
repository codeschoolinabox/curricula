/**
 * The thread-side finishing pass: undescribe every resolve event's
 * snapshot legs (structural marks ride through untouched); the event
 * stream itself needs no finishing. The output is the FINAL emitted data —
 * the north-star's surface.
 *
 * @param events - The collector's recorded events.
 * @returns The finalized events.
 */
import type { FinalTraceEvent, TraceEvent } from './types.js';

export default function undescribeSteps(
	_events: readonly TraceEvent[],
): readonly FinalTraceEvent[] {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
