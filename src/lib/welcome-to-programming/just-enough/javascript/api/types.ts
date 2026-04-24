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
	Violation,
} from '../lib/validating/types.js';
import type {
	RunEvent,
	Execution,
	EngineConfig,
} from '../lib/evaluating/shared/types.js';
import type {
	ASTNode,
	TraceEvent,
} from '../lib/evaluating/trace/semantics/tracing/types.js';
import type {
	TraceConfig,
	TraceOptions,
} from '../lib/evaluating/trace/semantics/config.types.js';

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
 * Generic execution result parameterized by event type.
 *
 * @remarks Composes `BaseResult` (from `lib/validating/types.ts`)
 * with the wider `ResultError` union, then adds a `logs` field
 * containing the event stream from execution.
 *
 * `logs` is present when execution ran (even partially — a
 * runtime error still produces partial logs up to the crash).
 * `logs` is absent when code was rejected before execution
 * (parse error, validation failure, or formatting gate).
 *
 * @typeParam TEvent - The event type for this engine
 */
type Result<TEvent> = BaseResult<ResultError> & {
	readonly logs?: readonly TEvent[];
};

/**
 * Result from `run()` — Web Worker execution with trapped I/O.
 *
 * @remarks `logs` contains {@link RunEvent} entries: one per
 * trapped call (console.log, prompt, alert, confirm, etc.)
 * plus an error event if execution failed.
 */
type RunResult = Result<RunEvent>;

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
type TraceResult = Result<TraceEvent> & {
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
type DebugResult = Result<DebugEvent>;

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

// ─── Code object ─────────────────────────────────────────────

/**
 * Live analysis dashboard for a piece of JeJ code.
 *
 * @remarks Created by the default export factory
 * (`createJejProgram`). Construction always succeeds — never
 * throws. The `.code` setter re-runs the analysis pipeline
 * synchronously, updating all properties immediately.
 *
 * **Object describes, functions transform.** The code object
 * reports the current state of the code. Standalone API functions
 * (`format`, `validate`, etc.) transform code. To update:
 * `program.code = format(program.code)` — external, explicit.
 *
 * **`.ok` gates execution.** When `!ok`, the execution methods
 * (`run`, `trace`, `debug`) return immediate error results
 * without spawning Workers or iframes.
 *
 * @example
 * ```ts
 * const program = jej('let x = 5;\n');
 * program.ok;           // true
 * program.isFormatted;  // true
 * program.rejections;  // []
 *
 * program.code = 'var x = 5;\n';
 * program.ok;           // false
 * program.rejections;   // [{ message: "'var' is not allowed...", ... }]
 *
 * program.code = format(program.code);
 * program.isFormatted;  // true
 * ```
 */
type JejProgram = {
	/** The current source code. Setter re-runs the full analysis
	 * pipeline synchronously. Never throws. */
	code: string;

	/** `true` when code parses, passes JeJ validation, AND is
	 * properly formatted. Same semantics as `isJej(code)`. */
	readonly ok: boolean;

	/** Parse error from acorn, if code is not syntactically valid.
	 * `undefined` when code parses successfully. */
	readonly parseError: SyntaxError | undefined;

	/** JeJ language-level violations. Empty array when code is
	 * valid JeJ. Only populated when code parses successfully. */
	readonly rejections: readonly Violation[];

	/** `true` when code matches the expected recast format output.
	 * Only meaningful when code is valid JeJ. */
	readonly isFormatted: boolean;

	/** Execute in Web Worker with trapped I/O.
	 * Returns immediate error result when `!ok`. */
	run(config?: EngineConfig): Execution<RunEvent, RunResult>;

	/** Execute with Aran instrumentation in Worker.
	 * Returns immediate error result when `!ok`. */
	trace(config?: TraceConfig): Execution<TraceEvent, TraceResult>;

	/** Execute in iframe with debugger statements.
	 * Returns immediate error result when `!ok`. */
	debug(config?: EngineConfig): Execution<DebugEvent, DebugResult>;
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
	RunResult,
	TraceResult,
	DebugResult,
	DebugEvent,
	JejProgram,
	// Re-exported for consumer convenience
	ASTNode,
	TraceOptions,
};
