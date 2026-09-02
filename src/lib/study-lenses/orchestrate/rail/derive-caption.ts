/**
 * Derives the caption beneath the rail: one slot, two producers, and a total
 * order between them — the cause wherever a barring edge is drawn, else the
 * count, else nothing.
 *
 * @remarks
 * THE ARM IS CHOSEN OFF THE STATIONS ALONE. A barring edge is drawn wherever a
 * station stands `waiting`, so the input that decides the arm is the same one
 * that draws the edge the precedence rule names — and the cause arrives as
 * PAYLOAD rather than as a second thing to decide from. Handing this function
 * the whole study record instead would give it two independent answers to
 * "is an edge drawn" and no rule for which wins.
 *
 * Both counts are read off those same stations: the empty count is how many
 * stand `bare`, the unreached count how many stand `waiting`. So the caption
 * cannot disagree with the rail about either its arm or its numbers.
 *
 * The counts are narrowed and THROW outside their domains. That is not a
 * defensive branch — it is unreachable by contract, and reaching it means the
 * cause and the standings disagree, which is a defect of the same class as an
 * attached lens the roster cannot recover: reported loudly rather than
 * papered over.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body lands
 * in Phase 1, un-skipping its suite one cluster at a time.
 */

import type { StageCause } from '../../embody/types.js';
import type { Caption, Station } from '../types.js';

export default function deriveCaption(
	_stations: ReadonlyArray<Station>,
	_cause: StageCause | null,
): Caption {
	throw new Error('deriveCaption: not implemented');
}
