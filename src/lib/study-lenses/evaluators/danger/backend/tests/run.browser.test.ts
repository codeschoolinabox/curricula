/**
 * @file run iframe-core settlements — browser project (real window, real
 * synchronous `<script>` settlement, real `window.onerror`; no faithful jsdom
 * analogue). This increment triangulates the transport: `completed` (natural end),
 * `errored` via a runtime top-level throw (the in-script try/catch bridge), and
 * `errored` via UNPARSEABLE source (which the try/catch cannot see — it settles
 * through the iframe's `error` event, or the run would hang). Plus the impure
 * invariants: the settle is a macrotask (never synchronous), the iframe is torn
 * down on settle, and cancel/latch (first-write-wins). It also covers the
 * loop-guard trip: a bounded loop exceeding its cap settles `limit-exceeded`, and
 * unparseable source with a cap settles `errored` via the build-phase guard.
 */

import { describe, expect, it, vi } from 'vitest';

import run from '../run.js';

vi.setConfig({ testTimeout: 20_000 });

describe('run — iframe core (browser)', () => {
	it('a natural completion settles completed', async () => {
		const result = await run('1 + 1;', {}).result;
		expect(result.outcome).toBe('completed');
		expect(result).not.toHaveProperty('error');
	});

	it('a runtime top-level throw settles errored with the thrown primitives', async () => {
		const result = await run("throw new Error('boom');", {}).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toEqual({ name: 'Error', message: 'boom' });
	});

	it('unparseable source settles errored via window.onerror (not the try/catch)', async () => {
		// `let x = ;` is a syntax error: the whole assembled script fails to PARSE, so
		// the in-script try/catch never runs and __danger.done/fail never fires. Only
		// the iframe's window.onerror (installed before inject) can settle it — without
		// that net the run would never settle (a silent hang, not a freeze).
		const result = await run('let x = ;', {}).result;
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
		const handle = run('1 + 1;', {});
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
		await run('window.__dangerProbe = true;', {}).result;
		expect(
			(globalThis as unknown as { __dangerProbe?: boolean }).__dangerProbe,
		).toBeUndefined();
	});

	it('tears the iframe down on settle (no leaked iframe elements)', async () => {
		const before = document.querySelectorAll('iframe').length;
		await run('1 + 1;', {}).result;
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('a RangeError with iterations UNSET is errored, not limit-exceeded', async () => {
		// The facade must thread options.iterations (here undefined) into the classifier:
		// with no cap, even a RangeError whose message matches the guard shape is the
		// learner's own error. A facade that hardcoded a cap would misclassify this.
		const result = await run(
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
		const handle = run("throw new Error('again');", {});
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
		const handle = run('1 + 1;', {});
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancelled');
		expect(result).not.toHaveProperty('error');
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('cancel() after a completed run is a no-op (first-write-wins latch)', async () => {
		const handle = run('1 + 1;', {});
		const settledResult = await handle.result;
		handle.cancel(); // latched — cannot change the settled outcome
		const again = await handle.result;
		expect(again).toBe(settledResult);
		expect(again.outcome).toBe('completed');
	});

	it('a BOUNDED loop that exceeds a low iterations cap → limit-exceeded', async () => {
		// for i<5 with cap 3: the loop-guard trips at iteration 3. The loop is BOUNDED,
		// so without the guard it would merely complete — this cleanly distinguishes
		// guard-present from guard-absent with NO infinite-loop / freeze risk. Reaching
		// limit-exceeded (not errored) also proves the runner emitted the loop1..loopK
		// counter globals the guard references (else a ReferenceError → errored).
		const result = await run(
			'for (let i = 0; i < 5; i = i + 1) { let x = i; }',
			{ iterations: 3 },
		).result;
		expect(result.outcome).toBe('limit-exceeded');
		// Inc 1b: limit-exceeded now carries the guard's own RangeError primitives.
		expect(result.error).toEqual({
			name: 'RangeError',
			message: 'Loop 1 exceeded 3 iterations.',
		});
	});

	it('a bounded loop within the cap → completed (guard applied, no false-trip)', async () => {
		const result = await run(
			'for (let i = 0; i < 3; i = i + 1) { let x = i; }',
			{ iterations: 100 },
		).result;
		expect(result.outcome).toBe('completed');
	});

	it('unparseable source WITH a cap → errored, and run still returns a handle', async () => {
		// With a cap, spliceLoopGuards parses via acorn FIRST, throwing a typed
		// LoopGuardError on a syntax error. The build-phase try/catch must settle
		// errored (deferred) rather than letting run throw synchronously out of the call.
		const handle = run('let x = ;', { iterations: 100 });
		const result = await handle.result; // handle exists; call did not throw
		expect(result.outcome).toBe('errored');
		// The real thrown identity flows through (not a canned constant).
		expect(typeof result.error?.name).toBe('string');
		expect((result.error?.message ?? '').length).toBeGreaterThan(0);
	});

	it('a true-infinite braced runaway with a cap → limit-exceeded (safe only WITH the guard)', async () => {
		// The canonical danger case. Braced body so spliceLoopGuards instruments it; the
		// cap trips it. Run only after the guard is wired — without the guard this would
		// freeze the runner (the un-unit-testable freeze case, README § Edge cases).
		const result = await run('while (true) { let x = 1; }', {
			iterations: 50,
		}).result;
		expect(result.outcome).toBe('limit-exceeded');
	});

	it('debuggerEnabled: true still parses, runs, and settles completed through the facade', async () => {
		// Stepping is manual-eyeball, but the debugger-wrapped script must still PARSE
		// and RUN — a mis-wire (dropped flag, or the `debugger;` glue breaking the build
		// prefix so the script fails to parse) would settle errored. This pins the
		// facade's wrapWithDebugger true-branch composition, untested by the flag-less cases.
		const result = await run('1 + 1;', { debuggerEnabled: true }).result;
		expect(result.outcome).toBe('completed');
	});
});

describe('run — io mocks (browser)', () => {
	// The mocks are installed on the iframe window BEFORE inject (the same
	// before-inject window as the __danger bridge). They MUST be synchronous: a real
	// synchronous <script> cannot await. danger emits no events, so a mock is
	// observed either through the settlement its return value drives (confirm /
	// prompt) or through a parent-realm closure the mock writes to (alert / console).

	it('routes a mocked confirm into control flow (true → throw → errored), forwarding the message', async () => {
		let received: string | undefined;
		const result = await run(
			"if (confirm('go?')) { throw new Error('confirmed'); }",
			{
				io: {
					confirm: (message) => {
						received = message;
						return true;
					},
				},
			},
		).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toEqual({ name: 'Error', message: 'confirmed' });
		expect(received).toBe('go?');
	});

	it('a mocked confirm returning false takes the other branch → completed', async () => {
		const result = await run(
			"if (confirm('go?')) { throw new Error('confirmed'); } 1 + 1;",
			{ io: { confirm: () => false } },
		).result;
		expect(result.outcome).toBe('completed');
	});

	it('routes a mocked prompt scripted answer into control flow', async () => {
		const result = await run(
			"if (prompt('name?') === 'danger') { throw new Error('prompted'); }",
			{ io: { prompt: () => 'danger' } },
		).result;
		expect(result.outcome).toBe('errored');
		expect(result.error).toEqual({ name: 'Error', message: 'prompted' });
	});

	it('a mocked prompt returning a non-matching answer takes the other branch → completed', async () => {
		const result = await run(
			"if (prompt('name?') === 'danger') { throw new Error('prompted'); } 1 + 1;",
			{ io: { prompt: () => null } },
		).result;
		expect(result.outcome).toBe('completed');
	});

	it('routes mocked alert calls to the mock (a parent-realm closure), not native', async () => {
		const seen: string[] = [];
		const result = await run("alert('hi'); alert('bye');", {
			io: {
				alert: (message) => {
					seen.push(String(message));
				},
			},
		}).result;
		expect(result.outcome).toBe('completed');
		expect(seen).toEqual(['hi', 'bye']);
	});

	it('routes mocked console methods to the mock', async () => {
		const logged: unknown[][] = [];
		const result = await run("console.log('a', 1); console.log('b');", {
			io: {
				console: {
					log: (...data) => {
						logged.push(data);
					},
				},
			},
		}).result;
		expect(result.outcome).toBe('completed');
		expect(logged).toEqual([['a', 1], ['b']]);
	});

	it('leaves unmocked verbs native/callable when only one verb is mocked', async () => {
		// Only provided verbs are installed. A destructure-and-assign impl that clobbered
		// the rest to undefined would throw a TypeError here. (The harness auto-dismisses
		// native dialogs, so we assert callability — not a return value.)
		const result = await run(
			"if (typeof confirm !== 'function' || typeof alert !== 'function' || typeof prompt !== 'function') { throw new Error('clobbered'); }",
			{ io: { console: { log: () => {} } } },
		).result;
		expect(result.outcome).toBe('completed');
	});

	it('merges console (an unmocked method stays native), not replace', async () => {
		const logged: unknown[][] = [];
		const result = await run(
			"if (typeof console.error !== 'function') { throw new Error('clobbered'); } console.log('x');",
			{
				io: {
					console: {
						log: (...data) => {
							logged.push(data);
						},
					},
				},
			},
		).result;
		expect(result.outcome).toBe('completed');
		expect(logged).toEqual([['x']]);
	});
});
