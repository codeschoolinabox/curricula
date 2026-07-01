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
	LinkedTraceEvent,
	TraceEvent,
	ValueRepresentation,
} from './tracing/types.js';
import type { SourceRange, TraceConfig, TraceOptions } from './config.types.js';

// ─── Gate boundary error ──────────────────────────────────────────────────────

/**
 * Why the admission gate rejected a program or its config. `'parse'` = not
 * valid JavaScript; `'jej-violation'` = valid JS outside the JEJ subset
 * (`with` included — there is no sloppy-mode path);
 * `'undeclared-identifier'` = an identifier resolving to no declaration and
 * no provided builtin (rejected statically — deliberately stricter than
 * JavaScript's runtime ReferenceError; README § Bounded context);
 * `'invalid-config'` = the config failed preparation (shape, schema, or
 * cross-field checks) — the gate boundary covers Prepare too, so one catch
 * handles every synchronous rejection.
 */
type GateBoundaryReason =
	| 'parse'
	| 'jej-violation'
	| 'undeclared-identifier'
	| 'invalid-config';

/**
 * The typed boundary error the entry throws synchronously on inadmissible
 * input. A real `Error` (stack, `instanceof Error`) augmented with a
 * structural discriminant — callers identify it without parsing the message.
 * `identifier` is present on `'undeclared-identifier'` rejections.
 */
type GateBoundaryError = Error & {
	readonly gateBoundary: true;
	readonly reason: GateBoundaryReason;
	readonly identifier?: string;
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
 * How the run ended plus its carried data. The six shapes (README
 * § TraceResult shape):
 *
 * - `completed` — halt (natural), no engineError.
 * - `errored` + halt — the program threw (a learner error, or the branded
 *   iteration limit, then also `refinement`).
 * - `errored` + engineError, halt null — the engine ended the run: a worker
 *   crash (`worker-error`), an unserviceable dialog call (`call-error` —
 *   the dialog-without-provider terminal), or a throwing thread hook
 *   (`hook-error`).
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
 * `code`, `ast`, and `options` exist for every handle; linking runs after
 * ANY settlement (the ast record and streamed events both live thread-side),
 * so `events` are always linked. `visitCounts` ride the halt — an engine-made
 * stop (timeout, cancel, fail, crash) has no halt, so they are empty and
 * every `node.visits` is 0.
 *
 * Serialization: `node.parent` and `node.events[i].node` are circular —
 * `JSON.stringify` needs a replacer; `node.parentPath` and `event.step` are
 * the serialization-safe alternatives.
 */
type TraceResult = {
	/** Ordered, linked event stream — each event has `.node` into `ast`. */
	readonly events: readonly LinkedTraceEvent[];
	/** Original source code, echoed back. */
	readonly code: string;
	/** Flat frozen record; `ast['$']` is the root Program node. */
	readonly ast: Readonly<Record<string, ASTNode>>;
	/** The resolved options snapshot — which event gates were enabled. */
	readonly options: TraceOptions;
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
type TraceHandle = AsyncIterable<TraceEvent> & {
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
 * so the instrumented output is range-independent and a highlight change
 * never re-instruments (README § runtime gate bundle).
 *
 * Weave-time decisions (pointcut gating, tags, initial state) are Aran
 * code-generated and ride `spec.code`; everything the dispatcher checks at
 * runtime rides here.
 */
type RuntimeGates = {
	/** Source window; events outside it are dropped at dispatch. */
	readonly range?: SourceRange;
	/** Per-category name allowlists (variables, functions, properties, operators). */
	readonly filters?: {
		readonly variables?: readonly string[];
		readonly functions?: readonly string[];
		readonly properties?: readonly string[];
		readonly operators?: readonly string[];
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
