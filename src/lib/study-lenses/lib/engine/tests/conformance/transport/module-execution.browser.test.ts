/**
 * Real-transport-only evidence: the `execution: 'module'` axis end to
 * end through evaluate() — globals delivered on globalThis, a genuine
 * ES module (top-level await settling to an async natural end), and a
 * module-evaluation rejection carried as an errored halt. The fake runs
 * same-thread via `new Function` and cannot reproduce ES-module
 * semantics, so a green fake says nothing about these rows.
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { EvaluateSpec } from '../../../types.js';

function moduleRun(code: string, overrides: Partial<EvaluateSpec> = {}) {
	const spec: EvaluateSpec = {
		code,
		// Inline `new Worker(new URL(...))` — keep the adjacency webpack needs.
		workerFactory: () =>
			new Worker(
				new URL('../../../testing/test-worker-entry.ts', import.meta.url),
				{ type: 'module' },
			),
		threadLogic: REFERENCE_THREAD_LOGIC,
		execution: 'module',
		...overrides,
	};
	return evaluate(spec);
}

describe('module execution (real transport)', () => {
	it('delivers globals on globalThis and completes after top-level await', async () => {
		const handle = moduleRun(
			'await Promise.resolve(); emit(typeof globalThis.emit);',
		);
		const { items, settlement } = await handle.result;

		expect([items, settlement.outcome]).toEqual([['function'], 'completed']);
	});

	it('carries the worker-authored halt on a module-evaluation rejection', async () => {
		const handle = moduleRun("await Promise.reject(new TypeError('boom'));");
		const { settlement } = await handle.result;

		expect([
			settlement.outcome,
			(settlement.halt as { name: string }).name,
		]).toEqual(['errored', 'TypeError']);
	});

	it('settles worker-error, never hangs, when a global cannot install on globalThis', async () => {
		const handle = moduleRun('', {
			workerConfig: { invalidGlobalKey: 'undefined' },
		});
		const { settlement } = await handle.result;

		expect([settlement.outcome, settlement.error?.cause]).toEqual([
			'errored',
			'worker-error',
		]);
	});
});
