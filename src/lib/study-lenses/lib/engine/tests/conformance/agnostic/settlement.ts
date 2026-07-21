import { describe, expect, it } from 'vitest';

import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { ThreadLogic } from '../../../types.js';

import type { AgnosticRunner } from './types.js';

/**
 * Outcome classification and carriage. The strict rows double as the
 * halt-routing guard: a SyntaxError from strict-mode compilation must
 * route through the halt path (errored), never the worker-error path —
 * a transport that catches construction errors outside the program
 * fails here.
 */
export default function registerSettlement(runner: AgnosticRunner): void {
	describe(`settlement (${runner.name})`, () => {
		it('carries the reference-stamped halt on completion', async () => {
			const handle = runner.run('');
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.halt]).toEqual([
				'completed',
				{
					kind: 'natural-end',
					name: 'natural-end',
					message: '',
					viaReference: true,
				},
			]);
		});

		it('carries the worker-authored halt on a thrown error', async () => {
			const handle = runner.run("throw new TypeError('boom');");
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string }).name,
			]).toEqual(['errored', 'TypeError']);
		});

		it('attaches the refinement for a recognized limit throw', async () => {
			const handle = runner.run(LIMIT_THROW_CODE);
			const { settlement } = await handle.result;

			expect(settlement.refinement).toEqual({ limit: 'reference' });
		});

		it('omits the refinement for an unrecognized throw', async () => {
			const handle = runner.run("throw new RangeError('learner');");
			const { settlement } = await handle.result;

			expect('refinement' in settlement).toBe(false);
		});

		it('keeps the halt and drops the refinement when refineError throws', async () => {
			const throwingRefine: ThreadLogic = {
				onMessage: REFERENCE_THREAD_LOGIC.onMessage,
				refineError() {
					throw new Error('bad refiner');
				},
			};
			const handle = runner.run("throw new Error('kapot');", {
				threadLogic: throwingRefine,
			});
			const { settlement } = await handle.result;

			expect([
				settlement.error?.cause,
				(settlement.halt as { message: string }).message,
				'refinement' in settlement,
			]).toEqual(['hook-error', 'kapot', false]);
		});

		it('settles hook-error when onMessage throws', async () => {
			const throwingLogic: ThreadLogic = {
				onMessage() {
					throw new Error('bad hook');
				},
			};
			const handle = runner.run("emit('x');", {
				threadLogic: throwingLogic,
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'hook-error',
			]);
		});

		it('halts errored on a clone-unsafe emit', async () => {
			const handle = runner.run('emit(() => {});');
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.halt === undefined]).toEqual([
				'errored',
				false,
			]);
		});

		it('settles worker-error on a clone-unsafe worker config', async () => {
			const handle = runner.run('', { workerConfig: { fn: () => {} } });
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});

		it('routes the strict-default SyntaxError through the halt path', async () => {
			const handle = runner.run('with (Math) { emit(PI); }');
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string }).name,
			]).toEqual(['errored', 'SyntaxError']);
		});

		it('runs sloppy constructs under strict false', async () => {
			const handle = runner.run('with (Math) { emit(PI); }', {
				strict: false,
			});
			const { items } = await handle.result;

			expect(items).toEqual([Math.PI]);
		});
	});
}

// The module execution axis is deliberately absent from this tier: the
// fake runs same-thread via `new Function` and cannot reproduce genuine
// ES-module semantics (import.meta, real top-level await), so there is
// no second transport to hold module behavior in sync against. Module
// conformance is real-transport-only — see
// tests/conformance/transport/module-execution.browser.test.ts.

const LIMIT_THROW_CODE =
	"const e = new Error('limit hit'); e.name = 'ReferenceLimitError'; throw e;";
