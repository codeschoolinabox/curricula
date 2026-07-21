/**
 * Real-transport-dependent behavior — browser project. Rows that are
 * transport-agnostic (completion, drain, drop-vs-yield, break≡cancel,
 * call classification, hook failures, halt carriage, post-settlement)
 * live in tests/conformance/agnostic/ and run against BOTH transports;
 * this file keeps only what needs a really-blocked worker: pause
 * parking, the timer family, the in-flight call discard, and
 * environment failures.
 *
 * Deliberately untested: the concurrent-iterator zone (an iterator
 * created after the engine's first drain pull) — one stream, silently
 * split, contractually unsupported; asserted neither way. Also
 * declared untested: the timer's reschedule-while-paused branch (a
 * pending message at the exact timeout tick) — a genuinely narrow race
 * the real transport cannot force deterministically; a fake-timer unit
 * over the budget would need createBudget exported (follow-up, not
 * this tier's job).
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../testing/reference-thread-logic.js';
import type { EvaluateSpec, ThreadLogic } from '../types.js';

function referenceSpec(
	code: string,
	overrides: Partial<EvaluateSpec> = {},
): EvaluateSpec {
	return {
		code,
		// Inline `new Worker(new URL(...))` — the adjacency webpack's static
		// worker detection needs (and that the production consumer uses);
		// splitting the URL into a const or a helper re-breaks the bundle at
		// runtime (silent until deployment). See engine `EvaluateSpec.workerFactory`.
		workerFactory: () =>
			new Worker(new URL('../testing/test-worker-entry.ts', import.meta.url), {
				type: 'module',
			}),
		threadLogic: REFERENCE_THREAD_LOGIC,
		...overrides,
	};
}

function delay(ms: number): Promise<'still-pending'> {
	return new Promise((resolve) => {
		setTimeout(() => resolve('still-pending'), ms);
	});
}

describe('evaluate (real transport)', () => {
	describe('iterator-first backpressure (pause parking)', () => {
		it('does not settle while the claimed stream holds the run', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b'); emit('c');"),
			);
			const iterator = handle[Symbol.asyncIterator]();
			await iterator.next();
			const raced = await Promise.race([
				handle.result.then(() => 'settled'),
				delay(200),
			]);

			expect(raced).toBe('still-pending');
		});
	});

	describe('mid-stream consumer stops (parked worker)', () => {
		it('settles cancelled between pulls', async () => {
			const handle = evaluate(referenceSpec("emit('a'); emit('b');"));
			const iterator = handle[Symbol.asyncIterator]();
			await iterator.next();
			handle.cancel();
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('cancelled');
		});

		it('settles failed with the failReason reference between pulls', async () => {
			const reason = { prediction: 'wrong' };
			const handle = evaluate(referenceSpec("emit('a'); emit('b');"));
			const iterator = handle[Symbol.asyncIterator]();
			await iterator.next();
			handle.fail(reason);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.failReason]).toEqual([
				'failed',
				reason,
			]);
		});
	});

	describe('in-flight call (async onCall is real-only)', () => {
		it('awaits an in-flight call hook, then discards the response', async () => {
			const tracker = {
				entered: noopResolver as () => void,
				completed: false,
			};
			const entry = new Promise<void>((resolve) => {
				tracker.entered = resolve;
			});
			const slowLogic: ThreadLogic = {
				onMessage: REFERENCE_THREAD_LOGIC.onMessage,
				async onCall() {
					tracker.entered();
					await delay(150);
					tracker.completed = true;
					return 'discarded';
				},
			};
			const handle = evaluate(
				referenceSpec("emit(call('ping'));", {
					threadLogic: slowLogic,
				}),
			);
			const resultPromise = handle.result;
			await entry;
			handle.cancel();
			const { items, settlement } = await resultPromise;

			expect([settlement.outcome, tracker.completed, items]).toEqual([
				'cancelled',
				true,
				[],
			]);
		});
	});

	describe('time budget', () => {
		it('times out a busy loop with the timeout cause', async () => {
			const handle = evaluate(referenceSpec('for (;;) {}', { seconds: 0.2 }));
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'timed-out',
				'timeout',
			]);
		});

		it('times out immediately on a zero-second budget', async () => {
			const handle = evaluate(referenceSpec('', { seconds: 0 }));
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('timed-out');
		});

		it('does not charge slow consumer pulls to the budget', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b');", { seconds: 0.3 }),
			);
			const pulled: unknown[] = [];
			for await (const item of handle) {
				pulled.push(item);
				await delay(250);
			}
			const { settlement } = await handle.result;

			expect([pulled, settlement.outcome]).toEqual([['a', 'b'], 'completed']);
		});

		it('cancels (not times out) during a long yield-wait', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b');", { seconds: 0.3 }),
			);
			const iterator = handle[Symbol.asyncIterator]();
			await iterator.next();
			await delay(400);
			handle.cancel();
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('cancelled');
		});

		it('never times out a dropping high-frequency program', async () => {
			const handle = evaluate(
				referenceSpec(
					"for (let i = 0; i < 200; i += 1) { emit('reference:drop'); } emit('done');",
					{ seconds: 1 },
				),
			);
			const { items, settlement } = await handle.result;

			expect([items, settlement.outcome]).toEqual([['done'], 'completed']);
		});

		it('reports the consumed budget on a timeout', async () => {
			const handle = evaluate(referenceSpec('for (;;) {}', { seconds: 0.2 }));
			const { settlement } = await handle.result;

			expect(settlement.durationMs).toBeGreaterThanOrEqual(150);
		});

		it('charges the flat yield fee per yield — many fast yields exhaust the budget', async () => {
			const handle = evaluate(
				referenceSpec("for (let i = 0; i < 150; i += 1) { emit('y'); }", {
					seconds: 0.5,
				}),
			);
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('timed-out');
		});
	});

	describe('environment failures settle, never throw', () => {
		it('settles worker-error for a clone-unsafe worker config', async () => {
			const handle = evaluate(
				referenceSpec('', {
					workerConfig: { fn: () => {} },
				}),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});

		it('settles worker-error for a throwing worker factory', async () => {
			const handle = evaluate(
				referenceSpec('', {
					workerFactory: () => {
						throw new Error('worker construction failed');
					},
				}),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});

		it('settles worker-error when the worker fails to load (async error event)', async () => {
			const handle = evaluate(
				referenceSpec('', {
					workerFactory: () =>
						new Worker(
							new URL('../testing/failing-worker-entry.ts', import.meta.url),
							{ type: 'module' },
						),
				}),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});
	});
});

function noopResolver(): void {}
