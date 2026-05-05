/**
 * @file Types shared by `lib/ast/tokenize/` and `lib/ast/parse/`.
 *
 * Defines the SYNC sibling of `lib/evaluating/shared/types.ts`'s
 * `Execution<TEvent, TResult>` (the AST stepping generators are sync —
 * acorn is sync, no Worker, no SAB pause), plus the minimal `BaseEvent`
 * and `BaseError` shapes that every event/error type in tokenize and
 * parse extends.
 *
 * No module-specific types live here — `TokenEvent`, `NodeEnterEvent`,
 * `TokenizeHandle`, `ParseHandle`, etc. belong in their respective
 * `tokenize/types.ts` and `parse/types.ts`.
 */

import type { SourceLocation } from 'acorn';

// ─── Sync execution surface ──────────────────────────────────

/**
 * A synchronous execution that yields events and resolves to a result.
 *
 * @remarks Sync sibling of `Execution<TEvent, TResult>` from
 * `lib/evaluating/shared/types.ts`. Both AST stepping generators
 * (`tokenize` and `parse`) are sync — acorn is sync, there is no
 * Worker, no SharedArrayBuffer pause protocol, no I/O traps.
 *
 * Provides three consumption modes:
 *
 * **Step-through (sync iteration)** — pull events one at a time:
 * ```ts
 * for (const event of execution) {
 *   renderEvent(event);
 * }
 * ```
 *
 * **Batch (async result)** — await the full result via PromiseLike:
 * ```ts
 * const result = await execution;
 * // or equivalently:
 * const result = await execution.result;
 * ```
 *
 * **Re-iteration** — after the generator completes (naturally, via
 * a thrown error, or via `cancel()`), a second `for` loop replays
 * from the result's `events` array without re-executing. Replay
 * yields the **same event references** that the live iteration
 * yielded; consumers can `===`-compare events across iterations.
 *
 * **Cancellation** — `cancel()` halts the generator at the next
 * `next()` call. Idempotent with `break` from `for ... of`.
 *
 * @typeParam TEvent - The event type yielded during execution
 * @typeParam TResult - The final result type
 */
type SyncExecution<TEvent, TResult> = Iterable<TEvent> &
	PromiseLike<TResult> & {
		/** Promise that resolves when execution completes.
		 * Same Promise that PromiseLike delegates to. */
		readonly result: Promise<TResult>;

		/** Halt execution at the next pull. Idempotent.
		 * After cancel, `.result` resolves with whatever events
		 * were yielded before the halt. */
		readonly cancel: () => void;
	};

// ─── Base event shape ────────────────────────────────────────

/**
 * Minimal shape every event in `lib/ast/tokenize/` and
 * `lib/ast/parse/` extends.
 *
 * @remarks
 * - `step` is the 1-indexed, contiguous sequence number in the
 *   global event stream of a single run. `result.events[i].step
 *   === i + 1`. Mirrors the convention used by intercept and
 *   trace/semantics for cross-tool consistency.
 *
 * - `loc` is the acorn-native `SourceLocation` (set when acorn
 *   was invoked with `locations: true`). Carries `start.line`,
 *   `start.column`, `end.line`, `end.column`.
 *
 * - `prev` / `next` form a doubly-linked chain across the entire
 *   event stream of a single run. After the run settles, every
 *   event's `prev` and `next` pointers reference the neighbors in
 *   the order they were yielded. The first event's `prev` is
 *   `null`; the last event's `next` is `null`. This enables
 *   backward stepping without indexing into the events array.
 *   The chain is wired during the entwine pass at result time
 *   (after the generator naturally completes); during live
 *   iteration `prev` and `next` are not yet populated.
 */
type BaseEvent = {
	readonly step: number;
	readonly loc: SourceLocation;
	readonly prev: BaseEvent | null;
	readonly next: BaseEvent | null;
};

// ─── Base error shape ────────────────────────────────────────

/**
 * Minimal shape every error type in `lib/ast/tokenize/` and
 * `lib/ast/parse/` extends.
 *
 * @remarks Mirrors the shape used by `lib/parse-old/types.ts`'s
 * `ParseResultError` and intercept's error variants. The `kind`
 * field discriminates the error category (e.g. `'tokenize'`,
 * `'parse'`); `name`, `message`, `line`, `column` are taken
 * verbatim from acorn's exception when applicable.
 */
type BaseError = {
	readonly kind: string;
	readonly name: string;
	readonly message: string;
	readonly line: number;
	readonly column: number;
};

// ─── Exports ─────────────────────────────────────────────────

export type { SyncExecution, BaseEvent, BaseError };
