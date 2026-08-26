/**
 * The guarded worker base's seam: the halt core every guarded evaluator's
 * author stamps, the per-evaluator finisher, and the base record a worker
 * setup consumes. README.md carries the domain model and the 2026-08-25/26
 * rulings this file encodes (the ledger's guarded-worker-base bullet).
 *
 * Deliberately NOT declared here, so the boundary is visible: the
 * per-evaluator halt shapes (`RunHalt`, `InterceptHalt` — each unit's own
 * types.ts, ruled 2026-08-19; their `phase` members land at each unit's
 * worker-setup increment, tripwire-pinned in this module's tests); the
 * engine's `SerializeHalt`/`HaltPhase` (imported, never mirrored); the
 * guard's own shapes (iteration-guard's).
 */

import type { HaltPhase, SerializeHalt } from '../../../lib/engine/types.js';
import type { IterationGuard, LimitTrip } from '../iteration-guard/types.js';

/**
 * A natural end's core: the empty members are PINNED as literals — a
 * natural end has no error, no trip, and no phase, and the type says so
 * (ruled 2026-08-26: the core is a discriminated union so no impossible
 * state is representable and no mapper ever fabricates a phase).
 */
export type NaturalHaltCore = {
	readonly natural: true;
	readonly errorName: '';
	readonly message: '';
	readonly trip: null;
	readonly iterationCount: number;
	readonly phase: null;
};

/**
 * A throw's core: the error classified (non-Error throws become
 * `'Error'` / `String(thrown)`), the guard's structural trip or `null`,
 * the real run total, and the engine's structural phase — non-null on
 * this arm, so a unit's mapper narrows on `natural` and reads a
 * `HaltPhase`, never a maybe.
 */
export type ThrowHaltCore = {
	readonly natural: false;
	readonly errorName: string;
	readonly message: string;
	readonly trip: LimitTrip | null;
	readonly iterationCount: number;
	readonly phase: HaltPhase;
};

/** The shared members every authored halt carries, discriminated on `natural`. */
export type HaltCore = NaturalHaltCore | ThrowHaltCore;

/**
 * The per-evaluator seam: maps the core onto that unit's own halt shape,
 * inside the worker, where worker-only attribution is still readable. It
 * fires on EVERY stop — natural ends included, with `rawError`
 * undefined — and is GUARDED AT THE BUILDER: a throwing finisher
 * degrades to the unfinished core, never a lost halt (ruled 2026-08-26;
 * intercept's stack-parse residual is the named first client). Identity
 * when absent — run's case. Built by the unit's worker setup, it closes
 * over everything else that setup holds; that closure is why
 * `(core, rawError)` is a sufficient signature.
 */
export type FinishHalt<THalt> = (core: HaltCore, rawError: unknown) => THalt;

/**
 * What a guarded evaluator's worker setup consumes: the guard's two
 * injectable helpers (spread into the setup's returned globals) and the
 * halt author to register with the engine.
 */
export type GuardedWorkerBase = {
	readonly guardGlobals: IterationGuard['globals'];
	readonly serializeHalt: SerializeHalt;
};
