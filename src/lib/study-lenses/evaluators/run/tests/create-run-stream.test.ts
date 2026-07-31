/**
 * @file R4's cluster: laziness, the two latches, the assembled engine spec,
 * and the settlements a real run produces — driven through the D1 engine seam
 * over the engine's fake transport, so run's own logic is Node-testable
 * without a Worker.
 *
 * Fake-transport knowledge lives in THIS file only: the seam binds the
 * engine's public factory, and production never passes it.
 *
 * Triangulation, stated honestly: the pre-start cancel can be faked alone, and
 * the clean-run row rules out only a single fixed answer — a two-branch fake
 * that never touches the spec survives both. The row that actually forces a
 * real run is `a program throw settles error with reason threw`, which no
 * implementation can answer without reading the source and driving the
 * engine; the assembled-spec rows then pin what it drove it WITH.
 *
 * ONE row is deliberately absent — an uncapped runaway loop. The fake runs
 * the program eagerly and synchronously inside `start()`, so no budget timer
 * can fire against a same-thread loop: such a row would hang the runner
 * rather than time out. The timeout arm is truth-tabled synthetically in
 * `map-settlement.test.ts`, which is what run's README intends by "proves
 * nothing the truth table doesn't". Note this does NOT excuse the in-flight
 * cancel: interrupting a pending PULL is a microtask-ordering race, not a
 * live-program race, and it is tested below.
 */

import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import evaluate from '../../../lib/engine/evaluate.js';
import createFakeTransport from '../../../lib/engine/testing/fake-transport.js';
import type { EvaluateSpec } from '../../../lib/engine/types.js';
import type { EvaluationSpec } from '../../types.js';
import createRunStream from '../create-run-stream.js';
import runWorkerSetup from '../run-worker-setup.js';
import type { RunSettlement } from '../types.js';

function specFor(
	code: string,
	extras: Partial<EvaluationSpec> = {},
): EvaluationSpec {
	const facts = { source: { ok: true, value: code } } as unknown as Facts;
	return { facts, execution: 'function', ...extras };
}

/**
 * The D1 seam: route the assembled spec through the engine's fake transport,
 * recording every spec the factory is handed and how often it is called.
 */
function recordingEvaluate(): {
	evaluateFunction: typeof evaluate;
	specs: EvaluateSpec[];
} {
	const specs: EvaluateSpec[] = [];
	function evaluateFunction(engineSpec: EvaluateSpec) {
		specs.push(engineSpec);
		return evaluate(
			engineSpec,
			createFakeTransport(runWorkerSetup, engineSpec.threadLogic),
		);
	}
	return { evaluateFunction, specs };
}

/** One full run: pull once, then read the settlement and what was driven. */
async function runOf(
	spec: EvaluationSpec,
): Promise<{ settlement: RunSettlement; specs: EvaluateSpec[] }> {
	const { evaluateFunction, specs } = recordingEvaluate();
	const stream = createRunStream(spec, evaluateFunction);
	await stream[Symbol.asyncIterator]().next();
	return { settlement: await stream.settled, specs };
}

describe('createRunStream', () => {
	describe('laziness', () => {
		it('tearing down before any pull settles canceled', async () => {
			const stream = createRunStream(
				specFor('1 + 1;'),
				recordingEvaluate().evaluateFunction,
			);
			await stream[Symbol.asyncIterator]().return?.();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});

		it('a first pull runs the program to a clean settlement', async () => {
			const { settlement } = await runOf(specFor('1 + 1;'));

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});

		it('a first pull actually drives the engine exactly once', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			expect(specs).toHaveLength(1);
		});

		it('the engine factory is not invoked before the first pull', () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			createRunStream(specFor('1 + 1;'), evaluateFunction);

			// PINNED(human-ratified Phase 0 6256571c: nothing engine-side exists before the first pull — the engine's result access itself starts a run)
			expect(specs).toHaveLength(0);
		});

		it('accessing settled without pulling starts nothing', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const stream = createRunStream(specFor('1 + 1;'), evaluateFunction);
			void stream.settled;
			await Promise.resolve();

			expect(specs).toHaveLength(0);
		});

		it('the pull completes done, having yielded nothing', async () => {
			const stream = createRunStream(
				specFor('1 + 1;'),
				recordingEvaluate().evaluateFunction,
			);

			expect(await stream[Symbol.asyncIterator]().next()).toStrictEqual({
				done: true,
				value: undefined,
			});
		});
	});

	describe('cancellation', () => {
		it('tearing down while a pull is pending interrupts it, settling canceled', async () => {
			const stream = createRunStream(
				specFor('1 + 1;'),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			const pull = iterator.next();
			const teardown = iterator.return?.();
			await Promise.all([pull, teardown]);

			// PINNED(human-ratified Phase 0 6256571c: teardown answers OUT OF BAND — a generator's return() would queue behind the pending pull and deadlock the cancel)
			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});
	});

	describe('the teardown latch', () => {
		it('a pull after teardown does not start a fresh run', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const iterator = createRunStream(specFor('1 + 1;'), evaluateFunction)[
				Symbol.asyncIterator
			]();
			await iterator.return?.();
			await iterator.next();

			// PINNED(danger regression 9c974dfc: a pull after teardown must never start a fresh run)
			expect(specs).toHaveLength(0);
		});

		it('a pull after teardown keeps the canceled settlement', async () => {
			const stream = createRunStream(
				specFor('1 + 1;'),
				recordingEvaluate().evaluateFunction,
			);
			const iterator = stream[Symbol.asyncIterator]();
			await iterator.return?.();
			await iterator.next();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});

		it('a second pull after a natural settlement does not start a fresh run', async () => {
			const { evaluateFunction, specs } = recordingEvaluate();
			const iterator = createRunStream(specFor('1 + 1;'), evaluateFunction)[
				Symbol.asyncIterator
			]();
			await iterator.next();
			await iterator.next();

			expect(specs).toHaveLength(1);
		});
	});

	describe('settlements through a real run', () => {
		it('a program throw settles error with reason threw', async () => {
			const { settlement } = await runOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it('a program throw carries the machine words', async () => {
			const { settlement } = await runOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.name', 'TypeError');
		});

		it('a capped runaway loop settles loop-cap', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.reason', 'loop-cap');
		});

		it('a capped runaway loop carries the tripping iteration in its count', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			// PINNED(iteration-guard README § Edge cases: the guard increments before it compares, so a cap of N trips at N+1)
			expect(settlement).toHaveProperty('error.iterationCount', 6);
		});

		it("a capped runaway loop carries the loop's own decoded span", async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			// PINNED(human-ratified Phase 0 6256571c: guards splice on the ORIGINAL source so the trip span stays faithful to the learner's own columns)
			expect(settlement).toHaveProperty('error.trip.loc.start', {
				line: 1,
				column: 0,
			});
		});

		it('a loop-free program is guarded inertly and settles clean', async () => {
			const { settlement } = await runOf(specFor('let x = 1;'));

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});
	});

	describe('the assembled engine spec', () => {
		it('carries the iteration cap through unchanged, renamed at the seam', async () => {
			const { specs } = await runOf(specFor('1 + 1;', { iterations: 0 }));

			// PINNED(iteration-guard C1 ruling: iterations rides through unchanged — no clamping, defaulting, or finiteness gate)
			expect(specs[0]?.workerConfig).toStrictEqual({ iterationLimit: 0 });
		});

		it('omits the cap entirely when the spec carries none', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			expect(specs[0]?.workerConfig).toStrictEqual({});
		});

		it('carries the execution axis through unchanged', async () => {
			const { specs } = await runOf(specFor('1 + 1;', { execution: 'module' }));

			expect(specs[0]?.execution).toBe('module');
		});

		it('attaches a worker factory', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			expect(specs[0]?.workerFactory).toBeTypeOf('function');
		});

		it('carries no strict posture', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			expect(specs[0]?.strict).toBeUndefined();
		});

		it('carries no seconds budget', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			expect(specs[0]?.seconds).toBeUndefined();
		});

		it('supplies no refinement hook', async () => {
			const { specs } = await runOf(specFor('1 + 1;'));

			// PINNED(human-ratified Phase 0 6256571c: the engine's refinement hook goes unused — the halt is authored where the raw throw lives)
			expect(specs[0]?.threadLogic.refineError).toBeUndefined();
		});

		it('splices the guard call into the loop body, carrying the loop span', async () => {
			const { specs } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(specs[0]?.code).toContain("__$il(1, '1:0:1:27');");
		});
	});

	describe('an assemble-time dev condition', () => {
		it('settles the defect arm with cause unreachable-outcome', async () => {
			const { settlement } = await runOf(specFor('let x = ;'));

			// PINNED(human ruling 2026-07-30 R-2: no machine ran, so no machinery cause would be honest)
			expect(settlement).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('never reaches the engine', async () => {
			const { specs } = await runOf(specFor('let x = ;'));

			expect(specs).toHaveLength(0);
		});

		it('freezes the settlement it authors, like every other route', async () => {
			const { settlement } = await runOf(specFor('let x = ;'));

			expect(Object.isFrozen(settlement)).toBe(true);
		});
	});
});
