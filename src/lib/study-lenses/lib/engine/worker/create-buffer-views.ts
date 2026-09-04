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
	const control = new INT32_ARRAY(sab, 0, PROTOCOL.CONTROL_SLOT_COUNT);
	const payload = new UINT8_ARRAY(sab, PROTOCOL.PAYLOAD_BYTE_OFFSET);

	// Shallow freeze only: TypedArray element writes cannot be frozen (spec),
	// and these views MUST stay writable — they are the wire itself.
	return OBJECT_FREEZE({ control, payload });
}

// WHY at module load: this module runs in BOTH realms, and a both-realms file
// is latched because one of its callers is worker-side (README.md § Realms).
// All three reads resolve before any program starts — every worker-realm call
// comes from handleSetup, which runs on the setup message — so these captures
// close the class the rule names rather than guarding a reachable read. The
// rule is mechanical precisely so that stays true after a future edit.
const INT32_ARRAY = Int32Array;
const UINT8_ARRAY = Uint8Array;
const OBJECT_FREEZE = Object.freeze;
