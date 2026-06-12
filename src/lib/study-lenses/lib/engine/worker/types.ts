/**
 * @file Engine-internal message-protocol types: the typed views over
 * the shared buffer, the postMessage envelopes exchanged between the
 * thread-side transport and the worker-side bootstrap, and the
 * transport contract `evaluate` consumes. Consumers never touch
 * these — the public contract lives in `../types.ts`.
 *
 * Emits and call requests ride postMessage (FIFO, preserved order);
 * only the call response rides the shared-memory slot.
 */

import type { CallResponse, HaltKind } from '../types.js';

/** Typed views over the shared buffer — layout in `./protocol.ts`. */
type BufferViews = {
	readonly control: Int32Array;
	readonly payload: Uint8Array;
};

// ─── Thread → worker envelopes ────────────────────────────────────────────────

/** Delivers shared memory and the consumer's config before execution. */
type SetupMessage = {
	readonly kind: 'setup';
	readonly sharedBuffer: SharedArrayBuffer;
	readonly workerConfig: unknown;
};

/** Delivers the program and its strict-mode preference; starts the run. */
type ExecuteMessage = {
	readonly kind: 'execute';
	readonly code: string;
	readonly strict: boolean;
};

type ToWorkerMessage = SetupMessage | ExecuteMessage;

// ─── Worker → thread envelopes ────────────────────────────────────────────────

/** Posted once at module load — the ready handshake. */
type ReadyMessage = {
	readonly kind: 'ready';
};

/** An `api.emit` payload — opaque, clone-safe. */
type EmittedMessage = {
	readonly kind: 'message';
	readonly message: unknown;
};

/** An `api.call` request — the worker blocks until the response slot fills. */
type CallRequestMessage = {
	readonly kind: 'call';
	readonly request: unknown;
};

/**
 * The worker-side stop payload, authored by the consumer's
 * `serializeHalt` (or the engine default), posted exactly once. The
 * `haltKind` rides the envelope structurally — the payload is opaque,
 * and classification (completed vs errored) never reads it.
 */
type HaltMessage = {
	readonly kind: 'halt';
	readonly haltKind: HaltKind;
	readonly payload: unknown;
};

/**
 * A structured worker-side failure (consumer setup failure, throwing
 * halt serializer) — settles as the worker-error termination cause.
 */
type FailureMessage = {
	readonly kind: 'failure';
	readonly name: string;
	readonly message: string;
};

type FromWorkerMessage =
	| ReadyMessage
	| EmittedMessage
	| CallRequestMessage
	| HaltMessage
	| FailureMessage;

// ─── Transport contract ───────────────────────────────────────────────────────

/** What a transport needs to start one run. */
type TransportInit = {
	readonly code: string;
	readonly workerUrl: URL;
	readonly workerConfig: unknown;
	readonly strict: boolean;
};

/**
 * What the pump receives: every from-worker envelope except `ready`
 * (the handshake is the transport's own concern). FIFO; halt or
 * failure is delivered at most once, last.
 */
type TransportEvent =
	| EmittedMessage
	| CallRequestMessage
	| HaltMessage
	| FailureMessage;

/**
 * The engine-internal seam between `evaluate` and a worker. The real
 * implementation (worker/transport.ts) spawns a module worker over
 * postMessage + shared memory; the engine-shipped fake substitutes a
 * same-thread double. Environment failures (shared memory
 * unavailable, worker construction failure) surface as `failure`
 * events through `next()`, never as throws.
 */
type Transport = {
	/** Spawns the sandbox, completes the handshake, delivers setup + code. */
	readonly start: (init: TransportInit) => Promise<void>;
	/** Resolves with the next worker event in post order. */
	readonly next: () => Promise<TransportEvent>;
	/** Whether an emission is awaiting thread-side disposal (timer consult). */
	readonly hasPendingEvent: () => boolean;
	/** Releases the worker's pause after an emission is disposed of. */
	readonly resume: () => void;
	/** Writes one call response back over the shared slot. */
	readonly respond: (response: CallResponse) => void;
	/** Teardown-without-resume: kills the sandbox, paused or not. */
	readonly terminate: () => void;
};

/** One transport per run; invoked only at run start (laziness stays above). */
type CreateTransport = () => Transport;

// ─── Exports ──────────────────────────────────────────────────────────────────

export type {
	BufferViews,
	CallRequestMessage,
	CreateTransport,
	EmittedMessage,
	ExecuteMessage,
	FailureMessage,
	FromWorkerMessage,
	HaltMessage,
	ReadyMessage,
	SetupMessage,
	ToWorkerMessage,
	Transport,
	TransportEvent,
	TransportInit,
};
