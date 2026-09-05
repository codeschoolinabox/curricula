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
import type { Lens } from '../../lenses/types.js';
import recoverRenderableLenses from '../lib/composing/recover-renderable-lenses.js';
import type { JoinedLensRoster } from '../lib/composing/types.js';
import type { Station, TrayEntry } from '../types.js';

export default function deriveStations(
	study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>,
	roster: JoinedLensRoster,
): ReadonlyArray<Station> {
	// The order is read from the machine's own constant, never minted from
	// the study record's key order.
	const stations = LIFECYCLE_PHASE_ORDER.map((phase) =>
		toStation(phase, study[phase], roster),
	);

	return freezeInPlace(stations);
}

// Each arm is annotated `: Station` before it is returned, so a stray field —
// a `tray` left `undefined` on a bare station, say — is an excess-property
// error here rather than a shape the freeze step would carry through. The
// annotation is the guard: `freezeInPlace` infers its own type parameter from
// whatever it is handed, so it checks nothing on its own.
function toStation(
	phase: LifecyclePhaseName,
	lifecyclePhase: LifecyclePhase,
	roster: JoinedLensRoster,
): Station {
	const kit = recoverRenderableLenses(roster, lifecyclePhase.lenses);

	// Destructure-and-rebuild rather than cast: `.map()` yields a plain array,
	// which does not narrow to the non-empty tuple `openable` requires, and
	// the empty branch is exactly where the bare arm belongs. Same shape as
	// `lib/local-llm/make-local-llm.ts`'s ledger, which needs a non-empty
	// tuple for the same reason.
	const [first, ...rest] = kit.map((lens) => toTrayEntry(lens));
	if (first === undefined) {
		const bare: Station = { phase, standing: 'bare' };
		return bare;
	}

	const openable: Station = {
		phase,
		standing: 'openable',
		tray: [first, ...rest],
	};
	return openable;
}

// The lens names itself: its label is CARRIED off the recovered lens, never
// keyed against this region's own vocabulary.
function toTrayEntry(lens: Lens): TrayEntry {
	return { lens: lens.name, label: lens.label };
}
