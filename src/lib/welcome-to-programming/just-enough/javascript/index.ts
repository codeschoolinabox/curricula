/**
 * @file Package entry point for the JeJ library.
 *
 * Named exports: all public API functions and types.
 *
 * The JejProgram code-object factory (formerly the package's default
 * export) was removed as YAGNI bloat — superseded by the
 * `<StudyLenses>` container component. The package no longer has a
 * default export.
 */

// --- Named exports: API functions ---
export { default as intercept } from './lib/evaluating/intercept/intercept.js';
export { default as run } from './lib/evaluating/run/run.js';
export { default as trace } from './api/trace.js';
export { default as validate } from './lib/validating/validate.js';
export { default as parse } from './lib/parse-old/parse.js';
export { default as isJej } from './lib/validating/is-jej.js';
export { default as format } from './lib/formatting/format.js';
export { default as checkFormat } from './lib/formatting/check-format.js';

// --- Type re-exports ---
export type { ParseResult } from './lib/parse-old/types.js';

export type { BaseResult } from './lib/validating/types.js';

export type {
	ResultError,
	Result,
	InterceptResult,
	TraceResult,
} from './api/types.js';

export type {
	Execution,
	EngineConfig,
	InterceptEvent,
} from './lib/evaluating/shared/types.js';

export type { TraceConfig } from './lib/evaluating/trace/semantics/config.types.js';

export type { TraceEvent } from './lib/evaluating/trace/semantics/tracing/types.js';

export type { Violation } from './lib/validating/types.js';

export type { CheckFormatResult } from './lib/formatting/types.js';

export type {
	RunResult,
	RunOutcome,
	RunResultError,
	RunHandle,
	RunOptions,
	ResolvedRunOptions,
	IoMocks as RunIoMocks,
} from './lib/evaluating/run/types.js';
