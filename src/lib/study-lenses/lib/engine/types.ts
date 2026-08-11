/**
 * @file The public contract of the generic sandboxed streaming evaluator.
 *
 * Everything here is GENERIC: items, messages, and payloads are `unknown` at
 * this contract — no type parameters. Consumers (the evaluators region)
 * narrow at their own layer. The engine never reads a payload's
 * shape; its only payload constraint is structured-clone safety.
 *
 * This module imports nothing: the engine is dependency-free, and this file
 * pins only what consumers touch. Engine-internal machinery (the worker
 * message protocol, the shared-memory layout) lives in `worker/`, not here.
 *
 * Vocabulary is pinned in README.md § Glossary; outcome carriage is pinned
 * in README.md § How a run ends.
 */

// ─── Factory contract ─────────────────────────────────────────────────────────

/** The engine's entry point: spec in, lazy handle out. */
type Evaluate = (spec: EvaluateSpec) => EngineHandle;

/** The whole coupling surface between a consumer and the engine. */
type EvaluateSpec = {
	/** The program, as an opaque string — instrumented or not. */
	readonly code: string;
	/**
	 * Constructs THIS run's module worker. MUST be authored as ONE
	 * syntactically adjacent expression in the CONSUMER's module:
	 *
	 *   () => new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' })
	 *
	 * The factory loads a thin per-consumer worker entry (a few lines wiring
	 * the engine's bootstrap to this consumer's worker logic). The consumer
	 * owns construction — not the engine — for two load-bearing reasons:
	 * (1) ADJACENCY — webpack's static worker detection emits a real worker
	 *     chunk only when `new Worker(new URL(...))` is one expression;
	 *     splitting the URL from `new Worker`, or hiding it behind a helper,
	 *     regresses to a raw-`.ts` asset that crashes (`worker-error`).
	 * (2) MODULE TYPE — omitting `{ type: 'module' }` yields a classic worker
	 *     whose ESM `import`s fail at load (also `worker-error`).
	 * Neither is type-enforceable (`() => Worker` cannot encode the options),
	 * and a branded wrapper to enforce them would BE the forbidden re-splitting
	 * helper — so the guard is doc-only by necessity. Dynamic module delivery
	 * stays unsupported; the URL is a static literal (bundlers stay static).
	 */
	readonly workerFactory: () => Worker;
	/** Clone-safe data delivered verbatim to the worker logic at setup. */
	readonly workerConfig?: unknown;
	readonly threadLogic: ThreadLogic;
	/** Time budget in seconds — the only limit the engine owns. Default 5. */
	readonly seconds?: number;
	/**
	 * Run the code under a `"use strict"` prefix. Default true; consumers
	 * running sloppy-mode constructs (`with`) pass false.
	 */
	readonly strict?: boolean;
	/**
	 * How the worker executes the code. Default `'function'` — the code is
	 * wrapped in `new Function`, run under the `strict` preference, and its
	 * globals arrive as the function's parameters; its natural end is
	 * synchronous. `'module'` delivers and runs the code as an ES module
	 * (always strict — `strict` is moot); its globals are installed on the
	 * worker's `globalThis` (a module cannot receive parameters), and its
	 * natural end is asynchronous — the natural-end halt fires when the
	 * module-evaluation promise settles; work scheduled beyond it never
	 * runs. A module evaluation that rejects reaches `serializeHalt` as
	 * `kind: 'throw'`, exactly like a function-path throw.
	 */
	readonly execution?: 'function' | 'module';
	/**
	 * Charge the flat per-yield fee against the time budget. Default true;
	 * densely emitting consumers — an intercept evaluator, the tracers —
	 * pass false, because at one event per program step the fee alone
	 * exhausts a default budget while almost no real time has passed.
	 *
	 * `false` waives THE FEE ONLY. The budget still pauses for the whole
	 * yield-wait and for every serviced call, so a consumer that thinks
	 * between pulls is never charged for thinking; and the wall-clock
	 * budget still ends a genuinely long-running program. Loop safety
	 * under the waiver rests on the consumer's own iteration cap, which
	 * is what these consumers already carry.
	 */
	readonly yieldCharge?: boolean;
};

/** The consumer-authored thread-side hooks. */
type ThreadLogic = {
	/**
	 * Interprets one worker message. Returning `undefined` drops it — the
	 * worker resumes immediately; any other value is yielded as an item,
	 * frozen at yield, and the worker resumes on the next pull (the
	 * consumer's, or the engine's when draining). The undefined sentinel
	 * means a literal `undefined` item cannot be yielded — a deliberate
	 * tradeoff. A throw here ends the run with the hook-error termination
	 * cause.
	 */
	readonly onMessage: (message: unknown) => unknown;
	/**
	 * Services one synchronous worker round-trip. The engine awaits the
	 * returned value — sync and async logic both work — and the time budget
	 * pauses while it runs. If the worker calls while this hook is absent —
	 * or this hook throws — the run ends with the call-error termination
	 * cause.
	 */
	readonly onCall?: (request: unknown) => CallResponse | Promise<CallResponse>;
	/**
	 * Inspects an errored halt's worker-authored payload and returns the
	 * opaque refinement to ride the settlement (e.g. "this is an
	 * instrumentation-owned iteration limit"), or `undefined` for none —
	 * the `refinement` key is then omitted. A throw here is a hook-error:
	 * the halt stays on the settlement, the refinement is absent.
	 */
	readonly refineError?: (haltPayload: unknown) => unknown;
};

/**
 * The shared-memory response channel's value vocabulary. Richer data rides
 * JSON-in-string at the consumer's choice; the payload area is
 * bounds-checked at 8168 bytes and fails loudly on overflow.
 */
type CallResponse = string | boolean | null | undefined;

// ─── Handle ───────────────────────────────────────────────────────────────────

/**
 * Fully lazy: nothing runs until the first pull or `result` access; a
 * cancel or fail before that settles without spawning anything. Breaking
 * out of a `for await` loop is equivalent to `cancel()` — the early exit
 * routes through the termination machine and the run settles 'cancelled';
 * items already yielded remain valid.
 *
 * `result` always settles: when no consumer iterator claims the stream,
 * the engine drains on the consumer's behalf — engaged at the engine's
 * first on-behalf pull (an item ready, no iterator in existence), never at
 * property access. An iterator created before any engine pull owns the
 * stream (the engine then never pulls), so taking `result` early and then
 * iterating keeps full backpressure. The drain is the run's one consuming
 * iteration: iterating after settlement yields nothing (`result`'s items
 * array is the record); an iterator created after the engine's first pull
 * is unsupported — one stream, silently split. The one suspension: an
 * iterator created and then abandoned (whether or not it ever pulled)
 * holds the run; break or cancel is the exit.
 *
 * Not the evaluator kind's EvaluationStream — an evaluator wraps this
 * handle to implement its own.
 */
type EngineHandle = AsyncIterable<unknown> & {
	readonly result: Promise<EngineResult>;
	readonly cancel: () => void;
	readonly fail: (reason?: unknown) => void;
};

/** What `result` resolves with: every yielded item, then how the run ended. */
type EngineResult = {
	readonly items: ReadonlyArray<unknown>;
	readonly settlement: EngineSettlement;
};

// ─── Settlement ───────────────────────────────────────────────────────────────

/**
 * The engine's complete outcome vocabulary. Downstream vocabularies (a
 * tracer's limit classification, the evaluator kind's settlement arms) are
 * mappings applied by the layers that own them, never settled here.
 */
type SettlementOutcome =
	| 'completed'
	| 'errored'
	| 'cancelled'
	| 'failed'
	| 'timed-out';

/**
 * How the run ended. The engine freezes this object and the items array at
 * settlement but never deep-freezes consumer payload interiors (halt,
 * refinement, failReason) — downstream owners deep-freeze their own data
 * (e.g. an evaluator's own deep pass). Named `EngineSettlement`, never bare
 * `Settlement`: the evaluator kind owns a `Settlement` of its own — three
 * arms an evaluator maps these five outcomes onto — and an evaluator
 * imports both.
 */
type EngineSettlement = {
	readonly outcome: SettlementOutcome;
	/**
	 * Worker-authored stop payload — present on EVERY worker-side stop:
	 * completed (natural end) AND errored-by-throw. Absent on main-thread
	 * terminations (cancel, fail, timeout, worker crash, call error).
	 */
	readonly halt?: unknown;
	/** `refineError`'s annotation — present only on errored halts. */
	readonly refinement?: unknown;
	/**
	 * The payload passed to `fail(reason)`, by reference — present iff
	 * outcome is 'failed'. Not deep-frozen here; downstream owners freeze
	 * their own data.
	 */
	readonly failReason?: unknown;
	/**
	 * Engine-made — present iff the engine itself ended the run: timed-out,
	 * worker crash or environment failure, call error, hook error. Never
	 * consumer payload; consumer stops (cancelled, failed) carry no error.
	 * The one corner where halt and error coexist: a thread hook throwing
	 * during an errored halt's refinement.
	 */
	readonly error?: EngineError;
	/** Consumed budget in milliseconds. */
	readonly durationMs: number;
};

/**
 * The engine-authored error on engine-made terminations. The cause is the
 * structured discriminant — classification never string-matches `name` or
 * `message` (those are human-facing detail: which environment condition,
 * what the hook threw). This never carries or wraps a consumer payload.
 */
type EngineError = {
	/**
	 * - 'timeout' — the time budget exhausted.
	 * - 'worker-error' — crash, environment failure (shared memory
	 *   unavailable, worker construction failure), a throwing halt
	 *   serializer, a consumer setup failure, or an engine-internal defect
	 *   (a contract-violating value reaching runtime — settled loudly,
	 *   never hung, never thrown).
	 * - 'call-error' — a round-trip that could not be serviced (onCall
	 *   absent or throwing).
	 * - 'hook-error' — a throwing thread hook (onMessage, refineError).
	 */
	readonly cause: 'timeout' | 'worker-error' | 'call-error' | 'hook-error';
	readonly name: string;
	readonly message: string;
};

// ─── Worker-side contract ─────────────────────────────────────────────────────

/** The only powers worker logic gets. */
type WorkerApi = {
	/**
	 * Posts an opaque clone-safe message thread-ward; execution pauses
	 * until the thread disposes of it (drop or yield-and-pull).
	 */
	readonly emit: (message: unknown) => void;
	/**
	 * SYNCHRONOUS round-trip — blocks on shared memory until the thread's
	 * `onCall` response is written back. (The thread-side hook is async;
	 * this side is not.)
	 */
	readonly call: (request: unknown) => CallResponse;
};

/**
 * The returned globals' delivery depends on `EvaluateSpec.execution`: on the
 * `'function'` path they are injected as `new Function` parameters around the
 * code; on the `'module'` path they are installed on the worker's `globalThis`
 * (a module cannot receive function parameters). Keys MUST be valid JavaScript
 * identifiers so the code can reference them; the bootstrap rejects invalid
 * keys at setup on either path, settling the run as errored (worker-error),
 * never throwing. Collision avoidance is consumer-owned.
 */
type WorkerGlobals = Readonly<Record<string, unknown>>;

/**
 * Why the worker stopped on its own. 'throw' covers every thrown value,
 * including instrumentation-owned limit throws — limit classification is
 * consumer-owned inside `serializeHalt`; the engine has no 'limit' kind.
 */
type HaltKind = 'natural-end' | 'throw';

/**
 * The consumer's worker-side halt author, invoked by the bootstrap on
 * EVERY worker-side stop — `rawError` is undefined for 'natural-end'.
 * Returns the clone-safe halt payload; worker-side authoring preserves
 * attribution that lives only in the worker (a stamped node path) and
 * classifies non-Error throws. A throw here is a worker crash (the
 * worker-error termination cause).
 */
type SerializeHalt = (kind: HaltKind, rawError: unknown) => unknown;

/** What worker logic hands back to the bootstrap at setup. */
type WorkerSetupResult = {
	readonly globals: WorkerGlobals;
	/**
	 * Absent → the engine defaults the halt payload to { name, message } —
	 * drawn from the raw error on throws, and
	 * { name: 'natural-end', message: '' } on natural ends.
	 */
	readonly serializeHalt?: SerializeHalt;
};

/**
 * The consumer-authored worker-side entry hook: the bootstrap hands it the
 * api and the spec's workerConfig. On the `'function'` execution path,
 * parameter injection via the returned globals is the shadowing channel, not
 * the only one — setup may also install worker-global state on the worker's
 * globalThis (how lookup-resolved instrumentation hooks register). On the
 * `'module'` path the returned globals are themselves installed on globalThis
 * (a module takes no parameters).
 */
type WorkerSetup = (api: WorkerApi, workerConfig: unknown) => WorkerSetupResult;

// ─── Exports ──────────────────────────────────────────────────────────────────

export type {
	CallResponse,
	EngineError,
	EngineHandle,
	EngineResult,
	EngineSettlement,
	Evaluate,
	EvaluateSpec,
	HaltKind,
	SerializeHalt,
	SettlementOutcome,
	ThreadLogic,
	WorkerApi,
	WorkerGlobals,
	WorkerSetup,
	WorkerSetupResult,
};
