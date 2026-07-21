/**
 * @file The real transport: spawns a module worker, completes the
 * ready handshake, delivers setup + code, and feeds worker events to
 * the pump in post order over postMessage + shared memory.
 *
 * This is the production side of the engine's transport seam — the
 * engine-shipped fake (testing/fake-transport.ts) substitutes a
 * same-thread double behind the same contract. Transport instance
 * state (worker, views, event queue) is per-run mutable state, the
 * engine's declared impurity; every write is in this file (see the
 * file-level disable below).
 */

/* eslint-disable functional/immutable-data -- per-run transport state record; every write is in this file */

import type { CallResponse } from '../types.js';

import clearEventReady from './clear-event-ready.js';
import createBufferViews from './create-buffer-views.js';
import PROTOCOL from './protocol.js';
import type {
	BufferViews,
	FromWorkerMessage,
	Transport,
	TransportEvent,
	TransportInit,
} from './types.js';
import writeCallResponse from './write-call-response.js';
import writeResumeSignal from './write-resume-signal.js';

/**
 * Creates the worker-backed transport for one run.
 *
 * @remarks Environment failures — SharedArrayBuffer unavailable
 * (COOP/COEP not served), worker construction failure, a clone-unsafe
 * worker config — surface as `failure` events through `next()`, never
 * as throws (DOCS.md § Structural constraints). The `ready` handshake
 * is consumed here; the pump never sees it. `terminate` is
 * teardown-without-resume: the worker dies paused when paused.
 */
export default function createWorkerTransport(): Transport {
	const state: TransportState = {
		worker: null,
		views: null,
		queue: [],
		waiter: null,
	};

	return Object.freeze({
		async start(init: TransportInit): Promise<void> {
			await startWorker(state, init);
		},
		next(): Promise<TransportEvent> {
			if (state.queue.length > 0) {
				return Promise.resolve(state.queue.shift() as TransportEvent);
			}
			return new Promise(function captureWaiter(resolve) {
				state.waiter = resolve;
			});
		},
		hasPendingEvent(): boolean {
			return (
				state.views !== null &&
				Atomics.load(state.views.control, PROTOCOL.EVENT_READY_INDEX) ===
					PROTOCOL.EVENT_READY
			);
		},
		resume(): void {
			if (state.views !== null) {
				clearEventReady(state.views);
				writeResumeSignal(state.views);
			}
		},
		respond(response: CallResponse): void {
			if (state.views !== null) {
				writeCallResponse(state.views, response);
			}
		},
		terminate(): void {
			state.worker?.terminate();
		},
	});
}

type TransportState = {
	worker: Worker | null;
	views: BufferViews | null;
	queue: TransportEvent[];
	waiter: ((event: TransportEvent) => void) | null;
};

/**
 * Spawns the sandbox and runs the handshake → setup → execute
 * sequence; every failure on the way queues a `failure` event and
 * stops, leaving the pump to settle the run as worker-error.
 */
async function startWorker(
	state: TransportState,
	init: TransportInit,
): Promise<void> {
	if (typeof SharedArrayBuffer === 'undefined') {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineEnvironmentError',
			message:
				'SharedArrayBuffer is unavailable — the host page must serve ' +
				'COOP/COEP (cross-origin isolation) headers',
		});
		return;
	}

	let worker: Worker;
	try {
		worker = init.workerFactory();
	} catch (error) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineEnvironmentError',
			message: `worker construction failed: ${describeError(error)}`,
		});
		return;
	}
	state.worker = worker;

	const ready = await listenUntilReady(state, worker);
	if (!ready) {
		return;
	}

	// WHY no second error listener: listenUntilReady's error listener is
	// never detached, and its enqueue covers post-ready crashes too —
	// only its resolve(false) is spent (a harmless no-op on a settled
	// promise). A duplicate listener here would enqueue one crash twice
	// (pinned by conformance/transport/post-ready-crash.browser.test.ts).

	const sharedBuffer = new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE);
	state.views = createBufferViews(sharedBuffer);
	try {
		worker.postMessage({
			kind: 'setup',
			sharedBuffer,
			workerConfig: init.workerConfig,
		});
	} catch (error) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineEnvironmentError',
			message: `worker config is not clone-safe: ${describeError(error)}`,
		});
		worker.terminate();
		return;
	}
	worker.postMessage({ kind: 'execute', code: init.code, strict: init.strict });
}

/**
 * Wires the worker's listeners and resolves true on the ready
 * handshake — or false when the worker fails to load (the failure
 * event is already queued; setup/execute must not be posted).
 */
function listenUntilReady(
	state: TransportState,
	worker: Worker,
): Promise<boolean> {
	return new Promise(function listen(resolve) {
		worker.addEventListener('message', function onMessage(event) {
			const message = event.data as FromWorkerMessage;
			if (message.kind === 'ready') {
				resolve(true);
				return;
			}
			enqueue(state, message);
		});
		worker.addEventListener('error', function onError(event) {
			enqueue(state, {
				kind: 'failure',
				name: 'EngineWorkerError',
				message: event.message || 'the worker crashed',
			});
			resolve(false);
		});
	});
}

function enqueue(state: TransportState, event: TransportEvent): void {
	if (state.waiter !== null) {
		const { waiter } = state;
		state.waiter = null;
		waiter(event);
		return;
	}
	state.queue.push(event);
}

function describeError(error: unknown): string {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}
