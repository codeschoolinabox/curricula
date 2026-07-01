/**
 * @file The public contract of the JEJ intercept evaluator, plus the two
 * cross-increment seams the pipeline is built against.
 *
 * The vocabulary is pinned in README.md § Vocabulary pinning, with the old
 * intercept engine as the behavior oracle (README § Bounded context). This
 * evaluator produces its OWN typed streamed-event union and settlement; the
 * embody adapter mapping (to `EmitNMEvent` / `ErrorNMEvent` / `RunInstance` /
 * `EndReport`) is out of scope.
 *
 * Two seams are pinned here so the increments do not reverse-engineer each
 * other:
 *   1. the worker→thread message (what the worker emits, what the thread maps);
 *   2. the dialog call-request (what the worker's `call` carries, what the
 *      thread's `onCall` reads before answering).
 *
 * This module imports nothing: the evaluator is self-contained, and `unknown`
 * argument arrays plus a locally-mirrored io shape keep it decoupled from both
 * the engine and embody. `InterceptIoMocks` deliberately mirrors embody's
 * `IoMocks` structurally so the adapter passes the consumer's mocks straight
 * through — a structural, not nominal, coupling.
 */

// ─── Streamed event vocabulary ─────────────────────────────────────────────────

/**
 * The 19 standard console method names, for documentation. `method` is carried
 * as an open `string` (not this union) so an unlisted console method still
 * rides through rather than being dropped — matching the open
 * `EmitNMEvent.method` at the embody boundary (README § Bounded context).
 */
type StandardConsoleMethod =
	| 'log'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'assert'
	| 'table'
	| 'dir'
	| 'dirxml'
	| 'group'
	| 'groupCollapsed'
	| 'groupEnd'
	| 'count'
	| 'countReset'
	| 'time'
	| 'timeEnd'
	| 'timeLog'
	| 'trace'
	| 'clear';

/**
 * Fields every streamed event carries. `step` is the monotonic emission order
 * (1-indexed, assigned worker-side). No `nodePath`: an evaluator does no
 * instrumentation, so events carry no source attribution (README § Bounded
 * context).
 */
type InterceptEventBase = {
	readonly step: number;
};

/**
 * A `console.<method>(…)` call. One-way (no value returns to the program).
 * `args` have passed the clone-safe args pass — an argument the worker boundary
 * cannot structured-clone rides as its `String(…)` form.
 */
type InterceptConsoleEvent = InterceptEventBase & {
	readonly event: 'console';
	/** Open `string`; the {@link StandardConsoleMethod} names, faithfully. */
	readonly method: string;
	readonly args: ReadonlyArray<unknown>;
};

/** An `alert(…)` dialog round-trip. Returns `undefined` to the program. */
type InterceptAlertEvent = InterceptEventBase & {
	readonly event: 'alert';
	readonly args: ReadonlyArray<unknown>;
};

/** A `confirm(…)` dialog round-trip. `returnValue` is the consumer's answer. */
type InterceptConfirmEvent = InterceptEventBase & {
	readonly event: 'confirm';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: boolean;
};

/** A `prompt(…)` dialog round-trip. `returnValue` is the consumer's answer. */
type InterceptPromptEvent = InterceptEventBase & {
	readonly event: 'prompt';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: string | null;
};

/**
 * The flat streamed-event union this evaluator emits. The terminal throw is NOT
 * here — it is carried as {@link InterceptHalt} on the settlement (README
 * § Vocabulary pinning).
 */
type InterceptEvent =
	| InterceptConsoleEvent
	| InterceptAlertEvent
	| InterceptConfirmEvent
	| InterceptPromptEvent;

// ─── Consumer io mocks ─────────────────────────────────────────────────────────

/**
 * The consumer-supplied I/O handlers the thread logic invokes. Structurally
 * mirrors embody's `IoMocks` so the adapter passes the consumer's mocks through
 * unchanged.
 *
 * A `console` mock is invoked as a SYNCHRONOUS side effect (the engine's
 * `onMessage` hook is synchronous — a returned Promise runs but is not awaited
 * before the program resumes). A dialog mock IS awaited (the engine's `onCall`
 * hook is async), so its answer may be asynchronous; the program's time budget
 * pauses meanwhile.
 */
type InterceptIoMocks = {
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly console?: Partial<
		Record<string, (...arguments_: unknown[]) => void | Promise<void>>
	>;
};

// ─── Settlement and handle (public facade) ─────────────────────────────────────

/** Options forwarded to the engine spec and the thread logic. */
type InterceptEvaluateOptions = {
	/** Time budget in seconds; the engine defaults to 5 when omitted. */
	readonly seconds?: number;
	/** The consumer's I/O mocks; absent members fall back to inert defaults. */
	readonly io?: InterceptIoMocks;
};

/**
 * The worker-authored stop, typed by this evaluator. Present on every
 * worker-side stop (a natural end and a throw alike). No `nodePath` (no
 * instrumentation) and no `phase`: the engine collapses construction and
 * execution into one `throw`, so neither the source location nor the
 * creation/execution phase is authorable worker-side (README § Vocabulary
 * pinning).
 */
type InterceptHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name (`ReferenceError`, `TypeError`, …); `''` on a natural end. */
	readonly errorName: string;
	readonly message: string;
};

/**
 * The engine-authored error, surfaced when the engine itself ended the run (a
 * timeout, a worker/environment failure, an unserviceable call, or a throwing
 * thread hook). Mirrors the engine's structured cause.
 */
type InterceptEngineError = {
	readonly cause: 'timeout' | 'worker-error' | 'call-error' | 'hook-error';
	readonly name: string;
	readonly message: string;
};

/** How the run ended (the engine's five generic outcomes, surfaced as-is). */
type InterceptOutcome =
	| 'completed'
	| 'errored'
	| 'cancelled'
	| 'failed'
	| 'timed-out';

/**
 * How the run ended plus its carried data. `halt` is present on worker-side
 * stops (completed and errored); `engineError` only when the engine ended the
 * run; `failReason` only on a consumer `fail(reason)`.
 */
type InterceptSettlement = {
	readonly outcome: InterceptOutcome;
	readonly halt: InterceptHalt | null;
	readonly engineError?: InterceptEngineError;
	readonly failReason?: unknown;
	readonly durationMs: number;
};

/** What `result` resolves with: every streamed event, then how the run ended. */
type InterceptEvaluateResult = {
	readonly events: ReadonlyArray<InterceptEvent>;
	readonly settlement: InterceptSettlement;
};

/**
 * The evaluator's primary handle: a thin typed facade over the engine handle.
 * Fully lazy (nothing runs until the first pull or `result` access); breaking
 * out of a `for await` is equivalent to `cancel()`; `fail(reason)` is the
 * structured consumer stop.
 */
type InterceptEvaluateHandle = AsyncIterable<InterceptEvent> & {
	readonly result: Promise<InterceptEvaluateResult>;
	readonly cancel: () => void;
	readonly fail: (reason?: unknown) => void;
};

/**
 * The evaluator's primary export: runnable code in, typed handle out. Assumes a
 * pre-admitted (runnable JEJ) string — the JEJ admission gate and the embody
 * _not-runnable_ shape are the adapter's concern (README § Bounded context).
 */
type InterceptEvaluate = (
	code: string,
	options?: InterceptEvaluateOptions,
) => InterceptEvaluateHandle;

// ─── Seam 1: the worker→thread message ─────────────────────────────────────────

/**
 * What the worker emits and the thread maps to a public event. The worker
 * authors the COMPLETE event (step, and — for a dialog — the answered
 * `returnValue`), so the thread logic's mapping stays a pure narrowing; the
 * message is therefore the clone-safe wire form of an {@link InterceptEvent}.
 * The thread narrows the engine's opaque `unknown` to this and yields it BY
 * REFERENCE (the engine freezes the item at yield); a message that fails the
 * narrowing is dropped.
 *
 * On a `console` message the thread ALSO invokes the consumer's `console` mock
 * as a side effect (the mapping's one impurity — see README § thread logic,
 * io-bound). A dialog message carries no side effect: its mock was already
 * invoked during the dialog call (seam 2).
 */
type InterceptMessage = InterceptEvent;

// ─── Seam 2: the dialog call-request ───────────────────────────────────────────

/**
 * What the worker's synchronous `call` carries for a dialog round-trip: which
 * dialog, and the call's raw arguments. The thread's `onCall` reads `name` to
 * pick the consumer mock and `arguments_` to build its parameters (message,
 * and the optional `prompt` default), awaits the mock, and returns the answer
 * as the engine's `CallResponse` (`string | boolean | null | undefined`) — the
 * set of answers the mocks produce.
 */
type InterceptCallRequest = {
	readonly name: 'alert' | 'confirm' | 'prompt';
	readonly arguments_: ReadonlyArray<unknown>;
};

export type {
	StandardConsoleMethod,
	InterceptConsoleEvent,
	InterceptAlertEvent,
	InterceptConfirmEvent,
	InterceptPromptEvent,
	InterceptEvent,
	InterceptIoMocks,
	InterceptEvaluateOptions,
	InterceptHalt,
	InterceptEngineError,
	InterceptOutcome,
	InterceptSettlement,
	InterceptEvaluateResult,
	InterceptEvaluateHandle,
	InterceptEvaluate,
	InterceptMessage,
	InterceptCallRequest,
};
