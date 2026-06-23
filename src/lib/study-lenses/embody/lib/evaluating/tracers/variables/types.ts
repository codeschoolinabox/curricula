/**
 * @file The public contract of the JEJ variables tracer, plus the four
 * cross-increment seams the pipeline is built against.
 *
 * The vocabulary is pinned in README.md § Vocabulary pinning, with
 * notional-machine.md as the authority. This tier produces its OWN typed
 * event union; the embody adapter mapping is out of scope (README § Bounded
 * context). The trace/syntax and trace/semantics tracers are inspiration, not
 * a contract this file conforms to.
 *
 * Four seams are pinned here so the increments do not reverse-engineer each
 * other:
 *   1. the worker→thread message (what the worker emits, what the thread maps);
 *   2. the scope table (the clone-safe static projection the worker consumes);
 *   3. the `__$vr` helper protocol (the calls instrumentation emits and the
 *      worker implements);
 *   4. the abrupt-completion flag protocol (how scope-pop learns its reason).
 *
 * This module imports nothing: the tier is self-contained, and string-typed
 * node paths and `unknown` values keep it decoupled from the engine and embody.
 */

// ─── Source attribution ───────────────────────────────────────────────────────

/**
 * A dot-delimited node path rooted at the Program node (e.g.
 * `$.body.0.declarations.0.init`). The same canonical format embody uses, kept
 * as a local string alias so this tier depends on no other module's types.
 */
type NodePath = string;

// ─── Value snapshots ───────────────────────────────────────────────────────────

/**
 * A value the worker boundary cannot structured-clone — a function bound to a
 * variable (`let f = prompt`), a realm object — rendered as a tagged
 * placeholder so the emit never crashes the run. Clone-safe values (string,
 * number, boolean, null, undefined, bigint, Date, RegExp) ride as themselves,
 * never wrapped. There is deliberately no `ValueRepresentation` tagging layer
 * in MVP: JEJ values are overwhelmingly primitives.
 */
type OpaqueValue = {
	readonly opaqueValue: true;
	/** `typeof` the original value (e.g. `'function'`). */
	readonly typeOf: string;
};

/**
 * The value carried on a lifecycle event: a structured-clone-safe value as
 * itself, or an {@link OpaqueValue} placeholder. Typed `unknown` because JEJ
 * values are dynamic and cross an opaque worker boundary.
 */
type ValueSnapshot = unknown;

// ─── Scope and binding vocabulary ──────────────────────────────────────────────

/**
 * The shape of a scope. `script` and `block` are borrowed from the existing
 * tracers; `for-of` is a genuine per-iteration NM scope; `for` is this tier's
 * synthesized loop-head scope for `for (let i …)`. (The package scope analysis
 * names the top scope `program`; this tier renames it `script` to match the
 * NM.)
 */
type ScopeKind = 'script' | 'block' | 'for' | 'for-of';

/**
 * Why control left a scope, authored from the abrupt flag. Mirrors the NM's
 * five reasons; `'limit'` is structurally present but never produced in MVP
 * (this tier owns no instrumentation limit — README § Bounded context).
 */
type ScopePopReason = 'normal' | 'break' | 'continue' | 'error' | 'limit';

type BindingKind = 'let' | 'const';

/** Access-time visibility of a binding on a scope-pop payload. */
type BindingStatus = 'tdz' | 'initialized';

/** A binding as it enters a scope: declared into TDZ, not yet initialized. */
type DeclaredVariable = {
	readonly name: string;
	readonly kind: BindingKind;
};

/** A binding as a scope is cleaned out. `value` is present iff initialized. */
type FinalVariable = {
	readonly name: string;
	readonly kind: BindingKind;
	readonly status: BindingStatus;
	readonly value?: ValueSnapshot;
};

/** The assignment operators JEJ admits (README pinning table). */
type AssignOperator =
	| '='
	| '+='
	| '-='
	| '*='
	| '/='
	| '%='
	| '**='
	| '&='
	| '|='
	| '^='
	| '<<='
	| '>>='
	| '>>>='
	| '??='
	| '||='
	| '&&=';

type IncrementOperator = '++' | '--';

/** Prefix returns the new value; postfix returns the old (README pinning). */
type IncrementForm = 'prefix' | 'postfix';

// ─── The lifecycle event union (public) ────────────────────────────────────────

/**
 * Fields every lifecycle event carries. `step` is the monotonic emission
 * order (assigned worker-side); `nodePath` attributes the event to source;
 * `scopeInstanceId` identifies the runtime scope occurrence (a loop body
 * re-enters the same static scope once per iteration).
 *
 * On scope events (`scope-push` / `scope-pop`) `scopeInstanceId` is that
 * scope's own instance. On binding events (`initialize` / `read` / `assign` /
 * `increment`) it is the instance of the scope that DECLARES the named binding
 * (its home scope), not the innermost live scope — so a binding's `initialize`
 * and every later read/assign/increment of it carry one id, giving a stable
 * per-binding-life key. The two readings differ only when an outer binding is
 * touched from an inner scope.
 */
type VariablesEventBase = {
	readonly step: number;
	readonly nodePath: NodePath;
	readonly scopeInstanceId: number;
};

/**
 * A scope is entered. Carries the declared-variable burst, folding the NM's
 * `scope:push` + per-binding `declare` into one event (every variable in
 * implicit TDZ).
 */
type ScopePushEvent = VariablesEventBase & {
	readonly event: 'scope-push';
	readonly scopeKind: ScopeKind;
	readonly variables: ReadonlyArray<DeclaredVariable>;
};

/** A scope is left. `reason` is authored from the abrupt flag (seam 4). */
type ScopePopEvent = VariablesEventBase & {
	readonly event: 'scope-pop';
	readonly scopeKind: ScopeKind;
	readonly reason: ScopePopReason;
	readonly variables: ReadonlyArray<FinalVariable>;
};

/**
 * A binding receives its first value. `explicit` is `true` for `let x = 5`,
 * `false` for `let x;` (value `undefined`).
 */
type InitializeEvent = VariablesEventBase & {
	readonly event: 'initialize';
	readonly name: string;
	readonly value: ValueSnapshot;
	readonly explicit: boolean;
};

/** A binding's value is read in a standalone read position. */
type ReadEvent = VariablesEventBase & {
	readonly event: 'read';
	readonly name: string;
	readonly value: ValueSnapshot;
};

/**
 * A binding's value is replaced via an `AssignmentExpression`. `wrote` is
 * `false` only when a logical assign (`??=` / `||=` / `&&=`) short-circuits —
 * derived from the operator and prior value, never from comparing values;
 * `nextValue` is absent when `wrote` is `false`.
 */
type AssignEvent = VariablesEventBase & {
	readonly event: 'assign';
	readonly name: string;
	readonly operator: AssignOperator;
	readonly priorValue: ValueSnapshot;
	readonly nextValue?: ValueSnapshot;
	readonly wrote: boolean;
};

/**
 * A binding is stepped by an `UpdateExpression`. `priorValue` is the uncoerced
 * old value; `returnedValue` is the coerced value the expression yields (old
 * for postfix, new for prefix); `nextValue` is the stored result.
 */
type IncrementEvent = VariablesEventBase & {
	readonly event: 'increment';
	readonly name: string;
	readonly operator: IncrementOperator;
	readonly form: IncrementForm;
	readonly priorValue: ValueSnapshot;
	readonly nextValue: ValueSnapshot;
	readonly returnedValue: ValueSnapshot;
};

/** The flat lifecycle-event union this tier streams. */
type VariablesTraceEvent =
	| ScopePushEvent
	| ScopePopEvent
	| InitializeEvent
	| ReadEvent
	| AssignEvent
	| IncrementEvent;

// ─── Settlement and handle (public facade) ─────────────────────────────────────

/** Options forwarded to the engine spec. */
type TraceVariablesOptions = {
	/** Time budget in seconds; the engine defaults to 5 when omitted. */
	readonly seconds?: number;
};

/**
 * The worker-authored stop, typed by this tier. Present on every worker-side
 * stop (a natural end and a throw alike). `nodePath` is the stamped attribution
 * — the exact node where a TDZ read, const reassignment, or other throw
 * occurred — and is `null` on a natural end or an unstamped throw (e.g. an
 * undeclared-identifier `ReferenceError`, which reaches the worker unwrapped).
 */
type VariablesHalt = {
	/** `true` on a natural end (no throw). */
	readonly natural: boolean;
	/** The thrown error's name (`ReferenceError`, `TypeError`, …); `''` on a natural end. */
	readonly errorName: string;
	readonly message: string;
	readonly nodePath: NodePath | null;
};

/**
 * The engine-authored error, surfaced when the engine itself ended the run
 * (a timeout or a worker failure). Mirrors the engine's structured cause.
 */
type VariablesEngineError = {
	readonly cause: 'timeout' | 'worker-error' | 'call-error' | 'hook-error';
	readonly name: string;
	readonly message: string;
};

/** How the run ended (the engine's five generic outcomes, surfaced as-is). */
type VariablesOutcome =
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
type VariablesSettlement = {
	readonly outcome: VariablesOutcome;
	readonly halt: VariablesHalt | null;
	readonly engineError?: VariablesEngineError;
	readonly failReason?: unknown;
	readonly durationMs: number;
};

/** What `result` resolves with: every event, then how the run ended. */
type VariablesTraceResult = {
	readonly events: ReadonlyArray<VariablesTraceEvent>;
	readonly settlement: VariablesSettlement;
};

/**
 * The tier's primary handle: a thin typed facade over the engine handle. Fully
 * lazy (nothing runs until the first pull or `result` access); breaking out of
 * a `for await` is equivalent to `cancel()`; `fail(reason)` is the structured
 * consumer stop the prediction-quiz UX needs.
 */
type VariablesTraceHandle = AsyncIterable<VariablesTraceEvent> & {
	readonly result: Promise<VariablesTraceResult>;
	readonly cancel: () => void;
	readonly fail: (reason?: unknown) => void;
};

/** The tier's primary export: code in, typed handle out. */
type TraceVariables = (
	code: string,
	options?: TraceVariablesOptions,
) => VariablesTraceHandle;

// ─── Seam 1: the worker→thread message ─────────────────────────────────────────

/**
 * What the worker emits and the thread maps to a public event. The worker
 * authors the COMPLETE event (step, scopeInstanceId, value snapshots) so the
 * thread logic stays pure and stateless; the message is therefore the
 * clone-safe wire form of a {@link VariablesTraceEvent}. The thread narrows the
 * engine's opaque `unknown` to this, freezes it, and yields; a message that
 * fails the narrowing is dropped.
 */
type VariablesMessage = VariablesTraceEvent;

// ─── Seam 2: the scope table ───────────────────────────────────────────────────

/**
 * One scope's static facts: its kind and the bindings it declares, in source
 * order (the order of the declare burst on its `scope-push`).
 */
type ScopeTableEntry = {
	readonly scopeKind: ScopeKind;
	readonly variables: ReadonlyArray<DeclaredVariable>;
};

/**
 * The static, clone-safe scope projection delivered to the worker as the engine
 * spec's `workerConfig`. Keyed by scope `nodePath`; plain data only (no `Map`s
 * — `Object.freeze` does not freeze a Map and a Map does not structured-clone
 * to the same shape). Built once before instrumentation, re-homed from the
 * package scope analysis (README § Bounded context — for-init declarations are
 * lifted into synthesized for-scopes; sibling `for (let i …)` loops do not
 * collide).
 */
type ScopeTable = Readonly<Record<NodePath, ScopeTableEntry>>;

// ─── Seam 3: the `__$vr` helper protocol ───────────────────────────────────────

/**
 * The worker-injected helper namespace, addressed as the global `__$vr`. The
 * instrumentation transform (increment 2) emits calls to these members; the
 * worker logic (increment 3) implements them. Pinned here so neither
 * reverse-engineers the other.
 *
 * @remarks Value-bearing helpers take **thunks**, not eager values, so a TDZ or
 * const throw fires at the spec-correct moment INSIDE the helper, where the
 * node path can be stamped onto the error before it propagates to
 * `serializeHalt`. The per-assignment-form ordering is a pinned design
 * decision: simple `=` evaluates its RHS first (passed eagerly as `incoming`,
 * so it runs at the call site before `priorThunk` reads the target — matching
 * the spec's RHS-before-PutValue order); compound and logical forms read the
 * target first, then run the original expression inside `writerThunk` (no
 * `incoming`). Increment 2 fixes the splice strings that realize this ordering;
 * the member set, the signatures, and the ordering are the stable seam.
 */
type VariablesHelpers = {
	/** Scope push: emit the declared-variable burst for `scopePath` (TDZ). */
	readonly open: (scopePath: NodePath) => void;
	/** Scope pop: emit the cleaned-out variables with the current abrupt reason. */
	readonly close: (scopePath: NodePath) => void;
	/**
	 * Mark how control is about to leave. Spliced immediately before a
	 * break/continue (with `'break'` / `'continue'`); the scope wrap's own
	 * `catch` also calls it with `'error'` before rethrowing. The parameter is
	 * therefore the full {@link AbruptReason} (seam 4), not just the two
	 * abrupt-statement reasons.
	 */
	readonly abrupt: (reason: AbruptReason) => void;
	/** Clear a stale abrupt flag after a loop statement. */
	readonly landed: () => void;
	/** Declaration initializer: record `value` for `name`, emit `initialize`. */
	readonly initialize: (
		nodePath: NodePath,
		name: string,
		value: ValueSnapshot,
		explicit: boolean,
	) => ValueSnapshot;
	/** Standalone read: run `thunk`, emit `read`, return its value; stamp on throw. */
	readonly read: (
		nodePath: NodePath,
		name: string,
		thunk: () => ValueSnapshot,
	) => ValueSnapshot;
	/** Assignment: read the prior value, perform the write, emit `assign`. */
	readonly assign: (
		nodePath: NodePath,
		name: string,
		operator: AssignOperator,
		priorThunk: () => ValueSnapshot,
		writerThunk: (incoming: ValueSnapshot) => ValueSnapshot,
		incoming?: ValueSnapshot,
	) => ValueSnapshot;
	/** Update expression: read the prior value, perform the write, emit `increment`. */
	readonly increment: (
		nodePath: NodePath,
		name: string,
		operator: IncrementOperator,
		form: IncrementForm,
		priorThunk: () => ValueSnapshot,
		writerThunk: () => ValueSnapshot,
	) => ValueSnapshot;
};

// ─── Seam 4: the abrupt-completion flag protocol ───────────────────────────────

/**
 * The non-normal reasons control can leave a scope, held by the worker-side
 * abrupt flag (a clear flag means `'normal'`).
 *
 * The protocol (pinned here, enforced by the worker logic and the
 * instrumentation):
 *   - SET to `'break'` / `'continue'` by `__$vr.abrupt(...)` spliced
 *     immediately before the corresponding statement; SET to `'error'` by a
 *     `catch` that the scope wrap installs, which rethrows.
 *   - CLEARED whenever normal evaluation resumes: by every value-bearing helper
 *     (`read` / `initialize` / `assign` / `increment`), by every scope `open`,
 *     and by `__$vr.landed()` spliced after a loop statement (to kill a flag
 *     left set by a final-iteration break/continue).
 *   - READ by `close` to author the `scope-pop` `reason`. Closes never clear
 *     the flag: a single break unwinds several scopes, all of which must report
 *     `'break'`.
 */
type AbruptReason = 'break' | 'continue' | 'error';

// ─── Instrumentation boundary error ────────────────────────────────────────────

/**
 * Why the instrumentation transform rejected an otherwise-JEJ-valid program.
 * These constructs pass the JEJ gate but cannot be faithfully spliced, so the
 * transform throws at the boundary instead of mistracing them (README §
 * Bounded context). A labeled break/continue is covered by `'labeled-statement'`
 * — it cannot appear without an enclosing labeled statement.
 */
type InstrumentBoundaryReason =
	| 'labeled-statement'
	| 'expression-target-for-of';

/**
 * The typed boundary error the instrumentation transform throws (and the
 * facade re-throws on the validate path). A real thrown `Error` — so it carries
 * a stack and is `instanceof Error` — augmented with a discriminant tag and the
 * {@link InstrumentBoundaryReason}, so callers can identify it structurally
 * without parsing the message (the same tag idiom as {@link OpaqueValue}).
 */
type InstrumentBoundaryError = Error & {
	readonly instrumentBoundary: true;
	readonly reason: InstrumentBoundaryReason;
};

// ─── Exports ───────────────────────────────────────────────────────────────────

export type {
	// source + values
	NodePath,
	OpaqueValue,
	ValueSnapshot,
	// scope + binding vocabulary
	ScopeKind,
	ScopePopReason,
	BindingKind,
	BindingStatus,
	DeclaredVariable,
	FinalVariable,
	AssignOperator,
	IncrementOperator,
	IncrementForm,
	// event union
	VariablesEventBase,
	ScopePushEvent,
	ScopePopEvent,
	InitializeEvent,
	ReadEvent,
	AssignEvent,
	IncrementEvent,
	VariablesTraceEvent,
	// facade
	TraceVariablesOptions,
	VariablesHalt,
	VariablesEngineError,
	VariablesOutcome,
	VariablesSettlement,
	VariablesTraceResult,
	VariablesTraceHandle,
	TraceVariables,
	// seams
	VariablesMessage,
	ScopeTableEntry,
	ScopeTable,
	VariablesHelpers,
	AbruptReason,
	// instrumentation boundary error
	InstrumentBoundaryReason,
	InstrumentBoundaryError,
};
