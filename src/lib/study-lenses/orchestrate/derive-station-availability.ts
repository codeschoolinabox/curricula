/**
 * @file The phases panel's STATION-AVAILABILITY derivation — the per-edit
 * shown-stations one of the panel's three pure derivations (static
 * roster · per-edit availability · per-edit status; distinct inputs and
 * cadences, never coupled).
 *
 * Decides WHICH stations the panel renders. CORE stations (`source`,
 * `parse`) are provided by embody's JS-generic core and always show; LL
 * stations (`realm`, `creation`, `evaluation`) are provided by the active
 * language level's semantic models and hide exactly where those models do
 * not apply. Hidden means fully removed — no stubs, no greyed
 * placeholders; the hidden set is non-contiguous (`realm` sits between
 * `source` and `parse`), which order-preserving filtering of the
 * canonical station order yields for free.
 */

import type { SnippetType, Validation } from '../embody/types.js';
import type { Station } from '../lenses/types.js';

import STATIONS from './stations.js';

/**
 * Derives the shown stations from the snippet's source type and the
 * admission gate's output.
 *
 * The LL stations are hidden iff `type === 'script'` (no language level
 * is active — the validator-free posture) OR `validation?.isJeJ ===
 * false` (admission explicitly refused — valid JS the level's models do
 * not cover). A **null** `validation` keeps them SHOWN: the gate's
 * output is absent on snippets that failed before the gate and while
 * embody's validating slice reports nothing, so admission is
 * undetermined — failures *inside* the machine render through the
 * station-status model (the staircase teaching), and only *out-of-model*
 * code hides the machine. Zero special-casing for the stubbed slice is
 * deliberate: when the validating slice lands, real refusals start
 * hiding with no change here.
 *
 * Hiding is a panel concern, never a lens concern — lens availability is
 * never JEJ-gated; a hidden station's lenses stay registered and
 * untouched.
 *
 * Pure and total: never throws (including on inputs unreachable through
 * today's embody, e.g. `'script'` paired with a non-null validation —
 * script wins), returns a frozen array in canonical order.
 *
 * @param type - the snippet's source type (`Snippet.type`)
 * @param validation - the admission gate's output (`Snippet.validation`)
 * @returns frozen shown stations, canonical left → right order
 */
export default function deriveStationAvailability(
	type: SnippetType,
	validation: Validation | null,
): readonly Station[] {
	// null validation → `undefined === false` → LL stays shown; only an
	// explicit `isJeJ: false` (or script type) hides.
	const llHidden = type === 'script' || validation?.isJeJ === false;
	return llHidden ? CORE_STATIONS : STATIONS;
}

const LL_STATIONS: readonly Station[] = Object.freeze([
	'realm',
	'creation',
	'evaluation',
]);

// CORE = STATIONS minus LL_STATIONS — the two partition STATIONS exactly;
// deriving (rather than listing) keeps the partition single-sourced.
const CORE_STATIONS: readonly Station[] = Object.freeze(
	STATIONS.filter((station) => !LL_STATIONS.includes(station)),
);
