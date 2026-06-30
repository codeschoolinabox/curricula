/**
 * @file Real-Worker fidelity tests for the `trace-debugging` lens's async
 * orchestration seam (`runTrace`). Unlike the Node peer (`run-trace.test.ts`,
 * which drives a hand-built fake handle), these spawn the ACTUAL variables-tracer
 * Web Worker over a SharedArrayBuffer via `embody(<JEJ>).evaluation.events
 * .traceVariableLifecycle()` — proving the four settlement classes (completed /
 * errored / cancelled / timed-out) settle correctly in the real
 * cross-origin-isolated browser. This is the harness's reason for existing.
 *
 * Runs only under the vitest `browser` project (`vitest.workspace.ts`: chromium /
 * Playwright, COOP/COEP middleware, `--enable-features=SharedArrayBuffer`,
 * `fileParallelism: false`, `retry: 2`) — `npm run test:browser`. The seam is
 * driven DIRECTLY (a `.ts` test cannot import the `.tsx` shell); no React, no
 * jsdom, no fake. Every case awaits `controller.done` before asserting (S3).
 */

import { describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import type {
	VariablesSettlement,
	VariablesTraceEvent,
} from '../../../embody/types.js';
import runTrace from '../run-trace.js';
import type { TraceController } from '../types.js';

vi.setConfig({ testTimeout: 60_000 });

// ─── Test infrastructure ────────────────────────────────────────

/** Push-recording callbacks (the real settlement/events flow into these arrays). */
function makeCallbacks(): {
	readonly callbacks: {
		readonly onEvent: (event: VariablesTraceEvent) => void;
		readonly onSettlement: (settlement: VariablesSettlement) => void;
		readonly onAdmissionError: (error: unknown) => void;
	};
	readonly events: VariablesTraceEvent[];
	readonly settlements: VariablesSettlement[];
	readonly admissionErrors: unknown[];
} {
	const events: VariablesTraceEvent[] = [];
	const settlements: VariablesSettlement[] = [];
	const admissionErrors: unknown[] = [];
	return {
		callbacks: {
			onEvent: (event): void => {
				events.push(event);
			},
			onSettlement: (settlement): void => {
				settlements.push(settlement);
			},
			onAdmissionError: (error): void => {
				admissionErrors.push(error);
			},
		},
		events,
		settlements,
		admissionErrors,
	};
}

const alwaysMounted = (): boolean => true;

describe('runTrace (browser, real worker + embody)', () => {
	it('streams events and settles completed for a finite program', async () => {
		const recorder = makeCallbacks();
		const controller = runTrace(
			() =>
				embody(
					'let total = 0; for (let i = 0; i < 2; i = i + 1) { total = total + i; }',
				).evaluation.events.traceVariableLifecycle(),
			recorder.callbacks,
			alwaysMounted,
		);
		await controller.done;

		expect([
			recorder.settlements[0]?.outcome,
			recorder.events.length > 0,
			recorder.events.some((event) => event.event === 'scope-push'),
		]).toEqual(['completed', true, true]);
	});

	it('settles errored with a stamped TypeError halt on a const reassignment', async () => {
		const recorder = makeCallbacks();
		const controller = runTrace(
			() =>
				embody('const c = 1; c = 2;').evaluation.events.traceVariableLifecycle(),
			recorder.callbacks,
			alwaysMounted,
		);
		await controller.done;

		const settlement = recorder.settlements[0];
		expect([
			settlement?.outcome,
			settlement?.halt?.errorName,
			typeof settlement?.halt?.nodePath,
		]).toEqual(['errored', 'TypeError', 'string']);
	});

	it('settles cancelled when cancel() interrupts a live run', async () => {
		const recorder = makeCallbacks();
		let controller: TraceController | null = null;
		// Cancel as soon as the run streams its first event — a genuinely LIVE run
		// (the infinite loop never ends on its own, so cancel deterministically wins
		// before any budget; there is no `{ seconds }` here).
		const callbacks = {
			onEvent: (event: VariablesTraceEvent): void => {
				recorder.events.push(event);
				controller?.cancel();
			},
			onSettlement: recorder.callbacks.onSettlement,
			onAdmissionError: recorder.callbacks.onAdmissionError,
		};
		controller = runTrace(
			() =>
				embody(
					'while (true) { let x = 1; }',
				).evaluation.events.traceVariableLifecycle(),
			callbacks,
			alwaysMounted,
		);
		await controller.done;

		expect([
			recorder.settlements[0]?.outcome,
			recorder.settlements[0]?.halt,
		]).toEqual(['cancelled', null]);
	});

	it('settles timed-out for an infinite loop under a tight seconds budget', async () => {
		const recorder = makeCallbacks();
		const controller = runTrace(
			() =>
				embody(
					'while (true) { let x = 1; }',
				).evaluation.events.traceVariableLifecycle({ seconds: 0.2 }),
			recorder.callbacks,
			alwaysMounted,
		);
		await controller.done;

		const settlement = recorder.settlements[0];
		expect([
			settlement?.outcome,
			settlement?.engineError?.cause,
			settlement?.halt,
		]).toEqual(['timed-out', 'timeout', null]);
	});
});
