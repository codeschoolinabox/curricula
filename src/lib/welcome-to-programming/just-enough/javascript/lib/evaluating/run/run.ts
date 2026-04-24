/**
 * @file Public entry point for running learner code in a Web Worker
 * with trapped globals.
 *
 * @remarks The engine runs three gates lazily inside the generator
 * body before spawning a Worker:
 *   1. Cancel fast-path
 *   2. Parse + JeJ allow-list validation
 *   3. Format check
 * Any gate failure returns an immediate error RunResult. See
 * `README.md` § Lazy startup pipeline and `DOCS.md` § Architectural
 * Sketch for the full contract.
 *
 * Returns an async generator that yields RunEvent objects one at a time,
 * pausing the Worker between events via SharedArrayBuffer. The generator
 * returns a RunResult when execution completes.
 *
 * See DOCS.md § SAB pause protocol for the pause/resume mechanism.
 * See DOCS.md § Resolved IO table for the IO mock resolution model.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import checkFormat from '../../formatting/check-format.js';
import validate from '../../validating/validate.js';

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
import guardLoops from './guard-loops/guard-loops.js';
import {
	BUFFER_SIZE,
	CONTROL_INDEX,
	EVENT_READY,
	EVENT_READY_INDEX,
	clearEventReady,
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

// --- Internal termination state (first-write-wins) ---

/**
 * Every path that ends a run records a cause here via setTermination.
 * First-write-wins: concurrent triggers (cancel racing timeout,
 * worker-error racing cancel) resolve monotonically — no priority
 * ladder, no flag combinatorics. See DOCS.md § Unified termination
 * protocol.
 */
type TerminationCause =
	| { readonly kind: 'cancel' }
	| { readonly kind: 'timeout' }
	| { readonly kind: 'worker-error' };

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
 * timer pauses during every IO callback AND during every generator
 * yield (via `pauseTimeout` / `startTimeout` around both phases), so
 * learners can examine steps and consumers can run async UIs without
 * consuming execution time.
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
	// Termination cause — first-write-wins. All paths that end a run
	// (consumer cancel, for-await break, wall-clock timeout, worker error,
	// iteration-limit via RangeError, natural complete) funnel through
	// setTermination so the concurrent-trigger precedence collapses to a
	// monotonic state machine. See DOCS.md § Unified termination protocol.
	let terminationCause: TerminationCause | null = null;

	function setTermination(cause: TerminationCause): void {
		if (terminationCause === null) terminationCause = cause;
	}

	// Single-cast helper: reading `terminationCause?.kind` directly lets TS
	// narrow through the pre-iterate `if (... === 'cancel') return` at
	// body()'s top, which means later checks in this closure can't see
	// 'cancel' as a possibility. Centralizing the widening cast keeps
	// future readers from forgetting it and accidentally losing a branch.
	function getTerminationKind(): TerminationCause['kind'] | undefined {
		return (terminationCause as TerminationCause | null)?.kind;
	}

	function wakeDequeue(): void {
		// WHY push unconditionally when empty: if wakeDequeue is called
		// while the main loop is not currently awaiting dequeue (e.g. the
		// timer fires between yield and the next await dequeue, or cancel
		// fires during yield/resume before the next pull), resolveWaiting
		// is null. The next dequeue() must still return promptly so the
		// loop can reach its cancelled/timedOut check. Pushing a sentinel
		// now guarantees that — dequeue() sees queue.length > 0 synchronously.
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
		setTermination({ kind: 'cancel' });
		wakeDequeue();
	}

	async function* body(): AsyncGenerator<RunEvent, RunResult> {
		const maxSeconds = options?.seconds ?? 5;
		const maxIterations = options?.iterations;
		const resolvedIo = buildResolvedIo(options?.io);

		// 0. Cancelled before first iterate — skip all setup.
		if (terminationCause?.kind === 'cancel') {
			const cancelEvent: CancelEvent = { event: 'cancel' };
			return deepFreezeInPlace({
				ok: true,
				outcome: 'cancel' as const,
				logs: [cancelEvent],
			});
		}

		// 1. Validation + format gates. validate/checkFormat are
		// specified to never throw; any throw is caught here and
		// surfaced as a creation-phase ErrorEvent so iteration still
		// resolves cleanly rather than escaping to the consumer.
		try {
			const validation = validate(code);
			if (!validation.ok) {
				return validation as RunResult;
			}
			const { formatted } = checkFormat(code);
			if (!formatted) {
				return deepFreezeInPlace({
					ok: false as const,
					outcome: 'error' as const,
					error: { kind: 'formatting' as const },
				});
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			const name = err instanceof Error ? err.name : 'Error';
			const error: RunErrorEvent = {
				event: 'error',
				name,
				message,
				phase: 'creation',
			};
			return deepFreezeInPlace({
				ok: false,
				outcome: 'error' as const,
				error: {
					kind: 'javascript',
					name,
					message,
					phase: 'creation',
				},
				logs: [error],
			});
		}

		// 2. Check SAB availability
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
				outcome: 'error' as const,
				error: {
					kind: 'javascript',
					name: error.name,
					message: error.message,
					phase: error.phase,
				},
				logs: [error],
			});
		}

		// 3. Apply loop guards if iterations limit is configured.
		// Number.isFinite(Infinity) === false, so Infinity means "no guards";
		// any finite number (including 0 and negatives) injects guards, and
		// the `++loopN > maxIterations` template throws on the first iteration
		// for non-positive limits — counterintuitive otherwise.
		let execCode = code;
		let loopCount = 0;
		if (maxIterations !== undefined && Number.isFinite(maxIterations)) {
			const guardResult = guardLoops(code, maxIterations);
			execCode = guardResult.code;
			loopCount = guardResult.loopCount;
		}

		// 4. Create SAB and views
		const sab = new SharedArrayBuffer(BUFFER_SIZE);
		const views = createBufferViews(sab);

		// 5. Create worker from Blob URL
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
				outcome: 'error' as const,
				error: {
					kind: 'javascript',
					name: error.name,
					message,
					phase: 'creation',
				},
				logs: [error],
			});
		}

		// 6. Wire up Worker callbacks (enqueue closes over outer queue state)
		worker.onmessage = function onWorkerMessage(e: MessageEvent<WorkerOutbound>) {
			enqueue(e.data);
		};

		worker.onerror = function onWorkerError(e: ErrorEvent) {
			enqueue({
				type: 'worker-error',
				message: e.message || 'Unknown worker error',
			});
		};

		// 7. Timeout — cumulative execution time tracking
		const maxMs = maxSeconds * 1000;
		let timeout: ReturnType<typeof setTimeout> | null = null;
		let remainingMs = maxMs;
		let lastResumeTime = 0;

		function startTimeout(): void {
			if (!isFinite(remainingMs)) return;
			if (remainingMs <= 0) {
				setTermination({ kind: 'timeout' });
				wakeDequeue();
				return;
			}
			lastResumeTime = performance.now();
			timeout = setTimeout(function onTimeout() {
				timeout = null;

				// Always deduct elapsed — the budget was consumed regardless of
				// whether the Worker is paused or running.
				remainingMs -= performance.now() - lastResumeTime;
				if (remainingMs < 0) remainingMs = 0;

				// EVENT_READY guard mirrors the trace engine: the Worker writes
				// EVENT_READY after postMessage but before blocking. If set AND
				// budget remains, the Worker is paused with a pending event —
				// NOT stuck. Reschedule for the remaining budget so a real
				// exhaustion (even with events flowing) still sets terminationCause.
				if (
					Atomics.load(views.control, EVENT_READY_INDEX) === EVENT_READY &&
					remainingMs > 0
				) {
					startTimeout();
					return;
				}

				setTermination({ kind: 'timeout' });
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

		// 8. Start execution
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

				// Termination check — first-write-wins via setTermination.
				// Whichever path got there first (cancel, timeout, worker-error)
				// is the cause; others are ignored. Cancellation supersedes any
				// in-flight event that arrived just before cancel fired.
				const cause = getTerminationKind();
				if (cause === 'cancel') {
					const cancelEvent: CancelEvent = { event: 'cancel' };
					logs.push(cancelEvent);
					break;
				}

				// WHY check timeout next: timeout handler calls setTermination
				// and wakeDequeue() to unblock us. The sentinel msg is
				// irrelevant — exit immediately.
				if (cause === 'timeout') {
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

				// 8a. Streamed event — route IO callback, yield to consumer
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

					// WHY pauseTimeout BEFORE yield: budget must not deplete
					// while yielded to the consumer. Paired with startTimeout
					// below on resume. See DOCS.md § Timer-vs-yield.
					pauseTimeout();

					yield event;

					// WHY cancelled check BEFORE releasing the Worker: if cancel
					// fired during yield, we must NOT resume — the finally
					// block terminates the Worker still-paused. Clean teardown.
					if (getTerminationKind() === 'cancel') continue;
					// WHY clearEventReady BEFORE writeResumeSignal: clearing
					// after release would race against the Worker's next trap
					// re-arming the flag — the main thread would clobber a
					// fresh signal. See DOCS.md § Unified pause protocol.
					clearEventReady(views);
					// WHY writeResumeSignal BEFORE startTimeout: per DOCS.md
					// § Ordering constraints (release-before-rearm), the
					// sub-microsecond window between release and re-arm is
					// uncharged to the budget. Rearm-before-release would
					// fire the timer on a still-paused Worker. Matches both
					// the IO-path pattern below and trace's event-path.
					writeResumeSignal(views);
					startTimeout();
					continue;
				}

				// 8b. I/O request — await callback, write response, wake worker
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

				// 8c. Complete — break out of loop
				if (msg.type === 'complete') {
					break;
				}

				// 8d. Worker error — record and break
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

		// 9. Build result from collected logs
		return buildResult(logs, maxSeconds, maxIterations);
	}

	const gen = body();

	// Replay support. Every path through which the RunResult emerges
	// goes through gen.next() returning {done:true, value}; we wrap
	// it once here to capture the settled value for replay. The
	// replayed event refs come from `value.logs` — the same array
	// `body()` pushed into during live iteration, frozen in place by
	// buildResult. No clone; live and replay consumers see identical
	// event references. See DOCS.md § Replay / re-iteration.
	let isDone = false;
	let settledResult: RunResult | null = null;
	const origNext = gen.next.bind(gen);
	Object.defineProperty(gen, 'next', {
		value: async function interceptingNext(
			...args: Parameters<typeof origNext>
		): Promise<IteratorResult<RunEvent, RunResult>> {
			// WHY the isDone short-circuit: after for-await-break,
			// interceptingReturn drove the body to completion and captured
			// settledResult. The underlying AsyncGenerator is now in
			// completed state, so origNext() would return
			// {done:true, value:undefined} — clobbering drain's return
			// value and making `await handle` resolve to undefined.
			// Serve the stored settledResult instead.
			if (isDone) {
				return { value: settledResult!, done: true };
			}
			const res = await origNext(...args);
			// WHY the res.value !== undefined guard: the underlying
			// AsyncGenerator can emit {done:true, value:undefined} when
			// it has been aborted externally (e.g. .return() bypassing
			// our interceptor). Don't clobber settledResult with
			// undefined — interceptingReturn captures it authoritatively.
			if (res.done && res.value !== undefined) {
				isDone = true;
				settledResult = res.value as RunResult;
			}
			return res;
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});
	// Intercept gen.return so for-await-break settles the RunResult
	// via the existing cancel path. Consumers who `break` out of a
	// live `for await (const e of gen)` get the same settled shape
	// as explicit `.cancel()` — trailing {event:'cancel'} in logs,
	// replay-identity preserved. See DOCS.md § Replay.
	//
	// Invariants (from AR):
	// - CancelEvent is constructed INSIDE body()'s cancelled-check
	//   (run.ts:473-477), never here. Identity-stable replay requires
	//   the same ref in `logs` and the frozen RunResult.
	// - Drive via origNext, never origReturn. Native .return() aborts
	//   body before buildResult — regresses to the pre-fix state.
	// - Short-circuit on isDone per ECMA-262 §27.6.3.3.
	Object.defineProperty(gen, 'return', {
		value: async function interceptingReturn(
			value?: RunResult,
		): Promise<IteratorResult<RunEvent, RunResult>> {
			if (isDone) {
				return {
					value: settledResult ?? (value as RunResult),
					done: true,
				};
			}
			if (terminationCause === null) cancel();
			while (!isDone) {
				const res = await origNext(undefined);
				if (res.done && res.value !== undefined) {
					isDone = true;
					settledResult = res.value as RunResult;
					break;
				}
			}
			return { value: settledResult!, done: true };
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});

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
	// Capture the underlying AsyncGenerator's @@asyncIterator BEFORE we
	// override it, so the live-iteration branch below can delegate
	// without infinite recursion.
	const liveAsyncIterator = gen[Symbol.asyncIterator].bind(gen);
	Object.defineProperty(gen, Symbol.asyncIterator, {
		value: function asyncIterator(): AsyncIterator<RunEvent, RunResult> {
			// In-progress: delegate to the raw AsyncGenerator (which
			// returns `this`, so concurrent for-awaits silently split
			// via .next() serialization — DOCS.md § Replay).
			if (!isDone || settledResult === null) return liveAsyncIterator();
			// Settled: fresh iterator replays the frozen log refs.
			const settled = settledResult;
			const logs: readonly RunEvent[] = settled.logs ?? [];
			let index = 0;
			return {
				next(): Promise<IteratorResult<RunEvent, RunResult>> {
					if (index < logs.length) {
						return Promise.resolve({ value: logs[index++]!, done: false });
					}
					return Promise.resolve({ value: settled, done: true });
				},
			};
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
 *
 * @remarks Sets the `outcome` field based on the event stream:
 * - TimeoutError in logs → `timeout`
 * - Iteration-limit RangeError in logs → `iteration-limit`
 * - Any other error event → `error`
 * - Trailing CancelEvent and no error → `cancel`
 * - Otherwise → `complete`
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
				outcome: 'timeout' as const,
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
				outcome: 'iteration-limit' as const,
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
			outcome: 'error' as const,
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

	// No error event. Trailing CancelEvent → consumer stopped the run
	// (via .cancel() or for-await break). Otherwise natural complete.
	const outcome: 'cancel' | 'complete' =
		logs.at(-1)?.event === 'cancel' ? 'cancel' : 'complete';
	return deepFreezeInPlace({ ok: true, outcome, logs });
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
