/**
 * @file The phases panel's STATION-STATUS derivation — the per-edit
 * status one of the panel's three pure derivations (static roster ·
 * per-edit availability · per-edit status; distinct inputs and cadences,
 * never coupled).
 *
 * Maps the live embodiment's embody staircase — the whole `Status` plus
 * the single `EmbodyError | null` — onto one of five statuses per
 * station, for ALL five stations: the derivation cannot (and must not)
 * know which stations are SHOWN; that is the availability derivation's
 * independent output, and the panel renders the intersection.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { EmbodyError, EmbodyPhase, Status } from '../embody/types.js';
import type { Station } from '../lenses/types.js';

import type { StationStatus, StationStatusMap } from './types.js';

/**
 * Derives the per-station status map from the embody staircase.
 *
 * Per-station reachable subsets (locked — the implementation carries no
 * dead branches beyond them):
 *
 * - `source` / `realm` → `{constant}` — no machine status, never greys
 *   (`realm` is structurally error-free; `EmbodyPhase` excludes it).
 * - `parse` → `{ok, errored}` — the first phase that can error; nothing
 *   precedes it, so never `barred`/`pending`. Embody's two parse stages
 *   (`parse:tokenize` + `parse:ast`) FOLD into this one station — the
 *   panel teaches the machine's stages, not acorn's two-pass internals.
 * - `creation` → `{ok, errored, barred, pending}`.
 * - `evaluation` → `{errored, barred, pending}` — never `ok` statically;
 *   runtime success is only knowable at Run (Cycle 3).
 *
 * `barred` marks stations after an earlier MACHINE failure only.
 * `errors.phase === 'validation'` never produces `errored` or `barred`
 * here: non-admission is out-of-model, not a machine failure — the
 * availability derivation HIDES the LL stations instead (rendering
 * valid-but-not-admitted JS as a broken machine would lie).
 *
 * `pending` is the honest-under-stubs status: nothing failed upstream,
 * but the machine has not instrumented this stage. Creation on clean
 * real code reports `pending` while embody's creation slice is stubbed
 * (`status.created === false`, no error) — never `ok` (a lie), never
 * `barred` (implies failure). The whole `Status` (including `validated`)
 * is an input NOW so the validating/creation slices land later with the
 * same derivation returning `ok`/`errored` for real code — zero changes
 * here.
 *
 * Pure and total: never throws, returns a frozen map over all five
 * stations.
 *
 * @param status - the embodiment's hard-gate booleans (whole `Status`)
 * @param errors - the embodiment's single staircase error, if any
 * @returns frozen per-station statuses, all five stations
 */
export default function deriveStationStatus(
	status: Status,
	errors: EmbodyError | null,
): StationStatusMap {
	const erroredAt = machineErrorStation(errors);

	return deepFreezeInPlace({
		source: 'constant',
		realm: 'constant',
		parse: erroredAt === 'parse' ? 'errored' : 'ok',
		creation: deriveCreation(status, erroredAt),
		evaluation: deriveEvaluation(erroredAt),
	});
}

/**
 * Maps a staircase error onto the station the MACHINE tripped at —
 * `null` for no error and for `'validation'` (a gate refusal, not a
 * machine failure: it must never produce `errored` or `barred` here).
 * The `?? null` also collapses the `Partial` lookup's `undefined` so the
 * return type stays `Station | null`.
 */
function machineErrorStation(errors: EmbodyError | null): Station | null {
	if (errors === null) return null;
	return MACHINE_ERROR_STATIONS[errors.phase] ?? null;
}

/**
 * Reads `status.created` only — `validated` is a different staircase
 * gate (the admission gate ran), deliberately unread here; it sits in
 * the signature for the locked forward-compat contract.
 */
function deriveCreation(
	status: Status,
	erroredAt: Station | null,
): StationStatus {
	if (erroredAt === 'creation') return 'errored';
	if (erroredAt === 'parse') return 'barred';
	return status.created ? 'ok' : 'pending';
}

/**
 * Reads no `Status` field at all — evaluation is never `ok` statically
 * (runtime success is only knowable at Run), so `pending` is correct for
 * every non-errored, non-barred input; do not add a `status.created`
 * guard.
 */
function deriveEvaluation(erroredAt: Station | null): StationStatus {
	if (erroredAt === 'evaluation') return 'errored';
	if (erroredAt === 'parse' || erroredAt === 'creation') return 'barred';
	return 'pending';
}

// 'validation' is deliberately absent — the validation-never-bars rule
// expressed as data: an unmapped phase yields no machine-error station.
const MACHINE_ERROR_STATIONS: Readonly<Partial<Record<EmbodyPhase, Station>>> =
	Object.freeze({
		'parse:tokenize': 'parse',
		'parse:ast': 'parse',
		creation: 'creation',
		evaluation: 'evaluation',
	});
