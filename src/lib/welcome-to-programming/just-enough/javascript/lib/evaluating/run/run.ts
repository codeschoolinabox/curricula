/**
 * @file Executes JeJ code in a Web Worker with trapped globals.
 *
 * @internal DO NOT import from outside `api/run.ts`. Use the validated,
 * gated `run` export from the package root instead. This module bypasses
 * validation and the format gate; importing it directly will produce a
 * `boundaries/element-types` lint error once the boundaries rule is added.
 *
 * @remarks This is the low-level execution engine. It does not validate
 * or enforce language levels — a higher-level wrapper handles that before
 * calling the generator.
 *
 * Returns an async generator that yields RunEvent objects one at a time,
 * pausing the Worker between events via SharedArrayBuffer. The generator
 * returns a RunResult when execution completes.
 *
 * See DOCS.md § SAB pause protocol for the pause/resume mechanism.
 * See DOCS.md § Resolved IO table for the IO mock resolution model.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	CancelEvent,
	ConsoleMethod,
	RunEvent,
	ErrorEvent as RunErrorEvent,
} from '../shared/types.js';
import type { RunResult } from '../../../api/types.js';
import type {
	IoMocks,
	IoRequestMessage,
	RunHandle,
	RunOptions,
	WorkerOutbound,
} from './types.js';

import createWorkerScript from './create-worker-script.js';
import guardLoopsCondition from '../shared/guard-loops/guard-loops.js';
import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	createBufferViews,
	writeAlertResponse,
	writeConfirmResponse,
	writePauseEngaged,
	writePromptResponse,
	writeResumeSignal,
} from './worker-protocol.js';

// --- Internal message types for the queue ---

type WorkerErrorSignal = {
	readonly type: 'worker-error';
	readonly message: string;
};
type QueueMessage = WorkerOutbound | WorkerErrorSignal;

// --- Resolved IO ---

const CONSOLE_METHODS: readonly ConsoleMethod[] = [
	'log', 'debug', 'info', 'warn', 'error',
	'assert', 'table', 'dir', 'dirxml',
	'group', 'groupCollapsed', 'groupEnd',
	'count', 'countReset',
	'time', 'timeEnd', 'timeLog',
	'trace', 'clear',
];

type ResolvedConsole = Record<ConsoleMethod, (...args: readonly unknown[]) => Promise<void>>;

type ResolvedIo = {
	readonly prompt: (message: string, defaultValue?: string) => Promise<string | null>;
	readonly alert: (message: string) => Promise<void>;
	readonly confirm: (message: string) => Promise<boolean>;
	readonly console: ResolvedConsole;
};

/**
 * Merges consumer-provided mocks with Native IO wrappers into the
 * Resolved IO table. Each slot is independently overridable — omitted
 * slots fall back to the Native IO wrapper. All callbacks are wrapped
 * in async so the main loop can always `await` them uniformly.
 */
function buildResolvedIo(io?: IoMocks): ResolvedIo {
	const resolvedConsole = {} as ResolvedConsole;

	for (const method of CONSOLE_METHODS) {
		const mock = io?.console?.[method];
		if (mock) {
			resolvedConsole[method] = async (...args) => {
				await mock(...args);
			};
		} else {
			const nativeFn = (
				console as unknown as Record<ConsoleMethod, (...a: unknown[]) => void>
			)[method];
			resolvedConsole[method] = async (...args) => {
				// eslint-disable-next-line no-console
				nativeFn?.(...args);
			};
		}
	}

	return {
		prompt: io?.prompt
			? async (msg, def) => io.prompt!(msg, def)
			: async (msg, def) =>
					// eslint-disable-next-line no-alert
					def === undefined ? window.prompt(msg) : window.prompt(msg, def),

		alert: io?.alert
			? async (msg) => { await io.alert!(msg); }
			: async (msg) => {
					// eslint-disable-next-line no-alert
					window.alert(msg);
				},

		confirm: io?.confirm
			? async (msg) => io.confirm!(msg)
			: async (msg) => {
					// eslint-disable-next-line no-alert
					return window.confirm(msg);
				},

		console: resolvedConsole,
	};
}

// --- Internal error helper ---

function makeInternalError(err: unknown): RunErrorEvent {
	return {
		event: 'error',
		name: 'InternalError',
		message: err instanceof Error ? err.message : String(err),
		phase: 'execution',
	};
}

/**
 * Creates an async generator that runs learner code in a Web Worker
 * and yields events as they occur.
 *
 * @param code - JavaScript source to execute (assumed valid — no
 *   parsing or validation happens here)
 * @param options - Optional: seconds (default 5), iterations, io mocks
 * @returns A `RunHandle` — an AsyncGenerator augmented with
 *   `.cancel()`, `.result` (memoized Promise), and `.then()`
 *   (PromiseLike).
 *
 * @remarks
 * **Three consumption modes:**
 *
 * ```ts
 * // 1. Iterate events
 * const handle = run(code);
 * for await (const event of handle) { render(event); }
 *
 * // 2. Await the result (no event iteration needed)
 * const result = await run(code);
 * // equivalent:
 * const result = await run(code).result;
 *
 * // 3. Cancel
 * const handle = run(code);
 * handle.cancel();
 * ```
 *
 * **Do not mix modes 1 and 2** on the same handle — both call
 * `.next()` internally. AsyncGenerator serializes concurrent
 * `.next()` calls, so each consumer silently sees a disjoint subset
 * of events as the two paths alternate. Pick one mode per handle.
 *
 * **Lazy startup.** The Worker is not created until the first
 * `.next()` call (or the first `.result` access, which calls
 * `.next()` internally). Calling `.cancel()` before any of these
 * skips Worker creation entirely — no resource leak.
 *
 * **Cancellation.** `.cancel()` sets an internal flag and unsticks
 * any pending `await dequeue()`. The main loop breaks cleanly,
 * terminates the Worker in its finally block, and returns a
 * `RunResult` with a trailing `{event: 'cancel'}` in `logs`. No
 * exception is thrown. Idempotent — safe to call any number of
 * times, at any phase.
 *
 * **Cancel latency.** Cancel takes effect on the next resolution of
 * `await dequeue()` in the main loop. In most phases that's within
 * one macrotask. One exception: if the main loop is currently suspended
 * inside `await handleIoRequest(...)` — i.e., a consumer-provided
 * async `io.prompt/alert/confirm` mock is awaiting user input — the
 * cancel flag is set synchronously, but teardown waits for that mock's
 * promise to settle. Native `window.prompt` blocks the main thread
 * synchronously, so cancel can't be clicked while it's open. For
 * styled/async dialogs the consumer should resolve/reject the pending
 * IO promise if they want immediate teardown.
 *
 * All globals (all 19 console methods, alert, confirm, prompt)
 * are trapped. Each trap posts a ConsoleEvent (console) or io-request
 * (dialogs) and blocks on the SAB pause flag until the main thread
 * processes the event and resumes.
 *
 * IO callbacks (mocked or native) are always awaited. The cumulative
 * timer is intended to pause during every IO callback AND every
 * generator yield, so learners can examine steps and consumers can
 * run async UIs without consuming execution time.
 *
 * **Known inconsistency:** the timer currently only pauses during IO
 * callbacks (via pauseTimeout/startTimeout around handleIoRequest).
 * It does NOT pause during generator yield — time the consumer spends
 * between `.next()` calls (e.g. stepping mode) still counts toward
 * the `seconds` limit. Fix pending the api/run → evaluating/run merge
 * task, which will adopt the trace engine's EVENT_READY protocol and
 * gain a reliable "worker paused, don't tick" signal for the timer.
 */
function createRunGenerator(
	code: string,
	options?: RunOptions,
): RunHandle {
	// Queue + cancel plumbing — lives in the outer closure so cancel()
	// can reach wakeDequeue regardless of where the generator body is
	// suspended (before first iterate, mid-await, or mid-yield).
	const queue: QueueMessage[] = [];
	let resolveWaiting: (() => void) | null = null;
	let cancelled = false;

	function wakeDequeue(): void {
		// WHY push unconditionally when empty: if wakeDequeue is called
		// while the main loop is not currently awaiting dequeue (e.g. the
		// timer fires between yield and the next await dequeue, or cancel
		// fires while await setTimeout(0) is pending), resolveWaiting is
		// null. The next dequeue() must still return promptly so the loop
		// can reach its cancelled/timedOut check. Pushing a sentinel now
		// guarantees that — dequeue() sees queue.length > 0 synchronously.
		if (queue.length === 0) {
			queue.push({ type: 'complete' } as QueueMessage);
		}
		if (resolveWaiting !== null) {
			resolveWaiting();
			resolveWaiting = null;
		}
	}

	function enqueue(msg: QueueMessage): void {
		queue.push(msg);
		if (resolveWaiting !== null) {
			resolveWaiting();
			resolveWaiting = null;
		}
	}

	function dequeue(): Promise<QueueMessage> {
		if (queue.length > 0) {
			return Promise.resolve(queue.shift()!);
		}
		return new Promise<QueueMessage>((resolve) => {
			resolveWaiting = () => resolve(queue.shift()!);
		});
	}

	function cancel(): void {
		cancelled = true;
		wakeDequeue();
	}

	async function* body(): AsyncGenerator<RunEvent, RunResult> {
		const maxSeconds = options?.seconds ?? 5;
		const maxIterations = options?.iterations;
		const resolvedIo = buildResolvedIo(options?.io);

		// 0. Cancelled before first iterate — skip all setup.
		if (cancelled) {
			const cancelEvent: CancelEvent = { event: 'cancel' };
			return deepFreezeInPlace({ ok: true, logs: [cancelEvent] });
		}

		// 1. Check SAB availability
		if (typeof SharedArrayBuffer === 'undefined') {
			const error: RunErrorEvent = {
				event: 'error',
				name: 'EnvironmentError',
				message:
					'SharedArrayBuffer is not available. The hosting page must ' +
					'serve Cross-Origin-Opener-Policy: same-origin and ' +
					'Cross-Origin-Embedder-Policy: require-corp headers.',
				phase: 'creation',
			};
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'javascript',
					name: error.name,
					message: error.message,
					phase: error.phase,
				},
				logs: [error],
			});
		}

		// 2. Apply loop guards if iterations limit is configured.
		// Number.isFinite(Infinity) === false, so Infinity means "no guards";
		// any finite number (including 0 and negatives) injects guards, and
		// the `++loopN > maxIterations` template throws on the first iteration
		// for non-positive limits — counterintuitive otherwise.
		let execCode = code;
		let loopCount = 0;
		if (maxIterations !== undefined && Number.isFinite(maxIterations)) {
			const guardResult = guardLoopsCondition(code, maxIterations);
			execCode = guardResult.code;
			loopCount = guardResult.loopCount;
		}

		// 3. Create SAB and views
		const sab = new SharedArrayBuffer(BUFFER_SIZE);
		const views = createBufferViews(sab);

		// 4. Create worker from Blob URL
		const script = createWorkerScript();
		const blob = new Blob([script], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);

		let worker: Worker;
		try {
			worker = new Worker(url);
		} catch (err: unknown) {
			URL.revokeObjectURL(url);
			const message =
				err instanceof Error ? err.message : 'Failed to create Worker';
			const error: RunErrorEvent = {
				event: 'error',
				name: 'WorkerError',
				message,
				phase: 'creation',
			};
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'javascript',
					name: error.name,
					message,
					phase: 'creation',
				},
				logs: [error],
			});
		}

		// 5. Wire up Worker callbacks (enqueue closes over outer queue state)
		worker.onmessage = function onWorkerMessage(e: MessageEvent<WorkerOutbound>) {
			enqueue(e.data);
		};

		worker.onerror = function onWorkerError(e: ErrorEvent) {
			enqueue({
				type: 'worker-error',
				message: e.message || 'Unknown worker error',
			});
		};

		// 6. Timeout — cumulative execution time tracking
		const maxMs = maxSeconds * 1000;
		let timeout: ReturnType<typeof setTimeout> | null = null;
		let remainingMs = maxMs;
		let lastResumeTime = 0;
		let timedOut = false;

		function startTimeout(): void {
			if (!isFinite(remainingMs)) return;
			if (remainingMs <= 0) {
				timedOut = true;
				wakeDequeue();
				return;
			}
			lastResumeTime = performance.now();
			timeout = setTimeout(function onTimeout() {
				timeout = null;
				timedOut = true;
				wakeDequeue();
			}, remainingMs);
		}

		function pauseTimeout(): void {
			if (timeout !== null) {
				clearTimeout(timeout);
				timeout = null;
				remainingMs -= performance.now() - lastResumeTime;
				if (remainingMs < 0) remainingMs = 0;
			}
		}

		function clearTimeoutIfSet(): void {
			if (timeout !== null) {
				clearTimeout(timeout);
				timeout = null;
			}
		}

		// 7. Start execution
		worker.postMessage({ type: 'setup', sharedBuffer: sab });
		worker.postMessage({
			type: 'execute',
			code: execCode,
			...(loopCount > 0 ? { loopCount } : {}),
		});

		// Engage pause so worker blocks after posting each event
		writePauseEngaged(views);
		startTimeout();

		const logs: RunEvent[] = [];

		try {
			while (true) {
				const msg = await dequeue();

				// Cancellation supersedes everything else, including any
				// in-flight event that arrived just before cancel fired.
				if (cancelled) {
					const cancelEvent: CancelEvent = { event: 'cancel' };
					logs.push(cancelEvent);
					break;
				}

				// WHY check timedOut next: timeout handler sets this flag and calls
				// wakeDequeue() to unblock us. The sentinel msg is irrelevant — exit immediately.
				if (timedOut) {
					const timeoutEvent: RunErrorEvent = {
						event: 'error',
						name: 'TimeoutError',
						message: `Execution exceeded ${maxSeconds} second time limit`,
						phase: 'execution',
					};
					logs.push(timeoutEvent);
					yield timeoutEvent;
					break;
				}

				// 7a. Streamed event — route IO callback, yield to consumer
				if (msg.type === 'event') {
					const event = msg.event;
					logs.push(event);

					if (event.event === 'console') {
						try {
							await resolvedIo.console[event.method](...event.args);
						} catch (err) {
							logs.push(makeInternalError(err));
							break;
						}
					}

					yield event;

					// WHY: yield one macrotask slot before releasing the worker.
					// The wall-clock timer callback is a macrotask — it cannot fire
					// during an unbroken microtask chain. This break gives it a
					// guaranteed firing slot each event. Worker remains paused here.
					// WHY no writePauseEngaged: each trap arms its own pause before
					// postMessage to avoid the race where notify fires before the main
					// thread re-arms, causing Atomics.wait to see PAUSED and deadlock.
					await new Promise<void>(resolve => setTimeout(resolve, 0));
					// WHY cancelled check BEFORE writeResumeSignal: if cancel
					// fired during the macrotask wait, we must NOT unpause the
					// worker — that would let it run one more chunk of user
					// code before the finally block can terminate it. The next
					// iteration dequeues the sentinel cancel pushed and breaks.
					if (cancelled) continue;
					writeResumeSignal(views);
					continue;
				}

				// 7b. I/O request — await callback, write response, wake worker
				if (msg.type === 'io-request') {
					pauseTimeout();
					try {
						await handleIoRequest(msg as IoRequestMessage, views, resolvedIo);
						Atomics.notify(views.control, CONTROL_INDEX);
					} catch (err) {
						logs.push(makeInternalError(err));
						break;
					}
					startTimeout();
					continue;
				}

				// 7c. Complete — break out of loop
				if (msg.type === 'complete') {
					break;
				}

				// 7d. Worker error — record and break
				if (msg.type === 'worker-error') {
					logs.push({
						event: 'error',
						name: 'WorkerError',
						message: msg.message,
						phase: 'execution',
					});
					break;
				}


			}
		} finally {
			clearTimeoutIfSet();
			worker.terminate();
			URL.revokeObjectURL(url);
		}

		// 8. Build result from collected logs
		return buildResult(logs, maxSeconds, maxIterations);
	}

	const gen = body();

	// Memoized .result Promise. Lazy: first access drives the
	// generator to completion. Subsequent accesses return the same
	// Promise — safe to call `.result` or `await handle` repeatedly.
	let resultPromise: Promise<RunResult> | null = null;
	function getResult(): Promise<RunResult> {
		if (resultPromise === null) {
			resultPromise = (async function drain() {
				while (true) {
					const { value, done } = await gen.next();
					if (done) return value;
				}
			})();
		}
		return resultPromise;
	}

	// WHY defineProperty over Object.assign: the RunHandle type marks
	// cancel/result as `readonly`. Object.assign creates plain writable
	// properties, so consumers could clobber them without a type error.
	// defineProperty with writable:false + configurable:false makes the
	// readonly guarantee actually enforced at runtime.
	Object.defineProperty(gen, 'cancel', {
		value: cancel,
		writable: false,
		configurable: false,
		enumerable: true,
	});
	Object.defineProperty(gen, 'result', {
		get: getResult,
		configurable: false,
		enumerable: true,
	});
	// WHY enumerable:false on then: matches native Promise's behavior —
	// `Object.keys(handle)` shouldn't include `then`. Also prevents
	// accidental serialization (JSON.stringify) from including it.
	Object.defineProperty(gen, 'then', {
		value: function then<TResult1 = RunResult, TResult2 = never>(
			onFulfilled?:
				| ((value: RunResult) => TResult1 | PromiseLike<TResult1>)
				| null,
			onRejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null,
		): Promise<TResult1 | TResult2> {
			return getResult().then(onFulfilled, onRejected);
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});
	return gen as unknown as RunHandle;
}

// --- Helpers ---

/**
 * Awaits the Resolved IO callback for a dialog io-request, then writes
 * the response to the SAB. Throws if the callback throws — caller
 * catches and surfaces as InternalError.
 */
async function handleIoRequest(
	msg: IoRequestMessage,
	views: ReturnType<typeof createBufferViews>,
	resolvedIo: ResolvedIo,
): Promise<void> {
	const dialogMessage = String(msg.args[0] ?? '');

	if (msg.name === 'alert') {
		await resolvedIo.alert(dialogMessage);
		writeAlertResponse(views);
		return;
	}

	if (msg.name === 'confirm') {
		const result = await resolvedIo.confirm(dialogMessage);
		writeConfirmResponse(views, result);
		return;
	}

	// msg.name === 'prompt'
	const defaultValue =
		msg.args.length > 1 ? String(msg.args[1] ?? '') : undefined;
	const result = await resolvedIo.prompt(dialogMessage, defaultValue);
	writePromptResponse(views, result);
}

/**
 * Builds a RunResult from the collected event logs.
 */
function buildResult(
	logs: readonly RunEvent[],
	maxSeconds: number,
	maxIterations?: number,
): RunResult {
	const errorEvent = findErrorEvent(logs);

	if (errorEvent) {
		if (errorEvent.name === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'timeout',
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
					phase: errorEvent.phase,
					limit: maxSeconds,
				},
				logs,
			});
		}

		// WHY: RangeError from loop guards is classified as
		// iteration-limit, not generic javascript error
		if (
			errorEvent.name === 'RangeError' &&
			maxIterations !== undefined &&
			errorEvent.message.includes('exceeded') &&
			errorEvent.message.includes('iterations')
		) {
			return deepFreezeInPlace({
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
					phase: errorEvent.phase,
					limit: maxIterations,
				},
				logs,
			});
		}

		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'javascript',
				name: errorEvent.name,
				message: errorEvent.message,
				...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
				phase: errorEvent.phase,
			},
			logs,
		});
	}

	return deepFreezeInPlace({ ok: true, logs });
}

/**
 * Finds the last error event in the log array.
 */
function findErrorEvent(logs: readonly RunEvent[]): RunErrorEvent | undefined {
	for (let i = logs.length - 1; i >= 0; i--) {
		const entry = logs[i];
		if (entry.event === 'error') {
			return entry;
		}
	}
	return undefined;
}

export default createRunGenerator;
