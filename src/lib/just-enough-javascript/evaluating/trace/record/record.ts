/**
 * @file RecordFunction — instrument + execute code, return filtered steps.
 *
 * Called by @study-lenses/tracing after config validation and option merging.
 *
 * Contract:
 *   - Receives frozen `config.meta` (execution limits) and `config.options` (tracer options)
 *   - Returns a Promise of readonly steps (1-indexed, conforming to StepCore)
 *   - Throws ParseError | RuntimeError | LimitExceededError on failure
 *
 * @remarks
 * Traces with all config flags enabled (capture-all), then filters post-hoc
 * based on user options. Console and blockScope are always-on pre-trace flags
 * because they produce side effects that can't be undone after execution.
 */

import type { MetaConfig } from '@study-lenses/tracing';

import filterSteps from './filter-steps.js';
// @ts-expect-error — untyped vendored legacy JS library
import { config as legacyConfig } from './legacy-aran-trace/data/config.js';
// @ts-expect-error — untyped vendored legacy JS library
import trace from './legacy-aran-trace/index.js';
import postProcess from './post-process.js';
import type { AranFilterOptions, AranStep } from './types.js';

// ---------------------------------------------------------------------------
// Capture-all override — forces legacy config to trace everything
// ---------------------------------------------------------------------------

// why: the legacy tracer uses a mutable singleton config that controls what
// gets instrumented (pointcut.js) and what gets emitted (advice modules).
// We override it to capture everything, then filter post-hoc.
// Console and blockScope are always true because they produce side effects
// (console.log execution, indentation state) that can't be reversed.
const CAPTURE_ALL = {
	variablesList: [],
	variablesDeclare: true,
	variablesAssign: true,
	variablesRead: true,
	operatorsList: [],
	operators: true,
	controlFlowList: [],
	controlFlow: true,
	functionsList: [],
	functions: true,
	functionDeclarations: true,
	this: true,
	errorHandling: true,
	blockScope: true,
	range: { start: 1, end: 100_000 },
	lines: true,
	steps: true,
	console: true,
	isInRange: true,
	failure: true,
} as const;

// ---------------------------------------------------------------------------
// record
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/require-await
async function record(
	code: string,
	config?: { readonly meta: MetaConfig; readonly options: AranFilterOptions },
): Promise<readonly AranStep[]> {
	const options = config?.options ?? {};

	// 1. Save original config and apply capture-all
	const savedConfig = { ...legacyConfig };
	Object.assign(legacyConfig, CAPTURE_ALL);

	try {
		// 2. Trace with maximum capture
		const rawEntries = trace(code);

		// 3. Transform raw entries into structured AranStep[]
		const steps = postProcess(rawEntries);

		// 4. Filter based on user options
		return filterSteps(steps, options);
	} finally {
		// 5. Restore original config
		Object.assign(legacyConfig, savedConfig);
	}
}

export default record;
