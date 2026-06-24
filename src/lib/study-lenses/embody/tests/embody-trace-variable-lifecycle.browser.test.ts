/**
 * @file Real-Worker fidelity tests for the embody `traceVariableLifecycle` raw
 * method. Unlike the node peer (`embody-trace-variable-lifecycle.test.ts`, fake
 * transport, same-thread), these spawn the actual module Worker + SharedArrayBuffer
 * — the only honest proof the forwarded run settles on the real engine. No hidden
 * seam is needed: the public 1-arg method drives the real transport directly.
 *
 * @see ../index.ts — `forwardTraceVariableLifecycle`
 * @see ../lib/evaluating/tracers/variables/tests/trace-variables.browser.test.ts — the mirrored real-Worker test
 */

import { describe, expect, it } from 'vitest';

import embody from '../index.js';

describe('embody traceVariableLifecycle (browser, real worker)', () => {
	it('completes: streams a real variable trace on an apex-real snippet', async () => {
		const { events, settlement } = await embody(
			'let total = 0; for (let i = 0; i < 2; i = i + 1) { total = total + i; }',
		).events.evaluation.traceVariableLifecycle().result;

		expect(settlement.outcome).toBe('completed');
		expect(events.length).toBeGreaterThan(0);
		expect(events.map((event) => event.event)).toContain('scope-push');
	});

	it('forwards the seconds budget: a 0.2s budget times out far under the 5s default', async () => {
		const { settlement } = await embody('while (true) { let x = 1; }')
			.events.evaluation.traceVariableLifecycle({ seconds: 0.2 }).result;

		expect(settlement.outcome).toBe('timed-out');
		expect(settlement.engineError?.cause).toBe('timeout');
		expect(settlement.halt).toBeNull();
		// The honest discriminant. `durationMs` is the engine's CONSUMED-BUDGET
		// figure — capped at `seconds * 1000` by the budget clock's `remainingMs >= 0`
		// invariant — NOT wall-clock elapsed. So a forwarded 0.2s budget caps it at
		// ~200ms by construction; `< 2000` is logically impossible to breach on a
		// 0.2s budget regardless of host scheduling jitter. A forward that DROPPED
		// `options` would fall back to the engine DEFAULT_SECONDS (5s) and settle at
		// durationMs ~ 5000 — so this is the assertion that catches a dropped-options
		// regression. (The mirrored tracer browser test asserts the timeout but NOT
		// durationMs; this is B2's incremental coverage over it.)
		expect(settlement.durationMs).toBeLessThan(2000);
	});
});
