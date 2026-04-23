/**
 * @file Cancel semantics — browser project (real Worker + SharedArrayBuffer).
 *
 * Tests that require a real Worker environment: mid-iterate cancel,
 * happy-path completion via .result, in-flight cancel via IO suspend,
 * and the mid-iterate cancel invariant.
 *
 * The node cancel.test.ts covers cancel-before-first-iterate paths that
 * exercise no Worker machinery.
 */

import { describe, expect, it, vi } from 'vitest';

import createRunGenerator from '../run.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createRunGenerator cancel (browser — real Worker)', () => {
	/**
	 * Uses console.log to create a deterministic pause point: the Worker
	 * posts a console event then blocks on Atomics.wait() until the main
	 * thread sends a resume signal. Cancelling after gen.next() returns
	 * that first event leaves the Worker paused, so cancel fires cleanly
	 * before any further Worker execution.
	 */
	describe('cancel mid-iterate (real Worker)', () => {
		it('cancel during pending dequeue resolves next() with done: true', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			expect(result.done).toBe(true);
		});

		it('mid-iterate cancel appends cancel event to logs', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			if (!result.value.ok) throw new Error('expected ok');
			expect(result.value.logs.at(-1)).toEqual({ event: 'cancel' });
		});

		it('result.ok is true after mid-iterate cancel', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			expect(result.value.ok).toBe(true);
		});
	});

	describe('happy-path completion via .result', () => {
		it('.result resolves with ok: true when worker posts complete', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			const result = await gen.result;
			expect(result.ok).toBe(true);
		});

		it('.result logs do not contain a cancel event on happy path', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			const result = await gen.result;
			if (!result.ok) throw new Error('expected ok');
			const hasCancel = result.logs.some((e) => e.event === 'cancel');
			expect(hasCancel).toBe(false);
		});

		it('await handle resolves to RunResult (PromiseLike drain)', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			const result = await gen;
			expect(result.ok).toBe(true);
		});
	});

	/**
	 * Uses the io.console.log hook as a deterministic "drain has started"
	 * signal. The mock fires synchronously inside the generator body's
	 * event-path before the yield, so when the test's await resumes, the
	 * body is suspended at await setTimeout(0) — precisely the window
	 * where cancel fires before the Worker is resumed. This exercises the
	 * in-flight .result path without depending on the io-request / prompt
	 * protocol.
	 */
	describe('.result in-flight cancel (console.log signal)', () => {
		it('in-flight .result Promise resolves when cancel fires later', async () => {
			let signalConsoleReached!: () => void;
			const consoleReached = new Promise<void>((res) => {
				signalConsoleReached = res;
			});

			const gen = createRunGenerator('console.log(1);\n', {
				io: {
					console: {
						log: async () => {
							signalConsoleReached();
						},
					},
				},
			});
			const resultPromise = gen.result;
			await consoleReached;
			gen.cancel();
			const result = await resultPromise;
			expect(result.ok).toBe(true);
		});
	});

	describe('cancel invariant: logs.at(-1).event === "cancel" (mid-iterate)', () => {
		it('invariant holds', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const iter = await gen.next();
			if (!iter.done) throw new Error('expected done');
			if (!iter.value.ok) throw new Error('expected ok');
			expect(iter.value.logs.at(-1)).toEqual({ event: 'cancel' });
		});
	});
});
