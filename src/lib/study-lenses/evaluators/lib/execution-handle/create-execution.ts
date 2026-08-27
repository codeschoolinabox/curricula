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
 * the consumer iterator's first pull, each fixing the mode), both
 * Drive paths (the drainer racing the settle against each pull; the
 * memoized consumer iterator forwarding the source's events behind a
 * one-microtask settled re-check), Settle ending consumption (drainer
 * stand-down, live-iterator end, best-effort source disposal), and
 * Teardown's cancel routes (inert-cancel settle; post-ignition
 * `stop()` at most once, never queued behind a pending pull;
 * post-settlement and repeat cancels inert on the source; break
 * resolving only after the settle). The defect routes land with the
 * last X1 increment against the committed-skipped suite in tests/.
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
	const state: HandleState<TEvent, TResult> = {
		source,
		settle: null,
		mode: null,
		iterator: null,
		settled: false,
		stopped: false,
	};
	const controls: SourceControls = {
		cancel: function cancel(): void {
			void cancelExecution(state);
		},
	};
	const extrasDescriptors =
		buildExtras === undefined
			? {}
			: Object.getOwnPropertyDescriptors(buildExtras(controls));
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
		cancel: {
			value: controls.cancel,
			enumerable: false,
			configurable: false,
			writable: false,
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
		void state.settle.then(
			function markSettled() {
				// eslint-disable-next-line functional/immutable-data -- the settled flag closes the same sanctioned state record; post-settlement cancels read it to stay inert on the source
				state.settled = true;
				attemptSourceDisposal(state.source.events);
			},
			function ignoreUntilDefectRouting() {},
		);
		state.source.start(mode);
		if (mode === 'batch' && state.source.events !== undefined) {
			// Deliberate gap until the defect-routes increment: a rejecting
			// pull is an unhandled rejection here — as is a settle rejection
			// on a pure-iterate consumption that never touches .result; the
			// source-defect routing lands with its committed-skipped rows.
			void drainUntilSettleOrExhaustion(state.settle, state.source.events);
		}
	}
	return state.settle;
}

// ─── Phase 3: Drive (async) — the internal drainer ────────────────────────────

/**
 * The library's one batch loop: pull to relieve backpressure, discard
 * delivered items (the result's own record is the evaluator's), exit
 * on events-exhaustion OR the settle, whichever comes first — each
 * pull races the settle, so a mid-drain settle stands the drainer
 * down with no further pulls owed, even while a pull is suspended.
 */
async function drainUntilSettleOrExhaustion<TResult>(
	settle: Promise<TResult>,
	events: AsyncIterator<unknown>,
): Promise<void> {
	const settleEndsTheDrain = settle.then(toEndStep, toEndStep);
	for (;;) {
		const step = await Promise.race([settleEndsTheDrain, events.next()]);
		if (step.done === true) {
			return;
		}
	}
}

function toEndStep(): IteratorResult<unknown> {
	return { value: undefined, done: true };
}

// ─── Phase 3: Drive (async) — the iterate path ────────────────────────────────

/**
 * The streaming handle's self-iteration seam: a non-enumerable
 * `Symbol.asyncIterator` answering ONE memoized consumer iterator for
 * the handle's life (ruled 2026-08-19), so a second call can never
 * split the stream. A result-only source installs nothing — its handle
 * is `ExecutionBase`, not `AsyncIterable`.
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
 * drainer owns the seam (the mode latch, ruled 2026-08-18). Every pull
 * defers one microtask before touching the seam and re-checks the
 * teardown latch there: settlement is observable one microtask after
 * `result` resolves (the seam's settled-lag window, README § The
 * laws), so the deferral is what lets a settle landed in the
 * consumer's own turn end the iterator without another pull.
 */
function createConsumerIterator<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
	events: AsyncIterator<TEvent>,
): AsyncIterator<TEvent> {
	return {
		next(): Promise<IteratorResult<TEvent>> {
			const torndown =
				state.stopped || (state.mode !== 'iterate' && state.settle !== null);
			if (torndown) {
				return Promise.resolve({ value: undefined, done: true });
			}
			void ignite(state, 'iterate');
			return Promise.resolve().then(function pullUnlessSettled():
				| Promise<IteratorResult<TEvent>>
				| IteratorResult<TEvent> {
				if (state.settled || state.stopped) {
					return { value: undefined, done: true };
				}
				return events.next();
			});
		},
		return(): Promise<IteratorResult<TEvent>> {
			return cancelExecution(state).then(
				function endAfterSettle(): IteratorResult<TEvent> {
					return { value: undefined, done: true };
				},
			);
		},
	};
}

// ─── Phase 4: Settle — settle ends consumption ────────────────────────────────

/**
 * The best-effort half of settle-ends-consumption: disposal of the
 * source's events iterator is ATTEMPTED once on the settle
 * (`events.return?.()`), never awaited, a synchronous throw and an
 * async rejection both swallowed — a suspended source's cleanup is its
 * own liveness obligation (README § The laws). A result-only source
 * has nothing to dispose.
 */
function attemptSourceDisposal(
	events: AsyncIterator<unknown> | undefined,
): void {
	if (events === undefined) {
		return;
	}
	try {
		void events
			.return?.()
			?.then(undefined, function swallowDisposalRejection() {});
	} catch {
		// Disposal is offered, never relied on — a throwing return() is the
		// source's own defect and never reaches the already-fixed settle.
	}
}

// ─── Phase 5: Teardown (sync, out of band) ────────────────────────────────────

/**
 * The consumer's out-of-band stop, one door for the handle's `cancel`
 * member, the builder's `controls.cancel`, and the consumer
 * iterator's break alike; it answers the settle so break can resolve
 * only AFTER it. Before ignition it closes the teardown latch by
 * settling the inert-cancel result — the settle field is the start
 * latch, so a later touch can never open it and nothing is ever
 * called on the source (nothing started, nothing to stop). After
 * ignition it calls `stop()` AT MOST ONCE, synchronously — never
 * queued behind a pending pull (pins run:140, intercept:292) — and
 * only while unsettled: a cancel after settlement is inert on the
 * source, whose cleanup rides its own settle path.
 */
function cancelExecution<TEvent, TResult>(
	state: HandleState<TEvent, TResult>,
): Promise<TResult> {
	if (state.settle === null) {
		// eslint-disable-next-line functional/immutable-data -- the teardown latch closes through the same sanctioned state record as ignition
		state.settle = Promise.resolve(state.source.inertCancelResult());
	} else if (state.mode !== null && !state.settled && !state.stopped) {
		// eslint-disable-next-line functional/immutable-data -- the stop-once latch rides the same sanctioned state record
		state.stopped = true;
		state.source.stop();
	}
	return state.settle;
}

/**
 * The handle's internal state: the settle field IS the start latch;
 * the mode field is the mode latch, fixed at ignition for the
 * handle's life; the iterator field memoizes the one consumer
 * iterator a streaming handle ever answers; the settled and stopped
 * flags are the teardown latch's two cells — settled makes a late
 * cancel inert on the source, stopped makes `stop()` once-only and
 * every later consumer pull inert.
 */
type HandleState<TEvent, TResult> = {
	readonly source: StreamingSource<TEvent, TResult> | ResultOnlySource<TResult>;
	settle: Promise<TResult> | null;
	mode: ExecutionMode | null;
	iterator: AsyncIterator<TEvent> | null;
	settled: boolean;
	stopped: boolean;
};
