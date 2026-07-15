/**
 * @file Shared test double for `VariablesTraceHandle` plus the streamed-event and
 * settlement fixtures. Extracted from `./run-trace.test.ts` so the C4 seam test
 * and the C5/C6 jsdom component test drive the IDENTICAL fake — one notion of the
 * worker's async-arrival behaviour, no drift between the two layers.
 *
 * Node-safe: no Worker, no SharedArrayBuffer, no jsdom. The fake is an async
 * generator (one `await` per event, modelling the real worker's asynchronous
 * arrival so a synchronous `cancel()` lands BEFORE the next event) plus a `result`
 * promise plus cancel/fail spies, settling `cancelled` on iterator return. It does
 * NOT mirror the engine's `exitIterator` (which awaits its own result promise
 * inside `return()` and would self-deadlock in a hand-rolled fake); instead it
 * flips an already-captured `resolve`. `result` is a plain promise property — the
 * real tracer's per-access getter is irrelevant to the seam's read-once discipline.
 *
 * @remarks Named exports are permitted here (`import/no-named-export` is off under
 * the `tests/` override); the `.ts`-import ban still applies, so consumers import
 * from `./fake-handle.js`.
 */

import type {
	VariablesSettlement,
	VariablesTraceEvent,
	VariablesTraceHandle,
	VariablesTraceResult,
} from '../../../../embody/types.js';

/**
 * A hand-built `VariablesTraceHandle`. The `events` stream in order (one `await`
 * per event so an external `cancel()` set synchronously after kickoff is observed
 * BEFORE the next event), then the `terminal` settlement resolves `result` on a
 * natural drain. An external `cancel()` between yields short-circuits the
 * generator, whose `finally` settles `cancelled` (a no-op if a terminal already
 * settled). `cancelThrows` makes `cancel()` throw, to pin the seam's guarded
 * teardown. `emitted` is exposed so a test can assert the drain pulled every event
 * (the no-undrained-iterable invariant) directly, not through a closure.
 */
export function makeFakeHandle({
	events,
	terminal,
	cancelThrows = false,
}: {
	events: readonly VariablesTraceEvent[];
	terminal: VariablesSettlement;
	cancelThrows?: boolean;
}): VariablesTraceHandle & {
	readonly emitted: readonly VariablesTraceEvent[];
} {
	const emitted: VariablesTraceEvent[] = [];
	let settled = false;
	let cancelled = false;
	let resolveResult!: (result: VariablesTraceResult) => void;
	const result = new Promise<VariablesTraceResult>((resolve) => {
		resolveResult = resolve;
	});

	function settle(settlement: VariablesSettlement): void {
		if (settled) {
			return;
		}
		settled = true;
		resolveResult({ events: emitted, settlement });
	}

	async function* generate(): AsyncGenerator<VariablesTraceEvent> {
		try {
			for (const event of events) {
				await Promise.resolve(); // model the worker's async arrival
				if (cancelled) {
					return; // external cancel interrupts BEFORE the next event
				}
				emitted.push(event);
				yield event;
			}
			settle(terminal); // natural drain → the scripted terminal outcome
		} finally {
			// break / return / throw → cancelled (no-op if already settled)
			settle({ outcome: 'cancelled', halt: null, durationMs: 0 });
		}
	}

	const cancel = (): void => {
		if (cancelThrows) {
			throw new Error('teardown threw');
		}
		cancelled = true;
	};
	const fail = (): void => {
		// The seam never calls fail(); present only to satisfy the handle shape.
	};

	return { [Symbol.asyncIterator]: generate, result, cancel, fail, emitted };
}

// ─── Settlement fixtures (the five channel-2 outcomes) ──────────

export const COMPLETED: VariablesSettlement = {
	outcome: 'completed',
	halt: { natural: true, errorName: '', message: '', nodePath: null },
	durationMs: 1,
};
export const ERRORED: VariablesSettlement = {
	outcome: 'errored',
	halt: {
		natural: false,
		errorName: 'TypeError',
		message: 'Assignment to constant variable.',
		nodePath: '$.body.1',
	},
	durationMs: 2,
};
export const TIMED_OUT: VariablesSettlement = {
	outcome: 'timed-out',
	halt: null,
	engineError: {
		cause: 'timeout',
		name: 'TimeoutError',
		message: 'budget exceeded',
	},
	durationMs: 200,
};
export const FAILED: VariablesSettlement = {
	outcome: 'failed',
	halt: null,
	failReason: 'wrong-prediction',
	durationMs: 3,
};
// `cancelled` is produced by the cancel path, never scripted as `terminal`; the
// fake's `finally` builds exactly this shape.
export const CANCELLED: VariablesSettlement = {
	outcome: 'cancelled',
	halt: null,
	durationMs: 0,
};

// ─── Streamed-event fixtures ────────────────────────────────────

export const SCOPE_PUSH: VariablesTraceEvent = {
	step: 0,
	nodePath: '$.body.0',
	scopeInstanceId: 1,
	event: 'scope-push',
	scopeKind: 'block',
	variables: [],
};
export const READ: VariablesTraceEvent = {
	step: 4,
	nodePath: '$.body.2.expression',
	scopeInstanceId: 1,
	event: 'read',
	name: 'x',
	value: 5,
};
