/**
 * @file The classification verb — the engine's consumer-owned limit
 * classification, run inside an evaluator's halt serializer (same realm
 * as the throw, where the raw thrown value still exists).
 *
 * Total by construction: the WHOLE body rides one throw-guard —
 * accessor-safety (marker presence checked without invoking getters)
 * narrows what the guard must catch, it is not the guard's boundary, so
 * a trapping proxy whose very property inspection throws is still
 * `null`, never an escape (a throw escaping the halt serializer would be
 * a worker crash). Well-formed means the full trip-record depth with all
 * numbers finite; anything less — including a forged marker with garbage
 * — is `null`. Name and message text are never inspected.
 */

import LIMIT_MARKER_KEY from './limit-marker-key.js';
import type { LimitTrip } from './types.js';

/**
 * Classify a thrown value: the trip record when it carries a well-formed
 * marker (returned BY REFERENCE — the stamped object itself), else
 * `null` — `null` IS the "not a trip" answer, so no consumer ever
 * touches the throw's properties itself. Shape, never provenance: a
 * well-formed forged marker classifies; a malformed one is `null`.
 */
export default function readLimitTrip(thrown: unknown): LimitTrip | null {
	try {
		if (typeof thrown !== 'object' || thrown === null) {
			return null;
		}
		if (!Object.hasOwn(thrown, LIMIT_MARKER_KEY)) {
			return null;
		}
		const payload = (thrown as Record<string, unknown>)[LIMIT_MARKER_KEY];
		return isWellFormedTrip(payload) ? payload : null;
	} catch {
		return null;
	}
}

/** The full-depth acceptance predicate: finite index, four finite positions. */
function isWellFormedTrip(payload: unknown): payload is LimitTrip {
	if (typeof payload !== 'object' || payload === null) {
		return false;
	}
	const { loopIndex, loc } = payload as {
		readonly loopIndex?: unknown;
		readonly loc?: unknown;
	};
	return Number.isFinite(loopIndex) && isWellFormedLoc(loc);
}

/** Both positions present, all four line/column numbers finite. */
function isWellFormedLoc(loc: unknown): boolean {
	if (typeof loc !== 'object' || loc === null) {
		return false;
	}
	const { start, end } = loc as {
		readonly start?: unknown;
		readonly end?: unknown;
	};
	return isFinitePosition(start) && isFinitePosition(end);
}

/** One `{ line, column }` position with both numbers finite. */
function isFinitePosition(position: unknown): boolean {
	if (typeof position !== 'object' || position === null) {
		return false;
	}
	const { line, column } = position as {
		readonly line?: unknown;
		readonly column?: unknown;
	};
	return Number.isFinite(line) && Number.isFinite(column);
}
