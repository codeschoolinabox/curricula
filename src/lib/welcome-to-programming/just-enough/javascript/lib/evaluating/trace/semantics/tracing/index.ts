/**
 * @file Main export for the new Aran-based trace pipeline.
 *
 * Returns an async generator that:
 * 1. Instruments code on the main thread (Aran standalone mode)
 * 2. Spawns a worker to execute the instrumented code
 * 3. Yields TraceEvents one at a time (streamed from worker via onEvent)
 * 4. Returns TraceResult on completion
 *
 * Replaces the legacy pipeline: trace.ts + record.ts + postProcess + filterSteps.
 * No post-processing needed — events are already structured by advice functions.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	EVENT_READY_INDEX,
	clearEventReady,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
} from '../../../intercept/worker-protocol.js';

import instrument from './instrument.js';

import type { TraceEvent } from './types.js';
import type { TraceResult } from '../../../../../api/types.js';

// --- Message types ---

type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'confirm' | 'alert';
	readonly args: readonly unknown[];
};

type EntryMessage = {
	readonly type: 'entry';
	readonly entry: TraceEvent;
};

type CompleteMessage = { readonly type: 'complete' };
type ErrorMessage = {
	readonly type: 'error';
	readonly message: string;
	readonly name: string;
	readonly phase: string;
};
type TimeoutSignal = { readonly type: 'timeout' };
type WorkerErrorSignal = {
	readonly type: 'worker-error';
	readonly message: string;
};

type WorkerOutbound =
	| EntryMessage
	| IoRequestMessage
	| CompleteMessage
	| ErrorMessage;
type QueueMessage = WorkerOutbound | TimeoutSignal | WorkerErrorSignal;

// --- Generator ---

/**
 * Instruments and traces JavaScript code, yielding TraceEvents.
 *
 * @param code - JavaScript source to instrument and execute
 * @param config - Trace config from options.schema.json
 * @param maxMs - Timeout in milliseconds (cumulative execution time). Null = no timeout.
 * @returns Async generator yielding TraceEvent, returning TraceResult
 */
async function* createTracingGenerator(
	code: string,
	config: Record<string, unknown>,
	maxMs: number | null,
): AsyncGenerator<TraceEvent, TraceResult> {
	// 1. Instrument on main thread (static transformation)
	let instrumentedCode: string;
	try {
		const result = instrument(code, config);
		instrumentedCode = result.instrumentedCode;
	} catch (err: unknown) {
		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: err instanceof Error ? err.name : 'Error',
				message: err instanceof Error ? err.message : String(err),
				phase: 'creation' as const,
			},
			logs: [] as TraceEvent[],
		});
	}

	// 2. Check SAB availability
	if (typeof SharedArrayBuffer === 'undefined') {
		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: 'Error',
				message:
					'SharedArrayBuffer is not available. Requires COOP/COEP headers.',
				phase: 'creation' as const,
			},
			logs: [] as TraceEvent[],
		});
	}

	// 3. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 4. Spawn module worker
	// WHY module Worker: Vite detects new Worker(new URL(...), { type: 'module' })
	// and serves the Worker correctly in both dev and production. The previous
	// blob URL + dynamic import() approach broke in vitest browser mode because:
	// (a) COEP require-corp blocks cross-origin import() from blob Workers
	// (b) vitest wraps import() through __vitest_browser_runner__ (absent in Workers)
	const moduleUrl = new URL('./trace-worker.ts', import.meta.url);

	let worker: Worker;
	try {
		worker = new Worker(moduleUrl, { type: 'module' });
	} catch (err: unknown) {
		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: 'Error',
				message: err instanceof Error ? err.message : 'Failed to create Worker',
				phase: 'creation' as const,
			},
			logs: [] as TraceEvent[],
		});
	}

	// 5. Message queue — bridges callbacks → async generator
	const queue: QueueMessage[] = [];
	let resolveWaiting: (() => void) | null = null;

	function enqueue(msg: QueueMessage): void {
		queue.push(msg);
		if (resolveWaiting !== null) {
			resolveWaiting();
			resolveWaiting = null;
		}
	}

	function dequeue(): Promise<QueueMessage> {
		if (queue.length > 0) {
			return Promise.resolve(queue.shift()!);
		}
		return new Promise<QueueMessage>((resolve) => {
			resolveWaiting = () => resolve(queue.shift()!);
		});
	}

	worker.onmessage = function onWorkerMessage(e: MessageEvent<WorkerOutbound>) {
		enqueue(e.data);
	};

	worker.onerror = function onWorkerError(e: ErrorEvent) {
		enqueue({
			type: 'worker-error',
			message: e.message || 'Unknown worker error',
		});
	};

	// 6. Timeout — cumulative execution time
	// WHY timedOut flag (not queued message): with fast-producing code like
	// while(true){}, the queue fills with entry messages. A queued timeout
	// message would sit behind thousands of entries and never get processed.
	// The flag is checked directly on every loop iteration.
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let remainingMs = maxMs ?? Infinity;
	let lastResumeTime = 0;
	let timedOut = false;

	function wakeDequeue(): void {
		if (resolveWaiting !== null) {
			// WHY enqueue sentinel: resolveWaiting's closure calls queue.shift().
			// Without a message in the queue, shift() returns undefined.
			// Push a sentinel so the loop gets a defined message, then
			// checks timedOut before accessing msg.type.
			queue.push({ type: 'complete' } as WorkerOutbound);
			resolveWaiting();
			resolveWaiting = null;
		}
	}

	function startTimeout(): void {
		if (!isFinite(remainingMs)) return;
		if (remainingMs <= 0) {
			timedOut = true;
			wakeDequeue();
			return;
		}
		lastResumeTime = Date.now();
		timeout = setTimeout(function onTimeout() {
			timeout = null;

			// Always deduct elapsed time — the budget was consumed
			// regardless of whether the Worker is paused or running.
			remainingMs -= Date.now() - lastResumeTime;
			if (remainingMs < 0) remainingMs = 0;

			// WHY EVENT_READY guard: the Worker writes EVENT_READY to the
			// SAB after calling postMessage but before blocking. If set,
			// the Worker is paused with a pending event — NOT stuck.
			// If budget remains, reschedule. If exhausted, fire timeout
			// (infinite loop producing events still exceeds time limit).
			if (
				Atomics.load(views.control, EVENT_READY_INDEX) === 1 &&
				remainingMs > 0
			) {
				startTimeout();
				return;
			}

			timedOut = true;
			wakeDequeue();
		}, remainingMs);
	}

	function pauseTimeout(): void {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
			remainingMs -= Date.now() - lastResumeTime;
			if (remainingMs < 0) remainingMs = 0;
		}
	}

	function clearTimeoutIfSet(): void {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	}

	// 7. Wait for Worker module to load, then start execution
	// WHY ready handshake: module Workers load asynchronously. Messages sent
	// before the module evaluates are queued by the browser, but we want an
	// explicit signal that advice globals are registered before executing.
	await new Promise<void>((resolve, reject) => {
		const loadTimeout = setTimeout(function onLoadTimeout() {
			reject(new Error('Worker module failed to load within 10 seconds'));
		}, 10000);

		function onReady(e: MessageEvent): void {
			if (e.data?.type === 'ready') {
				clearTimeout(loadTimeout);
				worker.removeEventListener('message', onReady);
				resolve();
			}
		}
		worker.addEventListener('message', onReady);
	});

	// WHY pause before execute: engage the SAB pause flag BEFORE sending
	// the execute message. Otherwise the Worker could start executing and
	// post events before the pause flag is set, creating a race window.
	writePauseEngaged(views);

	worker.postMessage({ type: 'setup', sharedBuffer: sab });
	worker.postMessage({ type: 'execute', instrumentedCode });

	startTimeout();

	const events: TraceEvent[] = [];
	let runtimeError: ErrorMessage | null = null;

	try {
		while (true) {
			const msg = await dequeue();

			// WHY check timedOut first: the timeout handler sets this flag
			// and calls wakeDequeue() to unblock us. The sentinel message
			// pushed by wakeDequeue is irrelevant — we just need to exit.
			if (timedOut) {
				const seconds = (maxMs ?? 0) / 1000;
				return deepFreezeInPlace({
					ok: false as const,
					error: {
						kind: 'timeout' as const,
						name: 'TimeoutError',
						message: `Execution exceeded ${seconds} second time limit`,
						phase: 'execution' as const,
						limit: seconds,
					},
					logs: events,
				});
			}

			if (msg.type === 'entry') {
				events.push(msg.entry);
				pauseTimeout();
				yield msg.entry;
				// WHY clearEventReady before resume: resets the flag so the
				// timeout handler can distinguish "Worker paused with event"
				// from "Worker running". Must happen before writeResumeSignal
				// (which lets the Worker run and potentially set it again).
				clearEventReady(views);
				writeResumeSignal(views);
				startTimeout();
				continue;
			}

			if (msg.type === 'io-request') {
				handleIoRequest(msg as IoRequestMessage, views);
				Atomics.notify(views.control, CONTROL_INDEX);
				continue;
			}

			if (msg.type === 'error') {
				runtimeError = msg as ErrorMessage;
				continue;
			}

			if (msg.type === 'complete') {
				break;
			}

			if (msg.type === 'worker-error') {
				runtimeError = {
					type: 'error',
					message: msg.message,
					name: 'WorkerError',
					phase: 'execution',
				};
				break;
			}
		}
	} finally {
		clearTimeoutIfSet();
		worker.terminate();
	}

	// 8. Build result
	if (runtimeError) {
		const isIterationLimit =
			runtimeError.name === 'RangeError' &&
			runtimeError.message.includes('Maximum iterations');

		if (isIterationLimit) {
			return deepFreezeInPlace({
				ok: false as const,
				error: {
					kind: 'iteration-limit' as const,
					name: runtimeError.name,
					message: runtimeError.message,
					phase: 'execution' as const,
					limit: 0,
				},
				logs: events,
			});
		}

		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: runtimeError.name,
				message: runtimeError.message,
				phase: 'execution' as const,
			},
			logs: events,
		});
	}

	return deepFreezeInPlace({
		ok: true as const,
		logs: events,
	});
}

// --- I/O handler ---

function handleIoRequest(
	msg: IoRequestMessage,
	views: ReturnType<typeof createBufferViews>,
): void {
	const dialogMessage = String(msg.args[0] ?? '');

	if (msg.name === 'alert') {
		// eslint-disable-next-line no-alert
		alert(dialogMessage);
		writeAlertResponse(views);
		return;
	}

	if (msg.name === 'confirm') {
		// eslint-disable-next-line no-alert
		const result = confirm(dialogMessage);
		writeConfirmResponse(views, result);
		return;
	}

	const defaultValue =
		msg.args.length > 1 ? String(msg.args[1] ?? '') : undefined;
	// eslint-disable-next-line no-alert
	const result = prompt(dialogMessage, defaultValue);
	writePromptResponse(views, result);
}

export default createTracingGenerator;
