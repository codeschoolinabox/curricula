/**
 * @file main's body: intercept's streaming source over the region's
 * execution-handle library, plus the full generator surface and the eager
 * echoes the library installs (DOCS.md phases 2–6's thread half).
 *
 * The consumption laws — inert creation, the closed-touch ignition, the
 * mode latch, the memoized settle, idempotent out-of-band cancel with the
 * teardown latch, one-shot streaming, the self-iteration guarantee — are
 * the library's (`../lib/execution-handle/README.md` § The laws); this
 * file builds a source and re-implements none of them. What intercept
 * owns here:
 *
 * - **Ignite** (phase 3): splice the guards on the ORIGINAL text, wrap
 *   the calls on the SPLICED text with spans read from the original
 *   parse, compute the residual stack parse's per-line splice column
 *   deltas where both texts exist (human ruling 2026-09-01), project the
 *   machinery spec — worker factory as ONE adjacent expression, the cap
 *   passed through unchanged (pin intercept:394), seconds
 *   spread-if-set, the CONDITIONAL per-yield fee waiver (human ruling
 *   2026-08-19: `yieldCharge: false` exactly when the spec carries a
 *   finite, positive `iterations` cap — a cap that cannot trip is not an
 *   owner of loop safety, so those spellings keep the fee) — claim the
 *   engine's stream BEFORE its settlement is touched, and RECORD the
 *   engaged mode for the ask posture.
 * - **Serve asks** (phase 4): the engine's `onCall` routes to `serveAsk`
 *   (mock-before-mint; the pending interaction while stepping; HR-7's
 *   structural drain-cancel under batch); the console per-method
 *   callbacks are awaited between engine pulls — the worker is paused at
 *   its emit until the next pull, so the await gates the program's
 *   continuation — and a throwing or rejecting callback is the same io
 *   classification, ending the run with the flag riding.
 * - **Enrich and deliver** (phase 5): records narrow once and enrich
 *   inside `onMessage`; the ask path's pending interactions and the io
 *   flag's stream half enrich at their own arrival sites; both sources
 *   join ONE arrival queue in the program's own order, and the archive
 *   tallies every event AT ARRIVAL, so the result's `events` member is
 *   complete on every route.
 * - **Settle** (phase 6): the settlement maps exactly once through
 *   `mapSettlement`, and the settle is HELD until the arrival queue has
 *   drained to the consumer — the stream delivers everything it holds,
 *   THEN the run settles (the port drained its queue past a settlement;
 *   under the library, whose settle ends consumption, delivering first
 *   is the same guarantee). A teardown releases the hold: break resolves
 *   the run's actual end without waiting for abandoned deliveries. The
 *   console-callback io ending cannot ride the machinery's call channel
 *   (console records are emit-only), so that one route schedules the
 *   settle itself over a minimal non-consumer settlement — the flag
 *   outranks everything but the consumer's stop (mapper step 1), and
 *   the machinery is cancelled only to reap the frozen worker.
 * - **The doors**: `fail(reason)` records the reason closure-side and
 *   closes the library's teardown latch through the controls; the
 *   source's `stop()` then speaks the MACHINERY's own `fail`, so the
 *   engine's `'failed'` settlement is real carried data. `throw(thrown)`
 *   ≡ fail + settle. `return()` aliases the memoized iterator's own
 *   return — teardown, then the COMPLETE result after the settle.
 *   `next()` wraps the same memoized iterator and substitutes the
 *   settled result wherever it answers done. Pre-ignition, the doors
 *   answer through the inert-settle thunk, which reads the fail record
 *   and speaks `'fail'` or `'cancel'`.
 *
 * The gate is main's, not this file's: `index.ts` refuses the missing
 * environment and the spec outside the gate, narrowing the `entwined`
 * guarantee once, at the door — this function trusts the narrowed record
 * it is handed and reads the echoes once, at creation.
 *
 * The closure cells (engine handle, queue, latches, io flag, fail
 * record) ride DEV.md § 8's stated exception — low-level code
 * interfacing with a library whose source seam hands `stop` no handle;
 * run's source and the engine's own RunState are the precedent.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type { Entwined } from '../../embody/types.js';
import DEFAULT_SECONDS from '../../lib/engine/default-seconds.js';
import evaluate from '../../lib/engine/evaluate.js';
import type {
	CallResponse,
	EngineHandle,
	EngineSettlement,
	EvaluateSpec,
} from '../../lib/engine/types.js';
import createExecution from '../lib/execution-handle/create-execution.js';
import type {
	ExecutionMode,
	SourceControls,
	StreamingSource,
} from '../lib/execution-handle/types.js';
import spliceIterationGuards from '../lib/iteration-guard/splice-iteration-guards.js';

import enrichEvent from './enrich-event.js';
import mapSettlement from './map-settlement.js';
import narrowRecordMessage from './narrow-record-message.js';
import serveAsk from './serve-ask.js';
import type {
	ConsoleMethod,
	InterceptAskMessage,
	InterceptEvent,
	InterceptHandle,
	InterceptIoFlag,
	InterceptResult,
	InterceptSpec,
	InterceptWorkerConfig,
	IoConsole,
	ResolvedInterceptOptions,
} from './types.js';
import wrapCallExpressions from './wrap-call-expressions.js';

/**
 * Assemble intercept's inert streaming handle: the full generator
 * surface plus the eager echoes over the execution-handle library.
 *
 * Construction executes nothing — laziness rides the first consumption
 * touch (a pull, `next()`, `await`/`.then`, or `.result` access), and
 * the doors before any touch settle through the inert thunk with
 * nothing spawned. Reading `code`, `options`, or `entwined` observes
 * and never ignites.
 *
 * @param spec - intercept's spec, already past main's door.
 * @param entwined - The facts' entwined record, gate-narrowed by main;
 *   echoed by reference on the handle and on every result arm, and the
 *   graph every delivered event's accessors resolve through.
 * @param evaluateFunction - The engine's public factory. **Test seam
 *   only** — production never passes it; the unit tier substitutes one
 *   that routes the assembled spec through the engine's fake transport
 *   or a scripted engine double. The seam binds the engine's PUBLIC
 *   surface, never its transport internals.
 * @returns The inert `InterceptHandle`.
 */
export default function createInterceptHandle(
	spec: InterceptSpec,
	entwined: Entwined,
	evaluateFunction: typeof evaluate = evaluate,
): InterceptHandle {
	const code = spec.facts.source.value;
	const options = resolveOptions(spec);
	const seam = buildInterceptSource(
		spec,
		code,
		options,
		entwined,
		evaluateFunction,
	);
	const handle: InterceptHandle = createExecution<
		InterceptEvent,
		InterceptResult,
		InterceptSurface
	>(seam.source, seam.buildExtras);
	seam.adopt(handle);
	return handle;
}

/** The generator surface and the eager echoes the library installs. */
type InterceptSurface = {
	readonly next: () => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly return: () => Promise<
		IteratorResult<InterceptEvent, InterceptResult>
	>;
	readonly throw: (
		thrown?: unknown,
	) => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly fail: (reason?: unknown) => void;
	readonly code: string;
	readonly options: ResolvedInterceptOptions;
	readonly entwined: Entwined;
};

/** What the source builder hands back beside the source itself. */
type InterceptSeam = {
	readonly source: StreamingSource<InterceptEvent, InterceptResult>;
	readonly buildExtras: (controls: SourceControls) => InterceptSurface;
	readonly adopt: (handle: InterceptHandle) => void;
};

/**
 * The options record the handle echoes: `seconds` always populated from
 * the machinery's own exported default, `iterations` and `io` only where
 * given. The io record is cloned before freezing because the caller owns
 * it (`cloneAndFreeze` keeps the mock functions by reference).
 */
function resolveOptions(spec: InterceptSpec): ResolvedInterceptOptions {
	return freezeInPlace<ResolvedInterceptOptions>({
		seconds: spec.seconds ?? DEFAULT_SECONDS,
		...(spec.iterations === undefined ? {} : { iterations: spec.iterations }),
		...(spec.io === undefined ? {} : { io: cloneAndFreeze(spec.io) }),
	});
}

/**
 * intercept's streaming source and its widening, sharing one closure:
 * `start` is phase 3 (assemble, claim, ignite), `serveEngineAsk` phase 4
 * (the io seam), the arrival pipeline phase 5 (one queue, worker order,
 * arrival-tallied archive), and the settle wiring phase 6 (map exactly
 * once, hold until delivered). The cells below are the seam state those
 * phases share — each written at its named site only (DEV.md § 8's
 * low-level exception; run's source is the precedent).
 */
function buildInterceptSource(
	spec: InterceptSpec,
	code: string,
	options: ResolvedInterceptOptions,
	entwined: Entwined,
	evaluateFunction: typeof evaluate,
): InterceptSeam {
	const enrichment = enrichEvent({ source: code, entwined });

	let controls: SourceControls | null = null;
	let theHandle: InterceptHandle | null = null;
	let engine: EngineHandle | null = null;
	let engineIterator: AsyncIterator<unknown> | null = null;
	let mode: ExecutionMode = 'batch';
	let torn = false;
	let ioFlag: InterceptIoFlag | null = null;
	let failRecord: { readonly reason: unknown } | null = null;
	let pendingSettle: (() => InterceptResult) | null = null;
	let resultResolved = false;
	let releaseAsk: (() => void) | null = null;
	let reachOutstanding = false;
	let callbackGate: Promise<void> | null = null;
	let consumerWaiter: ((step: IteratorResult<InterceptEvent>) => void) | null =
		null;
	const queue: InterceptEvent[] = [];
	const arrived: InterceptEvent[] = [];
	let settleWith!: (result: InterceptResult) => void;
	const result = new Promise<InterceptResult>(function holdSettle(resolve) {
		settleWith = resolve;
	});

	// ─── Phase 6 — settle: map once, hold until delivered ────────────────

	/** The one resolution site; a waiting pull completes as the end. */
	function finishSettle(map: () => InterceptResult): void {
		if (resultResolved) {
			return;
		}
		resultResolved = true;
		settleWith(map());
		const waiting = consumerWaiter;
		consumerWaiter = null;
		waiting?.({ done: true, value: undefined });
	}

	/**
	 * First schedule wins; a non-empty queue HOLDS the settle until the
	 * stream has delivered everything it owes (the deliver-then-settle
	 * rule), and an unsettled console callback DEFERS it — the map runs
	 * at resolution time and reads the io flag then, so a rejection that
	 * lands while the engine's own settlement is in flight still rides
	 * the io arm (mapper step 1). A teardown bypasses both: the consumer
	 * stopped consuming, and break resolves the run's actual end.
	 */
	function scheduleSettle(map: () => InterceptResult): void {
		if (resultResolved || pendingSettle !== null) {
			return;
		}
		if (torn) {
			finishSettle(map);
			return;
		}
		if (callbackGate !== null) {
			void callbackGate.then(function scheduleAfterCallback() {
				scheduleSettle(map);
			});
			return;
		}
		if (queue.length === 0) {
			finishSettle(map);
			return;
		}
		pendingSettle = map;
	}

	function settleFromEngine(settlement: EngineSettlement): void {
		scheduleSettle(function mapEngineSettlement() {
			return mapSettlement(
				settlement,
				ioFlag,
				arrived,
				code,
				options,
				entwined,
			);
		});
	}

	// ─── Phase 5 — deliver: one arrival queue, worker order ──────────────

	/** Both sources join here in engine service order — the program's own
	 * order. The archive tallies at arrival; a post-settle arrival is
	 * dropped (the archive is fixed once the settle resolves). */
	function enqueueEvent(event: InterceptEvent): void {
		if (resultResolved || torn) {
			return;
		}
		// eslint-disable-next-line functional/immutable-data -- the arrival archive grows per event; carried into the frozen result at settle
		arrived.push(event);
		const waiting = consumerWaiter;
		if (waiting !== null) {
			consumerWaiter = null;
			waiting({ done: false, value: event });
			return;
		}
		// eslint-disable-next-line functional/immutable-data -- the arrival queue is the declared per-run mutable cell (the port's precedent)
		queue.push(event);
	}

	/**
	 * One reach at most — the engine keeps a single waiter, and a second
	 * concurrent request would strand the first. The reach stays
	 * outstanding until any console callback for the arrived record has
	 * SETTLED: the worker resumes on the next engine pull, so holding the
	 * reach is what makes the callback awaited before the program
	 * continues (README § io).
	 */
	function reachForNext(): void {
		if (reachOutstanding || engineIterator === null || resultResolved || torn) {
			return;
		}
		reachOutstanding = true;
		void engineIterator.next().then(function onArrival(step) {
			if (step.done === true) {
				reachOutstanding = false;
				return;
			}
			const event = step.value as InterceptEvent;
			enqueueEvent(event);
			const gate = settleConsoleCallback(event);
			callbackGate = gate;
			void gate.then(function releaseReach() {
				if (callbackGate === gate) {
					callbackGate = null;
				}
				reachOutstanding = false;
				if (consumerWaiter !== null && queue.length === 0) {
					reachForNext();
				}
			});
		});
	}

	/**
	 * Phase 4's console half: a mocked method's callback is awaited while
	 * the worker sits paused at its emit; a throwing or rejecting callback
	 * is the io classification, and this route ends the run itself —
	 * console records are emit-only, so no call channel exists to carry
	 * the failure (the docblock's settle bullet).
	 */
	async function settleConsoleCallback(event: InterceptEvent): Promise<void> {
		if (event.event !== 'console') {
			return;
		}
		const callback = consoleCallbackFor(options.io?.console, event.method);
		if (callback === undefined) {
			return;
		}
		try {
			await callback(...event.args);
		} catch (error) {
			// The callback IS settled here — clear the gate before scheduling,
			// so the io ending lands now instead of deferring behind itself.
			callbackGate = null;
			recordIoFailure(classifyThrown(`console.${event.method}`, error), {
				step: event.step + 1,
				loc: event.loc,
				start: event.start,
				end: event.end,
			});
			scheduleSettle(function mapConsoleIoEnding() {
				// WHY a synthetic settlement: the flag outranks everything but
				// the consumer's stop at mapper step 1, so only the outcome's
				// not-cancelled/not-failed shape matters; durationMs is read
				// on the timeout arm alone, which the flag pre-empts.
				return mapSettlement(
					{ outcome: 'errored', durationMs: 0 },
					ioFlag,
					arrived,
					code,
					options,
					entwined,
				);
			});
			engine?.cancel();
		}
	}

	/**
	 * The io flag and its stream half, recorded where the failure is
	 * classified: the flag for the mapper's precedence step 1, and the
	 * step-stamped in-stream `'error'` event wearing the failing
	 * exchange's attribution — errors land twice by design (types.ts,
	 * Seam 5). First failure wins.
	 */
	function recordIoFailure(
		flag: InterceptIoFlag,
		legs: {
			readonly step: number;
			readonly loc: InterceptEvent['loc'];
			readonly start: number | null;
			readonly end: number | null;
		},
	): void {
		if (ioFlag !== null || resultResolved || torn) {
			return;
		}
		ioFlag = flag;
		const streamHalf = freezeInPlace({
			event: 'error' as const,
			step: legs.step,
			name: flag.name,
			message: flag.message,
			source: flag.source,
			loc: legs.loc,
			start: legs.start,
			end: legs.end,
		});
		// WHY the cast: the both-or-neither attribution rule is carried from
		// the failing exchange's own legs, which already satisfied it.
		enqueueEvent(
			enrichment.enrich(streamHalf as Parameters<typeof enrichment.enrich>[0]),
		);
	}

	// ─── Phase 4 — serve asks: the io seam ───────────────────────────────

	function serveEngineAsk(request: unknown): Promise<CallResponse> {
		// WHY the cast: the ask was minted by intercept's own dialog trap
		// (types.ts Seam 4) and crossed the machinery's call channel
		// clone-safe; the ANSWER is the validation boundary, not the
		// request (run's precedent).
		const ask = request as InterceptAskMessage;
		return serveAsk(ask, {
			...(options.io === undefined ? {} : { io: options.io }),
			mode,
			isTornDown: () => torn,
			deliverInteraction(interaction) {
				enqueueEvent(enrichment.enrich(interaction));
			},
			registerRelease(release) {
				releaseAsk = release;
			},
			clearRelease() {
				releaseAsk = null;
			},
			flagIo(flag) {
				recordIoFailure(flag, ask);
			},
			cancelRun() {
				controls?.cancel();
			},
		});
	}

	// ─── Phase 3 — ignite: assemble, claim, go ───────────────────────────

	function startRun(engagedMode: ExecutionMode): void {
		mode = engagedMode;
		const engineHandle = evaluateFunction(
			assembleEngineSpec(spec, code, {
				onMessage: interpretMessage,
				onCall: serveEngineAsk,
			}),
		);
		engine = engineHandle;
		// The claim: created BEFORE result is touched, so the engine never
		// drains the records this source exists to deliver.
		engineIterator = engineHandle[Symbol.asyncIterator]();
		void engineHandle.result.then(function onEngineSettle(engineResult) {
			settleFromEngine(engineResult.settlement);
		});
	}

	/** Phase 5's narrowing half: one opaque message → the enriched event,
	 * or the engine's drop sentinel. */
	function interpretMessage(message: unknown): unknown {
		const record = narrowRecordMessage(message);
		if (record === null) {
			return undefined;
		}
		return enrichment.enrich(record);
	}

	/**
	 * The library's teardown word, in the ruled sequence: latch, release
	 * any pending ask (the machinery's stopped call dispatch discards the
	 * resolution), stop the machinery — the fail door speaks the engine's
	 * own `fail`, so the `'failed'` settlement is real carried data — and
	 * release any held settle so break resolves the run's actual end
	 * without waiting for abandoned deliveries.
	 */
	function stopRun(): void {
		torn = true;
		const release = releaseAsk;
		releaseAsk = null;
		release?.();
		if (failRecord === null) {
			engine?.cancel();
		} else {
			engine?.fail(failRecord.reason);
		}
		const held = pendingSettle;
		pendingSettle = null;
		if (held !== null) {
			finishSettle(held);
		}
	}

	// ─── The events seam the library pulls ───────────────────────────────

	const events: AsyncIterator<InterceptEvent> = {
		next(): Promise<IteratorResult<InterceptEvent>> {
			// eslint-disable-next-line functional/immutable-data -- the arrival queue drains per pull: the declared per-run cell's read side (the port's precedent)
			const head = queue.shift();
			if (head !== undefined) {
				if (queue.length === 0 && pendingSettle !== null) {
					const held = pendingSettle;
					pendingSettle = null;
					finishSettle(held);
				}
				return Promise.resolve({ done: false, value: head });
			}
			if (pendingSettle !== null) {
				const held = pendingSettle;
				pendingSettle = null;
				finishSettle(held);
				return Promise.resolve({ done: true, value: undefined });
			}
			if (resultResolved || torn) {
				return Promise.resolve({ done: true, value: undefined });
			}
			return new Promise(function captureConsumerWaiter(resolve) {
				consumerWaiter = resolve;
				reachForNext();
			});
		},
		return(): Promise<IteratorResult<InterceptEvent>> {
			return Promise.resolve({ done: true, value: undefined });
		},
	};

	// ─── The fallback thunks — the routes no engine settlement speaks for ─

	/** The record every thunk arm carries, and its two callers' stated
	 * asymmetry: for `inertCancelResult` the empty joins are EXACT —
	 * pre-ignition nothing has arrived — while for a post-ignition
	 * `sourceDefectResult` they are a deliberate floor: a broken source's
	 * archive may hold events, and the joins stay empty because the
	 * mapper's join pass is deliberately unexported and a machinery
	 * defect is not owed a second join implementation — the events array
	 * itself is the complete record (ar-4 2026-09-03, documented
	 * response). */
	function thunkBase(): Pick<
		InterceptResult,
		'events' | 'code' | 'options' | 'entwined' | 'visitCounts' | 'eventsByNode'
	> {
		return {
			events: arrived,
			code,
			options,
			entwined,
			visitCounts: {},
			eventsByNode: {},
		};
	}

	/** The pre-ignition settle: reads the fail record and speaks `'fail'`
	 * or `'cancel'` — the library's route, intercept's shape. */
	function inertCancelResult(): InterceptResult {
		if (failRecord === null) {
			return freezeInPlace<InterceptResult>({
				...thunkBase(),
				outcome: 'cancel',
				ok: true,
			});
		}
		return freezeInPlace<InterceptResult>({
			...thunkBase(),
			outcome: 'fail',
			ok: true,
			reason: failRecord.reason,
		});
	}

	/**
	 * The broken-source settle: no machine ran (or none can answer), so
	 * no machinery cause would be honest — `'unreachable-outcome'` (run's
	 * rule, mirrored). Total: the non-Error arm describes the thrown
	 * value by type only, because a `String(cause)` could itself throw
	 * and a throwing trusted thunk is the acknowledged trusted-seam
	 * trade-off (library § The laws, ruling 2026-09-01, the
	 * create-execution precedent): on the fire-and-forget routes it
	 * becomes an unobserved rejection and the settle never resolves —
	 * which is why this thunk is total by construction.
	 */
	function sourceDefectResult(cause: unknown): InterceptResult {
		return freezeInPlace<InterceptResult>({
			...thunkBase(),
			outcome: 'error',
			ok: false,
			error: {
				kind: 'defect',
				name: cause instanceof Error ? cause.name : 'Error',
				message:
					cause instanceof Error
						? cause.message
						: `intercept's source broke before the machinery could answer (a ${typeof cause} was thrown)`,
				cause: 'unreachable-outcome',
			},
		});
	}

	// ─── The widening — the generator surface over the memoized iterator ─

	function ownHandle(): InterceptHandle {
		if (theHandle === null) {
			throw new Error(
				'intercept: the generator surface was driven before the handle existed',
			);
		}
		return theHandle;
	}

	function failRun(reason?: unknown): void {
		if (failRecord === null) {
			failRecord = { reason };
		}
		controls?.cancel();
	}

	async function nextMoment(): Promise<
		IteratorResult<InterceptEvent, InterceptResult>
	> {
		const step = await ownHandle()[Symbol.asyncIterator]().next();
		if (step.done !== true) {
			return step;
		}
		return { done: true, value: await ownHandle().result };
	}

	async function closeStream(): Promise<
		IteratorResult<InterceptEvent, InterceptResult>
	> {
		await ownHandle()[Symbol.asyncIterator]().return?.();
		return { done: true, value: await ownHandle().result };
	}

	async function throwIntoStream(
		thrown?: unknown,
	): Promise<IteratorResult<InterceptEvent, InterceptResult>> {
		failRun(thrown);
		return { done: true, value: await ownHandle().result };
	}

	function buildExtras(sourceControls: SourceControls): InterceptSurface {
		controls = sourceControls;
		return {
			next: nextMoment,
			return: closeStream,
			throw: throwIntoStream,
			fail: failRun,
			code,
			options,
			entwined,
		};
	}

	return {
		source: {
			start: startRun,
			stop: stopRun,
			result,
			events,
			inertCancelResult,
			sourceDefectResult,
		},
		buildExtras,
		adopt(handle: InterceptHandle) {
			theHandle = handle;
		},
	};
}

// ─── Assembly helpers (phase 3, pure) ────────────────────────────────────────

/**
 * Translate the evaluation spec into the machinery's — pure, inside the
 * start latch. Guards splice on the ORIGINAL source (a trip's span stays
 * the learner's own); the loc wrap rewrites the guarded text with spans
 * read from the original (pins intercept:356/:361); the residual
 * correction's per-line deltas are computed here, where both texts exist
 * (human ruling 2026-09-01); the cap rides through unchanged (pin
 * intercept:394); seconds spread-if-set (the machinery's own default
 * governs; the handle's echo imports the same number); and the per-yield
 * fee is waived exactly when a finite, positive cap owns loop safety
 * (human ruling 2026-08-19).
 */
function assembleEngineSpec(
	spec: InterceptSpec,
	code: string,
	threadLogic: EvaluateSpec['threadLogic'],
): EvaluateSpec {
	const guarded = spliceIterationGuards(code);
	const instrumented = wrapCallExpressions({
		guarded: guarded.code,
		original: code,
		sourceType: spec.facts.type.value,
	});
	return {
		code: instrumented,
		// One syntactically adjacent expression, `{ type: 'module' }` kept —
		// both load-bearing for webpack's static worker detection (engine
		// types.ts, the workerFactory contract).
		workerFactory: () =>
			// eslint-disable-next-line unicorn/relative-url-style -- './worker-entry.ts' is the literal form the engine's workerFactory contract pins; a same-directory worker/entry pair (run's ar-4 precedent) — dropping the prefix is untested territory for webpack's static specifier detection
			new Worker(new URL('./worker-entry.ts', import.meta.url), {
				type: 'module',
			}),
		workerConfig: projectWorkerConfig(
			spec,
			spliceColumnDeltasOf(code, guarded.code),
		),
		threadLogic,
		execution: spec.execution,
		...(spec.seconds === undefined ? {} : { seconds: spec.seconds }),
		...(waivesYieldFee(spec.iterations) ? { yieldCharge: false } : {}),
	};
}

/**
 * The conditional fee waiver's one predicate: a FINITE, POSITIVE cap is
 * an owner of loop safety and waives the per-yield fee; `Infinity`,
 * `NaN`, zero, and absence cannot trip and keep it (human ruling
 * 2026-08-19; pin intercept:495 stays retained for the fee-charged
 * case).
 */
function waivesYieldFee(iterations: number | undefined): boolean {
	return (
		iterations !== undefined && Number.isFinite(iterations) && iterations > 0
	);
}

/**
 * The clone-safe worker config: the spec's `iterations` rides through
 * UNCHANGED — no clamp, no default, no finiteness gate (pin
 * intercept:394) — and the splice deltas ride only where the splice
 * shifted something.
 */
function projectWorkerConfig(
	spec: InterceptSpec,
	deltas: Readonly<Record<number, number>> | null,
): InterceptWorkerConfig {
	return {
		...(spec.iterations === undefined
			? {}
			: { iterationLimit: spec.iterations }),
		...(deltas === null ? {} : { spliceColumnDeltas: deltas }),
	};
}

/**
 * The residual correction's assembly half (human ruling 2026-09-01):
 * per 1-based line, the UTF-16 column shift splicing added — the
 * line-length difference between the original and the guard-spliced
 * text, positive shifts only (the guard only inserts). Lines are
 * preserved 1:1 by every instrumentation pass, so the index is the
 * shared line space. `null` where the splice shifted nothing, so the
 * config member stays absent rather than empty.
 *
 * Known approximation, stated: a line carrying MORE than one insertion
 * (a single-line loop takes the guard AND the reset) gets one summed
 * delta, which over-corrects a position that sits between the
 * insertions; the worker's read side clamps — a delta larger than the
 * column corrects nothing — so the bound is best-effort attribution,
 * never a negative or wrapped column.
 */
function spliceColumnDeltasOf(
	original: string,
	guarded: string,
): Readonly<Record<number, number>> | null {
	if (guarded === original) {
		return null;
	}
	const originalLines = original.split('\n');
	const deltas: Record<number, number> = {};
	for (const [index, guardedLine] of guarded.split('\n').entries()) {
		const shift = guardedLine.length - (originalLines[index]?.length ?? 0);
		if (shift > 0) {
			// eslint-disable-next-line functional/immutable-data -- a local accumulator for this one pass; frozen into the clone-transported config
			deltas[index + 1] = shift;
		}
	}
	return Object.keys(deltas).length === 0 ? null : freezeInPlace(deltas);
}

/**
 * The console mock lookup: keys stay closed over the nineteen standard
 * methods — an exotic method records, never mocks (human ruling
 * 2026-08-19; the event's `method` is the whole-surface trap's open
 * string).
 */
function consoleCallbackFor(
	consoleMocks: IoConsole | undefined,
	method: string,
): IoConsole[ConsoleMethod] | undefined {
	if (consoleMocks === undefined || !Object.hasOwn(consoleMocks, method)) {
		return undefined;
	}
	return consoleMocks[method as ConsoleMethod];
}

/** run's classification, mirrored: the thrown value's own words where it
 * is an Error, its type otherwise. */
function classifyThrown(source: string, thrown: unknown): InterceptIoFlag {
	return freezeInPlace<InterceptIoFlag>(
		thrown instanceof Error
			? { kind: 'io', source, name: thrown.name, message: thrown.message }
			: { kind: 'io', source, name: 'Error', message: String(thrown) },
	);
}
