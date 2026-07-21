/**
 * Real-transport-only evidence: a worker crash AFTER the ready
 * handshake produces exactly ONE failure event. Pins the
 * one-event-per-crash invariant against the duplicate-error-listener
 * regression (a load-phase listener left attached plus a post-ready
 * listener would enqueue the same crash twice). The crash is scheduled
 * BY the program so its error event reliably follows the natural-end
 * halt on this repo's pinned Chromium target. Driven directly against
 * the transport, not evaluate(): the pump stops pulling after the
 * first halt/error event, so a second orphaned event is invisible at
 * that tier — this is the ONLY tier that can catch the regression.
 */

import { describe, expect, it } from 'vitest';

import createWorkerTransport from '../../../worker/transport.js';

describe('post-ready crash (real transport)', () => {
	it('delivers exactly one failure event for one post-ready crash', async () => {
		const transport = createWorkerTransport();
		await transport.start({
			code: "setTimeout(() => { throw new Error('post-ready crash'); }, 0);",
			// Inline `new Worker(new URL(...))` — keep the adjacency webpack needs.
			workerFactory: () =>
				new Worker(
					new URL('../../../testing/test-worker-entry.ts', import.meta.url),
					{ type: 'module' },
				),
			workerConfig: {},
			strict: true,
		});
		const first = (await transport.next()) as { kind: string };
		const second = (await transport.next()) as { kind: string; name?: string };
		const third = await Promise.race([
			transport.next().then(() => 'third-event'),
			new Promise((resolve) => {
				setTimeout(() => resolve('no-third-event'), 200);
			}),
		]);
		transport.terminate();

		expect([first.kind, second.kind, second.name, third]).toEqual([
			'halt',
			'failure',
			'EngineWorkerError',
			'no-third-event',
		]);
	});
});
