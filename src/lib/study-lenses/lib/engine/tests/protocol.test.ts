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

	it.each([
		['CONTROL_INDEX', 0],
		['RESPONSE_TYPE_INDEX', 1],
		['VALUE_FLAG_INDEX', 2],
		['PAYLOAD_LENGTH_INDEX', 3],
		['PAUSE_INDEX', 4],
		['EVENT_READY_INDEX', 5],
		['SIGNAL_IDLE', 0],
		['SIGNAL_WAITING', 1],
		['SIGNAL_RESPONDED', 2],
		['RESPONSE_STRING', 0],
		['RESPONSE_BOOLEAN', 1],
		['RESPONSE_NULL', 2],
		['RESPONSE_UNDEFINED', 3],
		['PAUSE_RUNNING', 0],
		['PAUSE_PAUSED', 1],
		['EVENT_NOT_READY', 0],
		['EVENT_READY', 1],
	] as const)('pins %s at %i', (key, value) => {
		expect(PROTOCOL[key]).toBe(value);
	});
});
