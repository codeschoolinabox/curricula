/**
 * @file RecordFunction — instrument + execute code, return filtered steps.
 *
 * Returns an async generator that yields AranSteps and returns
 * the full TraceResult. Delegates tracing to a disposable Web Worker
 * which streams raw entries; post-processing converts them to
 * structured AranSteps.
 *
 * @remarks
 * - CAPTURE_ALL is hardcoded in the worker — no config passing needed
 * - postProcess and filterSteps run on the main thread after collection
 * - The generator returns a TraceResult (ok/error/logs)
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { TraceResult } from '../../../api/types.js';

import filterSteps from './filter-steps.js';
import postProcess from './post-process.js';
import createTraceGenerator from './trace.js';
import type { AranFilterOptions, AranStep, RawEntry } from './types.js';

/**
 * Creates an async generator that traces code and yields AranSteps.
 *
 * @param code - JavaScript source to instrument and evaluate
 * @param maxSeconds - timeout in seconds (cumulative execution time)
 * @param options - optional Aran filter options for step filtering
 * @param maxIterations - optional per-loop iteration limit; when any
 *   loop's condition check fires more than this many times, collection
 *   stops and the result reports an iteration-limit error. Counting
 *   happens at the raw-entry level before filtering, so the limit
 *   applies even when controlFlow is configured off.
 * @returns Async generator yielding AranStep, returning TraceResult
 */
async function* createRecordGenerator(
	code: string,
	maxSeconds: number,
	options?: AranFilterOptions,
	maxIterations?: number,
): AsyncGenerator<AranStep, TraceResult> {
	const maxMs = maxSeconds * 1000;

	// 1. Collect all raw entries from the trace worker
	// WHY batch: postProcess requires the full entry list for
	// cross-entry operations (depth tracking, evaluate folding).
	// A streaming processor will be added in a future iteration.
	const rawEntries: unknown[] = [];
	const traceGen = createTraceGenerator(code, maxMs);

	// WHY: track loop iterations at the raw-entry level (before
	// filtering) so the limit works regardless of trace options.
	const loopCounts =
		maxIterations !== undefined ? new Map<string, number>() : null;
	let iterationLimitHit = false;

	for await (const entry of traceGen) {
		rawEntries.push(entry);

		if (loopCounts !== null && isLoopCheckEntry(entry)) {
			const key = loopLocationKey(entry as RawEntry);
			const count = (loopCounts.get(key) ?? 0) + 1;
			if (count > maxIterations!) {
				iterationLimitHit = true;
				break;
			}
			loopCounts.set(key, count);
		}
	}

	// 2. Transform raw entries into structured AranStep[]
	const steps = postProcess(
		rawEntries as readonly (string | RawEntry)[],
	);

	// 3. Filter based on user options
	const filteredSteps = filterSteps(steps, options ?? {});

	// 4. Detect exception steps for error classification
	const exceptionStep = findExceptionStep(filteredSteps);

	// 5. Yield all steps one by one
	for (const step of filteredSteps) {
		yield step;
	}

	// 6. Build and return the result

	// 6a. Iteration limit — takes precedence over exception steps
	if (iterationLimitHit) {
		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'iteration-limit' as const,
				name: 'RangeError',
				message: `Loop exceeded ${maxIterations} iterations`,
				phase: 'execution' as const,
				limit: maxIterations!,
			},
			logs: filteredSteps,
		});
	}

	// 6b. Exception from traced code
	if (exceptionStep) {
		const errorName = extractErrorName(exceptionStep);

		if (errorName === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'timeout',
					name: errorName,
					message: extractErrorMessage(exceptionStep),
					...(exceptionStep.loc
						? { line: exceptionStep.loc.start.line }
						: {}),
					phase: 'execution' as const,
					limit: maxSeconds,
				},
				logs: filteredSteps,
			});
		}

		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'javascript',
				name: errorName,
				message: extractErrorMessage(exceptionStep),
				...(exceptionStep.loc
					? { line: exceptionStep.loc.start.line }
					: {}),
				phase: 'execution' as const,
			},
			logs: filteredSteps,
		});
	}

	return deepFreezeInPlace({
		ok: true,
		logs: filteredSteps,
	});
}

// --- Helpers ---

function findExceptionStep(
	steps: readonly AranStep[],
): AranStep | undefined {
	for (let i = steps.length - 1; i >= 0; i--) {
		if (steps[i].operation === 'exception') {
			return steps[i];
		}
	}
	return undefined;
}

function extractErrorName(step: AranStep): string {
	const first = step.values[0];
	if (typeof first === 'string' && first.endsWith('Error')) {
		return first;
	}
	return 'Error';
}

function extractErrorMessage(step: AranStep): string {
	if (step.values.length > 1) {
		const first = step.values[0];
		if (typeof first === 'string' && first.endsWith('Error')) {
			return step.values.slice(1).map(String).join(' ');
		}
	}
	return step.values.map(String).join(' ') || 'Unknown error';
}

// --- Loop iteration counting at raw-entry level ---

// WHY: 'check (while, truthy):' or 'check (for-of):' in logs[0]
const LOOP_CHECK_RE = /^check\s+\((while|for-of|do-while)/;

// WHY: detect loop condition checks in raw entries before postProcess
// runs. This lets us count iterations regardless of filter options.
function isLoopCheckEntry(entry: unknown): boolean {
	if (typeof entry !== 'object' || entry === null) return false;
	const raw = entry as Record<string, unknown>;
	if (raw.type !== 'groupStart') return false;
	const logs = raw.logs as readonly unknown[] | undefined;
	if (!logs || logs.length === 0) return false;
	const desc = logs[0];
	return typeof desc === 'string' && LOOP_CHECK_RE.test(desc);
}

// WHY: key by source location so each loop is counted independently
function loopLocationKey(entry: RawEntry): string {
	if (entry.loc === null) return 'unknown';
	return `${entry.loc.start.line}:${entry.loc.start.column}`;
}

export default createRecordGenerator;
