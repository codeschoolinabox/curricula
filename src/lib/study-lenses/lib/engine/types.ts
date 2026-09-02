/**
 * @file The public contract of the generic sandboxed streaming evaluator.
 *
 * Everything here is GENERIC: items, messages, and payloads are `unknown` at
 * this contract — no type parameters. Consumers (the evaluators region)
 * narrow at their own layer. The engine never reads a payload's
 * shape; its only payload constraint is structured-clone safety.
 *
 * This module imports nothing, and pins only what consumers touch. The
 * engine depends on no region of this package — importability, not
 * import-freedom, is the load-bearing property — and carries exactly one
 * external dependency, acorn, imported thread-side for the creation gate
 * and never shipped into a worker chunk. Engine-internal machinery (the
 * worker message protocol, the shared-memory layout) lives in `worker/`,
 * not here.
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
	 * Constructs THIS run's worker. MUST be authored as ONE syntactically
	 * adjacent expression in the CONSUMER's module, and MUST keep
	 * `{ type: 'module' }`:
	 *
	 *   () => new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' })
	 *
	 * The factory loads a thin per-consumer worker entry (a few lines wiring
	 * the engine's bootstrap to this consumer's worker logic). Two obligations
	 * ride it, and they are different in kind:
	 * (1) ADJACENCY, unconditionally — webpack's static worker detection emits
	 *     a real worker chunk only when `new Worker(new URL(...))` is one
	 *     expression; splitting the URL from `new Worker`, or hiding it behind
	 *     a helper, regresses to a raw-`.ts` asset that crashes
	 *     (`worker-error`).
	 * (2) WORKER TYPE, PAIRED with `execution` — omitting `{ type: 'module' }`
	 *     under a toolchain that honors the option yields a classic worker
	 *     whose ESM `import`s fail at load (also `worker-error`). Behind the
	 *     imperative: the entry imports the bootstrap, so the worker must be
	 *     able to resolve those imports — either it IS a module worker (what
	 *     Vite and the vitest browser tier produce) or a bundler has already
	 *     inlined them into a classic chunk (what webpack does — it strips
	 *     `{ type: 'module' }` and emits every worker chunk classic).
	 *     `execution: 'script'` additionally needs `importScripts`, which only
	 *     a classic worker can call; a module worker exposes the name and
	 *     throws on the call, so no `typeof` guard detects the mismatch and the
	 *     script path probes it at setup instead.
	 * Neither is type-enforceable (`() => Worker` cannot encode the options),
	 * and a branded wrapper to enforce them would BE the forbidden re-splitting
	 * helper — so this comment and README § Public API ARE the guard. The
	 * pairing rests on a ~90%-certainty measurement of the client build; the
	 * real engine's worker has not been executed inside a production page.
	 * Dynamic module delivery stays unsupported; the URL is a static literal
	 * (bundlers stay static).
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
	 *
	 * Honored on the `'function'` path ALONE. `'module'` is always strict by
	 * the language's own rule, and on `'script'` this is an IGNORED INPUT —
	 * the engine prepends nothing, so a script is sloppy unless its own first
	 * line says otherwise, and both values behave identically with no signal.
	 * Left flat rather than made unrepresentable by a discriminated union
	 * (human ruling 2026-08-31, HR-25): the union is noisier for every
	 * consumer that spreads a spec. Forced strictness is therefore one of the
	 * reasons to choose `'function'` over `'script'`.
	 */
	readonly strict?: boolean;
	/**
	 * Which of three paths the worker runs the code on. Default
	 * `'function'`, deliberately: it is what every future consumer naming no
	 * path is posed by, and flipping a default silently re-poses all of them
	 * at once.
	 *
	 * - `'function'` — the code becomes a `new Function` body under the
	 *   `strict` preference, globals arriving as the function's parameters;
	 *   its natural end is synchronous. A SIMULATION of a script, not a
	 *   script: top-level `var` is a wrapper local, a top-level `return` is
	 *   legal, and a syntax error names the wrapper's own brace.
	 * - `'module'` — delivered and run as an ES module (always strict);
	 *   globals install on the worker's `globalThis` (a module takes no
	 *   parameters), and the natural end is asynchronous — it fires when the
	 *   module-evaluation promise settles, and work scheduled beyond it never
	 *   runs.
	 * - `'script'` — delivered and run as a genuine Script Record via
	 *   `importScripts` on a blob URL; globals install on `globalThis` (a
	 *   script takes no parameters either) and the natural end is
	 *   synchronous. Top-level `var` reaches `globalThis`, top-level `this`
	 *   IS `globalThis`, there is no `arguments` binding, and a hashbang
	 *   runs. It is the one value whose validity depends on the consumer's
	 *   BUILD TOOLCHAIN: only a classic worker can call `importScripts`, so
	 *   it runs under webpack and not under Vite dev or the vitest browser
	 *   project, whose workers are module workers.
	 *
	 * An evaluation that throws or rejects reaches `serializeHalt` as
	 * `kind: 'throw'` on every path. `'module'` and `'script'` are parsed
	 * thread-side before any spawn — see `HaltPhase`.
	 */
	readonly execution?: ExecutionPath;
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

/**
 * Which of three paths the worker runs the code on. Deliberately NOT
 * `ExecutionAxis` — that is the evaluators region's name for its own,
 * narrower type, and the same discipline keeps `EngineSettlement` apart
 * from an evaluator kind's `Settlement`. Also not a parse goal: a
 * consumer may pose script-goal facts on the `'function'` path, and the
 * engine will not object.
 */
type ExecutionPath = 'function' | 'module' | 'script';

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
 * Not an evaluator's own stream or handle type — an evaluator wraps this
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
 * tracer's limit classification, an evaluator kind's settlement arms) are
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
 * `Settlement`: an evaluator kind owns a settlement of its own — the arms
 * an evaluator maps these five outcomes onto — and an evaluator imports
 * both. How many arms, under which names, and whether that type is even
 * called `Settlement` is the kind's business, not this contract's.
 */
type EngineSettlement = {
	readonly outcome: SettlementOutcome;
	/**
	 * The program's stop payload — present on EVERY worker-side stop:
	 * completed (natural end) AND errored-by-throw. Absent on main-thread
	 * terminations (cancel, fail, timeout, worker crash, call error) with
	 * ONE exception: a creation-gate refusal carries a halt the ENGINE
	 * authored on the thread, for a program that never reached a worker.
	 * `haltOrigin` tells the two apart; the payload's shape never should.
	 * Typed `unknown` because a consumer-authored payload is opaque here;
	 * where `haltOrigin` is `'engine'` the shape is `EngineHalt`.
	 */
	readonly halt?: unknown;
	/**
	 * WHICH SIDE authored `halt` — present exactly when `halt` is, so its
	 * absence never needs interpreting. `'worker'` for every worker-side
	 * stop, whether the consumer's `serializeHalt` wrote it or the engine's
	 * worker-side default did; `'engine'` for the one creation-gate stop,
	 * authored on the thread because there is no worker to author it in.
	 *
	 * This is what a consumer that SUPPLIED a `serializeHalt` reads to know
	 * whether the payload is its own: `'worker'` means its hook ran,
	 * `'engine'` means the gate refused before any worker existed and the
	 * payload is an `EngineHalt`. (A consumer that omits `serializeHalt`
	 * receives `EngineHalt` on every path and knows so statically.) The
	 * discrimination is structural — classification never inspects a
	 * payload's shape (human ruling 2026-08-31, HR-25).
	 */
	readonly haltOrigin?: 'worker' | 'engine';
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
 * code; on the `'module'` and `'script'` paths they are installed on the
 * worker's `globalThis`, because neither a module nor a script can receive
 * parameters. Keys MUST be valid JavaScript identifiers so the code can
 * reference them; the bootstrap rejects invalid keys at setup on EVERY path,
 * settling the run as errored (worker-error), never throwing. Collision
 * avoidance is consumer-owned — and on `'script'` a collision is visible to
 * the program in a way it is not elsewhere: a top-level `var` of the same name
 * overwrites the global property, and a top-level `let` shadows it.
 */
type WorkerGlobals = Readonly<Record<string, unknown>>;

/**
 * Why the worker stopped on its own. 'throw' covers every thrown value,
 * including instrumentation-owned limit throws — limit classification is
 * consumer-owned inside `serializeHalt`; the engine has no 'limit' kind.
 */
type HaltKind = 'natural-end' | 'throw';

/**
 * Where a `'throw'` stop's error arose: `'creation'` — the program failed
 * before it ran; `'evaluation'` — it failed while running. The split is
 * structural, never the error's type, but WHICH structure decides it
 * depends on the path.
 *
 * - `'function'` — which try/catch caught: `new Function` construction
 *   versus the body. Unchanged.
 * - `'module'` and `'script'` — the creation gate, an acorn parse that
 *   runs THREAD-SIDE before any worker exists. A `'creation'` stop on
 *   these paths therefore never reaches `serializeHalt`; the engine
 *   authors it (see `EngineSettlement.haltOrigin`).
 *
 * Gating both goals rather than only the new one was a CHOICE (human
 * rulings 2026-08-26, HR-23). The narrow fork — gate `'script'` alone,
 * leave `'module'` byte-identical — was posed and declined, and two costs
 * were accepted knowingly. A module PARSE failure that shipped as
 * `'evaluation'` now reports `'creation'`. And the `'module'` path's
 * accepted grammar NARROWS to acorn's, which rejects some constructs a
 * host accepts (decorators, measured at both 2024 and `'latest'`) —
 * deliberate, since learners are not guaranteed to run on V8.
 *
 * **An undecided gate defers** (human ruling 2026-09-01, HR-26). Only a
 * parse REFUSAL produces `'creation'` here. A parser that fails without
 * reaching a verdict — acorn exhausting its own call stack on deeply
 * nested input, which instrumented source reaches long before a learner's
 * does — decides nothing about the program, so the gate abstains and the
 * run proceeds to the worker exactly as though the path were ungated. The
 * gate's failure mode is FALSE REFUSAL, and refusing on the parser's own
 * limit would be that failure. So: the gate never throws at its caller,
 * and a program it could not judge is never reported as the learner's
 * syntax error.
 *
 * Three residuals survive the change, all named rather than covered. A
 * link-stage failure (an unresolvable import specifier) parses fine and
 * still rides `'evaluation'`, because the one-stage dynamic import gives
 * no structural link/run boundary. A `'script'` program that passes the
 * gate can still fail as the script is instantiated (`let NaN = 1`,
 * which depends on the live global object and no static parser can see).
 * And an ABSTAINED program's genuine syntax error is reported by the
 * host's own parser, from the worker, so it too arrives labelled
 * `'evaluation'`. All three are mislabelled phases, never false refusals
 * — and the third costs the least, because the learner then reads the
 * host's own words about their own program, inside the budget.
 */
type HaltPhase = 'creation' | 'evaluation';

/**
 * The engine's OWN stop payload — the shape `EngineSettlement.halt` takes
 * whenever the engine authored it rather than the consumer. Consumer
 * payloads stay opaque (`unknown`) because the engine must never read
 * them; this one is the engine's own data, and no genericity argument
 * covers it.
 *
 * Two sites author it and they share this core rather than three separate
 * literals drifting apart: the worker-side default (when `serializeHalt`
 * is absent) and the creation gate. Only the gate carries a position, and
 * it is acorn's verbatim — `line` 1-based, `column` 0-based — so a
 * consumer drawing a caret converts once, at its own edge. Both members
 * are optional because a parser can fail without one: see `HaltPhase` for
 * what the gate does when it cannot decide.
 *
 * A natural end authors `{ name: 'natural-end', message: '' }` and carries
 * no phase.
 */
type EngineHalt = {
	readonly name: string;
	readonly message: string;
	readonly phase?: HaltPhase;
	readonly line?: number;
	readonly column?: number;
};

/**
 * The consumer's worker-side halt author, invoked by the bootstrap on
 * EVERY worker-side stop — `rawError` is undefined for 'natural-end'.
 * Returns the clone-safe halt payload; worker-side authoring preserves
 * attribution that lives only in the worker (a stamped node path) and
 * classifies non-Error throws. A throw here is a worker crash (the
 * worker-error termination cause). `phase` is present exactly on
 * `'throw'` halts — the discriminant the consumer's stop record carries
 * forward; a natural end has no phase.
 */
type SerializeHalt = (
	kind: HaltKind,
	rawError: unknown,
	phase?: HaltPhase,
) => unknown;

/** What worker logic hands back to the bootstrap at setup. */
type WorkerSetupResult = {
	readonly globals: WorkerGlobals;
	/**
	 * Absent → the engine authors the payload itself, as an `EngineHalt`:
	 * `{ name, message, phase }` drawn from the raw error on throws (human
	 * ruling 2026-08-25), and `{ name: 'natural-end', message: '' }` on
	 * natural ends. `EngineHalt` is the one place that literal is written.
	 */
	readonly serializeHalt?: SerializeHalt;
};

/**
 * The consumer-authored worker-side entry hook: the bootstrap hands it the
 * api and the spec's workerConfig. On the `'function'` execution path,
 * parameter injection via the returned globals is the shadowing channel, not
 * the only one — setup may also install worker-global state on the worker's
 * globalThis (how lookup-resolved instrumentation hooks register). On the
 * `'module'` and `'script'` paths the returned globals are themselves
 * installed on globalThis, so the two channels coincide (neither takes
 * parameters).
 */
type WorkerSetup = (api: WorkerApi, workerConfig: unknown) => WorkerSetupResult;

// ─── Exports ──────────────────────────────────────────────────────────────────

export type {
	CallResponse,
	EngineError,
	EngineHalt,
	EngineHandle,
	EngineResult,
	EngineSettlement,
	Evaluate,
	EvaluateSpec,
	ExecutionPath,
	HaltKind,
	HaltPhase,
	SerializeHalt,
	SettlementOutcome,
	ThreadLogic,
	WorkerApi,
	WorkerGlobals,
	WorkerSetup,
	WorkerSetupResult,
};
