/**
 * @file I6's handle cluster: the deprecated port's 42-row
 * `create-intercept-stream.test.ts` succeeded onto the handle idiom
 * (content-level transport under HR-8 — the port's `ended` × `reason`
 * vocabulary retires, the six reference outcomes answer; the port's
 * PINNED-row substances re-assert as plain rows, no markers under
 * guard-down) plus the fresh generator-surface, ask-posture, and io rows
 * this contract adds. Two engine doubles, each honestly scoped:
 *
 * - The engine's OWN fake transport (`recordingEvaluate`) runs the whole
 *   program eagerly and synchronously, so it evidences everything the
 *   pipeline COMPUTES — enrichment, the assembled spec, settlement
 *   mapping, the archive — and nothing about pacing. It rejects an
 *   asynchronous round-trip outright (pin intercept:250, a property of
 *   the double), so every dialog and io row routes around it.
 * - The scripted engine double (`scriptedEvaluate`) suspends genuinely
 *   at emits and asks — emit resolves when the item is pulled, mirroring
 *   the machinery's pause-until-pull — so the stepping, ask-posture,
 *   drain-cancel (HR-7), io-flag, and teardown-sequencing rows run at
 *   unit tier against the engine's PUBLIC surface. Transport fidelity
 *   (real workers, the payload ceiling, timer truth) stays browser-tier
 *   (I7v), per the region's testing posture.
 *
 * Transported substances and their sources (port rows by describe):
 * laziness → the library discharges creation-inert structurally; what
 * re-asserts here is the seam's own half (the engine factory uninvoked at
 * creation and echo reads). Console order/ordinals/frozen/clean-settle →
 * fresh fixtures, enriched now (HR-12). The wrapped-throw span, the trip
 * family, and the charge-ceiling rows transport with their literals; the
 * port's loc-null residual row INVERTS — superseded pin intercept:208,
 * both halves ruled (2026-08-06 the fallback restored; 2026-08-19 the one
 * sanctioned stack parse) — into the residual-position row. The
 * teardown-latch rows adapt to the library's latch (break awaits
 * settlement — the ledger's stated behavior change); the assembled-spec
 * rows are RE-DERIVED against the committed instrumenters rather than
 * transported (the port's 4-field wrap stamps predate the landed
 * six-field decode contract, so its literals cannot ride — the splice
 * order pins :356/:361 keep their substance, the cap pin :394 its rule;
 * every literal below was derived by running the committed splicer and
 * wrapper), plus the fresh spliceColumnDeltas and conditional-
 * yieldCharge members; the assemble-defect rows ride the library's
 * source-defect route (:443/:456 substances; :480's
 * outstanding-pull-completes is the library's law). The re-asserted pin
 * substances ride as plain rows because the pinned-guard is down;
 * markers are to be planted when the guard re-arms, at the sites this
 * paragraph names.
 *
 * Triangulation, stated honestly: the clean-run and echo rows alone
 * would pass a result-only fake — the record-order, stepping, and
 * generator-surface rows force a real stream; the assembled-spec rows
 * pin what the engine was driven WITH (run's R4 honesty note,
 * inherited); the fee-waiver rows force the projection to read the cap
 * rather than hardcode either spelling; and the scripted rows' step
 * fixtures mirror the worker's one shared ordinal sequence, so the gap
 * row fails any thread-side renumbering.
 */

import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import type { Entwined } from '../../../embody/types.js';
import DEFAULT_SECONDS from '../../../lib/engine/default-seconds.js';
import evaluate from '../../../lib/engine/evaluate.js';
import createFakeTransport from '../../../lib/engine/testing/fake-transport.js';
import type {
	CallResponse,
	EngineHandle,
	EngineResult,
	EngineSettlement,
	EvaluateSpec,
} from '../../../lib/engine/types.js';
import createInterceptHandle from '../create-intercept-handle.js';
import interceptWorkerSetup from '../intercept-worker-setup.js';
import type {
	InterceptEvent,
	InterceptHandle,
	InterceptResult,
	InterceptSpec,
} from '../types.js';

function specFor(
	code: string,
	extras: Partial<InterceptSpec> = {},
): InterceptSpec {
	const facts = deriveFacts({
		source: code,
		type: extras.execution === 'module' ? 'module' : 'script',
	});
	return { facts, execution: 'function', ...extras };
}

function entwinedOf(spec: InterceptSpec): Entwined {
	const stage = spec.facts.entwined;
	if (!stage.ok) {
		throw new Error('the fixture program failed to entwine');
	}
	return stage.value;
}

function recordingEvaluate(): {
	evaluateFunction: typeof evaluate;
	specs: EvaluateSpec[];
} {
	const specs: EvaluateSpec[] = [];
	function evaluateFunction(engineSpec: EvaluateSpec): EngineHandle {
		specs.push(engineSpec);
		return evaluate(
			engineSpec,
			createFakeTransport(interceptWorkerSetup, engineSpec.threadLogic),
		);
	}
	return { evaluateFunction, specs };
}

function handleOf(
	code: string,
	extras: Partial<InterceptSpec> = {},
): { handle: InterceptHandle; specs: EvaluateSpec[] } {
	const spec = specFor(code, extras);
	const { evaluateFunction, specs } = recordingEvaluate();
	return {
		handle: createInterceptHandle(spec, entwinedOf(spec), evaluateFunction),
		specs,
	};
}

async function collect(handle: InterceptHandle): Promise<{
	events: InterceptEvent[];
	result: InterceptResult;
}> {
	const events: InterceptEvent[] = [];
	for await (const event of handle) {
		events.push(event);
	}
	return { events, result: await handle.result };
}

// ─── The scripted engine double ──────────────────────────────────────────────

type ScriptWorker = {
	/** Post one wire record; resolves when the pipeline pulls the item. */
	readonly emit: (wire: unknown) => Promise<void>;
	/** One blocking ask round-trip; resolves with the served answer. */
	readonly call: (ask: unknown) => Promise<CallResponse>;
	/** The natural end: a completed settlement carrying its natural halt. */
	readonly endNatural: (iterationCount?: number) => void;
};

type ScriptRecord = {
	readonly failedWith: unknown[];
	cancelled: number;
	askAnswers: CallResponse[];
	readonly order: string[];
};

type ScriptState = {
	readonly queue: { item: unknown; resume: () => void }[];
	waiter: ((step: IteratorResult<unknown>) => void) | null;
	settled: EngineSettlement | null;
	settleWith: ((value: EngineResult) => void) | null;
};

function settleScripted(
	state: ScriptState,
	settlement: EngineSettlement,
): void {
	if (state.settled !== null) {
		return;
	}
	state.settled = settlement;
	state.settleWith?.({ items: [], settlement });
	const captured = state.waiter;
	state.waiter = null;
	captured?.({ done: true, value: undefined });
}

function deliverScripted(state: ScriptState, item: unknown): Promise<void> {
	return new Promise((resume) => {
		const captured = state.waiter;
		if (captured !== null) {
			state.waiter = null;
			captured({ done: false, value: item });
			resume();
			return;
		}
		state.queue.push({ item, resume: () => resume() });
	});
}

function buildScriptWorker(
	engineSpec: EvaluateSpec,
	state: ScriptState,
	record: ScriptRecord,
): ScriptWorker {
	return {
		emit(wire: unknown): Promise<void> {
			const item = engineSpec.threadLogic.onMessage(wire);
			if (item === undefined || state.settled !== null) {
				return Promise.resolve();
			}
			return deliverScripted(state, item);
		},
		call(ask: unknown): Promise<CallResponse> {
			const served = engineSpec.threadLogic.onCall?.(ask);
			return Promise.resolve(served).then(
				(answer) => {
					record.askAnswers.push(answer);
					record.order.push('answered');
					return answer;
				},
				(error: Error) => {
					settleScripted(state, {
						outcome: 'errored',
						error: {
							cause: 'call-error',
							name: 'EngineCallError',
							message: error.message,
						},
						durationMs: 1,
					});
					// eslint-disable-next-line unicorn/no-useless-undefined -- CallResponse's own no-answer value; the run is over and the answer is discarded
					return undefined;
				},
			);
		},
		endNatural(iterationCount = 0): void {
			settleScripted(state, {
				outcome: 'completed',
				halt: {
					natural: true,
					errorName: '',
					message: '',
					trip: null,
					iterationCount,
					phase: null,
					loc: null,
				},
				haltOrigin: 'worker',
				durationMs: 1,
			});
		},
	};
}

function buildScriptedIterator(state: ScriptState): AsyncIterator<unknown> {
	return {
		next(): Promise<IteratorResult<unknown>> {
			const head = state.queue.shift();
			if (head !== undefined) {
				head.resume();
				return Promise.resolve({ done: false, value: head.item });
			}
			if (state.settled !== null) {
				return Promise.resolve({ done: true, value: undefined });
			}
			return new Promise((resolve) => {
				state.waiter = resolve;
			});
		},
	};
}

/**
 * A hand-rolled engine double honoring the engine's PUBLIC surface only:
 * the script plays the worker, emits pause until pulled (the machinery's
 * pause-until-disposal), asks ride `onCall`, and `cancel`/`fail` settle
 * first-write-wins exactly as the termination rules state.
 */
function scriptedEvaluate(script: (worker: ScriptWorker) => Promise<void>): {
	evaluateFunction: typeof evaluate;
	record: ScriptRecord;
} {
	const record: ScriptRecord = {
		failedWith: [],
		cancelled: 0,
		askAnswers: [],
		order: [],
	};
	function evaluateFunction(engineSpec: EvaluateSpec): EngineHandle {
		const state: ScriptState = {
			queue: [],
			waiter: null,
			settled: null,
			settleWith: null,
		};
		const result = new Promise<EngineResult>((resolve) => {
			state.settleWith = resolve;
		});
		const iterator = buildScriptedIterator(state);
		const handle: EngineHandle = {
			[Symbol.asyncIterator]: () => iterator,
			result,
			cancel(): void {
				record.cancelled += 1;
				record.order.push('cancelled');
				settleScripted(state, { outcome: 'cancelled', durationMs: 1 });
			},
			fail(reason?: unknown): void {
				record.failedWith.push(reason);
				settleScripted(state, {
					outcome: 'failed',
					failReason: reason,
					durationMs: 1,
				});
			},
		};
		script(buildScriptWorker(engineSpec, state, record)).catch(() => {});
		return handle;
	}
	return { evaluateFunction, record };
}

function scriptedHandleOf(
	code: string,
	script: (worker: ScriptWorker) => Promise<void>,
	extras: Partial<InterceptSpec> = {},
): { handle: InterceptHandle; record: ScriptRecord } {
	const spec = specFor(code, extras);
	const { evaluateFunction, record } = scriptedEvaluate(script);
	return {
		handle: createInterceptHandle(spec, entwinedOf(spec), evaluateFunction),
		record,
	};
}

const TWO_LINE_IO = "console.log(1);\nprompt('q?');";

function consoleWire(step: number): unknown {
	return {
		event: 'console',
		method: 'log',
		args: [1],
		step,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
		start: 0,
		end: 14,
	};
}

function promptAsk(step: number): unknown {
	return {
		step,
		loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 12 } },
		start: 16,
		end: 28,
		request: { kind: 'prompt', message: 'q?' },
	};
}

function confirmAsk(step: number): unknown {
	return {
		step,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
		start: 0,
		end: 14,
		request: { kind: 'confirm', message: 'go?' },
	};
}

function promptWire(step: number, answer: string | null): unknown {
	return {
		event: 'prompt',
		args: ['q?'],
		return: answer,
		step,
		loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 12 } },
		start: 16,
		end: 28,
	};
}

function errorArmOf(
	result: InterceptResult,
): Extract<
	InterceptResult,
	{ outcome: 'error' | 'timeout' | 'iteration-limit' }
> {
	if (result.ok) {
		throw new Error(`expected a not-ok result, got ${result.outcome}`);
	}
	return result;
}

describe('createInterceptHandle', () => {
	describe('creation is inert; the echoes are eager', () => {
		it('creating the handle invokes the engine factory zero times', () => {
			const { specs } = handleOf('console.log(1);');

			expect(specs).toHaveLength(0);
		});

		it('reading the echoes ignites nothing', () => {
			const { handle, specs } = handleOf('console.log(1);');

			expect([
				typeof handle.code,
				typeof handle.options,
				typeof handle.entwined,
				specs.length,
			]).toEqual(['string', 'object', 'object', 0]);
		});

		it('code echoes the learner’s own text', () => {
			const { handle } = handleOf('console.log(1);');

			expect(handle.code).toBe('console.log(1);');
		});

		it('code follows the spec — a second program’s own text', () => {
			const { handle } = handleOf('let y = 2;');

			expect(handle.code).toBe('let y = 2;');
		});

		it('entwined echoes the narrowed record by reference', () => {
			const spec = specFor('let x = 1;');
			const entwined = entwinedOf(spec);
			const handle = createInterceptHandle(
				spec,
				entwined,
				recordingEvaluate().evaluateFunction,
			);

			expect(handle.entwined).toBe(entwined);
		});

		it('options.seconds is the machinery default, by import', () => {
			const { handle } = handleOf('let x = 1;');

			expect(handle.options.seconds).toBe(DEFAULT_SECONDS);
		});

		it('options.seconds echoes the caller’s own when set', () => {
			const { handle } = handleOf('let x = 1;', { seconds: 3 });

			expect(handle.options.seconds).toBe(3);
		});

		it('options.iterations rides as given', () => {
			const { handle } = handleOf('let x = 1;', { iterations: 9 });

			expect(handle.options.iterations).toBe(9);
		});

		it('options.iterations follows the spec — a second cap', () => {
			const { handle } = handleOf('let x = 1;', { iterations: 2 });

			expect(handle.options.iterations).toBe(2);
		});

		it('options carries no iterations when the caller set none', () => {
			const { handle } = handleOf('let x = 1;');

			expect(handle.options.iterations).toBeUndefined();
		});

		it('the echoed io record holds the caller’s mock by reference', () => {
			const prompt = () => 'sky';
			const { handle } = handleOf('let x = 1;', { io: { prompt } });

			expect(handle.options.io?.prompt).toBe(prompt);
		});

		it('the echoed io record rides frozen', () => {
			const { handle } = handleOf('let x = 1;', { io: { prompt: () => null } });

			expect(Object.isFrozen(handle.options.io)).toBe(true);
		});
	});

	describe('the pre-ignition doors answer through the inert thunk', () => {
		it('cancel before any touch settles the cancel outcome with nothing spawned', async () => {
			const { handle, specs } = handleOf('console.log(1);');
			handle.cancel();
			const result = await handle.result;

			expect([result.outcome, specs.length]).toEqual(['cancel', 0]);
		});

		it('fail before any touch settles the fail outcome with the reason', async () => {
			const { handle } = handleOf('console.log(1);');
			const reason = { predicted: 'wrongly' };
			handle.fail(reason);
			const result = await handle.result;

			expect(result.outcome === 'fail' && result.reason).toBe(reason);
		});

		it('throw before any touch is the fail door', async () => {
			const { handle } = handleOf('console.log(1);');
			const thrown = new Error('predicted wrongly');
			const closed = await handle.throw(thrown);

			expect(
				closed.done === true &&
					closed.value.outcome === 'fail' &&
					closed.value.reason,
			).toBe(thrown);
		});

		it('return before any touch settles the inert cancel and resolves it', async () => {
			const { handle, specs } = handleOf('console.log(1);');
			const closed = await handle.return();

			expect([
				closed.done === true && closed.value.outcome,
				specs.length,
			]).toEqual(['cancel', 0]);
		});
	});

	describe('a console program — records enriched in the program order', () => {
		it('one call yields one console event', async () => {
			const { events } = await collect(handleOf('console.log(1);').handle);

			expect(events.map((event) => event.event)).toEqual(['console']);
		});

		it('the record’s method rides', async () => {
			const { events } = await collect(handleOf("console.warn('b');").handle);

			expect(events[0]).toHaveProperty('method', 'warn');
		});

		it('three calls ride their worker ordinals in order', async () => {
			const { events } = await collect(
				handleOf("console.log('a');\nconsole.warn('b');\nconsole.log('c');")
					.handle,
			);

			expect(events.map((event) => event.step)).toEqual([1, 2, 3]);
		});

		it('the delivered event resolves its nodePath', async () => {
			const { events } = await collect(handleOf('console.log(1);').handle);

			expect(events[0]?.nodePath).toBe('$.body.0.expression');
		});

		it('the delivered event spans the call in the learner’s own text', async () => {
			const { events } = await collect(handleOf('console.log(1);').handle);

			expect(events[0]?.loc).toStrictEqual({
				start: { line: 1, column: 0 },
				end: { line: 1, column: 14 },
			});
		});

		it('the offset pair rides the facts’ coordinate space', async () => {
			const { events } = await collect(handleOf('console.log(1);').handle);

			expect([events[0]?.start, events[0]?.end]).toEqual([0, 14]);
		});

		it('a loop-free program with no output yields nothing and completes', async () => {
			const { events, result } = await collect(handleOf('let x = 1;').handle);

			expect([events.length, result.outcome]).toEqual([0, 'complete']);
		});

		it('the completed run carries the halt’s real total', async () => {
			const { result } = await collect(handleOf('console.log(1);').handle);

			expect(result.outcome === 'complete' && result.iterationCount).toBe(0);
		});

		it('result.events is the delivered archive, same references', async () => {
			const { events, result } = await collect(
				handleOf('console.log(1);').handle,
			);

			expect(result.events[0]).toBe(events[0]);
		});

		it('the archive is complete', async () => {
			const { events, result } = await collect(
				handleOf("console.log('a');\nconsole.warn('b');").handle,
			);

			expect(result.events).toHaveLength(events.length);
		});

		it('the result rides deep-frozen', async () => {
			const { result } = await collect(handleOf('console.log(1);').handle);

			expect(Object.isFrozen(result.events)).toBe(true);
		});

		it('visitCounts counts the record at its node', async () => {
			const { result } = await collect(handleOf('console.log(1);').handle);

			expect(result.visitCounts).toStrictEqual({ '$.body.0.expression': 1 });
		});

		it('eventsByNode joins the event at its node', async () => {
			const { events, result } = await collect(
				handleOf('console.log(1);').handle,
			);

			expect(result.eventsByNode['$.body.0.expression']?.[0]).toBe(events[0]);
		});
	});

	describe('both consumption modes', () => {
		it('iterate first — a later await subscribes to the same settle', async () => {
			const { handle } = handleOf('console.log(1);');
			const { result } = await collect(handle);

			expect(await handle).toBe(result);
		});

		it('batch first — awaiting the handle alone runs to settlement', async () => {
			const { handle } = handleOf('console.log(1);');
			const result = await handle;

			expect([result.outcome, result.events.length]).toEqual(['complete', 1]);
		});

		it('after a batch ignition the iterator is already ended', async () => {
			const { handle } = handleOf('console.log(1);');
			await handle;
			const { events } = await collect(handle);

			expect(events).toHaveLength(0);
		});
	});

	describe('the generator surface', () => {
		it('next() steps one moment', async () => {
			const { handle } = handleOf("console.log('a');\nconsole.warn('b');");
			const first = await handle.next();

			expect(first.done === false && first.value.step).toBe(1);
		});

		it('a second next() steps the second moment', async () => {
			const { handle } = handleOf("console.log('a');\nconsole.warn('b');");
			await handle.next();
			const second = await handle.next();

			expect(second.done === false && second.value.step).toBe(2);
		});

		it('stepping then for await continues the same stream — no restart', async () => {
			const { handle, specs } = handleOf(
				"console.log('a');\nconsole.warn('b');\nconsole.log('c');",
			);
			await handle.next();
			const { events } = await collect(handle);

			expect([specs.length, events.map((event) => event.step)]).toEqual([
				1,
				[2, 3],
			]);
		});

		it('next() past the end substitutes the settled result', async () => {
			const { handle } = handleOf('let x = 1;');
			await handle.next();
			const end = await handle.next();

			expect(end.done === true && end.value.outcome).toBe('complete');
		});

		it('next() after a batch ignition answers done with the result', async () => {
			const { handle } = handleOf('console.log(1);');
			await handle;
			const end = await handle.next();

			expect(end.done === true && end.value.outcome).toBe('complete');
		});

		it('return() mid-stream resolves the COMPLETE result', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const closed = await handle.return();

			expect(closed.done === true && closed.value.outcome).toBe('cancel');
		});

		it('return() carries the events delivered so far on the result', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const closed = await handle.return();

			expect(closed.done === true ? closed.value.events.length : -1).toBe(2);
		});

		it('break in for await awaits full settlement', async () => {
			const { handle } = handleOf("console.log('a');\nconsole.warn('b');");
			let settledBeforeLoopExit = false;
			let watch: Promise<void> = Promise.resolve();
			const taken: InterceptEvent[] = [];
			for await (const event of handle) {
				taken.push(event);
				watch = handle.result.then(() => {
					settledBeforeLoopExit = true;
				});
				break;
			}
			await Promise.resolve();
			const observedAtExit = settledBeforeLoopExit;
			await watch;

			expect([taken.length, observedAtExit]).toEqual([1, true]);
		});

		it('break settles the cancel outcome', async () => {
			const { handle } = handleOf("console.log('a');\nconsole.warn('b');");
			const taken: InterceptEvent[] = [];
			for await (const event of handle) {
				taken.push(event);
				break;
			}
			const result = await handle.result;

			expect([taken.length, result.outcome]).toEqual([1, 'cancel']);
		});

		it('throw(thrown) settles the fail outcome', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const closed = await handle.throw(new Error('predicted wrongly'));

			expect(closed.done === true && closed.value.outcome).toBe('fail');
		});

		it('the fail arm carries the thrown reason by reference', async () => {
			const thrown = new Error('predicted wrongly');
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const closed = await handle.throw(thrown);

			expect(
				closed.done === true &&
					closed.value.outcome === 'fail' &&
					closed.value.reason,
			).toBe(thrown);
		});

		it('the fail door speaks the machinery’s own fail', async () => {
			const reason = { predicted: 'wrongly' };
			const { handle, record } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
			);
			await handle.next();
			handle.fail(reason);
			await handle.result;

			expect(record.failedWith).toEqual([reason]);
		});

		it('fail(reason) then await resolves the fail result', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			handle.fail('enough');
			const result = await handle.result;

			expect(result.outcome === 'fail' && result.reason).toBe('enough');
		});
	});

	describe('the teardown sequence over a suspended ask', () => {
		it('teardown releases the pending ask', async () => {
			const { handle, record } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
			);
			await handle.next();
			await handle.next();
			await handle.return();
			await Promise.resolve();

			expect(record.askAnswers).toEqual([undefined]);
		});

		it('teardown stops the machinery out of band', async () => {
			const { handle, record } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
			);
			await handle.next();
			await handle.next();
			await handle.return();

			expect(record.cancelled).toBe(1);
		});

		it('a respond after teardown is a no-op on a settled run', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const ask = await handle.next();
			await handle.return();
			if (ask.done === false && ask.value.event === 'pending-interaction') {
				ask.value.respond('stale');
			}
			const result = await handle.result;

			expect(result.outcome).toBe('cancel');
		});

		it('a pull after teardown answers the settled end, never a fresh run', async () => {
			const { handle, specs } = handleOf('console.log(1);');
			await handle.next();
			await handle.return();
			await handle.next();

			expect(specs).toHaveLength(1);
		});
	});

	describe('the ask posture while stepping', () => {
		it('a mocked dialog never mints — the record alone rides', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					const answer = await worker.call(promptAsk(2));
					await worker.emit(promptWire(3, answer as string));
					worker.endNatural();
				},
				{ io: { prompt: () => 'mocked' } },
			);
			const { events } = await collect(handle);

			expect(events.map((event) => event.event)).toEqual(['console', 'prompt']);
		});

		it('the mocked dialog’s record carries what the program received', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					const answer = await worker.call(promptAsk(2));
					await worker.emit(promptWire(3, answer as string));
					worker.endNatural();
				},
				{ io: { prompt: () => 'mocked' } },
			);
			const { events } = await collect(handle);

			expect(events[1]).toHaveProperty('return', 'mocked');
		});

		it('a mocked dialog’s ask consumed an ordinal the stream never delivers — the step gap', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					const answer = await worker.call(promptAsk(2));
					await worker.emit(promptWire(3, answer as string));
					worker.endNatural();
				},
				{ io: { prompt: () => 'mocked' } },
			);
			const { events } = await collect(handle);

			expect(events.map((event) => event.step)).toEqual([1, 3]);
		});

		it('an unmocked dialog while stepping yields the ask, then the answered record, adjacent', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				const answer = await worker.call(promptAsk(2));
				await worker.emit(promptWire(3, answer as string | null));
				worker.endNatural();
			});
			const events: InterceptEvent[] = [];
			for await (const event of handle) {
				events.push(event);
				if (event.event === 'pending-interaction') {
					event.respond('typed');
				}
			}

			expect(events.map((event) => event.event)).toEqual([
				'console',
				'pending-interaction',
				'prompt',
			]);
		});

		it('respond resumes the run from the event itself', async () => {
			const { handle, record } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					const answer = await worker.call(promptAsk(2));
					await worker.emit(promptWire(3, answer as string | null));
					worker.endNatural();
				},
			);
			for await (const event of handle) {
				if (event.event === 'pending-interaction') {
					event.respond('typed');
				}
			}

			expect(record.askAnswers).toEqual(['typed']);
		});

		it('the pending interaction wears the ask’s worker ordinal', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const ask = await handle.next();
			await handle.return();

			expect(ask.done === false && ask.value.step).toBe(2);
		});

		it('the pending interaction enriches like any event — the ask site’s nodePath', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			await handle.next();
			const ask = await handle.next();
			await handle.return();

			expect(ask.done === false && ask.value.nodePath).toBe(
				'$.body.1.expression',
			);
		});
	});

	describe('HR-7 — the structural drain-cancel under a batch drain', () => {
		it('an unmocked ask under a batch drain cancels the run at that ask', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			const result = await handle;

			expect(result.outcome).toBe('cancel');
		});

		it('the events delivered before the ask ride the cancel result', async () => {
			const { handle } = scriptedHandleOf(TWO_LINE_IO, async (worker) => {
				await worker.emit(consoleWire(1));
				await worker.call(promptAsk(2));
			});
			const result = await handle;

			expect(result.events.map((event) => event.event)).toEqual(['console']);
		});

		it('structural, never temporal: a mock for another verb still cancels', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { alert: () => {} } },
			);
			const result = await handle;

			expect(result.outcome).toBe('cancel');
		});

		it('a mock for the asked verb under batch answers and the run completes', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					const answer = await worker.call(promptAsk(2));
					await worker.emit(promptWire(3, answer as string));
					worker.endNatural();
				},
				{ io: { prompt: () => 'mocked' } },
			);
			const result = await handle;

			expect(result.outcome).toBe('complete');
		});
	});

	describe('io failures — the flag rides and errors land twice', () => {
		it('an invalid mock answer settles the io arm', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;

			expect(errorArmOf(result).error.kind).toBe('io');
		});

		it('the io arm names the failing surface', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'io' && error.source).toBe('prompt');
		});

		it('the failure also lands in the stream as a step-stamped error event', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;
			const last = result.events.at(-1);

			expect(last?.event).toBe('error');
		});

		it('the dialog failure’s error event wears the failing ask’s ordinal', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;

			expect(result.events.at(-1)?.step).toBe(2);
		});

		it('the in-stream error event names the failing source', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;
			const last = result.events.at(-1);

			expect(last?.event === 'error' && last.source).toBe('prompt');
		});

		it('the dialog failure’s error event derives its ordinal from the failing ask — a shifted fixture', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(5));
					await worker.call(promptAsk(7));
				},
				{ io: { prompt: () => 7 as unknown as string } },
			);
			const result = await handle;

			expect(result.events.at(-1)?.step).toBe(7);
		});

		it('a throwing prompt mock settles the io arm end-to-end', async () => {
			const { handle } = scriptedHandleOf(
				TWO_LINE_IO,
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.call(promptAsk(2));
				},
				{
					io: {
						prompt() {
							throw new Error('the mock broke');
						},
					},
				},
			);
			const result = await handle;
			const { error } = errorArmOf(result);

			expect([error.kind, error.message]).toEqual(['io', 'the mock broke']);
		});

		it('an invalid confirm answer settles the io arm naming its verb', async () => {
			const { handle } = scriptedHandleOf(
				"confirm('go?');",
				async (worker) => {
					await worker.call(confirmAsk(1));
				},
				{ io: { confirm: () => 'yes' as unknown as boolean } },
			);
			const result = await handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'io' && error.source).toBe('confirm');
		});

		it('a throwing console callback settles the io arm', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{
					io: {
						console: {
							log() {
								throw new Error('the callback broke');
							},
						},
					},
				},
			);
			const result = await handle;

			expect(errorArmOf(result).error.kind).toBe('io');
		});

		it('the console failure names console.<method> as its source', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{
					io: {
						console: {
							log() {
								throw new Error('the callback broke');
							},
						},
					},
				},
			);
			const result = await handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'io' && error.source).toBe('console.log');
		});

		it('a rejecting console callback classifies the same', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{
					io: {
						console: { log: () => Promise.reject(new Error('rejected late')) },
					},
				},
			);
			const result = await handle;

			expect(errorArmOf(result).error.message).toBe('rejected late');
		});

		it('the console failure’s error event follows the record it answers', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{
					io: {
						console: {
							log() {
								throw new Error('the callback broke');
							},
						},
					},
				},
			);
			const result = await handle;

			expect(result.events.map((event) => event.event)).toEqual([
				'console',
				'error',
			]);
		});

		it('the console failure’s error event takes the next unminted ordinal', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{
					io: {
						console: {
							log() {
								throw new Error('the callback broke');
							},
						},
					},
				},
			);
			const result = await handle;

			expect(result.events.map((event) => event.step)).toEqual([1, 2]);
		});

		it('the console failure’s error event derives the next unminted ordinal — a shifted fixture', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(3));
					worker.endNatural();
				},
				{
					io: {
						console: {
							log() {
								throw new Error('the callback broke');
							},
						},
					},
				},
			);
			const result = await handle;

			expect(result.events.map((event) => event.step)).toEqual([3, 4]);
		});

		it('a resolving console callback is awaited before the next moment is delivered', async () => {
			const order: string[] = [];
			const { handle } = scriptedHandleOf(
				'console.log(1);\nconsole.log(2);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					await worker.emit(consoleWire(2));
					order.push('second-delivered');
					worker.endNatural();
				},
				{
					io: {
						console: {
							log: () =>
								Promise.resolve().then(() => {
									order.push('callback-settled');
								}),
						},
					},
				},
			);
			await handle;

			expect(order.slice(0, 2)).toEqual([
				'callback-settled',
				'second-delivered',
			]);
		});

		it('an unmocked console method records and nothing more', async () => {
			const { handle } = scriptedHandleOf(
				'console.log(1);',
				async (worker) => {
					await worker.emit(consoleWire(1));
					worker.endNatural();
				},
				{ io: { console: { warn: () => {} } } },
			);
			const result = await handle;

			expect([result.outcome, result.events.length]).toEqual(['complete', 1]);
		});
	});

	describe('the assembled machinery spec', () => {
		it('splices the guard call on the original source', async () => {
			const { handle, specs } = handleOf('while (true) { let x = 1; }', {
				iterations: 5,
			});
			await handle;

			expect(specs[0]?.code).toContain("__$il(1, '1:0:1:27');");
		});

		it('composes the two passes in order — the guard call survives on a call-bearing loop', async () => {
			const { handle, specs } = handleOf(
				'for (let i = 0; i < 3; i = i + 1) { console.log(i); }',
				{ iterations: 5 },
			);
			await handle;

			expect(specs[0]?.code).toContain("__$il(1, '1:0:1:53');");
		});

		it('composes the two passes in order — the wrapped call keeps the learner’s own span', async () => {
			const { handle, specs } = handleOf(
				'for (let i = 0; i < 3; i = i + 1) { console.log(i); }',
				{ iterations: 5 },
			);
			await handle;

			expect(specs[0]?.code).toContain(
				"__$lc('1:36:1:50:36:50', () => console.log(i))",
			);
		});

		it('wraps the call expressions with spans from the original text', async () => {
			const { handle, specs } = handleOf('console.log(1);');
			await handle;

			expect(specs[0]?.code).toContain(
				"__$lc('1:0:1:14:0:14', () => console.log(1))",
			);
		});

		it('carries the iteration cap through unchanged, renamed at the seam', async () => {
			const { handle, specs } = handleOf('let x = 1;', { iterations: 0 });
			await handle;

			expect(specs[0]?.workerConfig).toHaveProperty('iterationLimit', 0);
		});

		it('carries nothing when the spec has no cap and the splice shifted nothing', async () => {
			const { handle, specs } = handleOf('let x = 1;');
			await handle;

			expect(specs[0]?.workerConfig).toStrictEqual({});
		});

		it('the splice column deltas ride the worker config, keyed by 1-based line', async () => {
			const { handle, specs } = handleOf('while (true) {\n\tlet x = 1;\n}', {
				iterations: 5,
			});
			await handle;

			expect(specs[0]?.workerConfig).toHaveProperty('spliceColumnDeltas', {
				1: 20,
				3: 9,
			});
		});

		it('carries the execution axis through unchanged', async () => {
			const { handle, specs } = handleOf('let x = 1;', { execution: 'module' });
			await handle;

			expect(specs[0]?.execution).toBe('module');
		});

		it('attaches a worker factory', async () => {
			const { handle, specs } = handleOf('let x = 1;');
			await handle;

			expect(specs[0]?.workerFactory).toBeTypeOf('function');
		});

		it('carries no seconds budget when the caller set none', async () => {
			const { handle, specs } = handleOf('let x = 1;');
			await handle;

			expect(specs[0]?.seconds).toBeUndefined();
		});

		it('forwards the seconds budget the caller set', async () => {
			const { handle, specs } = handleOf('let x = 1;', { seconds: 3 });
			await handle;

			expect(specs[0]?.seconds).toBe(3);
		});

		it('carries no strict posture', async () => {
			const { handle, specs } = handleOf('let x = 1;');
			await handle;

			expect(specs[0]?.strict).toBeUndefined();
		});

		it('supplies no refinement hook', async () => {
			const { handle, specs } = handleOf('let x = 1;');
			await handle;

			expect(specs[0]?.threadLogic.refineError).toBeUndefined();
		});

		it('a finite, positive cap waives the per-yield fee', async () => {
			const { handle, specs } = handleOf('let x = 1;', { iterations: 5 });
			await handle;

			expect(specs[0]?.yieldCharge).toBe(false);
		});

		it.each([
			['absent', {}],
			['Infinity', { iterations: Number.POSITIVE_INFINITY }],
			['NaN', { iterations: Number.NaN }],
			['zero', { iterations: 0 }],
		])(
			'a cap that cannot trip keeps the fee — %s',
			async (_spelling, extras) => {
				const { handle, specs } = handleOf('let x = 1;', extras);
				await handle;

				expect(specs[0]?.yieldCharge).toBeUndefined();
			},
		);
	});

	describe('the program’s own throw — attribution end-to-end', () => {
		it('a wrapped throw settles the javascript arm', async () => {
			const result = await handleOf('null();').handle;

			expect(errorArmOf(result).error.kind).toBe('javascript');
		});

		it('a wrapped throw carries the learner’s own call-site span', async () => {
			const result = await handleOf('null();').handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'javascript' && error.loc).toStrictEqual({
				start: { line: 1, column: 0 },
				end: { line: 1, column: 6 },
			});
		});

		it('the javascript arm rides the evaluation phase', async () => {
			const result = await handleOf('null();').handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'javascript' && error.phase).toBe('evaluation');
		});

		it('a statement-level throw outside any wrap takes the sanctioned residual position', async () => {
			const result = await handleOf('null.foo;').handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'javascript' && error.loc).toStrictEqual({
				start: { line: 1, column: 5 },
				end: { line: 1, column: 5 },
			});
		});

		it('a capped runaway loop settles iteration-limit', async () => {
			const result = await handleOf('while (true) { let x = 1; }', {
				iterations: 5,
			}).handle;

			expect(result.outcome).toBe('iteration-limit');
		});

		it('the trip rides whole', async () => {
			const result = await handleOf('while (true) { let x = 1; }', {
				iterations: 5,
			}).handle;
			const { error } = errorArmOf(result);

			expect(
				error.kind === 'iteration-limit' && error.trip.loc.start,
			).toStrictEqual({ line: 1, column: 0 });
		});

		it('the tripping iteration counts', async () => {
			const result = await handleOf('while (true) { let x = 1; }', {
				iterations: 5,
			}).handle;
			const { error } = errorArmOf(result);

			expect(error.kind === 'iteration-limit' && error.iterationCount).toBe(6);
		});
	});

	describe('the conditional fee, priced end-to-end', () => {
		it('an uncapped dense emitter keeps the fee and settles timeout through the charge alone', async () => {
			const result = await handleOf(
				'let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }',
			).handle;

			expect(result.outcome).toBe('timeout');
		});

		it('the records already delivered stand — a real floor, never an exact count', async () => {
			const result = await handleOf(
				'let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }',
			).handle;

			expect(result.events.length).toBeGreaterThan(500);
		});

		it('the same program under a real cap waives the fee and completes', async () => {
			const result = await handleOf(
				'let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }',
				{ iterations: 5000 },
			).handle;

			expect(result.outcome).toBe('complete');
		});

		it('the capped run delivers the whole stream — a floor clear of the old ceiling', async () => {
			const result = await handleOf(
				'let i = 0;\nwhile (i < 1100) { console.log(i); i = i + 1; }',
				{ iterations: 5000 },
			).handle;

			expect(result.events.length).toBeGreaterThan(1000);
		});
	});

	describe('a broken source settles the defect arm, loudly', () => {
		it('an instrumentation throw settles cause unreachable-outcome', async () => {
			const healthy = specFor('let x = 1;');
			const broken: InterceptSpec = {
				...healthy,
				facts: {
					...healthy.facts,
					source: { ok: true, value: 'let x = ;' },
				} as InterceptSpec['facts'],
			};
			const result = await createInterceptHandle(
				broken,
				entwinedOf(healthy),
				recordingEvaluate().evaluateFunction,
			);
			const { error } = errorArmOf(result);

			expect(error.kind === 'defect' && error.cause).toBe(
				'unreachable-outcome',
			);
		});

		it('the defect result rides frozen', async () => {
			const healthy = specFor('let x = 1;');
			const broken: InterceptSpec = {
				...healthy,
				facts: {
					...healthy.facts,
					source: { ok: true, value: 'let x = ;' },
				} as InterceptSpec['facts'],
			};
			const result = await createInterceptHandle(
				broken,
				entwinedOf(healthy),
				recordingEvaluate().evaluateFunction,
			);

			expect(Object.isFrozen(result)).toBe(true);
		});

		it('the engine factory is never invoked on the defect route', async () => {
			const healthy = specFor('let x = 1;');
			const broken: InterceptSpec = {
				...healthy,
				facts: {
					...healthy.facts,
					source: { ok: true, value: 'let x = ;' },
				} as InterceptSpec['facts'],
			};
			const { evaluateFunction, specs } = recordingEvaluate();
			await createInterceptHandle(
				broken,
				entwinedOf(healthy),
				evaluateFunction,
			);

			expect(specs).toHaveLength(0);
		});

		it('a later touch answers the same settle', async () => {
			const healthy = specFor('let x = 1;');
			const broken: InterceptSpec = {
				...healthy,
				facts: {
					...healthy.facts,
					source: { ok: true, value: 'let x = ;' },
				} as InterceptSpec['facts'],
			};
			const handle = createInterceptHandle(
				broken,
				entwinedOf(healthy),
				recordingEvaluate().evaluateFunction,
			);

			expect(await handle.result).toBe(await handle.result);
		});
	});
});
