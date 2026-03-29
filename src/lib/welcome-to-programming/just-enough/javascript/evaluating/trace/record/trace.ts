/**
 * @file Main-thread orchestrator for worker-based Aran tracing.
 *
 * Returns an async generator that yields raw entries one at a time,
 * pausing the Worker between entries via SharedArrayBuffer.
 *
 * WHY classic worker + blob URL (not module worker):
 * Module workers with `{ type: 'module' }` fail to receive messages
 * in Vite 5 dev mode. Classic workers with blob URLs work reliably.
 * The blob URL loader dynamically imports the trace-worker module.
 *
 * @remarks
 * - Each call spawns a fresh worker (MUST NOT reuse — globalThis is
 *   polluted by Aran setup and learner code).
 * - Per-entry streaming preserves partial traces on timeout.
 * - I/O traps (prompt/confirm/alert) use SAB+Atomics — same protocol
 *   as evaluating/run.
 */

import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
} from '../../run/worker-protocol.js';

// --- Types ---

type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'confirm' | 'alert';
	readonly args: readonly unknown[];
};

type EntryMessage = {
	readonly type: 'entry';
	readonly entry: unknown;
};

type CompleteMessage = {
	readonly type: 'complete';
};

type TimeoutSignal = { readonly type: 'timeout' };
type WorkerErrorSignal = {
	readonly type: 'worker-error';
	readonly message: string;
};

type WorkerOutbound = EntryMessage | IoRequestMessage | CompleteMessage;
type QueueMessage = WorkerOutbound | TimeoutSignal | WorkerErrorSignal;

// --- Generator ---

/**
 * Traces code in a Web Worker and yields raw entries.
 *
 * @param code - JavaScript source to instrument and evaluate
 * @param maxMs - timeout in milliseconds (cumulative execution time).
 *   Use `null` for no timeout (not recommended for untrusted code).
 * @returns Async generator yielding raw entries (RawEntry objects and
 *   string markers). Returns the collected entries array when done.
 */
async function* createTraceGenerator(
	code: string,
	maxMs: number | null,
): AsyncGenerator<unknown, readonly unknown[]> {
	// 1. Check SAB availability
	if (typeof SharedArrayBuffer === 'undefined') {
		const errorEntry = {
			type: 'log',
			prefix: '-> creation phase error:',
			style: 'font-weight:bold;',
			logs: [
				'SharedArrayBuffer is not available. The hosting page must ' +
					'serve Cross-Origin-Opener-Policy: same-origin and ' +
					'Cross-Origin-Embedder-Policy: require-corp headers.',
			],
			loc: null,
			nodeType: null,
		};
		yield errorEntry;
		return [errorEntry];
	}

	// 2. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 3. Spawn classic worker via blob URL
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
		'  postMessage({ type: "entry", entry: {',
		'    type: "log",',
		'    prefix: "-> worker load error:",',
		'    style: "font-weight:bold;",',
		'    logs: [err.message || String(err)],',
		'    loc: null,',
		'    nodeType: null',
		'  }});',
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
		const message =
			err instanceof Error ? err.message : 'Failed to create Worker';
		const errorEntry = {
			type: 'log',
			prefix: '-> creation phase error:',
			style: 'font-weight:bold;',
			logs: [message],
			loc: null,
			nodeType: null,
		};
		yield errorEntry;
		return [errorEntry];
	}

	URL.revokeObjectURL(blobUrl);

	// 4. Message queue — bridges callbacks → generator
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

	// 5. Timeout — cumulative execution time tracking
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

	// 6. Start execution
	worker.postMessage({ type: 'setup', sharedBuffer: sab });
	worker.postMessage({ type: 'execute', code });

	writePauseEngaged(views);
	startTimeout();

	const entries: unknown[] = [];

	try {
		while (true) {
			const msg = await dequeue();

			if (msg.type === 'entry') {
				entries.push(msg.entry);

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

			if (msg.type === 'complete') {
				break;
			}

			if (msg.type === 'worker-error') {
				const errorEntry = {
					type: 'log',
					prefix: '-> worker error:',
					style: 'font-weight:bold;',
					logs: [msg.message],
					loc: null,
					nodeType: null,
				};
				entries.push(errorEntry);
				yield errorEntry;
				break;
			}

			if (msg.type === 'timeout') {
				const seconds = (maxMs ?? 0) / 1000;
				const errorEntry = {
					type: 'log',
					prefix: '-> execution phase error:',
					style: 'font-weight:bold;',
					logs: [`Execution exceeded ${seconds} second time limit`],
					loc: null,
					nodeType: null,
				};
				entries.push(errorEntry);
				yield errorEntry;
				break;
			}
		}
	} finally {
		clearTimeoutIfSet();
		worker.terminate();
	}

	return entries;
}

// --- I/O handler (mirrors run/run.ts) ---

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

export default createTraceGenerator;
