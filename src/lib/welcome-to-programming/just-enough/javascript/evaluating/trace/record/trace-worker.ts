/**
 * @file Worker module for Aran trace execution.
 *
 * Loaded via dynamic import() from a classic worker blob URL (see trace.ts).
 * Each worker instance is disposable — MUST NOT be reused across
 * trace() calls (globalThis is polluted by Aran setup and learner code).
 *
 * Message protocol:
 *   main → worker: 'setup' (SAB for I/O traps) → 'execute' (code)
 *   worker → main: 'entry' (per-step streaming) → 'complete'
 *
 * Entry streaming is handled by print() in trace-log.js (Increment 2).
 * This module just orchestrates: apply config → trace → signal complete.
 */

// --- Legacy tracer imports (ESM, bundled by Vite) ---

// @ts-expect-error — untyped vendored legacy JS
import { config as legacyConfig } from './legacy-aran-trace/data/config.js';
// @ts-expect-error — untyped vendored legacy JS
import { trace } from './legacy-aran-trace/trace.js';
// @ts-expect-error — untyped vendored legacy JS
import { traceCollector } from './legacy-aran-trace/lib/trace-collector.js';
// @ts-expect-error — untyped vendored legacy JS
import { state } from './legacy-aran-trace/data/state.js';

// --- SAB layout constants (duplicated from run/worker-protocol.ts) ---

const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;
const PAUSE_INDEX = 4;
const PAYLOAD_BYTE_OFFSET = 20;

const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;

const PAUSE_PAUSED = 1;

// --- SAB state (set on 'setup' message) ---

let controlView: Int32Array | null = null;
let payloadView: Uint8Array | null = null;

// --- Capture-all config (hardcoded — no config passing needed) ---

const CAPTURE_ALL = {
	variablesList: [],
	variablesDeclare: true,
	variablesAssign: true,
	variablesRead: true,
	operatorsList: [],
	operators: true,
	controlFlowList: [],
	controlFlow: true,
	functionsList: [],
	functions: true,
	functionDeclarations: true,
	this: true,
	errorHandling: true,
	blockScope: true,
	range: { start: 1, end: 100_000 },
	lines: true,
	steps: true,
	console: true,
	isInRange: true,
	failure: true,
};

// --- I/O traps (SAB-blocking, defined before Aran setup) ---
// WHY: Workers have no native prompt/confirm/alert. These traps block
// the worker via Atomics.wait while the main thread shows real dialogs.
// MUST be defined before trace.js runs aran.setup() — setup captures
// builtins.global which includes prompt/confirm/alert.

const textDecoder = new TextDecoder();

function waitForResponse(): void {
	if (!controlView) return;
	Atomics.store(controlView, CONTROL_INDEX, SIGNAL_WAITING);
	Atomics.wait(controlView, CONTROL_INDEX, SIGNAL_WAITING);
}

function readResponse(): { type: string; value: unknown } {
	if (!controlView || !payloadView) {
		return { type: 'string', value: null };
	}

	const responseType = Atomics.load(controlView, RESPONSE_TYPE_INDEX);

	if (responseType === RESPONSE_VOID) {
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'void', value: undefined };
	}

	if (responseType === RESPONSE_BOOLEAN) {
		const flag = Atomics.load(controlView, NULL_FLAG_INDEX);
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'boolean', value: flag === 1 };
	}

	// RESPONSE_STRING
	const nullFlag = Atomics.load(controlView, NULL_FLAG_INDEX);
	if (nullFlag === 1) {
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'string', value: null };
	}

	const byteLength = Atomics.load(controlView, PAYLOAD_LENGTH_INDEX);
	const encoded = payloadView.slice(0, byteLength);
	const value = textDecoder.decode(encoded);
	Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
	return { type: 'string', value };
}

// Define on globalThis so Aran setup captures them as builtins
globalThis.prompt = function prompt(...args: unknown[]): string | null {
	postMessage({ type: 'io-request', name: 'prompt', args });
	waitForResponse();
	const response = readResponse();
	return response.value as string | null;
};

globalThis.confirm = function confirm(...args: unknown[]): boolean {
	postMessage({ type: 'io-request', name: 'confirm', args });
	waitForResponse();
	const response = readResponse();
	return response.value as boolean;
};

globalThis.alert = function alert(...args: unknown[]): void {
	postMessage({ type: 'io-request', name: 'alert', args });
	waitForResponse();
	readResponse();
};

// --- Pause protocol (blocks Worker between events) ---

function checkPause(): void {
	if (!controlView) return;
	while (Atomics.load(controlView, PAUSE_INDEX) === PAUSE_PAUSED) {
		Atomics.wait(controlView, PAUSE_INDEX, PAUSE_PAUSED);
	}
}

// WHY: The legacy Aran tracer streams entries via postMessage() in
// trace-log.js. To add pause behavior between entries, we intercept
// postMessage and call checkPause() after each entry message.
// This works because the legacy tracer calls self.postMessage directly.
const _originalPostMessage = self.postMessage.bind(self);
self.postMessage = function pauseAwarePostMessage(
	msg: unknown,
	...rest: unknown[]
) {
	// @ts-expect-error — spread of rest args
	_originalPostMessage(msg, ...rest);
	if (
		msg !== null &&
		typeof msg === 'object' &&
		'type' in msg &&
		(msg as { type: string }).type === 'entry'
	) {
		checkPause();
	}
};

// --- Message handler (exported for classic worker blob URL loader) ---

export function handleMessage(e: MessageEvent): void {
	const msg = e.data;

	if (msg.type === 'setup') {
		controlView = new Int32Array(msg.sharedBuffer, 0, 5);
		payloadView = new Uint8Array(msg.sharedBuffer, PAYLOAD_BYTE_OFFSET);
		return;
	}

	if (msg.type === 'execute') {
		// 1. Apply capture-all config
		Object.assign(legacyConfig, CAPTURE_ALL);

		// 2. Reset state
		state.originalConsole = console;
		traceCollector.reset();

		// 3. Trace (entries are streamed via print() → postMessage)
		// WHY try/catch: if trace() throws, 'complete' must still be sent
		// or the main-thread Promise never resolves (hangs until timeout).
		try {
			trace(msg.code);
		} catch (err: unknown) {
			postMessage({
				type: 'entry',
				entry: {
					type: 'log',
					prefix: '-> worker execution error:',
					style: 'font-weight:bold;',
					logs: [err instanceof Error ? err.message : String(err)],
					loc: null,
					nodeType: null,
				},
			});
		}

		// 4. Signal completion
		postMessage({ type: 'complete' });
	}
}
