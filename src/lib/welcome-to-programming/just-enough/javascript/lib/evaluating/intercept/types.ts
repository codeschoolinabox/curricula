/**
 * @file Worker message protocol types and IO mock surface for the intercept action.
 *
 * Defines the two-step message protocol (setup → execute) between the
 * main thread and the execution worker, the SharedArrayBuffer layout
 * for synchronous I/O (prompt/confirm/alert), and the consumer-facing
 * IO mock types (IoMocks, IoConsole, InterceptOptions). Also exports the
 * public `InterceptHandle` — the return type of `createInterceptGenerator`.
 */

import type {
	ConsoleMethod,
	Execution,
	InterceptEvent,
} from '../shared/types.js';
import type { InterceptResult } from '../../../api/types.js';

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
 * Options accepted by createInterceptGenerator.
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
type InterceptOptions = {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

// ─── Public return type ───────────────────────────────────────

/**
 * The handle returned by `createInterceptGenerator`.
 *
 * @remarks Simultaneously satisfies three interfaces:
 *
 * - `AsyncGenerator<InterceptEvent, InterceptResult>` — the raw iteration
 *   surface (`.next()`, `.return()`, `.throw()`) used by
 *   fine-grained consumers and the internal test suite.
 * - `Execution<InterceptEvent, InterceptResult>` — from `../shared/types.ts`.
 *   Provides `.cancel()`, `.result`, and PromiseLike `.then()`.
 *
 * The `Execution` contract is a strict subset of what's exposed —
 * consumers that only want the high-level `await run(code)` /
 * `for await` / `.cancel()` surface can annotate as `Execution`
 * directly. The AsyncGenerator surface is kept available for
 * low-level needs (currently only internal tests).
 *
 * **Three consumption modes** (see run/README.md § Public API for
 * detail):
 * 1. Iterate events — `for await (const event of handle) {...}`.
 * 2. Await the result — `await handle` (PromiseLike) or
 *    `await handle.result`.
 * 3. Cancel — `handle.cancel()` at any point.
 *
 * Mode 1 and Mode 2 must not be mixed on the same handle — see
 * JSDoc on `createInterceptGenerator` for why.
 */
type InterceptHandle =
	AsyncGenerator<InterceptEvent, InterceptResult> &
	Execution<InterceptEvent, InterceptResult> & {
		/**
		 * Stop the run and attach a structured rejection payload.
		 *
		 * @param reason - arbitrary payload the consumer wants surfaced
		 *   on `result.reason`. Not cloned, not frozen-separately; the
		 *   same reference is replay-stable.
		 *
		 * @remarks `.fail(reason)` is for consumer-driven structured
		 * termination — e.g. a teaching harness that wants to stop the
		 * run and record "learner's prediction was wrong" with a
		 * specific rejection payload. The result settles with
		 * `{ok:true, outcome:'fail', reason}`. Logs remain pure
		 * (no synthetic termination marker appended).
		 *
		 * Idempotent and first-write-wins with `.cancel()` / timeout
		 * / worker-error: whichever termination path sets its cause
		 * first wins; subsequent `.fail()` / `.cancel()` calls are
		 * no-ops. Safe to call any number of times at any phase.
		 */
		readonly fail: (reason?: unknown) => void;
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
 * guards injected by `guardLoops()`.
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
	readonly event: InterceptEvent;
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
	InterceptOptions,
	InterceptHandle,
	WorkerInbound,
	WorkerOutbound,
	SetupMessage,
	ExecuteMessage,
	EventMessage,
	IoRequestMessage,
	CompleteMessage,
};
