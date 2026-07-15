/**
 * @file Worker-side reader for the bounded call-response channel.
 */

import type { CallResponse } from '../types.js';

import PROTOCOL from './protocol.js';
import type { BufferViews } from './types.js';

/**
 * Decodes the call response after the control slot signals RESPONDED.
 *
 * @remarks Non-blocking: the bootstrap's Atomics wait loop (not this
 * function) parks the worker until the thread writes the response.
 * Reading resets the control slot to IDLE so the next round-trip
 * starts clean.
 */
export default function readCallResponse(views: BufferViews): CallResponse {
	const response = decodeResponse(views);
	Atomics.store(views.control, PROTOCOL.CONTROL_INDEX, PROTOCOL.SIGNAL_IDLE);

	return response;
}

/** Maps the response-type slot back to the CallResponse vocabulary. */
function decodeResponse(views: BufferViews): CallResponse {
	const responseType = Atomics.load(
		views.control,
		PROTOCOL.RESPONSE_TYPE_INDEX,
	);

	if (responseType === PROTOCOL.RESPONSE_BOOLEAN) {
		return Atomics.load(views.control, PROTOCOL.VALUE_FLAG_INDEX) === 1;
	}
	if (responseType === PROTOCOL.RESPONSE_NULL) {
		return null;
	}
	if (responseType === PROTOCOL.RESPONSE_STRING) {
		const byteLength = Atomics.load(
			views.control,
			PROTOCOL.PAYLOAD_LENGTH_INDEX,
		);
		return DECODER.decode(views.payload.slice(0, byteLength));
	}

	return undefined;
}

// WHY at module load: synchronous, zero-config, stateless singleton codec —
// the house pattern for codecs, like regex literals.
const DECODER = new TextDecoder();
