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
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
} from '../../../run/worker-protocol.js';

import instrument from './instrument.js';

import type { TraceEvent } from './types.js';
import type { TraceResult } from '../../../../api/types.js';

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
type WorkerErrorSignal = { readonly type: 'worker-error'; readonly message: string };

type WorkerOutbound = EntryMessage | IoRequestMessage | CompleteMessage | ErrorMessage;
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
				message: 'SharedArrayBuffer is not available. Requires COOP/COEP headers.',
				phase: 'creation' as const,
			},
			logs: [] as TraceEvent[],
		});
	}

	// 3. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 4. Spawn classic worker via blob URL
	const moduleUrl = new URL('./trace-worker.ts', import.meta.url);
	const loaderCode = [
		'let _handler = null;',
		'const _queue = [];',
		'self.onmessage = function(e) {',
		'  if (_handler) { _handler(e); return; }',
		'  _queue.push(e);',
		'};',
		`import("${moduleUrl.href}").then(function(mod) {`,
		'  _handler = mod.handleMessage;',
		'  _queue.forEach(function(e) { mod.handleMessage(e); });',
		'  _queue.length = 0;',
		'}).catch(function(err) {',
		'  postMessage({ type: "error", name: "WorkerLoadError",',
		'    message: err.message || String(err), phase: "creation" });',
		'  postMessage({ type: "complete" });',
		'});',
	].join('\n');
	const blob = new Blob([loaderCode], { type: 'application/javascript' });
	const blobUrl = URL.createObjectURL(blob);

	let worker: Worker;
	try {
		worker = new Worker(blobUrl);
	} catch (err: unknown) {
		URL.revokeObjectURL(blobUrl);
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

	URL.revokeObjectURL(blobUrl);

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
		enqueue({ type: 'worker-error', message: e.message || 'Unknown worker error' });
	};

	// 6. Timeout — cumulative execution time
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let remainingMs = maxMs ?? Infinity;
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
	worker.postMessage({ type: 'execute', instrumentedCode });

	writePauseEngaged(views);
	startTimeout();

	const events: TraceEvent[] = [];
	let runtimeError: ErrorMessage | null = null;

	try {
		while (true) {
			const msg = await dequeue();

			if (msg.type === 'entry') {
				events.push(msg.entry);
				pauseTimeout();
				yield msg.entry;
				startTimeout();
				writeResumeSignal(views);
				writePauseEngaged(views);
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

			if (msg.type === 'timeout') {
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
		}
	} finally {
		clearTimeoutIfSet();
		worker.terminate();
	}

	// 8. Build result
	if (runtimeError) {
		const isIterationLimit = runtimeError.name === 'RangeError' &&
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

	const defaultValue = msg.args.length > 1 ? String(msg.args[1] ?? '') : undefined;
	// eslint-disable-next-line no-alert
	const result = prompt(dialogMessage, defaultValue);
	writePromptResponse(views, result);
}

export default createTracingGenerator;
