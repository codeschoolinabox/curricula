/**
 * @file EVENT_READY pause-protocol parity tests — browser project.
 *
 * Verifies that after M.3 the intercept engine's timer handler consults
 * EVENT_READY (same shape as the trace engine): budget depletion
 * still marks `timedOut` regardless of whether events are flowing.
 *
 * @remarks M.3 changes the shape of `onTimeout` inside `startTimeout`
 * (intercept.ts) from a blind `timedOut = true` into the sequence:
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

import format from '../../../formatting/format.js';
import createInterceptGenerator from '../intercept.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createInterceptGenerator EVENT_READY timer-guard (browser)', () => {
	describe('Worker stuck without events', () => {
		it('timer fires timeout within remainingMs when no trap is hit', async () => {
			const code = await format('while (true) { let x = 1; }\n');
			const result = await createInterceptGenerator(code, { seconds: 0.1 });
			if (result.ok || !result.error)
				throw new Error('expected ok:false with error');
			expect(result.error.kind).toBe('timeout');
		});
	});

	describe('Worker emits events continuously', () => {
		it('infinite event-emitting loop still times out (EVENT_READY does not mask exhaustion)', async () => {
			const code = await format('while (true) { console.log(1); }\n');
			const result = await createInterceptGenerator(code, {
				seconds: 0.1,
				io: {
					console: {
						log: async () => {
							/* drain fast, no stall */
						},
					},
				},
			});
			if (result.ok || !result.error)
				throw new Error('expected ok:false with error');
			expect(result.error.kind).toBe('timeout');
		});

		it('infinite event-emitting loop times out within ~budget/YIELD_CHARGE_MS events', async () => {
			// Pins the flat per-yield charge: with budget=100ms and a 5ms
			// charge per pause, ≤ ceil(100/5)=20 events should be drained
			// before timeout fires. Generous epsilon absorbs slow CI:
			// the assertion fails only if the charge regresses to a much
			// smaller value (or zero), letting hundreds of events through.
			const code = await format('while (true) { console.log(1); }\n');
			const result = await createInterceptGenerator(code, {
				seconds: 0.1,
				io: {
					console: {
						log: async () => {
							/* drain fast, no stall */
						},
					},
				},
			});
			if (result.ok || !result.error)
				throw new Error('expected ok:false with error');
			expect(result.error.kind).toBe('timeout');
			// budget(100ms) / charge(5ms) = 20 events, plus epsilon
			// for the worker-active deduction occasionally rounding
			// remainingMs down by a sub-millisecond residue.
			expect(result.events.length).toBeLessThanOrEqual(40);
		});
	});
});
