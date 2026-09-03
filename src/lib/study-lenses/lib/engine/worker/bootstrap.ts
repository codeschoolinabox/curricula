/**
 * @file The engine's worker-side module: receives setup/execute, hands
 * the api to consumer worker logic, injects the returned globals, runs
 * the code, posts the halt.
 *
 * Loaded by a thin per-consumer worker entry that calls
 * `bootstrap(workerSetup)` at module load — entries are entry points;
 * executing at load is their job. Posts `ready` immediately so the
 * thread can confirm the handshake before sending setup.
 *
 * This module runs in a DedicatedWorkerGlobalScope, but the repo's
 * tsconfig serves DOM types (Docusaurus site) — the worker-scoped
 * single-argument `postMessage` therefore rides one documented cast.
 * Run state lives in one record closed over by the message handler —
 * a worker module IS one run's disposable instance state; workers are
 * never reused.
 */

import type {
	HaltKind,
	HaltPhase,
	SerializeHalt,
	WorkerSetup,
} from '../types.js';

import createBufferViews from './create-buffer-views.js';
import PROTOCOL from './protocol.js';
import readCallResponse from './read-call-response.js';
import type {
	BufferViews,
	ExecuteMessage,
	FromWorkerMessage,
	ToWorkerMessage,
} from './types.js';

/**
 * Wires the consumer's worker logic into the engine's worker side:
 * registers the message handler and posts the ready handshake.
 *
 * @remarks On `setup`: creates buffer views, builds the worker api
 * (emit pauses under the pause protocol; call blocks on the shared
 * response slot), invokes the consumer's setup, and validates every
 * returned global key as a JavaScript identifier (ASCII form —
 * collision avoidance and naming are consumer-owned) — a consumer
 * failure here posts a structured `failure`, never throws. On
 * `execute`: runs the code via the path the execution axis selects —
 * the `'function'` path injects the globals as `new Function`
 * parameters (`"use strict"` prefix unless disabled) and ends
 * synchronously; the `'module'` path installs the globals on
 * `globalThis` and runs the code as a genuine ES module (always
 * strict) whose natural end is asynchronous. Either way it posts
 * exactly one `halt` authored by the consumer's `serializeHalt` (or
 * the engine default) — on natural end AND on throw. A throwing
 * serializer posts `failure` (worker crash). An `execute` arriving
 * before `setup` posts `failure`.
 */
export default function bootstrap(setup: WorkerSetup): void {
	const state: RunState = {
		views: null,
		globals: null,
		serializeHalt: null,
	};

	// eslint-disable-next-line sonarjs/post-message -- a dedicated worker's message source is its own spawning thread; there is no foreign origin
	GLOBAL_SCOPE.addEventListener('message', function handleMessage(event) {
		const message = event.data as ToWorkerMessage;
		if (message.kind === 'setup') {
			handleSetup(state, setup, message.sharedBuffer, message.workerConfig);
		} else {
			handleExecute(state, message);
		}
	});

	POST_MESSAGE({ kind: 'ready' });
}

// WHY at module load: a program runs in this realm and shares its global
// object, so a `postMessage` resolved after the program starts is whatever the
// program left behind. Bound here it is bound before the execute turn (DOCS.md
// § Capture order; the rule itself is README.md § Realms). Losing the receiver
// is safe — a detached postMessage reaches the thread from a
// DedicatedWorkerGlobalScope [measured: this suite's live probe rows].
// WHY the cast: DOM types declare window.postMessage(message, targetOrigin);
// the worker-scoped single-argument form needs it.
const POST_MESSAGE = postMessage as unknown as (
	message: FromWorkerMessage,
) => void;

// WHY at module load: same realm, same reason as POST_MESSAGE above — bound
// before the execute turn (DOCS.md § Capture order). WHY four members and not
// the namespace: `const ATOMICS = Atomics;` is defeated by a program's
// `Atomics.store = …`; a member capture is not (README.md § Realms). None of
// the four consults a receiver, so detaching them is safe.
const ATOMICS_STORE = Atomics.store;
const ATOMICS_LOAD = Atomics.load;
const ATOMICS_WAIT = Atomics.wait;
const ATOMICS_NOTIFY = Atomics.notify;

// WHY at module load: the module path builds its blob URL before importing the
// program and revokes it after. The create is safe by timing; the REVOKE is the
// exposed read — it runs in a `finally` on the far side of the program's turn
// (DOCS.md § Capture order), and a throw there replaces the pending return,
// costing the run its halt entirely. Members, not the URL namespace; neither
// consults a receiver.
// eslint-disable-next-line @typescript-eslint/unbound-method -- a WebIDL static takes no this-value. The rule fires here and not on Atomics only because its own SUPPORTED_GLOBALS allowlist carries Atomics and not URL; the TS declarations are the same shape. Binding would answer it but makes Function.prototype.bind a new residual, which Phase 0 declined
const CREATE_OBJECT_URL = URL.createObjectURL;
// eslint-disable-next-line @typescript-eslint/unbound-method -- same allowlist gap, same WebIDL reason; and this is the one of the two the null-URL row actually proves
const REVOKE_OBJECT_URL = URL.revokeObjectURL;

// Read once, before the program runs -- latched under the mechanical rule
// (README.md § Realms), not because any row can reach it.
const BLOB = Blob;

// WHY at module load: three reads sit after the program — two in the engine's
// own halt author, which runs on every stop, and one in describeError, which
// names what threw in a `failure` post. Latching fixes the BINDING, not the
// object: a program that redefines Error[Symbol.hasInstance] still reaches
// these reads, and that residual is named rather than closed (README.md § What
// the rule does not reach).
const ERROR = Error;
const STRING = String;

// WHY at module load: the module path installs the consumer's globals on the
// shared global object and freezes the api, both of which resolve Object
// members; the function path builds the runner with Function. Members for
// Object, never the namespace. WHY globalThis is the ONE object capture: the
// listener registration needs its receiver, and a bare addEventListener pulled
// off it would lose one — it is also the target defineProperty writes into.
const GLOBAL_SCOPE = globalThis;
const OBJECT_FREEZE = Object.freeze;
const OBJECT_KEYS = Object.keys;
const OBJECT_DEFINE_PROPERTY = Object.defineProperty;
const FUNCTION_CONSTRUCTOR = Function;

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const NATURAL_END: HaltKind = 'natural-end';

type RunState = {
	views: BufferViews | null;
	globals: Record<string, unknown> | null;
	serializeHalt: SerializeHalt | null;
};

/** Runs consumer setup against the api; consumer failures post `failure`. */
function handleSetup(
	state: RunState,
	setup: WorkerSetup,
	sharedBuffer: SharedArrayBuffer,
	workerConfig: unknown,
): void {
	const views = createBufferViews(sharedBuffer);
	const api = OBJECT_FREEZE({
		emit(message: unknown): void {
			emitPausing(views, message);
		},
		call(request: unknown) {
			return callBlocking(views, request);
		},
	});

	try {
		const result = setup(api, workerConfig);
		const invalidKey = findInvalidGlobalKey(result.globals);
		if (invalidKey !== undefined) {
			POST_MESSAGE({
				kind: 'failure',
				name: 'EngineSetupError',
				message: `global key is not a valid identifier: "${invalidKey}"`,
			});
			return;
		}
		// WHY the copy: validation just ran against these exact keys;
		// snapshotting makes it authoritative even if the consumer
		// mutates its record after setup returns. The run-state record
		// is the engine's declared mutable core (see @file).
		// eslint-disable-next-line functional/immutable-data -- run-state record
		state.views = views;
		// eslint-disable-next-line functional/immutable-data -- run-state record
		state.globals = { ...result.globals };
		// eslint-disable-next-line functional/immutable-data -- run-state record
		state.serializeHalt = result.serializeHalt ?? null;
	} catch (error) {
		POST_MESSAGE({
			kind: 'failure',
			name: 'EngineSetupError',
			message: `consumer setup threw: ${describeError(error)}`,
		});
	}
}

/** Guards the execute message once, then runs the selected path. */
function handleExecute(state: RunState, message: ExecuteMessage): void {
	if (state.views === null || state.globals === null) {
		// NOTE: when the thread posts setup and execute back-to-back (the
		// normal pattern), a FAILED setup leaves this guard armed — the run
		// then produces TWO failure posts: the setup's and this one. The
		// thread-side transport settles on the first and discards the rest.
		POST_MESSAGE({
			kind: 'failure',
			name: 'EngineSetupError',
			message: 'execute received before setup completed',
		});
		return;
	}

	if (message.execution === 'module') {
		void executeModule(state, state.globals, message.code);
		return;
	}
	executeFunction(state, state.globals, message.code, message.strict);
}

/** The `'function'` path: inject as parameters, run, author the halt. */
function executeFunction(
	state: RunState,
	globals: Record<string, unknown>,
	code: string,
	strict: boolean,
): void {
	const names = OBJECT_KEYS(globals);
	const values = names.map(function valueFor(name) {
		return globals[name];
	});
	const body = strict ? `"use strict";\n${code}` : code;

	// The phase split is STRUCTURAL — which try/catch caught, never the
	// error's type: a learner's runtime `throw new SyntaxError(...)` is
	// 'evaluation', and construction fails 'creation' under both strict
	// and sloppy bodies.
	let run: (...runArguments: readonly unknown[]) => unknown;
	try {
		// WHY no no-implied-eval directive: that rule matches on the callee's
		// NAME, so latching Function past it costs this site its static eval
		// guard. sonarjs/code-eval follows the alias and still fires.
		// eslint-disable-next-line sonarjs/code-eval -- running opaque consumer code in the sandbox IS this module's purpose
		run = new FUNCTION_CONSTRUCTOR(...names, body) as (
			...runArguments: readonly unknown[]
		) => unknown;
	} catch (error) {
		postHalt(state, 'throw', error, 'creation');
		return;
	}

	try {
		run(...values);
	} catch (error) {
		postHalt(state, 'throw', error, 'evaluation');
		return;
	}

	postHalt(state, NATURAL_END);
}

/**
 * The `'module'` path: globals install on `globalThis` (a module takes
 * no parameters), the code runs as a genuine ES module via a blob-URL
 * dynamic import, and the natural end is ASYNCHRONOUS — the halt posts
 * when the module-evaluation promise fulfills; a rejection reaches the
 * halt author as a throw, exactly like a function-path throw. `strict`
 * is inert here: modules are always strict.
 */
async function executeModule(
	state: RunState,
	globals: Record<string, unknown>,
	code: string,
): Promise<void> {
	for (const name of OBJECT_KEYS(globals)) {
		try {
			// WHY defineProperty, not bracket assignment: an own-property
			// write bypasses inherited accessor setters, so a global named
			// `__proto__` installs a real binding instead of repointing
			// globalThis's prototype. The keys are already identifier-valid.
			// The immutable-data directive that stood here is gone with the latch:
			// the rule only fires on a member-expression callee, and the capture is
			// a bare one. globalThis installation IS the module path's delivery
			// channel, which is why it was suppressed rather than avoided.
			OBJECT_DEFINE_PROPERTY(GLOBAL_SCOPE, name, {
				value: globals[name],
				writable: true,
				configurable: true,
				enumerable: true,
			});
		} catch (error) {
			// A key that is a valid identifier yet a non-configurable own
			// property of globalThis (`undefined`, `NaN`, `Infinity`) cannot
			// be redefined — a consumer setup failure. Settle loudly, the way
			// the function path's parameter shadowing never has to: the engine
			// never hangs and never throws.
			POST_MESSAGE({
				kind: 'failure',
				name: 'EngineSetupError',
				message: `global "${name}" cannot be installed on globalThis: ${describeError(error)}`,
			});
			return;
		}
	}

	const url = CREATE_OBJECT_URL(new BLOB([code], { type: 'text/javascript' }));
	try {
		await import(/* webpackIgnore: true */ /* @vite-ignore */ url);
	} catch (error) {
		// Phase is 'evaluation' for every module rejection that REACHES here.
		// The creation gate parses thread-side before any spawn, so a parse
		// failure it REFUSED settles as 'creation' without a worker and
		// never arrives at this catch. Two kinds still do: a genuine
		// run-time throw, and the residuals the gate cannot separate — a
		// link-stage failure (an unresolvable specifier parses fine and
		// fails at link), and a program the gate ABSTAINED on, whose real
		// syntax error the host reports here instead. Named at the
		// HaltPhase declaration.
		postHalt(state, 'throw', error, 'evaluation');
		return;
	} finally {
		REVOKE_OBJECT_URL(url);
	}

	postHalt(state, NATURAL_END);
}

/** Authors and posts the halt; a throwing serializer posts `failure`. */
function postHalt(
	state: RunState,
	kind: HaltKind,
	rawError?: unknown,
	phase?: HaltPhase,
): void {
	if (state.serializeHalt === null) {
		POST_MESSAGE({
			kind: 'halt',
			haltKind: kind,
			payload: defaultHaltPayload(kind, rawError, phase),
		});
		return;
	}

	try {
		POST_MESSAGE({
			kind: 'halt',
			haltKind: kind,
			payload: state.serializeHalt(kind, rawError, phase),
		});
	} catch (error) {
		POST_MESSAGE({
			kind: 'failure',
			name: 'EngineHaltError',
			message: `halt serializer threw: ${describeError(error)}`,
		});
	}
}

/** The engine-default halt author (README § two-sided contract). */
function defaultHaltPayload(
	kind: HaltKind,
	rawError: unknown,
	phase?: HaltPhase,
): unknown {
	if (kind === NATURAL_END) {
		return { name: NATURAL_END, message: '' };
	}
	return {
		name: rawError instanceof ERROR ? rawError.name : 'Error',
		message: rawError instanceof ERROR ? rawError.message : STRING(rawError),
		phase,
	};
}

/**
 * Pauses under the pause protocol, then posts. Ordering per DOCS.md
 * § Structural constraints: both flags armed BEFORE the message is
 * posted; then block until the thread releases the pause.
 */
function emitPausing(views: BufferViews, message: unknown): void {
	ATOMICS_STORE(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);
	ATOMICS_STORE(
		views.control,
		PROTOCOL.EVENT_READY_INDEX,
		PROTOCOL.EVENT_READY,
	);
	ATOMICS_NOTIFY(views.control, PROTOCOL.EVENT_READY_INDEX);

	POST_MESSAGE({ kind: 'message', message });

	// WHY the while loop: the spec allows spurious wakeups from
	// Atomics.wait; without it a spurious wake resumes the program
	// while the thread is still disposing of the message.
	while (
		ATOMICS_LOAD(views.control, PROTOCOL.PAUSE_INDEX) === PROTOCOL.PAUSE_PAUSED
	) {
		ATOMICS_WAIT(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);
	}
}

/** Posts the call request, blocks until RESPONDED, decodes the response. */
function callBlocking(views: BufferViews, request: unknown) {
	ATOMICS_STORE(views.control, PROTOCOL.CONTROL_INDEX, PROTOCOL.SIGNAL_WAITING);

	POST_MESSAGE({ kind: 'call', request });

	// WHY the while loop: spurious-wakeup guard, same as the pause wait.
	while (
		ATOMICS_LOAD(views.control, PROTOCOL.CONTROL_INDEX) !==
		PROTOCOL.SIGNAL_RESPONDED
	) {
		ATOMICS_WAIT(
			views.control,
			PROTOCOL.CONTROL_INDEX,
			PROTOCOL.SIGNAL_WAITING,
		);
	}

	return readCallResponse(views);
}

/**
 * Returns the first invalid global key, or undefined when all are
 * valid. ASCII identifier shape first (rejects separators that a
 * parameter-list probe would silently accept, e.g. "a,b"), then a
 * strict-mode parameter probe (rejects reserved words).
 */
function findInvalidGlobalKey(
	globals: Readonly<Record<string, unknown>>,
): string | undefined {
	return OBJECT_KEYS(globals).find(function isInvalid(key) {
		if (!IDENTIFIER_RE.test(key)) {
			return true;
		}
		try {
			// eslint-disable-next-line sonarjs/code-eval -- a parameter-name probe: the platform itself is the authority on reserved words; no-implied-eval no longer sees this site, see executeFunction
			new FUNCTION_CONSTRUCTOR(key, '"use strict";');
			return false;
		} catch {
			return true;
		}
	});
}

function describeError(error: unknown): string {
	return error instanceof ERROR
		? `${error.name}: ${error.message}`
		: STRING(error);
}
