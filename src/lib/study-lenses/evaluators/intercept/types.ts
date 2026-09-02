/**
 * intercept's contract: the spec widening, the streaming handle with its
 * explicit generator surface, the enriched event union, the discriminated
 * result, the error taxonomy, and the worker seam records. README.md
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
import type {
	NaturalHaltCore,
	ThrowHaltCore,
} from '../lib/guarded-worker-base/types.js';
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
 * intercept's worker-authored, clone-safe stop record — the guarded
 * worker base's halt core plus the attributed call site (the member run
 * cannot honestly stamp; the banked halt question's shape half, resolved
 * 2026-08-19; the author dedup resolved SHARED at the W4 opening — the
 * base's finisher seam is how `loc` rides, never a fork of the
 * skeleton). Authored on EVERY worker-side stop; narrowed exactly once,
 * thread-side.
 *
 * The union's arms are the base's (`ebb3f603`): the natural arm pins its
 * empty members — `phase: null` and `loc: null` included — and the throw
 * arm carries the engine's structural `phase` non-null (the E2 increment,
 * `a2ff78b0`'s split spelled `'creation' | 'evaluation'`), so the
 * settlement mapper narrows on `natural` and reads a phase, never a
 * fabricated default. The throw arm's `loc` is the attributed call site:
 * the wrap's innermost live call read from the raw throw's stamp, or the
 * one sanctioned stack-parse position for the no-live-frame residual — a
 * zero-width span whose spliced-space column the author corrects through
 * the config's per-line deltas BEFORE stamping, so one coordinate space
 * rides the wire (human ruling 2026-09-01); `null` where neither gave
 * one.
 */
export type InterceptHalt =
	| (NaturalHaltCore & { readonly loc: null })
	| (ThrowHaltCore & { readonly loc: InterceptLoc | null });

// ─── Seam 2: the worker config (thread → worker) ─────────────────────────────

/**
 * The clone-safe data intercept delivers to its worker logic at setup.
 * `iterationLimit` is the spec's `iterations`, passed through UNCHANGED
 * (pin intercept:394; the cap policy is the evaluator's, and intercept's
 * policy is pass-through).
 *
 * `spliceColumnDeltas` carries the residual stack parse's per-line column
 * deltas (human ruling 2026-09-01): keyed by 1-based line in the shared
 * line space — every instrumentation pass preserves lines 1:1, so
 * original, spliced, and running lines are one space — each value the
 * UTF-16 column shift splicing added to that line. Computed at assembly,
 * where the original and instrumented texts both exist; consumed by the
 * halt author, which subtracts the line's delta from a residual stack
 * position's column BEFORE stamping — one coordinate space on the wire,
 * matching the wrap's original-parse stamps. An absent record, an absent
 * line, or a delta larger than the column corrects nothing: the column
 * passes through, never negative.
 */
export type InterceptWorkerConfig = {
	readonly iterationLimit?: number;
	readonly spliceColumnDeltas?: Readonly<Record<number, number>>;
};

// ─── Seam 3: the wire record (worker → thread) ───────────────────────────────

/**
 * The attribution legs a wire record carries — the call-site span and the
 * UTF-16 offset pair, both in the facts' coordinate space, decoded
 * worker-side from the wrap's ONE six-field stamp (`'L:C:L:C:S:E'`,
 * `wrap-call-expressions.ts`'s decode contract: the first four fields the
 * span, the last two the offsets). One stamp carries both, so the
 * README's both-or-neither rule is structural here too: a record holds a
 * full span WITH its finite offsets, or all three legs `null` where no
 * wrap attributed the moment — one without the other is malformed and the
 * narrowing drops it.
 */
type WireAttribution =
	| {
			readonly loc: InterceptLoc;
			readonly start: number;
			readonly end: number;
	  }
	| { readonly loc: null; readonly start: null; readonly end: null };

/**
 * What every wire record carries beside its kind arm: the worker-minted
 * `step` (1-based, strictly increasing, never renumbered thread-side —
 * gaps are legal and meaningful, so the narrowing validates finiteness
 * and nothing more), the attribution legs, and the call's raw arguments
 * (elements deliberately `unknown`: learner values legitimately take any
 * clone-safe shape, so that IS their declared depth).
 */
type WireRecordBase = WireAttribution & {
	readonly step: number;
	readonly args: readonly unknown[];
};

/**
 * A `console.<method>(…)` call on the wire; nothing returns. `method` is
 * the open string of the whole-surface trap (the {@link ConsoleMethod}
 * names are the documented set).
 */
export type WireConsoleRecord = WireRecordBase & {
	readonly event: 'console';
	readonly method: string;
};

/** An ANSWERED `prompt(…)` on the wire: `return` is what the program received. */
export type WirePromptRecord = WireRecordBase & {
	readonly event: 'prompt';
	readonly return: string | null;
};

/**
 * An ANSWERED `alert(…)` on the wire: `return` present AND `undefined` —
 * the void contract's modelled value, a real check under
 * `exactOptionalPropertyTypes` (the deprecated port's H-3 ruling,
 * carried).
 */
export type WireAlertRecord = WireRecordBase & {
	readonly event: 'alert';
	readonly return: undefined;
};

/** An ANSWERED `confirm(…)` on the wire: `return` is what the program received. */
export type WireConfirmRecord = WireRecordBase & {
	readonly event: 'confirm';
	readonly return: boolean;
};

/**
 * The learner's run-ending throw on the wire — WORKER-SENT (human ruling
 * 2026-08-26, resolving the I2 seam flag): the worker emits it at the
 * throw site, immediately before authoring its stop record, so `step`
 * stays genuinely worker-minted in the one gapped ordinal space (a
 * thread-side `events.length + 1` mint was rejected — it disagrees with
 * worker ordinals wherever a mocked dialog consumed one). Only the
 * learner's own throw rides this arm: the guard's marked trip, the
 * engine-made stops, and machinery defects are settlement-only, and an
 * io failure's in-stream error event is thread-authored (it never
 * crosses this seam). No `args` — there is no call — and no `source`
 * (absent `source` IS the learner-throw marking on the delivered event).
 */
export type WireErrorRecord = WireAttribution & {
	readonly event: 'error';
	readonly step: number;
	readonly name: string;
	readonly message: string;
};

/**
 * The wire form of a boundary moment — what the worker posts across the
 * clone boundary for a COMPLETED moment (README § Glossary: a record is
 * a console call or an answered dialog; an ask rides the call channel,
 * never this seam) or for the learner's run-ending throw (the
 * worker-sent error arm, human ruling 2026-08-26). NARROWER than the
 * delivered event by exactly the enrichment (HR-12): plain clone-safe
 * data only — no `nodePath`, no accessors. Narrowed at ONE site
 * (`narrow-record-message.ts`); reference spellings per HR-8 — `event`,
 * `method`, `args`, `return`, `step`; the deprecated port's
 * `kind`/`returnValue` vocabulary retires with its region.
 */
export type InterceptWireRecord =
	| WireConsoleRecord
	| WirePromptRecord
	| WireAlertRecord
	| WireConfirmRecord
	| WireErrorRecord;

// ─── Seam 4: the ask (worker → thread, through the call channel) ─────────────

/**
 * The clone-safe ask a dialog trap sends through the machinery's call
 * channel — the synchronous round-trip that suspends the run. Minted at
 * the worker-setup increment, consumed thread-side at `serveAsk` (mock
 * first — a supplied dialog mock answers before a pending interaction is
 * ever minted). `step` is minted from the same worker ordinal sequence
 * the records use: a mocked dialog's ask consumes an ordinal the stream
 * never delivers — the ruled step gap. The attribution legs are the wire
 * rule's: a full span WITH its offsets, or all three `null`.
 */
export type InterceptAskMessage = WireAttribution & {
	readonly step: number;
	readonly request: InterceptInteractionRequest;
};

// ─── The channel's product (thread-side, pre-enrichment) ─────────────────────

/**
 * The pending interaction as the interaction channel authors it —
 * THREAD-side and never a wire message: `respond` is a live main-thread
 * function; `request` is the clone-safe ask that did cross. Deep-frozen
 * where authored (freezing does not disable `respond` — a frozen
 * object's function property still calls). This is the delivered
 * {@link PendingInteractionEvent} MINUS the enrichment: the enrichment
 * step builds the delivered event as its own object (offsets resolved to
 * `nodePath`, the graph accessors installed), carrying `respond`
 * through, so the three guarantees — respond resumes the run, twice is
 * inert, post-teardown is a no-op — live here, at one site.
 */
export type InterceptPendingInteraction = PendingInteraction<
	InterceptInteractionRequest,
	InterceptDialogAnswer
> & {
	readonly event: 'pending-interaction';
	readonly step: number;
	readonly loc: InterceptLoc | null;
	readonly start: number | null;
	readonly end: number | null;
};

// ─── The enrichment (thread-side, inside onMessage) ──────────────────────────

/**
 * What enrichment accepts (DOCS.md § Execution phases, phase 5's inputs):
 * a narrowed wire record; the io flag's stream half — the wire error
 * shape plus the failing `source`, thread-authored where the flag
 * classifies, never crossing the worker seam; or the channel's pending
 * interaction. Items arrive deep-frozen by their authors — the record at
 * the narrowing, the interaction at the channel, the io item where it is
 * classified (the region's freeze-where-authored constraint) — and
 * enrichment builds the delivered event as its own object, so no item is
 * ever written.
 */
export type InterceptEnrichable =
	| InterceptWireRecord
	| (WireErrorRecord & { readonly source: string })
	| InterceptPendingInteraction;

/**
 * One run's enrichment surface (HR-12) — built once per run by
 * `enrich-event.ts`, consumed inside the engine's `onMessage` hook and at
 * the settlement's attribution reads: `enrich` turns one arriving item
 * into the delivered event (the enumerable attribution resolved through
 * the deepest-exact-span join, the graph views installed as
 * NON-ENUMERABLE accessors, the timeline linked), and `nodeAtLoc` joins
 * an original-space line/column span — a trip's loop span, the residual
 * halt position — to its entwined node through the session's lineStarts
 * table. The timeline pointer behind `prev`/`next` is the NAMED
 * no-mutable-closures exception, scoped: accessors are installed inside
 * `onMessage` before return and never written after yield (HR-12's
 * mechanism bullet).
 */
export type InterceptEnrichment = {
	readonly enrich: (item: InterceptEnrichable) => InterceptEvent;
	readonly nodeAtLoc: (loc: InterceptLoc) => EntwinedNode | null;
};
