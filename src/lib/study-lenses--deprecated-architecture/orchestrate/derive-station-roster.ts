/**
 * @file The phases panel's STATION-ROSTER derivation — the static one of
 * the panel's three pure derivations (static roster · per-edit
 * availability · per-edit status; distinct inputs and cadences, never
 * coupled).
 *
 * Buckets each registered lens into the station(s) its `LensModule.phase`
 * declares, producing the per-station dropdown contents. Runs once per
 * registry load (the `LENS_REGISTRY` is static) — the roster is invariant
 * across edits; what varies per edit is which stations are SHOWN
 * (availability) and what status they wear (status), never who staffs
 * them.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { LensModule, Station } from '../lenses/types.js';

import STATIONS from './stations.js';
import type { StationRoster } from './types.js';

/**
 * Derives the per-station lens rosters from the lens registry.
 *
 * `LensModule.phase` is the **pedagogical target** — the station a lens
 * teaches understanding OF, not the embody phase it reads from (`blanks`
 * targets `'source'` yet consumes the AST). The union shape
 * (`Station | readonly Station[] | absent`) is normalized at read by the
 * in-file `stationsOf` helper, so no consumer ever branches on it:
 *
 * - **absent** — panel-excluded: the lens appears in no roster
 *   (`debug-props` declares nothing; there is no registry-level
 *   exclusion list).
 * - **single** — the lens staffs that one station.
 * - **array** — the lens staffs each named station, as declared: a
 *   duplicated station yields a duplicated roster entry (an authoring
 *   error the type system cannot express; the normalizer does not
 *   silently repair it). An **empty** array behaves like absent
 *   (explicitly zero stations) — the panel-exclusion idiom for
 *   registered dev-helper lenses that should never surface in
 *   learner-facing dropdowns.
 *
 * The result carries **every** station key over the canonical
 * {@link STATIONS} order — a station no lens targets maps to an empty
 * array, never an absent key. Within each roster, entries appear in
 * **registration order** (the registry's key insertion order, per the
 * ES2015+ `Object.keys` spec; integer-index keys would sort first, but
 * lens names are non-integer strings by convention — the same
 * enumeration basis the retired toolbar picker used).
 *
 * Roster entries are the **registry keys**, not the module's own `name`
 * field: a roster entry must resolve back through `registry[name]` when
 * a dropdown selection dispatches, so the lookup identity is the only
 * string that cannot produce a dead entry. (Key and `name` coincide by
 * the registry contract; this pins the winner if they ever disagree.)
 *
 * Pure and total: never throws, mutates nothing, returns a frozen
 * {@link StationRoster}. The parameter keeps `name` in its `Pick` even
 * though only `phase` is read: the key-vs-name contract above is only
 * expressible (and pinnable in tests) if the value type admits a `name`
 * that can disagree with its key. `LENS_REGISTRY` satisfies the shape
 * structurally.
 *
 * @param registry - the lens registry (keyed by lens name)
 * @returns frozen per-station rosters of lens names, full five-key shape
 */
export default function deriveStationRoster(
	registry: Readonly<Record<string, Pick<LensModule, 'name' | 'phase'>>>,
): StationRoster {
	const rosters = {} as Record<Station, string[]>;
	// eslint-disable-next-line functional/immutable-data -- mutable during construction, frozen once at the end
	for (const station of STATIONS) rosters[station] = [];

	for (const [lensName, lensModule] of Object.entries(registry)) {
		for (const station of stationsOf(lensModule)) {
			// eslint-disable-next-line functional/immutable-data -- mutable during construction, frozen once at the end
			rosters[station].push(lensName);
		}
	}

	return deepFreezeInPlace(rosters);
}

/**
 * Normalizes `LensModule.phase`'s union shape to a flat station list —
 * absent → none; single → one; array → as declared.
 */
function stationsOf(lensModule: Pick<LensModule, 'phase'>): readonly Station[] {
	const { phase } = lensModule;
	if (phase === undefined) return [];
	return typeof phase === 'string' ? [phase] : phase;
}
