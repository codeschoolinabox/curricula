/**
 * @file Public entry: `traceVariables(code, { seconds? }?)` — the tier's only
 * end-to-end run (DOCS.md § Architectural Sketch, phases 1-6). Validate (JEJ
 * gate) → project the scope table → instrument → assemble the engine spec → call
 * the engine factory → wrap the engine handle as the tier's typed handle.
 *
 * Validate and instrument run EAGERLY and are the only throwing boundaries: a
 * non-JEJ or unparseable program, or a construct the instrumenter rejects
 * (labels, expression-target for-of), throws synchronously at the call and never
 * builds a handle. The engine RUN stays fully lazy (nothing runs until the first
 * pull or `result`). A consumer therefore guards two channels: a `try/catch`
 * around the call (admission errors) and the settlement (runtime errors such as
 * a TDZ read or const reassignment, which arrive as `outcome: 'errored'` with a
 * stamped halt).
 */

import evaluate from '../../../../../study-lenses--deprecated-architecture/lib/engine/evaluate.js';
import type {
	EngineError,
	EngineHandle,
	EngineResult,
	EvaluateSpec,
	Settlement,
} from '../../../../../study-lenses--deprecated-architecture/lib/engine/types.js';
import type { CreateTransport } from '../../../../../study-lenses--deprecated-architecture/lib/engine/worker/types.js';
import buildScope from '../../../scope/build-scope.js';
import justEnoughJs from '../../../validating/just-enough-js.js';
import type { ValidationReport } from '../../../validating/types.js';
import validateProgram from '../../../validating/validate-program.js';

import instrumentVariables from './instrument-variables.js';
import projectScopeTable from './project-scope-table.js';
import type {
	TraceVariablesOptions,
	VariablesEngineError,
	VariablesHalt,
	VariablesSettlement,
	VariablesTraceEvent,
	VariablesTraceHandle,
	VariablesTraceResult,
} from './types.js';
import variablesThreadLogic from './variables-thread-logic.js';

/**
 * Runs a JEJ program and streams its variable-lifecycle events.
 *
 * @param code - JEJ source; validated and instrumented eagerly (may throw).
 * @param options - `{ seconds? }` forwarded to the engine spec.
 * @param createTransport - test-only engine seam (invisible to the public
 *   {@link import('./types.js').TraceVariables} type a 2-arg caller uses);
 *   defaults to the real worker transport.
 * @returns The tier's lazy typed handle.
 */
export default function traceVariables(
	code: string,
	options: TraceVariablesOptions = {},
	createTransport?: CreateTransport,
): VariablesTraceHandle {
	// Phase 1 — Validate (the JEJ gate). validateProgram never throws; the facade
	// authors the throw from the report.
	const report = validateProgram(code, justEnoughJs);
	if (!report.isValid || report.ast === undefined) {
		throw gateError(report);
	}
	const { ast } = report;

	// Phase 2 — Project (pure). One buildScope, fed only to the table; the
	// instrumenter re-derives its own scope analysis internally.
	const scopeTable = projectScopeTable(ast, buildScope(ast));

	// Phase 3 — Instrument (throws InstrumentBoundaryError on labels /
	// expression-target for-of).
	const instrumented = instrumentVariables(ast, code, scopeTable);

	// Phase 4 — assemble the spec and call the factory (sync + lazy). `strict` is
	// left unset (engine default true): the only sloppy-mode construct, `with`,
	// fails the JEJ gate above and never reaches here.
	const spec: EvaluateSpec = {
		code: instrumented,
		// Inline `new Worker(new URL(...))` so webpack's static worker detection
		// emits a real worker chunk; splitting it across modules (URL apart from
		// `new Worker`) emits a raw .ts asset that crashes. See engine
		// `EvaluateSpec.workerFactory`.
		workerFactory: () =>
			// eslint-disable-next-line unicorn/relative-url-style -- `new URL(..., import.meta.url)` worker bundling resolves the `./` form
			new Worker(new URL('./variables-worker-entry.ts', import.meta.url), {
				type: 'module',
			}),
		workerConfig: scopeTable,
		threadLogic: variablesThreadLogic,
		...(options.seconds === undefined ? {} : { seconds: options.seconds }),
	};

	// Forward the test seam only when given, so the real transport stays out of
	// the facade's value-import graph (the engine owns that default).
	const engineHandle =
		createTransport === undefined
			? evaluate(spec)
			: evaluate(spec, createTransport);

	return wrapHandle(engineHandle);
}

/** Authors the synchronous gate throw from a failed {@link ValidationReport}. */
function gateError(report: ValidationReport): Error {
	if (report.parseError !== undefined) {
		return new Error(
			`traceVariables: not valid JavaScript — ${report.parseError.message}`,
		);
	}
	const firstViolation = report.violations[0];
	return new Error(
		`traceVariables: not Just-Enough-JavaScript — ${
			firstViolation?.message ?? 'rejected construct'
		}`,
	);
}

/**
 * Wraps the engine handle as a {@link VariablesTraceHandle}. The async iterator
 * narrows items to typed events and FORWARDS `return()` to the engine iterator,
 * so breaking a `for await` still routes through the engine's cancel.
 */
function wrapHandle(engine: EngineHandle): VariablesTraceHandle {
	return Object.freeze({
		[Symbol.asyncIterator](): AsyncIterator<VariablesTraceEvent> {
			const inner = engine[Symbol.asyncIterator]();
			return {
				async next(): Promise<IteratorResult<VariablesTraceEvent>> {
					return (await inner.next()) as IteratorResult<VariablesTraceEvent>;
				},
				// `return` is optional on the AsyncIterator type, so the guard is
				// required — but the engine's iterator always provides it, which is
				// what makes breaking a `for await` route through the engine's cancel.
				async return(
					value?: unknown,
				): Promise<IteratorResult<VariablesTraceEvent>> {
					if (inner.return) {
						return (await inner.return(
							value,
						)) as IteratorResult<VariablesTraceEvent>;
					}
					return { done: true, value: undefined };
				},
			};
		},
		get result(): Promise<VariablesTraceResult> {
			return engine.result.then(
				(engineResult: EngineResult): VariablesTraceResult => ({
					events: engineResult.items as ReadonlyArray<VariablesTraceEvent>,
					settlement: toVariablesSettlement(engineResult.settlement),
				}),
			);
		},
		cancel: () => engine.cancel(),
		fail: (reason?: unknown) => engine.fail(reason),
	});
}

/** Maps the engine's generic settlement to the tier's typed settlement. */
function toVariablesSettlement(settlement: Settlement): VariablesSettlement {
	return {
		outcome: settlement.outcome,
		// The worker's serializeHalt authored exactly the VariablesHalt shape; the
		// engine carries it verbatim. Null on non-worker stops (cancel/fail/
		// timeout/worker-crash).
		halt: (settlement.halt ?? null) as VariablesHalt | null,
		durationMs: settlement.durationMs,
		...(settlement.error === undefined
			? {}
			: { engineError: toVariablesEngineError(settlement.error) }),
		...(settlement.outcome === 'failed'
			? { failReason: settlement.failReason }
			: {}),
	};
}

/** Mirrors the engine's structured cause as the tier's typed engine error. */
function toVariablesEngineError(error: EngineError): VariablesEngineError {
	return { cause: error.cause, name: error.name, message: error.message };
}
