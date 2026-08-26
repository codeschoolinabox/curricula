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
 * Phase 1 in flight: this body carries Install (extras over controls,
 * frozen last), the batch half of Ignite (both batch doors through one
 * start latch), and the batch Drive path (the drainer, exhaustion-only
 * exit). The iterate path, memoized-settle identity, mode latch,
 * cancel/teardown, settle-race, and defect routes land with the
 * remaining X1 increments against the committed-skipped suite in
 * tests/.
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
	source: StreamingSource<TEvent, TResult> | ResultOnlySource<TResult>,
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
	const state: HandleState<TEvent, TResult> = { source, settle: null };
	// Library descriptors merge AFTER extras, so the library's members win
	// at runtime even against a type-evading index-signature builder.
	const descriptors: PropertyDescriptorMap = {
		...extrasDescriptors,
		result: {
			get: function getResult(): Promise<TResult> {
				return igniteBatch(state);
			},
			enumerable: true,
			configurable: false,
		},
		// eslint-disable-next-line unicorn/no-thenable -- the handle IS the kind's PromiseLike (region types.ts, ExecutionBase); await/.then is the contract, not an accident
		then: {
			value: function then<TOk, TFail>(
				onFulfilled?: ((value: TResult) => TOk | PromiseLike<TOk>) | null,
				onRejected?: ((reason: unknown) => TFail | PromiseLike<TFail>) | null,
			): Promise<TOk | TFail> {
				return igniteBatch(state).then(onFulfilled, onRejected);
			},
			enumerable: false,
			configurable: false,
			writable: false,
		},
	};
	const handle = Object.create(Object.prototype, descriptors) as object;
	return Object.freeze(handle) as WidenedExecution<TEvent, TResult, TExtras>;
}

// ─── Phase 2: Ignite (sync latch) ─────────────────────────────────────────────

/**
 * The batch ignition touch: closes the start latch (the settle
 * assignment, BEFORE `start` runs), tells the source the engaged mode,
 * and engages the drainer behind a streaming source. Later batch
 * touches answer the already-latched settle.
 */
function igniteBatch<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
): Promise<TResult> {
	if (state.settle === null) {
		// eslint-disable-next-line functional/immutable-data -- the start latch is the handle's one mutable cell (engine RunState precedent; sanctioned in this cluster's ar-3 consultation)
		state.settle = state.source.result;
		state.source.start('batch');
		if (state.source.events !== undefined) {
			// Deliberate gap until the defect-routes increment: a rejecting
			// pull is an unhandled rejection here; the source-defect routing
			// lands with its committed-skipped rows.
			void drainToExhaustion(state.source.events);
		}
	}
	return state.settle;
}

// ─── Phase 3: Drive (async) — the internal drainer ────────────────────────────

/**
 * The library's one batch loop: pull to relieve backpressure, discard
 * delivered items (the result's own record is the evaluator's), exit
 * on events-exhaustion.
 */
async function drainToExhaustion(
	events: AsyncIterator<unknown>,
): Promise<void> {
	for (;;) {
		const step = await events.next();
		if (step.done === true) {
			return;
		}
	}
}

/** The handle's internal state: the settle field IS the start latch. */
type HandleState<TEvent, TResult> = {
	readonly source: StreamingSource<TEvent, TResult> | ResultOnlySource<TResult>;
	settle: Promise<TResult> | null;
};
