/**
 * The one factory (human ruling 2026-08-18): wraps an evaluator-supplied
 * source into the kind's handle, building the consumption laws once —
 * inert creation, the closed-touch ignition through a start latch that
 * closes before `start` runs, one internal drainer behind every batch
 * ignition, the memoized settle that IS the source's `result`
 * (defect-routed), idempotent out-of-band cancel with a teardown latch
 * that pre-empts the start latch, one-shot streaming, and
 * settle-ends-consumption (guaranteed library-side; best-effort source
 * disposal, never awaited). README.md § The laws carries each law with
 * its pin; DOCS.md carries the sketch.
 *
 * Phase 0 stub: the signature is the contract this unit locks; the body
 * lands at Phase 1 (the X1 increment, W4a). The behavioral suite in
 * tests/ is committed skipped against exactly this surface.
 */

import type {
	BuildExtras,
	ResultOnlySource,
	StreamingSource,
	WidenedExecution,
	WidenedExecutionBase,
} from './types.js';

export default function createExecution<
	TEvent,
	TResult,
	TExtras extends object = Record<never, never>,
>(
	source: StreamingSource<TEvent, TResult>,
	buildExtras?: BuildExtras<TExtras>,
): WidenedExecution<TEvent, TResult, TExtras>;
export default function createExecution<
	TResult,
	TExtras extends object = Record<never, never>,
>(
	source: ResultOnlySource<TResult>,
	buildExtras?: BuildExtras<TExtras>,
): WidenedExecutionBase<TResult, TExtras>;
export default function createExecution(): never {
	throw new Error('not implemented — Phase 1 (X1, W4a) un-skips the suite');
}
