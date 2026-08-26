/**
 * @file The engine-shipped reference test double: a same-thread
 * transport that runs the consumer's worker logic with NO worker and
 * NO shared memory, structured-cloning every payload so clone-safety
 * violations surface in cheap Node tests.
 *
 * Honestly scoped (README § Conformance testing): emits buffer FIFO
 * without blocking — pause economics are NOT simulated; calls are
 * serviced SYNCHRONOUSLY (a thenable onCall return is a loud failure);
 * the payload ceiling, Atomics blocking, and timer fidelity are
 * real-transport-only evidence. A green fake proves logic, never
 * transport fidelity. The execution axis is likewise real-only: the
 * fake runs the `'function'` path regardless of `init.execution` (it
 * cannot instantiate a genuine ES module same-thread), so module
 * conformance lives in tests/conformance/transport/, never here.
 *
 * (The reference fixture's mutateGlobalsAfterSetup directive is inert
 * here by construction: the fake's whole run is synchronous, so a
 * queued microtask can never precede the snapshot — the snapshot race
 * is bootstrap.browser territory.)
 *
 * The fake NEVER throws into the program (the engine does not
 * interfere with program execution): an unserviceable call queues the
 * call event and returns undefined — everything the program does
 * afterwards queues BEHIND that event, and the pump settles call-error
 * before reaching it, exactly like the real worker dying blocked.
 *
 * Setup and execution mirror the bootstrap's OBSERVABLE rules
 * (identifier validation, strict prefix, `new Function` injection,
 * halt authoring). The small logic duplication with bootstrap.ts is
 * self-policing: the agnostic conformance tier runs the same suite
 * against both transports, so observable drift fails the build.
 */

/* eslint-disable functional/immutable-data -- per-run fake-transport state record (queue, waiter, stopped); every write is in this file */

import type {
	CallResponse,
	HaltKind,
	HaltPhase,
	ThreadLogic,
	WorkerSetup,
} from '../types.js';
import type {
	CreateTransport,
	Transport,
	TransportEvent,
	TransportInit,
} from '../worker/types.js';

/**
 * Builds a CreateTransport whose runs execute `code` same-thread
 * against the given worker logic, servicing `api.call` synchronously
 * through the given thread logic's `onCall`.
 *
 * @remarks The runner passes the SAME threadLogic object here and in
 * the spec — the fake needs it because a synchronous `api.call` cannot
 * route through the pump's async dispatch mid-stack. A successful sync
 * call is serviced directly (request and response cloned); an absent
 * onCall queues the call event for the pump (which classifies
 * call-error like the real transport) and answers undefined; a
 * sync-THROWING onCall does the same — so the pump invokes the hook a
 * second time for classification (a documented double-invocation,
 * test-double territory); a thenable return queues a loud failure
 * naming the sync-only constraint. The spec's `workerFactory` is never
 * invoked (the fake runs same-thread; no worker is constructed).
 */
export default function createFakeTransport(
	workerSetup: WorkerSetup,
	threadLogic: ThreadLogic,
): CreateTransport {
	return function createTransport(): Transport {
		const state: FakeState = { queue: [], waiter: null, stopped: false };

		return Object.freeze({
			start(init: TransportInit): Promise<void> {
				runSameThread(state, workerSetup, threadLogic, init);
				return Promise.resolve();
			},
			next(): Promise<TransportEvent> {
				if (state.queue.length > 0) {
					return Promise.resolve(state.queue.shift() as TransportEvent);
				}
				return new Promise(function captureWaiter(resolve) {
					state.waiter = resolve;
				});
			},
			hasPendingEvent(): boolean {
				return state.queue.length > 0;
			},
			resume(): void {},
			respond(_response: CallResponse): void {},
			terminate(): void {
				state.stopped = true;
			},
		});
	};
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const NATURAL_END: HaltKind = 'natural-end';

type FakeState = {
	queue: TransportEvent[];
	waiter: ((event: TransportEvent) => void) | null;
	stopped: boolean;
};

/**
 * One whole run, executed eagerly: setup → validate → inject → run →
 * halt. Every event lands in the FIFO queue; the pump consumes them
 * one at a time afterwards — buffered, never blocking.
 */
function runSameThread(
	state: FakeState,
	workerSetup: WorkerSetup,
	threadLogic: ThreadLogic,
	init: TransportInit,
): void {
	let workerConfig: unknown;
	try {
		workerConfig = structuredClone(init.workerConfig);
	} catch (error) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineEnvironmentError',
			message: `worker config is not clone-safe: ${describeError(error)}`,
		});
		return;
	}

	const api = Object.freeze({
		emit(message: unknown): void {
			enqueue(state, {
				kind: 'message',
				message: structuredClone(message),
			});
		},
		call(request: unknown): CallResponse {
			return serviceCall(state, threadLogic, request);
		},
	});

	let setupResult;
	try {
		setupResult = workerSetup(api, workerConfig);
	} catch (error) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineSetupError',
			message: `consumer setup threw: ${describeError(error)}`,
		});
		return;
	}
	const invalidKey = findInvalidGlobalKey(setupResult.globals);
	if (invalidKey !== undefined) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineSetupError',
			message: `global key is not a valid identifier: "${invalidKey}"`,
		});
		return;
	}

	executeCode(state, setupResult, init);
}

/** Mirrors the bootstrap's execute path: inject, run, author the halt. */
function executeCode(
	state: FakeState,
	setupResult: ReturnType<WorkerSetup>,
	init: TransportInit,
): void {
	const names = Object.keys(setupResult.globals);
	const values = names.map(function valueFor(name) {
		return setupResult.globals[name];
	});
	const body = init.strict ? `"use strict";\n${init.code}` : init.code;

	// Mirrors the bootstrap's STRUCTURAL phase split — which try/catch
	// caught, never the error's type.
	let run: (...runArguments: readonly unknown[]) => unknown;
	try {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- the fake runs opaque consumer code same-thread; that IS its purpose
		run = new Function(...names, body) as (
			...runArguments: readonly unknown[]
		) => unknown;
	} catch (error) {
		postHalt(state, setupResult, 'throw', error, 'creation');
		return;
	}

	try {
		run(...values);
	} catch (error) {
		postHalt(state, setupResult, 'throw', error, 'evaluation');
		return;
	}

	postHalt(state, setupResult, NATURAL_END);
}

/**
 * Services one synchronous call. Direct service on success;
 * unserviceable calls queue the call event — the pump settles
 * call-error before anything the program does afterwards is observed.
 */
function serviceCall(
	state: FakeState,
	threadLogic: ThreadLogic,
	request: unknown,
): CallResponse {
	const clonedRequest = structuredClone(request);
	const { onCall } = threadLogic;
	if (onCall === undefined) {
		enqueue(state, { kind: 'call', request: clonedRequest });
		return undefined;
	}

	let response: CallResponse | Promise<CallResponse>;
	try {
		response = onCall(clonedRequest);
	} catch {
		enqueue(state, { kind: 'call', request: clonedRequest });
		return undefined;
	}

	if (isThenable(response)) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineFakeTransportError',
			message:
				'onCall returned a thenable; the fake services calls ' +
				'synchronously — async onCall is real-transport-only',
		});
		return undefined;
	}
	return structuredClone(response);
}

/** Mirrors the bootstrap's halt authoring, including the clone boundary. */
function postHalt(
	state: FakeState,
	setupResult: ReturnType<WorkerSetup>,
	haltKind: HaltKind,
	rawError?: unknown,
	phase?: HaltPhase,
): void {
	const { serializeHalt } = setupResult;
	if (serializeHalt === undefined) {
		enqueue(state, {
			kind: 'halt',
			haltKind,
			payload: defaultHaltPayload(haltKind, rawError, phase),
		});
		return;
	}

	try {
		enqueue(state, {
			kind: 'halt',
			haltKind,
			payload: structuredClone(serializeHalt(haltKind, rawError, phase)),
		});
	} catch (error) {
		enqueue(state, {
			kind: 'failure',
			name: 'EngineHaltError',
			message: `halt serializer threw: ${describeError(error)}`,
		});
	}
}

/** The engine-default halt author — mirrors the bootstrap's. */
function defaultHaltPayload(
	haltKind: HaltKind,
	rawError: unknown,
	phase?: HaltPhase,
): unknown {
	if (haltKind === NATURAL_END) {
		return { name: NATURAL_END, message: '' };
	}
	return {
		name: rawError instanceof Error ? rawError.name : 'Error',
		message: rawError instanceof Error ? rawError.message : String(rawError),
		phase,
	};
}

/**
 * Mirrors the bootstrap's identifier validation (ASCII shape + strict
 * parameter probe) — deliberately duplicated; the agnostic tier keeps
 * the two observably identical.
 */
function findInvalidGlobalKey(
	globals: Readonly<Record<string, unknown>>,
): string | undefined {
	return Object.keys(globals).find(function isInvalid(key) {
		if (!IDENTIFIER_RE.test(key)) {
			return true;
		}
		try {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- a parameter-name probe; the platform is the authority on reserved words
			new Function(key, '"use strict";');
			return false;
		} catch {
			return true;
		}
	});
}

function isThenable(value: unknown): value is Promise<CallResponse> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'then' in value &&
		typeof (value as { then: unknown }).then === 'function'
	);
}

function enqueue(state: FakeState, event: TransportEvent): void {
	if (state.stopped) {
		return;
	}
	if (state.waiter !== null) {
		const { waiter } = state;
		state.waiter = null;
		waiter(event);
		return;
	}
	state.queue.push(event);
}

function describeError(error: unknown): string {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}
