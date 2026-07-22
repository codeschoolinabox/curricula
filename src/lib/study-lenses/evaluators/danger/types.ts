/**
 * danger's own contract: its settlement details. danger publishes **no event
 * union** — a real window answers its own dialogs, so there is no
 * pending-interaction and, in fact, no event at all; its whole output is the
 * settlement. This module therefore carries only the one place danger extends
 * the kind: a **richer error** above the settlement's `{ name, message }` floor.
 *
 * The one foreign import is the kind's own `EvaluationError`, extended
 * structurally — the same "an evaluator may carry a richer error, imported by
 * consumers who want it" seam the kind documents. The backend's own option and
 * result shapes live in `./backend/types.ts`; `main` bridges the two.
 */

import type { EvaluationError } from '../types.js';

/**
 * Why a danger run ended in error — the discriminant the run lens renders on.
 * Above the kind's `{ name, message }` floor because "your loop cap tripped",
 * "you timed out", and "you threw" are pedagogically distinct and rendered
 * differently, yet all three are `error` settlements in the kind's own words.
 * Each maps one-to-one from a backend outcome.
 *
 * - `threw` — the program threw, in its own `{ name, message }`. A `SyntaxError`
 *   in the assembled program surfaces here too (its `name` carries the signal);
 *   that is reachable only as an assembler defect — `facts` are gate-guaranteed
 *   already parsed — never a learner's parse error, so there is no separate
 *   `parse` reason.
 * - `loop-cap` — the runaway-loop guard tripped (a `RangeError` the guard
 *   injects); the guard cap rides `EvaluationSpec.iterations`.
 * - `timeout` — the wall-clock budget elapsed on a run that never ended on its
 *   own (e.g. a never-settling top-level `await`).
 *
 * @remarks
 * A promotion candidate: `reason` is plausibly a cross-evaluator concept (run,
 * intercept, and the engine-backed evaluators also end in throws, loop caps,
 * and timeouts). It is kept danger-local for now — the shared vocabulary should
 * be designed against more than one concrete evaluator — and lifts cleanly onto
 * the kind's `EvaluationError` later if promoted.
 */
export type DangerErrorReason = 'threw' | 'loop-cap' | 'timeout';

/**
 * danger's error: the kind's `{ name, message }` floor plus the `reason`
 * discriminant. Structurally assignable to `EvaluationError`, so a consumer
 * reading only the floor still sees a faithful `{ name, message }`; a consumer
 * importing danger directly reads `reason` too.
 */
export type DangerEvaluationError = EvaluationError & {
	readonly reason: DangerErrorReason;
};

/**
 * How a danger run ended — the kind's `Settlement` with danger's richer error
 * on the error arm. Engine-forced stops (a loop-cap trip, a timeout) are
 * `error` settlements, never a separate arm, so the learner sees why the run
 * ended in the machine's own words.
 */
export type DangerSettlement =
	| { readonly ended: 'clean' }
	| { readonly ended: 'error'; readonly error: DangerEvaluationError }
	| { readonly ended: 'canceled' };

/**
 * What danger's `main` returns: the kind's evaluation stream, specialised.
 * danger yields **no events** (`AsyncIterable<never>`), so the stream exists to
 * carry the companion `settled` promise and the cancel-on-`return()` teardown;
 * pulling it starts the run (laziness), and breaking out of the pull cancels.
 * Assignable to the kind's `EvaluationStream`.
 */
export type DangerStream = AsyncIterable<never> & {
	readonly settled: Promise<DangerSettlement>;
};
