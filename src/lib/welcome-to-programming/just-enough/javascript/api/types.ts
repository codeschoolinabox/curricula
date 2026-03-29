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
 * Warnings are NOT included in execution results. Get warnings
 * via {@link HintResult} from `hint()` or the code object's
 * `.warnings` property.
 */

import type { Violation } from '../validating/types.js';
import type { RunEvent } from '../evaluating/shared/types.js';
import type { AranStep } from '../evaluating/trace/record/types.js';
import type { Execution, EngineConfig, TraceConfig } from '../evaluating/shared/types.js';

// ─── Error types ─────────────────────────────────────────────

/**
 * A parse error — code is not valid JavaScript syntax.
 *
 * @remarks `line` is always present (acorn always reports it).
 * `column` is present when acorn provides it.
 */
type ParseResultError = {
	readonly kind: 'parse';
	readonly name: string;
	readonly message: string;
	readonly line: number;
	readonly column?: number;
};

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
 * Code is not properly formatted.
 *
 * @remarks Returned when the format check pipeline gate rejects
 * code that is valid JeJ but doesn't match the expected format.
 * The UI should show a "Format your code" prompt, not a generic
 * error message.
 *
 * This is a learning environment constraint — unformatted JeJ
 * code is valid JavaScript and will run elsewhere.
 */
type FormattingResultError = {
	readonly kind: 'formatting';
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
 * Base result shape shared by `validate()` and used as a
 * building block for execution results.
 *
 * @remarks
 * - `ok` is `true` when the code passes all checks that ran
 * - `error` is set for parse failures and formatting gate
 * - `rejections` is set when validation found language-level
 *   violations (code parsed but isn't valid JeJ)
 *
 * Parse error and rejections are mutually exclusive: if code
 * can't parse, there are no rejections (no AST to walk).
 */
type BaseResult = {
	readonly ok: boolean;
	readonly error?: ResultError;
	readonly rejections?: readonly Violation[];
};

/**
 * Generic execution result parameterized by event type.
 *
 * @remarks Extends {@link BaseResult} with a `logs` field
 * containing the event stream from execution.
 *
 * `logs` is present when execution ran (even partially — a
 * runtime error still produces partial logs up to the crash).
 * `logs` is absent when code was rejected before execution
 * (parse error, validation failure, or formatting gate).
 *
 * @typeParam TEvent - The event type for this engine
 */
type Result<TEvent> = BaseResult & {
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
 * Result from `trace()` — Aran AST instrumentation.
 *
 * @remarks `logs` contains {@link AranStep} entries: one per
 * expression evaluation, variable access, or control-flow step.
 * Array position is the step identity (no step numbers).
 */
type TraceResult = Result<AranStep>;

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

// ─── Hint result ─────────────────────────────────────────────

/**
 * Result from `hint()` — full pre-execution analysis.
 *
 * @remarks Combines validation, format checking, and warning
 * detection in a single call. This is the "code review" result.
 *
 * - `ok` reflects JeJ validation (parse + validate), NOT formatting
 * - `warnings` is always present (may be empty)
 * - `formatted` indicates whether code matches expected format
 * - If validation fails, `warnings` is `[]` and `formatted` is
 *   `false` (no point analyzing non-JeJ code)
 *
 * Warning categories:
 * - **misconceptions** — conceptual confusion (e.g. `if (x = 5)`
 *   when `===` was intended, `while () {} else {}`)
 * - **code smells** — style issues that suggest misunderstanding
 */
type HintResult = {
	readonly ok: boolean;
	readonly error?: ResultError;
	readonly rejections?: readonly Violation[];
	readonly warnings: readonly Violation[];
	readonly formatted: boolean;
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
 * program.warnings;     // []
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

	/** Warnings (misconceptions + code smells). Only populated
	 * when code is valid JeJ — empty otherwise. */
	readonly warnings: readonly Violation[];

	/** Execute in Web Worker with trapped I/O.
	 * Returns immediate error result when `!ok`. */
	run(config?: EngineConfig): Execution<RunEvent, RunResult>;

	/** Execute with Aran AST instrumentation in Worker.
	 * Returns immediate error result when `!ok`. */
	trace(config?: TraceConfig): Execution<AranStep, TraceResult>;

	/** Execute in iframe with debugger statements.
	 * Returns immediate error result when `!ok`. */
	debug(config?: EngineConfig): Execution<DebugEvent, DebugResult>;
};

// ─── Exports ─────────────────────────────────────────────────

export type {
	ResultError,
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
	HintResult,
	JejProgram,
};
