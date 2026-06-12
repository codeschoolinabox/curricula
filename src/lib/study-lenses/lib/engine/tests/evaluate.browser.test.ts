/**
 * Live-run behavior — browser project, real transport, reference logic.
 *
 * The drain row ("accumulates every item with no iterator") is the
 * triangulation kill-shot for the node suite's hardcodable empty-items
 * settlements — empty-program completed alone is NOT shippable.
 *
 * Deliberately untested: the concurrent-iterator zone (an iterator
 * created after the engine's first drain pull) — one stream, silently
 * split, contractually unsupported; asserted neither way.
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../testing/reference-thread-logic.js';
import type { EvaluateSpec, ThreadLogic } from '../types.js';

const WORKER_URL = new URL('../testing/test-worker-entry.ts', import.meta.url);

function referenceSpec(
	code: string,
	overrides: Partial<EvaluateSpec> = {},
): EvaluateSpec {
	return {
		code,
		workerUrl: WORKER_URL,
		threadLogic: REFERENCE_THREAD_LOGIC,
		...overrides,
	};
}

function delay(ms: number): Promise<'still-pending'> {
	return new Promise((resolve) => {
		setTimeout(() => resolve('still-pending'), ms);
	});
}

const LIMIT_THROW_CODE =
	"const e = new Error('limit hit'); e.name = 'ReferenceLimitError'; throw e;";

describe('evaluate (real transport)', () => {
	describe('completion', () => {
		it('settles completed with the reference-stamped halt', async () => {
			const handle = evaluate(referenceSpec(''));
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

		it('defaults strict to true when the spec omits it', async () => {
			const handle = evaluate(referenceSpec('with (Math) { emit(PI); }'));
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string }).name,
			]).toEqual(['errored', 'SyntaxError']);
		});

		it('runs sloppy constructs under strict false', async () => {
			const handle = evaluate(
				referenceSpec('with (Math) { emit(PI); }', { strict: false }),
			);
			const { items } = await handle.result;

			expect(items).toEqual([Math.PI]);
		});
	});

	describe('result drain (no iterator)', () => {
		it('accumulates every item in worker-post order', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b'); emit('c');"),
			);
			const { items, settlement } = await handle.result;

			expect([items, settlement.outcome]).toEqual([
				['a', 'b', 'c'],
				'completed',
			]);
		});

		it('freezes each item at yield', async () => {
			const handle = evaluate(referenceSpec('emit({ step: 1 });'));
			const { items } = await handle.result;

			expect(Object.isFrozen(items[0])).toBe(true);
		});
	});

	describe('drop vs yield', () => {
		it('drops the sentinel and yields the rest', async () => {
			const handle = evaluate(
				referenceSpec("emit('reference:drop'); emit('kept');"),
			);
			const { items } = await handle.result;

			expect(items).toEqual(['kept']);
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
	});

	describe('iterator-first backpressure', () => {
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

		it('settles with ordered items once iteration finishes', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b'); emit('c');"),
			);
			const pulled: unknown[] = [];
			for await (const item of handle) {
				pulled.push(item);
			}
			const { items } = await handle.result;

			expect([pulled, items]).toEqual([
				['a', 'b', 'c'],
				['a', 'b', 'c'],
			]);
		});
	});

	describe('break ≡ cancel', () => {
		it('settles cancelled when the iterator exits early', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b'); emit('c');"),
			);
			const iterator = handle[Symbol.asyncIterator]();
			await iterator.next();
			await iterator.return?.();
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('cancelled');
		});

		it('keeps the items yielded before the break', async () => {
			const handle = evaluate(
				referenceSpec("emit('a'); emit('b'); emit('c');"),
			);
			const yielded: unknown[] = [];
			for await (const item of handle) {
				yielded.push(item);
				break;
			}
			const { items } = await handle.result;

			expect([yielded, items]).toEqual([['a'], ['a']]);
		});
	});

	describe('mid-stream consumer stops', () => {
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

	describe('call channel', () => {
		it('routes the response into the program and out as an item', async () => {
			const handle = evaluate(referenceSpec("emit(call('ping'));"));
			const { items } = await handle.result;

			expect(items).toEqual(['ping']);
		});

		it('settles call-error when onCall is absent', async () => {
			const handle = evaluate(
				referenceSpec("call('ping');", {
					threadLogic: { onMessage: REFERENCE_THREAD_LOGIC.onMessage },
				}),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'call-error',
			]);
		});

		it('settles call-error when onCall throws', async () => {
			const throwingLogic: ThreadLogic = {
				onMessage: REFERENCE_THREAD_LOGIC.onMessage,
				onCall() {
					throw new Error('no service');
				},
			};
			const handle = evaluate(
				referenceSpec("call('ping');", { threadLogic: throwingLogic }),
			);
			const { settlement } = await handle.result;

			expect(settlement.error?.cause).toBe('call-error');
		});

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

		it('reports the consumed budget on a timeout', async () => {
			const handle = evaluate(referenceSpec('for (;;) {}', { seconds: 0.2 }));
			const { settlement } = await handle.result;

			expect(settlement.durationMs).toBeGreaterThanOrEqual(150);
		});
	});

	describe('thread hook failures', () => {
		it('settles hook-error when onMessage throws', async () => {
			const throwingLogic: ThreadLogic = {
				onMessage() {
					throw new Error('bad hook');
				},
			};
			const handle = evaluate(
				referenceSpec("emit('x');", { threadLogic: throwingLogic }),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'hook-error',
			]);
		});

		it('keeps the halt and drops the refinement when refineError throws', async () => {
			const throwingRefine: ThreadLogic = {
				onMessage: REFERENCE_THREAD_LOGIC.onMessage,
				refineError() {
					throw new Error('bad refiner');
				},
			};
			const handle = evaluate(
				referenceSpec("throw new Error('kapot');", {
					threadLogic: throwingRefine,
				}),
			);
			const { settlement } = await handle.result;

			expect([
				settlement.error?.cause,
				(settlement.halt as { message: string }).message,
				'refinement' in settlement,
			]).toEqual(['hook-error', 'kapot', false]);
		});
	});

	describe('errored halts', () => {
		it('carries the worker-authored halt on a thrown error', async () => {
			const handle = evaluate(referenceSpec("throw new TypeError('boom');"));
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string; viaReference: boolean }).name,
			]).toEqual(['errored', 'TypeError']);
		});

		it('attaches the refinement for a recognized limit throw', async () => {
			const handle = evaluate(referenceSpec(LIMIT_THROW_CODE));
			const { settlement } = await handle.result;

			expect(settlement.refinement).toEqual({ limit: 'reference' });
		});

		it('omits the refinement for an unrecognized throw', async () => {
			const handle = evaluate(
				referenceSpec("throw new RangeError('learner error');"),
			);
			const { settlement } = await handle.result;

			expect('refinement' in settlement).toBe(false);
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

		it('settles worker-error for a bad worker url', async () => {
			const handle = evaluate(
				referenceSpec('', {
					workerUrl: new URL('does-not-exist-worker.ts', import.meta.url),
				}),
			);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});
	});

	describe('post-settlement', () => {
		it('treats a cancel after settlement as a no-op', async () => {
			const handle = evaluate(referenceSpec(''));
			const first = await handle.result;
			handle.cancel();
			const second = await handle.result;

			expect(second).toBe(first);
		});
	});
});

function noopResolver(): void {}
