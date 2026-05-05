/**
 * @file Public result shape and outcome for the trace engine.
 *
 * Defines `TraceOutcome`, `TraceResult`, and the trace-specific
 * `TraceResultError` discriminated union surfaced on `result.error`.
 *
 * `TraceResult` lives here (engine-owned) per the convention
 * documented in [evaluating/run/types.ts] and mirrored by
 * [evaluating/intercept/types.ts]: "execution wrappers compose
 * their own result types … declared in their own modules." This
 * replaces the legacy `lib/api/types.ts` aggregation.
 */

import type {
	BaseResult,
	FormattingResultError,
} from '../../../validating/types.js';
import type { ParseResultError } from '../../../parse-old/types.js';
import type {
	ASTNode,
	TraceEvent,
} from './tracing/types.js';
import type { TraceOptions } from './config.types.js';

// ─── Result error types (engine-owned) ───────────────────────

/**
 * A JavaScript runtime or construction error during execution.
 *
 * @remarks `phase` distinguishes errors thrown during code
 * construction (e.g. module evaluation setup fails) from errors
 * thrown during execution (e.g. `ReferenceError` at runtime).
 *
 * `line` is present when the Worker reports it.
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
 * Execution exceeded the seconds budget.
 *
 * @remarks `limit` is the `seconds` value that was exceeded.
 * Timeout tracks cumulative execution time, not wall-clock time —
 * the timer pauses during SAB wait so learners can examine steps
 * indefinitely.
 */
type TimeoutResultError = {
	readonly kind: 'timeout';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'execution';
	readonly limit: number;
};

/**
 * A guarded loop exceeded its iteration cap.
 *
 * @remarks `limit` is the `iterations` value that was exceeded.
 * Produced by loop guards injected into the code before execution.
 */
type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'execution';
	readonly limit: number;
};

/**
 * Discriminated union of every error kind `trace()` can surface on
 * `result.error`. Switch on `error.kind` to narrow.
 *
 * @remarks Mirrors intercept's `InterceptResultError` minus the
 * `'validation'` variant. JeJ language-level violations surface on
 * `BaseResult.rejections` (the inherited field on the validating-
 * module compositional root), not on `error`. The `'timeout'` and
 * `'iteration-limit'` variants also appear as events in the trace
 * stream — `result.error` is the structured form, `result.logs.find(...)`
 * is the streamed form.
 */
type TraceResultError =
	| ParseResultError
	| FormattingResultError
	| JavaScriptResultError
	| TimeoutResultError
	| IterationLimitResultError;

// ─── Outcome + Result ────────────────────────────────────────

/**
 * Outcome variants for a settled trace run.
 *
 * @remarks
 * - `'complete'`        — learner code reached its natural end.
 * - `'timeout'`         — seconds budget exhausted.
 * - `'iteration-limit'` — a guarded loop exceeded its cap.
 * - `'error'`           — learner code threw, or a pre-execution gate
 *                         (parse, validation, formatting, worker
 *                         creation) rejected.
 *
 * Trace exposes a narrower outcome set than intercept — there is no
 * `.fail(reason)` or `.cancel()` outcome on the trace engine.
 *
 * `ok` mapping (computed by the engine's buildResult):
 * - `'complete'` → `ok: true`
 * - `'timeout' | 'iteration-limit' | 'error'` → `ok: false`
 */
type TraceOutcome =
	| 'complete'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

/**
 * Result from `trace()` — Aran instrumentation with structured events.
 *
 * @remarks
 * Composes `BaseResult<TraceResultError>` (the validating-module
 * compositional root) with trace-specific fields per the convention
 * in `evaluating/run/types.ts` and `evaluating/intercept/types.ts`.
 *
 * - `logs` contains {@link TraceEvent} entries — one per binding
 *   lifecycle, operator evaluation, control-flow step, etc. Events
 *   are structured and typed; no post-processing needed.
 * - `outcome` classifies how the run finished. Optional on this
 *   shape pending engine adoption; once the trace engine sets it
 *   unconditionally, narrow to required at the call site or via
 *   intersection.
 * - On `ok: true`, three additional fields are present:
 *   - `code` — the original source code (echoed back for convenience).
 *   - `ast`  — flat `Record<syntaxId, ASTNode>` for O(1) syntax
 *     navigation. `ast['$']` is the root Program node. Every
 *     `TraceEvent.node` is a direct reference into this frozen
 *     structure. NOTE: `node.parent` is circular —
 *     `JSON.stringify` requires a custom replacer.
 *   - `options` — snapshot of the `TraceOptions` config that was
 *     used, so consumers know which events were enabled.
 */
type TraceResult = BaseResult<TraceResultError> & {
	readonly logs?: readonly TraceEvent[];
	readonly outcome?: TraceOutcome;
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

// ─── Exports ─────────────────────────────────────────────────

export type {
	JavaScriptResultError,
	TimeoutResultError,
	IterationLimitResultError,
	TraceResultError,
	TraceOutcome,
	TraceResult,
};
