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
 * frozen last), Ignite through one start latch (both batch doors and
 * the consumer iterator's first pull, each fixing the mode), the batch
 * Drive path (the drainer, exhaustion-only exit), and the iterate
 * Drive path (the memoized consumer iterator forwarding the source's
 * events). Cancel/teardown, settle-race, and defect routes land with
 * the remaining X1 increments against the committed-skipped suite in
 * tests/.
 */

import type {
	BuildExtras,
	ExecutionMode,
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
	const state: HandleState<TEvent, TResult> = {
		source,
		settle: null,
		mode: null,
		iterator: null,
	};
	// Library descriptors merge AFTER extras, so the library's members win
	// at runtime even against a type-evading index-signature builder.
	const descriptors: PropertyDescriptorMap = {
		...extrasDescriptors,
		...streamingIteratorDescriptor(state),
		result: {
			get: function getResult(): Promise<TResult> {
				return ignite(state, 'batch');
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
				return ignite(state, 'batch').then(onFulfilled, onRejected);
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
 * The one ignition gate every touch routes through: closes the start
 * latch (the settle assignment, BEFORE `start` runs), fixes the mode
 * for the handle's life, tells the source the engaged mode, and — on a
 * batch ignition of a streaming source only — engages the drainer.
 * Later touches of either kind answer the already-latched settle.
 */
function ignite<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
	mode: ExecutionMode,
): Promise<TResult> {
	if (state.settle === null) {
		// eslint-disable-next-line functional/immutable-data -- the start latch is the handle's one mutable cell (engine RunState precedent; sanctioned in this cluster's ar-3 consultation)
		state.settle = state.source.result;
		// eslint-disable-next-line functional/immutable-data -- the mode latch rides the same state record (fixed at ignition, human ruling 2026-08-18)
		state.mode = mode;
		state.source.start(mode);
		if (mode === 'batch' && state.source.events !== undefined) {
			// Deliberate gap until the defect-routes increment: a rejecting
			// pull is an unhandled rejection here — as is a settle rejection
			// on a pure-iterate consumption that never touches .result; the
			// source-defect routing lands with its committed-skipped rows.
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

// ─── Phase 3: Drive (async) — the iterate path ────────────────────────────────

/**
 * The streaming handle's self-iteration seam: a non-enumerable
 * `Symbol.asyncIterator` answering ONE memoized consumer iterator for
 * the handle's life (ruled 2026-08-19), so a second call can never
 * split the stream. A result-only source installs nothing — its handle
 * is `ExecutionBase`, not `AsyncIterable`.
 *
 * Phase-1 transient, named: until the mode-latch increments land, an
 * iterator taken after a batch ignition forwards the same events seam
 * the drainer is pulling — the after-batch-ended law arrives with its
 * committed-skipped rows.
 */
function streamingIteratorDescriptor<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
): PropertyDescriptorMap {
	const { events } = state.source;
	if (events === undefined) {
		return {};
	}
	return {
		[Symbol.asyncIterator]: {
			value: function getAsyncIterator(): AsyncIterator<TEvent> {
				if (state.iterator === null) {
					// eslint-disable-next-line functional/immutable-data -- the memoized consumer iterator is the state record's second latch cell (same sanction as the settle field)
					state.iterator = createConsumerIterator(state, events);
				}
				return state.iterator;
			},
			enumerable: false,
			configurable: false,
			writable: false,
		},
	};
}

/**
 * The consumer-driven pull loop: the first pull is the ignition touch
 * (mode `'iterate'`); every pull forwards the source's own `events`
 * seam, so the consumer's pace IS the run's pace and the drainer never
 * engages. Under a latched `'batch'` mode the iterator is already
 * ended — it answers done without touching the source, because the
 * drainer owns the seam (the mode latch, ruled 2026-08-18).
 */
function createConsumerIterator<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
	events: AsyncIterator<TEvent>,
): AsyncIterator<TEvent> {
	return {
		next(): Promise<IteratorResult<TEvent>> {
			if (state.mode === 'batch') {
				return Promise.resolve({ value: undefined, done: true });
			}
			void ignite(state, 'iterate');
			return events.next();
		},
	};
}

/**
 * The handle's internal state: the settle field IS the start latch;
 * the mode field is the mode latch, fixed at ignition for the
 * handle's life; the iterator field memoizes the one consumer
 * iterator a streaming handle ever answers.
 */
type HandleState<TEvent, TResult> = {
	readonly source: StreamingSource<TEvent, TResult> | ResultOnlySource<TResult>;
	settle: Promise<TResult> | null;
	mode: ExecutionMode | null;
	iterator: AsyncIterator<TEvent> | null;
};
