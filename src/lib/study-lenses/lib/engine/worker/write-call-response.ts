/**
 * @file Thread-side writer for the bounded call-response channel.
 */

import type { CallResponse } from '../types.js';

import PROTOCOL from './protocol.js';
import type { BufferViews } from './types.js';

/**
 * Writes one call response (string, boolean, null, or undefined) to
 * the shared buffer and signals the blocked worker.
 *
 * @remarks All data writes land before the control slot flips to
 * RESPONDED — the worker wakes on the signal and must observe a
 * complete response. String payloads are measured in ENCODED bytes
 * and bounds-checked against the 8168-byte payload ceiling BEFORE any
 * write: an oversized response throws a RangeError naming the ceiling
 * and the actual size — the channel never truncates silently.
 *
 * @throws RangeError when the encoded payload exceeds the ceiling.
 */
export default function writeCallResponse(
	views: BufferViews,
	response: CallResponse,
): void {
	if (typeof response === 'string') {
		writeStringResponse(views, response);
	} else if (typeof response === 'boolean') {
		writeBooleanResponse(views, response);
	} else if (response === null) {
		Atomics.store(
			views.control,
			PROTOCOL.RESPONSE_TYPE_INDEX,
			PROTOCOL.RESPONSE_NULL,
		);
	} else {
		Atomics.store(
			views.control,
			PROTOCOL.RESPONSE_TYPE_INDEX,
			PROTOCOL.RESPONSE_UNDEFINED,
		);
	}

	// WHY: the control signal lands last so the worker, waking on
	// RESPONDED, observes a complete response (release ordering). The
	// notify wakes the worker's Atomics.wait — a store alone never does.
	Atomics.store(
		views.control,
		PROTOCOL.CONTROL_INDEX,
		PROTOCOL.SIGNAL_RESPONDED,
	);
	Atomics.notify(views.control, PROTOCOL.CONTROL_INDEX);
}

// WHY at module load: synchronous, zero-config, stateless singleton codec —
// the house pattern for codecs, like regex literals.
const ENCODER = new TextEncoder();

/**
 * Bounds-checks, encodes, and records a string payload. The check
 * precedes every store — an overflowing write leaves the buffer
 * untouched.
 */
function writeStringResponse(views: BufferViews, response: string): void {
	const encoded = ENCODER.encode(response);
	if (encoded.byteLength > PROTOCOL.PAYLOAD_CEILING) {
		throw new RangeError(
			`call response payload is ${encoded.byteLength} bytes; the ceiling is ${PROTOCOL.PAYLOAD_CEILING}`,
		);
	}

	views.payload.set(encoded);
	Atomics.store(
		views.control,
		PROTOCOL.PAYLOAD_LENGTH_INDEX,
		encoded.byteLength,
	);
	Atomics.store(
		views.control,
		PROTOCOL.RESPONSE_TYPE_INDEX,
		PROTOCOL.RESPONSE_STRING,
	);
}

/** Records a boolean on the value-flag slot. */
function writeBooleanResponse(views: BufferViews, response: boolean): void {
	Atomics.store(views.control, PROTOCOL.VALUE_FLAG_INDEX, response ? 1 : 0);
	Atomics.store(
		views.control,
		PROTOCOL.RESPONSE_TYPE_INDEX,
		PROTOCOL.RESPONSE_BOOLEAN,
	);
}
