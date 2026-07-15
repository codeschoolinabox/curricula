import { describe, expect, it } from 'vitest';

import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import readCallResponse from '../worker/read-call-response.js';
import writeCallResponse from '../worker/write-call-response.js';

describe('readCallResponse', () => {
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
