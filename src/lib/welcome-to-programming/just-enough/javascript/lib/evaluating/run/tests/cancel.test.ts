import { describe, expect, it } from 'vitest';

import createRunGenerator from '../run.js';

/**
 * Cancel semantics — node project.
 *
 * Covers cancel-before-first-iterate paths only: every test cancels
 * before the first `.next()` call, so no Worker is ever spawned and
 * all assertions run entirely in node.
 *
 * Worker-dependent cancel scenarios (cancel mid-iterate, happy-path
 * drain, in-flight cancel via IO suspend) live in cancel.browser.test.ts
 * where they run against a real Worker + SharedArrayBuffer environment.
 */

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

	/**
	 * Invariant: after the api/run → evaluating/run merge (M.1), ANY
	 * consumer that calls .cancel() gets a RunResult whose last log
	 * entry is `{event: 'cancel'}`. shared/types.ts § CancelEvent
	 * documents this as universal: "Presence in `logs` is the signal."
	 * Previously, the api/run wrapper's cancel bypassed this path by
	 * calling generator.return(), skipping the main-loop cancelled
	 * branch that appends the event. After the merge there is no
	 * wrapper — every cancel goes through the engine's native path.
	 */
	describe('cancel invariant: logs.at(-1).event === "cancel"', () => {
		describe('cancel before first iterate', () => {
			it('invariant holds', async () => {
				const gen = createRunGenerator('let x = 1;\n');
				gen.cancel();
				const result = await gen.result;
				if (!result.ok) throw new Error('expected ok');
				expect(result.logs.at(-1)).toEqual({ event: 'cancel' });
			});
		});

		describe('cancel via await handle.result', () => {
			it('invariant holds', async () => {
				const gen = createRunGenerator('let x = 1;\n');
				gen.cancel();
				const result = await gen;
				if (!result.ok) throw new Error('expected ok');
				expect(result.logs.at(-1)).toEqual({ event: 'cancel' });
			});
		});

	});
});
