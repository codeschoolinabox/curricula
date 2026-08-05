/**
 * @file intercept's own contract: the event union it publishes, its settlement
 * details, and the seams its increments are built against.
 *
 * intercept is the first evaluator to publish an event union and the first to
 * emit the kind's distinguished pending interaction, so this module carries
 * both places it extends the kind — a **richer error** above the settlement's
 * `{ name, message }` floor, and an event union over the open envelope — and
 * pins the worker↔thread seams so the worker logic, the narrowing, and the
 * settlement mapper never reverse-engineer each other.
 *
 * Two imports, both sanctioned edges: the kind's own `EvaluationError` and
 * `PendingInteraction` (extended structurally — the documented richer-error and
 * event seams) and iteration-guard's `LimitTrip` / `LoopLoc` (re-exported
 * through this boundary, never re-declared — region-internal shared machinery).
 * The engine's shapes are NOT imported: the one engine vocabulary this contract
 * must speak — the machinery half of {@link InterceptDefectCause} — is mirrored
 * structurally, and a compile-time probe in the tests locks the mirror in the
 * inbound direction. Vocabulary is pinned in README.md § Ubiquitous language.
 */

import type { LimitTrip, LoopLoc } from '../lib/iteration-guard/types.js';
import type { EvaluationError, PendingInteraction } from '../types.js';

export type { LimitTrip } from '../lib/iteration-guard/types.js';

/**
 * A source span in the learner's own text — 1-based lines, 0-based columns.
 * Aliased from the region's committed shape rather than re-declared: one word
 * for one concept, so a trip's loop span and a call site's span are the same
 * kind of thing. `null` wherever a moment or a throw had no wrapped call site
 * to be attributed to.
 */
export type InterceptLoc = LoopLoc;

// ─── The event union ──────────────────────────────────────────────────────────

/**
 * The nineteen standard console method names — documentation only. A record's
 * `method` rides as an OPEN `string` so a method outside this list is reported
 * faithfully rather than dropped, matching the kind's open `kind` envelope.
 * The list reproduces the console surface the behavior reference pinned; find
 * it with `git grep -n "StandardConsoleMethod" -- src/lib/embody`.
 */
export type StandardConsoleMethod =
	| 'log'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'assert'
	| 'table'
	| 'dir'
	| 'dirxml'
	| 'group'
	| 'groupCollapsed'
	| 'groupEnd'
	| 'count'
	| 'countReset'
	| 'time'
	| 'timeEnd'
	| 'timeLog'
	| 'trace'
	| 'clear';

/**
 * What every intercept event carries. `step` is the event's own ordinal on the
 * stream, 1-based and assigned worker-side in emission order — every event has
 * its own, so a dialog's two events differ by one and their ADJACENCY is what
 * pairs them (README § Ubiquitous language: the worker is blocked for a
 * dialog's whole span, so nothing can be emitted between them).
 */
type InterceptEventBase = {
	readonly step: number;
	/**
	 * The call site this moment is attributed to. `null` only where the loc
	 * wrap declined to enclose the call, or where a throw escaped no wrap —
	 * unreachable for a record produced by correct instrumentation.
	 */
	readonly loc: InterceptLoc | null;
};

/**
 * A `console.<method>(…)` call. Emit-only: no round-trip happens, nothing
 * returns to the program, and the record exists the moment the call does. The
 * program is held here until the consumer takes it.
 */
export type InterceptConsoleRecord = InterceptEventBase & {
	readonly kind: 'console';
	/** Open `string`; the {@link StandardConsoleMethod} names, faithfully. */
	readonly method: string;
	readonly args: ReadonlyArray<unknown>;
};

/**
 * An `alert(…)` that has been answered. `returnValue` is present and
 * `undefined` — the value the browser's own `alert` hands back. These traps
 * model the platform's dialogs, so `alert` returning nothing is part of what is
 * modelled, not an absence a consumer must infer.
 */
export type InterceptAlertRecord = InterceptEventBase & {
	readonly kind: 'alert';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: undefined;
};

/** A `confirm(…)` that has been answered; `returnValue` is what it returned. */
export type InterceptConfirmRecord = InterceptEventBase & {
	readonly kind: 'confirm';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: boolean;
};

/** A `prompt(…)` that has been answered; `returnValue` is what it returned. */
export type InterceptPromptRecord = InterceptEventBase & {
	readonly kind: 'prompt';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: string | null;
};

/**
 * One completed boundary moment. Every record carries the RAW fact — the
 * arguments the program actually called with — and a dialog record additionally
 * carries what the program received back. A dialog record does NOT describe
 * what was asked: that lives on the pending interaction immediately before it.
 */
export type InterceptRecord =
	| InterceptConsoleRecord
	| InterceptAlertRecord
	| InterceptConfirmRecord
	| InterceptPromptRecord;

/**
 * What a dialog asked, in intercept's own vocabulary — clone-safe, because
 * this is the half that crosses the wire. `message` is the DECODED fact (what a
 * dialog would show, the first argument as the platform would render it), which
 * is why it sits here while the raw arguments ride the record.
 */
export type InterceptInteractionRequest =
	| { readonly kind: 'alert'; readonly message: string }
	| { readonly kind: 'confirm'; readonly message: string }
	| {
			readonly kind: 'prompt';
			readonly message: string;
			/** Absent when the program passed none — never present-and-undefined. */
			readonly defaultValue?: string;
	  };

/**
 * The kind's distinguished event in intercept's vocabulary: a suspended run
 * plus the channel that releases it. Authored THREAD-side and never a wire
 * message — `respond` is a live main-thread function, while `request` is the
 * clone-safe ask that did cross.
 *
 * `respond` keeps the kind's `unknown` parameter deliberately. Narrowing it per
 * request kind would break assignability to {@link PendingInteraction}, because
 * function parameters are contravariant under `strictFunctionTypes` — so the
 * per-kind discipline is a RUNTIME boundary check, which is what makes a wrong
 * answer a loud, retryable dev error rather than a compile error a consumer
 * would cast away. Answering twice is inert; answering after teardown is inert,
 * whatever it carries, and teardown is consulted BEFORE validation so a lens
 * unmounting mid-interaction never throws out of a dead stream.
 */
export type InterceptPendingInteraction = InterceptEventBase &
	PendingInteraction & {
		readonly kind: 'pending-interaction';
		readonly request: InterceptInteractionRequest;
	};

/**
 * intercept's event union over the kind's open envelope. A console moment
 * yields one event; a dialog moment yields two — its pending interaction, then
 * its record.
 */
export type InterceptEvent = InterceptRecord | InterceptPendingInteraction;

// ─── The richer error and the settlement ──────────────────────────────────────

/**
 * Why a run ended in error — the discriminant the consuming lens renders on.
 *
 * - `threw` — the program's own throw, including a module run whose top-level
 *   evaluation rejects.
 * - `loop-cap` — the iteration guard's marked trip.
 * - `timeout` — the engine's budget elapsed. Reachable with almost no runtime
 *   on a densely emitting program: the engine's flat per-yield charge, not real
 *   time, is what binds first (README § Edge cases).
 * - `defect` — the machinery failed, or an impossible combination reached the
 *   settlement mapper: a dev condition surfaced loudly, never a learner error.
 *
 * Deliberately intercept-local and structurally aligned with the sibling's;
 * promotion onto the kind's `EvaluationError` is a recorded close-out question,
 * decided against more than one concrete evaluator.
 */
export type InterceptErrorReason = 'threw' | 'loop-cap' | 'timeout' | 'defect';

/**
 * The `'defect'` arm's discriminant. The three machinery values mirror the
 * engine's structured cause union minus its timeout value — carrying that one
 * would restate `reason: 'timeout'` — and `'unreachable-outcome'` is
 * intercept's own value for a condition it refuses to guess about: a settlement
 * combination the mapper cannot answer, or an instrument-time dev condition
 * that short-circuited past the engine. `'call-error'` is also where an answer
 * the call channel cannot carry lands, since the machinery could not service
 * the round-trip.
 */
export type InterceptDefectCause =
	| 'worker-error'
	| 'call-error'
	| 'hook-error'
	| 'unreachable-outcome';

/**
 * intercept's error: the kind's floor plus the `reason` discriminant, each arm
 * carrying exactly the fields that exist for it.
 *
 * `threw` carries the innermost wrapped call site it escaped, `null` when it
 * escaped none. `loop-cap` carries the guard's whole trip record and NO
 * separate span: the trip is the classification AND the attribution in one
 * field, and a second span beside it would disagree with the trip the moment a
 * guard throw crossed a wrapped call.
 */
export type InterceptEvaluationError =
	| (EvaluationError & {
			readonly reason: 'threw';
			readonly iterationCount: number;
			readonly loc: InterceptLoc | null;
	  })
	| (EvaluationError & {
			readonly reason: 'loop-cap';
			readonly iterationCount: number;
			readonly trip: LimitTrip;
	  })
	| (EvaluationError & { readonly reason: 'timeout' })
	| (EvaluationError & {
			readonly reason: 'defect';
			readonly cause: InterceptDefectCause;
	  });

/**
 * How a run ended — the kind's `Settlement` with intercept's richer error on
 * the error arm. The clean arm stays the kind's floor: the extension rule names
 * the error arm and the event channel, and intercept invents no clean-arm
 * extension.
 */
export type InterceptSettlement =
	| { readonly ended: 'clean' }
	| { readonly ended: 'error'; readonly error: InterceptEvaluationError }
	| { readonly ended: 'canceled' };

/**
 * What intercept's `main` returns: the kind's evaluation stream over
 * intercept's own union, carrying laziness (the first pull starts the run),
 * cancellation (ceasing to pull tears the run down — and releases whatever it
 * had suspended), and the companion settlement promise. Unlike the eventless
 * sibling's, this stream must be pulled for every event it holds: one pull
 * starts a run but does not finish one.
 */
export type InterceptStream = AsyncIterable<InterceptEvent> & {
	readonly settled: Promise<InterceptSettlement>;
};

// ─── Seam 1: the record message (worker → thread) ─────────────────────────────

/**
 * What the worker emits for a completed boundary moment. The worker authors the
 * COMPLETE record — its step, its span, and a dialog's answered return value —
 * so the thread's mapping is a PURE narrowing, and the message is exactly the
 * clone-safe wire form of an {@link InterceptRecord}. Narrowed at one site; a
 * message failing the narrowing is dropped, never guessed at.
 */
export type InterceptRecordMessage = InterceptRecord;

// ─── Seam 2: the ask and its answer (worker ⇄ thread) ─────────────────────────

/**
 * What the worker's synchronous call carries for one dialog: the ask itself,
 * plus the step and span the pending interaction will wear. The worker blocks
 * for this whole round-trip, which is what makes the run suspended and what
 * guarantees at most one interaction is ever pending.
 */
export type InterceptAskMessage = InterceptEventBase & {
	readonly request: InterceptInteractionRequest;
};

/**
 * A validated answer on its way back to the blocked program. Structurally the
 * engine's call-response vocabulary, mirrored rather than imported; a
 * compile-time probe in the tests locks the mirror. `undefined` is `alert`'s
 * ignored answer. The channel's byte ceiling is the engine's, and an answer
 * over it settles the run on the defect arm rather than being truncated.
 */
export type InterceptAnswer = string | boolean | null | undefined;

// ─── Seam 3: the worker config (thread → worker) ──────────────────────────────

/**
 * The clone-safe data intercept delivers to its worker logic at setup.
 * `iterationLimit` is the spec's `iterations`, passed through UNCHANGED — no
 * clamping, no defaulting, no finiteness gate (cap policy is iteration-guard's
 * documented edge set, and the absence of any default cap is a ratified
 * ruling). Absent → the guard counts but never throws.
 */
export type InterceptWorkerConfig = {
	readonly iterationLimit?: number;
};

// ─── Seam 4: the halt payload (worker → thread) ───────────────────────────────

/**
 * intercept's worker-authored, clone-safe stop record — authored inside the
 * engine's halt seam on EVERY worker-side stop, natural end and throw alike,
 * and narrowed exactly ONCE at the thread-side read site (a payload failing the
 * narrowing is the defensive `'defect'` arm).
 *
 * It carries BOTH `trip` and `loc` because a guard throw that propagates
 * through a wrapped call legitimately has both. The mapper's precedence
 * therefore runs through the TRIP, never through "does a span exist": a
 * well-formed trip ON A HALT THAT RECORDS A STOP means the guard stopped the
 * run, and only otherwise does a non-natural halt mean the program threw. A
 * `natural` halt carrying a trip asserts two contradictory things about one
 * stop — unreachable from a correct halt author, so every mapper branch that
 * reads a halt answers it with the defensive `'defect'` arm rather than
 * guessing which field to believe (human ruling 2026-08-05).
 *
 * Not frozen. What DEV.md § 13 requires of a value crossing `postMessage` is
 * clone-safe SHAPE, which this has; the freeze half protects in-process
 * consumers, and this payload's only one is the bootstrap, which clones it and
 * drops it. Freezing in place would additionally reach into `trip`, which
 * iteration-guard's classification verb hands back BY REFERENCE and intercept
 * does not own. The deep freeze that binds is thread-side, on the settlement.
 */
export type InterceptHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name; `''` on a natural end. */
	readonly errorName: string;
	/** The thrown error's message, or the thrown value in string form. */
	readonly message: string;
	/**
	 * The guard's trip record when the throw was the marked limit throw
	 * (classified structurally, never by message); `null` otherwise.
	 */
	readonly trip: LimitTrip | null;
	/**
	 * The innermost wrapped call site the throw escaped; `null` on a natural
	 * end, on a throw that escaped no wrap, and on an asynchronous rejection,
	 * whose wraps unwound before it surfaced.
	 */
	readonly loc: InterceptLoc | null;
	/** The never-reset run TOTAL of guarded-loop iterations — real on EVERY halt. */
	readonly iterationCount: number;
};

// ─── Seam 5: the loc-wrap helper protocol ─────────────────────────────────────

/**
 * The helper the loc wrap splices calls against and the worker setup
 * implements as an injected global, pinned so the two never reverse-engineer
 * each other. It pushes the encoded span for the call it encloses, invokes the
 * call, stamps that span onto any error propagating through — first write wins,
 * so a throw is attributed to the INNERMOST call it escaped — and restores the
 * stack on the way out.
 *
 * The span is pushed ENCODED and decoded only when a record or a halt needs
 * one, so no decode rides the per-call path. The `__$` prefix is the collision
 * guard the region already owns: the name sits outside the admissible learner
 * identifier surface, and the guard splice's own calls carry the same prefix,
 * which is what the wrap skips so it never wraps them.
 */
export type InterceptLocWrapHelper = {
	readonly __$lc: <T>(encodedLoc: string, call: () => T) => T;
};
