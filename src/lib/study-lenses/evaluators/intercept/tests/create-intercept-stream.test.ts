/**
 * @file I6's ZOMBIES cluster: the stream factory driven through the engine
 * seam over the engine's fake transport — laziness, the claim, the arrival
 * queue's program order, the teardown latch, the assembled spec, the
 * defect arm, and the H-2 per-yield-charge ceiling.
 *
 * Fake-transport knowledge lives in THIS file only: the seam binds the
 * engine's public factory, and production never passes it. The fake runs
 * the whole program eagerly and synchronously before the first pull is
 * answered, so this tier evidences everything intercept COMPUTES about the
 * console path and nothing about WHEN (the committed Testing posture); a
 * dialog program through the fake settles as a machinery defect — the
 * double rejects an asynchronous round-trip outright, a property of the
 * double asserted as such, never a statement about the design. The hold,
 * consumer pacing, and the full ask–answer–record loop are browser-tier
 * (I7).
 *
 * DISCLOSED ordering slip: the implementing agent drafted the
 * implementation before this cluster, then re-stubbed the file so the
 * cluster runs RED and the review sees the tests on their own terms.
 *
 * TWO exclusions, each with its reason:
 *
 * 1. No uncapped-runaway-loop timeout row (inherited, applies identically
 *    here): the fake runs the program eagerly and synchronously inside
 *    `start()`, so no budget timer can fire against a same-thread loop —
 *    such a row would hang the runner rather than time out (run's R4 note).
 *    The timeout arm is reached instead through the per-yield charge below,
 *    and truth-tabled synthetically at I4.
 * 2. No "a queued record is delivered after the settlement resolved" row.
 *    Attempted and MEASURED unreachable at this tier: with demand-driven
 *    reaching, an event never sits in the queue while the run ends — one
 *    reach per pull means the arriving event goes straight to the waiting
 *    pull, so a consumer that pulls once and then only awaits holds the
 *    program at its boundary moment and `settled` cannot resolve (the
 *    committed § Edge cases row; the attempted test hung until the engine's
 *    budget fired). The queue only holds an event across the retained
 *    reach's one-event slack, which needs a dialog — browser-tier I7. What
 *    IS provable here is that one pull does not finish the stream, which
 *    the latch block's own row pins.
 *
 * Triangulation, stated honestly: the pre-start cancel and the clean-run
 * rows do NOT kill a two-branch fake that never reads the spec — the rows
 * that force a real run are the record-order and program-throw rows, and
 * the assembled-spec rows then pin what the engine was driven WITH (run's
 * R4 honesty note, inherited).
 */

import { describe, expect, it, vi } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import evaluate from '../../../lib/engine/evaluate.js';
import createFakeTransport from '../../../lib/engine/testing/fake-transport.js';
import type { EvaluateSpec } from '../../../lib/engine/types.js';
import type { EvaluationSpec } from '../../types.js';
import createInterceptStream from '../create-intercept-stream.js';
import interceptWorkerSetup from '../intercept-worker-setup.js';
import type {
	InterceptConsoleRecord,
	InterceptEvent,
	InterceptRecord,
	InterceptSettlement,
} from '../types.js';

function specFor(
	code: string,
	extras: Partial<EvaluationSpec> = {},
): EvaluationSpec {
	// `type` mirrors embody's real stage shape — a StageSuccess wrapper, not a
	// bare string. A flattened fixture reads as an undefined parse goal, which
	// acorn silently defaults to script: these rows would pass for the wrong
	// reason (I7's first real-worker run caught it on the module axis).
	const facts = {
		source: { ok: true, value: code },
		type: {
			ok: true,
			value: extras.execution === 'module' ? 'module' : 'script',
		},
	} as unknown as Facts;
	return { facts, execution: 'function', ...extras };
}

function recordingEvaluate(): {
	evaluateFunction: typeof evaluate;
	specs: EvaluateSpec[];
} {
	const specs: EvaluateSpec[] = [];
	function evaluateFunction(engineSpec: EvaluateSpec) {
		specs.push(engineSpec);
		return evaluate(
			engineSpec,
			createFakeTransport(interceptWorkerSetup, engineSpec.threadLogic),
		);
	}
	return { evaluateFunction, specs };
}

async function runOf(spec: EvaluationSpec): Promise<{
	events: InterceptEvent[];
	settlement: InterceptSettlement;
	specs: EvaluateSpec[];
}> {
	const { evaluateFunction, specs } = recordingEvaluate();
	const stream = createInterceptStream(spec, evaluateFunction);
	const events: InterceptEvent[] = [];
	for await (const event of stream) {
		events.push(event);
	}
	return { events, settlement: await stream.settled, specs };
}

describe('createInterceptStream', () => {
	describe('laziness', () => {
		it('the engine factory is not invoked before the first pull', () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			createInterceptStream(specFor('console.log(1);'), evaluateFunction);

			// PINNED(committed DOCS § Structural constraints: nothing engine-side exists before the first pull)
			expect(specs).toHaveLength(0);
		});

		it('accessing settled without pulling starts nothing', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const stream = createInterceptStream(
				specFor('console.log(1);'),
				evaluateFunction,
			);
			void stream.settled;
			await Promise.resolve();

			expect(specs).toHaveLength(0);
		});

		it('a first pull drives the engine exactly once', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs).toHaveLength(1);
		});

		it('tearing down before any pull settles canceled', async () => {
			const stream = createInterceptStream(
				specFor('console.log(1);'),
				recordingEvaluate().evaluateFunction,
			);
			await stream[Symbol.asyncIterator]().return?.();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});
	});

	describe('a console program — records in the program order', () => {
		it('a loop-free program with no output yields nothing and settles clean', async () => {
			const { events, settlement } = await runOf(specFor('let x = 1;'));

			expect([events.length, settlement]).toEqual([0, { ended: 'clean' }]);
		});

		it('yields one typed record per console call, then ends', async () => {
			const { events } = await runOf(
				specFor("console.log('a');\nconsole.warn('b');"),
			);

			expect(
				events.map((event) => (event as InterceptConsoleRecord).method),
			).toEqual(['log', 'warn']);
		});

		it('the records carry their worker-side event ordinals in order', async () => {
			const { events } = await runOf(
				specFor("console.log('a');\nconsole.warn('b');\nconsole.log('c');"),
			);

			// PINNED(committed DOCS phase 8: both sources join ONE arrival queue in the order the worker posted — the program's own order)
			expect(events.map((event) => event.step)).toEqual([1, 2, 3]);
		});

		it('a record rides deep-frozen', async () => {
			const { events } = await runOf(specFor("console.log('a');"));

			expect(Object.isFrozen(events[0])).toBe(true);
		});

		it('the run settles clean after its records are taken', async () => {
			const { settlement } = await runOf(specFor("console.log('a');"));

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});
	});

	describe('settlements through a real fake-transport run', () => {
		it('a program throw settles error with reason threw', async () => {
			const { settlement } = await runOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it("a wrapped throw carries the learner's own call-site span", async () => {
			const { settlement } = await runOf(specFor('null();'));

			// PINNED(ar-1 span-fidelity ruling 2026-08-04: the wrap stamps the innermost call site — end-to-end through assemble, the worker setup, and the mapper)
			expect(settlement).toHaveProperty('error.loc.start', {
				line: 1,
				column: 0,
			});
		});

		it('a throw outside any wrap carries loc null through the whole pipeline', async () => {
			// PINNED(committed README § Edge cases: a statement-level throw outside any wrap carries loc null — no stack is parsed to recover one; proven end-to-end, wrap decline through halt author through mapper)
			const { settlement } = await runOf(specFor('null.foo;'));

			expect(settlement).toHaveProperty('error.loc', null);
		});

		it('a throw outside any wrap is still reason threw', async () => {
			const { settlement } = await runOf(specFor('null.foo;'));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it('a capped runaway loop settles reason loop-cap', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.reason', 'loop-cap');
		});

		it('a capped runaway loop carries the trip riding whole', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.trip.loc.start', {
				line: 1,
				column: 0,
			});
		});

		it('a capped runaway loop counts the tripping iteration', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.iterationCount', 6);
		});

		it('a dialog program through the fake settles as a machinery defect', async () => {
			const { settlement } = await runOf(specFor("prompt('who?');"));

			// PINNED(committed README § Testing posture: the fake rejects an asynchronous round-trip outright — a property of the double, never a statement about the design)
			expect(settlement).toHaveProperty('error.reason', 'defect');
		});
	});

	describe('the teardown latch', () => {
		it('a pull after teardown does not start a fresh run', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const iterator = createInterceptStream(
				specFor('console.log(1);'),
				evaluateFunction,
			)[Symbol.asyncIterator]();
			await iterator.return?.();
			await iterator.next();

			// PINNED(danger regression 9c974dfc: a pull after teardown must never start a fresh run)
			expect(specs).toHaveLength(0);
		});

		it('a pull after teardown reports the end', async () => {
			const iterator = createInterceptStream(
				specFor('console.log(1);'),
				recordingEvaluate().evaluateFunction,
			)[Symbol.asyncIterator]();
			await iterator.return?.();

			expect(await iterator.next()).toStrictEqual({
				done: true,
				value: undefined,
			});
		});

		it('tearing down while a pull is pending interrupts it, settling canceled', async () => {
			const stream = createInterceptStream(
				specFor('let x = 1;'),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			const pull = iterator.next();
			const teardown = iterator.return?.();
			await Promise.all([pull, teardown]);

			// PINNED(committed DOCS § Structural constraints: teardown stops the run out of band, never through the engine's own stream exit — that exit awaits a settlement a suspended ask would block)
			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});

		it('events already taken stand after a mid-stream teardown', async () => {
			const stream = createInterceptStream(
				specFor("console.log('a');\nconsole.log('b');"),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			await iterator.return?.();

			expect((first.value as InterceptRecord).args).toEqual(['a']);
		});

		it('a pull after teardown reports the end even with events still queued', async () => {
			// PINNED(committed DOCS phase 11: teardown LATCHES — a later pull is inert; serving a leftover queued event would hand a consumer data from a stream it already tore down)
			const stream = createInterceptStream(
				specFor("console.log('a');\nconsole.log('b');\nconsole.log('c');"),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			await iterator.next();
			await iterator.return?.();

			expect(await iterator.next()).toStrictEqual({
				done: true,
				value: undefined,
			});
		});

		it('a second pull after a natural settlement does not start a fresh run', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const iterator = createInterceptStream(
				specFor('let x = 1;'),
				evaluateFunction,
			)[Symbol.asyncIterator]();
			await iterator.next();
			await iterator.next();

			expect(specs).toHaveLength(1);
		});

		it('a pull that starts a run does not finish it — the stream must be pulled for every event it holds', async () => {
			// PINNED(committed types.ts InterceptStream: unlike the eventless sibling's, this stream must be pulled for every event it holds — one pull starts a run but does not finish one)
			const stream = createInterceptStream(
				specFor("console.log('a');\nconsole.log('b');"),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			await iterator.next();
			const second = await iterator.next();

			expect((second.value as InterceptRecord).args).toEqual(['b']);
		});
	});

	describe('the assembled engine spec', () => {
		it('splices the guard call on the original source', async () => {
			const { specs } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			// PINNED(human ruling 2026-08-05: guards splice FIRST on the original text — the reverse order shifts the columns the guard reports)
			expect(specs[0]?.code).toContain("__$il(1, '1:0:1:27');");
		});

		it('composes the two passes in order — the guard call survives on a call-bearing loop', async () => {
			// PINNED(committed README § Design commitments: "This order is not interchangeable: the reverse shifts the columns the guard reports" — the modal shape is the only fixture where a wrap-first orchestration is observable)
			const { specs } = await runOf(
				specFor('for (let i = 0; i < 3; i = i + 1) { console.log(i); }', {
					iterations: 5,
				}),
			);

			expect(specs[0]?.code).toContain("__$il(1, '1:0:1:53');");
		});

		it("composes the two passes in order — the wrapped call keeps the learner's own span", async () => {
			const { specs } = await runOf(
				specFor('for (let i = 0; i < 3; i = i + 1) { console.log(i); }', {
					iterations: 5,
				}),
			);

			expect(specs[0]?.code).toContain(
				"__$lc('1:36:1:50', () => console.log(i))",
			);
		});

		it('wraps the call expressions with spans from the original text', async () => {
			const { specs } = await runOf(specFor('console.log(1);'));

			expect(specs[0]?.code).toContain(
				"__$lc('1:0:1:14', () => console.log(1))",
			);
		});

		it('carries the iteration cap through unchanged, renamed at the seam', async () => {
			const { specs } = await runOf(specFor('let x = 1;', { iterations: 0 }));

			// PINNED(C1 ruled: iterations rides through unchanged — no clamping, defaulting, or finiteness gate)
			expect(specs[0]?.workerConfig).toStrictEqual({ iterationLimit: 0 });
		});

		it('omits the cap entirely when the spec carries none', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs[0]?.workerConfig).toStrictEqual({});
		});

		it('carries the execution axis through unchanged', async () => {
			const { specs } = await runOf(
				specFor('let x = 1;', { execution: 'module' }),
			);

			expect(specs[0]?.execution).toBe('module');
		});

		it('attaches a worker factory', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs[0]?.workerFactory).toBeTypeOf('function');
		});

		it('carries no seconds budget', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs[0]?.seconds).toBeUndefined();
		});

		it('carries no strict posture', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs[0]?.strict).toBeUndefined();
		});

		it('supplies no refinement hook', async () => {
			const { specs } = await runOf(specFor('let x = 1;'));

			expect(specs[0]?.threadLogic.refineError).toBeUndefined();
		});
	});

	describe('an assemble-time dev condition', () => {
		it('settles the defect arm with cause unreachable-outcome', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { settlement } = await runOf(specFor('let x = ;'));
			warn.mockRestore();

			// PINNED(ruling R-2 inherited: no machine ran, so no machinery cause would be honest)
			expect(settlement).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('never reaches the engine', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { specs } = await runOf(specFor('let x = ;'));
			warn.mockRestore();

			expect(specs).toHaveLength(0);
		});

		it('freezes the settlement it authors, like every other route', async () => {
			// PINNED(run's R4 ar-4 finding, inherited: this route hand-builds its settlement OUTSIDE the mapper, so the mapper's own freeze rows do not cover it — the sibling shipped this arm unfrozen and no test caught it)
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { settlement } = await runOf(specFor('let x = ;'));
			warn.mockRestore();

			expect(Object.isFrozen(settlement)).toBe(true);
		});

		it('a second pull after the defect settlement does not re-run the pass', async () => {
			// PINNED(ar-4 I6 finding 2026-08-05, confirmed by probe in BOTH this module and the committed sibling: a handle-only restart guard misses this route, since no handle is ever assigned — every later pull re-instrumented and re-warned)
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const iterator = createInterceptStream(
				specFor('let x = ;'),
				recordingEvaluate().evaluateFunction,
			)[Symbol.asyncIterator]();
			await iterator.next();
			await iterator.next();
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(1);
		});

		it('a pull outstanding on the defect route still completes as the end', async () => {
			// PINNED(committed DOCS phase 8: a pull outstanding when the run ends completes as the stream's end — ANY route, this one having no engine and no reach to deliver it)
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const iterator = createInterceptStream(
				specFor('let x = ;'),
				recordingEvaluate().evaluateFunction,
			)[Symbol.asyncIterator]();
			const first = await iterator.next();
			warn.mockRestore();

			expect(first).toStrictEqual({ done: true, value: undefined });
		});
	});

	describe('the per-yield charge ceiling — H-2, priced not papered over', () => {
		it('a densely emitting program settles timeout through the charge alone', async () => {
			// PINNED(H-2 ruled 2026-08-04: ~1000 yielded events exhaust the default budget with almost no real runtime — emit everything, name the cost, rest loop safety on iterations)
			const { settlement } = await runOf(
				specFor('let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }'),
			);

			expect(settlement).toHaveProperty('error.reason', 'timeout');
		});

		it('the records already delivered stand — a real floor, never an exact count', async () => {
			// PINNED(H-2 ruled 2026-08-04: the charge is flat arithmetic (5ms of a 5s default per yield), so ~1000 records land before it binds — a floor of 500 is meaningful and still clear of exact-count flakiness)
			const { events } = await runOf(
				specFor('let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }'),
			);

			expect(events.length).toBeGreaterThan(500);
		});
	});
});
