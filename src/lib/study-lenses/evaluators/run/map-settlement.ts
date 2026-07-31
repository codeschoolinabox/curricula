/**
 * @file The engine→kind bridge: translate the engine's settlement onto the
 * kind's three arms, carrying run's richer error on the error arm.
 *
 * TOTAL by a precedence rule over the CARRIED DATA, never a switch on the
 * outcome label — the engine reports five outcomes, but which of them a
 * settlement *is* answers less than what it *carries*. The worker-authored
 * halt payload crosses the wire untyped and is narrowed exactly ONCE, here;
 * anything that fails the narrowing routes to the defensive arm rather than
 * being guessed about.
 *
 * This is also where run's deep freeze lands, and the asymmetry with the halt
 * author is deliberate: R1 pointedly does NOT freeze the trip, because
 * worker-side it is iteration-guard's object handed back by reference and a
 * forgery's record belongs to the learner's program. By the time it arrives
 * here it has crossed a structured clone, so it is a fresh allocation nobody
 * else holds — ours to freeze, and the engine's contract says the deep pass
 * on consumer payloads is the evaluator's.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EngineError, EngineSettlement } from '../../lib/engine/types.js';

import type { RunEvaluationError, RunHalt, RunSettlement } from './types.js';

/**
 * Map one engine settlement onto run's settlement.
 *
 * The precedence, in order: a well-formed halt RECORDING A THROW wins — the
 * guard's trip when classification attributed one, else the program's own
 * throw; natural-end halts fall through. Else an engine-made error answers —
 * the budget when that is its structured cause, the machinery otherwise.
 * Else a consumer-ended run is canceled and a completed one carrying its
 * natural halt is clean. Every remaining combination is the defensive defect
 * arm, loudly flagged as a dev condition.
 *
 * @param settlement - The engine's settlement, with whatever it carried.
 * @returns run's settlement, deep-frozen through its interior.
 */
export default function mapSettlement(
	settlement: EngineSettlement,
): RunSettlement {
	const halt = narrowHalt(settlement.halt);

	if (halt !== null && !halt.natural) {
		return freezeInPlace<RunSettlement>({
			ended: 'error',
			error:
				halt.trip === null
					? {
							name: halt.errorName,
							message: halt.message,
							reason: 'threw',
							iterationCount: halt.iterationCount,
						}
					: {
							name: halt.errorName,
							message: halt.message,
							reason: 'loop-cap',
							iterationCount: halt.iterationCount,
							trip: halt.trip,
						},
		});
	}

	if (settlement.error !== undefined) {
		return freezeInPlace<RunSettlement>({
			ended: 'error',
			error: fromEngineError(settlement.error),
		});
	}

	if (settlement.outcome === 'cancelled') {
		return freezeInPlace<RunSettlement>({ ended: 'canceled' });
	}

	if (settlement.outcome === 'completed' && halt !== null) {
		return freezeInPlace<RunSettlement>({ ended: 'clean' });
	}

	return unreachableOutcome(settlement.outcome);
}

/**
 * The engine's own error, in run's vocabulary. The budget answers as its own
 * reason; every machinery cause mirrors structurally onto the defect arm. The
 * engine's timeout cause is deliberately not mirrored — `reason` already says
 * it, and a second copy of one fact is what this contract avoids.
 */
function fromEngineError(
	error: EngineError,
): Extract<RunEvaluationError, { reason: 'timeout' | 'defect' }> {
	if (error.cause === 'timeout') {
		return { name: error.name, message: error.message, reason: 'timeout' };
	}
	return {
		name: error.name,
		message: error.message,
		reason: 'defect',
		cause: error.cause,
	};
}

/**
 * The defensive arm: a combination run's surface cannot produce reached the
 * mapper. Loud in development and well-formed at the learner — never
 * `undefined` machine words — because the honest answer to "this cannot
 * happen" is to say so, not to guess which arm was meant.
 */
function unreachableOutcome(outcome: string): RunSettlement {
	console.warn(
		`run: unreachable engine settlement reached map-settlement (outcome "${outcome}"). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<RunSettlement>({
		ended: 'error',
		error: {
			name: 'Error',
			message: `run received an engine settlement it cannot map (outcome "${outcome}")`,
			reason: 'defect',
			cause: 'unreachable-outcome',
		},
	});
}

/**
 * The halt payload's ONE narrowing site. It crossed the wire as untyped clone
 * data; anything failing the full shape is `null`, which routes to the
 * defensive arm rather than being read field by field.
 */
function narrowHalt(payload: unknown): RunHalt | null {
	if (typeof payload !== 'object' || payload === null) {
		return null;
	}
	const { natural, errorName, message, trip, iterationCount } =
		payload as Partial<RunHalt>;
	const wordsAreSound =
		typeof errorName === 'string' && typeof message === 'string';
	const stopIsSound =
		typeof natural === 'boolean' && typeof iterationCount === 'number';

	return wordsAreSound && stopIsSound && isTripShaped(trip)
		? (payload as RunHalt)
		: null;
}

/**
 * `null`, or a trip carrying its two named parts. The leaf finiteness checks
 * stay iteration-guard's: `readLimitTrip` accepts a trip at full depth
 * worker-side before it is ever stamped onto a halt, so duplicating that
 * predicate here would put its acceptance rule in two places. What this owns
 * is that the field arriving over the wire is trip-SHAPED at all — an empty
 * object must not reach a consumer typed to read `trip.loc.start.line`.
 */
function isTripShaped(trip: unknown): boolean {
	if (trip === null) {
		return true;
	}
	if (typeof trip !== 'object') {
		return false;
	}
	const { loopIndex, loc } = trip as Partial<RunHalt['trip'] & object>;
	return (
		typeof loopIndex === 'number' && typeof loc === 'object' && loc !== null
	);
}
