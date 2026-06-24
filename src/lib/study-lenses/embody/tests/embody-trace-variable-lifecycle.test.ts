/**
 * @file Node tests for the embody `traceVariableLifecycle` raw method (the
 * variables-tracer surface on `events.evaluation`). These run same-thread via
 * the engine fake transport — they exercise the real validate → instrument →
 * engine pipeline without a Worker. Real-Worker fidelity (settlement classes,
 * the `seconds` budget) lives in the peer `*.browser.test.ts`.
 *
 * @see ../index.ts — `forwardTraceVariableLifecycle` + the `makeEvaluationEvents` dispatch
 * @see ../lib/evaluating/tracers/variables/tests/trace-variables.test.ts — the mirrored seam
 */

import { describe, expect, it } from 'vitest';

import createFakeTransport from '../../lib/engine/testing/fake-transport.js';
import type { CreateTransport } from '../../lib/engine/worker/types.js';
import embody from '../index.js';
import variablesThreadLogic from '../lib/evaluating/tracers/variables/variables-thread-logic.js';
import variablesWorkerSetup from '../lib/evaluating/tracers/variables/variables-worker-setup.js';
import type {
	TraceVariableLifecycleOptions,
	VariablesTraceHandle,
} from '../types.js';

/**
 * The public `traceVariableLifecycle` member is 1-arg; the runtime value also
 * accepts a 2nd `createTransport` engine seam (wider-function assignability
 * hides it from the interface). This sound widening cast — NOT `as unknown as`
 * — reaches the hidden arg so a Node test runs the real pipeline same-thread.
 */
type WithSeam = (
	options?: TraceVariableLifecycleOptions,
	createTransport?: CreateTransport,
) => VariablesTraceHandle;

/** A same-thread engine transport replaying the variables tier's worker logic. */
function fakeTransport(): CreateTransport {
	return createFakeTransport(variablesWorkerSetup, variablesThreadLogic);
}

describe('embody traceVariableLifecycle (node, fake transport)', () => {
	it('streams a completed variable trace on a real apex snippet', async () => {
		const handle = (
			embody('let x = 1; x;').events.evaluation
				.traceVariableLifecycle as WithSeam
		)({}, fakeTransport());

		const { events, settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
		// Halt shape is tracer-authored output — a hardcoded Fake-It handle that
		// never ran the engine could not fabricate it (raises the Fake-It bar; AR-3).
		expect(settlement.halt).toMatchObject({
			natural: true,
			errorName: '',
			message: '',
			nodePath: null,
		});
		const kinds = events.map((event) => event.event);
		expect(kinds).toContain('scope-push');
		expect(kinds).toContain('initialize');
		expect(kinds).toContain('read');
	});
});
