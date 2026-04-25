/**
 * @file Public and internal types for the trapless `run` engine.
 *
 * Defines:
 *   - Public API: `RunOutcome`, `RunResult`, `RunHandle`, `RunOptions`,
 *     `IoMocks`.
 *   - Run-specific runtime error types: `JavaScriptResultError`,
 *     `TimeoutResultError`, `IterationLimitResultError`, `RunResultError`.
 *   - Internal worker-protocol message types.
 *
 * @remarks
 * Per `lib/validating/types.ts` § BaseResult — "execution wrappers
 * compose their own result types … declared in their own modules" —
 * runtime error types are co-located with the engine, not in a shared
 * aggregation. (Compare with `lib/evaluating/intercept/` which still
 * sources error types from the legacy `api/types.ts`; that aggregation
 * is being removed.)
 */

import type { Program } from 'acorn';

import type { ParseResultError } from '../../parse/types.js';
import type {
	BaseResult,
	FormattingResultError,
} from '../../validating/types.js';

// ─── Runtime error types (engine-owned) ──────────────────────

/** A JavaScript runtime or construction error during execution. */
type JavaScriptResultError = {
	readonly kind: 'javascript';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly column?: number;
	readonly phase: 'creation' | 'execution';
};

/** Execution exceeded the seconds budget. */
type TimeoutResultError = {
	readonly kind: 'timeout';
	readonly name: string;
	readonly message: string;
	readonly phase: 'execution';
	readonly limit: number;
};

/** A guarded loop exceeded the iteration cap. */
type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'execution';
	readonly limit: number;
};

/**
 * Discriminated union of every error kind `run()` can surface.
 *
 * @remarks
 * Includes upstream gate errors (`ParseResultError`,
 * `FormattingResultError`) plus the three runtime kinds declared
 * above. Switch on `error.kind` to narrow.
 */
type RunResultError =
	| ParseResultError
	| FormattingResultError
	| JavaScriptResultError
	| TimeoutResultError
	| IterationLimitResultError;

// ─── Public API surface ──────────────────────────────────────

/**
 * Outcome variants for `run()`.
 *
 * @remarks
 * - `'complete'` — worker reached natural end-of-program.
 * - `'cancel'` — `handle.cancel()` was called before settlement.
 * - `'timeout'` — seconds budget exhausted.
 * - `'iteration-limit'` — a guarded loop exceeded its cap.
 * - `'error'` — learner code threw, worker.onerror fired, or a
 *   pre-execution gate (parse, validation, formatting) rejected.
 *
 * `ok: true` iff `outcome === 'complete'`. On `'cancel'` there is no
 * `error` payload (cancel is not classified as an error). On every
 * other non-complete outcome, `error` carries a `RunResultError`.
 */
type RunOutcome =
	| 'complete'
	| 'cancel'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

/**
 * Result from `run()` — trapless Web Worker execution; final status only.
 *
 * @remarks
 * No `logs` field. No `reason` field. Programs that call `console.log`
 * write to the worker's native console (visible in browser dev tools,
 * not captured here). Programs that call `prompt`/`alert`/`confirm`
 * without a consumer-provided IO mock surface as `outcome:'error'`.
 *
 * `ast` is set whenever parse succeeded — including on the rejections
 * path (parse OK, JeJ rejected) and on later outcomes (success,
 * timeout, iteration-limit, runtime error, cancel-after-spawn). Absent
 * only when the parse gate failed. Mirrors `TraceResult`'s convention
 * of putting the parsed AST on the result.
 *
 * Deliberately uses `BaseResult<RunResultError>` directly rather than
 * the legacy `Result<TEvent, TOutcome>` helper, because the latter
 * adds an optional `logs` field this engine forbids.
 */
type RunResult = BaseResult<RunResultError> & {
	readonly outcome: RunOutcome;
	readonly ast?: Program;
};

/**
 * Consumer-provided IO mock overrides.
 *
 * @remarks
 * Each slot is independently overridable. Omitted slots have **no
 * native fallback** in run (this is the deliberate divergence from
 * intercept). If learner code calls a dialog without a mock, the
 * engine settles with `outcome:'error'`.
 *
 * Mocks may return values directly or via Promise; the engine awaits
 * either. If a mock throws synchronously or rejects asynchronously,
 * the error surfaces as `outcome:'error'` with `error.kind:'javascript'`.
 */
type IoMocks = {
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
};

/**
 * Options for `run()`.
 *
 * @remarks
 * - `seconds` — user-perceived runtime budget. Default 5.
 * - `iterations` — optional guarded-loop limit. Omitted means no
 *   guard injection (loops bounded only by `seconds`).
 * - `io` — optional dialog mocks; see {@link IoMocks}.
 */
type RunOptions = {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

/**
 * The options object exposed on `RunHandle.options` after defaults
 * have been applied.
 *
 * @remarks
 * - `seconds` is always populated (defaults to 5 when not provided).
 * - `iterations` and `io` are passed through as-given (no defaults).
 */
type ResolvedRunOptions = {
	readonly seconds: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

/**
 * Handle returned by `run()`.
 *
 * @remarks
 * Mirrors intercept's handle pattern (without AsyncGenerator or
 * `.fail`). Two consumer modes — see intercept's `InterceptHandle`
 * docs for the full PromiseLike-assimilation caveat.
 *
 * **All sync-available data is on the handle** at the moment
 * `run()` returns:
 * - `cancel()` — idempotent. First-write-wins against timeout /
 *   worker-error. During an in-flight IO mock the cancel waits for
 *   the mock to settle before terminating. After the result has
 *   already settled, cancel is a no-op.
 * - `result` — memoized Promise. Same reference on every access.
 *   Resolves once; never rejects (errors are returned as data).
 * - `then` — PromiseLike delegate to `.result`. Allows `await run(code)`
 *   to resolve directly to the `RunResult` without an explicit
 *   `.result` access, mirroring the drain-on-await behavior of
 *   intercept's handle. Equivalent to `await handle.result`.
 * - `code` — the source string the caller passed in.
 * - `ast` — the parsed acorn `Program` root, or `undefined` if parse
 *   itself failed (in which case `result` is also pre-settled with
 *   the parse error).
 * - `options` — resolved options with defaults applied (`seconds`
 *   always populated; `iterations` and `io` as-given).
 */
type RunHandle = PromiseLike<RunResult> & {
	readonly cancel: () => void;
	readonly result: Promise<RunResult>;
	readonly code: string;
	readonly ast: Program | undefined;
	readonly options: ResolvedRunOptions;
};

// ─── Internal worker-protocol messages ───────────────────────

type SetupMessage = {
	readonly type: 'setup';
	readonly sharedBuffer: SharedArrayBuffer;
};

type ExecuteMessage = {
	readonly type: 'execute';
	readonly code: string;
	readonly loopCount?: number;
};

type WorkerInbound = SetupMessage | ExecuteMessage;

type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'alert' | 'confirm';
	readonly args: readonly unknown[];
	readonly line?: number;
};

/**
 * Worker → main message posted when execution finishes.
 *
 * @remarks
 * Carries an optional `error` payload directly on the message, in
 * contrast to intercept's design (where errors are streamed as events
 * and `complete` is empty). Run has no event stream, so the error
 * rides on `complete`. Construction-time and execution-time errors
 * are both reported via this channel; the `phase` field discriminates.
 */
type CompleteMessage = {
	readonly type: 'complete';
	readonly error?: {
		readonly name: string;
		readonly message: string;
		readonly line?: number;
		readonly phase: 'creation' | 'execution';
	};
};

type WorkerOutbound = IoRequestMessage | CompleteMessage;

export type {
	JavaScriptResultError,
	TimeoutResultError,
	IterationLimitResultError,
	RunResultError,
	RunOutcome,
	RunResult,
	IoMocks,
	RunOptions,
	ResolvedRunOptions,
	RunHandle,
	SetupMessage,
	ExecuteMessage,
	WorkerInbound,
	IoRequestMessage,
	CompleteMessage,
	WorkerOutbound,
};
