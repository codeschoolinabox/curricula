/**
 * The source seam: what an evaluator supplies to the execution-handle
 * factory, and the controls the factory hands back to a widening. README.md
 * carries the domain model and the design rulings (2026-08-18); DOCS.md
 * carries the architectural sketch this file locks.
 *
 * Deliberately NOT declared here, so the boundary is visible: the handle
 * shapes themselves (`Execution` and `ExecutionBase` are the region root's,
 * `../../types.ts`); per-evaluator result, event, and error types; the
 * factory's overload signatures (they live with the factory, the one
 * behavior file this library exports).
 */

import type { Execution, ExecutionBase } from '../../types.js';

/**
 * Which consumption path ignited the run. Fixed at ignition for the
 * handle's life; the source learns it at `start(mode)` and takes its own
 * declared ask posture from it. A result-only source is always told
 * `'batch'`.
 */
export type ExecutionMode = 'iterate' | 'batch';

/**
 * What the extras builder receives: the library's own teardown door, so a
 * widened control (`fail(reason)`: record source-side, then close the
 * latch) reaches teardown without a live handle in sight. A builder that
 * calls `cancel` synchronously during construction gets a handle that is
 * already settled with the inert-cancel result — legal, stated.
 */
export type SourceControls = {
	readonly cancel: () => void;
};

/**
 * The four keys no extra may shadow, on EITHER overload — the base's
 * members plus the streaming iterator. A colliding extra would silently
 * overwrite the laws the library exists to build (a `result` extra voids
 * the memoized settle; a `Symbol.asyncIterator` extra makes a result-only
 * handle TYPE as streaming while nothing drives it).
 */
export type ReservedHandleKey =
	| 'result'
	| 'cancel'
	| 'then'
	| typeof Symbol.asyncIterator;

/**
 * The disjointness mechanism: every reserved key in the builder's return
 * maps to `never`, so a colliding extra fails to typecheck while clean
 * extras pass untouched. Binds literal key sets — an index-signature
 * return evades the check and is banned by rule, not by the compiler.
 */
export type DisjointExtras<TExtras> = {
	[K in keyof TExtras]: K extends ReservedHandleKey ? never : TExtras[K];
};

/**
 * The evaluator's eager echoes and widened controls, built over the
 * library's controls and installed by the factory — correct descriptors,
 * frozen last. Widening happens HERE, never by composing around a live
 * handle: `result` is an ignition getter, so a spread would start the run
 * at creation and drop the non-enumerable iterator.
 */
export type BuildExtras<TExtras extends object> = (
	controls: SourceControls,
) => TExtras & DisjointExtras<TExtras>;

/**
 * What every source supplies, both shapes. `start` is invoked AT MOST
 * ONCE, at the first consumption touch, with the engaged mode — the start
 * latch closes BEFORE the call, so a throwing source is never re-entered.
 * `stop` is the library's teardown word: at most once, on a post-ignition
 * cancel only — natural end, inert cancel, and post-settlement cancel all
 * call nothing. `result` is the source's always-fulfilling promise for
 * every started route; the library's memoized settle IS this promise,
 * routed through `sourceDefectResult` on rejection.
 *
 * The two fallback thunks cover the routes no started source can speak
 * for: `inertCancelResult` shapes the settle for a cancel that preceded
 * ignition (nothing started, nothing spawned); `sourceDefectResult`
 * shapes the settle for a source that broke on any member — the library
 * never rejects a result.
 */
export type SourceBase<TResult> = {
	readonly start: (mode: ExecutionMode) => void;
	readonly stop: () => void;
	readonly result: Promise<TResult>;
	readonly inertCancelResult: () => TResult;
	readonly sourceDefectResult: (cause: unknown) => TResult;
};

/**
 * A source with a live event seam: `events` is an ASYNC ITERATOR (an
 * async generator satisfies it) — the library never asks for a second
 * iterator, so one-shot-ness is by construction. The library pulls it
 * from the consumer's iterator (iterate mode) or the internal drainer
 * (batch mode), and on the settle attempts disposal once
 * (`events.return?.()`), never awaited, errors swallowed.
 */
export type StreamingSource<TEvent, TResult> = SourceBase<TResult> & {
	readonly events: AsyncIterator<TEvent>;
};

/**
 * A source with no event seam — the handle it yields is result-only
 * (`ExecutionBase`). `events` is declared `never` so the factory's
 * overloads discriminate on shape even at non-literal call sites: an
 * author writing `events: undefined` matches neither source type.
 */
export type ResultOnlySource<TResult> = SourceBase<TResult> & {
	readonly events?: never;
};

/**
 * The widened handle shapes the factory returns — the region's contract
 * shapes intersected with the evaluator's installed extras, so `main`'s
 * return type stays a named, unsealed extension with no cast and no
 * erasure ceremony.
 */
export type WidenedExecution<
	TEvent,
	TResult,
	TExtras extends object,
> = Execution<TEvent, TResult> & TExtras;

export type WidenedExecutionBase<
	TResult,
	TExtras extends object,
> = ExecutionBase<TResult> & TExtras;
