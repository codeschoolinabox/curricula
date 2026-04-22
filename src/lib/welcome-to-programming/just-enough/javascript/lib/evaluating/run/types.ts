/**
 * @file Worker message protocol types and IO mock surface for the run action.
 *
 * Defines the two-step message protocol (setup → execute) between the
 * main thread and the execution worker, the SharedArrayBuffer layout
 * for synchronous I/O (prompt/confirm/alert), and the consumer-facing
 * IO mock types (IoMocks, IoConsole, RunOptions).
 */

import type { ConsoleMethod, RunEvent } from '../shared/types.js';

// ─── IO mock surface ──────────────────────────────────────────

/**
 * Per-method console mock surface. All slots optional — omitted slots
 * fall back to the Native IO wrapper (`window.console.*`).
 *
 * Each callback is async-compatible. Sync returns work; async returns
 * are awaited before learner execution continues (the worker remains
 * blocked until the Promise resolves).
 *
 * If a callback throws (sync or async rejection), the error is caught
 * and surfaced as an ErrorEvent with `name: 'InternalError'`.
 */
type IoConsole = {
	readonly [K in ConsoleMethod]?: (
		...args: readonly unknown[]
	) => void | Promise<void>;
};

/**
 * Consumer-provided IO mock overrides for a single run invocation.
 *
 * Each slot is independently overridable. Omitted slots fall back to
 * the Native IO wrapper (window.prompt / window.alert / window.confirm
 * / console.*). Built into the Resolved IO table at invocation time.
 *
 * @remarks
 * - `prompt` — called with (message, defaultValue?); must return
 *   string | null (or a Promise resolving to one)
 * - `alert` — called with (message); return value ignored
 * - `confirm` — called with (message); must return boolean (or Promise)
 * - `console` — per-method overrides; see IoConsole
 *
 * All callbacks are awaited. The learner's script does not continue
 * past the IO call until the callback resolves. If a callback throws,
 * execution surfaces an InternalError and terminates.
 */
type IoMocks = {
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
	readonly console?: IoConsole;
};

/**
 * Options accepted by createRunGenerator.
 *
 * Extends EngineConfig (seconds, iterations) with the IO mock surface.
 *
 * @remarks
 * `iterations` controls the `while`-loop guard injector. `Infinity` (or
 * omitted) skips guard injection — the only way to permit truly
 * unbounded loops. **Any finite number** injects guards that throw
 * `RangeError` when `++loopN > iterations` — so `0` bans loop bodies
 * entirely (first iteration throws), `-1` also throws on the first
 * iteration, and `n` allows exactly `n` iterations. `NaN` is treated
 * as invalid and falls through to the no-guard path; callers should
 * validate input upstream if stricter semantics are required.
 */
type RunOptions = {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

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
 *
 * `loopCount` is optional — when provided, the worker creates
 * `loop1` through `loopN` parameters for `new Function`, initialized
 * to 0. The code must already have `if (++loopN > max) throw ...`
 * guards injected by `guardLoopsCondition()`.
 */
type ExecuteMessage = {
	readonly type: 'execute';
	readonly code: string;
	readonly loopCount?: number;
	/** When true, omit `"use strict";` prefix so `with` can execute. */
	readonly scriptMode?: boolean;
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
	IoConsole,
	IoMocks,
	RunOptions,
	WorkerInbound,
	WorkerOutbound,
	SetupMessage,
	ExecuteMessage,
	EventMessage,
	IoRequestMessage,
	CompleteMessage,
};
