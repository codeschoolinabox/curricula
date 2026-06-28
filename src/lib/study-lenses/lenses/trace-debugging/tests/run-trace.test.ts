/**
 * @file Pure-async tests for `runTrace`, the `trace-debugging` lens's
 * orchestration seam. Node environment (vitest default — NO jsdom, NO Worker, NO
 * `vi.mock`): the seam is driven against a HAND-BUILT `VariablesTraceHandle`, the
 * same purity discipline as `./core.test.ts` (no factory; lens purity forbids a
 * runtime import from `embody/` or the tracer tier).
 *
 * ZOMBIES over the seam's three channels — the channel-1 admission throw, the
 * mounted-guarded `for await` drain, and the channel-2 `await result` settle.
 * Every async case `await`s `controller.done` before asserting (S3), so no
 * set-state-after-unmount window is left open and the fire-and-forget drain is
 * deterministic.
 *
 * The fake handle is an async generator (one `await` per event, modelling the
 * real worker's asynchronous arrival so a synchronous `cancel()` lands BEFORE the
 * next event) plus a `result` promise plus cancel/fail spies, settling
 * `cancelled` on iterator return. It does NOT mirror the engine's `exitIterator`
 * (which awaits its own result promise inside `return()` and would self-deadlock
 * in a hand-rolled fake); instead it flips an already-captured `resolve`.
 * `result` is a plain promise property — the real tracer's per-access getter is
 * irrelevant to the seam's read-once discipline.
 */

import { describe, expect, it } from 'vitest';

import type {
	VariablesSettlement,
	VariablesTraceEvent,
} from '../../../embody/types.js';
import runTrace from '../run-trace.js';

import {
	CANCELLED,
	COMPLETED,
	ERRORED,
	FAILED,
	READ,
	SCOPE_PUSH,
	TIMED_OUT,
	makeFakeHandle,
} from './fake-handle.js';

// ─── Test infrastructure ────────────────────────────────────────

/**
 * Push-recording callbacks (the pure-TS tier records into arrays rather than
 * importing `vi.fn`, matching `./core.test.ts`'s spy-free style). `throwOnEvent`
 * makes the first `onEvent` throw, to pin that the seam's `done` still resolves
 * when a callback throws.
 */
function makeCallbacks({ throwOnEvent = false }: { throwOnEvent?: boolean } = {}): {
	readonly callbacks: {
		readonly onEvent: (event: VariablesTraceEvent) => void;
		readonly onSettlement: (settlement: VariablesSettlement) => void;
		readonly onAdmissionError: (error: unknown) => void;
	};
	readonly events: readonly VariablesTraceEvent[];
	readonly settlements: readonly VariablesSettlement[];
	readonly admissionErrors: readonly unknown[];
} {
	const events: VariablesTraceEvent[] = [];
	const settlements: VariablesSettlement[] = [];
	const admissionErrors: unknown[] = [];
	const callbacks = {
		onEvent: (event: VariablesTraceEvent): void => {
			if (throwOnEvent) {
				throw new Error('onEvent threw');
			}
			events.push(event);
		},
		onSettlement: (settlement: VariablesSettlement): void => {
			settlements.push(settlement);
		},
		onAdmissionError: (error: unknown): void => {
			admissionErrors.push(error);
		},
	};
	return { callbacks, events, settlements, admissionErrors };
}

const alwaysMounted = (): boolean => true;
const neverMounted = (): boolean => false;

describe('runTrace', () => {
	// Zero — an empty stream: the handle yields nothing and settles `completed`.
	// onEvent never fires; onSettlement fires once with the completed settlement.
	it('settles completed with zero events when the handle yields nothing', async () => {
		const handle = makeFakeHandle({ events: [], terminal: COMPLETED });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect([recorder.events.length, recorder.settlements]).toEqual([
			0,
			[COMPLETED],
		]);
	});

	// One — a single event streams, then the completed settlement (forces the
	// drain to actually pull, and the fixture proves verbatim forwarding).
	it('forwards one streamed event then the completed settlement', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: COMPLETED });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect([recorder.events, recorder.settlements]).toEqual([
			[SCOPE_PUSH],
			[COMPLETED],
		]);
	});

	// One+ — several events, in arrival order, settled exactly once.
	it('forwards every streamed event in arrival order before settling once', async () => {
		const handle = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect([recorder.events, recorder.settlements]).toEqual([
			[SCOPE_PUSH, READ],
			[COMPLETED],
		]);
	});

	// Exception (channel 1) — the start thunk throws an Error: no run happened,
	// the raw throw reaches onAdmissionError, no events, no settlement.
	it('routes a synchronous admission throw to onAdmissionError with no events or settlement', async () => {
		const admission = new Error(
			'traceVariableLifecycle: not available on canned scenario',
		);
		const recorder = makeCallbacks();

		const controller = runTrace(
			() => {
				throw admission;
			},
			recorder.callbacks,
			alwaysMounted,
		);
		await controller.done;

		expect([
			recorder.admissionErrors,
			recorder.events.length,
			recorder.settlements.length,
		]).toEqual([[admission], 0, 0]);
	});

	// Many — an errored settlement carries the worker halt (errorName + nodePath).
	it('reports an errored settlement carrying the worker halt', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: ERRORED });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect(recorder.settlements).toEqual([ERRORED]);
	});

	// Many — a timed-out settlement carries the engine error (no worker halt).
	it('reports a timed-out settlement carrying the engine error', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: TIMED_OUT });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect(recorder.settlements).toEqual([TIMED_OUT]);
	});

	// Many — a failed settlement carries the consumer fail reason.
	it('reports a failed settlement carrying the fail reason', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: FAILED });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;

		expect(recorder.settlements).toEqual([FAILED]);
	});

	// Boundary (Many's cancelled class) — cancel before the first event: the run
	// settles `cancelled` (channel 2, flows to onSettlement normally) with zero
	// events forwarded and zero events pulled.
	it('settles cancelled with no events when cancelled before the first event', async () => {
		const handle = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		controller.cancel(); // before the detached drain pulls the first event
		await controller.done;

		expect([
			recorder.events.length,
			recorder.settlements,
			handle.emitted.length,
		]).toEqual([0, [CANCELLED], 0]);
	});

	// Boundary — cancel AFTER the run settled is an idempotent no-op: the
	// completed settlement stands, the late cancel changes nothing.
	it('ignores a cancel issued after the run already settled', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: COMPLETED });
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done;
		controller.cancel(); // post-settle — a no-op

		expect(recorder.settlements).toEqual([COMPLETED]);
	});

	// Boundary (M2) — the mounted-guard gates the callback, never the pull: while
	// unmounted, no callback fires, yet the drain pulls EVERY event to completion
	// (no undrained iterable) and `done` still resolves.
	it('drains every event but fires no callback while unmounted, and still resolves done', async () => {
		const handle = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, neverMounted);
		await controller.done;

		expect([
			recorder.events.length,
			recorder.settlements.length,
			handle.emitted.length,
		]).toEqual([0, 0, 2]);
	});

	// Boundary — unmount MID-stream: the early event is forwarded, later ones are
	// dropped, but the drain still pulls the whole iterable to completion.
	it('drops events after unmount mid-stream yet drains the iterable to completion', async () => {
		const handle = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		const recorder = makeCallbacks();
		let mounted = true;
		const isMounted = (): boolean => {
			const wasMounted = mounted;
			mounted = false; // flips false after the first read
			return wasMounted;
		};

		const controller = runTrace(() => handle, recorder.callbacks, isMounted);
		await controller.done;

		expect([recorder.events, handle.emitted.length]).toEqual([
			[SCOPE_PUSH],
			2,
		]);
	});

	// Exception (channel 1, E) — a NON-Error throw is forwarded verbatim (the
	// seam never inspects the throw; the core's classifier does, later).
	it('forwards a non-Error admission throw verbatim', async () => {
		const recorder = makeCallbacks();
		// A non-Error throw from an opaque tier (typed `unknown`, as the seam
		// sees it): the seam forwards it untouched; the core classifier handles
		// the string form later.
		const nonError: unknown = 'string-reason';

		const controller = runTrace(
			() => {
				throw nonError;
			},
			recorder.callbacks,
			alwaysMounted,
		);
		await controller.done;

		expect(recorder.admissionErrors).toEqual(['string-reason']);
	});

	// Boundary — the mounted-guard is uniform across the state-bearing callbacks:
	// a channel-1 throw while unmounted fires NO callback (the admission error is
	// dropped just as a late event would be), and `done` still resolves.
	it('drops the admission error while unmounted and still resolves done', async () => {
		const admission = new Error('traceVariables: not Just-Enough-JavaScript');
		const recorder = makeCallbacks();

		const controller = runTrace(
			() => {
				throw admission;
			},
			recorder.callbacks,
			neverMounted,
		);
		await controller.done;

		expect(recorder.admissionErrors.length).toEqual(0);
	});

	// Exception (E, done-totality) — a throwing onEvent does NOT reject `done`:
	// the swallowing catch aborts the drain (so no settlement surfaces) and the
	// guarded finally tears down — `done` resolves, letting the shell `void` it.
	it('resolves done without rejecting when onEvent throws (no settlement surfaces)', async () => {
		const handle = makeFakeHandle({ events: [SCOPE_PUSH], terminal: COMPLETED });
		const recorder = makeCallbacks({ throwOnEvent: true });

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done; // resolves — a rejection would fail the test here

		// The event WAS pulled (emitted) before onEvent threw — proving the throw
		// aborted the drain mid-flight (not that the event was never reached) —
		// yet no event was recorded and no settlement surfaced.
		expect([
			recorder.events.length,
			recorder.settlements.length,
			handle.emitted.length,
		]).toEqual([0, 0, 1]);
	});

	// Exception (E, done-totality) — a throwing handle.cancel in the guarded
	// finally does NOT reject `done` nor lose the settlement: the completed run
	// surfaces normally, the best-effort teardown throw is swallowed.
	it('resolves done and keeps the settlement when handle.cancel throws', async () => {
		const handle = makeFakeHandle({
			events: [SCOPE_PUSH],
			terminal: COMPLETED,
			cancelThrows: true,
		});
		const recorder = makeCallbacks();

		const controller = runTrace(() => handle, recorder.callbacks, alwaysMounted);
		await controller.done; // resolves despite the finally's throwing cancel

		expect(recorder.settlements).toEqual([COMPLETED]);
	});
});
