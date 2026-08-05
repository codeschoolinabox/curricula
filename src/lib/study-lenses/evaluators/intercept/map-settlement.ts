/**
 * @file The engine→kind bridge (DOCS.md phase 10): translate the engine's
 * settlement onto the kind's three arms, carrying intercept's richer error.
 *
 * TOTAL by a precedence rule over the CARRIED DATA, running THROUGH THE
 * TRIP — never through the outcome label, and never through whether a span
 * exists: a well-formed trip means the guard stopped the run (`'loop-cap'`,
 * the trip being classification AND attribution in one field, NO separate
 * span beside it); otherwise a non-natural halt means the program threw
 * (`'threw'`, carrying the stamped call site or its honest null);
 * natural-end halts fall through. Else an engine-made error answers — the
 * budget as its own `'timeout'`, the machinery causes onto `'defect'`. Else
 * a consumer-ended run is canceled and a completed one carrying its natural
 * halt is clean. Every remaining combination is the defensive
 * `'defect'`/`'unreachable-outcome'` arm, loudly flagged as a dev
 * condition — never a guess. A guard throw that propagated through a
 * wrapped call legitimately carries BOTH trip and loc; the trip wins, which
 * is why the halt's two attribution fields can never disagree on the arm.
 *
 * The halt payload crossed the wire untyped and is narrowed exactly ONCE,
 * here, at full depth: the machine words, the stop booleans, a trip that is
 * trip-SHAPED (its two named parts — leaf finiteness stays
 * iteration-guard's, whose verb validated full depth before the stamp ever
 * happened), and a loc arm that is null or span-SHAPED (both positions
 * present as objects — the depth run's `isTripShaped` ruling pinned, so a
 * forged halt can never make a consumer's `error.loc.start.line` read
 * throw). Anything less routes to the defensive arm.
 *
 * This is also where intercept's deep freeze lands (run's R3 asymmetry
 * ruling): by the time a trip or loc arrives here it has crossed a
 * structured clone and is a fresh allocation nobody else holds — ours to
 * freeze.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EngineError, EngineSettlement } from '../../lib/engine/types.js';

import type {
	InterceptEvaluationError,
	InterceptHalt,
	InterceptLoc,
	InterceptSettlement,
} from './types.js';

/**
 * Map one engine settlement onto intercept's settlement.
 *
 * @param settlement - The engine's settlement, with whatever it carried.
 * @returns intercept's settlement, deep-frozen through its interior.
 */
export default function mapSettlement(
	settlement: EngineSettlement,
): InterceptSettlement {
	const halt = narrowHalt(settlement.halt);

	// The trip first, unconditioned on the natural flag — the committed
	// phase-10 wording read literally: "a well-formed trip means the guard
	// stopped the run, ELSE a non-natural halt means the program threw".
	if (halt !== null && halt.trip !== null) {
		return freezeInPlace<InterceptSettlement>({
			ended: 'error',
			error: {
				name: halt.errorName,
				message: halt.message,
				reason: 'loop-cap',
				iterationCount: halt.iterationCount,
				trip: halt.trip,
			},
		});
	}

	if (halt !== null && !halt.natural) {
		return freezeInPlace<InterceptSettlement>({
			ended: 'error',
			error: {
				name: halt.errorName,
				message: halt.message,
				reason: 'threw',
				iterationCount: halt.iterationCount,
				loc: halt.loc,
			},
		});
	}

	if (settlement.error !== undefined) {
		return freezeInPlace<InterceptSettlement>({
			ended: 'error',
			error: fromEngineError(settlement.error),
		});
	}

	if (settlement.outcome === 'cancelled') {
		return freezeInPlace<InterceptSettlement>({ ended: 'canceled' });
	}

	if (settlement.outcome === 'completed' && halt !== null) {
		return freezeInPlace<InterceptSettlement>({ ended: 'clean' });
	}

	return unreachableOutcome(settlement.outcome);
}

/**
 * The engine's own error, in intercept's vocabulary — the budget as its own
 * reason (the floor alone), every machinery cause mirrored structurally
 * onto the defect arm. The engine's timeout cause is deliberately not
 * mirrored: `reason` already says it.
 */
function fromEngineError(
	error: EngineError,
): Extract<InterceptEvaluationError, { reason: 'timeout' | 'defect' }> {
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
 * The defensive arm: a combination intercept's surface cannot produce
 * reached the mapper. Loud in development and well-formed at the learner —
 * the honest answer to "this cannot happen" is to say so, not to guess
 * which arm was meant.
 */
function unreachableOutcome(outcome: string): InterceptSettlement {
	console.warn(
		`intercept: unreachable engine settlement reached map-settlement (outcome "${outcome}"). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<InterceptSettlement>({
		ended: 'error',
		error: {
			name: 'Error',
			message: `intercept received an engine settlement it cannot map (outcome "${outcome}")`,
			reason: 'defect',
			cause: 'unreachable-outcome',
		},
	});
}

/**
 * The halt payload's ONE narrowing site. It crossed the wire as untyped
 * clone data; anything failing the full shape is `null`, which routes to
 * the defensive arm rather than being read field by field.
 */
function narrowHalt(payload: unknown): InterceptHalt | null {
	if (typeof payload !== 'object' || payload === null) {
		return null;
	}
	const { natural, errorName, message, trip, loc, iterationCount } =
		payload as Partial<InterceptHalt>;
	const wordsAreSound =
		typeof errorName === 'string' && typeof message === 'string';
	const stopIsSound =
		typeof natural === 'boolean' && typeof iterationCount === 'number';
	const attributionIsSound = isTripShaped(trip) && isLocShaped(loc);

	return wordsAreSound && stopIsSound && attributionIsSound
		? (payload as InterceptHalt)
		: null;
}

/**
 * `null`, or a trip carrying its two named parts. Leaf finiteness stays
 * iteration-guard's — `readLimitTrip` accepted the record at full depth
 * worker-side before it was ever stamped (run's R3 ruling: what this owns
 * is that the wire field is trip-SHAPED at all).
 */
function isTripShaped(trip: unknown): boolean {
	if (trip === null) {
		return true;
	}
	if (typeof trip !== 'object') {
		return false;
	}
	const { loopIndex, loc } = trip as Partial<InterceptHalt['trip'] & object>;
	return (
		typeof loopIndex === 'number' && typeof loc === 'object' && loc !== null
	);
}

/**
 * `null`, or a span carrying both positions as objects — the same depth as
 * the trip's check, so a forged halt can never make a consumer's
 * `error.loc.start.line` read throw. The leaves were produced by
 * intercept's own decoder (four finite numbers or no stamp); a forged
 * garbage leaf renders garbage without throwing anywhere.
 *
 * Deliberately SHALLOWER than the record path's loc check
 * (`narrow-record-message.ts`, full leaf finiteness): the record depth is
 * B-4's own ruling for that seam, while the halt follows run's R3
 * trip-shaped precedent — one depth per ruling, each named at its site.
 * An absent key fails here (the halt declares `loc` required); `null`
 * passes as the stated no-attribution arm.
 */
function isLocShaped(loc: unknown): boolean {
	if (loc === null) {
		return true;
	}
	if (typeof loc !== 'object') {
		return false;
	}
	const { start, end } = loc as Partial<InterceptLoc & object>;
	return (
		typeof start === 'object' &&
		start !== null &&
		typeof end === 'object' &&
		end !== null
	);
}
