/**
 * @file intercept's internal stream factory (DOCS.md phases 2, 3, 8 and
 * 11): the start latch, the assemble, the arrival queue, the retained
 * reach, and the teardown that stops the run out of band before releasing
 * what is suspended.
 *
 * Everything engine-side is built inside the start latch on the first pull
 * — the source narrowed once, iteration guards spliced on the ORIGINAL
 * text, the loc wrap run over the guarded text (spans from the original,
 * the two readings reconciled), the engine spec assembled. **The engine's
 * stream is claimed — its iterator created — BEFORE its settlement is ever
 * touched**: an unclaimed stream is drained by the engine on the consumer's
 * behalf, which would consume the very records this module exists to yield.
 *
 * Records arrive on the engine's item path (the thread hook is I3's
 * narrowing; a drop costs nothing) and asks arrive on its call path (paired
 * through I5's channel); the engine services worker posts FIFO, so both
 * sources join ONE arrival queue in the program's own order and a consumer
 * pull takes the head. Only an empty queue reaches to the engine, and **an
 * outstanding reach is retained, never re-issued** — the engine keeps one
 * waiter and a second request would strand the first forever. An event
 * landing on a retained reach waits in the queue: the one bounded slack
 * after a pending interaction, never lost, never reordered.
 *
 * A pull outstanding when the run settles — ANY route, the assemble-defect
 * one included, where no engine and no retained reach exists to deliver an
 * end — completes as the stream's end: the single settlement author itself
 * completes a waiting pull. **Teardown stops the run OUT OF BAND
 * (`handle.cancel()`), THEN releases any unanswered ask** — the released
 * answer is discarded by the engine's stopped call dispatch, never resumed
 * into the program — **and never awaits the engine iterator's own exit**,
 * which awaits a settlement the suspended ask is itself blocking. The
 * teardown latches: a later pull is inert and never starts a fresh run.
 *
 * The iteration is hand-rolled (D10): the stream's life is pending pulls,
 * and a generator's `return()` would queue behind the in-flight pull and
 * deadlock the cancel. The latches and the queue are the module's declared
 * mutable-state exception (DEV.md § 8) — closure-confined, per-stream
 * disposable; the engine's own handle is the pattern's origin.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import evaluate from '../../lib/engine/evaluate.js';
import type {
	CallResponse,
	EngineHandle,
	EvaluateSpec,
} from '../../lib/engine/types.js';
import spliceIterationGuards from '../lib/iteration-guard/splice-iteration-guards.js';
import type { EvaluationSpec } from '../types.js';

import createInteractionChannel from './create-interaction-channel.js';
import mapSettlement from './map-settlement.js';
import narrowRecordMessage from './narrow-record-message.js';
import type {
	InterceptAskMessage,
	InterceptEvent,
	InterceptSettlement,
	InterceptStream,
} from './types.js';
import wrapCallExpressions from './wrap-call-expressions.js';

/**
 * Build the event stream for one evaluation spec.
 *
 * Construction runs nothing: the first pull opens the start latch. Ceasing
 * to pull tears the run down — canceling the engine out of band and then
 * releasing any unanswered ask — and the teardown latches.
 *
 * @param spec - The kind's evaluation spec.
 * @param evaluateFunction - The engine's public factory. **Test seam
 *   only** — production never passes it; Node tests substitute one that
 *   routes the assembled spec through the engine's fake transport. The
 *   seam binds the engine's PUBLIC surface, never its transport internals.
 * @returns The stream, with its companion settlement promise.
 */
export default function createInterceptStream(
	spec: EvaluationSpec,
	evaluateFunction: typeof evaluate = evaluate,
): InterceptStream {
	let resolveSettled!: (settlement: InterceptSettlement) => void;
	const settled = new Promise<InterceptSettlement>(function capture(resolve) {
		resolveSettled = resolve;
	});
	let handle: EngineHandle | undefined;
	let engineIterator: AsyncIterator<unknown> | undefined;
	let tornDown = false;
	let hasSettled = false;
	let reachOutstanding = false;
	let releaseAsk: (() => void) | null = null;
	let consumerWaiter:
		| ((result: IteratorResult<InterceptEvent>) => void)
		| null = null;
	const arrivalQueue: InterceptEvent[] = [];

	const done: IteratorResult<InterceptEvent> = {
		done: true,
		value: undefined,
	};

	// The ONE settlement resolution site. Every route — the engine's
	// settlement, a pre-start teardown, an assemble-time dev condition —
	// arrives here; a pull outstanding at ANY settle completes as the end
	// (the phase-8 rule: on the defect route no reach exists to deliver it).
	function settle(settlement: InterceptSettlement): void {
		if (hasSettled) {
			return;
		}
		hasSettled = true;
		resolveSettled(settlement);
		if (consumerWaiter !== null) {
			const waiter = consumerWaiter;
			consumerWaiter = null;
			waiter(done);
		}
	}

	// Both sources join here in engine service order — the program's order.
	function enqueueEvent(event: InterceptEvent): void {
		if (consumerWaiter !== null) {
			const waiter = consumerWaiter;
			consumerWaiter = null;
			waiter({ done: false, value: event });
			return;
		}
		arrivalQueue.push(event);
	}

	// One reach at most: the engine keeps a single waiter, and a second
	// concurrent request would strand the first forever. A reach retained
	// across an answered ask delivers into the queue — the bounded slack.
	function reachForNext(): void {
		if (reachOutstanding || engineIterator === undefined || hasSettled) {
			return;
		}
		reachOutstanding = true;
		void engineIterator.next().then(function onArrival(result) {
			reachOutstanding = false;
			if (result.done === true) {
				return;
			}
			enqueueEvent(result.value as InterceptEvent);
		});
	}

	function serveAsk(request: unknown): Promise<CallResponse> {
		return new Promise<CallResponse>(function suspend(resolve) {
			// WHY the cast: the ask is intercept's own worker-authored wire
			// message (types.ts Seam 2), clone-crossed like the worker config;
			// the ANSWER is the ruled validation boundary (D9), enforced by the
			// channel below.
			const ask = request as InterceptAskMessage;
			// WHY the unconditional reassignment is safe: at most one boundary
			// moment is ever in flight (README § Design commitments), and the
			// engine enforces it structurally — its pump awaits `dispatchCall`
			// before servicing another event, so a second concurrent `onCall`
			// cannot exist. This does NOT silently depend on that: if the
			// invariant ever relaxed, the overwrite would strand the earlier
			// ask, which is why the dependency is named here.
			releaseAsk = function releaseDiscarded() {
				releaseAsk = null;
				// The engine's stopped call dispatch discards whatever this
				// resolves with; resolving at all is what unblocks the suspended
				// round-trip so the run can end.
				// eslint-disable-next-line unicorn/no-useless-undefined -- CallResponse's own no-answer value; the engine discards it after a stop
				resolve(undefined);
			};
			enqueueEvent(
				createInteractionChannel({
					ask,
					deliver(answer) {
						releaseAsk = null;
						resolve(answer);
					},
					isTornDown: () => tornDown,
				}),
			);
		});
	}

	function start(): void {
		// `hasSettled` is part of the guard, not decoration: on the
		// assemble-defect route no handle is ever assigned, so a handle-only
		// check would re-run the whole instrument-and-assemble pass — and
		// re-fire its warning — on every later pull.
		if (handle !== undefined || hasSettled) {
			return;
		}
		let engineSpec: EvaluateSpec;
		try {
			engineSpec = assemble(spec, {
				onMessage: (message: unknown) => narrowRecordMessage(message),
				onCall: serveAsk,
			});
		} catch (error) {
			settle(assembleDefect(error));
			return;
		}
		handle = evaluateFunction(engineSpec);
		// The claim: created BEFORE result is touched, so the engine never
		// drains the records this module exists to yield.
		engineIterator = handle[Symbol.asyncIterator]();
		void handle.result.then(function onSettled(result) {
			settle(mapSettlement(result.settlement));
		});
	}

	const iterator: AsyncIterator<InterceptEvent, undefined> = {
		next() {
			// The teardown latch is consulted BEFORE the queue: a consumer that
			// tore the stream down must never be handed a leftover event it
			// already stopped asking for. A SETTLED run is different — its
			// queued events arrived before the end, and the contract says this
			// stream must be pulled for every event it holds, so the queue
			// drains past a settlement.
			if (tornDown) {
				return Promise.resolve(done);
			}
			start();
			const head = arrivalQueue.shift();
			if (head !== undefined) {
				return Promise.resolve({ done: false, value: head });
			}
			if (hasSettled) {
				return Promise.resolve(done);
			}
			return new Promise(function captureConsumerWaiter(resolve) {
				consumerWaiter = resolve;
				reachForNext();
			});
		},
		return() {
			tornDown = true;
			if (handle === undefined) {
				// Teardown before the latch ever opened: nothing engine-side
				// exists — synthesize the consumer stop and map it like any other.
				settle(mapSettlement({ outcome: 'cancelled', durationMs: 0 }));
			} else {
				// Out of band FIRST — never through the engine iterator's own
				// exit, which awaits a settlement the suspended ask is blocking.
				handle.cancel();
				// THEN release: the engine's stopped call dispatch discards the
				// answer, so the program is never resumed by it.
				if (releaseAsk !== null) {
					releaseAsk();
				}
			}
			return settled.then(() => done);
		},
	};

	return {
		settled,
		[Symbol.asyncIterator]() {
			return iterator;
		},
	};
}

/**
 * intercept's thread hooks ride per-stream closures (the queue, the
 * teardown latch), so unlike the eventless sibling there is no
 * module-level thread logic to share.
 */
type ThreadHooks = {
	readonly onMessage: (message: unknown) => unknown;
	readonly onCall: (request: unknown) => Promise<CallResponse>;
};

/**
 * Translate the evaluation spec into the engine's spec — pure, inside the
 * start latch. Guards splice on the ORIGINAL source (a trip's span stays
 * the learner's own); the loc wrap then rewrites the guarded text with
 * spans read from the original and the two readings reconciled (I1's
 * boundary throw routes to the defect arm). The cap and the execution axis
 * ride through UNCHANGED; neither a strict posture nor a seconds budget is
 * carried; no refinement hook is supplied.
 */
function assemble(spec: EvaluationSpec, hooks: ThreadHooks): EvaluateSpec {
	const original = spec.facts.source.value;
	const guarded = spliceIterationGuards(original);
	const instrumented = wrapCallExpressions({
		guarded: guarded.code,
		original,
		// The snippet's own parse goal, narrowed once at this read site: the
		// stage is gate-guaranteed, so its failure arm is an upstream dev
		// condition the catch above settles as a defect — never a guess.
		sourceType: spec.facts.type.value,
	});
	return {
		code: instrumented,
		// The engine's one adjacent module-worker expression. Never split,
		// never behind a helper: webpack emits a real worker chunk only for
		// this exact syntactic shape (engine DOCS.md § Module workers).
		workerFactory: () =>
			// eslint-disable-next-line unicorn/relative-url-style -- './worker-entry.ts' is the literal form the engine's workerFactory contract pins; a same-directory worker/entry pair (run's ar-4 precedent) — dropping the prefix is untested territory for webpack's static specifier detection
			new Worker(new URL('./worker-entry.ts', import.meta.url), {
				type: 'module',
			}),
		workerConfig:
			spec.iterations === undefined ? {} : { iterationLimit: spec.iterations },
		threadLogic: hooks,
		execution: spec.execution,
	};
}

/**
 * The assemble route's settlement. Gate-guaranteed source cannot fail to
 * parse, so reaching here — a splice throw, I1's reconciliation throw — is
 * an upstream dev condition, not a learner one: no machine ran, so no
 * machinery cause would be honest (ruling R-2's precedent).
 */
function assembleDefect(thrown: unknown): InterceptSettlement {
	const message = thrown instanceof Error ? thrown.message : String(thrown);
	console.warn(
		`intercept: assembling the engine spec failed on gate-guaranteed source (${message}). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<InterceptSettlement>({
		ended: 'error',
		error: {
			name: thrown instanceof Error ? thrown.name : 'Error',
			message,
			reason: 'defect',
			cause: 'unreachable-outcome',
		},
	});
}
