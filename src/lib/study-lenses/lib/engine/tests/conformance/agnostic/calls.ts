import { describe, expect, it } from 'vitest';

import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';

import type { AgnosticRunner } from './types.js';

/** The synchronous call channel — happy path first, then exceptions. */
export default function registerCalls(runner: AgnosticRunner): void {
	describe(`calls (${runner.name})`, () => {
		it('routes the response into the program and out as an item', async () => {
			const handle = runner.run("emit(call('ping'));");
			const { items } = await handle.result;

			expect(items).toEqual(['ping']);
		});

		it('settles call-error when onCall is absent', async () => {
			const handle = runner.run("call('ping');", {
				threadLogic: { onMessage: REFERENCE_THREAD_LOGIC.onMessage },
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'call-error',
			]);
		});

		it('settles call-error when onCall throws synchronously', async () => {
			const handle = runner.run("call('ping');", {
				threadLogic: {
					onMessage: REFERENCE_THREAD_LOGIC.onMessage,
					onCall() {
						throw new Error('no service');
					},
				},
			});
			const { settlement } = await handle.result;

			expect(settlement.error?.cause).toBe('call-error');
		});
	});
}
