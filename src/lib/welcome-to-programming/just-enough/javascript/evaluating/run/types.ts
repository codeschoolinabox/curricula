/**
 * @file Worker message protocol types for the run action.
 *
 * Defines the two-step message protocol (setup → execute) between the
 * main thread and the execution worker, and the SharedArrayBuffer
 * layout for synchronous I/O (prompt/confirm/alert).
 */

import type { RunEvent } from '../shared/types.js';

// --- Messages: main → worker ---

/**
 * First message: delivers the SharedArrayBuffer so the worker can
 * set up typed array views and define trapped globals.
 */
type SetupMessage = {
	readonly type: 'setup';
	readonly sharedBuffer: SharedArrayBuffer;
};

/**
 * Second message: delivers the learner's source code for execution.
 *
 * @remarks Sent after setup so that trap definition code does not
 * affect learner code line numbers.
 */
type ExecuteMessage = {
	readonly type: 'execute';
	readonly code: string;
};

type WorkerInbound = SetupMessage | ExecuteMessage;

// --- Messages: worker → main ---

type WorkerOutbound = EventMessage | IoRequestMessage | CompleteMessage;

/**
 * Streamed as each trap fires. Allows the main thread to forward
 * events to the real console in real time.
 */
type EventMessage = {
	readonly type: 'event';
	readonly event: RunEvent;
};

/**
 * Worker is blocked on `Atomics.wait` — main thread must show the
 * native dialog and write the response to the SharedArrayBuffer.
 */
type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'confirm' | 'alert';
	readonly args: readonly unknown[];
	readonly line: number;
};

/**
 * Execution finished (normally or via caught error). The main thread
 * assembles the final event array from the streamed `EventMessage`s.
 */
type CompleteMessage = {
	readonly type: 'complete';
};

// --- SharedArrayBuffer layout ---
//
// Buffer constants (Int32Array indices and byte offsets) live in
// worker-protocol.ts as named constants — not a type, because they
// mix indexing semantics (Int32Array element indices vs byte offsets).
//
// See worker-protocol.ts for the layout documentation.

export type {
	WorkerInbound,
	WorkerOutbound,
	SetupMessage,
	ExecuteMessage,
	EventMessage,
	IoRequestMessage,
	CompleteMessage,
};
