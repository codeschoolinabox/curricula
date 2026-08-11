/**
 * @file The factory — handle assembly, pump, termination machine,
 * timer, and call dispatch (DOCS.md § Architectural Sketch, execution
 * phases 1–5).
 *
 * Each run's state lives in ONE mutable record threaded through the
 * named phases below — the engine is the campaign's declared impurity
 * concentration point; the record (not scattered closures) is the
 * documented low-level exception to the no-mutable-state convention.
 * Every mutation of the record happens in this file; eslint sees them
 * via the file-level disable directly below this header.
 */

/* eslint-disable functional/immutable-data -- one run-state record per run is the engine's declared mutable core; every write is in this file */

import type {
	EngineError,
	EngineHandle,
	EngineResult,
	EngineSettlement,
	EvaluateSpec,
	HaltKind,
} from './types.js';
import createWorkerTransport from './worker/transport.js';
import type { CreateTransport, Transport } from './worker/types.js';

/**
 * The engine's entry point: spec in, lazy handle out.
 *
 * @param spec - The whole coupling surface (README.md § Public API):
 *   code, worker factory, clone-safe worker config, thread logic,
 *   seconds (default 5), strict (default true), execution axis
 *   (default 'function'), yield charge (default true).
 * @param createTransport - Engine-internal conformance seam: the
 *   transport factory the run will use. Defaults to the real worker
 *   transport; the engine's own conformance runners inject the fake.
 *   Consumers never pass it.
 * @returns The fully lazy handle — nothing runs until the first pull
 *   or `result` access; `result` always settles (the engine drains an
 *   unclaimed stream); breaking out of `for await` ≡ `cancel()`.
 */
export default function evaluate(
	spec: EvaluateSpec,
	createTransport: CreateTransport = createWorkerTransport,
): EngineHandle {
	const state = createRunState(spec, createTransport);
	return createHandle(state);
}

const STOP_SENTINEL: unique symbol = Symbol('engine-stop');
const DEFAULT_SECONDS = 5;
const YIELD_CHARGE_MS = 5;
const ENGINE_CALL_ERROR = 'EngineCallError';
const CALL_ERROR = 'call-error' as const;

// ─── Phase 1: lazy handle ─────────────────────────────────────────────────────

/** The single mutable record one run lives in. */
function createRunState(
	spec: EvaluateSpec,
	createTransport: CreateTransport,
): RunState {
	// Promise executors run synchronously, so both resolvers are
	// captured before the record below is built.
	let wakeStop: () => void = noop;
	let resolveResult: (result: EngineResult) => void = noop;
	const stopped = new Promise<void>(function captureStopWake(resolve) {
		wakeStop = resolve;
	});
	const resultPromise = new Promise<EngineResult>(
		function captureResultResolver(resolve) {
			resolveResult = resolve;
		},
	);

	return {
		spec,
		createTransport,
		phase: 'idle',
		stop: null,
		wakeStop,
		stopped,
		transport: null,
		budget: null,
		items: [],
		iteratorClaimed: false,
		pendingItem: null,
		hasPendingItem: false,
		wakePending: noop,
		pullWaiter: null,
		resolveResult,
		resultPromise,
		settled: null,
	};
}

/** Assembles the handle surface over the run state (runtime-enforced). */
function createHandle(state: RunState): EngineHandle {
	const handle = {};
	Object.defineProperty(handle, Symbol.asyncIterator, {
		value: function asyncIterator(): AsyncIterator<unknown> {
			// Creation claims the stream — an iterator created before any
			// engine pull owns it (README § Public API); the engine then
			// never drains. Claiming after settlement is harmless: pulls
			// just report done.
			state.iteratorClaimed = true;
			return {
				next: () => pullNext(state),
				return: () => exitIterator(state),
			};
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});
	Object.defineProperty(handle, 'result', {
		get: function getResult(): Promise<EngineResult> {
			startRun(state);
			return state.resultPromise;
		},
		configurable: false,
		enumerable: true,
	});
	Object.defineProperty(handle, 'cancel', {
		value: function cancel(): void {
			requestStop(state, { kind: 'cancel' });
		},
		writable: false,
		configurable: false,
		enumerable: true,
	});
	Object.defineProperty(handle, 'fail', {
		value: function fail(reason?: unknown): void {
			requestStop(state, { kind: 'fail', reason });
		},
		writable: false,
		configurable: false,
		enumerable: true,
	});
	return handle as EngineHandle;
}

// ─── Phase 2: sandbox start ───────────────────────────────────────────────────

/**
 * Starts the run on the first pull or result access; later calls are
 * no-ops. A run that was stopped while idle settles without ever
 * spawning (the pre-start short-circuit).
 */
function startRun(state: RunState): void {
	if (state.phase !== 'idle') {
		return;
	}
	if (state.stop !== null) {
		settle(state);
		return;
	}

	state.phase = 'running';
	const transport = state.createTransport();
	state.transport = transport;
	state.budget = createBudget(
		state.spec.seconds ?? DEFAULT_SECONDS,
		state.spec.yieldCharge ?? true,
		function onExhausted() {
			requestStop(state, { kind: 'timeout' });
		},
		function hasPendingEvent() {
			return transport.hasPendingEvent();
		},
	);

	void runToSettlement(state, transport);
}

/** Drives one run: deliver, pump, settle — teardown on every path. */
async function runToSettlement(
	state: RunState,
	transport: Transport,
): Promise<void> {
	try {
		await transport.start({
			code: state.spec.code,
			workerFactory: state.spec.workerFactory,
			workerConfig: state.spec.workerConfig,
			strict: state.spec.strict ?? true,
			execution: state.spec.execution ?? 'function',
		});
		state.budget?.resume();
		await pump(state, transport);
	} catch (error) {
		// Transports and hooks surface failures as events/stops; anything
		// reaching here is an engine defect — settle loudly, never hang.
		requestStop(state, {
			kind: 'worker-error',
			name: 'EngineInternalError',
			message: describeError(error),
		});
	}
	settle(state);
}

// ─── Phase 3: streaming (pump · call dispatch) ────────────────────────────────

/**
 * The thread-side message loop: receives worker events FIFO, runs the
 * message hook (drop or yield), services calls, and funnels every stop
 * into the termination machine.
 */
async function pump(state: RunState, transport: Transport): Promise<void> {
	for (;;) {
		const event = await raceStop(state, transport.next());
		if (state.stop !== null || event === STOP_SENTINEL) {
			return;
		}

		if (event.kind === 'message') {
			const delivered = await deliverMessage(state, transport, event.message);
			if (!delivered) {
				return;
			}
			continue;
		}
		if (event.kind === 'call') {
			await dispatchCall(state, transport, event.request);
			if (state.stop !== null) {
				return;
			}
			continue;
		}
		if (event.kind === 'halt') {
			requestStop(state, {
				kind: 'halt',
				haltKind: event.haltKind,
				payload: event.payload,
			});
			return;
		}
		requestStop(state, {
			kind: 'worker-error',
			name: event.name,
			message: event.message,
		});
		return;
	}
}

/**
 * Runs the message hook and either drops (immediate resume, budget
 * untouched) or yields (freeze, charge, wait for the pull, resume on
 * pull). Returns false when the run stopped during the yield-wait —
 * teardown-without-resume: a stopping run never releases the pause.
 */
async function deliverMessage(
	state: RunState,
	transport: Transport,
	message: unknown,
): Promise<boolean> {
	let item: unknown;
	try {
		item = state.spec.threadLogic.onMessage(message);
	} catch (error) {
		requestStop(state, {
			kind: 'hook-error',
			name: 'EngineHookError',
			message: `onMessage threw: ${describeError(error)}`,
		});
		return false;
	}

	if (item === undefined) {
		transport.resume();
		return true;
	}

	Object.freeze(item);
	state.budget?.pauseForYield();
	await waitForPull(state, item);
	if (state.stop !== null) {
		return false;
	}
	transport.resume();
	state.budget?.resume();
	return true;
}

/**
 * Hands one yielded item to whoever pulls. With no consumer iterator
 * in existence, the ENGINE pulls on the consumer's behalf — the drain,
 * engaged at this first on-behalf pull, never at result access. With a
 * claimed stream, the item parks until the consumer's next() (full
 * backpressure) — or until a stop wakes the wait unconditionally.
 */
async function waitForPull(state: RunState, item: unknown): Promise<void> {
	if (!state.iteratorClaimed) {
		state.items.push(item);
		return;
	}
	if (state.pullWaiter !== null) {
		const waiter = state.pullWaiter;
		state.pullWaiter = null;
		state.items.push(item);
		waiter({ value: item, done: false });
		return;
	}
	// WHY no interleave hazard: JS is single-threaded and there is no
	// await between the pullWaiter check above and the park below — the
	// waiter-present and park paths are mutually exclusive.
	state.pendingItem = item;
	state.hasPendingItem = true;
	await raceStop(
		state,
		new Promise<void>(function capturePendingWake(resolve) {
			state.wakePending = resolve;
		}),
	);
}

/**
 * Services one synchronous worker round-trip. Uninterruptible: the
 * hook is always awaited; when a stop won meanwhile the response is
 * DISCARDED (no shared-memory write-back) and the worker dies blocked.
 * The budget pauses while the hook runs — without the yield charge.
 */
async function dispatchCall(
	state: RunState,
	transport: Transport,
	request: unknown,
): Promise<void> {
	const { onCall } = state.spec.threadLogic;
	if (onCall === undefined) {
		requestStop(state, {
			kind: CALL_ERROR,
			name: ENGINE_CALL_ERROR,
			message: 'the worker called while onCall is absent',
		});
		return;
	}

	state.budget?.pauseForCall();
	let response;
	try {
		response = await onCall(request);
	} catch (error) {
		requestStop(state, {
			kind: CALL_ERROR,
			name: ENGINE_CALL_ERROR,
			message: `onCall threw: ${describeError(error)}`,
		});
		return;
	}
	if (state.stop !== null) {
		return;
	}
	try {
		transport.respond(response);
	} catch (error) {
		// A response the channel cannot carry (the payload ceiling) is a
		// round-trip that could not be serviced — README § How a run ends.
		requestStop(state, {
			kind: CALL_ERROR,
			name: ENGINE_CALL_ERROR,
			message: `the response could not be written: ${describeError(error)}`,
		});
		return;
	}
	state.budget?.resume();
}

// ─── Phase 4: stop (first writer wins) ────────────────────────────────────────

/**
 * The single first-write-wins write point: the halt and every
 * termination cause claim the same slot; later stops — including any
 * after settlement — are no-ops. A stop wakes any pending pump wait
 * unconditionally and settles immediately when no run ever started.
 */
function requestStop(state: RunState, cause: StopCause): void {
	if (state.stop !== null) {
		return;
	}
	state.stop = cause;
	state.wakeStop();
	state.wakePending();
	if (state.phase === 'idle') {
		settle(state);
	}
}

// ─── Phase 5: settlement ──────────────────────────────────────────────────────

/**
 * Classifies the stop into the settlement (structured data only —
 * payloads stay opaque), runs the refinement hook on errored halts,
 * freezes the engine's own structures, resolves `result`, and tears
 * the sandbox down — on every path. Idempotent.
 */
function settle(state: RunState): void {
	if (state.phase === 'settled' || state.stop === null) {
		return;
	}
	state.phase = 'settled';

	const durationMs = state.budget?.stop() ?? 0;
	const settlement = Object.freeze(classifyStop(state, state.stop, durationMs));
	Object.freeze(state.items);
	const result: EngineResult = Object.freeze({
		items: state.items,
		settlement,
	});
	state.settled = result;
	state.resolveResult(result);

	if (state.pullWaiter !== null) {
		const waiter = state.pullWaiter;
		state.pullWaiter = null;
		waiter({ value: undefined, done: true });
	}
	state.transport?.terminate();
}

/** Maps one stop cause onto the public outcome vocabulary. */
function classifyStop(
	state: RunState,
	stop: StopCause,
	durationMs: number,
): EngineSettlement {
	if (stop.kind === 'halt' && stop.haltKind === 'natural-end') {
		return { outcome: 'completed', halt: stop.payload, durationMs };
	}
	if (stop.kind === 'halt') {
		return classifyErroredHalt(state, stop.payload, durationMs);
	}
	if (stop.kind === 'cancel') {
		return { outcome: 'cancelled', durationMs };
	}
	if (stop.kind === 'fail') {
		return { outcome: 'failed', failReason: stop.reason, durationMs };
	}
	if (stop.kind === 'timeout') {
		const seconds = state.spec.seconds ?? DEFAULT_SECONDS;
		return {
			outcome: 'timed-out',
			error: {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: `the time budget of ${seconds} seconds is exhausted`,
			},
			durationMs,
		};
	}
	return {
		outcome: 'errored',
		error: {
			cause: stop.kind,
			name: stop.name,
			message: stop.message,
		},
		durationMs,
	};
}

/**
 * An errored halt carries the worker-authored payload and, when the
 * refinement hook produces one, the opaque refinement. A throwing
 * refiner is the one corner where halt and engine error coexist: the
 * halt stays, the refinement is absent.
 */
function classifyErroredHalt(
	state: RunState,
	payload: unknown,
	durationMs: number,
): EngineSettlement {
	const { refineError } = state.spec.threadLogic;
	if (refineError === undefined) {
		return { outcome: 'errored', halt: payload, durationMs };
	}

	let refinement: unknown;
	try {
		refinement = refineError(payload);
	} catch (error) {
		return {
			outcome: 'errored',
			halt: payload,
			error: {
				cause: 'hook-error',
				name: 'EngineHookError',
				message: `refineError threw: ${describeError(error)}`,
			},
			durationMs,
		};
	}

	if (refinement === undefined) {
		return { outcome: 'errored', halt: payload, durationMs };
	}
	return { outcome: 'errored', halt: payload, refinement, durationMs };
}

// ─── Stream (consumer iterator) ───────────────────────────────────────────────

/** One consumer pull: starts the run, takes a parked item, or waits. */
function pullNext(state: RunState): Promise<IteratorResult<unknown>> {
	startRun(state);
	if (state.settled !== null) {
		return Promise.resolve({ value: undefined, done: true });
	}
	if (state.hasPendingItem) {
		const item = state.pendingItem;
		state.pendingItem = null;
		state.hasPendingItem = false;
		state.items.push(item);
		state.wakePending();
		return Promise.resolve({ value: item, done: false });
	}
	return new Promise(function capturePullWaiter(resolve) {
		state.pullWaiter = resolve;
	});
}

/**
 * Breaking out of `for await` lands here and IS cancel: the early
 * exit routes through the termination machine, the run settles
 * 'cancelled', and items already yielded remain valid.
 */
async function exitIterator(state: RunState): Promise<IteratorResult<unknown>> {
	requestStop(state, { kind: 'cancel' });
	await state.resultPromise;
	return { value: undefined, done: true };
}

// ─── Timer ────────────────────────────────────────────────────────────────────

/**
 * The time budget: counts only while the worker is unblocked. The
 * timer handler deducts elapsed budget BEFORE consulting the
 * event-ready flag, and reschedules only with positive remaining
 * budget — a paused program with a pending message is rescheduled, an
 * exhausted budget times out even then. The flat yield charge attaches
 * per YIELD (never per drop, never per call service), and `charged`
 * false waives THAT FEE ALONE: the pause itself is unconditional, so a
 * waived run still stops its clock for every yield-wait and every
 * serviced call.
 */
function createBudget(
	seconds: number,
	charged: boolean,
	onExhausted: () => void,
	hasPendingEvent: () => boolean,
): Budget {
	const maxMs = seconds * 1000;
	const clock: BudgetClock = {
		remainingMs: maxMs,
		lastResumeTime: 0,
		timeout: null,
	};

	function arm(): void {
		if (!Number.isFinite(clock.remainingMs)) {
			return;
		}
		if (clock.remainingMs <= 0) {
			onExhausted();
			return;
		}
		clock.lastResumeTime = performance.now();
		clock.timeout = setTimeout(function onTimeout() {
			clock.timeout = null;
			deductElapsed();
			if (hasPendingEvent() && clock.remainingMs > 0) {
				arm();
				return;
			}
			onExhausted();
		}, clock.remainingMs);
	}

	function deductElapsed(): void {
		clock.remainingMs -= performance.now() - clock.lastResumeTime;
		if (clock.remainingMs < 0) {
			clock.remainingMs = 0;
		}
	}

	function disarm(): void {
		if (clock.timeout !== null) {
			clearTimeout(clock.timeout);
			clock.timeout = null;
			deductElapsed();
		}
	}

	return Object.freeze({
		resume: arm,
		pauseForYield(): void {
			disarm();
			if (!charged) {
				return;
			}
			clock.remainingMs -= YIELD_CHARGE_MS;
			if (clock.remainingMs < 0) {
				clock.remainingMs = 0;
			}
		},
		pauseForCall: disarm,
		stop(): number {
			disarm();
			return Number.isFinite(maxMs) ? maxMs - clock.remainingMs : 0;
		},
	});
}

// ─── Shared plumbing ──────────────────────────────────────────────────────────

/** Races any pump wait against the stop signal — the unconditional wake. */
function raceStop<T>(
	state: RunState,
	pending: Promise<T>,
): Promise<Awaited<T> | typeof STOP_SENTINEL> {
	return Promise.race([
		pending,
		state.stopped.then((): typeof STOP_SENTINEL => STOP_SENTINEL),
	]);
}

function describeError(error: unknown): string {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}

function noop(): void {}

// ─── Run-state types ──────────────────────────────────────────────────────────

type StopCause =
	| {
			readonly kind: 'halt';
			readonly haltKind: HaltKind;
			readonly payload: unknown;
	  }
	| { readonly kind: 'cancel' }
	| { readonly kind: 'fail'; readonly reason: unknown }
	| { readonly kind: 'timeout' }
	| WorkerSideError;

type WorkerSideError = {
	readonly kind: Extract<
		EngineError['cause'],
		'worker-error' | 'call-error' | 'hook-error'
	>;
	readonly name: string;
	readonly message: string;
};

type RunState = {
	readonly spec: EvaluateSpec;
	readonly createTransport: CreateTransport;
	phase: 'idle' | 'running' | 'settled';
	stop: StopCause | null;
	wakeStop: () => void;
	stopped: Promise<void>;
	transport: Transport | null;
	budget: Budget | null;
	items: unknown[];
	iteratorClaimed: boolean;
	pendingItem: unknown;
	hasPendingItem: boolean;
	wakePending: () => void;
	pullWaiter: ((result: IteratorResult<unknown>) => void) | null;
	resolveResult: (result: EngineResult) => void;
	resultPromise: Promise<EngineResult>;
	settled: EngineResult | null;
};

type Budget = {
	readonly resume: () => void;
	readonly pauseForYield: () => void;
	readonly pauseForCall: () => void;
	readonly stop: () => number;
};

type BudgetClock = {
	remainingMs: number;
	lastResumeTime: number;
	timeout: ReturnType<typeof setTimeout> | null;
};
