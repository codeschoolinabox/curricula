/**
 * @file Executes JeJ code in a Web Worker with trapped globals.
 *
 * @remarks This is the low-level execution engine. It does not
 * validate or enforce language levels — a higher-level wrapper
 * handles that before calling `run`.
 */

import type { RunEvent, ErrorEvent as RunErrorEvent } from '../shared/types.js';
import type { IoRequestMessage, WorkerOutbound } from './types.js';

import createWorkerScript from './create-worker-script.js';
import {
	BUFFER_SIZE,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePromptResponse,
} from './worker-protocol.js';

/**
 * Runs learner code in a Web Worker and returns a structured event log.
 *
 * @param code - JavaScript source to execute (assumed valid)
 * @param maxSeconds - timeout in seconds; execution is terminated if exceeded
 * @returns frozen array of RunEvent objects — never throws
 *
 * @remarks All globals (console.log, console.assert, alert, confirm,
 * prompt) are trapped. I/O traps block the worker via SAB+Atomics
 * while the main thread shows real browser dialogs.
 */
function run(
	code: string,
	maxSeconds: number,
): Promise<readonly RunEvent[]> {
	// 1. Check SAB availability
	if (typeof SharedArrayBuffer === 'undefined') {
		return Promise.resolve(
			Object.freeze([
				createErrorEvent(
					'EnvironmentError',
					'SharedArrayBuffer is not available. The hosting page must ' +
						'serve Cross-Origin-Opener-Policy: same-origin and ' +
						'Cross-Origin-Embedder-Policy: require-corp headers.',
					'creation',
				),
			]),
		);
	}

	// 2. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 3. Create worker from Blob URL
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
		return Promise.resolve(
			Object.freeze([createErrorEvent('WorkerError', message, 'creation')]),
		);
	}

	// 4–9. Worker lifecycle
	const maxMs = maxSeconds * 1000;
	const events: RunEvent[] = [];

	return new Promise(function executor(resolve) {
		const timeout = setTimeout(function onTimeout() {
			worker.terminate();
			URL.revokeObjectURL(url);
			events.push(
				createErrorEvent(
					'TimeoutError',
					`Execution exceeded ${maxSeconds} second time limit`,
					'execution',
				),
			);
			resolve(Object.freeze(events));
		}, maxMs);

		worker.onmessage = function onWorkerMessage(
			e: MessageEvent<WorkerOutbound>,
		) {
			const msg = e.data;

			// 7a. Streamed event — collect and forward to real console
			if (msg.type === 'event') {
				events.push(msg.event);
				forwardToConsole(msg.event);
				return;
			}

			// 7b. I/O request — show dialog, write response, notify worker
			if (msg.type === 'io-request') {
				handleIoRequest(msg, views);
				Atomics.notify(views.control, 0);
				return;
			}

			// 7c. Complete — resolve
			if (msg.type === 'complete') {
				clearTimeout(timeout);
				worker.terminate();
				URL.revokeObjectURL(url);
				resolve(Object.freeze(events));
			}
		};

		worker.onerror = function onWorkerError(e) {
			clearTimeout(timeout);
			worker.terminate();
			URL.revokeObjectURL(url);
			events.push(
				createErrorEvent(
					'WorkerError',
					e.message || 'Unknown worker error',
					'execution',
				),
			);
			resolve(Object.freeze(events));
		};

		// 4. Send setup with SAB
		// WHY: SAB is shared, not transferred — no transfer list needed
		worker.postMessage({ type: 'setup', sharedBuffer: sab });

		// 5. Send execute with code
		worker.postMessage({ type: 'execute', code });
	});
}

// --- Helpers ---

function createErrorEvent(
	name: string,
	message: string,
	phase: 'creation' | 'execution',
): RunErrorEvent {
	return { event: 'error', name, message, phase };
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

export default run;
