/**
 * @file Executes JeJ code in a Web Worker with trapped globals.
 *
 * @remarks This is the low-level execution engine. It does not
 * validate or enforce language levels — a higher-level wrapper
 * handles that before calling the generator.
 *
 * Returns an async generator that yields RunEvent objects one at a
 * time, pausing the Worker between events via SharedArrayBuffer.
 * The generator returns a RunResult when execution completes.
 *
 * See DOCS.md § SAB pause protocol for the pause/resume mechanism.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { RunEvent, ErrorEvent as RunErrorEvent } from '../shared/types.js';
import type { RunResult } from '../../api/types.js';
import type { IoRequestMessage, WorkerOutbound } from './types.js';

import createWorkerScript from './create-worker-script.js';
import guardLoopsCondition from '../shared/guard-loops/guard-loops.js';
import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
} from './worker-protocol.js';

// --- Internal message types for the queue ---

type TimeoutSignal = { readonly type: 'timeout' };
type WorkerErrorSignal = { readonly type: 'worker-error'; readonly message: string };
type QueueMessage = WorkerOutbound | TimeoutSignal | WorkerErrorSignal;

/**
 * Creates an async generator that runs learner code in a Web Worker
 * and yields events as they occur.
 *
 * @param code - JavaScript source to execute (assumed valid)
 * @param maxSeconds - timeout in seconds (cumulative execution time,
 *   not wall-clock — pauses during SAB wait)
 * @returns Async generator yielding RunEvent, returning RunResult
 *
 * @remarks All globals (console.log, console.assert, alert, confirm,
 * prompt) are trapped. I/O traps block the worker via SAB+Atomics
 * while the main thread shows real browser dialogs.
 *
 * The Worker pauses after posting each event via `checkPause()`.
 * The generator resumes it on each `next()` call, enabling
 * step-through consumption. For batch mode, the drain loop in
 * `createExecution` calls `next()` rapidly.
 *
 * Timeout tracks cumulative execution time: cleared when the
 * Worker pauses, restarted with remaining time when it resumes.
 * This means learners can examine steps indefinitely without
 * triggering the timeout.
 */
async function* createRunGenerator(
	code: string,
	maxSeconds: number,
	maxIterations?: number,
): AsyncGenerator<RunEvent, RunResult> {
	// 1. Check SAB availability
	if (typeof SharedArrayBuffer === 'undefined') {
		const error: RunErrorEvent = {
			event: 'error',
			name: 'EnvironmentError',
			message:
				'SharedArrayBuffer is not available. The hosting page must ' +
				'serve Cross-Origin-Opener-Policy: same-origin and ' +
				'Cross-Origin-Embedder-Policy: require-corp headers.',
			phase: 'creation',
		};
		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'javascript',
				name: error.name,
				message: error.message,
				phase: error.phase,
			},
			logs: [error],
		});
	}

	// 2. Apply loop guards if iterations limit is configured
	let execCode = code;
	let loopCount = 0;
	if (maxIterations !== undefined && maxIterations > 0) {
		const guardResult = guardLoopsCondition(code, maxIterations);
		execCode = guardResult.code;
		loopCount = guardResult.loopCount;
	}

	// 3. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 4. Create worker from Blob URL
	const script = createWorkerScript();
	const blob = new Blob([script], { type: 'application/javascript' });
	const url = URL.createObjectURL(blob);

	let worker: Worker;
	try {
		worker = new Worker(url);
	} catch (err: unknown) {
		URL.revokeObjectURL(url);
		const message =
			err instanceof Error ? err.message : 'Failed to create Worker';
		const error: RunErrorEvent = {
			event: 'error',
			name: 'WorkerError',
			message,
			phase: 'creation',
		};
		return deepFreezeInPlace({
			ok: false,
			error: { kind: 'javascript', name: error.name, message, phase: 'creation' },
			logs: [error],
		});
	}

	// 4. Message queue — bridges callback-based onmessage to
	// pull-based async generator
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

	// 5. Wire up Worker callbacks
	worker.onmessage = function onWorkerMessage(
		e: MessageEvent<WorkerOutbound>,
	) {
		enqueue(e.data);
	};

	worker.onerror = function onWorkerError(e: ErrorEvent) {
		enqueue({
			type: 'worker-error',
			message: e.message || 'Unknown worker error',
		});
	};

	// 6. Timeout — cumulative execution time tracking
	const maxMs = maxSeconds * 1000;
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let remainingMs = maxMs;
	let lastResumeTime = 0;

	function startTimeout(): void {
		if (!isFinite(remainingMs)) return;
		lastResumeTime = Date.now();
		timeout = setTimeout(function onTimeout() {
			timeout = null;
			enqueue({ type: 'timeout' });
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

	// 7. Start execution
	worker.postMessage({ type: 'setup', sharedBuffer: sab });
	worker.postMessage({
		type: 'execute',
		code: execCode,
		...(loopCount > 0 ? { loopCount } : {}),
	});

	// Engage pause so worker blocks after posting each event
	writePauseEngaged(views);
	startTimeout();

	const logs: RunEvent[] = [];

	try {
		while (true) {
			const msg = await dequeue();

			// 7a. Streamed event — yield to consumer
			if (msg.type === 'event') {
				const event = msg.event;
				logs.push(event);
				forwardToConsole(event);

				// WHY: pause timeout while generator is suspended at yield.
				// Consumer may take arbitrarily long to call next().
				// Cumulative time = only time the Worker is running.
				pauseTimeout();

				yield event;

				// Consumer called next() — resume worker and timeout
				startTimeout();
				writeResumeSignal(views);

				// Re-engage pause for the next event
				writePauseEngaged(views);
				continue;
			}

			// 7b. I/O request — show dialog, write response, wake worker
			if (msg.type === 'io-request') {
				handleIoRequest(msg as IoRequestMessage, views);
				Atomics.notify(views.control, CONTROL_INDEX);
				continue;
			}

			// 7c. Complete — break out of loop
			if (msg.type === 'complete') {
				break;
			}

			// 7d. Worker error — record and break
			if (msg.type === 'worker-error') {
				logs.push({
					event: 'error',
					name: 'WorkerError',
					message: msg.message,
					phase: 'execution',
				});
				break;
			}

			// 7e. Timeout — record and break
			if (msg.type === 'timeout') {
				logs.push({
					event: 'error',
					name: 'TimeoutError',
					message: `Execution exceeded ${maxSeconds} second time limit`,
					phase: 'execution',
				});
				break;
			}
		}
	} finally {
		clearTimeoutIfSet();
		worker.terminate();
		URL.revokeObjectURL(url);
	}

	// 8. Build result from collected logs
	return buildResult(logs, maxSeconds, maxIterations);
}

// --- Helpers ---

/**
 * Builds a RunResult from the collected event logs.
 */
function buildResult(
	logs: readonly RunEvent[],
	maxSeconds: number,
	maxIterations?: number,
): RunResult {
	const errorEvent = findErrorEvent(logs);

	if (errorEvent) {
		if (errorEvent.name === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'timeout',
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line !== undefined
						? { line: errorEvent.line }
						: {}),
					phase: errorEvent.phase,
					limit: maxSeconds,
				},
				logs,
			});
		}

		// WHY: RangeError from loop guards is classified as
		// iteration-limit, not generic javascript error
		if (
			errorEvent.name === 'RangeError' &&
			maxIterations !== undefined &&
			errorEvent.message.includes('exceeded') &&
			errorEvent.message.includes('iterations')
		) {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line !== undefined
						? { line: errorEvent.line }
						: {}),
					phase: errorEvent.phase,
					limit: maxIterations,
				},
				logs,
			});
		}

		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'javascript',
				name: errorEvent.name,
				message: errorEvent.message,
				...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
				phase: errorEvent.phase,
			},
			logs,
		});
	}

	return deepFreezeInPlace({ ok: true, logs });
}

/**
 * Finds the last error event in the log array.
 */
function findErrorEvent(logs: readonly RunEvent[]): RunErrorEvent | undefined {
	for (let i = logs.length - 1; i >= 0; i--) {
		const entry = logs[i];
		if (entry.event === 'error') {
			return entry;
		}
	}
	return undefined;
}

/**
 * Shows the real browser dialog and writes the response to the SAB.
 *
 * @remarks Called on the main thread when the worker posts an
 * io-request. The worker is blocked on `Atomics.wait` and will
 * unblock when `Atomics.notify` is called after this function.
 */
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

	// msg.name === 'prompt'
	const defaultValue =
		msg.args.length > 1 ? String(msg.args[1] ?? '') : undefined;
	// eslint-disable-next-line no-alert
	const result = prompt(dialogMessage, defaultValue);
	writePromptResponse(views, result);
}

/**
 * Forwards a run event to the real console for debugging visibility.
 */
function forwardToConsole(event: RunEvent): void {
	if (event.event === 'log') {
		// eslint-disable-next-line no-console
		console.log(...event.args);
		return;
	}

	if (event.event === 'assert') {
		// eslint-disable-next-line no-console
		console.assert(event.args[0] as boolean, ...event.args.slice(1));
		return;
	}

	if (event.event === 'error') {
		// eslint-disable-next-line no-console
		console.error(`[${event.phase}] ${event.name}: ${event.message}`);
	}
}

export default createRunGenerator;
