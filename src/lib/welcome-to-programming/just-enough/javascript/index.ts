/**
 * @file Package entry point for the JeJ library.
 *
 * Default export: `createJejProgram` factory (code object).
 * Named exports: all public API functions and types.
 */

// --- Default export: code object factory ---
export { default } from './api/default.js';

// --- Named exports: API functions ---
export { default as run } from './lib/evaluating/run/run.js';
export { default as trace } from './api/trace.js';
export { default as validate } from './api/validate.js';
export { default as parse } from './api/parse.js';
export { default as isJej } from './lib/validating/is-jej.js';
export { format, checkFormat } from './api/format.js';

// --- Type re-exports ---
export type {
	ResultError,
	ParseResult,
	BaseResult,
	Result,
	RunResult,
	TraceResult,
	JejProgram,
} from './api/types.js';

export type {
	Execution,
	EngineConfig,
	RunEvent,
} from './lib/evaluating/shared/types.js';

export type { TraceConfig } from './lib/evaluating/trace/semantics/config.types.js';

export type { TraceEvent } from './lib/evaluating/trace/semantics/tracing/types.js';

export type { Violation } from './lib/validating/types.js';

export type { CheckFormatResult } from './lib/formatting/types.js';
