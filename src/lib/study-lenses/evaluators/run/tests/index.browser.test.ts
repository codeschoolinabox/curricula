/**
 * @file R5's browser tier: the end-to-end evidence, through the kind surface,
 * over the REAL transport — a genuine module Worker with shared memory.
 *
 * This is the only tier that can evidence what the fake cannot: the worker
 * entry actually boots, the guard helpers reach a real sandboxed program, a
 * dialog call is the program's own honest ReferenceError (run injects none),
 * a cancel interrupts a genuinely live run, and the execution axis rides
 * through — the fake runs the function path regardless of the axis, so only
 * this tier proves `'module'` is honored.
 */

import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import type { EvaluationSpec } from '../../types.js';
import run from '../index.js';
import type { RunSettlement, RunStream } from '../types.js';

function specFor(
	code: string,
	extras: Partial<EvaluationSpec> = {},
): EvaluationSpec {
	const facts = { source: { ok: true, value: code } } as unknown as Facts;
	return { facts, execution: 'function', ...extras };
}

function streamFor(spec: EvaluationSpec): RunStream {
	const answer = run.main(spec);
	if ('refused' in answer) {
		throw new Error(`unexpected refusal: ${answer.reason}`);
	}
	return answer;
}

async function settlementOf(spec: EvaluationSpec): Promise<RunSettlement> {
	const stream = streamFor(spec);
	await stream[Symbol.asyncIterator]().next();
	return stream.settled;
}

describe('run evaluator (browser — real transport)', () => {
	describe('the environment hosts a run', () => {
		it('does not refuse where Worker and shared memory both exist', () => {
			expect(run.main(specFor('1 + 1;'))).not.toHaveProperty('refused');
		});

		it('applicability stays true here too, so it never read the environment', () => {
			// PINNED(D8-as-widened, human-ratified 2026-07-28: applicability is PURE over the spec — an implementation that conflated it with the environment probe would flip here, where Worker exists, and break the consuming lens's options list)
			expect(run.applicability(specFor('1 + 1;'))).toBe(true);
		});
	});

	describe('a program that ends', () => {
		it('settles clean through the kind surface', async () => {
			expect(await settlementOf(specFor('1 + 1;'))).toStrictEqual({
				ended: 'clean',
			});
		});

		it('settles clean having produced nothing when its only output rides a timer', async () => {
			expect(
				await settlementOf(specFor('setTimeout(() => { let x = 1; }, 0);')),
			).toStrictEqual({ ended: 'clean' });
		});
	});

	describe('a program that throws', () => {
		it('settles error with reason threw', async () => {
			const settlement = await settlementOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it("carries the machine's own error name", async () => {
			const settlement = await settlementOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.name', 'TypeError');
		});

		it('carries a real iteration count on the threw arm', async () => {
			const settlement = await settlementOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.iterationCount', 0);
		});
	});

	describe('a non-Error throw', () => {
		it('is classified worker-side into honest machine words', async () => {
			const settlement = await settlementOf(specFor("throw 'oops';"));

			expect(settlement).toHaveProperty('error.name', 'Error');
		});

		it('carries the thrown value in string form', async () => {
			const settlement = await settlementOf(specFor("throw 'oops';"));

			expect(settlement).toHaveProperty('error.message', 'oops');
		});

		it('is still reason threw', async () => {
			const settlement = await settlementOf(specFor("throw 'oops';"));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});
	});

	describe('a dialog call', () => {
		it('settles error with reason threw — run injects no dialogs', async () => {
			const settlement = await settlementOf(specFor("prompt('hi');"));

			// PINNED(D4 ratified: run injects no dialogs, so a dialog call is the program's own honest ReferenceError — nothing is mocked and nothing hangs)
			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it('is a ReferenceError', async () => {
			const settlement = await settlementOf(specFor("prompt('hi');"));

			expect(settlement).toHaveProperty('error.name', 'ReferenceError');
		});

		it('names prompt in the machine words', async () => {
			const settlement = await settlementOf(specFor("prompt('hi');"));
			const { message } = (settlement as { error: { message: string } }).error;

			expect(message).toContain('prompt');
		});
	});

	describe('a capped runaway loop', () => {
		it('settles error with reason loop-cap', async () => {
			const settlement = await settlementOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.reason', 'loop-cap');
		});

		it('carries the run total, which includes the tripping iteration', async () => {
			const settlement = await settlementOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			// PINNED(iteration-guard README § Edge cases: the guard increments before it compares, so a cap of N trips at N+1)
			expect(settlement).toHaveProperty('error.iterationCount', 6);
		});

		it("carries the loop's own decoded span", async () => {
			const settlement = await settlementOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.trip.loc.start', {
				line: 1,
				column: 0,
			});
		});

		it('carries the tripped loop index', async () => {
			const settlement = await settlementOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.trip.loopIndex', 1);
		});
	});

	describe('the module axis', () => {
		it('settles clean on trivial code — the baseline for the differential row', async () => {
			expect(
				await settlementOf(specFor('let x = 1;', { execution: 'module' })),
			).toStrictEqual({ ended: 'clean' });
		});

		it('runs top-level await, which the function path cannot — the axis really rides through', async () => {
			expect(
				await settlementOf(specFor('await 1;', { execution: 'module' })),
			).toStrictEqual({ ended: 'clean' });
		});

		it('maps a rejected top-level evaluation to reason threw', async () => {
			const settlement = await settlementOf(
				specFor("await Promise.reject(new Error('rej'));", {
					execution: 'module',
				}),
			);

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});
	});

	describe('cancellation of a live run', () => {
		it('settles canceled', async () => {
			const stream = streamFor(
				specFor('while (true) { let x = 1; }', { execution: 'function' }),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const pull = iterator.next();
			void iterator.return?.();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
			await pull;
		});

		it('settles promptly, well under the engine default budget', async () => {
			const stream = streamFor(
				specFor('while (true) { let x = 1; }', { execution: 'function' }),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const startedAt = performance.now();
			const pull = iterator.next();
			void iterator.return?.();
			await stream.settled;

			expect(performance.now() - startedAt).toBeLessThan(4000);
			await pull;
		});
	});
});
