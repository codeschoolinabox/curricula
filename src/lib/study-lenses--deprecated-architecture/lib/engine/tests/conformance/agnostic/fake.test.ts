import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import createFakeTransport from '../../../testing/fake-transport.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import referenceWorkerSetup from '../../../testing/reference-worker-setup.js';
import type { EvaluateSpec } from '../../../types.js';

import registerCalls from './calls.js';
import registerLifecycle from './lifecycle.js';
import registerSettlement from './settlement.js';
import registerStreaming from './streaming.js';
import type { AgnosticRunner } from './types.js';

const fakeRunner: AgnosticRunner = {
	name: 'fake',
	run(code, overrides = {}) {
		const spec: EvaluateSpec = {
			code,
			// Fake runs same-thread; the factory is never invoked.
			workerFactory: () => {
				throw new Error('fake transport must not construct a worker');
			},
			threadLogic: REFERENCE_THREAD_LOGIC,
			...overrides,
		};
		return evaluate(
			spec,
			createFakeTransport(referenceWorkerSetup, spec.threadLogic),
		);
	},
};

describe('agnostic conformance runner (fake)', () => {
	it('exists for the file-level no-empty-test-file rule; the imported spec modules register the real suite', () => {
		expect(fakeRunner.name).toBe('fake');
	});
});

registerLifecycle(fakeRunner);
registerStreaming(fakeRunner);
registerSettlement(fakeRunner);
registerCalls(fakeRunner);
