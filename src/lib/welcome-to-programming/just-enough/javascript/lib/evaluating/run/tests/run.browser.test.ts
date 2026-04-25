/**
 * @file Browser tests for the trapless run engine — real Worker + SAB.
 *
 * Covers everything that needs a Worker thread: timeout, iteration
 * limit, runtime errors, IO dialogs, cancel mechanics, and the
 * post-execution result shape.
 */

import { describe, expect, it } from 'vitest';

import format from '../../../formatting/format.js';

import run from '../run.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Canonicalize a code fixture through the project's formatter so the
 * format gate accepts it. Mirrors the convention in intercept's tests.
 */
const fmt = (code: string): string => format(code);

describe('run — browser (real Worker)', () => {
	describe('happy path', () => {
		it('trivial complete: await run("1 + 1;") → ok:true outcome:complete', async () => {
			const r = await run(fmt('1 + 1;\n'));
			expect(r.ok).toBe(true);
			expect(r.outcome).toBe('complete');
		});

		it("console is not trapped: 'logs' never present on result", async () => {
			const r = await run(fmt('console.log(1);\n'));
			expect(r.outcome).toBe('complete');
			expect('logs' in r).toBe(false);
		});
	});

	describe('timeout', () => {
		it('explicit seconds: while(true){} timeouts within budget', async () => {
			const start = Date.now();
			const r = await run(fmt('while (true) { let x = 1; }\n'), { seconds: 0.5 });
			const elapsed = Date.now() - start;
			expect(r.outcome).toBe('timeout');
			expect(r.error?.kind).toBe('timeout');
			expect(elapsed).toBeLessThan(1500);
		});
	});

	describe('iteration limit', () => {
		it('guarded loop hits iteration cap', async () => {
			const r = await run(fmt('while (true) { let x = 1; }\n'), { iterations: 100 });
			expect(r.outcome).toBe('iteration-limit');
			expect(r.error?.kind).toBe('iteration-limit');
			if (r.error && 'limit' in r.error) {
				expect(r.error.limit).toBe(100);
			}
		});

		it('unguarded RangeError is NOT misclassified as iteration-limit', async () => {
			// 'a'.repeat(2 ** 32) throws RangeError ("Invalid count value").
			// Without iterations option, no guard injection — must classify
			// as plain javascript error, not iteration-limit. Triangulates
			// the iteration-limit gate's message-string match (D5 #4).
			const r = await run(fmt("'a'.repeat(2 ** 32);\n"));
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('javascript');
		});
	});

	describe('runtime errors', () => {
		it('null() throws TypeError; surfaces as outcome:error kind:javascript', async () => {
			const r = await run(fmt('null();\n'));
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('javascript');
			if (r.error && 'name' in r.error) {
				expect(r.error.name).toBe('TypeError');
			}
		});
	});

	describe('IO mocks', () => {
		it('prompt mock fires; outcome complete', async () => {
			let calls = 0;
			const r = await run(fmt('let x = prompt("?");\n'), {
				io: {
					prompt: async () => {
						calls += 1;
						return 'x';
					},
				},
			});
			expect(r.outcome).toBe('complete');
			expect(calls).toBe(1);
		});

		it('prompt with no mock surfaces as outcome:error (D5b divergence)', async () => {
			const r = await run(fmt('prompt("?");\n'));
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('javascript');
		});

		it('alert + confirm parity', async () => {
			let alertCalls = 0;
			let confirmCalls = 0;
			const r = await run(
				fmt('alert("hi");\nlet a = confirm("ok?");\n'),
				{
					io: {
						alert: () => {
							alertCalls += 1;
						},
						confirm: () => {
							confirmCalls += 1;
							return true;
						},
					},
				},
			);
			expect(r.outcome).toBe('complete');
			expect(alertCalls).toBe(1);
			expect(confirmCalls).toBe(1);
		});

		it('IO mock async-rejection surfaces as outcome:error', async () => {
			const r = await run(fmt('let x = prompt("?");\n'), {
				io: {
					prompt: () => Promise.reject(new Error('boom')),
				},
			});
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('javascript');
			if (r.error && 'message' in r.error) {
				expect(r.error.message).toContain('boom');
			}
		});

		it('null prompt return propagates through SAB null-flag path', async () => {
			let n = 0;
			const r = await run(
				fmt('let a = prompt();\nlet b = prompt();\n'),
				{
					io: {
						prompt: () => {
							n += 1;
							return n === 1 ? 'x' : null;
						},
					},
				},
			);
			expect(r.outcome).toBe('complete');
			expect(n).toBe(2);
		});
	});

	describe('cancel', () => {
		it('cancel during execution (no I/O in flight)', async () => {
			const h = run(fmt('while (true) { let x = 1; }\n'));
			// Let the Worker actually start, then cancel.
			await sleep(20);
			h.cancel();
			const r = await h.result;
			expect(r.outcome).toBe('cancel');
			expect(r.ok).toBe(false);
		});

		it('cancel during slow IO mock — wait-for-mock semantics', async () => {
			let mockResolved = false;
			const h = run(fmt('let x = prompt();\n'), {
				io: {
					prompt: async () => {
						await sleep(300);
						mockResolved = true;
						return 'x';
					},
				},
			});
			await sleep(50);
			h.cancel();
			const r = await h.result;
			expect(r.outcome).toBe('cancel');
			// Mock must have run to completion before cancel settled.
			expect(mockResolved).toBe(true);
		});

		it('cancel after settlement is a no-op', async () => {
			const h = run(fmt('1 + 1;\n'));
			const r1 = await h.result;
			h.cancel();
			const r2 = await h.result;
			expect(r1).toBe(r2);
			expect(r1.outcome).toBe('complete');
		});

		it('multiple cancels are idempotent', async () => {
			const h = run(fmt('while (true) { let x = 1; }\n'));
			h.cancel();
			h.cancel();
			h.cancel();
			const r = await h.result;
			expect(r.outcome).toBe('cancel');
		});
	});

	describe('result memoization + PromiseLike', () => {
		it('handle.result === handle.result', () => {
			const h = run(fmt('1 + 1;\n'));
			expect(h.result).toBe(h.result);
		});

		it('await handle and await handle.result yield same frozen value', async () => {
			const h = run(fmt('1 + 1;\n'));
			const a = await h;
			const b = await h.result;
			expect(a).toBe(b);
		});

		it('result is deep-frozen', async () => {
			const r = await run(fmt('1 + 1;\n'));
			expect(Object.isFrozen(r)).toBe(true);
		});
	});

	describe('handle sync surface (code / ast / options)', () => {
		it('handle.code returns input source', () => {
			const h = run(fmt('1 + 1;\n'));
			expect(h.code).toBe('1 + 1;\n');
		});

		it('handle.ast set on successful parse (sync access)', () => {
			const h = run(fmt('1 + 1;\n'));
			expect(h.ast?.type).toBe('Program');
		});

		it('handle.options.seconds defaulted to 5', () => {
			const h = run(fmt('1 + 1;\n'));
			expect(h.options.seconds).toBe(5);
		});

		it('handle.options.seconds explicit', () => {
			const h = run(fmt('1 + 1;\n'), { seconds: 10 });
			expect(h.options.seconds).toBe(10);
		});
	});

	describe('result-side ast', () => {
		it('result.ast === handle.ast on success (same frozen reference)', async () => {
			const h = run(fmt('1 + 1;\n'));
			const r = await h;
			expect(r.ast).toBe(h.ast);
		});

		it('result.ast set on validate-rejections', async () => {
			const h = run(fmt('function f() {}\n'));
			const r = await h;
			expect(r.outcome).toBe('error');
			expect(r.ast).toBe(h.ast);
			expect(r.rejections).toBeDefined();
		});

		it("'logs' is never present on result, regardless of outcome", async () => {
			const cases = [
				await run(fmt('1 + 1;\n')),
				await run(fmt('null();\n')),
				await run('while (true) {}\n', { seconds: 0.3 }),
				await run('while (true) {}\n', { iterations: 5 }),
			];
			for (const r of cases) {
				expect('logs' in r).toBe(false);
			}
		});
	});
});
