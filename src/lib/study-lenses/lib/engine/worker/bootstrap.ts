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

import type { HaltKind, SerializeHalt, WorkerSetup } from '../types.js';

import createBufferViews from './create-buffer-views.js';
import PROTOCOL from './protocol.js';
import readCallResponse from './read-call-response.js';
import type {
	BufferViews,
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
 * `execute`: injects the globals as `new Function` parameters around
 * the code (`"use strict"` prefix unless disabled), runs it, and posts
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
	globalThis.addEventListener('message', function handleMessage(event) {
		const message = event.data as ToWorkerMessage;
		if (message.kind === 'setup') {
			handleSetup(state, setup, message.sharedBuffer, message.workerConfig);
		} else {
			handleExecute(state, message.code, message.strict);
		}
	});

	post({ kind: 'ready' });
}

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
	const api = Object.freeze({
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
			post({
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
		post({
			kind: 'failure',
			name: 'EngineSetupError',
			message: `consumer setup threw: ${describeError(error)}`,
		});
	}
}

/** Runs the program and posts exactly one halt (or a failure). */
function handleExecute(state: RunState, code: string, strict: boolean): void {
	if (state.views === null || state.globals === null) {
		// NOTE: when the thread posts setup and execute back-to-back (the
		// normal pattern), a FAILED setup leaves this guard armed — the run
		// then produces TWO failure posts: the setup's and this one. The
		// thread-side transport settles on the first and discards the rest.
		post({
			kind: 'failure',
			name: 'EngineSetupError',
			message: 'execute received before setup completed',
		});
		return;
	}

	const { globals } = state;
	const names = Object.keys(globals);
	const values = names.map(function valueFor(name) {
		return globals[name];
	});
	const body = strict ? `"use strict";\n${code}` : code;

	try {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- running opaque consumer code in the sandbox IS this module's purpose
		const run = new Function(...names, body);
		// eslint-disable-next-line sonarjs/code-eval, @typescript-eslint/no-unsafe-call -- see above; the sandbox executes here
		run(...values);
	} catch (error) {
		postHalt(state, 'throw', error);
		return;
	}

	postHalt(state, NATURAL_END);
}

/** Authors and posts the halt; a throwing serializer posts `failure`. */
function postHalt(state: RunState, kind: HaltKind, rawError?: unknown): void {
	if (state.serializeHalt === null) {
		post({ kind: 'halt', payload: defaultHaltPayload(kind, rawError) });
		return;
	}

	try {
		post({ kind: 'halt', payload: state.serializeHalt(kind, rawError) });
	} catch (error) {
		post({
			kind: 'failure',
			name: 'EngineHaltError',
			message: `halt serializer threw: ${describeError(error)}`,
		});
	}
}

/** The engine-default halt author (README § two-sided contract). */
function defaultHaltPayload(kind: HaltKind, rawError: unknown): unknown {
	if (kind === NATURAL_END) {
		return { name: NATURAL_END, message: '' };
	}
	return {
		name: rawError instanceof Error ? rawError.name : 'Error',
		message: rawError instanceof Error ? rawError.message : String(rawError),
	};
}

/**
 * Pauses under the pause protocol, then posts. Ordering per DOCS.md
 * § Structural constraints: both flags armed BEFORE the message is
 * posted; then block until the thread releases the pause.
 */
function emitPausing(views: BufferViews, message: unknown): void {
	Atomics.store(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);
	Atomics.store(
		views.control,
		PROTOCOL.EVENT_READY_INDEX,
		PROTOCOL.EVENT_READY,
	);
	Atomics.notify(views.control, PROTOCOL.EVENT_READY_INDEX);

	post({ kind: 'message', message });

	// WHY the while loop: the spec allows spurious wakeups from
	// Atomics.wait; without it a spurious wake resumes the program
	// while the thread is still disposing of the message.
	while (
		Atomics.load(views.control, PROTOCOL.PAUSE_INDEX) === PROTOCOL.PAUSE_PAUSED
	) {
		Atomics.wait(views.control, PROTOCOL.PAUSE_INDEX, PROTOCOL.PAUSE_PAUSED);
	}
}

/** Posts the call request, blocks until RESPONDED, decodes the response. */
function callBlocking(views: BufferViews, request: unknown) {
	Atomics.store(views.control, PROTOCOL.CONTROL_INDEX, PROTOCOL.SIGNAL_WAITING);

	post({ kind: 'call', request });

	// WHY the while loop: spurious-wakeup guard, same as the pause wait.
	while (
		Atomics.load(views.control, PROTOCOL.CONTROL_INDEX) !==
		PROTOCOL.SIGNAL_RESPONDED
	) {
		Atomics.wait(
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
	return Object.keys(globals).find(function isInvalid(key) {
		if (!IDENTIFIER_RE.test(key)) {
			return true;
		}
		try {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- a parameter-name probe: the platform itself is the authority on reserved words
			new Function(key, '"use strict";');
			return false;
		} catch {
			return true;
		}
	});
}

function describeError(error: unknown): string {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}

function post(message: FromWorkerMessage): void {
	// WHY the cast: DOM types declare window.postMessage(message,
	// targetOrigin); the worker-scoped single-argument form needs it.
	(postMessage as unknown as (m: FromWorkerMessage) => void)(message);
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const NATURAL_END: HaltKind = 'natural-end';
