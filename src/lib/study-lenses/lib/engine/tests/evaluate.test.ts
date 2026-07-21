/**
 * Pre-start + handle-surface invariants — node project.
 *
 * Node has no global Worker, so every test here proves full laziness
 * structurally: a non-lazy implementation crashes at construction.
 * `items: []` in these rows is a pre-start structural invariant, NOT
 * triangulation of the items pipeline — the drain row in the agnostic
 * conformance suite (tests/conformance/agnostic/, node fake-transport
 * AND browser real-transport) is the kill-shot for hardcoded-empty
 * items. Genuinely real-transport-only behavior (pause fidelity,
 * timer, in-flight call discard, environment failures) lives in
 * evaluate.browser.test.ts and tests/conformance/transport/.
 */

import { describe, expect, it, vi } from 'vitest';

import evaluate from '../evaluate.js';
import type { EngineHandle } from '../types.js';
import type {
	Transport,
	TransportEvent,
	TransportInit,
} from '../worker/types.js';

function lazyHandle(): EngineHandle {
	return evaluate({
		code: '',
		// Node has no Worker and these rows never start a run — a throwing
		// factory documents (and would loudly prove) it is never invoked.
		workerFactory: () => {
			throw new Error('worker factory must not run in node');
		},
		threadLogic: { onMessage: (message) => message },
	});
}

describe('evaluate', () => {
	describe('pre-start stops (fully lazy — no worker exists in node)', () => {
		it('settles cancelled with no items when cancelled before any pull', async () => {
			const handle = lazyHandle();
			handle.cancel();
			const { items, settlement } = await handle.result;

			expect([items, settlement.outcome]).toEqual([[], 'cancelled']);
		});

		it('settles failed with the same failReason reference', async () => {
			const reason = { prediction: 'wrong' };
			const handle = lazyHandle();
			handle.fail(reason);
			const { settlement } = await handle.result;

			expect([settlement.outcome, settlement.failReason]).toEqual([
				'failed',
				reason,
			]);
		});

		it('does not deep-freeze the failReason', async () => {
			const handle = lazyHandle();
			handle.fail({ mutable: true });
			const { settlement } = await handle.result;

			expect(Object.isFrozen(settlement.failReason)).toBe(false);
		});

		it('carries no engine error on a consumer stop', async () => {
			const handle = lazyHandle();
			handle.cancel();
			const { settlement } = await handle.result;

			expect(settlement.error).toBeUndefined();
		});

		it('consumes no budget before the run starts', async () => {
			const handle = lazyHandle();
			handle.cancel();
			const { settlement } = await handle.result;

			expect(settlement.durationMs).toBe(0);
		});
	});

	describe('first write wins', () => {
		it('keeps failed when cancel arrives after fail', async () => {
			const handle = lazyHandle();
			handle.fail('first');
			handle.cancel();
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('failed');
		});

		it('keeps cancelled when fail arrives after cancel', async () => {
			const handle = lazyHandle();
			handle.cancel();
			handle.fail('late');
			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('cancelled');
		});

		it('keeps the first reason across repeated fails', async () => {
			const first = { attempt: 1 };
			const handle = lazyHandle();
			handle.fail(first);
			handle.fail({ attempt: 2 });
			const { settlement } = await handle.result;

			expect(settlement.failReason).toBe(first);
		});

		it('tolerates repeated cancels across the lifecycle', async () => {
			const handle = lazyHandle();
			handle.cancel();
			handle.cancel();
			await handle.result;

			expect(() => handle.cancel()).not.toThrow();
		});
	});

	describe('run trigger (no prior stop)', () => {
		it('attempts to start the run on result access alone', async () => {
			const handle = lazyHandle();
			const { settlement } = await handle.result;

			expect(settlement.error).toMatchObject({
				cause: 'worker-error',
				name: 'EngineEnvironmentError',
			});
		});
	});

	describe('execution axis rides the spec to the transport', () => {
		it('defaults the execution axis to function', async () => {
			const seen = { init: null as TransportInit | null };
			const stubTransport: Transport = Object.freeze({
				start: (init: TransportInit) => {
					seen.init = init;
					return Promise.resolve();
				},
				next: (): Promise<TransportEvent> =>
					Promise.resolve({
						kind: 'halt',
						haltKind: 'natural-end',
						payload: {},
					}),
				hasPendingEvent: () => false,
				resume: () => {},
				respond: () => {},
				terminate: () => {},
			});
			const handle = evaluate(
				{
					code: '',
					workerFactory: () => {
						throw new Error('unused — stub transport never spawns');
					},
					threadLogic: { onMessage: (message) => message },
				},
				() => stubTransport,
			);
			await handle.result;

			expect(seen.init?.execution).toBe('function');
		});

		it('passes the module axis through to the transport', async () => {
			const seen = { init: null as TransportInit | null };
			const stubTransport: Transport = Object.freeze({
				start: (init: TransportInit) => {
					seen.init = init;
					return Promise.resolve();
				},
				next: (): Promise<TransportEvent> =>
					Promise.resolve({
						kind: 'halt',
						haltKind: 'natural-end',
						payload: {},
					}),
				hasPendingEvent: () => false,
				resume: () => {},
				respond: () => {},
				terminate: () => {},
			});
			const handle = evaluate(
				{
					code: '',
					workerFactory: () => {
						throw new Error('unused — stub transport never spawns');
					},
					threadLogic: { onMessage: (message) => message },
					execution: 'module',
				},
				() => stubTransport,
			);
			await handle.result;

			expect(seen.init?.execution).toBe('module');
		});
	});

	// The real-transport hop (TransportInit.execution → the posted
	// ExecuteMessage.execution) is unverified here — proven end-to-end
	// by tests/conformance/transport/module-execution.browser.test.ts
	// (real-transport-only: the fake cannot instantiate an ES module).

	describe('in-flight call discard (transport seam)', () => {
		it('never writes the response back after a stop wins mid-call', async () => {
			const respond = vi.fn();
			const delivery = { queue: ['call'] as string[] };
			const stubTransport: Transport = Object.freeze({
				start: () => Promise.resolve(),
				next: (): Promise<TransportEvent> =>
					delivery.queue.shift() === 'call'
						? Promise.resolve({ kind: 'call', request: 'ping' })
						: new Promise<never>(() => {}),
				hasPendingEvent: () => false,
				resume: () => {},
				respond,
				terminate: () => {},
			});
			const gate = { release: () => {} };
			const handle = evaluate(
				{
					code: '',
					workerFactory: () => {
						throw new Error('unused — stub transport never spawns');
					},
					threadLogic: {
						onMessage: (message) => message,
						onCall: () =>
							new Promise((resolve) => {
								gate.release = () => resolve('late');
							}),
					},
				},
				() => stubTransport,
			);
			const resultPromise = handle.result;
			await new Promise((resolve) => {
				setTimeout(resolve, 0);
			});
			handle.cancel();
			gate.release();
			const { settlement } = await resultPromise;

			expect([settlement.outcome, respond.mock.calls]).toEqual([
				'cancelled',
				[],
			]);
		});
	});

	describe('handle surface', () => {
		it('memoizes result — the same Promise on repeated access', () => {
			const handle = lazyHandle();
			handle.cancel();

			expect(handle.result).toBe(handle.result);
		});

		it('freezes the settlement', async () => {
			const handle = lazyHandle();
			handle.cancel();
			const { settlement } = await handle.result;

			expect(Object.isFrozen(settlement)).toBe(true);
		});

		it('freezes the items array', async () => {
			const handle = lazyHandle();
			handle.cancel();
			const { items } = await handle.result;

			expect(Object.isFrozen(items)).toBe(true);
		});

		it('does not expose then — the handle is not a PromiseLike', () => {
			const handle = lazyHandle();

			expect('then' in handle).toBe(false);
		});

		it('rejects assignment to cancel', () => {
			const handle = lazyHandle();

			expect(() => {
				(handle as { cancel: () => void }).cancel = () => {};
			}).toThrow();
		});

		it('rejects assignment to fail', () => {
			const handle = lazyHandle();

			expect(() => {
				(handle as { fail: () => void }).fail = () => {};
			}).toThrow();
		});

		it('rejects assignment to result', () => {
			const handle = lazyHandle();

			expect(() => {
				(handle as { result: unknown }).result = null;
			}).toThrow();
		});

		it('yields nothing when iterating after settlement', async () => {
			const handle = lazyHandle();
			handle.cancel();
			await handle.result;
			const pulled = [];
			for await (const item of handle) {
				pulled.push(item);
			}

			expect(pulled).toEqual([]);
		});
	});
});
