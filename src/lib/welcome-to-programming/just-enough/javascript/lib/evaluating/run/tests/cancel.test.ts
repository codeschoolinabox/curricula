import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import createRunGenerator from '../run.js';

/**
 * Cancel semantics unit tests.
 *
 * Covers both phases:
 * - **cancel-before-first-iterate** runs entirely in node without
 *   touching Worker/URL. Body() step 0 exits with a cancel-only
 *   RunResult.
 * - **cancel-during-iterate** uses vi.stubGlobal to replace the
 *   Worker constructor + URL + Blob with no-op fakes, so body() can
 *   run through its full setup without a real browser env. The fake
 *   Worker never posts messages, so `await dequeue()` suspends; cancel
 *   then unsticks it via the sentinel-push path.
 */

/**
 * Fake Worker for node-env testing. Supports two triggers:
 *
 * - **Default:** posts nothing — useful for testing cancel-during-dequeue
 *   where the consumer wants the main thread suspended at `await dequeue()`.
 * - **autoComplete (statically configured before construct):** posts
 *   `{type: 'complete'}` on receipt of the `execute` message so `.result`
 *   can drain through a happy-path completion without a real worker.
 */
class FakeWorker {
	static autoComplete = false;

	onmessage: ((e: MessageEvent) => void) | null = null;
	onerror: ((e: ErrorEvent) => void) | null = null;

	postMessage(msg: { type?: string }): void {
		if (FakeWorker.autoComplete && msg?.type === 'execute') {
			// Schedule as microtask so the main thread finishes setup first.
			queueMicrotask(() => {
				if (this.onmessage) {
					this.onmessage({ data: { type: 'complete' } } as MessageEvent);
				}
			});
		}
	}

	terminate(): void {}
}

describe('createRunGenerator cancel', () => {
	describe('cancel before first iterate', () => {
		it('next() resolves with done: true', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen.next();
			expect(result.done).toBe(true);
		});

		it('result.ok is true (cancel is not a program error)', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			expect(result.value.ok).toBe(true);
		});

		it('logs contains exactly one cancel event', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			if (!result.value.ok) throw new Error('expected ok');
			expect(result.value.logs).toEqual([{ event: 'cancel' }]);
		});
	});

	describe('idempotency', () => {
		it('calling cancel twice does not throw', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(() => {
				gen.cancel();
				gen.cancel();
			}).not.toThrow();
		});

		it('calling cancel after completion does not throw', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			await gen.next();
			expect(() => gen.cancel()).not.toThrow();
		});
	});

	describe('subsequent next() after cancel completes', () => {
		it('returns done: true on repeated next() calls', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			await gen.next();
			const second = await gen.next();
			expect(second.done).toBe(true);
		});
	});

	describe('cancel-during-iterate (with stubbed Worker)', () => {
		beforeEach(() => {
			vi.stubGlobal('Worker', FakeWorker);
			vi.stubGlobal('URL', {
				createObjectURL: () => 'blob:fake',
				revokeObjectURL: () => {},
			});
			vi.stubGlobal(
				'Blob',
				class {
					constructor(_parts: unknown[], _options?: unknown) {}
				},
			);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('cancel during pending dequeue resolves next() with done:true', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			// Kick off iteration — body runs through setup, awaits dequeue
			// (FakeWorker never posts, so dequeue suspends).
			const nextPromise = gen.next();
			// Yield to event loop so body reaches await dequeue.
			await Promise.resolve();
			await Promise.resolve();
			gen.cancel();
			const result = await nextPromise;
			expect(result.done).toBe(true);
		});

		it('mid-iterate cancel appends cancel event to logs', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			const nextPromise = gen.next();
			await Promise.resolve();
			await Promise.resolve();
			gen.cancel();
			const result = await nextPromise;
			if (!result.done) throw new Error('expected done');
			if (!result.value.ok) throw new Error('expected ok');
			expect(result.value.logs.at(-1)).toEqual({ event: 'cancel' });
		});

		it('result.ok is true after mid-iterate cancel', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			const nextPromise = gen.next();
			await Promise.resolve();
			await Promise.resolve();
			gen.cancel();
			const result = await nextPromise;
			if (!result.done) throw new Error('expected done');
			expect(result.value.ok).toBe(true);
		});
	});

	describe('cancel is not writable (runtime enforcement)', () => {
		it('assigning cancel throws in strict mode', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(() => {
				(gen as { cancel: () => void }).cancel = () => {};
			}).toThrow();
		});
	});

	describe('.result (Task D)', () => {
		it('resolves to RunResult when cancelled before iterate', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen.result;
			expect(result.ok).toBe(true);
		});

		it('resolved RunResult contains cancel event in logs', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen.result;
			if (!result.ok) throw new Error('expected ok');
			expect(result.logs.at(-1)).toEqual({ event: 'cancel' });
		});

		it('memoizes — same Promise on repeated access', () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const p1 = gen.result;
			const p2 = gen.result;
			expect(p1).toBe(p2);
		});

		it('result property is not writable', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(() => {
				(gen as { result: Promise<unknown> }).result = Promise.resolve(
					null,
				);
			}).toThrow();
		});
	});

	describe('.then / PromiseLike (Task D)', () => {
		it('await handle resolves to RunResult', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen;
			expect(result.ok).toBe(true);
		});

		it('await handle and await handle.result return same value', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const viaAwait = await gen;
			const viaResult = await gen.result;
			expect(viaAwait).toBe(viaResult);
		});

		it('then() callback receives RunResult', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			const value = await gen.then((r) => (r.ok ? r.logs.length : -1));
			expect(value).toBe(1);
		});

		it('then is not enumerable (matches Promise convention)', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(Object.keys(gen)).not.toContain('then');
		});

		it('cancel IS enumerable (positive case for comparison)', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(Object.keys(gen)).toContain('cancel');
		});

		it('result IS enumerable (positive case for comparison)', () => {
			const gen = createRunGenerator('let x = 1;\n');
			expect(Object.keys(gen)).toContain('result');
		});
	});

	describe('.result drain through happy-path completion (FakeWorker autoComplete)', () => {
		beforeEach(() => {
			FakeWorker.autoComplete = true;
			vi.stubGlobal('Worker', FakeWorker);
			vi.stubGlobal('URL', {
				createObjectURL: () => 'blob:fake',
				revokeObjectURL: () => {},
			});
			vi.stubGlobal(
				'Blob',
				class {
					constructor(_parts: unknown[], _options?: unknown) {}
				},
			);
		});

		afterEach(() => {
			FakeWorker.autoComplete = false;
			vi.unstubAllGlobals();
		});

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

	describe('.then with both onFulfilled and onRejected', () => {
		it('invokes onFulfilled on cancel (never onRejected under normal flow)', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			gen.cancel();
			let fulfilledCalled = false;
			let rejectedCalled = false;
			await gen.then(
				() => {
					fulfilledCalled = true;
				},
				() => {
					rejectedCalled = true;
				},
			);
			expect(fulfilledCalled).toBe(true);
			expect(rejectedCalled).toBe(false);
		});
	});

	describe('.result accessed before cancel, cancelled mid-drain', () => {
		beforeEach(() => {
			FakeWorker.autoComplete = false;
			vi.stubGlobal('Worker', FakeWorker);
			vi.stubGlobal('URL', {
				createObjectURL: () => 'blob:fake',
				revokeObjectURL: () => {},
			});
			vi.stubGlobal(
				'Blob',
				class {
					constructor(_parts: unknown[], _options?: unknown) {}
				},
			);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('in-flight .result Promise resolves when cancel fires later', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			// Start the drain — IIFE runs body, reaches await dequeue
			// (FakeWorker never posts without autoComplete).
			const resultPromise = gen.result;
			await Promise.resolve();
			await Promise.resolve();
			gen.cancel();
			const result = await resultPromise;
			expect(result.ok).toBe(true);
		});
	});
});
