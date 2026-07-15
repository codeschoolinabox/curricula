import { describe, expect, it } from 'vitest';

import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import writeResumeSignal from '../worker/write-resume-signal.js';

describe('writeResumeSignal', () => {
	it('clears the pause flag', () => {
		const views = createBufferViews(
			new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE),
		);
		Atomics.store(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);

		writeResumeSignal(views);

		expect(Atomics.load(views.control, PROTOCOL.PAUSE_INDEX)).toBe(
			PROTOCOL.PAUSE_RUNNING,
		);
	});
});
