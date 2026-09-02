/**
 * Derives the rail's stations for one settle: one station per lifecycle
 * phase, in the machine's fixed order, each carrying its phase, its standing,
 * and its tray where it has one.
 *
 * @remarks
 * The standing is a projection of reachability and kit. The kit is the
 * phase's attached lenses recovered on the joined roster by
 * [`../lib/composing/recover-renderable-lenses.ts`](../lib/composing/recover-renderable-lenses.ts),
 * whose contract — including what it does with a ref the roster cannot
 * recover — is that library's and is not restated here. This deriver is a
 * composition over it rather than a re-implementation of it.
 *
 * That recovery is what makes the two counts complementary without a second
 * predicate to keep in step: `openable` and `bare` are the two arms of one
 * reachable-and-kit judgment, so a station has a tray exactly when its
 * recovered kit is non-empty, and a barred phase is excluded from the empty
 * count because `waiting` is a third arm rather than an empty second one.
 *
 * A tray entry carries the lens's own authored label beside its name, because
 * a lens names itself and this region does not key that string.
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
