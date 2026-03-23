/**
 * @file Types for the JeJ API wrappers.
 *
 * @remarks Defines the unified result shape returned by validate,
 * run, trace, and debug. Each wrapper returns a frozen object
 * matching one of these types. Consumers check `ok` first, then
 * inspect `rejections` or `error` for details.
 */

import type { Violation } from '../verify-language-level/types.js';
import type { RunEvent } from '../evaluating/shared/types.js';
import type { AranStep } from '../evaluating/trace/record/types.js';

// --- Error types ---

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
 * construction (e.g. `new Function` fails) from errors thrown
 * during execution (e.g. `ReferenceError` at runtime).
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
 * @remarks `limit` is the `maxSeconds` value that was exceeded.
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
 * @remarks `limit` is the `maxIterations` value that was exceeded.
 * Produced by loop guards injected into the code.
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

type ResultError =
	| ParseResultError
	| JavaScriptResultError
	| TimeoutResultError
	| IterationLimitResultError;

// --- Result types ---

/**
 * Base result shape shared by all wrapper functions.
 *
 * @remarks `ok` is `true` when the code is valid and executed
 * without errors (or, for validate-only, when the code is valid).
 *
 * - `error` is set for parse, runtime, timeout, and iteration-limit
 *   failures
 * - `rejections` is set when validation found language-level
 *   violations (code never ran)
 * - `warnings` is set whenever validation ran (could be empty)
 */
type BaseResult = {
	readonly ok: boolean;
	readonly error?: ResultError;
	readonly rejections?: readonly Violation[];
	readonly warnings?: readonly Violation[];
};

type RunResult = BaseResult & {
	readonly logs?: readonly RunEvent[];
};

type TraceResult = BaseResult & {
	readonly steps?: readonly AranStep[];
};

type DebugResult = BaseResult;

export type {
	ResultError,
	ParseResultError,
	JavaScriptResultError,
	TimeoutResultError,
	IterationLimitResultError,
	BaseResult,
	RunResult,
	TraceResult,
	DebugResult,
};
