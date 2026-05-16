/**
 * @file Unit tests for the trapless run engine — no Worker required.
 *
 * Covers the synchronous-gate paths and the handle's sync surface
 * (code / ast / options). All cases here either short-circuit before
 * a Worker would spawn (gate failures, cancel-pre-spawn) or read
 * sync-knowable handle properties.
 *
 * Browser tests in `run.browser.test.ts` cover everything that needs
 * a real Worker + SharedArrayBuffer.
 */

import { describe, expect, it } from 'vitest';

import run from '../run.js';

describe('run — unit (no Worker)', () => {
	describe('Z (zero) — empty source', () => {
		it('empty string parses cleanly; handle exposes sync data', () => {
			const h = run('');
			expect(h.code).toBe('');
			expect(h.ast).toBeDefined();
			expect(h.ast?.type).toBe('Program');
			expect(h.options.seconds).toBe(5);
			expect(h.options.iterations).toBeUndefined();
		});
	});

	describe('O (one) — parse failure pre-settles result', () => {
		it('parse failure → outcome:error, error.kind:parse, ast undefined', async () => {
			const h = run('let x =');
			expect(h.ast).toBeUndefined();
			const r = await h.result;
			expect(r.ok).toBe(false);
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('parse');
		});
	});

	describe('M (many) — validate rejections + format failure', () => {
		it('rejection: function f(){} parses but JeJ rejects', async () => {
			const h = run('function f() {}\n');
			expect(h.ast?.type).toBe('Program');
			const r = await h.result;
			expect(r.ok).toBe(false);
			expect(r.outcome).toBe('error');
			expect(r.rejections).toBeDefined();
			expect(r.rejections?.length ?? 0).toBeGreaterThan(0);
			expect(r.ast).toBe(h.ast);
		});

		it('format failure: unformatted source → error.kind:formatting', async () => {
			const r = await run('let   x   =   1;');
			expect(r.ok).toBe(false);
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('formatting');
		});
	});

	describe('B (boundary) — defaults', () => {
		it('seconds defaults to 5 when omitted', () => {
			const h = run('let x = 1;\n');
			expect(h.options.seconds).toBe(5);
		});

		it('explicit seconds is preserved', () => {
			const h = run('let x = 1;\n', { seconds: 10 });
			expect(h.options.seconds).toBe(10);
		});

		it('iterations as-passed (no default)', () => {
			const h = run('let x = 1;\n');
			expect(h.options.iterations).toBeUndefined();
			const h2 = run('let x = 1;\n', { iterations: 100 });
			expect(h2.options.iterations).toBe(100);
		});
	});

	describe('I (interfaces) — handle is deep-frozen at sync return', () => {
		it('handle, options, ast are frozen', () => {
			const h = run('let x = 1;\n');
			expect(Object.isFrozen(h)).toBe(true);
			expect(Object.isFrozen(h.options)).toBe(true);
			if (h.ast) expect(Object.isFrozen(h.ast)).toBe(true);
		});

		it('result is deep-frozen on parse-failure pre-settle', async () => {
			const r = await run('let x =');
			expect(Object.isFrozen(r)).toBe(true);
			if (r.error) expect(Object.isFrozen(r.error)).toBe(true);
		});
	});

	describe('S (simple) — default invocation', () => {
		it('exposes a usable handle without options', () => {
			const h = run('let x = 1;\n');
			expect(typeof h.cancel).toBe('function');
			expect(h.result).toBeInstanceOf(Promise);
			expect(typeof h.then).toBe('function');
			expect(h.code).toBe('let x = 1;\n');
		});
	});

	describe('Logs are never on RunResult', () => {
		it('parse-failure result has no logs field', async () => {
			const r = await run('let x =');
			expect('logs' in r).toBe(false);
		});

		it('format-failure result has no logs field', async () => {
			const r = await run('let   x = 1;');
			expect('logs' in r).toBe(false);
		});

		it('rejection result has no logs field', async () => {
			const r = await run('with (o) {}');
			expect('logs' in r).toBe(false);
		});
	});

	describe('PromiseLike — await handle unwraps to result', () => {
		it('await run(code) on parse-failure resolves directly to RunResult', async () => {
			const r = await run('let x =');
			expect(r.outcome).toBe('error');
			expect(r.error?.kind).toBe('parse');
		});

		it('await handle and await handle.result yield the same frozen value', async () => {
			const h = run('let x =');
			const a = await h;
			const b = await h.result;
			expect(a).toBe(b);
		});

		it('handle.result === handle.result (memoized Promise)', () => {
			const h = run('let x = 1;\n');
			expect(h.result).toBe(h.result);
		});
	});

	describe('Cancel pre-Worker (synchronous)', () => {
		it('cancel before async body settles outcome:cancel', async () => {
			const h = run('let x = 1;\n');
			h.cancel();
			const r = await h.result;
			expect(r.outcome).toBe('cancel');
			expect(r.ok).toBe(false);
		});

		it('cancel after gate failure is a no-op', async () => {
			const h = run('let x ='); // parse fails sync
			const r1 = await h.result;
			h.cancel();
			const r2 = await h.result;
			expect(r1).toBe(r2);
			expect(r1.outcome).toBe('error');
			expect(r1.error?.kind).toBe('parse');
		});

		it('multiple cancels are idempotent', async () => {
			const h = run('let x = 1;\n');
			h.cancel();
			h.cancel();
			h.cancel();
			const r = await h.result;
			expect(r.outcome).toBe('cancel');
		});
	});
});
