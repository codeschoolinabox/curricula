/**
 * The evaluator kind's contract: what every evaluator under
 * `evaluators/<name>/` exports. An evaluator is the generator kind of study
 * utility — headless, consumed by lenses, never rendered.
 *
 * This module imports exactly one foreign type — embody's `Facts`, the studied
 * program an evaluator runs over; a wide edge, through which embody's
 * fact-graph and acorn's node shapes arrive transitively. The execution
 * engine's axis it must speak is the one foreign shape mirrored structurally
 * rather than received; the edge to embody is one-way and type-only. Region docs: ./README.md (kind mechanics) · ./DOCS.md
 * (architecture). The package glossary (../README.md) owns the shared
 * vocabulary.
 */

import type { Facts } from '../embody/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// The evaluation spec
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What a consuming lens builds and hands to an evaluator — the kind's whole
 * input domain: the studied program's Facts, plus how the lens poses them for
 * execution. The facts arrive gate-guaranteed — an evaluator is driven only in
 * the `evaluation` phase, which embody bars unless parsing and entwining
 * succeeded — so no evaluator re-checks whether the learner's program parses.
 */
export type EvaluationSpec = {
	/**
	 * The studied program's derivations, handed in by reference: the source
	 * every run reads, and the ast / entwined / scope structure a tracer
	 * resolves its events against. `source`, `tokens`, `ast`, and `entwined`
	 * are gate-guaranteed at drive time — the evaluation phase bars otherwise;
	 * narrow each derived stage's `ok` once, treating its unreachable failure
	 * arm (and any `environment` failure) as a loud dev-mode embody defect,
	 * never a learner condition and never an unsafe cast. This is embody's
	 * frozen main-thread graph — an evaluator running off-thread projects its
	 * own clone-safe slice, never posting it.
	 */
	readonly facts: Facts;
	/**
	 * The execution axis — the consuming lens maps the snippet type onto it,
	 * and it is authoritative for how the run is posed. Distinct from the
	 * snippet type the facts carry (`facts.type`: `'script' | 'module'`, the
	 * static parse goal); deliberate collapse — script strict-versus-sloppy is
	 * not carried, the axis names how the program is posed, nothing more. An
	 * applicability may assume the lens supplied a coherent pairing.
	 */
	readonly execution: 'function' | 'module';
	/**
	 * The runaway-loop cap the iteration guard enforces — a loop that never
	 * yields cannot be stopped by ceasing to pull, so the guard lives inside
	 * the machinery and its cap rides the spec. Absent, no iteration cap
	 * applies — the guard still counts, and the machinery's default backstop
	 * is the engine's wall-clock budget; the seconds budget stays the
	 * engine's own.
	 */
	readonly iterations?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One streamed moment of a run. Every evaluator publishes its own event
 * union extending this envelope structurally, in its own types. `kind` is
 * deliberately an open string — an unlisted event rides through uniform
 * dispatch rather than being dropped — and no other field is hoisted here:
 * consumers needing an evaluator's precise union import that evaluator
 * directly.
 */
export type EvaluatorEvent = {
	readonly kind: string;
};

/**
 * The distinguished event kind for a program waiting on its user: the
 * stream suspends until the event's own respond channel is answered, then
 * resumes.
 *
 * @remarks
 * Optional per evaluator: one whose backend answers interactions itself
 * (danger's real window) never emits it — consumers must not assume every
 * evaluator suspends. Resume rides the event, never the iterator — a
 * `for await` consumer cannot feed values back through `.next()`. `respond`
 * is a main-thread function: the consumer-facing event union may carry
 * functions and is distinct from whatever clone-safe wire messages an
 * implementation uses internally. Answering twice is inert; answering after
 * teardown is a no-op, never a throw.
 */
export type PendingInteraction = {
	readonly kind: 'pending-interaction';
	/** What the program asked, in the evaluator's own vocabulary. */
	readonly request: unknown;
	/** Answers the program and resumes the stream. */
	readonly respond: (answer: unknown) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Settlement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A run-ending error, in the machine's own words — the floor every
 * settlement guarantees. An evaluator may carry a structurally richer error
 * (a source position, a cause); consumers needing the richer shape import
 * that evaluator directly, as with events.
 */
export type EvaluationError = {
	readonly name: string;
	readonly message: string;
};

/**
 * How a run ended. Engine-forced stops — a timeout, the iteration cap —
 * settle as errors so the learner sees why the run ended; `canceled` is
 * reserved for the consumer ceasing to pull, resolved at teardown. These
 * three arms are the settlement's floor; the error arm extends structurally
 * per evaluator, never here.
 */
export type Settlement =
	| { readonly ended: 'clean' }
	| { readonly ended: 'error'; readonly error: EvaluationError }
	| { readonly ended: 'canceled' };

// ─────────────────────────────────────────────────────────────────────────────
// The stream
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What main returns when it serves the spec: an async iterable of events
 * plus a companion settlement promise.
 *
 * @remarks
 * The settlement is a companion, not a final event and not the iterator's
 * return value — `for await` consumers never see a generator's return
 * value, and a settlement-as-last-event would be unenforceable convention.
 * `settled` resolves exactly once, whatever ends the run. Nothing executes
 * until the consumer starts pulling; breaking out of the pull is the
 * cancellation — implementations resolve the canceled arm in the stream's
 * own teardown (a latch in the generator's finally), which the `for await`
 * protocol triggers via `.return()`.
 */
export type EvaluationStream = AsyncIterable<EvaluatorEvent> & {
	readonly settled: Promise<Settlement>;
};

/**
 * The kind's refusal-as-data shape: returned by main instead of a stream.
 * An imperatively-called function cannot refuse by not existing the way an
 * unmounted component can — so an evaluator invoked on a spec it cannot
 * serve still answers, with data, never a throw.
 */
export type EvaluatorRefusal = {
	readonly refused: true;
	/** Why, in the evaluator's own words. */
	readonly reason: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// The evaluator kind
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The generator kind of study utility. The kind stands parallel to the lens
 * kind: same envelope convention — name, applicability, main — over its own
 * input domain, whose one cross-region dependency is embody's `Facts`.
 *
 * @remarks
 * The object itself is an evaluator's identity: consumers import it
 * directly; `name` is a stable label, and a consumer keying an options list
 * by name owns that collection's uniqueness. `applicability` is pure and
 * synchronous over the same spec domain `main` serves — the consuming lens
 * calls it to build its options list before ever driving `main`.
 */
export type Evaluator = {
	readonly name: string;
	readonly applicability: (spec: EvaluationSpec) => boolean;
	readonly main: (spec: EvaluationSpec) => EvaluationStream | EvaluatorRefusal;
};
