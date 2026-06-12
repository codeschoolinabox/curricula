/**
 * @file Engine-internal message-protocol types: the typed views over
 * the shared buffer and the postMessage envelopes exchanged between
 * the thread-side transport and the worker-side bootstrap. Consumers
 * never touch these — the public contract lives in `../types.ts`.
 *
 * Emits and call requests ride postMessage (FIFO, preserved order);
 * only the call response rides the shared-memory slot.
 */

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
 * `serializeHalt` (or the engine default), posted exactly once.
 */
type HaltMessage = {
	readonly kind: 'halt';
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

// ─── Exports ──────────────────────────────────────────────────────────────────

export type {
	BufferViews,
	CallRequestMessage,
	EmittedMessage,
	ExecuteMessage,
	FailureMessage,
	FromWorkerMessage,
	HaltMessage,
	ReadyMessage,
	SetupMessage,
	ToWorkerMessage,
};
