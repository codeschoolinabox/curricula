/**
 * @file The seam: translate one engine settlement onto intercept's result.
 *
 * TOTAL by a precedence rule over the CARRIED DATA plus exactly one
 * evaluator-owned classification input — intercept's io flag — never a
 * switch on the outcome label: the engine reports five outcomes, but which
 * of them a settlement *is* answers less than what it *carries*
 * (README.md § The seam, step 0 plus run's steps 1–5 mirrored). Step 0
 * splits on the consumer's stop: the cancel route settles `'cancel'`
 * (HR-7's structural drain-cancel arrives on this route too, carrying the
 * events delivered before the unanswered ask), and the fail route settles
 * `'fail'` with the consumer's reason — the machinery's `'failed'`
 * settlement is REAL for intercept because the fail door speaks the
 * engine's own `fail`, so the reason is carried data
 * (`EngineSettlement.failReason`, by reference); the closure-side fail
 * record feeds the pre-ignition inert thunk instead, which never reaches
 * this mapper (DOCS.md § Decisions, the fail-door bullet). The
 * worker-authored halt payload crosses the wire untyped and is narrowed
 * exactly ONCE, here: the natural arm enforces the union's pinned empty
 * members — `loc: null` included — and the throw arm requires the
 * engine's two-value phase and a `null`-or-span-shaped attributed call
 * site whose four position leaves are FINITE NUMBERS — deliberately
 * deeper than the deprecated port's positions-as-objects depth and than
 * run's trip check (the I5 ar-3 round's deepening, human ruling
 * 2026-09-02: this loc has no upstream verb vouching for its leaves, so
 * the record path's leaf-finiteness depth applies); anything less routes
 * to the defensive defect arm rather than being read field by field. An
 * engine-authored halt (`haltOrigin: 'engine'`, the creation-gate
 * refusal — unreachable under intercept's `'function'` axis) carries no
 * `natural` member and fails this narrowing into the defensive arm by
 * construction, so `haltOrigin` is deliberately not consulted. Engine
 * spellings never reach the result — the mapper speaks the reference
 * vocabulary only.
 *
 * This is also where intercept's result-side joins are assembled from the
 * DELIVERED events (HR-12): `visitCounts` counts RECORDS (a console call
 * or an answered dialog — never an ask, never an in-stream error event —
 * so the number is mock-independent) and `eventsByNode` joins EVERY
 * event, asks included, because a join is not a count. Both are keyed by
 * the enriched `nodePath`, and a null-attribution event mints no key —
 * the decided null-key policy: an honest absence over a sentinel bucket,
 * the event itself still riding `events` with its `loc: null`.
 *
 * And this is where intercept's deep freeze lands (the machinery freezes
 * only its own floor). The interior asymmetries are deliberate: the trip
 * and halt crossed a structured clone, so they are fresh allocations
 * nobody else holds — ours to freeze; the io flag arrives already frozen
 * at the io seam and rides the arm unchanged; `events`, `options`, and
 * `entwined` were frozen by their authors, so the deep pass crossing into
 * them is idempotent and preserves the carried references (the
 * non-enumerable graph accessors sit outside the walk by construction —
 * `freezeInPlace` reads enumerable members only, so no accessor is ever
 * invoked here); and the fail arm's `reason` is frozen through — the
 * reference's own behavior (the quarry's fail arm deep-freezes the whole
 * result, reason included).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Entwined, NodePath } from '../../embody/types.js';
import type { EngineError, EngineSettlement } from '../../lib/engine/types.js';

import type {
	InterceptEvent,
	InterceptHalt,
	InterceptIoFlag,
	InterceptLoc,
	InterceptResult,
	MachineryDefectError,
	ResolvedInterceptOptions,
	TimeoutResultError,
} from './types.js';

/**
 * Map one engine settlement onto intercept's result.
 *
 * The precedence, in order: the consumer's stop settles first, whatever
 * else happened — the cancel route as `'cancel'` (the machinery's
 * first-write-wins cancel discards a halt; HR-7's structural drain-cancel
 * is this route) and the fail route as `'fail'` carrying the consumer's
 * reason — outranking even the io flag in both directions (run's step-0
 * ruling 2026-08-19, mirrored). The io flag answers next: an io failure
 * reaches the machinery as its generic causes, so without this step the
 * `'io'` arm would be unreachable. Then a well-formed worker halt
 * recording a throw — the guard's trip when present (structural, never a
 * message match), else the program's own throw with its attributed call
 * site. Then an engine-made error — the budget when that is its
 * structured cause, the machinery defect otherwise. Then a completed run
 * carrying its natural halt is `'complete'` with the run total. Every
 * remaining combination is the defensive defect arm with cause
 * `'unreachable-outcome'`.
 *
 * Every arm carries the common record: the delivered `events` (the one
 * archive), the `code` and `options` echoes, the result-side `entwined`
 * echo, and the two joins assembled here from the events.
 *
 * @param settlement - The engine's settlement, with whatever it carried.
 * @param ioFlag - intercept's closure-side io classification record, or
 *   `null` when no io failure was recorded; precedence step 1 rides it
 *   onto the `'io'` arm unchanged and re-derives nothing.
 * @param events - Every delivered event, in worker order — carried by
 *   reference onto every arm, and the joins' one input.
 * @param code - The learner's own text, the result echo.
 * @param options - The resolved options echo; its `seconds` feeds only
 *   the timeout arm's `limit`, never the arm selection.
 * @param entwined - The facts' entwined record, gate-guaranteed — echoed
 *   on every arm by reference.
 * @returns intercept's result, deep-frozen through its interior.
 */
export default function mapSettlement(
	settlement: EngineSettlement,
	ioFlag: InterceptIoFlag | null,
	events: readonly InterceptEvent[],
	code: string,
	options: ResolvedInterceptOptions,
	entwined: Entwined,
): InterceptResult {
	const base = { events, code, options, entwined, ...buildJoins(events) };

	// 0. the consumer's stop settles first, the io flag included: the
	// cancel route (first-write-wins; a riding halt is discarded), then
	// the fail route with the carried reason
	if (settlement.outcome === 'cancelled') {
		return freezeInPlace<InterceptResult>({
			...base,
			outcome: 'cancel',
			ok: true,
		});
	}
	if (settlement.outcome === 'failed') {
		return freezeInPlace<InterceptResult>({
			...base,
			outcome: 'fail',
			ok: true,
			reason: settlement.failReason,
		});
	}

	// 1. the io flag answers next, riding the arm unchanged
	if (ioFlag !== null) {
		return freezeInPlace<InterceptResult>({
			...base,
			outcome: 'error',
			ok: false,
			error: ioFlag,
		});
	}

	// 2. a well-formed worker halt recording a throw — the guard's trip
	// when present (structural, never a message match), else the program's
	// own throw carrying its attributed call site
	const halt = narrowHalt(settlement.halt);
	if (halt !== null && !halt.natural) {
		return freezeInPlace<InterceptResult>(
			halt.trip === null
				? {
						...base,
						outcome: 'error',
						ok: false,
						error: {
							kind: 'javascript',
							name: halt.errorName,
							message: halt.message,
							loc: halt.loc,
							phase: halt.phase,
							iterationCount: halt.iterationCount,
						},
					}
				: {
						...base,
						outcome: 'iteration-limit',
						ok: false,
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
			options.seconds,
			settlement.durationMs,
		);
		return freezeInPlace<InterceptResult>(
			error.kind === 'timeout'
				? { ...base, outcome: 'timeout', ok: false, error }
				: { ...base, outcome: 'error', ok: false, error },
		);
	}

	// 4. a completed run carrying its natural halt
	if (settlement.outcome === 'completed' && halt !== null) {
		return freezeInPlace<InterceptResult>({
			...base,
			outcome: 'complete',
			ok: true,
			iterationCount: halt.iterationCount,
		});
	}

	// 5. every remaining combination is the defensive defect arm
	return unreachableOutcome(settlement.outcome, base);
}

/**
 * The common record every arm carries, assembled once per settlement —
 * the mirror of `types.ts`'s private `InterceptResultBase`, restated
 * structurally because that base is deliberately unexported (the result
 * union is the contract; its base is plumbing).
 */
type AssembledBase = {
	readonly events: readonly InterceptEvent[];
	readonly code: string;
	readonly options: ResolvedInterceptOptions;
	readonly entwined: Entwined;
	readonly visitCounts: Readonly<Record<NodePath, number>>;
	readonly eventsByNode: Readonly<Record<NodePath, readonly InterceptEvent[]>>;
};

/**
 * The two result-side joins, assembled in one pass over the delivered
 * events (HR-12). `visitCounts` counts RECORDS — a console call or an
 * answered dialog (README.md § Glossary), never a pending ask and never
 * an in-stream error event — so the number is mock-independent: an
 * unmocked dialog's ask and record are two events but one count.
 * `eventsByNode` joins EVERY event, asks and error events included,
 * because a join is not a count. Both are keyed by the enriched
 * `nodePath`; a null-attribution event mints no key in either (the
 * decided null-key policy — the event still rides `events`).
 */
function buildJoins(events: readonly InterceptEvent[]): {
	visitCounts: Record<NodePath, number>;
	eventsByNode: Record<NodePath, readonly InterceptEvent[]>;
} {
	const visitCounts: Record<NodePath, number> = {};
	const eventsByNode: Record<NodePath, InterceptEvent[]> = {};

	for (const event of events) {
		if (event.nodePath === null) {
			continue;
		}
		const joined = eventsByNode[event.nodePath] ?? [];
		// eslint-disable-next-line functional/immutable-data -- the join list grows per delivered event; frozen with the result
		joined.push(event);
		// eslint-disable-next-line functional/immutable-data -- a local accumulator for this one pass; frozen with the result
		eventsByNode[event.nodePath] = joined;
		if (isRecord(event)) {
			// eslint-disable-next-line functional/immutable-data -- a local accumulator for this one pass; frozen with the result
			visitCounts[event.nodePath] = (visitCounts[event.nodePath] ?? 0) + 1;
		}
	}

	return { visitCounts, eventsByNode };
}

/**
 * A RECORD is a completed moment — a console call or an answered dialog
 * (README.md § Glossary). The pending ask and the in-stream error arm
 * are moments but not records, and `visitCounts` counts records only.
 */
function isRecord(event: InterceptEvent): boolean {
	return (
		event.event === 'console' ||
		event.event === 'prompt' ||
		event.event === 'alert' ||
		event.event === 'confirm'
	);
}

/**
 * The engine's own error, in the reference vocabulary. The budget answers
 * as the timeout arm's error — the resolved budget echoed as `limit`, the
 * consumed budget the machinery already computed as `durationMs`
 * (`EngineSettlement.durationMs`); every machinery cause mirrors
 * structurally onto the defect arm. The engine's timeout cause is
 * deliberately not mirrored into {@link MachineryDefectError} — the
 * timeout kind already says it, and a second copy of one fact is what
 * this contract avoids (run's rule, mirrored).
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
 * The defensive arm: a combination intercept's surface cannot produce
 * reached the mapper — a completed settlement missing its halt, a payload
 * that failed the narrowing, or an outcome nothing above claimed. Loud in
 * development and well-formed at the learner — never `undefined` machine
 * words — because the honest answer to "this cannot happen" is to say
 * so, not to guess which arm was meant (run's rule, mirrored: no machine
 * ran → no machinery cause is honest).
 */
function unreachableOutcome(
	outcome: EngineSettlement['outcome'],
	base: AssembledBase,
): InterceptResult {
	console.warn(
		`intercept: unreachable engine settlement reached map-settlement (outcome "${outcome}"). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<InterceptResult>({
		...base,
		outcome: 'error',
		ok: false,
		error: {
			kind: 'defect',
			name: 'Error',
			message: `intercept received an engine settlement it cannot map (outcome "${outcome}")`,
			cause: 'unreachable-outcome',
		},
	});
}

/**
 * The halt payload's ONE narrowing site. It crossed the wire as untyped
 * clone data; anything failing the full discriminated shape is `null`,
 * which routes to the defensive arm rather than being read field by
 * field. The natural arm enforces the union's pinned empty members —
 * `loc: null` included, intercept's own fifth pin (run's strict-natural
 * ruling 2026-08-26, extended to the loc member this unit adds); the
 * throw arm requires the engine's two-value phase, so the mapper reads
 * an `ErrorPhase`, never a fabricated default, and an attributed call
 * site that is `null` or a span at leaf depth.
 */
function narrowHalt(payload: unknown): InterceptHalt | null {
	if (typeof payload !== 'object' || payload === null) {
		return null;
	}
	const { natural, errorName, message, trip, iterationCount, phase, loc } =
		payload as Partial<InterceptHalt>;
	if (typeof natural !== 'boolean' || typeof iterationCount !== 'number') {
		return null;
	}
	if (natural) {
		const wordsArePinnedEmpty = errorName === '' && message === '';
		const attributionIsPinnedNull =
			trip === null && phase === null && loc === null;
		return wordsArePinnedEmpty && attributionIsPinnedNull
			? (payload as InterceptHalt)
			: null;
	}
	const wordsAreSound =
		typeof errorName === 'string' && typeof message === 'string';
	const phaseIsSound = phase === 'creation' || phase === 'evaluation';
	const attributionIsSound = isTripShaped(trip) && isLocShaped(loc);
	return wordsAreSound && phaseIsSound && attributionIsSound
		? (payload as InterceptHalt)
		: null;
}

/**
 * `null`, or a trip carrying its two named parts down to the span's two
 * positions. The leaf finiteness checks stay iteration-guard's:
 * `readLimitTrip` accepts a trip at full depth worker-side before it is
 * ever stamped onto a halt, so duplicating that predicate here would put
 * its acceptance rule in two places (run's depth, mirrored with its
 * AR-4 2026-08-26 deepening). What this owns is that the field arriving
 * over the wire is trip-SHAPED at all — an empty object, and an empty
 * `loc`, must not reach a consumer typed to read `trip.loc.start.line`.
 */
function isTripShaped(trip: unknown): boolean {
	if (trip === null) {
		return true;
	}
	if (typeof trip !== 'object') {
		return false;
	}
	const { loopIndex, loc } = trip as { loopIndex?: unknown; loc?: unknown };
	if (
		typeof loopIndex !== 'number' ||
		typeof loc !== 'object' ||
		loc === null
	) {
		return false;
	}
	const { start, end } = loc as { start?: unknown; end?: unknown };
	return (
		typeof start === 'object' &&
		start !== null &&
		typeof end === 'object' &&
		end !== null
	);
}

/**
 * `null`, or a span whose four position leaves are FINITE NUMBERS — the
 * record path's leaf-finiteness depth, deliberately DEEPER than the
 * deprecated port's positions-as-objects check and than `isTripShaped`
 * beside it (the I5 ar-3 round's deepening, human ruling 2026-09-02): a
 * trip's leaves were validated worker-side by iteration-guard's own verb
 * before the stamp, but the halt's attributed call site has no upstream
 * verb vouching for its leaves — this site is its only gate, so a forged
 * or empty leaf must not ride the `'javascript'` arm to a consumer typed
 * to read `error.loc.start.line`. An absent key fails (the halt declares
 * `loc` required); `null` passes as the stated no-attribution arm.
 */
function isLocShaped(loc: unknown): boolean {
	if (loc === null) {
		return true;
	}
	if (typeof loc !== 'object') {
		return false;
	}
	const { start, end } = loc as Partial<InterceptLoc>;
	return isPositionShaped(start) && isPositionShaped(end);
}

/** A position at leaf depth: `line` and `column` both finite numbers. */
function isPositionShaped(position: unknown): boolean {
	if (typeof position !== 'object' || position === null) {
		return false;
	}
	const { line, column } = position as { line?: unknown; column?: unknown };
	return Number.isFinite(line) && Number.isFinite(column);
}
