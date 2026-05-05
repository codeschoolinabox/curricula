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

import createInterceptGenerator from '../intercept.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createInterceptGenerator cancel (browser — real Worker)', () => {
	/**
	 * Uses console.log to create a deterministic pause point: the Worker
	 * posts a console event then blocks on Atomics.wait() until the main
	 * thread sends a resume signal. Cancelling after gen.next() returns
	 * that first event leaves the Worker paused, so cancel fires cleanly
	 * before any further Worker execution.
	 */
	describe('cancel mid-iterate (real Worker)', () => {
		it('cancel during pending dequeue resolves next() with done: true', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			expect(result.done).toBe(true);
		});

		it('mid-iterate cancel sets outcome:cancel on the result', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			expect(result.value.outcome).toBe('cancel');
		});

		it('result.ok is true after mid-iterate cancel', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			expect(result.value.ok).toBe(true);
		});
	});

	describe('happy-path completion via .result', () => {
		it('.result resolves with ok: true when worker posts complete', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			const result = await gen.result;
			expect(result.ok).toBe(true);
		});

		it('happy-path outcome is complete, not cancel', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			const result = await gen.result;
			expect(result.outcome).toBe('complete');
		});

		it('await handle resolves to InterceptResult (PromiseLike drain)', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
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

			const gen = createInterceptGenerator('console.log(1);\n', {
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

	describe('cancel invariant: outcome === "cancel" (mid-iterate)', () => {
		it('invariant holds', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const iter = await gen.next();
			if (!iter.done) throw new Error('expected done');
			expect(iter.value.outcome).toBe('cancel');
		});
	});
});
