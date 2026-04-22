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
 * **Re-iteration** — after the generator completes, events are
 * cached in `result.logs`. A second `for await` replays from the
 * cache without re-executing.
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
 * @remarks `LogEvent` and `AssertEvent` are deprecated aliases kept
 * during the transition from per-method event types to unified
 * `ConsoleEvent`. They will be removed once `create-worker-script.ts`
 * emits `{ event: 'console', method: 'log'|'assert', ... }`.
 */
type RunEvent =
	| ConsoleEvent
	| LogEvent
	| AssertEvent
	| PromptEvent
	| AlertEvent
	| ConfirmEvent
	| ErrorEvent;

/** Unified console event — replaces LogEvent and AssertEvent. */
type ConsoleEvent = {
	readonly event: 'console';
	readonly method: ConsoleMethod;
	readonly args: readonly unknown[];
	readonly line: number;
};

/** @deprecated Use ConsoleEvent with method: 'log' instead. */
type LogEvent = {
	readonly event: 'log';
	readonly args: readonly unknown[];
	readonly line: number;
};

/** @deprecated Use ConsoleEvent with method: 'assert' instead. */
type AssertEvent = {
	readonly event: 'assert';
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
	LogEvent,
	AssertEvent,
	PromptEvent,
	AlertEvent,
	ConfirmEvent,
	ErrorEvent,
};
