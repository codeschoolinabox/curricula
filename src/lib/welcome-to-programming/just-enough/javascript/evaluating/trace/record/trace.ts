/**
 * @file Main-thread orchestrator for worker-based Aran tracing.
 *
 * Spawns a disposable classic worker via blob URL, which dynamically
 * imports the trace-worker module. Messages are buffered until the
 * module loads, then replayed.
 *
 * WHY classic worker + blob URL (not module worker):
 * Module workers with `{ type: 'module' }` fail to receive messages
 * in Vite 5 dev mode. Classic workers with blob URLs (same pattern as
 * evaluating/run) work reliably. The blob URL loader dynamically
 * imports the trace-worker module, getting the best of both worlds:
 * classic worker reliability + ESM imports for the Aran tracer code.
 *
 * @remarks
 * - Each call spawns a fresh worker (MUST NOT reuse — globalThis is
 *   polluted by Aran setup and learner code).
 * - Per-step streaming preserves partial traces on timeout (critical
 *   for debugging infinite loops).
 * - I/O traps (prompt/confirm/alert) use SAB+Atomics — same protocol
 *   as evaluating/run.
 */

import {
	BUFFER_SIZE,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePromptResponse,
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

type WorkerOutbound = EntryMessage | IoRequestMessage | CompleteMessage;

// --- Orchestrator ---

/**
 * Traces code in a Web Worker and returns raw entries.
 *
 * @param code - JavaScript source to instrument and evaluate
 * @param maxMs - timeout in milliseconds; worker is terminated if exceeded.
 *   Use `null` for no timeout (not recommended for untrusted code).
 * @returns raw entries array (mix of RawEntry objects and string markers).
 *   On timeout, returns partial entries captured before termination.
 *   Never throws — errors are captured as entries inside the worker.
 */
function traceInWorker(
	code: string,
	maxMs: number | null,
): Promise<readonly unknown[]> {
	// 1. Check SAB availability
	if (typeof SharedArrayBuffer === 'undefined') {
		return Promise.resolve(
			Object.freeze([
				{
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
				},
			]),
		);
	}

	// 2. Create SAB and views
	const sab = new SharedArrayBuffer(BUFFER_SIZE);
	const views = createBufferViews(sab);

	// 3. Spawn classic worker via blob URL (mirrors run/run.ts pattern)
	// WHY blob URL: module workers fail to receive messages in Vite 5 dev.
	// The blob loads immediately and buffers messages while the ES module
	// is dynamically imported. Once loaded, buffered messages are replayed.
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
		return Promise.resolve(
			Object.freeze([
				{
					type: 'log',
					prefix: '-> creation phase error:',
					style: 'font-weight:bold;',
					logs: [message],
					loc: null,
					nodeType: null,
				},
			]),
		);
	}

	URL.revokeObjectURL(blobUrl);

	// 4. Accumulate streamed entries
	const entries: unknown[] = [];

	return new Promise(function executor(resolve) {
		// 5. Timeout handling
		let timeout: ReturnType<typeof setTimeout> | undefined;
		if (maxMs !== null && maxMs !== Infinity && maxMs > 0) {
			timeout = setTimeout(function onTimeout() {
				worker.terminate();
				// Surface timeout as an error entry (like run.ts does)
				entries.push({
					type: 'log',
					prefix: '-> execution phase error:',
					style: 'font-weight:bold;',
					logs: [
						`Execution exceeded ${maxMs / 1000} second time limit`,
					],
					loc: null,
					nodeType: null,
				});
				resolve(Object.freeze(entries));
			}, maxMs);
		}

		// 6. Worker message handling
		worker.onmessage = function onWorkerMessage(
			e: MessageEvent<WorkerOutbound>,
		) {
			const msg = e.data;

			// Per-step streamed entry
			if (msg.type === 'entry') {
				entries.push(msg.entry);
				return;
			}

			// I/O request — show dialog, write response, notify worker
			if (msg.type === 'io-request') {
				handleIoRequest(msg, views);
				Atomics.notify(views.control, 0);
				return;
			}

			// Execution complete
			if (msg.type === 'complete') {
				if (timeout !== undefined) clearTimeout(timeout);
				worker.terminate();
				resolve(Object.freeze(entries));
			}
		};

		worker.onerror = function onWorkerError(e) {
			if (timeout !== undefined) clearTimeout(timeout);
			worker.terminate();
			// WHY: mirror run.ts — surface error info instead of silent empty resolve
			entries.push({
				type: 'log',
				prefix: '-> worker error:',
				style: 'font-weight:bold;',
				logs: [e.message || 'Unknown worker error'],
				loc: null,
				nodeType: null,
			});
			resolve(Object.freeze(entries));
		};

		// 7. Send setup (SAB) then execute (code)
		worker.postMessage({ type: 'setup', sharedBuffer: sab });
		worker.postMessage({ type: 'execute', code });
	});
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

export default traceInWorker;
