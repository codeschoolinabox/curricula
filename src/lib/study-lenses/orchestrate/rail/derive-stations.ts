/**
 * Derives the rail's stations for one settle: one station per lifecycle
 * phase, in the machine's fixed order, each carrying its phase, its two
 * labels, its standing, and its tray where it has one.
 *
 * @remarks
 * The standing is a projection of reachability and kit, and the kit is the
 * phase's attached lenses RECOVERED on the joined roster — the same set the
 * tray discloses. An attached ref the roster cannot recover is a broken
 * embody invariant, reported and dropped from the render, so counting it
 * would draw a kit count over a tray that has nothing in it.
 *
 * That recovery is what makes the two counts complementary without a second
 * predicate to keep in step: `openable` and `bare` are the two arms of one
 * reachable-and-kit judgment, so a station has a tray exactly when its kit is
 * non-empty, and a barred phase is excluded from the empty count because
 * `waiting` is a third arm rather than an empty second one.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body lands
 * in Phase 1, un-skipping its suite one cluster at a time.
 */

import type { LifecyclePhase, LifecyclePhaseName } from '../../embody/types.js';
import type { JoinedLensRoster } from '../lib/composing/types.js';
import type { Station } from '../types.js';

export default function deriveStations(
	_study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>,
	_roster: JoinedLensRoster,
): ReadonlyArray<Station> {
	throw new Error('deriveStations: not implemented');
}
