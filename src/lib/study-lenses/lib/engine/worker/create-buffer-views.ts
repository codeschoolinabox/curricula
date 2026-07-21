/**
 * @file Creates the typed views both sides use over the shared buffer.
 */

import PROTOCOL from './protocol.js';
import type { BufferViews } from './types.js';

/**
 * Creates typed array views over a SharedArrayBuffer.
 *
 * @remarks The control view (Int32Array) covers the six-slot header;
 * the payload view (Uint8Array) covers byte 24 onward for UTF-8
 * string data. Layout in `./protocol.ts`.
 */
export default function createBufferViews(sab: SharedArrayBuffer): BufferViews {
	const control = new Int32Array(sab, 0, PROTOCOL.CONTROL_SLOT_COUNT);
	const payload = new Uint8Array(sab, PROTOCOL.PAYLOAD_BYTE_OFFSET);

	// Shallow freeze only: TypedArray element writes cannot be frozen (spec),
	// and these views MUST stay writable — they are the wire itself.
	return Object.freeze({ control, payload });
}
