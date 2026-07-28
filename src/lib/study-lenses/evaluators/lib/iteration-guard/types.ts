/**
 * @file The public contract of the shared iteration-guard semantics.
 *
 * The engine-backed evaluators (run, intercept) import these shapes and the
 * three verbs behind them; nothing outside the evaluators region does. The
 * placement half of the story is loop-guard's LOCKED contract — this module
 * consumes it and re-exports the two shapes that cross its own boundary
 * (`GuardResult`, `LoopLoc`) rather than re-declaring them. The engine's
 * shapes are mirrored structurally, never imported: `GuardHelpers` is
 * declared here and is structurally assignable to the engine's injected
 * globals record.
 *
 * The marker key and the trip record's storage on the marked throw are NOT
 * part of this surface — consumers hold a {@link LimitTrip} returned by the
 * classification verb, never a property path. Vocabulary is pinned in
 * README.md § Ubiquitous language; the phases and the ordering constraint in
 * DOCS.md.
 */

import type { GuardResult, LoopLoc } from '../../../lib/loop-guard/types.js';

export type { GuardResult, LoopLoc } from '../../../lib/loop-guard/types.js';

// ─── The splice verb (thread-side) ────────────────────────────────────────────

/**
 * Splice this module's closure-counter guard calls into every guarded loop
 * of `code`, via loop-guard's `spliceLoopGuards`. The call text is
 * `__$il(n, 'L:C:L:C');` at the top of each guarded loop's braced body and
 * `__$ir(n);` after the loop — authored here, placed by loop-guard. Run it
 * on the ORIGINAL source, before any column-shifting rewrite (DOCS.md
 * § Ordering). Returns loop-guard's {@link GuardResult} unchanged (`code`
 * `===` the input when no loops were guarded). Throws loop-guard's
 * `LoopGuardError` on a malformed source; the `multiline-injection` arm is
 * unreachable through this verb — the authored call text is single-line by
 * construction.
 */
type SpliceIterationGuards = (code: string) => GuardResult;

// ─── The worker-side guard state ──────────────────────────────────────────────

/**
 * The two guard helpers a worker setup injects so the spliced calls
 * resolve — the `__$` names sit outside the admissible learner-identifier
 * surface (the collision guard; accident-proofing — the kind gates do not
 * include subset validation, and a deliberate out-of-protocol call
 * degrades safely, see `__$il` below). `__$il` increments the loop's
 * per-entry counter AND the run total (increment, then compare — the
 * tripping iteration is counted), and on a trip throws the marked limit
 * throw: a `RangeError` with the pinned message
 * `Loop N exceeded M iterations.` carrying the deep-frozen trip record
 * under the module's marker key (non-enumerable, non-writable,
 * non-configurable; the key is a shared constant, never retyped). A loc
 * string that does not decode to four finite positions builds NO record:
 * the trip still throws — pinned message, cap held — but as a PLAIN
 * `RangeError`, unattributable, classifying as the program's own error.
 * `__$ir` zeroes ONLY that loop's per-entry counter, so a fresh entry
 * restarts its count; the run total is never reset.
 *
 * Structurally assignable to the engine's injected-globals record — an
 * assignability that is ALIAS-load-bearing: a same-shape `interface` has
 * no implicit index signature and would fail `Record<string, unknown>`
 * assignment, so this stays a `type` alias, and a compile-time probe in
 * the tests locks the mirror.
 */
type GuardHelpers = {
	readonly __$il: (loopIndex: number, locString: string) => void;
	readonly __$ir: (loopIndex: number) => void;
};

/**
 * One run's guard state, closed over and mutated in place — this module's
 * declared mutable-state exception, per-run disposable: one
 * {@link CreateIterationGuard} call serves exactly one run. `globals` is
 * what the worker setup injects (named for the engine's injected-globals
 * channel); `readIterationCount` is the halt author's read of the run
 * total — every halt can carry a real count — and is NOT injected.
 */
type IterationGuard = {
	readonly globals: GuardHelpers;
	readonly readIterationCount: () => number;
};

/**
 * Build one run's guard state. `cap` is the per-entry ceiling, already
 * projected from the spec by the evaluator — this module never reads a
 * spec and never validates or defaults the number it is given (C1 ruling:
 * no iteration-cap default exists; an uncapped runaway is the engine
 * wall-clock budget's to stop). Absent (`undefined`) → the helpers count
 * but never throw. The comparison is `> cap`: `0` and negatives trip on
 * the first pass; `Infinity` and `NaN` never trip. The per-iteration path
 * is O(1) and allocation-free — the counter store allocates only on a
 * loop's first-ever entry.
 */
type CreateIterationGuard = (cap?: number) => IterationGuard;

// ─── Classification (worker-side, at the halt serializer) ─────────────────────

/**
 * The trip record: which loop tripped (loop-guard's dense, 1-based,
 * reading-order index) and its own decoded span — the LOOP statement's
 * span, decoded at throw time from the spliced `'L:C:L:C'` string into
 * loop-guard's clone-safe {@link LoopLoc} shape, so a halt author reads
 * structured data and the string form never crosses the worker boundary.
 * Deep-frozen at construction (record, span, and both positions).
 * Well-formed means this full depth: a finite-number `loopIndex` and four
 * finite line/column positions — the classification's acceptance
 * predicate, and the only shape `__$il` ever builds. The type is
 * structural: a well-formed forgery is also typed `LimitTrip`, unfrozen —
 * see {@link ReadLimitTrip}.
 */
type LimitTrip = {
	readonly loopIndex: number;
	readonly loc: LoopLoc;
};

/**
 * The classification verb — the engine's consumer-owned limit
 * classification, run inside an evaluator's halt serializer (same realm as
 * the throw). Returns the trip record when `thrown` carries a well-formed
 * marker (the full {@link LimitTrip} depth, all numbers finite), else
 * `null` — `null` IS the "not a trip" answer, so recognition needs no
 * second predicate and no consumer ever touches the throw's properties.
 * The record is returned BY REFERENCE — the stamped object itself, never
 * a copy, never re-frozen — so the halt author holds exactly the object
 * the classification found: frozen when the guard built it, as-given
 * when a well-formed forgery brought it (shape, never provenance).
 * Total by construction: the WHOLE body rides one throw-guard —
 * accessor-safety (presence checked without invoking getters) narrows
 * what the guard must catch, it is not the guard's boundary, so a
 * trapping proxy whose very property inspection throws is still `null`,
 * never an escape (a throw here would crash the worker). Name and message
 * text are never inspected.
 */
type ReadLimitTrip = (thrown: unknown) => LimitTrip | null;

export type {
	SpliceIterationGuards,
	GuardHelpers,
	IterationGuard,
	CreateIterationGuard,
	LimitTrip,
	ReadLimitTrip,
};
