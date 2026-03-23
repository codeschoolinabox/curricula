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
 * | byte 16+     | Uint8Array | UTF-8 encoded string payload           |
 */

// --- Layout constants ---

/** Int32Array element indices */
const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;

/** Byte offset where the string payload begins */
const PAYLOAD_BYTE_OFFSET = 16;

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
 * @remarks The control view (Int32Array) covers the first 16 bytes
 * (4 slots). The payload view (Uint8Array) covers byte 16 onward
 * for UTF-8 string data.
 */
function createBufferViews(sab: SharedArrayBuffer): BufferViews {
	const control = new Int32Array(sab, 0, 4);
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

// --- Exports ---

export {
	BUFFER_SIZE,
	CONTROL_INDEX,
	PAYLOAD_BYTE_OFFSET,
	SIGNAL_IDLE,
	SIGNAL_RESPONDED,
	SIGNAL_WAITING,
	createBufferViews,
	readResponse,
	writeAlertResponse,
	writeConfirmResponse,
	writePromptResponse,
};

export type { BufferViews, IoResult };
