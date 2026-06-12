/**
 * Real-transport-only evidence: the worker is REALLY blocked by the
 * pause protocol (Atomics fidelity) and the environment is
 * cross-origin isolated. The fake buffers without blocking, so a green
 * fake says nothing about these rows.
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { EvaluateSpec } from '../../../types.js';

const WORKER_URL = new URL(
	'../../../testing/test-worker-entry.ts',
	import.meta.url,
);

function realRun(code: string) {
	const spec: EvaluateSpec = {
		code,
		workerUrl: WORKER_URL,
		threadLogic: REFERENCE_THREAD_LOGIC,
	};
	return evaluate(spec);
}

describe('pause fidelity (real transport)', () => {
	it('has shared memory available (COOP/COEP served)', () => {
		expect(typeof SharedArrayBuffer).toBe('function');
	});

	it('holds a claimed, unpulled stream open — the worker is really blocked', async () => {
		const handle = realRun("emit('a'); emit('b');");
		const iterator = handle[Symbol.asyncIterator]();
		await iterator.next();
		const raced = await Promise.race([
			handle.result.then(() => 'settled'),
			new Promise((resolve) => {
				setTimeout(() => resolve('still-blocked'), 200);
			}),
		]);
		await iterator.return?.();

		expect(raced).toBe('still-blocked');
	});
});
