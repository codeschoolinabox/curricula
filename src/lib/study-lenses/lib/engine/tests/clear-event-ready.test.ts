import { describe, expect, it } from 'vitest';

import clearEventReady from '../worker/clear-event-ready.js';
import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';

describe('clearEventReady', () => {
	it('clears the event-ready flag', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		Atomics.store(
			views.control,
			PROTOCOL.EVENT_READY_INDEX,
			PROTOCOL.EVENT_READY,
		);

		clearEventReady(views);

		expect(Atomics.load(views.control, PROTOCOL.EVENT_READY_INDEX)).toBe(
			PROTOCOL.EVENT_NOT_READY,
		);
	});

	it('leaves the pause flag untouched', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		Atomics.store(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);

		clearEventReady(views);

		expect(Atomics.load(views.control, PROTOCOL.PAUSE_INDEX)).toBe(
			PROTOCOL.PAUSE_PAUSED,
		);
	});
});
