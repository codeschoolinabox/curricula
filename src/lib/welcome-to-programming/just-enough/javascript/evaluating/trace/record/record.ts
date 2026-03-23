/**
 * @file RecordFunction — instrument + execute code, return filtered steps.
 *
 * Called by @study-lenses/tracing after config validation and option merging.
 *
 * Contract:
 *   - Receives frozen `config.meta` (execution limits) and `config.options` (tracer options)
 *   - Returns a Promise of readonly steps (1-indexed, conforming to StepCore)
 *   - Never throws — errors are captured as trace entries
 *
 * @remarks
 * Delegates tracing to a disposable Web Worker (trace-worker.ts) which runs
 * the legacy Aran tracer with all config flags enabled (capture-all).
 * CAPTURE_ALL is hardcoded in the worker — no config passing needed.
 * postProcess and filterSteps run on the main thread after the worker completes.
 */

import type { MetaConfig } from '@study-lenses/tracing';

import filterSteps from './filter-steps.js';
import postProcess from './post-process.js';
import traceInWorker from './trace.js';
import type { AranFilterOptions, AranStep, RawEntry } from './types.js';

// ---------------------------------------------------------------------------
// record
// ---------------------------------------------------------------------------

async function record(
	code: string,
	config?: { readonly meta: MetaConfig; readonly options: AranFilterOptions },
): Promise<readonly AranStep[]> {
	const options = config?.options ?? {};
	const maxMs = config?.meta?.max?.time ?? null;

	// 1. Trace in worker (entries streamed per-step, partial on timeout)
	const rawEntries = await traceInWorker(code, maxMs);

	// 2. Transform raw entries into structured AranStep[]
	// WHY cast: worker sends untyped data across postMessage boundary;
	// postProcess expects (string | RawEntry)[] which is the runtime shape.
	const steps = postProcess(rawEntries as readonly (string | RawEntry)[]);

	// 3. Filter based on user options
	return filterSteps(steps, options);
}

export default record;
