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
 * The order is READ, never minted: the phase order has exactly one truth and
 * it is embody's runtime constant. Iterating the study record's own keys
 * would mint the order from object insertion order instead, which every
 * fixture happens to satisfy and the contract forbids.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import LIFECYCLE_PHASE_ORDER from '../../embody/lifecycle-phase-order.js';
import type { LifecyclePhase, LifecyclePhaseName } from '../../embody/types.js';
import type { JoinedLensRoster } from '../lib/composing/types.js';
import type { Station } from '../types.js';

export default function deriveStations(
	_study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>,
	_roster: JoinedLensRoster,
): ReadonlyArray<Station> {
	// Zip the machine's fixed order. Every station stands bare until the
	// standing has something to vary on — the kit arm arrives with the
	// one-lens cluster, the reachability arm with the barring geometry.
	const stations = LIFECYCLE_PHASE_ORDER.map((phase) => ({
		phase,
		standing: 'bare' as const,
	}));

	return freezeInPlace(stations);
}
