/**
 * @file Code object factory — the default export of the JeJ library.
 *
 * @remarks Creates a live analysis dashboard for a piece of JeJ code.
 * Construction always succeeds — never throws. Setter re-runs the
 * full analysis pipeline synchronously.
 *
 * See {@link JejProgram} in types.ts for full interface documentation.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validateProgram from '../validating/validate-program.js';
import justEnoughJs from '../validating/just-enough-js.js';
import checkFormat from '../formatting/check-format.js';
import run from './run.js';
import trace from './trace.js';
import debug from './debug.js';
import createExecution from '../evaluating/shared/create-execution.js';

import type { JejProgram, RunResult, TraceResult, DebugResult, DebugEvent } from './types.js';
import type { Execution, EngineConfig, TraceConfig } from '../evaluating/shared/types.js';
import type { RunEvent } from '../evaluating/shared/types.js';
import type { AranStep } from '../evaluating/trace/record/types.js';
import type { Violation } from '../validating/types.js';

// --- Analysis state ---

type AnalysisState = {
	code: string;
	ok: boolean;
	parseError: SyntaxError | undefined;
	rejections: readonly Violation[];
	isFormatted: boolean;
};

/**
 * Runs the full analysis pipeline on code and returns the state.
 * Synchronous — recast format check is sync.
 */
function analyze(code: string): AnalysisState {
	const report = validateProgram(code, justEnoughJs);

	// Parse error
	if (report.parseError) {
		const err = new SyntaxError(report.parseError.message);
		// Attach line/column like acorn does
		(err as SyntaxError & { line: number; column: number }).line =
			report.parseError.location.line;
		(err as SyntaxError & { column: number }).column =
			report.parseError.location.column;

		return {
			code,
			ok: false,
			parseError: err,
			rejections: [],
			isFormatted: false,
		};
	}

	const rejections = report.violations;

	if (rejections.length > 0) {
		return {
			code,
			ok: false,
			parseError: undefined,
			rejections,
			isFormatted: false,
		};
	}

	// Valid JeJ — check format
	const { formatted } = checkFormat(code);

	return {
		code,
		ok: formatted,
		parseError: undefined,
		rejections: [],
		isFormatted: formatted,
	};
}

// --- Factory ---

/**
 * Creates a live analysis dashboard for JeJ code.
 *
 * @param code - Initial source code. Defaults to `''` (empty program).
 * @returns A {@link JejProgram} object
 */
export default function createJejProgram(code?: string): JejProgram {
	let state = analyze(code ?? '');

	/**
	 * Creates an immediate-resolving Execution that returns the current
	 * validation result as an error. Used when !ok.
	 */
	function blockedExecution<TEvent, TResult>(
		result: TResult,
	): Execution<TEvent, TResult> {
		return createExecution(
			async function* () {
				return result;
			},
			function noop() {},
		);
	}

	function buildBlockedResult(): { ok: false; error?: object; rejections?: readonly Violation[] } {
		if (state.parseError) {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'parse' as const,
					name: 'SyntaxError',
					message: state.parseError.message,
					line: (state.parseError as SyntaxError & { line?: number }).line ?? 1,
					column: (state.parseError as SyntaxError & { column?: number }).column,
				},
			});
		}
		if (state.rejections.length > 0) {
			return deepFreezeInPlace({ ok: false, rejections: state.rejections });
		}
		// !ok due to formatting
		return deepFreezeInPlace({ ok: false, error: { kind: 'formatting' as const } });
	}

	return {
		get code() {
			return state.code;
		},
		set code(newCode: string) {
			state = analyze(newCode);
		},

		get ok() {
			return state.ok;
		},
		get parseError() {
			return state.parseError;
		},
		get rejections() {
			return state.rejections;
		},
		get isFormatted() {
			return state.isFormatted;
		},

		run(config?: EngineConfig): Execution<RunEvent, RunResult> {
			if (!state.ok) {
				return blockedExecution<RunEvent, RunResult>(
					buildBlockedResult() as RunResult,
				);
			}
			return run(state.code, config);
		},

		trace(config?: TraceConfig): Execution<AranStep, TraceResult> {
			if (!state.ok) {
				return blockedExecution<AranStep, TraceResult>(
					buildBlockedResult() as TraceResult,
				);
			}
			return trace(state.code, config);
		},

		debug(config?: EngineConfig): Execution<DebugEvent, DebugResult> {
			if (!state.ok) {
				return blockedExecution<DebugEvent, DebugResult>(
					buildBlockedResult() as DebugResult,
				);
			}
			return debug(state.code, config);
		},
	};
}
