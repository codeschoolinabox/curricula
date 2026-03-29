/**
 * @file Package entry point for the JeJ library.
 *
 * Default export: `createJejProgram` factory (code object).
 * Named exports: all public API functions and types.
 */

// --- Default export: code object factory ---
export { default } from './api/default.js';

// --- Named exports: API functions ---
export { default as run } from './api/run.js';
export { default as trace } from './api/trace.js';
export { default as debug } from './api/debug.js';
export { default as validate } from './api/validate.js';
export { default as hint } from './api/hint.js';
export { default as isJej } from './validating/is-jej.js';
export { format, checkFormat } from './api/format.js';

// --- Type re-exports ---
export type {
	ResultError,
	BaseResult,
	Result,
	RunResult,
	TraceResult,
	DebugResult,
	DebugEvent,
	HintResult,
	JejProgram,
} from './api/types.js';

export type {
	Execution,
	EngineConfig,
	TraceConfig,
	RunEvent,
} from './evaluating/shared/types.js';

export type { AranStep } from './evaluating/trace/record/types.js';

export type { Violation } from './validating/types.js';

export type { CheckFormatResult } from './formatting/types.js';
