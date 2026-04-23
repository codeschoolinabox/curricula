/**
 * @file EVENT_READY pause-protocol parity tests — browser project.
 *
 * Verifies that after M.3 the run engine's timer handler consults
 * EVENT_READY (same shape as the trace engine): budget depletion
 * still marks `timedOut` regardless of whether events are flowing.
 *
 * @remarks M.3 changes the shape of `onTimeout` inside `startTimeout`
 * (run.ts) from a blind `timedOut = true` into the sequence:
 * deduct elapsed → check exhaustion → check EVENT_READY → reschedule
 * or set `timedOut`. These tests triangulate the exhaustion check:
 * without it, an infinite loop that continuously emits `console`
 * events would keep EVENT_READY=1 forever and never time out. The
 * race-dependent "reschedule actually runs" path is exercised in
 * M.5's timer-pause-yield tests, where pauseTimeout/startTimeout
 * around yield produce the visible "stepping time doesn't count"
 * behavior.
 */

import { describe, expect, it, vi } from 'vitest';

import { format } from '../../../../api/format.js';
import createRunGenerator from '../run.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createRunGenerator EVENT_READY timer-guard (browser)', () => {
	describe('Worker stuck without events', () => {
		it('timer fires timeout within remainingMs when no trap is hit', async () => {
			const code = format('while (true) { let x = 1; }\n');
			const result = await createRunGenerator(code, { seconds: 0.1 });
			if (result.ok) throw new Error('expected ok:false');
			expect(result.error.kind).toBe('timeout');
		});
	});

	describe('Worker emits events continuously', () => {
		it('infinite event-emitting loop still times out (EVENT_READY does not mask exhaustion)', async () => {
			const code = format('while (true) { console.log(1); }\n');
			const result = await createRunGenerator(code, {
				seconds: 0.1,
				io: {
					console: {
						log: async () => {
							/* drain fast, no stall */
						},
					},
				},
			});
			if (result.ok) throw new Error('expected ok:false');
			expect(result.error.kind).toBe('timeout');
		});
	});
});
