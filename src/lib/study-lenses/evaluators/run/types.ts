/**
 * @file run's own contract: its settlement details plus the two internal
 * seams its increments are built against. run publishes **no event union** —
 * its stream yields nothing; its whole output is the settlement — so this
 * module carries the places run extends the kind (a **richer error** above
 * the settlement's `{ name, message }` floor) and pins the worker↔thread
 * seams (the halt payload, the worker config) so the worker setup and the
 * settlement mapper never reverse-engineer each other.
 *
 * Two imports, both sanctioned edges: the kind's own `EvaluationError`
 * (extended structurally — the documented richer-error seam) and
 * iteration-guard's `LimitTrip` (re-exported through this boundary, never
 * re-declared — region-internal shared machinery). The engine's shapes are
 * NOT imported here: the one engine vocabulary this contract must speak —
 * the machinery half of {@link RunDefectCause} — is mirrored structurally,
 * and a compile-time probe in the tests locks the mirror in the inbound
 * direction. Vocabulary is pinned in README.md § Ubiquitous language.
 */

import type { LimitTrip } from '../lib/iteration-guard/types.js';
import type { EvaluationError } from '../types.js';

export type { LimitTrip } from '../lib/iteration-guard/types.js';

// ─── The richer error ─────────────────────────────────────────────────────────

/**
 * Why a run ended in error — the discriminant the run lens renders on, above
 * the kind's `{ name, message }` floor, because "you threw", "your loop cap
 * tripped", "you timed out", and "the machinery failed" are pedagogically
 * distinct while all four are `error` settlements in the kind's own words.
 *
 * - `threw` — the program's own throw (a dialog call's honest
 *   `ReferenceError` lands here too — run injects no dialogs; and so does a
 *   module run whose top-level evaluation rejects).
 * - `loop-cap` — the iteration guard's marked trip
 *   (`iterations` rides the evaluation spec; no default cap exists).
 * - `timeout` — the engine's wall-clock budget elapsed.
 * - `defect` — the engine's machinery failed, or an impossible combination
 *   reached the settlement mapper: a dev condition surfaced loudly, never a
 *   learner error.
 *
 * Distinct from the kind's refusal `reason` — a free-form string in the
 * evaluator's own words; this is a closed discriminant. Deliberately
 * run-local, structurally aligned with danger's union plus the fourth value;
 * promotion onto the kind's `EvaluationError` is a recorded close-out
 * question, decided against more than one concrete evaluator.
 */
export type RunErrorReason = 'threw' | 'loop-cap' | 'timeout' | 'defect';

/**
 * The `'defect'` arm's discriminant. The three machinery values mirror the
 * engine's structured cause union minus its timeout value — carrying that
 * one would restate `reason: 'timeout'`, a second copy of the same fact —
 * and `'unreachable-outcome'` is run's own value for a settlement
 * combination the mapper refuses to guess about (an outcome run's surface
 * cannot produce, a completed settlement missing its halt, a malformed halt
 * payload). The mirror is locked by a compile-time probe in the tests, in
 * the inbound direction: every engine machinery cause must land in this
 * union, so a new engine cause fails the build loudly.
 */
export type RunDefectCause =
	| 'worker-error'
	| 'call-error'
	| 'hook-error'
	| 'unreachable-outcome';

/**
 * run's error: the kind's floor plus the `reason` discriminant, each arm
 * carrying exactly the fields that exist for it — a consumer narrowing on
 * `reason` never reads an absent field.
 *
 * - `threw` carries the run-total `iterationCount` (every worker-side halt
 *   carries a real count — iteration-guard's always-instrument commitment).
 * - `loop-cap` carries the count AND the guard's whole trip record — its
 *   loop index and decoded span — never a bare loc field.
 * - `timeout` is the floor alone: the stop was thread-side; no halt exists,
 *   so no count is real.
 * - `defect` carries {@link RunDefectCause}.
 *
 * `name` and `message` come from the worker-authored halt on halt-backed
 * arms (`threw`, `loop-cap`) and from the engine's own error on engine-made
 * arms (`timeout`, `defect`) — both the machine's words, different machines.
 * Structurally assignable to the kind's `EvaluationError`, so a consumer
 * reading only the floor still sees a faithful `{ name, message }`.
 */
export type RunEvaluationError =
	| (EvaluationError & {
			readonly reason: 'threw';
			readonly iterationCount: number;
	  })
	| (EvaluationError & {
			readonly reason: 'loop-cap';
			readonly iterationCount: number;
			readonly trip: LimitTrip;
	  })
	| (EvaluationError & { readonly reason: 'timeout' })
	| (EvaluationError & {
			readonly reason: 'defect';
			readonly cause: RunDefectCause;
	  });

// ─── Settlement and stream ────────────────────────────────────────────────────

/**
 * How a run ended — the kind's `Settlement` with run's richer error on the
 * error arm. The clean arm stays the kind's floor: no iteration count rides
 * it (the kind's structural-extension rule names the error arm; the run
 * total computed on a clean halt is deliberately not surfaced — README
 * § Design commitments records the omission so it is not "fixed" casually).
 */
export type RunSettlement =
	| { readonly ended: 'clean' }
	| { readonly ended: 'error'; readonly error: RunEvaluationError }
	| { readonly ended: 'canceled' };

/**
 * What run's `main` returns: the kind's evaluation stream, specialised to
 * zero events (`AsyncIterable<never>`), existing to carry laziness (the
 * first pull starts the run — awaiting `settled` alone starts nothing),
 * cancellation (ceasing to pull tears the run down; a pull after teardown
 * never starts a fresh run), and the companion settlement promise.
 * Assignable to the kind's `EvaluationStream`.
 */
export type RunStream = AsyncIterable<never> & {
	readonly settled: Promise<RunSettlement>;
};

// ─── Seam 1: the halt payload (worker → thread) ───────────────────────────────

/**
 * run's worker-authored, clone-safe stop record — authored by run's halt
 * serializer inside the engine's halt seam on EVERY worker-side stop
 * (natural end and throw alike), and narrowed exactly ONCE at the
 * thread-side read site (a payload failing the narrowing is the defensive
 * `'defect'` arm). Package-internal seam, not consumer surface: consumers
 * read {@link RunSettlement}, never this.
 *
 * The trip record replaces the older boolean-plus-loc form: `trip` is the
 * classification (`null` = not the guard's throw) AND the attribution
 * (loop index, decoded span) in one field — no bare loc property to collide
 * with any sibling's, no boolean restating what `trip !== null` says.
 */
export type RunHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name (`ReferenceError`, …); `''` on a natural end. */
	readonly errorName: string;
	/** The thrown error's message, or `String(thrown)` for a non-Error throw; `''` on a natural end. */
	readonly message: string;
	/**
	 * The guard's trip record when the throw was the marked limit throw
	 * (classified worker-side, structurally, never by message); `null` on a
	 * natural end, a learner throw, and every unattributable case.
	 */
	readonly trip: LimitTrip | null;
	/**
	 * The never-reset run TOTAL of guarded-loop iterations — real on EVERY
	 * halt, natural ends included (read at halt time from the guard state).
	 */
	readonly iterationCount: number;
};

// ─── Seam 2: the worker config (thread → worker) ──────────────────────────────

/**
 * The clone-safe data run delivers to its worker logic at setup.
 * `iterationLimit` is the spec's `iterations`, passed through UNCHANGED —
 * no clamping, no defaulting, no finiteness gate (cap policy is
 * iteration-guard's documented edge set; the absence of any default cap is
 * a ratified ruling). Absent → the guard counts but never throws.
 * Package-internal seam, not consumer surface.
 */
export type RunWorkerConfig = {
	readonly iterationLimit?: number;
};
