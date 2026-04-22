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

class FakeWorker {
	onmessage: ((e: MessageEvent) => void) | null = null;
	onerror: ((e: ErrorEvent) => void) | null = null;
	postMessage(): void {}
	terminate(): void {}
}

describe('createRunGenerator cancel', () => {
	describe('cancel before first iterate', () => {
		it('next() resolves with done: true', async () => {
			const gen = createRunGenerator('let x = 1;');
			gen.cancel();
			const result = await gen.next();
			expect(result.done).toBe(true);
		});

		it('result.ok is true (cancel is not a program error)', async () => {
			const gen = createRunGenerator('let x = 1;');
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			expect(result.value.ok).toBe(true);
		});

		it('logs contains exactly one cancel event', async () => {
			const gen = createRunGenerator('let x = 1;');
			gen.cancel();
			const result = await gen.next();
			if (!result.done) throw new Error('expected done');
			if (!result.value.ok) throw new Error('expected ok');
			expect(result.value.logs).toEqual([{ event: 'cancel' }]);
		});
	});

	describe('idempotency', () => {
		it('calling cancel twice does not throw', () => {
			const gen = createRunGenerator('let x = 1;');
			expect(() => {
				gen.cancel();
				gen.cancel();
			}).not.toThrow();
		});

		it('calling cancel after completion does not throw', async () => {
			const gen = createRunGenerator('let x = 1;');
			gen.cancel();
			await gen.next();
			expect(() => gen.cancel()).not.toThrow();
		});
	});

	describe('subsequent next() after cancel completes', () => {
		it('returns done: true on repeated next() calls', async () => {
			const gen = createRunGenerator('let x = 1;');
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
			const gen = createRunGenerator('let x = 1;');
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
			const gen = createRunGenerator('let x = 1;');
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
			const gen = createRunGenerator('let x = 1;');
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
			const gen = createRunGenerator('let x = 1;');
			expect(() => {
				(gen as { cancel: () => void }).cancel = () => {};
			}).toThrow();
		});
	});
});
