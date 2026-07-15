/**
 * @file Node tests for the embody `traceVariableLifecycle` raw method (the
 * variables-tracer surface on `events.evaluation`). These run same-thread via
 * the engine fake transport — they exercise the real validate → instrument →
 * engine pipeline without a Worker. Real-Worker fidelity (settlement classes,
 * the `seconds` budget) lives in the peer `*.browser.test.ts`.
 *
 * @see ../index.ts — `forwardTraceVariableLifecycle` + the `makeEvaluationEvents` dispatch
 * @see ../lib/evaluating/trace/variables/tests/trace-variables.test.ts — the mirrored seam
 */

import { describe, expect, it } from 'vitest';

import createFakeTransport from '../../study-lenses--deprecated-architecture/lib/engine/testing/fake-transport.js';
import type { CreateTransport } from '../../study-lenses--deprecated-architecture/lib/engine/worker/types.js';
import embody from '../index.js';
import variablesThreadLogic from '../lib/evaluating/trace/variables/variables-thread-logic.js';
import variablesWorkerSetup from '../lib/evaluating/trace/variables/variables-worker-setup.js';
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

describe('embody traceVariableLifecycle (node, synchronous admission gate)', () => {
	it('propagates the tracer throw on non-JEJ real source', () => {
		// `var x = 1` parses fine but is not Just-Enough-JavaScript: the real apex
		// forward hands it to the tracer, whose eager JEJ gate throws synchronously
		// at the call (no Worker spawned). The forward has NO try/catch — the throw
		// propagates naked, so the message is the tracer's own, distinct from the
		// canned-scenario throw (the no-wrap guarantee lives in that naked forward).
		expect(() =>
			embody('var x = 1').events.evaluation.traceVariableLifecycle(),
		).toThrow(/not Just-Enough-JavaScript/u);
	});

	it('propagates the tracer throw on unparseable real source', () => {
		// `const` tokenizes fine but fails at parse: the real parse-fail forward
		// hands the raw source to the tracer, whose parse gate throws synchronously
		// before any Worker is spawned — so the synchronous `.toThrow` form (not
		// `.rejects`) is correct.
		expect(() =>
			embody('const').events.evaluation.traceVariableLifecycle(),
		).toThrow(/not valid JavaScript/u);
	});
});

describe('embody traceVariableLifecycle (node, canned scenario rejection)', () => {
	it('throws on the apex OK scenario — the inverted gate (created:true still rejected)', () => {
		const snippet = embody('OK');
		// Machine-verify the inversion PREMISE: apex OK really is created:true. Without
		// this, a silent drift of status.created to false would leave the throw green
		// while the inversion claim below became false. The gate is real-composition-
		// vs-canned-scenario, NOT status.created: even apex OK (created:true) is canned —
		// its source.code is the keyword sentinel 'OK', not executable JS — so the
		// method throws (realSource === null) and never forwards. A consumer gating on
		// status.created would get this exactly backwards.
		expect(snippet.status.created).toBe(true);
		expect(() => snippet.events.evaluation.traceVariableLifecycle()).toThrow(
			/canned scenario/u,
		);
	});

	it('throws on a FAIL_AT_* canned scenario', () => {
		// A non-apex canned builder (buildFailAtTokenizeSnippet, not buildApexSnippet):
		// the gate is STRUCTURAL, not apex-specific — every canned builder passes
		// makeEvaluationEvents(runInstance, null), every real path passes source.code.
		// So one apex case (OK) + one non-apex case here is sufficient scope; the EVAL_*
		// apex scenarios share buildApexSnippet's null literal and need no separate case.
		expect(() =>
			embody('FAIL_AT_TOKENIZE').events.evaluation.traceVariableLifecycle(),
		).toThrow(/canned scenario/u);
	});
});
