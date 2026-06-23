import { describe, expect, it } from 'vitest';

import traceVariables from '../trace-variables.js';

/**
 * Smoke test against the REAL engine transport: a Worker spawned from
 * `variables-worker-entry.ts` over SharedArrayBuffer (COOP/COEP served by the
 * vitest browser project). It proves the plumbing the same-thread fake cannot —
 * worker spawn, the pause/resume protocol, and clone-transport of the scope
 * table — not the exact event semantics (the Node suites own those).
 */
describe('traceVariables (browser, real worker)', () => {
	it('runs a real worker and streams a completed trace', async () => {
		const handle = traceVariables(
			'let total = 0; for (let i = 0; i < 2; i = i + 1) { total = total + i; }',
		);

		const { events, settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
		expect(events.length).toBeGreaterThan(0);
		expect(events.map((event) => event.event)).toContain('scope-push');
	});
});
