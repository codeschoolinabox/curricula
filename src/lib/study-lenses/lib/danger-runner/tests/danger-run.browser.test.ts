/**
 * @file dangerRun iframe-core settlements — browser project (real window, real
 * synchronous `<script>` settlement, real `window.onerror`; no faithful jsdom
 * analogue). This increment triangulates the transport: `completed` (natural end),
 * `errored` via a runtime top-level throw (the in-script try/catch bridge), and
 * `errored` via UNPARSEABLE source (which the try/catch cannot see — it settles
 * through the iframe's `error` event, or the run would hang). Plus the impure
 * invariants: the settle is a macrotask (never synchronous), the iframe is torn
 * down on settle, and cancel/latch (first-write-wins). Guard-trip
 * (`limit-exceeded`) — which needs the loop-guard — is a separate increment.
 */

import { describe, expect, it, vi } from 'vitest';

import dangerRun from '../danger-run.js';

vi.setConfig({ testTimeout: 20_000 });

describe('dangerRun — iframe core (browser)', () => {
	it('a natural completion settles completed', async () => {
		const result = await dangerRun('1 + 1;', {}).result;
		expect(result.outcome).toBe('completed');
		expect(result).not.toHaveProperty('error');
	});

	it('a runtime top-level throw settles errored with the thrown primitives', async () => {
		const result = await dangerRun("throw new Error('boom');", {}).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toEqual({ name: 'Error', message: 'boom' });
	});

	it('unparseable source settles errored via window.onerror (not the try/catch)', async () => {
		// `let x = ;` is a syntax error: the whole assembled script fails to PARSE, so
		// the in-script try/catch never runs and __danger.done/fail never fires. Only
		// the iframe's window.onerror (installed before inject) can settle it — without
		// that net the run would never settle (a silent hang, not a freeze).
		const result = await dangerRun('let x = ;', {}).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toBeDefined();
		expect(typeof result.error?.name).toBe('string');
		expect((result.error?.message ?? '').length).toBeGreaterThan(0);
	});

	it('result settles on a macrotask — not synchronously, not on a microtask', async () => {
		// The settle must survive draining the ENTIRE microtask queue: the
		// orchestrator's running→settled transition must be able to paint (microtasks
		// all flush within one frame, before paint), and an io mirror must not race the
		// channel reset. A synchronous OR queueMicrotask settle flips `settled` within
		// these awaits; a setTimeout(0) macrotask does not.
		const handle = dangerRun('1 + 1;', {});
		let settled = false;
		void handle.result.then(() => {
			settled = true;
		});
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		expect(settled).toBe(false);
		const result = await handle.result;
		expect(result.outcome).toBe('completed');
	});

	it('runs the script in an isolated realm, not the parent window', async () => {
		// Proves the transport is a real separate window, not a same-realm eval/Function
		// cheat: a same-realm cheat would leak __dangerProbe onto the parent window
		// (a property assignment, legal even under the injected "use strict").
		await dangerRun('window.__dangerProbe = true;', {}).result;
		expect(
			(globalThis as unknown as { __dangerProbe?: boolean }).__dangerProbe,
		).toBeUndefined();
	});

	it('tears the iframe down on settle (no leaked iframe elements)', async () => {
		const before = document.querySelectorAll('iframe').length;
		await dangerRun('1 + 1;', {}).result;
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('a RangeError with iterations UNSET is errored, not limit-exceeded', async () => {
		// The facade must thread options.iterations (here undefined) into the classifier:
		// with no cap, even a RangeError whose message matches the guard shape is the
		// learner's own error. A facade that hardcoded a cap would misclassify this.
		const result = await dangerRun(
			"throw new RangeError('exceeded 5 iterations');",
			{},
		).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toEqual({
			name: 'RangeError',
			message: 'exceeded 5 iterations',
		});
	});

	it('result resolves exactly once (same object) and never rejects', async () => {
		// The contract: result never rejects (errors ride outcome:'errored'); a plain
		// await is enough, .catch is pure defense-in-depth. A distinct literal from the
		// earlier throw pins that the echo is not overfit to one fixture.
		const handle = dangerRun("throw new Error('again');", {});
		const first = await handle.result;
		const second = await handle.result;
		expect(second).toBe(first);
		expect(first.outcome).toBe('errored');
		expect(first.error).toEqual({ name: 'Error', message: 'again' });
	});

	it('cancel() before settle → cancelled, and injection is skipped', async () => {
		// Injection is deferred a macrotask, so a synchronous cancel() lands FIRST:
		// it tears the iframe down and settles cancelled before the script ever runs.
		const before = document.querySelectorAll('iframe').length;
		const handle = dangerRun('1 + 1;', {});
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancelled');
		expect(result).not.toHaveProperty('error');
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('cancel() after a completed run is a no-op (first-write-wins latch)', async () => {
		const handle = dangerRun('1 + 1;', {});
		const settledResult = await handle.result;
		handle.cancel(); // latched — cannot change the settled outcome
		const again = await handle.result;
		expect(again).toBe(settledResult);
		expect(again.outcome).toBe('completed');
	});
});
