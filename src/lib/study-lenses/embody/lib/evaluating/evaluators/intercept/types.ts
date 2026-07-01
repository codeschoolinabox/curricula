/**
 * @file The public contract of the JEJ intercept evaluator, plus the four
 * cross-increment seams the pipeline is built against.
 *
 * The vocabulary is pinned in README.md § Vocabulary pinning, with the old
 * intercept engine (and its guard-loops sibling) as the behavior oracle
 * (README § Bounded context). This evaluator produces its OWN typed
 * streamed-event union and settlement; the embody adapter mapping (to
 * `EmitNMEvent` / `ErrorNMEvent` / `RunInstance` / `EndReport`) is out of
 * scope.
 *
 * Four seams are pinned here so the increments do not reverse-engineer each
 * other:
 *   1. the worker→thread message (what the worker emits, what the thread maps);
 *   2. the io call-request (what the worker's `call` carries, what the
 *      thread's call hook reads before answering);
 *   3. the worker config (the clone-safe data delivered at setup — the
 *      iteration limit);
 *   4. the instrumentation helper protocol (the spliced calls the instrumenter
 *      emits and the worker logic implements).
 *
 * This module imports nothing: the evaluator is self-contained, and `unknown`
 * argument arrays plus locally-mirrored io/location shapes keep it decoupled
 * from both the engine and embody. `InterceptIoMocks` and
 * `InterceptSourceLocation` deliberately mirror embody's `IoMocks` and
 * `SourceLocation` structurally so the adapter passes data straight through —
 * a structural, not nominal, coupling.
 */

// ─── Source attribution ────────────────────────────────────────────────────────

/** A position in the learner's source. Line is 1-indexed, column 0-indexed. */
type InterceptSourcePosition = {
	readonly line: number;
	readonly column: number;
};

/**
 * The span of the io call (or throw site) an event is attributed to, stamped
 * by the instrumenter at splice time — never looked up in an AST index.
 * Structurally mirrors embody's `SourceLocation`. Line numbers are the
 * learner's own: the instrumenter is line-preserving.
 */
type InterceptSourceLocation = {
	readonly start: InterceptSourcePosition;
	readonly end: InterceptSourcePosition;
};

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
 * (1-indexed, assigned worker-side). `loc` is the io call's stamped source
 * span — `null` only when the call fired outside any loc wrap (defensive;
 * unreachable for instrumented learner code). No `nodePath`: an evaluator
 * never observes the interior (README § Bounded context).
 */
type InterceptEventBase = {
	readonly step: number;
	readonly loc: InterceptSourceLocation | null;
};

/**
 * A `console.<method>(…)` call. The consumer's console mock was AWAITED during
 * this event's io round-trip (the program held until it settled); nothing
 * returns to the program (`console` yields `undefined`). `args` have passed
 * the clone-safe args pass — an argument the worker boundary cannot
 * structured-clone rides as its `String(…)` form.
 */
type InterceptConsoleEvent = InterceptEventBase & {
	readonly event: 'console';
	/** Open `string`; the {@link StandardConsoleMethod} names, faithfully. */
	readonly method: string;
	readonly args: ReadonlyArray<unknown>;
};

/** An `alert(…)` io round-trip. Returns `undefined` to the program. */
type InterceptAlertEvent = InterceptEventBase & {
	readonly event: 'alert';
	readonly args: ReadonlyArray<unknown>;
};

/** A `confirm(…)` io round-trip. `returnValue` is the consumer's answer. */
type InterceptConfirmEvent = InterceptEventBase & {
	readonly event: 'confirm';
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue: boolean;
};

/** A `prompt(…)` io round-trip. `returnValue` is the consumer's answer. */
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
 * The consumer-supplied I/O handlers the thread logic invokes during the call
 * half of each io round-trip. Structurally mirrors embody's `IoMocks` so the
 * adapter passes the consumer's mocks through unchanged.
 *
 * EVERY mock is awaited — console mocks included (embody's `IoMocks` contract;
 * the oracle awaited console mocks before resuming the worker). The program
 * holds until the mock settles and its time budget pauses meanwhile — the
 * pause that lets a quiz or an animation ride each io moment. An omitted
 * console mock is a no-op; an omitted dialog mock falls back to the inert
 * native default (`alert` → `undefined`, `confirm` → `false`, `prompt` →
 * `null`).
 *
 * A THROWING (or rejecting) mock is an engine-made `call-error` stop: the run
 * ends `errored` with no halt and no event for that call. (Deliberate
 * deviation from the oracle, which surfaced a terminal in-stream
 * InternalError event instead.) Consumer mocks should not throw.
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

/** Options forwarded to the engine spec, the instrumenter, and the thread logic. */
type InterceptEvaluateOptions = {
	/** Time budget in seconds; the engine defaults to 5 when omitted. */
	readonly seconds?: number;
	/**
	 * Max iterations PER LOOP ENTRY before the iteration guard's marked throw
	 * (surfacing downstream as `limit-exceeded`) — each fresh entry into a
	 * loop restarts its count (oracle semantics; never a run total). Omitted →
	 * no cap; the guard still counts (the halt's `iterationCount` is always
	 * real).
	 */
	readonly iterations?: number;
	/** The consumer's I/O mocks; absent members fall back to inert defaults. */
	readonly io?: InterceptIoMocks;
};

/**
 * The worker-authored stop, typed by this evaluator. Present on every
 * worker-side stop (a natural end and a throw alike). `loc` is the stamped
 * throw span: the call site for a throw that propagated through a loc wrap,
 * the LOOP's own span for the iteration guard's throw, and `null` on a
 * natural end or an unstamped throw (a statement-level throw outside any
 * wrapped call — the oracle's `Error.stack` fallback is deliberately not
 * reproduced; no milestone consumer reads a throw's loc). No
 * creation/execution `phase`: the engine collapses construction and execution
 * into one `throw`, so the phase is not authorable worker-side (README
 * § Vocabulary pinning).
 */
type InterceptHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name (`ReferenceError`, `TypeError`, …); `''` on a natural end. */
	readonly errorName: string;
	readonly message: string;
	readonly loc: InterceptSourceLocation | null;
	/** `true` iff the throw was the iteration guard's marked RangeError. */
	readonly iterationLimit: boolean;
	/**
	 * The never-reset run TOTAL of loop iterations — carried on EVERY halt
	 * (natural ends too). Distinct from the per-loop-entry counter the limit
	 * is checked against (seam 4).
	 */
	readonly iterationCount: number;
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
 * The instrumenter's boundary throw on unparseable input — the evaluator's
 * only synchronous throw, reachable only through misuse (the adapter
 * pre-gates JEJ admission). `name` is the discriminant a caller may branch
 * on; the `message` carries the parse failure.
 */
type InterceptInstrumentError = Error & {
	readonly name: 'InterceptInstrumentError';
};

/**
 * The evaluator's primary export: runnable code in, typed handle out. Assumes a
 * pre-admitted (runnable JEJ) string — the JEJ admission gate and the embody
 * _not-runnable_ shape are the adapter's concern (README § Bounded context).
 * The instrumenter throws an {@link InterceptInstrumentError} on unparseable
 * input (reachable only through misuse; the adapter pre-gates).
 */
type InterceptEvaluate = (
	code: string,
	options?: InterceptEvaluateOptions,
) => InterceptEvaluateHandle;

// ─── Seam 1: the worker→thread message ─────────────────────────────────────────

/**
 * What the worker emits and the thread maps to a public event. The worker
 * authors the COMPLETE event (step, loc, and — for a dialog — the answered
 * `returnValue`), so the thread logic's mapping is a PURE narrowing (the
 * consumer's mocks were already awaited during the call half of the round-trip
 * — seam 2); the message is therefore the clone-safe wire form of an
 * {@link InterceptEvent}. The thread narrows the engine's opaque `unknown` to
 * this and yields it BY REFERENCE (the engine freezes the item at yield); a
 * message that fails the narrowing is dropped.
 */
type InterceptMessage = InterceptEvent;

// ─── Seam 2: the io call-request ───────────────────────────────────────────────

/**
 * What the worker's synchronous `call` carries for one io round-trip: which io
 * kind, the console method when applicable, and the call's raw arguments. The
 * thread's call hook picks the consumer mock (console → `io.console[method]`,
 * no-op when absent; dialog → the dialog mock, inert default when absent),
 * AWAITS it, and returns the answer as the engine's `CallResponse`
 * (`string | boolean | null | undefined`) — `undefined` for every console
 * call.
 */
type InterceptCallRequest =
	| {
			readonly name: 'console';
			readonly method: string;
			readonly arguments_: ReadonlyArray<unknown>;
	  }
	| {
			readonly name: 'alert' | 'confirm' | 'prompt';
			readonly arguments_: ReadonlyArray<unknown>;
	  };

// ─── Seam 3: the worker config ─────────────────────────────────────────────────

/**
 * The clone-safe data the evaluator delivers to the worker logic at setup (the
 * engine spec's `workerConfig`). `iterationLimit` is the consumer's
 * `iterations` option; absent → the guard counts but never throws.
 */
type InterceptWorkerConfig = {
	readonly iterationLimit?: number;
};

// ─── Seam 4: the instrumentation helper protocol ───────────────────────────────

/**
 * The helpers the instrumenter splices calls against and the worker logic
 * implements as injected globals. Pinned so the instrumenter and the worker
 * setup do not reverse-engineer each other:
 *
 * - `__$il(loopIndex, locString)` — the iteration guard: spliced as a
 *   statement at the top of each guarded loop's BLOCK body
 *   (`__$il(n, 'L:C:L:C');`), with the counter reset `__$ir(n);` spliced
 *   after the loop (do-while: after the trailing `while(cond);`). The
 *   counters live in the worker logic's closure, so the reset must be a call
 *   too — the oracle's raw `loopN = 0;` splice against emitted `var` globals
 *   is not reproducible under injected parameters. The guarded set is the
 *   oracle's: `while` / classic `for` / `do-while` / `for-of` with a braced
 *   body; `for-in` and brace-less bodies are NOT guarded (a brace-less
 *   runaway loop is caught by the time budget only). The helper increments
 *   TWO counters: that loop's PER-ENTRY counter — the one checked against the
 *   configured limit, reset after the loop so each fresh entry restarts the
 *   count (oracle semantics: the limit is per loop entry, never a run total)
 *   — and the never-reset run-total `iterationCount` carried on every halt.
 *   On exceed it throws the MARKED RangeError, pre-stamped with `locString`
 *   (the LOOP's own span, encoded at splice time) so a limit halt is always
 *   attributed to its loop.
 * - `__$ir(loopIndex)` — the guard's reset: spliced as a statement after the
 *   loop (`__$ir(n);`) so re-entering the loop restarts its per-entry count.
 *   Resets ONLY that loop's per-entry counter — never the run-total
 *   `iterationCount`.
 * - `__$lc(locString, thunk)` — the loc stamp: spliced as a same-line wrap
 *   around each `CallExpression` — and ONLY `CallExpression`s, the oracle's
 *   exact node set (`NewExpression` is not wrapped; `super()` and class
 *   constructs are outside admissible JEJ) — as
 *   `__$lc('L:C:L:C', () => <call>)`, where `locString` encodes start/end
 *   line:column of the original call. Pushes the decoded loc onto the
 *   current-loc stack, invokes the thunk, stamps the loc onto any error
 *   propagating through (for halt attribution), and restores the stack in
 *   `finally`.
 *
 * The names ride the engine's injected `new Function` parameters (the
 * delivery channel); the collision guard is the NAMING — `__$il` / `__$lc`
 * sit outside the JEJ (camelCase) identifier surface, so admissible learner
 * code cannot reference or shadow them.
 */
type InterceptHelperProtocol = {
	readonly __$il: (loopIndex: number, locString: string) => void;
	readonly __$ir: (loopIndex: number) => void;
	readonly __$lc: <T>(locString: string, thunk: () => T) => T;
};

export type {
	StandardConsoleMethod,
	InterceptSourcePosition,
	InterceptSourceLocation,
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
	InterceptInstrumentError,
	InterceptEvaluate,
	InterceptMessage,
	InterceptCallRequest,
	InterceptWorkerConfig,
	InterceptHelperProtocol,
};
