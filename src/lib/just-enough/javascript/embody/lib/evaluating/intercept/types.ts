/**
 * @file Worker message protocol types, IO mock surface, result shape, and
 * handle for the intercept engine.
 *
 * Defines the two-step message protocol (setup → execute) between the
 * main thread and the execution worker, the SharedArrayBuffer layout
 * for synchronous I/O (prompt/confirm/alert), the consumer-facing IO
 * mock types (IoMocks, IoConsole, InterceptOptions), the public
 * `InterceptResult` shape, and the public `InterceptHandle` — the
 * return type of `createInterceptGenerator`.
 *
 * `InterceptResult` lives here (engine-owned) per the convention
 * documented in [evaluating/run/types.ts]: "execution wrappers compose
 * their own result types … declared in their own modules." This
 * replaces the legacy `lib/api/types.ts` aggregation.
 */

import type {
	ConsoleMethod,
	Execution,
	InterceptEvent,
} from '../shared/types.js';
import type {
	BaseResult,
	FormattingResultError,
	Violation,
} from '../../validating/types.js';
import type { ParseResultError } from '../../parse-old/types.js';
import type { ASTNode, LinkedInterceptEvent } from './link/types.js';

// ─── Result error types (engine-owned) ───────────────────────

/**
 * Validation failed — code parsed but contains JeJ-disallowed constructs.
 *
 * @remarks Replaces the legacy `BaseResult.rejections` field for intercept
 * by normalizing into the `error` channel with a stable `kind` discriminant.
 * The `violations` array carries the per-node rejection details.
 */
type ValidationResultError = {
	readonly kind: 'validation';
	readonly violations: readonly Violation[];
};

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
	readonly line?: number;
	readonly phase: 'execution';
	readonly limit: number;
};

/** A guarded loop exceeded its iteration cap. */
type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'execution';
	readonly limit: number;
};

/**
 * Discriminated union of every error kind `intercept` can surface on
 * `result.error`. Switch on `error.kind` to narrow.
 *
 * @remarks Mirrors the shape of `RunResultError` in evaluating/run plus
 * one intercept-only variant (`'validation'`) for normalized JeJ
 * violations. The `'timeout'` and `'iteration-limit'` variants also
 * appear as `ErrorEvent`s in the event stream — `result.error` is the
 * structured form, `result.events.find(e => e.event === 'error')` is
 * the streamed form.
 */
type InterceptResultError =
	| ParseResultError
	| FormattingResultError
	| ValidationResultError
	| JavaScriptResultError
	| TimeoutResultError
	| IterationLimitResultError;

// ─── Outcome + Result ────────────────────────────────────────

/**
 * Outcome variants for a settled intercept run.
 *
 * @remarks
 * - `'complete'`        — worker reached natural end-of-program.
 * - `'cancel'`          — `handle.cancel()` was called.
 * - `'fail'`            — `handle.fail(reason)` was called; `result.reason`
 *                         carries the consumer-supplied payload.
 * - `'timeout'`         — seconds budget exhausted.
 * - `'iteration-limit'` — a guarded loop exceeded its cap.
 * - `'error'`           — pre-execution gate (parse/validation/formatting)
 *                         rejected, or worker construction failed.
 *
 * `ok` mapping (computed in `getResult`):
 * - `'complete' | 'cancel' | 'fail'` → `ok: true`
 * - `'timeout' | 'iteration-limit' | 'error'` → `ok: false`
 */
type InterceptOutcome =
	| 'complete'
	| 'cancel'
	| 'fail'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

/**
 * Result from `createInterceptGenerator`. Always returned (never thrown);
 * even runtime errors are reified as data.
 *
 * @remarks
 * Composes `BaseResult<InterceptResultError>` (the validating-module
 * compositional root) with intercept-specific fields per the convention
 * in `evaluating/run/types.ts`. New fields beyond legacy intercept:
 *
 * - `events` — RENAMED from `logs`. Each element is a `LinkedInterceptEvent`
 *   carrying both the original event payload and AST navigation
 *   (`nodePath`, `nodePathSource`, `node`, `loc`, `callee`, `calleePath`).
 *   Every event also carries `step: number` (1-indexed, contiguous):
 *   `events[i].step === i + 1`. Same `step` value appears on the back-ref
 *   in `ast[event.nodePath].events`, enabling timeline reconstruction
 *   directly from any AST node.
 * - `code` — the original source string passed to `createInterceptGenerator`.
 * - `options` — the options object passed in (or `{}` if omitted).
 * - `ast` — `Record<nodePath, ASTNode>` of every AST node in the program,
 *   each carrying back-refs to the events that fired on it
 *   (`node.events[]`). `null` only when validation failed before parsing
 *   produced a usable tree (the lone error event has
 *   `nodePathSource: 'no-ast'`).
 * - `visitCounts` — `Record<nodePath, number>` of trap-fire counts per
 *   AST node; trivially `events.reduce(...)` but pre-computed for
 *   convenience and to mirror trace's result shape.
 *
 * Replay invariant: a second `for await` over a settled handle yields
 * the SAME event references that the live iteration yielded; `events[i]`
 * after settlement is identity-equal to `events[i]` during streaming.
 * The link step mutates events in place (adds `.node` ref) — never clones.
 */
type InterceptResult = BaseResult<InterceptResultError> & {
	readonly outcome: InterceptOutcome;
	readonly events: readonly LinkedInterceptEvent[];
	readonly reason?: unknown;
	readonly code: string;
	readonly options: InterceptOptions;
	readonly ast: Readonly<Record<string, ASTNode>> | null;
	readonly visitCounts: Readonly<Record<string, number>>;
};

// ─── IO mock surface ──────────────────────────────────────────

/**
 * Per-method console mock surface. All slots optional — omitted slots
 * fall back to the Native IO wrapper (`window.console.*`).
 *
 * Each callback is async-compatible. Sync returns work; async returns
 * are awaited before learner execution continues (the worker remains
 * blocked until the Promise resolves).
 *
 * If a callback throws (sync or async rejection), the error is caught
 * and surfaced as an ErrorEvent with `name: 'InternalError'`.
 */
type IoConsole = {
	readonly [K in ConsoleMethod]?: (
		...args: readonly unknown[]
	) => void | Promise<void>;
};

/**
 * Consumer-provided IO mock overrides for a single run invocation.
 *
 * Each slot is independently overridable. Omitted slots fall back to
 * the Native IO wrapper (window.prompt / window.alert / window.confirm
 * / console.*). Built into the Resolved IO table at invocation time.
 *
 * @remarks
 * - `prompt` — called with (message, defaultValue?); must return
 *   string | null (or a Promise resolving to one)
 * - `alert` — called with (message); return value ignored
 * - `confirm` — called with (message); must return boolean (or Promise)
 * - `console` — per-method overrides; see IoConsole
 *
 * All callbacks are awaited. The learner's script does not continue
 * past the IO call until the callback resolves. If a callback throws,
 * execution surfaces an InternalError and terminates.
 */
type IoMocks = {
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
	readonly console?: IoConsole;
};

/**
 * Options accepted by createInterceptGenerator.
 *
 * Extends EngineConfig (seconds, iterations) with the IO mock surface.
 *
 * @remarks
 * `iterations` controls the `while`-loop guard injector. `Infinity` (or
 * omitted) skips guard injection — the only way to permit truly
 * unbounded loops. **Any finite number** injects guards that throw
 * `RangeError` when `++loopN > iterations` — so `0` bans loop bodies
 * entirely (first iteration throws), `-1` also throws on the first
 * iteration, and `n` allows exactly `n` iterations. `NaN` is treated
 * as invalid and falls through to the no-guard path; callers should
 * validate input upstream if stricter semantics are required.
 */
type InterceptOptions = {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

// ─── Public return type ───────────────────────────────────────

/**
 * The handle returned by `createInterceptGenerator`.
 *
 * @remarks Simultaneously satisfies three interfaces:
 *
 * - `AsyncGenerator<InterceptEvent, InterceptResult>` — the raw iteration
 *   surface (`.next()`, `.return()`, `.throw()`) used by
 *   fine-grained consumers and the internal test suite.
 * - `Execution<InterceptEvent, InterceptResult>` — from `../shared/types.ts`.
 *   Provides `.cancel()`, `.result`, and PromiseLike `.then()`.
 *
 * The `Execution` contract is a strict subset of what's exposed —
 * consumers that only want the high-level `await run(code)` /
 * `for await` / `.cancel()` surface can annotate as `Execution`
 * directly. The AsyncGenerator surface is kept available for
 * low-level needs (currently only internal tests).
 *
 * **Three consumption modes** (see run/README.md § Public API for
 * detail):
 * 1. Iterate events — `for await (const event of handle) {...}`.
 * 2. Await the result — `await handle` (PromiseLike) or
 *    `await handle.result`.
 * 3. Cancel — `handle.cancel()` at any point.
 *
 * Mode 1 and Mode 2 must not be mixed on the same handle — see
 * JSDoc on `createInterceptGenerator` for why.
 */
type InterceptHandle = AsyncGenerator<LinkedInterceptEvent, InterceptResult> &
	Execution<LinkedInterceptEvent, InterceptResult> & {
		/**
		 * Stop the run and attach a structured rejection payload.
		 *
		 * @param reason - arbitrary payload the consumer wants surfaced
		 *   on `result.reason`. Not cloned, not frozen-separately; the
		 *   same reference is replay-stable.
		 *
		 * @remarks `.fail(reason)` is for consumer-driven structured
		 * termination — e.g. a teaching harness that wants to stop the
		 * run and record "learner's prediction was wrong" with a
		 * specific rejection payload. The result settles with
		 * `{ok:true, outcome:'fail', reason}`. Events remain pure
		 * (no synthetic termination marker appended).
		 *
		 * Idempotent and first-write-wins with `.cancel()` / timeout
		 * / worker-error: whichever termination path sets its cause
		 * first wins; subsequent `.fail()` / `.cancel()` calls are
		 * no-ops. Safe to call any number of times at any phase.
		 */
		readonly fail: (reason?: unknown) => void;

		/**
		 * The original source string passed to `createInterceptGenerator`.
		 * Eager — available immediately after construction, before any
		 * iteration or result access.
		 */
		readonly code: string;

		/**
		 * The options object passed to `createInterceptGenerator` (or
		 * `{}` if omitted). Eager — same lifetime as `code`. Reference
		 * is the consumer's own object, not a clone — do not mutate it.
		 */
		readonly options: InterceptOptions;

		/**
		 * Promise that resolves to the AST node record once the
		 * validation gate completes successfully (and so before the
		 * worker runs). Resolves to `null` when validation fails (parse
		 * error, JeJ violations, or formatting rejection) — in that case
		 * `result.ast` is also `null`.
		 *
		 * @remarks Useful for consumers that need AST shape *before*
		 * events start firing — e.g. an editor that wants to set up
		 * highlighting for every CallExpression before the run begins.
		 *
		 * Same `Record<nodePath, ASTNode>` reference that ends up on
		 * `result.ast` after completion. Pre-completion the structure
		 * is mutable (back-ref `events[]` arrays will be populated as
		 * events fire); post-completion the whole graph is frozen
		 * via `deepFreezeInPlace` in `getResult`.
		 */
		readonly ast: Promise<Readonly<Record<string, ASTNode>> | null>;
	};

// --- Messages: main → worker ---

/**
 * First message: delivers the SharedArrayBuffer so the worker can
 * set up typed array views and define trapped globals.
 */
type SetupMessage = {
	readonly type: 'setup';
	readonly sharedBuffer: SharedArrayBuffer;
};

/**
 * Second message: delivers the learner's source code for execution.
 *
 * @remarks Sent after setup so that trap definition code does not
 * affect learner code line numbers.
 *
 * `loopCount` is optional — when provided, the worker creates
 * `loop1` through `loopN` parameters for `new Function`, initialized
 * to 0. The code must already have `if (++loopN > max) throw ...`
 * guards injected by `guardLoops()`.
 */
type ExecuteMessage = {
	readonly type: 'execute';
	readonly code: string;
	readonly loopCount?: number;
	/** When true, omit `"use strict";` prefix so `with` can execute. */
	readonly scriptMode?: boolean;
};

type WorkerInbound = SetupMessage | ExecuteMessage;

// --- Messages: worker → main ---

type WorkerOutbound = EventMessage | IoRequestMessage | CompleteMessage;

/**
 * Streamed as each trap fires. Allows the main thread to forward
 * events to the real console in real time.
 */
type EventMessage = {
	readonly type: 'event';
	readonly event: InterceptEvent;
};

/**
 * Worker is blocked on `Atomics.wait` — main thread must show the
 * native dialog and write the response to the SharedArrayBuffer.
 */
type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'confirm' | 'alert';
	readonly args: readonly unknown[];
	/** AST nodePath of the firing CallExpression, set by `__$ic`'s
	 *  `__currentPath` slot at the moment the worker emits the request.
	 *  Null only if the call somehow fired outside any wrapped call (in
	 *  practice unreachable for instrumented code). */
	readonly nodePath: string | null;
};

/**
 * Execution finished (normally or via caught error). The main thread
 * assembles the final event array from the streamed `EventMessage`s.
 */
type CompleteMessage = {
	readonly type: 'complete';
};

// --- SharedArrayBuffer layout ---
//
// Buffer constants (Int32Array indices and byte offsets) live in
// worker-protocol.ts as named constants — not a type, because they
// mix indexing semantics (Int32Array element indices vs byte offsets).
//
// See worker-protocol.ts for the layout documentation.

export type {
	IoConsole,
	IoMocks,
	InterceptOptions,
	InterceptHandle,
	InterceptOutcome,
	InterceptResult,
	InterceptResultError,
	ValidationResultError,
	JavaScriptResultError,
	TimeoutResultError,
	IterationLimitResultError,
	WorkerInbound,
	WorkerOutbound,
	SetupMessage,
	ExecuteMessage,
	EventMessage,
	IoRequestMessage,
	CompleteMessage,
};
