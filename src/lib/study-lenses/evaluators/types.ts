// cspell:ignore bivariant widenable widenings
/**
 * The evaluator kind's contract: the envelope every evaluator satisfies, the
 * spec it is driven with, the handle lattice it answers with, and the shared
 * vocabulary types. README.md carries the domain model and the glossary;
 * DOCS.md carries the architectural sketch this file locks.
 *
 * Deliberately NOT declared here, so the boundary is visible: per-evaluator
 * handles, results, options, event unions, and error taxonomies (each
 * evaluator's own types.ts); the explicit generator surface (intercept's —
 * this file pins only the rule that it is an explicit type alias, never the
 * TypeScript lib's AsyncGenerator token); io mock shapes; the
 * machinery-defect record's shape (the kind pins only its discriminant
 * literal); the execution-handle library's construction seams; engine types;
 * enrichment accessor types.
 */

import type { Facts } from '../embody/types.js';

/**
 * The settle base every handle widens: awaitable, memoized result, cancel.
 *
 * The result promise ALWAYS fulfills — errors, timeouts, and cancellations
 * are data on the result, so no consumer writes a rejection path. `cancel` is
 * idempotent and answers from outside any loop; called before first
 * consumption it settles the run without spawning anything.
 *
 * A handle with an already-determined result and no stream satisfies this
 * base trivially — a result-only evaluator is a legal evaluator.
 *
 * @remarks
 * This base is the kind's one ADDITION to the reference vocabulary (ruled
 * 2026-08-17): the reference's own run handle settles without streaming, so
 * the settle contract needs a name beneath `Execution`, and the reference
 * reserves the `…Handle` suffix for per-evaluator widenings.
 */
export type ExecutionBase<TResult> = PromiseLike<TResult> & {
	/** Resolves when the run settles. The same promise `await handle` reaches. */
	readonly result: Promise<TResult>;

	/** Stop the run. Idempotent; before first consumption, settles inert. */
	readonly cancel: () => void;
};

/**
 * The streaming handle: the settle base plus live step-through.
 *
 * Consumption is a closed list of exactly three touches, and the first of
 * them starts the run: the first iterator pull, an `await`/`.then`
 * subscription, or a `.result` property access. Construction never starts it
 * — creation is inert (human ruling 2026-08-06, the region's one laziness
 * departure from the reference's microtask auto-start).
 *
 * One-shot: a settled handle does not replay its events; the result's events
 * array is the record (human ruling 2026-08-05). An iterator created and then
 * abandoned holds the run — break or cancel is the exit.
 *
 * TEvent and TResult are unconstrained on purpose: delivered events are
 * richer than wire messages (enrichment may install accessors), payloads may
 * themselves be iterables or promises, and results are fully
 * evaluator-owned.
 */
export type Execution<TEvent, TResult> = AsyncIterable<TEvent> &
	ExecutionBase<TResult>;

/**
 * How the run is posed. The consuming lens maps the snippet type onto this
 * axis; it is authoritative for posing and distinct from the static parse
 * goal the facts carry (`facts.type`). An applicability may assume the lens
 * supplied a coherent pairing.
 *
 * `'function'` runs the snippet as a function body — top-level `var` and
 * `function` declarations become locals, a `"use strict"` line is prepended,
 * and a top-level `return` is legal where a real script would be a syntax
 * error. `'module'` runs a genuine ES module — always strict, asynchronous
 * natural end. A `'script'`-goal snippet posed on `'function'` gets
 * function-body semantics, not script semantics: no script execution path is
 * ratified (human ruling 2026-08-13), and a third value joins this closed
 * union only through its own design review and engine increment.
 */
export type ExecutionAxis = 'function' | 'module';

/**
 * What an evaluator is driven with. Facts are embody's frozen main-thread
 * graph, gate-guaranteed at drive time; they never cross a worker boundary —
 * an off-thread evaluator projects its own clone-safe slice.
 *
 * The placement rule: a field lives here exactly when its meaning is
 * identical at the machinery layer for every evaluator. Everything else —
 * io mocks, tracer gate trees, any evaluator-owned bag — rides per-evaluator
 * spec widenings, which add OPTIONAL members only.
 */
export type EvaluationSpec = {
	/** The embodiment's frozen fact graph, by reference. */
	readonly facts: Facts;

	/** How the run is posed. */
	readonly execution: ExecutionAxis;

	/**
	 * Wall-clock budget in seconds; absent means the engine's own default
	 * applies — the engine owns the number. The resolved value is echoed on
	 * each evaluator's options record, always populated.
	 */
	readonly seconds?: number;

	/**
	 * The runaway-loop cap the iteration guard enforces. Guards always
	 * splice, so the iteration total is real on every halt; this cap alone
	 * decides whether tripping it ends the run. Absent means no cap.
	 */
	readonly iterations?: number;
};

/**
 * The kind's refusal-as-data shape: returned by main instead of a handle. An
 * imperatively-called function cannot refuse by not existing the way an
 * unmounted component can — an evaluator invoked on a spec it cannot serve
 * still answers, with data, never a throw at the learner (human ruling
 * 2026-08-12). Typed synchronous boundary throws remain a legal posture for
 * an evaluator kind; the evaluators in this region refuse.
 */
export type EvaluatorRefusal = {
	readonly refused: true;

	/**
	 * Why — in the evaluator's own words for a spec refusal; the region's
	 * shared wording for an environment refusal (human ruling 2026-08-19;
	 * README § Outcomes, errors, refusals owns the species pair).
	 */
	readonly reason: string;
};

/**
 * The kind's outcome vocabulary: the reference's six values, wholesale
 * (human ruling 2026-08-06). Each evaluator's own outcome union is a SUBSET
 * of this one (run excludes `'fail'`), so the shared spellings are
 * compiler-pinned; an evaluator needing a value beyond the six extends the
 * union in its own types — the vocabulary is shared, never closed. The
 * engine's five-value settlement vocabulary is a different layer's; each
 * evaluator maps that seam.
 */
export type EvaluationOutcome =
	| 'complete'
	| 'cancel'
	| 'fail'
	| 'timeout'
	| 'iteration-limit'
	| 'error';

/**
 * The machinery-defect discriminant: the added error kind naming a broken
 * machine, discriminated from the learner's own error (the reference
 * disguised the former as a learner-shaped WorkerError). Pinned kind-level
 * for the same anti-drift reason as the outcome vocabulary; the record
 * behind it — causes, names, messages — is per-evaluator seam material. The
 * engine's cause spellings never appear on results.
 */
export type MachineryDefectKind = 'defect';

/**
 * The two-value error phase: did the program fail before it ran, or while
 * running (human ruling 2026-08-13). Exactly two — nuance within creation
 * belongs to the embodiment and the orchestrator, and this union is
 * deliberately NOT widenable, in stated contrast to the execution axis. The
 * second value's spelling matches the lifecycle's fifth phase in
 * `src/lib/study-lenses/embody/types.ts`; the reference's `'execution'`
 * spelling does not return.
 */
export type ErrorPhase = 'creation' | 'evaluation';

/**
 * The protocol for an ask nobody answered: the event carries `respond`, so
 * resume rides the event, never the iterator. Answering twice is inert;
 * answering after teardown is a no-op, never a throw.
 *
 * Generic so a carrying evaluator binds its real shapes —
 * `PendingInteraction<PromptRequest, string>` — instead of inheriting an
 * `unknown`-parameter ceiling on `respond` (function parameters are
 * contravariant, so an `unknown`-fixed signature would bar every narrower
 * one). The defaults keep an unbound mention meaningful. The carrying
 * evaluator's event union supplies the discriminant, in its own reference
 * spelling.
 */
export type PendingInteraction<TRequest = unknown, TAnswer = unknown> = {
	readonly request: TRequest;
	readonly respond: (answer: TAnswer) => void;
};

/**
 * The kind envelope. The object itself is an evaluator's identity: consumers
 * import it directly; `name` is a stable label; `applicability` is pure and
 * synchronous over the same spec domain `main` serves, and the consuming
 * lens calls it first to build its options list.
 *
 * The generic parameters carry the widening mechanism: a per-evaluator spec
 * adds optional members only, and a per-evaluator handle intersects the base
 * or the streaming handle. That first rule is what keeps every widened
 * evaluator assignable to the bare `Evaluator` — a heterogeneous roster
 * types as `ReadonlyArray<Evaluator>` — while a REQUIRED spec addition
 * breaks bare-roster assignability, which is the compile-time signal to
 * reconsider the field's placement. Narrowing is not widening: an evaluator
 * serving only one axis value accepts the shared spec and refuses, as data,
 * what it cannot serve.
 *
 * The members are declared as readonly function PROPERTIES, and that syntax
 * is contract, not style: method-shorthand parameters are bivariant, and
 * under them the misplacement signal above vanishes silently.
 */
export type Evaluator<
	TSpec extends EvaluationSpec = EvaluationSpec,
	THandle extends ExecutionBase<unknown> = ExecutionBase<unknown>,
> = {
	readonly name: string;
	readonly applicability: (spec: TSpec) => boolean;
	readonly main: (spec: TSpec) => THandle | EvaluatorRefusal;
};
