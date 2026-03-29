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

/**
 * Configuration for the trace engine.
 *
 * @remarks Extends {@link EngineConfig} with optional trace
 * options. Omitting `options` defaults to full trace (capture
 * everything). Provide `options` to control granularity.
 *
 * @example
 * ```ts
 * trace(code, { seconds: 5 });
 * trace(code, { seconds: 5, options: { variables: true, operators: false } });
 * ```
 */
type TraceConfig = EngineConfig & {
	readonly options?: TraceOptions;
};

/**
 * Options controlling trace granularity.
 *
 * @remarks Passed through to the Aran tracer engine.
 * When omitted from TraceConfig, defaults to full trace.
 */
type TraceOptions = Record<string, unknown>;

// ─── Run events ──────────────────────────────────────────────

/**
 * Discriminated union of events produced by the run engine.
 *
 * @remarks Each trapped call (console.log, prompt, alert, etc.)
 * produces one event. Errors are events in the array, not thrown
 * exceptions. The consumer always receives a `RunEvent[]` in the
 * result's `logs` field.
 *
 * Discriminate on the `event` field:
 * - `'log'` — console.log call
 * - `'assert'` — console.assert call
 * - `'prompt'` — prompt() call with return value
 * - `'alert'` — alert() call
 * - `'confirm'` — confirm() call with return value
 * - `'error'` — runtime error during execution
 */
type RunEvent =
	| LogEvent
	| AssertEvent
	| PromptEvent
	| AlertEvent
	| ConfirmEvent
	| ErrorEvent;

type LogEvent = {
	readonly event: 'log';
	readonly args: readonly unknown[];
	readonly line: number;
};

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
	TraceConfig,
	TraceOptions,
	RunEvent,
	LogEvent,
	AssertEvent,
	PromptEvent,
	AlertEvent,
	ConfirmEvent,
	ErrorEvent,
};
