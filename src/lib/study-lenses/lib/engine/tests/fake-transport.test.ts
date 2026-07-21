/**
 * Fake-transport behavior — node project, no worker, no shared memory.
 * The clone rows ("equal but not the same reference") pin the fake's
 * reason to exist; they cannot be hardcoded. DataCloneError naming is
 * pinned here (deterministic in Node); the agnostic tier asserts the
 * same paths engine-name-agnostically.
 */

import { describe, expect, it, vi } from 'vitest';

import evaluate from '../evaluate.js';
import createFakeTransport from '../testing/fake-transport.js';
import REFERENCE_THREAD_LOGIC from '../testing/reference-thread-logic.js';
import referenceWorkerSetup from '../testing/reference-worker-setup.js';
import type { EngineHandle, EvaluateSpec } from '../types.js';

function fakeRun(
	code: string,
	overrides: Partial<EvaluateSpec> = {},
): EngineHandle {
	const spec: EvaluateSpec = {
		code,
		// The fake runs same-thread and never invokes the factory; a throwing
		// dummy makes "never invoked" assertable.
		workerFactory: () => {
			throw new Error('fake transport must not construct a worker');
		},
		threadLogic: REFERENCE_THREAD_LOGIC,
		...overrides,
	};
	return evaluate(
		spec,
		createFakeTransport(referenceWorkerSetup, spec.threadLogic),
	);
}

describe('createFakeTransport', () => {
	describe('completion', () => {
		it('settles completed with the engine-default halt', async () => {
			const handle = fakeRun('', {
				workerConfig: { omitSerializeHalt: true },
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.halt]).toEqual([
				'completed',
				{ name: 'natural-end', message: '' },
			]);
		});

		it('settles completed with the reference-stamped halt', async () => {
			const handle = fakeRun('');
			const { settlement } = await handle.result;

			expect(settlement.halt).toEqual({
				kind: 'natural-end',
				name: 'natural-end',
				message: '',
				viaReference: true,
			});
		});

		it('never invokes the worker factory (same-thread run)', async () => {
			const workerFactory = vi.fn();
			const handle = evaluate(
				{ code: '', workerFactory, threadLogic: REFERENCE_THREAD_LOGIC },
				createFakeTransport(referenceWorkerSetup, REFERENCE_THREAD_LOGIC),
			);
			await handle.result;

			expect(workerFactory).not.toHaveBeenCalled();
		});

		it('drops work scheduled beyond the natural end (a pending timer never runs)', async () => {
			const handle = fakeRun("setTimeout(() => emit('late'), 0);");
			const { items } = await handle.result;
			await new Promise((resolve) => {
				setTimeout(resolve, 10);
			});

			expect(items).toEqual([]);
		});
	});

	describe('clone boundary (the fake’s reason to exist)', () => {
		it('delivers an emitted object as an equal value', async () => {
			const handle = fakeRun('emit({ step: 1 });');
			const { items } = await handle.result;

			expect(items[0]).toEqual({ step: 1 });
		});

		it('delivers an emitted object as a different reference', async () => {
			const marker = { step: 1 };
			const handle = fakeRun('emit(getConfig());', {
				workerConfig: marker,
			});
			const { items } = await handle.result;

			expect(items[0]).not.toBe(marker);
		});

		it('halts errored with DataCloneError on a clone-unsafe emit', async () => {
			const handle = fakeRun('emit(() => {});');
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string }).name,
			]).toEqual(['errored', 'DataCloneError']);
		});

		it('settles worker-error on a clone-unsafe worker config', async () => {
			const handle = fakeRun('', {
				workerConfig: { fn: () => {} },
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});
	});

	describe('call channel (sync only)', () => {
		it('services a sync call directly into the program', async () => {
			const handle = fakeRun("emit(call('ping'));");
			const { items } = await handle.result;

			expect(items).toEqual(['ping']);
		});

		it('settles call-error when onCall is absent', async () => {
			const handle = fakeRun("call('ping');", {
				threadLogic: { onMessage: REFERENCE_THREAD_LOGIC.onMessage },
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'call-error',
			]);
		});

		it('never observes program effects after an unserviceable call', async () => {
			const handle = fakeRun(
				"try { call('unserviced'); } catch (e) {} emit('after');",
				{
					threadLogic: { onMessage: REFERENCE_THREAD_LOGIC.onMessage },
				},
			);
			const { items, settlement } = await handle.result;

			expect([items, settlement.error?.cause]).toEqual([[], 'call-error']);
		});

		it('settles call-error when onCall throws synchronously', async () => {
			const handle = fakeRun("call('ping');", {
				threadLogic: {
					onMessage: REFERENCE_THREAD_LOGIC.onMessage,
					onCall() {
						throw new Error('no service');
					},
				},
			});
			const { settlement } = await handle.result;

			expect(settlement.error?.cause).toBe('call-error');
		});

		it('invokes onCall twice on a synchronous throw (documented double-invocation)', async () => {
			const onCall = vi.fn(() => {
				throw new Error('no service');
			});
			const handle = fakeRun("call('ping');", {
				threadLogic: { onMessage: REFERENCE_THREAD_LOGIC.onMessage, onCall },
			});
			await handle.result;

			expect(onCall).toHaveBeenCalledTimes(2);
		});

		it('fails loudly when onCall returns a thenable', async () => {
			const handle = fakeRun("call('ping');", {
				threadLogic: {
					onMessage: REFERENCE_THREAD_LOGIC.onMessage,
					onCall() {
						return Promise.resolve('too-late');
					},
				},
			});
			const { settlement } = await handle.result;

			expect([settlement.error?.cause, settlement.error?.name]).toEqual([
				'worker-error',
				'EngineFakeTransportError',
			]);
		});
	});

	describe('setup mirrors the bootstrap observably', () => {
		it('settles worker-error on a throwing setup', async () => {
			const handle = fakeRun('', {
				workerConfig: { throwInSetup: true },
			});
			const { settlement } = await handle.result;

			expect(settlement.error?.cause).toBe('worker-error');
		});

		it('settles worker-error on an invalid global key', async () => {
			const handle = fakeRun('', {
				workerConfig: { invalidGlobalKey: '1bad' },
			});
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.error?.cause]).toEqual([
				'errored',
				'worker-error',
			]);
		});

		it('routes a strict-mode SyntaxError through the halt path', async () => {
			const handle = fakeRun('with (Math) { emit(PI); }');
			const { settlement } = await handle.result;

			expect([
				settlement.outcome,
				(settlement.halt as { name: string }).name,
			]).toEqual(['errored', 'SyntaxError']);
		});

		it('runs sloppy constructs under strict false', async () => {
			const handle = fakeRun('with (Math) { emit(PI); }', {
				strict: false,
			});
			const { items } = await handle.result;

			expect(items).toEqual([Math.PI]);
		});
	});
});
