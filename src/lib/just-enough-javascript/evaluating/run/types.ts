/**
 * @file Worker message protocol types for the run action.
 *
 * Defines the messages exchanged between the main thread and the
 * execution worker, and the SharedArrayBuffer layout for synchronous
 * I/O (prompt/confirm/alert).
 */

import type { RunEvent } from '../shared/types.js';

import type { AllowedConfig } from '../../verify-language-level/enforcing/enforce-level/types.js';

// --- Messages: main → worker ---

type WorkerInbound = {
	readonly type: 'execute';
	readonly code: string;
	readonly sharedBuffer: SharedArrayBuffer;
	readonly enforcementAllowed: AllowedConfig;
};

// --- Messages: worker → main ---

type WorkerOutbound = EventMessage | IoRequestMessage | CompleteMessage;

type EventMessage = {
	readonly type: 'event';
	readonly event: RunEvent;
};

type IoRequestMessage = {
	readonly type: 'io-request';
	readonly name: 'prompt' | 'confirm' | 'alert';
	readonly args: readonly unknown[];
	readonly line: number;
};

type CompleteMessage = {
	readonly type: 'complete';
	readonly events: readonly RunEvent[];
};

// --- SharedArrayBuffer layout ---

/**
 * Buffer layout for synchronous I/O between worker and main thread.
 *
 * Total size: 8192 bytes (8 KB).
 *
 * | Offset | Type    | Purpose                                          |
 * | ------ | ------- | ------------------------------------------------ |
 * | 0      | Int32   | Control signal: 0=idle, 1=waiting, 2=responded   |
 * | 4      | Int32   | Response type: 0=string, 1=boolean, 2=void       |
 * | 8      | Int32   | Null flag (for prompt): 0=has value, 1=null       |
 * | 12     | Int32   | String payload byte length                        |
 * | 16+    | Uint8[] | UTF-8 encoded string payload                      |
 */
type SharedBufferLayout = {
	readonly controlOffset: 0;
	readonly responseTypeOffset: 1;
	readonly nullFlagOffset: 2;
	readonly payloadLengthOffset: 3;
	readonly payloadByteOffset: 16;
	readonly totalBytes: 8192;
};

export type {
	WorkerInbound,
	WorkerOutbound,
	EventMessage,
	IoRequestMessage,
	CompleteMessage,
	SharedBufferLayout,
};
