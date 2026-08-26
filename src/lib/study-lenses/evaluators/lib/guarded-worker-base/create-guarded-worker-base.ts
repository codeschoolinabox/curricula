/**
 * The guarded worker base (human rulings 2026-08-25/26): one call at the
 * top of a guarded evaluator's worker setup answers the guard's
 * injectable helpers and the registered halt author together — the
 * wiring the deprecated kind's two setups each hand-rolled, built once
 * so the authors cannot drift. The cap reading, the guard construction,
 * and the author are in-file helpers; the per-evaluator finisher is the
 * one seam, guarded here so a throwing finisher degrades to the
 * unfinished core, never a lost halt (README.md § The skeleton).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { HaltKind, HaltPhase } from '../../../lib/engine/types.js';
import createIterationGuard from '../iteration-guard/create-iteration-guard.js';
import readLimitTrip from '../iteration-guard/read-limit-trip.js';
import type { IterationGuard } from '../iteration-guard/types.js';

import type { FinishHalt, GuardedWorkerBase, HaltCore } from './types.js';

export default function createGuardedWorkerBase(
	workerConfig: unknown,
	finish?: FinishHalt<unknown>,
): GuardedWorkerBase {
	const guard = createIterationGuard(readCap(workerConfig));

	return freezeInPlace({
		guardGlobals: guard.globals,
		serializeHalt: buildAuthor(guard, finish),
	});
}

/**
 * The cap as given, or nothing. Reading `unknown` is the narrowing, not
 * a policy gate — `0`, negatives, `Infinity`, and `NaN` are all numbers
 * and all ride through to iteration-guard's documented edges (pins
 * run:235, intercept:394); anything else reads as no cap.
 */
function readCap(workerConfig: unknown): number | undefined {
	// WHY the cast: workerConfig is clone-transported and contractually
	// unknown at the engine boundary; the member is re-checked here, not
	// trusted.
	const { iterationLimit } = (workerConfig ?? {}) as {
		readonly iterationLimit?: unknown;
	};
	return typeof iterationLimit === 'number' ? iterationLimit : undefined;
}

/**
 * The shared author, closed over this run's guard. Fires on EVERY
 * worker-side stop; stamps the core; hands it to the finisher, guarded —
 * the authored record stays deliberately unfrozen (clone-safe shape is
 * the postMessage requirement, and `trip` is the guard's by reference).
 */
function buildAuthor(guard: IterationGuard, finish?: FinishHalt<unknown>) {
	return function serializeGuardedHalt(
		kind: HaltKind,
		rawError: unknown,
		phase?: HaltPhase,
	): unknown {
		const core = buildCore(guard, kind, rawError, phase);
		if (finish === undefined) {
			return core;
		}
		try {
			return finish(core, rawError);
		} catch {
			// The builder guard (ruled 2026-08-26): a finisher defect —
			// intercept's stack parse is the named first client — degrades
			// to the unfinished core; a throw here would cost the whole
			// halt (worker crash), trip and count included.
			return core;
		}
	};
}

/** Stamp the shared members; the union's arms carry the classification. */
function buildCore(
	guard: IterationGuard,
	kind: HaltKind,
	rawError: unknown,
	phase?: HaltPhase,
): HaltCore {
	const iterationCount = guard.readIterationCount();

	if (kind === 'natural-end') {
		return {
			natural: true,
			errorName: '',
			message: '',
			trip: null,
			iterationCount,
			phase: null,
		};
	}

	return {
		natural: false,
		errorName: rawError instanceof Error ? rawError.name : 'Error',
		message: rawError instanceof Error ? rawError.message : String(rawError),
		trip: readLimitTrip(rawError),
		iterationCount,
		// WHY the fallback: the engine's contract stamps a phase on every
		// 'throw' (SerializeHalt's own JSDoc — "present exactly on 'throw'
		// halts"); this arm is unreachable under that contract and answers
		// the mid-run value if a future engine breaks it, because throwing
		// here would cost the whole halt.
		phase: phase ?? 'evaluation',
	};
}
