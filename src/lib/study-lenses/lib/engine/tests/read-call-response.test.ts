import { describe, expect, it } from 'vitest';

import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import readCallResponse from '../worker/read-call-response.js';
import writeCallResponse from '../worker/write-call-response.js';

describe('readCallResponse', () => {
	it('decodes a string poked directly into the wire, independent of writeCallResponse', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		const encoded = new TextEncoder().encode('poked');
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
		Atomics.store(
			views.control,
			PROTOCOL.CONTROL_INDEX,
			PROTOCOL.SIGNAL_RESPONDED,
		);

		expect(readCallResponse(views)).toBe('poked');
	});

	it('resets the control slot to idle after reading', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		writeCallResponse(views, 'hello');

		readCallResponse(views);

		expect(Atomics.load(views.control, PROTOCOL.CONTROL_INDEX)).toBe(
			PROTOCOL.SIGNAL_IDLE,
		);
	});

	it('supports a second round-trip after the first', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		writeCallResponse(views, 'first');
		readCallResponse(views);

		writeCallResponse(views, 'second');

		expect(readCallResponse(views)).toBe('second');
	});

	it('decodes a shorter second string without first-string residue', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		writeCallResponse(views, 'long first response');
		readCallResponse(views);

		writeCallResponse(views, 'tiny');

		expect(readCallResponse(views)).toBe('tiny');
	});
});
