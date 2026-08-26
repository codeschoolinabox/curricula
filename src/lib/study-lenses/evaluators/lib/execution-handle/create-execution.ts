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
 * Phase 1 in flight: this body carries the Install slice only — extras
 * built over controls, frozen last. Ignition, drive, settle, and
 * teardown land with the remaining X1 increments against the
 * committed-skipped suite in tests/.
 */

import type {
	BuildExtras,
	ResultOnlySource,
	SourceControls,
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
export default function createExecution<
	TEvent,
	TResult,
	TExtras extends object = Record<never, never>,
>(
	_source: StreamingSource<TEvent, TResult> | ResultOnlySource<TResult>,
	buildExtras?: BuildExtras<TExtras>,
): WidenedExecution<TEvent, TResult, TExtras> {
	// ─── Phase 1: Install (sync, inert) ──────────────────────────────────
	const controls: SourceControls = {
		cancel: function cancel(): void {},
	};
	const extrasDescriptors =
		buildExtras === undefined
			? {}
			: Object.getOwnPropertyDescriptors(buildExtras(controls));
	const handle = Object.create(Object.prototype, extrasDescriptors) as object;
	return Object.freeze(handle) as WidenedExecution<TEvent, TResult, TExtras>;
}
