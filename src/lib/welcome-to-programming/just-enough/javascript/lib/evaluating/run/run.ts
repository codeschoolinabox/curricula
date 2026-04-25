/**
 * @file Public entry point for the trapless `run` engine.
 *
 * Executes JeJ code in a Web Worker without trapping console.
 * Returns a {@link RunHandle} — `{ cancel, result, then, code, ast,
 * options }` — where the consumer can either `await run(code)`
 * (PromiseLike sugar) or `await handle.result` (explicit), and may
 * call `handle.cancel()` to abort.
 *
 * @remarks
 * Gates run **synchronously** inside `run()` before the handle is
 * returned. This lets the handle expose all sync-knowable data
 * (`code`, `ast`, `options`) without an await:
 *   1. Cancel fast-path is irrelevant for sync gates (cancel cannot
 *      fire before `run()` returns).
 *   2. Parse + JeJ allow-list validation
 *      (`lib/validating/validate.js` — refactored to return `ast`).
 *   3. Format check (`lib/formatting/check-format.js`).
 *
 * Any gate failure pre-settles `result` synchronously with the
 * appropriate error before the handle is returned. The Worker is
 * then never spawned. After all gates pass, an async body spawns
 * the Worker and wires callbacks — see `DOCS.md` for the cancel
 * state machine and the I/O default divergence from intercept.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import checkFormat from '../../formatting/check-format.js';
import guardLoops from '../shared/guard-loops/guard-loops.js';
import validate from '../../validating/validate.js';

import createWorkerScript from './create-worker-script.js';
import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePromptResponse,
} from './worker-protocol.js';
import type {
	CompleteMessage,
	IoMocks,
	IoRequestMessage,
	JavaScriptResultError,
	ResolvedRunOptions,
	RunHandle,
	RunOptions,
	RunResult,
	WorkerOutbound,
} from './types.js';

// --- Internal termination state (first-write-wins) ---

/**
 * Mirrors intercept's `TerminationCause` pattern: every async path
 * that ends a run records a cause here via `setTermination`. First-
 * write-wins across cancel / timeout / worker-error / io-error.
 *
 * Sync gate failures don't go through this — they pre-settle the
 * result Promise directly inside `run()` body before the handle is
 * returned.
 */
type TerminationCause =
	| { readonly kind: 'cancel' }
	| { readonly kind: 'timeout' }
	| { readonly kind: 'worker-error' }
	| { readonly kind: 'io-error' };

// Flat per-pause deduction. In intercept this represents the typical
// wall-clock cost of one event-cycle's consumer-side processing. In
// the trapless engine the only pause is during an I/O callback await,
// so the value is essentially symbolic — a small per-pause minimum
// tick that prevents I/O-bound code from cumulatively evading the
// seconds budget. Kept at the same value as intercept for symmetry;
// revisit only if testing shows material over-counting of typical
// prompt modal time.
const YIELD_CHARGE_MS = 0.8;

// --- Resolved IO ---

type ResolvedIo = {
	readonly prompt: (
		message: string,
		defaultValue?: string,
	) => Promise<string | null>;
	readonly alert: (message: string) => Promise<void>;
	readonly confirm: (message: string) => Promise<boolean>;
};

/**
 * Wraps consumer mocks; missing slots fall back to the native browser
 * dialog (`globalThis.prompt` / `globalThis.alert` / `globalThis.confirm`).
 *
 * @remarks Matches intercept's `buildResolvedIo` behavior — there is no
 * behavioral divergence between the two engines here. (An earlier
 * version of this engine threw on missing mocks; that decision was
 * reverted in favor of parity with intercept.)
 */
function buildResolvedIo(io?: IoMocks): ResolvedIo {
	return {
		prompt: io?.prompt
			? async (msg, def) => io.prompt!(msg, def)
			: async (msg, def) => globalThis.prompt!(msg, def),
		alert: io?.alert
			? async (msg) => await io.alert!(msg)
			: async (msg) => await globalThis.alert!(msg),
		confirm: io?.confirm
			? async (msg) => io.confirm!(msg)
			: async (msg) => globalThis.confirm!(msg),
	};
}

// --- Default options ---

const DEFAULT_SECONDS = 5;

// --- Iteration-limit classifier ---

/**
 * Matches the RangeError message thrown by guard-loops:
 *   `Loop {n} exceeded {maxIterations} iterations.`
 *
 * Preserves intercept's classification gate — an *unguarded* RangeError
 * from learner code (e.g. `new Array(2**32)`) must not be misclassified
 * as `iteration-limit`. Both the regex match AND `maxIterations !==
 * undefined` are required.
 */
const ITERATION_LIMIT_MESSAGE_RE = /^Loop \d+ exceeded \d+ iterations\.?/;

function classifyCompleteError(
	err: NonNullable<CompleteMessage['error']>,
	maxIterations: number | undefined,
): RunResult {
	if (
		maxIterations !== undefined &&
		err.name === 'RangeError' &&
		ITERATION_LIMIT_MESSAGE_RE.test(err.message)
	) {
		return {
			ok: false,
			outcome: 'iteration-limit',
			error: {
				kind: 'iteration-limit',
				name: err.name,
				message: err.message,
				...(err.line !== undefined ? { line: err.line } : {}),
				phase: 'execution',
				limit: maxIterations,
			},
		};
	}
	const jsError: JavaScriptResultError = {
		kind: 'javascript',
		name: err.name,
		message: err.message,
		...(err.line !== undefined ? { line: err.line } : {}),
		phase: err.phase,
	};
	return {
		ok: false,
		outcome: 'error',
		error: jsError,
	};
}

// --- Public entry ---

/**
 * Runs JeJ code in a trapless Web Worker.
 *
 * @returns A {@link RunHandle}. `await handle` (PromiseLike) or
 *   `await handle.result` resolve to the final {@link RunResult}.
 *   `handle.cancel()` aborts an in-flight run. `handle.code`,
 *   `handle.ast`, and `handle.options` are sync-available reads.
 */
function createRunHandle(code: string, options?: RunOptions): RunHandle {
	const resolvedOptions: ResolvedRunOptions = Object.freeze({
		seconds: options?.seconds ?? DEFAULT_SECONDS,
		...(options?.iterations !== undefined
			? { iterations: options.iterations }
			: {}),
		...(options?.io !== undefined ? { io: options.io } : {}),
	});

	const maxSeconds = resolvedOptions.seconds;
	const maxIterations = resolvedOptions.iterations;
	const resolvedIo = buildResolvedIo(resolvedOptions.io);

	// Settle plumbing -------------------------------------------------
	let settled = false;
	let resolveResult!: (r: RunResult) => void;
	const result: Promise<RunResult> = new Promise((r) => {
		resolveResult = r;
	});
	function settle(value: RunResult): void {
		if (settled) return;
		settled = true;
		resolveResult(deepFreezeInPlace(value) as RunResult);
	}

	// --- Sync gates ---------------------------------------------------
	// Phase 1: parse + JeJ validate (single parse pass; ast threaded
	// through via the validate refactor)
	const validation = validate(code);
	const ast = validation.ast;

	if (!validation.ok) {
		// Two flavors: parse error (no ast) or rejections (ast set).
		const failure: RunResult = validation.error
			? {
					ok: false,
					outcome: 'error',
					error: validation.error,
					...(ast ? { ast } : {}),
				}
			: {
					ok: false,
					outcome: 'error',
					...(validation.rejections
						? { rejections: validation.rejections }
						: {}),
					...(ast ? { ast } : {}),
				};
		settle(failure);
		return buildHandle();
	}

	// Phase 2: format gate (parse + validate already passed; ast set)
	const formatCheck = checkFormat(code);
	if (!formatCheck.formatted) {
		settle({
			ok: false,
			outcome: 'error',
			error: { kind: 'formatting' },
			...(ast ? { ast } : {}),
		});
		return buildHandle();
	}

	// Phase 3: guard loops (only when iterations is finite)
	let processedCode = code;
	let loopCount = 0;
	if (maxIterations !== undefined && Number.isFinite(maxIterations)) {
		try {
			const guarded = guardLoops(code, maxIterations);
			processedCode = guarded.code;
			loopCount = guarded.loopCount;
		} catch (err) {
			// guardLoops parses internally; if it throws (shouldn't,
			// since validate already parsed successfully), surface as
			// a creation-phase javascript error.
			settle({
				ok: false,
				outcome: 'error',
				error: {
					kind: 'javascript',
					name: err instanceof Error ? err.name : 'Error',
					message: err instanceof Error ? err.message : String(err),
					phase: 'creation',
				},
				...(ast ? { ast } : {}),
			});
			return buildHandle();
		}
	}

	// --- Async path: spawn worker, run, settle --------------------------

	let terminationCause: TerminationCause | undefined;
	function setTermination(cause: TerminationCause): boolean {
		if (terminationCause !== undefined) return false;
		terminationCause = cause;
		return true;
	}

	let worker: Worker | null = null;
	let workerUrl: string | null = null;
	let workerTerminated = false;
	let pendingIo = false;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let lastResumeTime: number | null = null;
	let remainingMs = maxSeconds * 1000;
	let views: ReturnType<typeof createBufferViews> | null = null;

	function clearTimerIfSet(): void {
		if (timerId !== null) {
			clearTimeout(timerId);
			timerId = null;
		}
	}

	function terminate(): void {
		if (workerTerminated) return;
		workerTerminated = true;
		clearTimerIfSet();
		if (worker !== null) worker.terminate();
		if (workerUrl !== null) URL.revokeObjectURL(workerUrl);
	}

	function onTimeout(): void {
		if (!setTermination({ kind: 'timeout' })) return;
		terminate();
		settle({
			ok: false,
			outcome: 'timeout',
			error: {
				kind: 'timeout',
				name: 'TimeoutError',
				message: `Execution exceeded ${maxSeconds} seconds`,
				phase: 'execution',
				limit: maxSeconds,
			},
			...(ast ? { ast } : {}),
		});
	}

	function startTimer(): void {
		if (workerTerminated) return;
		if (terminationCause !== undefined) return;
		if (remainingMs <= 0) {
			onTimeout();
			return;
		}
		lastResumeTime = performance.now();
		timerId = setTimeout(onTimeout, remainingMs);
	}

	function pauseTimer(): void {
		if (timerId === null) return;
		clearTimeout(timerId);
		timerId = null;
		if (lastResumeTime !== null) {
			const elapsed = performance.now() - lastResumeTime;
			remainingMs -= elapsed + YIELD_CHARGE_MS;
			if (remainingMs < 0) remainingMs = 0;
			lastResumeTime = null;
		}
	}

	// Cancel — only meaningful after gates passed (gate-failure path
	// pre-settles the result, so cancel becomes a no-op via settled
	// guard).
	function cancel(): void {
		if (settled) return;
		if (!setTermination({ kind: 'cancel' })) return;
		if (worker === null) {
			// Async body hasn't spawned worker yet (microtask still
			// queued, or running but pre-spawn). Settle now; the body's
			// next termination check exits before spawning.
			settle({
				ok: false,
				outcome: 'cancel',
				...(ast ? { ast } : {}),
			});
			return;
		}
		if (pendingIo) {
			// Wait-for-mock: handleIoRequest detects terminationCause
			// after the mock's await resolves and finishes the cancel.
			return;
		}
		terminate();
		settle({
			ok: false,
			outcome: 'cancel',
			...(ast ? { ast } : {}),
		});
	}

	async function handleIoRequest(msg: IoRequestMessage): Promise<void> {
		if (terminationCause !== undefined) return;
		if (views === null) return;
		pauseTimer();
		pendingIo = true;
		try {
			let value: string | null | boolean | undefined;
			if (msg.name === 'prompt') {
				value = await resolvedIo.prompt(
					msg.args[0] as string,
					msg.args[1] as string | undefined,
				);
			} else if (msg.name === 'confirm') {
				value = await resolvedIo.confirm(msg.args[0] as string);
			} else {
				await resolvedIo.alert(msg.args[0] as string);
				value = undefined;
			}

			pendingIo = false;

			// Post-await termination check (cancel-during-IO or
			// worker-error-during-IO). Cast defeats TS's stale narrowing
			// of the closure-captured `terminationCause` mutable.
			const postCause = terminationCause as TerminationCause | undefined;
			if (postCause !== undefined) {
				if (postCause.kind === 'cancel') {
					terminate();
					settle({
						ok: false,
						outcome: 'cancel',
						...(ast ? { ast } : {}),
					});
				}
				return;
			}

			if (worker === null || workerTerminated) return;
			if (msg.name === 'prompt') {
				writePromptResponse(views, value as string | null);
			} else if (msg.name === 'confirm') {
				writeConfirmResponse(views, value as boolean);
			} else {
				writeAlertResponse(views);
			}
			Atomics.notify(views.control, CONTROL_INDEX);
			startTimer();
		} catch (err) {
			pendingIo = false;
			if (!setTermination({ kind: 'io-error' })) return;
			terminate();
			settle({
				ok: false,
				outcome: 'error',
				error: {
					kind: 'javascript',
					name: err instanceof Error ? err.name : 'Error',
					message: err instanceof Error ? err.message : String(err),
					phase: 'execution',
				},
				...(ast ? { ast } : {}),
			});
		}
	}

	// Worker spawn deferred to a microtask via the IIFE so the handle
	// can return synchronously. cancel() can fire between the handle
	// return and the microtask running — we check terminationCause
	// before spawning.
	//
	// **The leading `await Promise.resolve()` is load-bearing.** Async
	// function bodies run synchronously until the first `await`; without
	// this defer, `new Worker(...)` would execute inside `run()`'s sync
	// frame, race-blocking any cancel() the caller queues immediately
	// after `run()` returns.
	void (async () => {
		try {
			await Promise.resolve();
			if (terminationCause !== undefined) return; // already cancelled

			const sab = new SharedArrayBuffer(BUFFER_SIZE);
			views = createBufferViews(sab);
			const blob = new Blob([createWorkerScript()], {
				type: 'application/javascript',
			});
			workerUrl = URL.createObjectURL(blob);
			worker = new Worker(workerUrl);

			// Race-check: cancel could have fired between Promise creation
			// and now (synchronously, before the microtask).
			// `as` defeats TS's static narrowing — terminationCause is
			// closure-captured and may have been mutated by cancel().
			const earlyCause = terminationCause as TerminationCause | undefined;
			if (earlyCause !== undefined) {
				terminate();
				if (earlyCause.kind === 'cancel') {
					settle({
						ok: false,
						outcome: 'cancel',
						...(ast ? { ast } : {}),
					});
				}
				return;
			}

			worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
				const msg = e.data;
				if (terminationCause !== undefined) return;
				if (msg.type === 'complete') {
					if (msg.error) {
						if (!setTermination({ kind: 'worker-error' })) return;
						terminate();
						const classified = classifyCompleteError(msg.error, maxIterations);
						settle({
							...classified,
							...(ast ? { ast } : {}),
						});
					} else {
						if (!setTermination({ kind: 'worker-error' })) return;
						terminate();
						settle({
							ok: true,
							outcome: 'complete',
							...(ast ? { ast } : {}),
						});
					}
					return;
				}
				if (msg.type === 'io-request') {
					void handleIoRequest(msg);
				}
			};

			worker.onerror = (e: ErrorEvent) => {
				e.preventDefault();
				if (!setTermination({ kind: 'worker-error' })) return;
				const errorMessage = e.message || 'Worker error';
				terminate();
				settle({
					ok: false,
					outcome: 'error',
					error: {
						kind: 'javascript',
						name: 'WorkerError',
						message: errorMessage,
						phase: 'execution',
					},
					...(ast ? { ast } : {}),
				});
			};

			worker.postMessage({ type: 'setup', sharedBuffer: sab });
			worker.postMessage({
				type: 'execute',
				code: processedCode,
				loopCount,
			});
			startTimer();
		} catch (err) {
			if (settled) return;
			if (!setTermination({ kind: 'worker-error' })) return;
			terminate();
			settle({
				ok: false,
				outcome: 'error',
				error: {
					kind: 'javascript',
					name: err instanceof Error ? err.name : 'Error',
					message: err instanceof Error ? err.message : String(err),
					phase: 'creation',
				},
				...(ast ? { ast } : {}),
			});
		}
	})();

	return buildHandle();

	function buildHandle(): RunHandle {
		function then<T1 = RunResult, T2 = never>(
			onFulfilled?: ((v: RunResult) => T1 | PromiseLike<T1>) | null,
			onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
		): Promise<T1 | T2> {
			return result.then(onFulfilled, onRejected);
		}
		return Object.freeze({
			cancel,
			result,
			then,
			code,
			ast,
			options: resolvedOptions,
		}) as RunHandle;
	}
}

export default createRunHandle;
