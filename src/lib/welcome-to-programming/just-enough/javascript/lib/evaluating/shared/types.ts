/**
 * @file Types for the shared evaluation infrastructure.
 *
 * Defines the Execution type (AsyncGenerator-based), engine
 * configuration, and the discriminated union of events produced
 * by the run engine.
 */

// ─── Execution type ──────────────────────────────────────────

/**
 * An async execution that yields events and resolves to a result.
 *
 * @remarks Returned by all three engines (`run`, `trace`, `debug`).
 * Provides two consumption modes:
 *
 * **Step-through** — iterate events one at a time. SAB pause
 * keeps the Worker frozen between events for correct I/O ordering.
 * ```ts
 * for await (const event of execution) {
 *   renderEvent(event);
 * }
 * ```
 *
 * **Batch** — await the full result via PromiseLike. Drains
 * the generator internally, resolves to the complete result.
 * ```ts
 * const result = await execution;
 * // or equivalently:
 * const result = await execution.result;
 * ```
 *
 * **Re-iteration** — after the generator completes (successfully,
 * via a thrown error, or via `cancel()`), a second `for await`
 * replays from `result.logs` without re-executing. Replay yields the
 * **same event references** that the live iteration yielded, so
 * consumers can `===`-compare events across iterations. The engine
 * must push each yielded event into `logs` by reference (no clone)
 * and freeze-in-place the completed result; implementations that
 * clone events break this invariant.
 *
 * **Cancellation** — `cancel()` terminates the Worker and closes
 * the generator. Idempotent with `break` from `for await`.
 *
 * @typeParam TEvent - The event type yielded during execution
 * @typeParam TResult - The final result type
 */
type Execution<TEvent, TResult> =
	AsyncIterable<TEvent> &
	PromiseLike<TResult> & {
		/** Promise that resolves when execution completes.
		 * Same Promise that PromiseLike delegates to. */
		readonly result: Promise<TResult>;

		/** Terminate execution immediately. Idempotent.
		 * After cancel, `.result` resolves with partial logs. */
		readonly cancel: () => void;
	};

// ─── Engine configuration ────────────────────────────────────

/**
 * Configuration for execution engines.
 *
 * @remarks Program ends when the first limit is reached.
 * Both are optional — omitting both means no limits (not
 * recommended for learner code).
 *
 * - `seconds` — cumulative execution time (pauses during SAB
 *   wait, so learners can examine steps indefinitely)
 * - `iterations` — max loop iterations before RangeError
 *
 * @example
 * ```ts
 * run(code, { seconds: 5 });
 * run(code, { seconds: 5, iterations: 1000 });
 * debug(code, { iterations: 100 });
 * ```
 */
type EngineConfig = {
	readonly seconds?: number;
	readonly iterations?: number;
};

// ─── Console method surface ───────────────────────────────────

/**
 * Full standard console method surface trapped by the run engine.
 *
 * Every listed method is intercepted in the worker — both to emit a
 * `ConsoleEvent` and to invoke the consumer's mock (if any) before
 * execution continues. Notably, `trace` here is the MDN stack-trace
 * dumper, not our semantic trace engine.
 */
type ConsoleMethod =
	| 'log' | 'debug' | 'info' | 'warn' | 'error'
	| 'assert' | 'table' | 'dir' | 'dirxml'
	| 'group' | 'groupCollapsed' | 'groupEnd'
	| 'count' | 'countReset'
	| 'time' | 'timeEnd' | 'timeLog'
	| 'trace' | 'clear';

// ─── Run events ──────────────────────────────────────────────

/**
 * Discriminated union of events produced by the run engine.
 *
 * @remarks Each trapped call (any console method, prompt, alert, etc.)
 * produces one event. Errors are events in the array, not thrown
 * exceptions. The consumer always receives a `RunEvent[]` in the
 * result's `logs` field.
 *
 * Discriminate on the `event` field:
 * - `'console'` — any console.* call (inspect `method` for which one)
 * - `'prompt'` — prompt() call with return value
 * - `'alert'` — alert() call
 * - `'confirm'` — confirm() call with return value
 * - `'error'` — runtime error during execution
 *
 * `RunEvent` is strictly worker-emitted events — what the program did.
 * Termination markers (cancel / break / fail) are NOT events; they
 * live on the RunResult as `outcome` + optional `reason`. Consumers
 * check `result.outcome === 'cancel' | 'fail'` (never `logs.at(-1)`).
 */
type RunEvent =
	| ConsoleEvent
	| PromptEvent
	| AlertEvent
	| ConfirmEvent
	| ErrorEvent;

/** Unified console event — one shape for all 19 console methods.
 * Consumers discriminate first on `event === 'console'`, then filter
 * by `method` if they care about a specific call. */
type ConsoleEvent = {
	readonly event: 'console';
	readonly method: ConsoleMethod;
	readonly args: readonly unknown[];
	readonly line: number;
};

type PromptEvent = {
	readonly event: 'prompt';
	readonly args: readonly unknown[];
	readonly return: string | null;
	readonly line: number;
};

type AlertEvent = {
	readonly event: 'alert';
	readonly args: readonly unknown[];
	readonly return: undefined;
	readonly line: number;
};

type ConfirmEvent = {
	readonly event: 'confirm';
	readonly args: readonly unknown[];
	readonly return: boolean;
	readonly line: number;
};

type ErrorEvent = {
	readonly event: 'error';
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly phase: 'creation' | 'execution';
};

// ─── Exports ─────────────────────────────────────────────────

export type {
	Execution,
	EngineConfig,
	ConsoleMethod,
	RunEvent,
	ConsoleEvent,
	PromptEvent,
	AlertEvent,
	ConfirmEvent,
	ErrorEvent,
};
