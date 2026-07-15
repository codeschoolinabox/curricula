/**
 * @file The embody adapter's contract: the universal normalizer that maps a
 * foreign run handle — from the intercept evaluator or the danger iframe runner
 * — onto embody's `EvaluateHandle` (an `AsyncIterable<AnyNMEvent>` + a
 * `RunInstance` result), plus the gate short-circuit that produces the
 * not-runnable handle.
 *
 * The adapter is the single deliberate embody→danger type seam: it is the ONE
 * place that knows both backends, so the engine, the intercept evaluator, and
 * the danger runner all stay backend-agnostic. Every import here is
 * `import type` (erased at compile — the seam is a pure type reference, no
 * runtime coupling).
 *
 * The mapping is authored FROM the gate-approved spec in the intercept module's
 * DOCS.md § Downstream (the outcome-vocabulary table + the event mapping). This
 * file pins the contract; the bodies are a later work package. See DOCS.md for
 * the data flow, the two `limit-exceeded` mechanisms, and the R1 resolution.
 */

import type {
	DangerRunHandle,
	DangerResult,
} from '../../../../study-lenses--deprecated-architecture/lib/danger-runner/types.js';
import type {
	EvaluateHandle,
	EndReport,
	EmbodyError,
	EmitNMEvent,
	ErrorNMEvent,
	BindingLookup,
	SourceLocation,
	Snippet,
} from '../../../types.js';
import type {
	InterceptEvaluateHandle,
	InterceptEvent,
	InterceptHalt,
	InterceptSettlement,
} from '../evaluators/intercept/types.js';

// ─── Admission axis ────────────────────────────────────────────────────────────

/**
 * Whether the JEJ admission gate ran before the caller obtained the handle. The
 * admission FORK itself (a gated snippet that fails JEJ → `makeNotRunnableHandle`
 * vs. a passing/ungated snippet → the engine) is decided one level up, in the
 * caller; by the time a normalizer runs, a handle already exists. Carried on the
 * context for provenance — see DOCS § Why (mode is decided a level up).
 */
type AdmissionMode = 'gated' | 'ungated';

/**
 * The projection context the normalizers assemble a `RunInstance` against.
 * `snippet` is load-bearing: it is the required `RunInstance.snippet` back-ref,
 * and on the not-runnable path its `.errors` carry the gate `EmbodyError` (the
 * report itself stays `error: null`).
 */
type NormalizeContext = {
	readonly snippet: Snippet;
	readonly mode: AdmissionMode;
};

// ─── Public surface: (gated | ungated) × (intercept | danger) → EvaluateHandle ──

/**
 * Maps the intercept evaluator's typed facade onto embody's `EvaluateHandle`:
 * streams each `InterceptEvent` as an `EmitNMEvent`, appends the terminal
 * `ErrorNMEvent` reconstructed from an errored throw halt, and assembles the
 * `RunInstance` (with the adapter's authoritative deep-freeze).
 */
type NormalizeIntercept = (
	handle: InterceptEvaluateHandle,
	context: NormalizeContext,
) => EvaluateHandle;

/**
 * Maps the danger runner's result-only handle onto a FULL `EvaluateHandle`: an
 * empty async-iterable (danger has no event stream — `events` is always `[]`),
 * a `RunInstance` carrying the mapped `EndReport`, and an inert `fail` no-op
 * (danger has no mid-stream surface — never a fabricated `'failed'` settlement).
 */
type NormalizeDanger = (
	handle: DangerRunHandle,
	context: NormalizeContext,
) => EvaluateHandle;

/**
 * The gate short-circuit: a not-runnable handle with the engine never invoked.
 * Mirrors embody's `makeStubEvaluateHandle` + `NOT_RUNNABLE_REPORT`
 * (`{ ok: false, error: null, outcome: 'not-runnable' }`); the gate error lives
 * on `snippet.errors` — the CALLER populates it (the adapter reads it, never
 * sets it), NOT on the `EndReport`; `durationMs: 0` on the metrics.
 */
type MakeNotRunnableHandle = (snippet: Snippet) => EvaluateHandle;

// ─── R1 seams: reconstructing the NMEvent fields § Downstream is silent on ──────

/**
 * The five `NMEvent` fields the adapter fills per event without neighbor
 * knowledge — narrowed to exactly what `EmitNMEvent` / `ErrorNMEvent` require.
 * NOT `Pick<NMEvent, …>`: `Pick` would widen `phase` to `NMEventPhase` and
 * `entwined` to `unknown`, which do not assign into the concrete emit/error
 * payloads. `entwined` is `null` (intercept observes no interior — no
 * entwinement source until `lib/parse`); `bindings` is the inert view.
 * `prev`/`next` are NOT here — they are installed at emission (see DOCS § R1).
 */
type NMBase = {
	readonly phase: 'evaluation';
	readonly step: number;
	readonly loc: SourceLocation | null;
	readonly entwined: null;
	readonly bindings: BindingLookup;
};

/**
 * The interior-free binding view every intercept-origin `NMEvent` carries: a
 * frozen lookup that reports every name `unbound` (intercept observes no scope,
 * so there is no real binding state to expose). A bare `{}` would lie against
 * the non-optional `BindingState` index signature.
 */
type MakeInertBindings = () => BindingLookup;

/**
 * Builds the non-relational base for one event. `prev`/`next` are getters over
 * the shared single-writer timeline, installed at emission and sealed by the
 * adapter's authoritative deep-freeze — so they are not part of this base.
 */
type MakeNMBase = (step: number, loc: SourceLocation | null) => NMBase;

/**
 * One streamed intercept event → an emit payload MINUS the relational getters
 * (`prev`/`next` are added at emission over the shared timeline — DOCS § R1).
 */
type ToEmitEvent = (
	event: InterceptEvent,
	base: NMBase,
) => Omit<EmitNMEvent, 'prev' | 'next'>;

/** An error name (`ReferenceError`, `TypeError`, …) → the coarse `ErrorNMEvent.kind`. */
type ClassifyErrorKind = (errorName: string) => ErrorNMEvent['kind'];

/**
 * An errored (real throw) halt → the run's terminal `ErrorNMEvent` payload MINUS
 * the relational getters. Appended iff `settlement.halt && !halt.natural`; its
 * `step` is the final `events.length` (oracle-faithful). Engine-made errored
 * (`halt === null`) and timed-out get NO event — only `EndReport.error`.
 */
type ToTerminalErrorEvent = (
	halt: InterceptHalt,
	base: NMBase,
) => Omit<ErrorNMEvent, 'prev' | 'next'>;

// ─── Settlement / outcome / error seams ─────────────────────────────────────────

/**
 * Provenance-neutral error primitives — the single input to the one authoritative
 * `EmbodyError` constructor. Projected from an intercept `InterceptHalt`, an
 * intercept `InterceptEngineError`, or a danger `DangerResult.error` alike.
 */
type ErrorPrimitives = {
	readonly name: string;
	readonly message: string;
	readonly loc: SourceLocation | null;
	readonly cause?: unknown;
};

/** The single `EmbodyError` builder across both backends (`phase: 'evaluation'`). */
type ToEmbodyError = (primitives: ErrorPrimitives) => EmbodyError;

/**
 * Intercept settlement → `EndReport`. Locks `limit-exceeded` mechanism #1 (REMAP):
 * outcome `errored` with `halt.iterationLimit === true` remaps to `limit-exceeded`;
 * a plain errored throw or engine error carries the `EmbodyError`; cancelled and
 * failed carry `error: null` (failed adds `failReason`); completed is `ok: true`.
 * The engine's `InterceptEngineError` (worker/call/hook) and timed-out surface
 * only on `EndReport.error`, never as an event.
 */
type ToEndReport = (settlement: InterceptSettlement) => EndReport;

/**
 * Danger result → `EndReport`. Locks `limit-exceeded` mechanism #2 (DIRECT literal):
 * `DangerOutcome` already carries `'limit-exceeded'` (the message-match that detects
 * it happens upstream in danger's classifier). `errored` → `EmbodyError` from
 * `DangerResult.error`; `limit-exceeded` → a SYNTHESIZED `RangeError` `EmbodyError`
 * (`DangerResult.error` is absent on `limit-exceeded`); cancelled → `error: null`.
 */
type DangerToEndReport = (result: DangerResult) => EndReport;

export type {
	AdmissionMode,
	NormalizeContext,
	NormalizeIntercept,
	NormalizeDanger,
	MakeNotRunnableHandle,
	NMBase,
	MakeInertBindings,
	MakeNMBase,
	ToEmitEvent,
	ClassifyErrorKind,
	ToTerminalErrorEvent,
	ErrorPrimitives,
	ToEmbodyError,
	ToEndReport,
	DangerToEndReport,
};
