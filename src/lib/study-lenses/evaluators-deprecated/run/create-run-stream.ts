/**
 * @file run's internal stream factory: the eventless stream, its start latch,
 * and the assemble that rides it.
 *
 * The whole module exists to carry three obligations the kind places on a
 * stream that never yields — laziness, cancellation, and a companion
 * settlement — plus the guard-and-assemble phase, which runs INSIDE the start
 * latch so nothing engine-side exists before the first pull (not even the
 * engine's result surface, whose mere access starts a run).
 *
 * The iteration is hand-rolled rather than a generator: run's whole life is
 * one pending pull, and a generator's `return()` would queue behind that
 * in-flight pull and deadlock the cancel. The latches this requires are the
 * module's declared mutable-state exception (DEV.md § 8) — closure-confined,
 * per-stream disposable, and the engine's own handle is the pattern's origin.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import evaluate from '../../lib/engine/evaluate.js';
import type { EngineHandle, EvaluateSpec } from '../../lib/engine/types.js';
import spliceIterationGuards from '../lib/iteration-guard/splice-iteration-guards.js';
import type { EvaluationSpec } from '../types.js';

import mapSettlement from './map-settlement.js';
import type { RunSettlement, RunStream } from './types.js';

/**
 * Build the eventless stream for one evaluation spec.
 *
 * Construction runs nothing: the first pull opens the start latch, and only
 * inside it is the source read, the guards spliced, the engine spec
 * assembled, and the engine driven. Ceasing to pull tears the run down —
 * canceling the engine out of band when a run exists, settling canceled
 * directly when none does — and the teardown latches, so a later pull never
 * starts a fresh run.
 *
 * @param spec - The kind's evaluation spec.
 * @param evaluateFunction - The engine's public factory. **Test seam only** —
 *   production never passes it; run's Node tests substitute one that routes
 *   the assembled spec through the engine's fake transport. The seam binds
 *   the engine's PUBLIC surface, never its transport internals.
 * @returns The stream, with its companion settlement promise.
 */
export default function createRunStream(
	spec: EvaluationSpec,
	evaluateFunction: typeof evaluate = evaluate,
): RunStream {
	let resolveSettled!: (settlement: RunSettlement) => void;
	const settled = new Promise<RunSettlement>(function capture(resolve) {
		resolveSettled = resolve;
	});
	let handle: EngineHandle | undefined;
	let tornDown = false;
	let hasSettled = false;

	// The ONE settlement resolution site. Every route — the engine's
	// settlement, a pre-start teardown, an assemble-time dev condition —
	// arrives here and nowhere else, so the promise resolves exactly once
	// whatever ended the run (DOCS.md § Structural constraints).
	function settle(settlement: RunSettlement): void {
		if (hasSettled) {
			return;
		}
		hasSettled = true;
		resolveSettled(settlement);
	}

	function start(): void {
		// `hasSettled` is part of the guard, not decoration: on the
		// assemble-defect route no handle is ever assigned, so a handle-only
		// check would re-run the whole assemble — and re-fire its warning —
		// on every later pull (human ruling 2026-08-05: found by a probe in
		// the sibling evaluator and reproduced here, so both were fixed).
		if (handle !== undefined || hasSettled) {
			return;
		}
		let engineSpec: EvaluateSpec;
		try {
			engineSpec = assemble(spec);
		} catch (error) {
			settle(assembleDefect(error));
			return;
		}
		// Constructed only here: the engine's `result` getter starts the run,
		// so the handle cannot exist before the latch opens.
		handle = evaluateFunction(engineSpec);
		void handle.result.then(function onSettled(result) {
			settle(mapSettlement(result.settlement));
		});
	}

	const done = { done: true as const, value: undefined };
	const iterator: AsyncIterator<never, undefined> = {
		next() {
			// A pull after teardown must not start a fresh run; the stream has
			// already settled (danger's regression, commit 9c974dfc).
			if (!tornDown) {
				start();
			}
			return settled.then(() => done);
		},
		return() {
			tornDown = true;
			if (handle === undefined) {
				// Teardown before the latch ever opened: nothing spawned, so the
				// engine has no settlement to map — synthesize the consumer stop
				// the engine would have reported and map it like any other.
				settle(mapSettlement({ outcome: 'cancelled', durationMs: 0 }));
			} else {
				// Out of band: the cancel must not queue behind the pending pull.
				handle.cancel();
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
 * run's thread hooks. It yields no events, so every message is dropped —
 * returning nothing IS the engine's drop sentinel, and the worker never emits
 * anyway. No `onCall` (run makes no round-trips) and no `refineError`.
 */
const RUN_THREAD_LOGIC = { onMessage() {} };

/**
 * Translate the evaluation spec into the engine's spec — pure, and inside the
 * start latch. Guards splice onto the ORIGINAL source so a trip's span stays
 * faithful to the learner's own columns. The cap and the execution axis ride
 * through UNCHANGED; neither a strict posture nor a seconds budget is carried
 * (strict is the kind's deliberate collapse, seconds stay the engine's own),
 * and no refinement hook is supplied — there is nothing left to refine once
 * the halt is authored where the raw throw lives.
 */
function assemble(spec: EvaluationSpec): EvaluateSpec {
	const guarded = spliceIterationGuards(spec.facts.source.value);
	return {
		code: guarded.code,
		// The engine's one adjacent module-worker expression. Never split, never
		// behind a helper: webpack emits a real worker chunk only for this exact
		// syntactic shape (engine DOCS.md § Module workers — "Do NOT DRY it up").
		workerFactory: () =>
			// eslint-disable-next-line unicorn/relative-url-style -- './worker-entry.ts' is the literal form the engine's workerFactory contract pins; this is the repo's first SAME-directory worker/entry pair (every other site resolves through '../', which the rule never reaches), so dropping the prefix is untested territory for webpack's static specifier detection — and a bundler regression here is caught by no test
			new Worker(new URL('./worker-entry.ts', import.meta.url), {
				type: 'module',
			}),
		workerConfig:
			spec.iterations === undefined ? {} : { iterationLimit: spec.iterations },
		threadLogic: RUN_THREAD_LOGIC,
		execution: spec.execution,
	};
}

/**
 * The assemble route's settlement. Gate-guaranteed source cannot fail to
 * parse, so reaching here is an upstream dev condition, not a learner one —
 * surfaced loudly and honestly: no machine ran, so no machinery cause would
 * be truthful (human ruling 2026-07-30, R-2).
 */
function assembleDefect(thrown: unknown): RunSettlement {
	const message = thrown instanceof Error ? thrown.message : String(thrown);
	console.warn(
		`run: assembling the engine spec failed on gate-guaranteed source (${message}). This is a machinery defect, not a learner error.`,
	);
	return freezeInPlace<RunSettlement>({
		ended: 'error',
		error: {
			name: thrown instanceof Error ? thrown.name : 'Error',
			message,
			reason: 'defect',
			cause: 'unreachable-outcome',
		},
	});
}
