import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { EvaluateSpec } from '../../../types.js';

import registerCalls from './calls.js';
import registerLifecycle from './lifecycle.js';
import registerSettlement from './settlement.js';
import registerStreaming from './streaming.js';
import type { AgnosticRunner } from './types.js';

const realRunner: AgnosticRunner = {
	name: 'real',
	run(code, overrides = {}) {
		const spec: EvaluateSpec = {
			code,
			// Inline `new Worker(new URL(...))` — keep the adjacency webpack needs.
			workerFactory: () =>
				new Worker(
					new URL('../../../testing/test-worker-entry.ts', import.meta.url),
					{ type: 'module' },
				),
			threadLogic: REFERENCE_THREAD_LOGIC,
			...overrides,
		};
		return evaluate(spec);
	},
};

describe('agnostic conformance runner (real)', () => {
	it('exists for the file-level no-empty-test-file rule; the imported spec modules register the real suite', () => {
		expect(realRunner.name).toBe('real');
	});
});

registerLifecycle(realRunner);
registerStreaming(realRunner);
registerSettlement(realRunner);
registerCalls(realRunner);
