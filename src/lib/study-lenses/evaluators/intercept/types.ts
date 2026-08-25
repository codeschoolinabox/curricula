/**
 * intercept's contract: the spec widening, the streaming handle with its
 * explicit generator surface, the enriched event union, the discriminated
 * result, the error taxonomy, and the two worker seam records. README.md
 * carries the domain model and the design rulings (2026-08-19, the
 * ledger's P0-I bullet with its second round); DOCS.md carries the sketch
 * this file locks. Reference type names return wholesale (HR-8):
 * `InterceptHandle`, `InterceptResult`, `InterceptOptions`' resolved
 * form, `IoMocks`, `IoConsole`, `ConsoleMethod`, the `…ResultError`
 * family; the additions ride in reference style.
 *
 * Deliberately NOT declared here, so the boundary is visible: the handle
 * base and shared vocabulary (the region root's `../types.ts`); the
 * source seam (the execution-handle library's); the trip record
 * (iteration-guard's, aliased through `InterceptLoc`); the engine's
 * shapes (seam modules import them directly; the machinery half of
 * {@link InterceptDefectCause} is mirrored structurally, locked inbound
 * by a compile-time probe in the tests).
 */

import type { Entwined, EntwinedNode, NodePath } from '../../embody/types.js';
import type { LimitTrip, LoopLoc } from '../lib/iteration-guard/types.js';
import type {
	ErrorPhase,
	EvaluationOutcome,
	EvaluationSpec,
	Execution,
	MachineryDefectKind,
	PendingInteraction,
} from '../types.js';

export type { LimitTrip } from '../lib/iteration-guard/types.js';

// ─── The spec widening ───────────────────────────────────────────────────────

/**
 * The nineteen standard console method names — the reference's closed
 * union, kept as the MOCK key set. The event union's `method` is an open
 * string over a whole-surface trap (human ruling 2026-08-19): an exotic
 * legal call records faithfully; only mocking is closed to the nineteen.
 */
export type ConsoleMethod =
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
 * Per-method console callbacks, each AWAITED before the program
 * continues. A throwing or rejecting callback is an io error at
 * intercept's seam — never the reference's learner-shaped disguise. An
 * unmocked method records and nothing more (record-only, human ruling
 * 2026-08-19 — the reference's native forwarding does not return).
 */
export type IoConsole = {
	readonly [K in ConsoleMethod]?: (
		...callArguments: readonly unknown[]
	) => void | Promise<void>;
};

/**
 * intercept's io widening: the reference's dialog slots plus its
 * `console`. `IoMocks` is a per-evaluator type name (run's declares the
 * three dialog slots alone) — the shared spelling is a recorded decision
 * (human ruling 2026-08-19). An unmocked dialog verb takes intercept's
 * posture: the pending interaction while stepping, the structural cancel
 * under a batch drain (HR-7).
 */
export type IoMocks = {
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
	readonly console?: IoConsole;
};

/** intercept's spec: the shared spec plus its one optional widening. */
export type InterceptSpec = EvaluationSpec & {
	readonly io?: IoMocks;
};

/**
 * The options record echoed on the handle: `seconds` ALWAYS populated
 * (the machinery-owned default imported — the same named additive engine
 * increment run's echo depends on); `iterations` and `io` as given.
 */
export type ResolvedInterceptOptions = {
	readonly seconds: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

// ─── The events ──────────────────────────────────────────────────────────────

/**
 * The call-site span, in the learner's own text — 1-based lines, 0-based
 * columns. Aliased from the region guard's committed shape: a trip's loop
 * span and a call site's span are one kind of thing. `null` wherever no
 * wrap attributed the moment.
 */
export type InterceptLoc = LoopLoc;

/**
 * What every delivered event carries (HR-12). Enumerable plain data:
 * `step` (worker-minted, 1-based, strictly increasing — NOT contiguous:
 * a mocked dialog's ask consumes an ordinal the stream never delivers,
 * and adjacency is an array-order property of `events`), the span and
 * offset pair in the facts' coordinate space, and the resolved
 * `nodePath` — `loc`, `start`/`end`, and `nodePath` are `null` together
 * where the wrap declined. The graph views `node`, `prev`, `next` are
 * NON-ENUMERABLE accessors at runtime (installed at enrichment, before
 * the machinery's freeze-at-yield, never written after yield) resolving
 * through the facts' entwined record — serialization stays safe, and a
 * result held across a re-embodiment answers them from a stale graph
 * (`nodePath` is the durable attribution).
 */
type InterceptEventBase = {
	readonly step: number;
	readonly loc: InterceptLoc | null;
	readonly start: number | null;
	readonly end: number | null;
	readonly nodePath: NodePath | null;
	/** NON-ENUMERABLE runtime accessor — the real entwined node; stale across a re-embodiment. */
	readonly node: EntwinedNode | null;
	/** NON-ENUMERABLE runtime accessor — the previous delivered event, or null at the head. */
	readonly prev: InterceptEvent | null;
	/** NON-ENUMERABLE runtime accessor — the next delivered event; null until it arrives. */
	readonly next: InterceptEvent | null;
};

/**
 * The call-backed events additionally resolve their callee — the derived
 * `calleePath` enumerable, the `callee` view a non-enumerable accessor.
 */
type InterceptCallEventBase = InterceptEventBase & {
	readonly calleePath: NodePath | null;
	/** NON-ENUMERABLE runtime accessor — the call's callee node, resolved through the facts. */
	readonly callee: EntwinedNode | null;
};

/** A `console.<method>(…)` call — a record; nothing returns. */
export type ConsoleEvent = InterceptCallEventBase & {
	readonly event: 'console';
	/** Open string; the {@link ConsoleMethod} names are the documented set. */
	readonly method: string;
	readonly args: readonly unknown[];
};

/** An ANSWERED `prompt(…)`: `return` is what the program received. */
export type PromptEvent = InterceptCallEventBase & {
	readonly event: 'prompt';
	readonly args: readonly unknown[];
	readonly return: string | null;
};

/** An ANSWERED `alert(…)`: the void contract's `undefined`, modeled. */
export type AlertEvent = InterceptCallEventBase & {
	readonly event: 'alert';
	readonly args: readonly unknown[];
	readonly return: undefined;
};

/** An ANSWERED `confirm(…)`: `return` is what the program received. */
export type ConfirmEvent = InterceptCallEventBase & {
	readonly event: 'confirm';
	readonly args: readonly unknown[];
	readonly return: boolean;
};

/**
 * What a dialog asked, decoded per verb — the clone-safe half of the
 * pending interaction. `defaultValue` is absent when the program passed
 * none, never present-and-undefined.
 */
export type InterceptInteractionRequest =
	| {
			readonly kind: 'prompt';
			readonly message: string;
			readonly defaultValue?: string;
	  }
	| { readonly kind: 'alert'; readonly message: string }
	| { readonly kind: 'confirm'; readonly message: string };

/**
 * What a responder may answer with; validated per verb at the same table
 * the mocks are — a wrong shape is a loud, retryable dev error at the
 * responder, and an over-ceiling `prompt` answer classifies as an io
 * failure before the channel, never a machinery defect.
 */
export type InterceptDialogAnswer = string | null | boolean | undefined;

/**
 * The ask nobody has answered yet — the kind's distinguished event bound
 * to intercept's real shapes. Its three guarantees: `respond` resumes
 * the run from the event itself; answering twice is inert; answering
 * after teardown is a no-op. Minted only when no mock answered AND the
 * run ignited in iterate mode; a batch drain cancels at the ask instead
 * (HR-7, structural, never temporal).
 */
export type PendingInteractionEvent = InterceptCallEventBase &
	PendingInteraction<InterceptInteractionRequest, InterceptDialogAnswer> & {
		readonly event: 'pending-interaction';
	};

/**
 * The in-stream error arm, restored: step-stamped, landing in order, so
 * in-timeline rendering needs no settlement join. `source` is present on
 * an io failure (a dialog verb or `console.<method>`) and absent on the
 * learner's own throw (human ruling 2026-08-19); machinery defects and
 * engine-made stops are settlement-only. Narrower enrichment: no callee
 * — there is no call.
 */
export type ErrorEvent = InterceptEventBase & {
	readonly event: 'error';
	readonly name: string;
	readonly message: string;
	readonly source?: string;
};

/**
 * intercept's event union, reference spellings: discriminant `event`;
 * `method`, `args`, `return`, `step` as the reference spelled them. A
 * console moment yields one event; an unmocked dialog under a stepping
 * consumer yields two adjacent ones (ask, then record); a mocked dialog
 * yields the record alone.
 */
export type InterceptEvent =
	| ConsoleEvent
	| PromptEvent
	| AlertEvent
	| ConfirmEvent
	| PendingInteractionEvent
	| ErrorEvent;

// ─── The error taxonomy ──────────────────────────────────────────────────────

/**
 * The `'defect'` arm's discriminant — intercept's own mirror of the
 * machinery's causes minus its timeout value, plus `'unreachable-outcome'`
 * for a condition it refuses to guess about. Mirrored with run's
 * citation; locked inbound by a compile-time probe in the tests.
 */
export type InterceptDefectCause =
	| 'worker-error'
	| 'call-error'
	| 'hook-error'
	| 'unreachable-outcome';

/**
 * The program's own failure. Carries the ATTRIBUTED CALL SITE — the
 * wrap's innermost live call, or the one sanctioned stack-parse position
 * for the no-live-frame residual (human ruling 2026-08-19) — `null` only
 * where even that residual gave nothing. The one arm carrying the
 * two-value phase (run's convergence); the halt's real iteration count
 * rides it.
 */
export type JavaScriptResultError = {
	readonly kind: 'javascript';
	readonly name: string;
	readonly message: string;
	readonly loc: InterceptLoc | null;
	readonly phase: ErrorPhase;
	readonly iterationCount: number;
};

/**
 * The io layer's failure — run's ADDITION arm mirrored with its
 * citation, with intercept's own field shape: `source` names the failing
 * surface (a dialog verb, or `console.<method>`).
 */
export type IoResultError = {
	readonly kind: 'io';
	readonly source: string;
	readonly name: string;
	readonly message: string;
};

/**
 * The budget elapsed. `limit` is intercept's own reference restore;
 * `durationMs` is the transferred run-row addition. No halt exists on
 * this route — no count, no position (the reference's `line?`/`phase`
 * here are named drops).
 */
export type TimeoutResultError = {
	readonly kind: 'timeout';
	readonly name: string;
	readonly message: string;
	readonly limit: number;
	readonly durationMs: number;
};

/**
 * The guard's marked trip: the whole trip record, spans decoding against
 * the ORIGINAL text, plus the real run total. The reference's `limit`
 * echo is dropped on intercept's own declaration too (its cell in
 * README § Discharges): the caller holds its own copy.
 */
export type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly iterationCount: number;
	readonly trip: LimitTrip;
};

/**
 * The machinery broke — never the learner's error, never a phase of the
 * learner's program (no `phase`, deliberately). Discriminant kind-pinned;
 * the record intercept's own.
 */
export type MachineryDefectError = {
	readonly kind: MachineryDefectKind;
	readonly name: string;
	readonly message: string;
	readonly cause: InterceptDefectCause;
};

/**
 * Every error kind intercept can surface, discriminated on `kind` — the
 * family roster, kept whole per HR-8. Deliberately, no result field
 * types this union: timeout and iteration-limit ride their own outcome
 * arms, so the `'error'` arm types only its three members.
 */
export type InterceptResultError =
	| JavaScriptResultError
	| IoResultError
	| TimeoutResultError
	| IterationLimitResultError
	| MachineryDefectError;

// ─── The result ──────────────────────────────────────────────────────────────

/** intercept speaks the kind's whole six-value vocabulary. */
export type InterceptOutcome = EvaluationOutcome;

/**
 * The record every arm carries: the whole archive. `events` is the one
 * record of a one-shot stream (HR-2); `code` and `options` are the
 * reference's result echoes; `entwined` is the result-side echo of the
 * same record the handle carries; `visitCounts` counts RECORDS (one per
 * dialog at its record, mock-independent — never per delivered event)
 * and `eventsByNode` joins EVERY event, asks included — both keyed by
 * resolved `nodePath`, loc-null events EXCLUDED from both (the decided
 * null-key policy: honest absence over a sentinel bucket).
 */
type InterceptResultBase = {
	readonly events: readonly InterceptEvent[];
	readonly code: string;
	readonly options: ResolvedInterceptOptions;
	readonly entwined: Entwined;
	readonly visitCounts: Readonly<Record<NodePath, number>>;
	readonly eventsByNode: Readonly<Record<NodePath, readonly InterceptEvent[]>>;
};

/**
 * intercept's result, discriminated on `outcome` — run's HR-4 exception
 * mirrored with its citation: each arm carries exactly the fields that
 * exist for it. `ok` is true on `'complete' | 'cancel' | 'fail'` (the
 * reference's own table — cancel and fail are consumer verbs).
 * `iterationCount` exists exactly where a worker stop record carried it;
 * the fail arm carries the consumer's `reason` by reference and no count
 * (the fail door ends the run thread-side). The result always fulfills,
 * deep-frozen (the accessors excepted by design), memoized.
 */
export type InterceptResult =
	| (InterceptResultBase & {
			readonly outcome: 'complete';
			readonly ok: true;
			readonly iterationCount: number;
	  })
	| (InterceptResultBase & {
			readonly outcome: 'cancel';
			readonly ok: true;
	  })
	| (InterceptResultBase & {
			readonly outcome: 'fail';
			readonly ok: true;
			readonly reason: unknown;
	  })
	| (InterceptResultBase & {
			readonly outcome: 'timeout';
			readonly ok: false;
			readonly error: TimeoutResultError;
	  })
	| (InterceptResultBase & {
			readonly outcome: 'iteration-limit';
			readonly ok: false;
			readonly error: IterationLimitResultError;
	  })
	| (InterceptResultBase & {
			readonly outcome: 'error';
			readonly ok: false;
			readonly error:
				| JavaScriptResultError
				| IoResultError
				| MachineryDefectError;
	  });

// ─── The handle ──────────────────────────────────────────────────────────────

/**
 * intercept's handle: the streaming handle plus the full generator
 * surface (HR-5) and its eager echoes — an explicit surface, never the
 * TypeScript lib's `AsyncGenerator` token (its ratified supersede row).
 *
 * `next()` wraps the handle's own memoized iterator (the library's ruled
 * self-iteration guarantee), substituting the settled result wherever the
 * iterator answers done. `return()` aliases that iterator's own return —
 * the break door: teardown, then the COMPLETE result, resolved only
 * after the settle. `throw(thrown)` ≡ `fail(thrown)` then settle
 * (`outcome: 'fail'`, `reason === thrown`). `fail` records its reason
 * closure-side and the source's stop speaks the machinery's own fail —
 * pre-ignition, the doors answer through the inert-settle thunk.
 * `entwined` is the eager derivation echo (two ruled departures from the
 * reference's `.ast` promise, 2026-08-19).
 */
export type InterceptHandle = Execution<InterceptEvent, InterceptResult> & {
	readonly next: () => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly return: () => Promise<
		IteratorResult<InterceptEvent, InterceptResult>
	>;
	readonly throw: (
		thrown?: unknown,
	) => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly fail: (reason?: unknown) => void;
	readonly code: string;
	readonly options: ResolvedInterceptOptions;
	readonly entwined: Entwined;
};

// ─── Seam 1: the worker stop record (worker → thread) ────────────────────────

/**
 * intercept's worker-authored, clone-safe stop record — run's members
 * plus the attributed call site (the member run cannot honestly stamp;
 * the banked halt question's shape half, resolved 2026-08-19). Authored
 * on EVERY worker-side stop; narrowed exactly once, thread-side; the
 * author dedup with run's is deferred to the W4b chain openers.
 */
export type InterceptHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name; `''` on a natural end. */
	readonly errorName: string;
	/** The thrown error's message, or `String(thrown)`; `''` on a natural end. */
	readonly message: string;
	/**
	 * The attributed call site: the wrap's innermost live call, or the
	 * one sanctioned stack-parse position (spliced-coordinate conversion
	 * is the enrichment increment's named question); `null` where neither
	 * gave one.
	 */
	readonly loc: InterceptLoc | null;
	/** The guard's trip record iff the throw was the marked limit throw. */
	readonly trip: LimitTrip | null;
	/** The never-reset run total of guarded-loop iterations. */
	readonly iterationCount: number;
};

// ─── Seam 2: the worker config (thread → worker) ─────────────────────────────

/**
 * The clone-safe data intercept delivers to its worker logic at setup.
 * `iterationLimit` is the spec's `iterations`, passed through UNCHANGED
 * (pin intercept:394; the cap policy is the evaluator's, and intercept's
 * policy is pass-through).
 */
export type InterceptWorkerConfig = {
	readonly iterationLimit?: number;
};
