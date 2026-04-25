/**
 * @file Result types for the JeJ public API.
 *
 * Defines the unified result shapes returned by all API functions.
 * Every result is deep-frozen before returning — consumers get
 * immutable snapshots.
 *
 * Check `ok` first, then inspect `error` (single failure) or
 * `rejections` (list of language-level violations) for details.
 *
 */

import type {
	ParseResult,
	ParseResultError,
} from '../lib/parse/types.js';
import type {
	BaseResult,
	FormattingResultError,
} from '../lib/validating/types.js';
import type { InterceptEvent } from '../lib/evaluating/shared/types.js';
import type {
	ASTNode,
	TraceEvent,
} from '../lib/evaluating/trace/semantics/tracing/types.js';
import type { TraceOptions } from '../lib/evaluating/trace/semantics/config.types.js';

// ─── Error types ─────────────────────────────────────────────

/**
 * A JavaScript runtime error during execution.
 *
 * @remarks `phase` distinguishes errors thrown during code
 * construction (e.g. module evaluation setup fails) from errors
 * thrown during execution (e.g. `ReferenceError` at runtime).
 *
 * `line` is present when the Worker or iframe reports it.
 * Runtime errors from Workers reliably provide line but not
 * always column — both are optional.
 */
type JavaScriptResultError = {
	readonly kind: 'javascript';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly column?: number;
	readonly phase: 'creation' | 'execution';
};

/**
 * Execution exceeded the time limit.
 *
 * @remarks `limit` is the `seconds` value that was exceeded.
 * Timeout tracks cumulative execution time, not wall-clock time —
 * time pauses during SAB wait so learners can examine steps
 * indefinitely.
 */
type TimeoutResultError = {
	readonly kind: 'timeout';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly column?: number;
	readonly phase: 'creation' | 'execution';
	readonly limit: number;
};

/**
 * A loop exceeded the iteration limit.
 *
 * @remarks `limit` is the `iterations` value that was exceeded.
 * Produced by loop guards injected into the code before execution.
 */
type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly column?: number;
	readonly phase: 'creation' | 'execution';
	readonly limit: number;
};

/**
 * Discriminated union of all error kinds.
 *
 * @remarks Use `error.kind` to switch:
 * - `'parse'` — acorn parse failure
 * - `'javascript'` — runtime error during execution
 * - `'timeout'` — time limit exceeded
 * - `'iteration-limit'` — loop iteration limit exceeded
 * - `'formatting'` — code not formatted (pipeline gate)
 *
 * @example
 * ```ts
 * if (result.error) {
 *   switch (result.error.kind) {
 *     case 'parse':           // show syntax error
 *     case 'javascript':      // show runtime error
 *     case 'timeout':         // show "took too long"
 *     case 'iteration-limit': // show "loop ran too many times"
 *     case 'formatting':      // show "format your code"
 *   }
 * }
 * ```
 */
type ResultError =
	| ParseResultError
	| JavaScriptResultError
	| TimeoutResultError
	| IterationLimitResultError
	| FormattingResultError;

// ─── Result types ────────────────────────────────────────────

/**
 * Generic execution result parameterized by event type and outcome.
 *
 * @remarks Composes `BaseResult` (from `lib/validating/types.ts`)
 * with the wider `ResultError` union, then adds a `logs` field
 * containing the event stream from execution and an `outcome`
 * field classifying how the run ended.
 *
 * `logs` is present when execution ran (even partially — a
 * runtime error still produces partial logs up to the crash).
 * `logs` is absent when code was rejected before execution
 * (parse error, validation failure, or formatting gate).
 *
 * `outcome` is optional on the generic Result base because
 * trace/debug engines have not yet migrated to set the field.
 * Per-engine result types intersect with `{readonly outcome:
 * <Outcome>}` to make it required where the engine guarantees it
 * — e.g. `InterceptResult` does this so consumers narrow exhaustively
 * without `default` or `?.` chains.
 *
 * `reason` is set only by `.fail(reason)` on engines that expose
 * the method (currently `run` only). Stored by reference;
 * reference-stable across replay.
 *
 * @typeParam TEvent - The event type for this engine
 * @typeParam TOutcome - The outcome discriminant subset supported by
 *   this engine. Engines with fewer outcomes narrow this parameter
 *   (e.g. `DebugOutcome = 'complete' | 'error'`).
 */
type Result<TEvent, TOutcome extends string = string> = BaseResult<ResultError> & {
	readonly logs?: readonly TEvent[];
	readonly outcome?: TOutcome;
	/**
	 * Structured rejection payload set by `.fail(reason)`.
	 *
	 * @remarks Present only on `{outcome: 'fail'}` results; reference-
	 * stable across replay (not cloned, not frozen-separately — the
	 * same object the consumer passed to `.fail()`).
	 */
	readonly reason?: unknown;
};

/**
 * The six outcome variants a run can resolve to.
 *
 * @remarks Classifies how a `run()` finished. Set by the engine's
 * buildResult. First-class on the InterceptResult — consumers switch on
 * `result.outcome` rather than scanning `logs` for termination
 * markers. `logs` is a pure worker-emitted event stream and does
 * NOT carry synthetic cancel/break/fail entries.
 *
 * - `'complete'` — learner code reached its natural end.
 * - `'cancel'` — consumer stopped the run, either via `.cancel()`
 *   or by `break`ing out of a live `for await`. Still `ok: true`
 *   (cancel is not an error).
 * - `'fail'` — consumer stopped the run via `.fail(reason)` with
 *   a structured rejection payload. Still `ok: true` — `.fail()`
 *   is for consumer-driven early termination (e.g. a teaching
 *   harness detecting a failed prediction), not a program error.
 *   The payload is available on `result.reason`.
 * - `'timeout'` — seconds budget exhausted.
 * - `'iteration-limit'` — a guarded loop exceeded its cap.
 * - `'error'` — learner code threw, or a pre-execution gate
 *   (parse, validation, formatting, worker creation) rejected.
 */
type InterceptOutcome =
	| 'complete'
	| 'cancel'
	| 'fail'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

/**
 * Result from `run()` — Web Worker execution with trapped I/O.
 *
 * @remarks `logs` contains {@link InterceptEvent} entries: one per
 * trapped call (console.log, prompt, alert, confirm, etc.)
 * plus an error event if execution failed. Termination markers
 * (cancel, break, fail) are NOT in logs — they're classified on
 * `outcome`, with optional `reason` payload for `.fail()`.
 *
 * `outcome` is required on InterceptResult. Consumers can switch on it
 * exhaustively without a `default` branch.
 */
type InterceptResult = Result<InterceptEvent, InterceptOutcome> & {
	readonly outcome: InterceptOutcome;
};

/**
 * Result from `trace()` — Aran instrumentation with structured events.
 *
 * @remarks
 * `logs` contains {@link TraceEvent} entries — one per binding lifecycle,
 * operator evaluation, control-flow step, etc. Events are structured and
 * typed; no post-processing needed.
 *
 * On `ok: true`, three additional fields are present:
 * - `code` — the original source code (echoed back for convenience)
 * - `ast`  — flat `Record<syntaxId, ASTNode>` for O(1) syntax navigation.
 *   `ast['$']` is the root Program node. Every `TraceEvent.node` is a
 *   direct reference into this frozen structure. Note: `node.parent` is
 *   circular — `JSON.stringify` requires a custom replacer.
 * - `options` — snapshot of the `TraceOptions` config that was used,
 *   so consumers know which events were enabled.
 */
type TraceOutcome =
	| 'complete'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

type TraceResult = Result<TraceEvent, TraceOutcome> & {
	/** Original source code. Present on ok:true. */
	readonly code?: string;
	/**
	 * Flat AST record for syntaxId-based navigation. Present on ok:true.
	 * `ast['$']` = root Program. Every event's `.node` is a ref into this structure.
	 */
	readonly ast?: Readonly<Record<string, ASTNode>>;
	/** Config snapshot — which events were enabled. Present on ok:true. */
	readonly options?: TraceOptions;
};

/**
 * Result from `debug()` — iframe with debugger statements.
 *
 * @remarks `logs` is `[]` on success (debug produces no events
 * on normal completion) or `[errorEvent]` on failure. Debug has
 * no streaming — it yields 0 or 1 events total.
 */
type DebugOutcome = 'complete' | 'error';

type DebugResult = Result<DebugEvent, DebugOutcome>;

/**
 * Event produced by the debug engine on error.
 *
 * @remarks Only error events — debug produces nothing on success.
 * The debug engine runs in an iframe, not a Worker, so there is
 * no SAB pause and no event streaming.
 */
type DebugEvent = {
	readonly event: 'error';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
};

// ─── Exports ─────────────────────────────────────────────────

export type {
	ResultError,
	ParseResult,
	ParseResultError,
	JavaScriptResultError,
	TimeoutResultError,
	IterationLimitResultError,
	FormattingResultError,
	BaseResult,
	Result,
	InterceptResult,
	InterceptOutcome,
	TraceResult,
	TraceOutcome,
	DebugResult,
	DebugOutcome,
	DebugEvent,
	// Re-exported for consumer convenience
	ASTNode,
	TraceOptions,
};
