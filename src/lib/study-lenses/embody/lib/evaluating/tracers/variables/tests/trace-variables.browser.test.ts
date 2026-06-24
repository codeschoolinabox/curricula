import { describe, expect, it } from 'vitest';

import traceVariables from '../trace-variables.js';

/**
 * Fidelity tests against the REAL engine transport: a Worker spawned from
 * `variables-worker-entry.ts` over SharedArrayBuffer (COOP/COEP served by the
 * vitest browser project). These prove what the same-thread Node fake cannot —
 * worker spawn, the pause/resume protocol, clone-transport across the real
 * postMessage boundary, real cancel/termination, and the real timer. The exact
 * event semantics and the full ZOMBIES surface are the Node suites' job; this
 * tier deliberately keeps the slow real-worker layer to ONE case per settlement
 * class the transport handles distinctly (engine doctrine: the real layer
 * certifies fidelity, not logic).
 */
describe('traceVariables (browser, real worker)', () => {
	it('completes: streams a real trace and settles completed', async () => {
		const handle = traceVariables(
			'let total = 0; for (let i = 0; i < 2; i = i + 1) { total = total + i; }',
		);

		const { events, settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
		expect(events.length).toBeGreaterThan(0);
		expect(events.map((event) => event.event)).toContain('scope-push');
	});

	it('errors: authors a stamped halt for a runtime error over the real clone boundary', async () => {
		const { settlement } = await traceVariables('const c = 1; c = 2;').result;

		expect(settlement.outcome).toBe('errored');
		expect(settlement.halt?.errorName).toBe('TypeError');
		expect(typeof settlement.halt?.nodePath).toBe('string');
	});

	it('cancels: breaking a for-await terminates the real worker and settles cancelled', async () => {
		const handle = traceVariables('let a = 1; let b = 2; let c = 3;');

		const seen: string[] = [];
		for await (const event of handle) {
			seen.push(event.event);
			break;
		}
		const { settlement } = await handle.result;

		expect(seen.length).toBeGreaterThanOrEqual(1);
		expect(settlement.outcome).toBe('cancelled');
		expect(settlement.halt).toBeNull();
	});

	it('times out: a budget-exhausting loop settles timed-out via the engine timer', async () => {
		const { settlement } = await traceVariables('while (true) { let x = 1; }', {
			seconds: 0.2,
		}).result;

		expect(settlement.outcome).toBe('timed-out');
		expect(settlement.engineError?.cause).toBe('timeout');
		expect(settlement.halt).toBeNull();
	});
});
