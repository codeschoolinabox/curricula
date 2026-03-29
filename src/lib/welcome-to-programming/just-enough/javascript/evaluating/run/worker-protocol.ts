/**
 * @file SharedArrayBuffer encode/decode utilities for the I/O protocol.
 *
 * Used by both sides: the main thread writes responses (prompt, confirm,
 * alert), and the worker reads them. The worker-side read logic is
 * duplicated in the generated worker script string because workers
 * loaded from Blob URLs cannot import modules.
 *
 * @remarks Buffer layout (8192 bytes total):
 *
 * | Index/Offset | View       | Purpose                                |
 * | ------------ | ---------- | -------------------------------------- |
 * | control[0]   | Int32Array | Control: 0=idle, 1=waiting, 2=responded|
 * | control[1]   | Int32Array | Response type: 0=string, 1=boolean, 2=void |
 * | control[2]   | Int32Array | Null flag: 0=has value, 1=null         |
 * | control[3]   | Int32Array | Payload byte length                    |
 * | control[4]   | Int32Array | Pause flag: 0=running, 1=paused        |
 * | byte 20+     | Uint8Array | UTF-8 encoded string payload           |
 */

// --- Layout constants ---

/** Int32Array element indices */
const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;

/** Int32Array index for the pause flag (0=running, 1=paused) */
const PAUSE_INDEX = 4;

/** Byte offset where the string payload begins (5 Int32 slots × 4 bytes) */
const PAYLOAD_BYTE_OFFSET = 20;

/** Total buffer size in bytes */
const BUFFER_SIZE = 8192;

/** Response type codes written to RESPONSE_TYPE_INDEX */
const RESPONSE_STRING = 0;
const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

/** Control signal values */
const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;
const SIGNAL_RESPONDED = 2;

/** Pause flag values */
const PAUSE_RUNNING = 0;
const PAUSE_PAUSED = 1;

// --- Types ---

type BufferViews = {
	readonly control: Int32Array;
	readonly payload: Uint8Array;
};

type PromptResult = { readonly type: 'string'; readonly value: string | null };
type ConfirmResult = { readonly type: 'boolean'; readonly value: boolean };
type VoidResult = { readonly type: 'void' };
type IoResult = PromptResult | ConfirmResult | VoidResult;

// --- Shared setup ---

/**
 * Creates typed array views over a SharedArrayBuffer.
 *
 * @remarks The control view (Int32Array) covers the first 20 bytes
 * (5 slots: I/O control, response type, null flag, payload length,
 * pause flag). The payload view (Uint8Array) covers byte 20 onward
 * for UTF-8 string data.
 */
function createBufferViews(sab: SharedArrayBuffer): BufferViews {
	const control = new Int32Array(sab, 0, 5);
	const payload = new Uint8Array(sab, PAYLOAD_BYTE_OFFSET);

	return { control, payload };
}

// --- Main-thread side: write responses ---

const encoder = new TextEncoder();

/**
 * Writes a prompt response (string or null) to the SAB and signals
 * the worker.
 */
function writePromptResponse(views: BufferViews, value: string | null): void {
	Atomics.store(views.control, RESPONSE_TYPE_INDEX, RESPONSE_STRING);

	if (value === null) {
		Atomics.store(views.control, NULL_FLAG_INDEX, 1);
		Atomics.store(views.control, PAYLOAD_LENGTH_INDEX, 0);
	} else {
		Atomics.store(views.control, NULL_FLAG_INDEX, 0);
		const encoded = encoder.encode(value);
		views.payload.set(encoded);
		Atomics.store(views.control, PAYLOAD_LENGTH_INDEX, encoded.byteLength);
	}

	// WHY: store with release semantics so the worker sees all writes
	// before it sees the signal change
	Atomics.store(views.control, CONTROL_INDEX, SIGNAL_RESPONDED);
}

/**
 * Writes a confirm response (boolean) to the SAB and signals the worker.
 */
function writeConfirmResponse(views: BufferViews, value: boolean): void {
	Atomics.store(views.control, RESPONSE_TYPE_INDEX, RESPONSE_BOOLEAN);
	Atomics.store(views.control, NULL_FLAG_INDEX, value ? 1 : 0);
	Atomics.store(views.control, PAYLOAD_LENGTH_INDEX, 0);
	Atomics.store(views.control, CONTROL_INDEX, SIGNAL_RESPONDED);
}

/**
 * Writes a void response (alert acknowledged) to the SAB and signals
 * the worker.
 */
function writeAlertResponse(views: BufferViews): void {
	Atomics.store(views.control, RESPONSE_TYPE_INDEX, RESPONSE_VOID);
	Atomics.store(views.control, NULL_FLAG_INDEX, 0);
	Atomics.store(views.control, PAYLOAD_LENGTH_INDEX, 0);
	Atomics.store(views.control, CONTROL_INDEX, SIGNAL_RESPONDED);
}

// --- Worker side: read responses ---

const decoder = new TextDecoder();

/**
 * Reads the response from the SAB after the control signal is set
 * to responded.
 *
 * @remarks This is the typed version for main-thread testing. The
 * worker uses an inlined copy of this logic in the generated script.
 */
function readResponse(views: BufferViews): IoResult {
	const responseType = Atomics.load(views.control, RESPONSE_TYPE_INDEX);

	if (responseType === RESPONSE_VOID) {
		return { type: 'void' };
	}

	if (responseType === RESPONSE_BOOLEAN) {
		const flag = Atomics.load(views.control, NULL_FLAG_INDEX);
		return { type: 'boolean', value: flag === 1 };
	}

	// responseType === RESPONSE_STRING
	const nullFlag = Atomics.load(views.control, NULL_FLAG_INDEX);

	if (nullFlag === 1) {
		return { type: 'string', value: null };
	}

	const byteLength = Atomics.load(views.control, PAYLOAD_LENGTH_INDEX);
	const encoded = views.payload.slice(0, byteLength);
	const value = decoder.decode(encoded);

	return { type: 'string', value };
}

// --- Pause protocol (main-thread side) ---

/**
 * Engages the pause flag so the Worker blocks on its next
 * `Atomics.wait` call.
 *
 * @remarks Called by the main thread before yielding an event
 * from the async generator. The Worker will pause after posting
 * its next event.
 */
function writePauseEngaged(views: BufferViews): void {
	Atomics.store(views.control, PAUSE_INDEX, PAUSE_PAUSED);
}

/**
 * Clears the pause flag and wakes the Worker so it continues
 * execution.
 *
 * @remarks Called by the generator's `next()` — unblocks the
 * Worker from its `Atomics.wait(control, PAUSE_INDEX, PAUSE_PAUSED)`.
 */
function writeResumeSignal(views: BufferViews): void {
	Atomics.store(views.control, PAUSE_INDEX, PAUSE_RUNNING);
	Atomics.notify(views.control, PAUSE_INDEX);
}

/**
 * Returns a string of JavaScript code that implements the Worker-side
 * pause check. Injected into the generated worker script.
 *
 * @remarks The Worker calls this after posting each event via
 * `postMessage`. If the pause flag is set to 1 (paused), the Worker
 * blocks until the main thread clears it via `writeResumeSignal`.
 *
 * Uses the same `control` Int32Array that the I/O protocol uses.
 */
function checkPauseCode(): string {
	return `function checkPause() {
	while (Atomics.load(control, ${PAUSE_INDEX}) === ${PAUSE_PAUSED}) {
		Atomics.wait(control, ${PAUSE_INDEX}, ${PAUSE_PAUSED});
	}
}`;
}

// --- Exports ---

export {
	BUFFER_SIZE,
	CONTROL_INDEX,
	PAUSE_INDEX,
	PAYLOAD_BYTE_OFFSET,
	SIGNAL_IDLE,
	SIGNAL_RESPONDED,
	SIGNAL_WAITING,
	checkPauseCode,
	createBufferViews,
	readResponse,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
};

export type { BufferViews, IoResult };
