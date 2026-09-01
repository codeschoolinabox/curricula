/**
 * Derives the caption beneath the rail: one slot, two producers, and a total
 * order between them — the cause wherever a barring edge is drawn, else the
 * count, else nothing.
 *
 * @remarks
 * The counts are read off the STATIONS this settle will actually render,
 * which is what makes the caption and the rail structurally incapable of
 * disagreeing: the empty count is how many stations stand `bare`, and the
 * unreached count is how many stand `waiting`. The cause itself is read from
 * the study record rather than from a station, because one cause is drawn
 * once beneath the rail and no station carries it.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body lands
 * in Phase 1, un-skipping its suite one cluster at a time.
 */

import type { LifecyclePhase, LifecyclePhaseName } from '../../embody/types.js';
import type { Caption, Station } from '../types.js';

export default function deriveCaption(
	_stations: ReadonlyArray<Station>,
	_study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>,
): Caption {
	throw new Error('deriveCaption: not implemented');
}
