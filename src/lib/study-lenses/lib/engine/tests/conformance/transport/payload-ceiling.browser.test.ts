/**
 * Real-transport-only evidence: the bounded call channel's 8168-byte
 * payload ceiling, end to end over real shared memory. The fake never
 * size-limits (structuredClone has no ceiling), so a green fake says
 * nothing about these rows.
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { EvaluateSpec, ThreadLogic } from '../../../types.js';
import PROTOCOL from '../../../worker/protocol.js';

const WORKER_URL = new URL(
	'../../../testing/test-worker-entry.ts',
	import.meta.url,
);

function realRun(code: string, threadLogic: ThreadLogic) {
	const spec: EvaluateSpec = {
		code,
		workerUrl: WORKER_URL,
		threadLogic,
	};
	return evaluate(spec);
}

describe('call payload ceiling (real transport)', () => {
	it('round-trips a response of exactly the ceiling size', async () => {
		const logic: ThreadLogic = {
			onMessage: REFERENCE_THREAD_LOGIC.onMessage,
			onCall() {
				return 'x'.repeat(PROTOCOL.PAYLOAD_CEILING);
			},
		};
		const handle = realRun("emit(call('big').length);", logic);
		const { items } = await handle.result;

		expect(items).toEqual([PROTOCOL.PAYLOAD_CEILING]);
	});

	it('settles call-error one byte over the ceiling', async () => {
		const logic: ThreadLogic = {
			onMessage: REFERENCE_THREAD_LOGIC.onMessage,
			onCall() {
				return 'x'.repeat(PROTOCOL.PAYLOAD_CEILING + 1);
			},
		};
		const handle = realRun("call('big');", logic);
		const { settlement } = await handle.result;

		expect([settlement.outcome, settlement.error?.cause]).toEqual([
			'errored',
			'call-error',
		]);
	});
});
