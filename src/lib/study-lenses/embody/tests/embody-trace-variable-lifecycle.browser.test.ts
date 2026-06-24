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
});
