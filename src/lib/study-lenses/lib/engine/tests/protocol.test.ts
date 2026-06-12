import { describe, expect, it } from 'vitest';

import PROTOCOL from '../worker/protocol.js';

describe('PROTOCOL', () => {
	it('pins the total buffer size at 8192 bytes', () => {
		expect(PROTOCOL.BUFFER_SIZE).toBe(8192);
	});

	it('pins the payload ceiling at 8168 bytes', () => {
		expect(PROTOCOL.PAYLOAD_CEILING).toBe(8168);
	});

	it('starts the payload after the six-slot control header', () => {
		expect(PROTOCOL.PAYLOAD_BYTE_OFFSET).toBe(
			PROTOCOL.CONTROL_SLOT_COUNT * Int32Array.BYTES_PER_ELEMENT,
		);
	});

	it('sizes the payload area as buffer minus header', () => {
		expect(PROTOCOL.PAYLOAD_CEILING).toBe(
			PROTOCOL.BUFFER_SIZE - PROTOCOL.PAYLOAD_BYTE_OFFSET,
		);
	});
});
