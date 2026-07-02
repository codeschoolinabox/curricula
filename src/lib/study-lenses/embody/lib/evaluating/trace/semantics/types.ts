/**
 * @file The public contract of the JEJ semantics tracer, plus the seams the
 * pipeline is built against.
 *
 * The vocabulary is pinned in README.md § Glossary. The event union lives in
 * `tracing/types.ts` (the instrumentation pipeline's contract); this file owns
 * everything a consumer of `traceSemantics` touches: the handle, the result,
 * the settlement family, the gate boundary error — and the cross-increment
 * seams (wire message, runtime gate bundle, dialog protocol, halt shape) so
 * the increments do not reverse-engineer each other.
 *
 * Engine coupling: settlement outcomes surface the engine's five values
 * as-is (the sibling variables tracer set this convention); the
 * iteration-limit is NOT an outcome — it is a typed refinement on an errored
 * settlement (README § iteration limit).
 */

import type {
	ASTNode,
	ChainedTraceEvent,
	TraceEvent,
	ValueRepresentation,
} from './tracing/types.js';
import type {
	ResolvedTraceOptions,
	SourceRange,
	TraceConfig,
} from './config.types.js';

// ─── Gate boundary error ──────────────────────────────────────────────────────

/**
 * Why the admission gate rejected a program or its config. `'parse'` = not
 * valid JavaScript; `'jej-violation'` = valid JS outside the JEJ subset
 * (`with` included — there is no sloppy-mode path); `'invalid-config'` = the
 * config failed preparation (shape, schema, or cross-field checks) — the
 * gate boundary covers Prepare too, so one catch handles every synchronous
 * rejection.
 *
 * The gate never pre-empts runtime errors: a program that would merely THROW
 * in a raw JS run (an undeclared identifier read, a TDZ access, a const
 * reassignment) is admitted, and the error occurs at its ECMA-faithful
 * evaluation moment inside the trace (README § Bounded context).
 */
type GateBoundaryReason = 'parse' | 'jej-violation' | 'invalid-config';

/**
 * The typed boundary error the entry throws synchronously on inadmissible
 * input. A real `Error` (stack, `instanceof Error`) augmented with a
 * structural discriminant — callers identify it without parsing the message.
 */
type GateBoundaryError = Error & {
	readonly gateBoundary: true;
	readonly reason: GateBoundaryReason;
};

// ─── Settlement family (mirrors the engine, typed by this tracer) ────────────

/**
 * The worker-authored stop payload, typed by this tracer. Present iff the
 * worker stopped on its own — natural end and throw alike. An `'errored'`
 * OUTCOME does not imply a halt: engine-made errors (a worker crash, an
 * unserviceable dialog call, a throwing thread hook) settle errored with
 * `engineError` and `halt: null` (see {@link TraceSettlement}). Carries the
 * run metrics only the worker knows (`visitCounts`) and the error
 * attribution.
 *
 * `nodePath` is APPROXIMATE — the last emitted event's node, not the
 * throwing node (README § error channel) — and `null` on a natural end or
 * before any event fired.
 */
type TraceHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name (`'TypeError'`, …); `''` on a natural end. */
	readonly errorName: string;
	readonly message: string;
	/** Approximate attribution — last emitted event's nodePath, or null. */
	readonly nodePath: string | null;
	/** The thrown value, represented worker-side; absent on a natural end. */
	readonly thrownValue?: ValueRepresentation;
	/**
	 * Structural iteration-limit classification, stamped by the halt author
	 * when the thrown error carries the instrumentation's brand — never
	 * derived from message text. `limit` is the exceeded cap.
	 */
	readonly iterationLimit?: { readonly limit: number };
	/** nodePath → visit count, accumulated worker-side during the run. */
	readonly visitCounts: Readonly<Record<string, number>>;
};

/**
 * This tracer's typed annotation on an errored settlement: the halt was an
 * instrumentation-owned iteration limit, not a learner error. Consumers ask
 * "was this an iteration limit?" here — never via `outcome` (there is no
 * `'iteration-limit'` outcome value).
 */
type TraceRefinement = {
	readonly kind: 'iteration-limit';
	readonly limit: number;
};

/**
 * The engine-authored error, surfaced when the engine itself ended the run
 * (timeout, worker failure, unserviceable dialog call, throwing thread
 * hook). Mirrors the engine's structured cause.
 */
type TraceEngineError = {
	readonly cause: 'timeout' | 'worker-error' | 'call-error' | 'hook-error';
	readonly name: string;
	readonly message: string;
};

/** How the run ended (the engine's five generic outcomes, surfaced as-is). */
type TraceOutcome =
	| 'completed'
	| 'errored'
	| 'cancelled'
	| 'failed'
	| 'timed-out';

/**
 * How the run ended plus its carried data. The seven shapes (README
 * § TraceResult shape):
 *
 * - `completed` — halt (natural), no engineError.
 * - `errored` + halt — the program threw (a learner error, or the branded
 *   iteration limit, then also `refinement`).
 * - `errored` + engineError, halt null — the engine ended the run: a worker
 *   crash (`worker-error`), an unserviceable dialog call (`call-error` —
 *   the dialog-without-provider terminal), or a throwing thread hook
 *   (`hook-error`).
 * - `errored` + halt AND engineError (`hook-error`) — the one coexistence
 *   corner: a thread hook threw while refining an errored halt, so the halt
 *   stays and the engine also reports the hook failure. (`halt` and
 *   `engineError` are independently optional here, so this is representable.)
 * - `cancelled` / `failed` — consumer stops; no halt, no engineError;
 *   `failReason` present iff failed.
 * - `timed-out` — engineError with cause `'timeout'`, no halt.
 */
type TraceSettlement = {
	readonly outcome: TraceOutcome;
	readonly halt: TraceHalt | null;
	readonly refinement?: TraceRefinement;
	readonly engineError?: TraceEngineError;
	readonly failReason?: unknown;
	readonly durationMs: number;
};

// ─── Result and handle (public facade) ────────────────────────────────────────

/**
 * What `result` resolves with. The gate and instrumentation run eagerly, so
 * `code`, `ast`, and `options` exist for every handle; the INDEX phase runs
 * after ANY settlement (the ast record and the streamed events both live
 * thread-side), so `events` are always the chained delivered form and
 * `eventsByNode` is always built. `visitCounts` ride the halt — an
 * engine-made stop (timeout, cancel, fail, crash) has no halt, so they are
 * empty (every node's count 0).
 *
 * FULLY `JSON.stringify`-safe with no replacer: the ast record is acyclic
 * (no `parent` back-ref — use `parentPath`), events carry no node refs (use
 * `nodePath`), and the `prev`/`next` chain fields are non-enumerable.
 *
 * Assembling this result is ONE-SHOT (the chain + index are built once), but
 * `result` is multi-access — the facade MEMOIZES the assembled value, so
 * repeated `await handle.result` returns the same frozen object.
 */
type TraceResult = {
	/**
	 * Ordered event stream in the delivered chained form — traverse via
	 * `event.prev` / `event.next`; attribute via `event.nodePath` into `ast`.
	 */
	readonly events: readonly ChainedTraceEvent[];
	/** Original source code, echoed back. */
	readonly code: string;
	/** Flat frozen acyclic record; `ast['$']` is the root Program node. */
	readonly ast: Readonly<Record<string, ASTNode>>;
	/**
	 * nodePath → the `step`s of the events that fired on that node, in order
	 * (replaces the old `ASTNode.events[]` back-ref). Look up an event by step
	 * against `events`.
	 */
	readonly eventsByNode: Readonly<Record<string, readonly number[]>>;
	/** The resolved (post-expansion) options snapshot — which gates were enabled. */
	readonly options: ResolvedTraceOptions;
	/** nodePath → visit count; empty when the run ended without a halt. */
	readonly visitCounts: Readonly<Record<string, number>>;
	readonly settlement: TraceSettlement;
};

/**
 * The tracer's primary handle: a thin typed facade over the engine handle.
 * Fully lazy (nothing runs until the first pull or `result` access);
 * breaking out of a `for await` is equivalent to `cancel()`; `fail(reason)`
 * is the structured consumer stop.
 */
type TraceHandle = AsyncIterable<ChainedTraceEvent> & {
	readonly result: Promise<TraceResult>;
	readonly cancel: () => void;
	readonly fail: (reason?: unknown) => void;
};

/**
 * The tracer's primary export: code in, typed handle out. Throws a
 * {@link GateBoundaryError} synchronously on inadmissible input; every
 * failure after a successful gate degrades into a settlement, never a throw.
 */
type TraceSemantics = (code: string, config?: TraceConfig) => TraceHandle;

// ─── Seam 1: the worker→thread message ─────────────────────────────────────────

/**
 * What the worker emits and the thread narrows to a typed event. The worker
 * authors the COMPLETE wire-safe event (the dispatcher stamps every base
 * field before emitting), so the thread logic stays pure and stateless: a
 * light boundary guard decides yield-vs-drop and passes the message by
 * reference (the engine freezes items at yield).
 */
type TraceMessage = TraceEvent;

// ─── Seam 2: the runtime gate bundle (workerConfig) ────────────────────────────

/**
 * The resolved runtime-checked gates, delivered to the worker logic via the
 * engine spec's `workerConfig` — deliberately NOT baked into the woven code,
 * so the instrumented output is RANGE-INDEPENDENT (the same woven code serves
 * any range/filter). That keeps re-instrumentation cache-friendly for a
 * FUTURE caching seam; TODAY each `traceSemantics` call re-instruments (there
 * is no public instrument-once/run-many API — caching is out of scope). See
 * README § runtime gate bundle.
 *
 * Weave-time decisions (pointcut gating, tags, initial state) are Aran
 * code-generated and ride `spec.code`; everything the dispatcher checks at
 * runtime rides here.
 */
type RuntimeGates = {
	/** Source window; events outside it are dropped at dispatch. */
	readonly range?: SourceRange;
	/**
	 * Per-SITE name allowlists — one bucket per config `filter` field, carried
	 * losslessly (each config filter maps to exactly one bucket; buckets are
	 * NOT merged). An empty/absent bucket means "no name filter for that site".
	 * The dispatcher applies the bucket matching the event's origin, by the
	 * event's own name key (variable name, operator string, property key,
	 * function name).
	 */
	readonly filters?: {
		/** `expression.variables.filter` — variable read/update names. */
		readonly expressionVariables?: readonly string[];
		/** `statements.variables.filter` — initialize/available binding names. */
		readonly statementsVariables?: readonly string[];
		/** `expression.operators.filter` — operator strings. */
		readonly operators?: readonly string[];
		/** `expression.operators.assignment.filter` — assignment operator strings. */
		readonly assignment?: readonly string[];
		/** `expression.properties.filter` — property keys. */
		readonly properties?: readonly string[];
		/** `expression.functions.filter` — called function names. */
		readonly functions?: readonly string[];
	};
	/** The loop iteration cap; exceeding it throws the branded limit error. */
	readonly iterations?: number;
};

// ─── Seam 3: the dialog protocol ───────────────────────────────────────────────

/**
 * The worker→thread call payload for one learner dialog. Serviced
 * synchronously through the engine's call channel; the response value flows
 * back into the traced program as the dialog's real return value.
 */
type DialogRequest = {
	readonly dialog: 'prompt' | 'confirm' | 'alert';
	readonly message: string;
	/** prompt only: the optional second argument. */
	readonly defaultValue?: string;
};

/**
 * The consumer-supplied dialog provider (`TraceConfig.dialogs`). The entry
 * resolves the provider chain ONCE, at prepare time: `config.dialogs` when
 * given, else the environment's own dialogs (`globalThis.prompt` /
 * `confirm` / `alert`); the thread logic services calls with the resolved
 * providers. When a dialog fires and nothing was resolved, the run settles
 * as a call error — a fabricated value is never substituted (README
 * § dialog round-trip).
 *
 * Providers are synchronous (async custom-modal providers are a named
 * deferred concern — the engine's call hook supports promises but the fake
 * transport, which every Node suite runs on, does not). An oversized
 * response fails loudly at the engine's bounded call channel.
 */
type DialogProviders = {
	readonly prompt?: (message: string, defaultValue?: string) => string | null;
	readonly confirm?: (message: string) => boolean;
	readonly alert?: (message: string) => void;
};

// ─── Exports ───────────────────────────────────────────────────────────────────

export type {
	// gate boundary
	GateBoundaryReason,
	GateBoundaryError,
	// settlement family
	TraceHalt,
	TraceRefinement,
	TraceEngineError,
	TraceOutcome,
	TraceSettlement,
	// facade
	TraceResult,
	TraceHandle,
	TraceSemantics,
	// seams
	TraceMessage,
	RuntimeGates,
	DialogRequest,
	DialogProviders,
};
