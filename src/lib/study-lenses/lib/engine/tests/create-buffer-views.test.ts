import { describe, expect, it } from 'vitest';

import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';

describe('createBufferViews', () => {
	it('creates an Int32Array control view', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);

		expect(views.control).toBeInstanceOf(Int32Array);
	});

	it('sizes the control view to the six header slots', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);

		expect(views.control.length).toBe(PROTOCOL.CONTROL_SLOT_COUNT);
	});

	it('creates a Uint8Array payload view', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);

		expect(views.payload).toBeInstanceOf(Uint8Array);
	});

	it('starts the payload view at the payload byte offset', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);

		expect(views.payload.byteOffset).toBe(PROTOCOL.PAYLOAD_BYTE_OFFSET);
	});

	it('sizes the payload view to the payload ceiling', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);

		expect(views.payload.byteLength).toBe(PROTOCOL.PAYLOAD_CEILING);
	});
});
