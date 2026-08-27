/**
 * @file The seam: translate one engine settlement onto run's result.
 *
 * TOTAL by a precedence rule over the CARRIED DATA plus exactly one
 * evaluator-owned classification input — run's io flag — never a switch
 * on the outcome label: the engine reports five outcomes, but which of
 * them a settlement *is* answers less than what it *carries*
 * (README.md § The seam, steps 0-5). The worker-authored halt payload
 * crosses the wire untyped and is narrowed exactly ONCE, here; anything
 * failing the narrowing routes to the defensive defect arm rather than
 * being read field by field. Engine spellings never reach the result —
 * the mapper speaks the reference vocabulary only (T1's composition).
 *
 * This is also where run's deep freeze lands (the machinery freezes only
 * its own floor). The interior asymmetries are deliberate: the trip
 * crossed a structured clone, so it is a fresh allocation nobody else
 * holds — ours to freeze; the io flag arrives already frozen at run's io
 * seam and rides the arm unchanged; and the ast echo was frozen by the
 * embodiment (freeze-what-you-own), so the deep pass crossing into it is
 * idempotent and preserves the gate-guaranteed reference.
 */

import type { Program } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EngineError, EngineSettlement } from '../../lib/engine/types.js';

import type {
	LimitTrip,
	MachineryDefectError,
	RunHalt,
	RunIoFlag,
	RunResult,
	TimeoutResultError,
} from './types.js';

/**
 * Map one engine settlement onto run's result.
 *
 * The precedence, in order: a consumer-ended run settles `'cancel'`,
 * whatever else happened — the explicit stop outranks even the io flag
 * (human ruling 2026-08-19). The io flag answers next: an io failure
 * reaches the machinery as its generic call-error cause, so without this
 * step the `'io'` arm would be unreachable. Then a well-formed worker
 * halt recording a throw — the guard's trip when present (structural,
 * never a message match), else the program's own throw. Then an
 * engine-made error — the budget when that is its structured cause, the
 * machinery defect otherwise. Then a completed run carrying its natural
 * halt is `'complete'`. Every remaining combination is the defensive
 * defect arm with cause `'unreachable-outcome'` — including the
 * machinery's `'failed'` outcome, which run's surface cannot produce.
 *
 * @param settlement - The engine's settlement, with whatever it carried.
 * @param ioFlag - run's closure-side io classification record, or `null`
 *   when no io failure was recorded; precedence step 1 rides it onto the
 *   `'io'` arm unchanged and re-derives nothing.
 * @param ast - The facts' parsed root, gate-guaranteed — echoed on every
 *   arm by reference.
 * @param seconds - The resolved budget the handle echoes; it feeds only
 *   the timeout arm's `limit` echo, never the arm selection — the io
 *   flag stays the mapper's one evaluator-owned classification input.
 * @returns run's result, deep-frozen through its interior.
 */
export default function mapSettlement(
	settlement: EngineSettlement,
	ioFlag: RunIoFlag | null,
	ast: Program,
	seconds: number,
): RunResult {
	// 0. the consumer's explicit stop outranks everything, the io flag
	// included; the machinery's first-write-wins cancel discards any halt
	if (settlement.outcome === 'cancelled') {
		return freezeInPlace<RunResult>({ outcome: 'cancel', ok: false, ast });
	}

	// 1. the io flag answers next, riding the arm unchanged
	if (ioFlag !== null) {
		return freezeInPlace<RunResult>({
			outcome: 'error',
			ok: false,
			ast,
			error: ioFlag,
		});
	}

	// 2. a well-formed worker halt recording a throw — the guard's trip when
	// present (structural, never a message match), else the program's own
	const halt = narrowHalt(settlement.halt);
	if (halt !== null && !halt.natural) {
		return freezeInPlace<RunResult>(
			halt.trip === null
				? {
						outcome: 'error',
						ok: false,
						ast,
						error: {
							kind: 'javascript',
							name: halt.errorName,
							message: halt.message,
							phase: halt.phase,
							iterationCount: halt.iterationCount,
						},
					}
				: {
						outcome: 'iteration-limit',
						ok: false,
						ast,
						error: {
							kind: 'iteration-limit',
							name: halt.errorName,
							message: halt.message,
							iterationCount: halt.iterationCount,
							trip: halt.trip,
						},
					},
		);
	}

	// 3. an engine-made error — the budget when that is its structured
	// cause, the machinery defect otherwise
	if (settlement.error !== undefined) {
		const error = fromEngineError(
			settlement.error,
			seconds,
			settlement.durationMs,
		);
		return freezeInPlace<RunResult>(
			error.kind === 'timeout'
				? { outcome: 'timeout', ok: false, ast, error }
				: { outcome: 'error', ok: false, ast, error },
		);
	}

	// 4. a completed run carrying its natural halt
	if (settlement.outcome === 'completed' && halt !== null) {
		return freezeInPlace<RunResult>({
			outcome: 'complete',
			ok: true,
			ast,
			iterationCount: halt.iterationCount,
		});
	}

	// 5. every remaining combination is the defensive defect arm
	return unreachableOutcome(settlement.outcome, ast);
}

/**
 * The engine's own error, in the reference vocabulary. The budget answers
 * as the timeout arm's error — the resolved budget echoed as `limit`, the
 * consumed budget the machinery already computed as `durationMs`
 * (`EngineSettlement.durationMs`); every machinery cause mirrors
 * structurally onto the defect arm. The engine's timeout cause is
 * deliberately not mirrored into {@link MachineryDefectError} — the
 * timeout kind already says it, and a second copy of one fact is what
 * this contract avoids.
 */
function fromEngineError(
	error: EngineError,
	seconds: number,
	durationMs: number,
): TimeoutResultError | MachineryDefectError {
	if (error.cause === 'timeout') {
		return {
			kind: 'timeout',
			name: error.name,
			message: error.message,
			limit: seconds,
			durationMs,
		};
	}
	return {
		kind: 'defect',
		name: error.name,
		message: error.message,
		cause: error.cause,
	};
}

/**
 * The defensive arm: a combination run's surface cannot produce reached
 * the mapper — the machinery's `'failed'` outcome (run installs no
 * `fail`), a completed settlement missing its halt, or a payload that
 * failed the narrowing. Loud in development and well-formed at the
 * learner — never `undefined` machine words — because the honest answer
 * to "this cannot happen" is to say so, not to guess which arm was meant
 * (pin run:289: no machine ran → no machinery cause is honest).
 */
function unreachableOutcome(
	outcome: EngineSettlement['outcome'],
	ast: Program,
): RunResult {
	console.warn(
		`run: unreachable engine settlement reached map-settlement (outcome "${outcome}"). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<RunResult>({
		outcome: 'error',
		ok: false,
		ast,
		error: {
			kind: 'defect',
			name: 'Error',
			message: `run received an engine settlement it cannot map (outcome "${outcome}")`,
			cause: 'unreachable-outcome',
		},
	});
}

/**
 * The halt payload's ONE narrowing site. It crossed the wire as untyped
 * clone data; anything failing the full discriminated shape is `null`,
 * which routes to the defensive arm rather than being read field by
 * field. The natural arm enforces the union's pinned empty members —
 * a human ruling 2026-08-26 (relayed via the orchestrator), stricter
 * than the deprecated port's narrowing, because the committed type says
 * no impossible state is representable; the throw arm requires the
 * engine's two-value phase, so the mapper reads an `ErrorPhase`, never a
 * fabricated default.
 */
function narrowHalt(payload: unknown): RunHalt | null {
	if (typeof payload !== 'object' || payload === null) {
		return null;
	}
	const { natural, errorName, message, trip, iterationCount, phase } =
		payload as Partial<RunHalt>;
	if (typeof natural !== 'boolean' || typeof iterationCount !== 'number') {
		return null;
	}
	if (natural) {
		const pinsHold =
			errorName === '' && message === '' && trip === null && phase === null;
		return pinsHold ? (payload as RunHalt) : null;
	}
	const wordsAreSound =
		typeof errorName === 'string' && typeof message === 'string';
	const phaseIsSound = phase === 'creation' || phase === 'evaluation';
	return wordsAreSound && phaseIsSound && isTripShaped(trip)
		? (payload as RunHalt)
		: null;
}

/**
 * `null`, or a trip carrying its two named parts down to the span's two
 * positions. The leaf finiteness checks stay iteration-guard's:
 * `readLimitTrip` accepts a trip at full depth worker-side before it is
 * ever stamped onto a halt, so duplicating that predicate here would put
 * its acceptance rule in two places. What this owns is that the field
 * arriving over the wire is trip-SHAPED at all — an empty object, and an
 * empty `loc`, must not reach a consumer typed to read
 * `trip.loc.start.line` (AR-4 2026-08-26: the shallow `loc` check
 * inherited from the deprecated port left that consumer unprotected).
 */
function isTripShaped(trip: unknown): boolean {
	if (trip === null) {
		return true;
	}
	if (typeof trip !== 'object') {
		return false;
	}
	const { loopIndex, loc } = trip as Partial<LimitTrip>;
	if (
		typeof loopIndex !== 'number' ||
		typeof loc !== 'object' ||
		loc === null
	) {
		return false;
	}
	const { start, end } = loc as Partial<LimitTrip['loc']>;
	return (
		typeof start === 'object' &&
		start !== null &&
		typeof end === 'object' &&
		end !== null
	);
}
