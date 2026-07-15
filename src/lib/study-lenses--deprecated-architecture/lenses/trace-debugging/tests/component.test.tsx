/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `trace-debugging` lens. The real tracer is
 * Worker + SharedArrayBuffer backed and cannot run in jsdom, so — unlike the
 * sync/CPU-local peer lenses that mount a real `embody(source)` — these tests
 * inject a FAKED embodiment whose `evaluation.events.traceVariableLifecycle`
 * returns the shared hand-built fake handle (`./fake-handle.js`). No `vi.mock`.
 *
 * The Run click kicks off the detached async drain in the seam, so the dumps
 * fill across microtasks AFTER the click handler returns — every behavioural
 * assertion is wrapped in `await waitFor(...)` (which retries inside `act`).
 */

import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type {
	Snippet,
	TraceVariableLifecycleOptions,
	VariablesTraceEvent,
	VariablesTraceHandle,
	VariablesTraceResult,
} from '../../../../embody/types.js';
import traceDebuggingLens from '../index.jsx';

import { COMPLETED, READ, SCOPE_PUSH, makeFakeHandle } from './fake-handle.js';

afterEach(cleanup);

// ─── Test infrastructure ────────────────────────────────────────

/**
 * Builds a faked `embodiment` whose `traceVariableLifecycle` returns the given
 * fake handle and records the options it was called with (so a test can assert
 * the seconds budget was forwarded). The Component touches ONLY this access path
 * on the Snippet, so the narrow `as unknown as Snippet` cast is safe.
 */
function makeFakeEmbodiment(handle: VariablesTraceHandle): {
	readonly embodiment: Snippet;
	readonly calls: ReadonlyArray<TraceVariableLifecycleOptions | undefined>;
} {
	const calls: Array<TraceVariableLifecycleOptions | undefined> = [];
	const embodiment = {
		evaluation: {
			events: {
				traceVariableLifecycle: (
					options?: TraceVariableLifecycleOptions,
				): VariablesTraceHandle => {
					calls.push(options);
					return handle;
				},
			},
		},
	} as unknown as Snippet;
	return { embodiment, calls };
}

/** Queries a required element under a container; throws if absent (test bug). */
function get(container: HTMLElement, selector: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(selector);
	if (element === null) {
		throw new Error(`missing element: ${selector}`);
	}
	return element;
}

/**
 * A handle that streams `event` then HANGS — never settling on its own (its
 * `result` stays pending) until `cancel` releases it. Lets a test prove that
 * `handle.cancel()` was reached via a specific path (unmount / re-Run) rather than
 * the seam's end-of-drain `finally` cancel, which fires on any natural settle and
 * would mask a missing cleanup.
 */
function makeHangingHandle(event: VariablesTraceEvent): {
	readonly handle: VariablesTraceHandle;
	readonly cancelled: () => boolean;
} {
	let releaseHang!: () => void;
	const hang = new Promise<void>((resolve) => {
		releaseHang = resolve;
	});
	let resolveResult!: (result: VariablesTraceResult) => void;
	const result = new Promise<VariablesTraceResult>((resolve) => {
		resolveResult = resolve;
	});
	let wasCancelled = false;
	async function* run(): AsyncGenerator<VariablesTraceEvent> {
		yield event;
		await hang; // park until cancel releases it
		resolveResult({
			events: [event],
			settlement: { outcome: 'cancelled', halt: null, durationMs: 0 },
		});
	}
	const handle: VariablesTraceHandle = {
		[Symbol.asyncIterator]: run,
		get result(): Promise<VariablesTraceResult> {
			return result;
		},
		cancel: (): void => {
			wasCancelled = true;
			releaseHang();
		},
		fail: (): void => {},
	};
	return { handle, cancelled: () => wasCancelled };
}

// ─── LensModule shape (synchronous; no run needed) ──────────────

describe('traceDebuggingLens (module shape)', () => {
	it('is a frozen Tier-1 LensModule named trace-debugging', () => {
		expect([
			traceDebuggingLens.name,
			Object.isFrozen(traceDebuggingLens),
			typeof traceDebuggingLens.Component,
		]).toEqual(['trace-debugging', true, 'function']);
	});

	it('is applicable to every snippet and recommends nothing (recommender-inert)', () => {
		expect([
			traceDebuggingLens.applicableTo(embody('let x = 1;')),
			traceDebuggingLens.recommend(embody('let x = 1;')),
		]).toEqual([true, []]);
	});

	it('declares no phase (panel-excluded) and returns a frozen config', () => {
		expect([
			traceDebuggingLens.phase,
			Object.isFrozen(traceDebuggingLens.config()),
		]).toEqual([undefined, true]);
	});
});

// ─── Render + the streamed run ──────────────────────────────────

describe('TraceDebuggingComponent', () => {
	it('renders the data-lens root and the three trace controls', () => {
		const { embodiment } = makeFakeEmbodiment(
			makeFakeHandle({ events: [], terminal: COMPLETED }),
		);
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		const stop = get(
			container,
			'[data-trace-control="stop"]',
		) as HTMLButtonElement;
		expect([
			container.querySelector('[data-lens="trace-debugging"]') !== null,
			container.querySelector('[data-trace-control="run"]') !== null,
			container.querySelector('[data-trace-control="seconds"]') !== null,
			stop.disabled, // Stop is armed only while running — disabled at idle
		]).toEqual([true, true, true, true]);
	});

	it('streams the formatted event lines then the settlement dump on Run', async () => {
		const { embodiment } = makeFakeEmbodiment(
			makeFakeHandle({ events: [SCOPE_PUSH, READ], terminal: COMPLETED }),
		);
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		fireEvent.click(get(container, '[data-trace-control="run"]'));

		await waitFor(() => {
			const events = get(container, '[data-trace-dump="events"]').textContent;
			const settlement = get(
				container,
				'[data-trace-dump="settlement"]',
			).textContent;
			expect([
				events?.includes('step 0 $.body.0 SCOPE-PUSH block vars=[]'),
				events?.includes('step 4 $.body.2.expression READ x → 5'),
				settlement?.includes('completed'),
			]).toEqual([true, true, true]);
		});

		// Settled → Stop re-disables (armed only while running).
		expect(
			(get(container, '[data-trace-control="stop"]') as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});

	it('shows the admission-error dump when the call throws synchronously', async () => {
		const embodiment = {
			evaluation: {
				events: {
					traceVariableLifecycle: (): VariablesTraceHandle => {
						throw new Error('not Just-Enough-JavaScript');
					},
				},
			},
		} as unknown as Snippet;
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		fireEvent.click(get(container, '[data-trace-control="run"]'));

		await waitFor(() => {
			const admission = get(
				container,
				'[data-trace-dump="admission-error"]',
			).textContent;
			const events = get(container, '[data-trace-dump="events"]').textContent;
			expect([admission?.includes('admission refused'), events]).toEqual([
				true,
				'',
			]);
		});
	});

	it('reaches the handle cancel and settles cancelled on Stop', async () => {
		const inner = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		let cancelCalled = false;
		const handle: VariablesTraceHandle = {
			...inner,
			cancel: (): void => {
				cancelCalled = true;
				inner.cancel();
			},
		};
		const { embodiment } = makeFakeEmbodiment(handle);
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		// Two consecutive SYNCHRONOUS clicks: Stop lands before the first event
		// arrives (the fake awaits a microtask per event), so the run settles
		// `cancelled` with the cancel reached.
		fireEvent.click(get(container, '[data-trace-control="run"]'));
		fireEvent.click(get(container, '[data-trace-control="stop"]'));

		await waitFor(() => {
			const settlement = get(
				container,
				'[data-trace-dump="settlement"]',
			).textContent;
			expect([cancelCalled, settlement?.includes('cancelled')]).toEqual([
				true,
				true,
			]);
		});
	});

	it('cancels a still-draining prior run when Run is clicked again', async () => {
		const first = makeFakeHandle({
			events: [SCOPE_PUSH, READ],
			terminal: COMPLETED,
		});
		let firstCancelled = false;
		const firstHandle: VariablesTraceHandle = {
			...first,
			cancel: (): void => {
				firstCancelled = true;
				first.cancel();
			},
		};
		const handles = [
			firstHandle,
			makeFakeHandle({ events: [], terminal: COMPLETED }),
		];
		let callIndex = 0;
		const embodiment = {
			evaluation: {
				events: {
					traceVariableLifecycle: (): VariablesTraceHandle => {
						const handle = handles[callIndex];
						callIndex += 1;
						return handle;
					},
				},
			},
		} as unknown as Snippet;
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);
		const run = get(container, '[data-trace-control="run"]');

		// Re-Run before the first run drains → the prior controller is cancelled.
		fireEvent.click(run);
		fireEvent.click(run);

		await waitFor(() => {
			expect(firstCancelled).toBe(true);
		});
	});

	it('forwards { seconds: N } when a numeric seconds budget is entered', async () => {
		const { embodiment, calls } = makeFakeEmbodiment(
			makeFakeHandle({ events: [], terminal: COMPLETED }),
		);
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		fireEvent.change(get(container, '[data-trace-control="seconds"]'), {
			target: { value: '2' },
		});
		fireEvent.click(get(container, '[data-trace-control="run"]'));

		await waitFor(() => {
			expect(calls.at(-1)).toEqual({ seconds: 2 });
		});
	});

	it('omits the seconds budget when the field is non-numeric or empty', async () => {
		const { embodiment, calls } = makeFakeEmbodiment(
			makeFakeHandle({ events: [], terminal: COMPLETED }),
		);
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);
		const seconds = get(container, '[data-trace-control="seconds"]');
		const run = get(container, '[data-trace-control="run"]');

		// Non-numeric: a call DID happen (guards against a vacuous pass) but with
		// no seconds key.
		fireEvent.change(seconds, { target: { value: 'abc' } });
		fireEvent.click(run);
		await waitFor(() => {
			expect(calls).toHaveLength(1);
			expect(calls.at(-1)?.seconds).toBeUndefined();
		});

		// Empty string: `Number('')` is 0 (finite but not a valid budget) — must
		// still be omitted, never forwarded as `seconds: 0`.
		fireEvent.change(seconds, { target: { value: '' } });
		fireEvent.click(run);
		await waitFor(() => {
			expect(calls).toHaveLength(2);
			expect(calls.at(-1)?.seconds).toBeUndefined();
		});
	});

	it('clears the dumps when Run is clicked again (per-run reset)', async () => {
		const handles = [
			makeFakeHandle({ events: [SCOPE_PUSH, READ], terminal: COMPLETED }),
			makeFakeHandle({ events: [], terminal: COMPLETED }),
		];
		let callIndex = 0;
		const embodiment = {
			evaluation: {
				events: {
					traceVariableLifecycle: (): VariablesTraceHandle => {
						const handle = handles[callIndex];
						callIndex += 1;
						return handle;
					},
				},
			},
		} as unknown as Snippet;
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);
		const run = get(container, '[data-trace-control="run"]');

		fireEvent.click(run);
		await waitFor(() => {
			expect(
				get(container, '[data-trace-dump="events"]').textContent,
			).toContain('SCOPE-PUSH');
		});

		// Second Run streams zero events: the first run's lines must be gone, not
		// appended to.
		fireEvent.click(run);
		await waitFor(() => {
			expect(get(container, '[data-trace-dump="events"]').textContent).toBe('');
		});
	});

	// ─── Lifecycle: cleanup-cancel + per-run generation token (Task A) ───

	it('cancels the live run when the component unmounts mid-run', () => {
		// A HANGING handle (never settles on its own) so `handle.cancel()` can ONLY
		// be reached via the unmount cleanup-cancel — not the seam's end-of-drain
		// finally (which fires on any natural settle and would mask a missing
		// cleanup). Single Run → unmount (no second Run, which would also cancel).
		const { handle, cancelled } = makeHangingHandle(SCOPE_PUSH);
		const { embodiment } = makeFakeEmbodiment(handle);
		const { container, unmount } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);

		fireEvent.click(get(container, '[data-trace-control="run"]'));
		unmount();

		// The cleanup-cancel fires synchronously inside unmount(), before any drain
		// microtask, so assert synchronously.
		expect(cancelled()).toBe(true);
	});

	it('does not let a re-Run be clobbered by the prior run’s late cancelled settlement', async () => {
		// run-1 settles `cancelled` when the re-Run cancels it; run-2 streams one
		// event then HANGS (never settles), so run-1's late cancelled is the ONLY
		// settlement that could appear. The per-run generation token must gate it.
		const { handle: handle2 } = makeHangingHandle(READ);
		const handles = [
			makeFakeHandle({ events: [SCOPE_PUSH, READ], terminal: COMPLETED }),
			handle2,
		];
		let callIndex = 0;
		const embodiment = {
			evaluation: {
				events: {
					traceVariableLifecycle: (): VariablesTraceHandle => {
						const handle = handles[callIndex];
						callIndex += 1;
						return handle;
					},
				},
			},
		} as unknown as Snippet;
		const { container } = render(
			<traceDebuggingLens.Component
				embodiment={embodiment}
				config={traceDebuggingLens.config()}
			/>,
		);
		const run = get(container, '[data-trace-control="run"]');

		fireEvent.click(run); // run-1
		fireEvent.click(run); // re-Run → cancels run-1, starts the hanging run-2

		// Flush all microtasks (+ a macrotask) so run-1's cancelled settlement would
		// land IF the generation token did not gate the stale run's callbacks.
		await act(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 0);
			});
		});

		expect(
			get(container, '[data-trace-dump="settlement"]').textContent,
		).not.toContain('cancelled');
	});
});
