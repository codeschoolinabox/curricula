/**
 * @file Public entry point for running learner code in a Web Worker
 * with trapped globals.
 *
 * @remarks The engine runs three gates lazily inside the generator
 * body before spawning a Worker:
 *   1. Cancel fast-path
 *   2. Parse + JeJ allow-list validation
 *   3. Format check
 * Any gate failure returns an immediate error InterceptResult. See
 * `README.md` § Lazy startup pipeline and `DOCS.md` § Architectural
 * Sketch for the full contract.
 *
 * Returns an async generator that yields InterceptEvent objects one at a time,
 * pausing the Worker between events via SharedArrayBuffer. The generator
 * returns a InterceptResult when execution completes.
 *
 * See DOCS.md § SAB pause protocol for the pause/resume mechanism.
 * See DOCS.md § Resolved IO table for the IO mock resolution model.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import checkFormat from '../../formatting/check-format.js';
import justEnoughJs from '../../validating/just-enough-js.js';
import validateProgram from '../../validating/validate-program.js';
import guardLoops from '../shared/guard-loops/guard-loops.js';
import type {
	ConsoleMethod,
	InterceptEvent,
	ErrorEvent as RunErrorEvent,
} from '../shared/types.js';

import createWorkerScript from './create-worker-script.js';
import buildLocationIndex from './link/build-location-index.js';
import lookupNodePath from './link/lookup-node-path.js';
import type {
	ASTNode,
	LinkedInterceptEvent,
	LocationIndex,
	NodePathSource,
} from './link/types.js';
import type {
	IoMocks,
	IoRequestMessage,
	InterceptHandle,
	InterceptOptions,
	InterceptResult,
	InterceptResultError,
	InterceptOutcome,
	WorkerOutbound,
} from './types.js';
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
import wrapCallExpressions from './wrap-call-expressions.js';

/**
 * Creates an async generator that runs learner code in a Web Worker
 * and yields events as they occur.
 *
 * @param code - JavaScript source to execute (assumed valid — no
 *   parsing or validation happens here)
 * @param options - Optional: seconds (default 5), iterations, io mocks
 * @returns A `InterceptHandle` — an AsyncGenerator augmented with
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
 * **Cancellation.** `.cancel()` sets `terminationCause` and unsticks
 * any pending `await dequeue()`. The main loop breaks cleanly,
 * terminates the Worker in its finally block, and returns a
 * `InterceptResult` with `outcome: 'cancel'`. Logs stay pure (no
 * synthetic cancel marker appended). No exception is thrown.
 * Idempotent and first-write-wins — safe to call any number of
 * times, at any phase.
 *
 * **Consumer-driven structured stop.** `.fail(reason)` is a
 * parallel method that settles with `outcome: 'fail'` and
 * `result.reason === reason`. Used for teaching harnesses that
 * want to record WHY a run was stopped (e.g., a learner's
 * prediction was wrong). `reason` is stored by reference —
 * reference-stable across replay.
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
export default function createInterceptGenerator(
	code: string,
	options?: InterceptOptions,
): InterceptHandle {
	// LocationIndex — built after successful validation, used to enrich
	// each worker-emitted event with nodePath/nodePathSource before
	// yielding. Stays null when validation fails (no AST available).
	let locationIndex: LocationIndex | null = null;

	// Eager handle.ast Promise. Resolved exactly once: on validation
	// success with the astByPath record, or with `null` on any path
	// that completes without building an AST (validation failure,
	// pre-iterate cancel/fail, SAB unavailable, worker construction
	// failure). Idempotent via `astResolved` guard so the second
	// resolveAst call (e.g. cleanup after early-error) is a no-op.
	//
	// `astRecord` caches the resolved value (or null) so the eventual
	// `result.ast` is the SAME reference the consumer awaited via
	// `handle.ast`. Without the cache, `Object.fromEntries(...)` runs
	// twice and produces two distinct Record shells with the same
	// inner ASTNode references — which violates the single-source-of-
	// truth invariant documented in DOCS.md § Navigation.
	let astResolved = false;
	let astRecord: Readonly<Record<string, ASTNode>> | null = null;
	let astResolver:
		| ((value: Readonly<Record<string, ASTNode>> | null) => void)
		| null = null;
	const astPromise = new Promise<Readonly<Record<string, ASTNode>> | null>(
		(resolve) => {
			astResolver = resolve;
		},
	);
	function resolveAst(value: Readonly<Record<string, ASTNode>> | null): void {
		if (!astResolved && astResolver !== null) {
			astResolved = true;
			astRecord = value;
			astResolver(value);
		}
	}
	function toAstRecord(
		map: ReadonlyMap<string, ASTNode>,
	): Readonly<Record<string, ASTNode>> {
		// Object.fromEntries for the public API surface — `Record<...>`
		// is what trace exposes too. The underlying ASTNode references
		// are the same; only the container wrapper differs.
		return Object.fromEntries(map);
	}

	// Doubly-linked event timeline — see DOCS.md § Navigation. Each event
	// arrives, gets prev/next accessor properties wired, gets pushed onto
	// `events`, then frozen at yield. The closure variables below carry
	// the tail state across appendEvent calls. `setTailNext` is the
	// previous tail's next-setter (closes over its `nextRef` variable);
	// when the new event arrives we call it to wire the previous tail's
	// next, then refresh setTailNext to point at the new tail's setter.
	let eventListTail: LinkedInterceptEvent | null = null;
	let setTailNext: ((next: LinkedInterceptEvent) => void) | null = null;

	function appendEvent(
		eventsArray: readonly LinkedInterceptEvent[],
		enriched: LinkedInterceptEvent,
	): void {
		const previousReference = eventListTail; // captured at define time, stable
		let nextReference: LinkedInterceptEvent | null = null;
		Object.defineProperty(enriched, 'prev', {
			get(): LinkedInterceptEvent | null {
				return previousReference;
			},
			enumerable: true,
			configurable: false,
		});
		Object.defineProperty(enriched, 'next', {
			get(): LinkedInterceptEvent | null {
				return nextReference;
			},
			enumerable: true,
			configurable: false,
		});
		// Wire the previous tail's `next` via its closure-held setter.
		if (setTailNext !== null) setTailNext(enriched);
		// Update tail state for the next iteration.
		eventListTail = enriched;
		setTailNext = (n) => {
			nextReference = n;
		};
		eventsArray.push(enriched);
		// Safe: prev/next are accessor properties; data fields were all
		// set by enrichEvent before appendEvent ran.
		Object.freeze(enriched);
	}

	// Queue + cancel plumbing — lives in the outer closure so cancel()
	// can reach wakeDequeue regardless of where the generator body is
	// suspended (before first iterate, mid-await, or mid-yield).
	const queue: readonly QueueMessage[] = [];
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
		return terminationCause?.kind;
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

	function enqueue(message: QueueMessage): void {
		queue.push(message);
		if (resolveWaiting !== null) {
			resolveWaiting();
			resolveWaiting = null;
		}
	}

	function dequeue(): Promise<QueueMessage> {
		if (queue.length > 0) {
			return Promise.resolve(queue.shift());
		}
		return new Promise<QueueMessage>((resolve) => {
			resolveWaiting = () => resolve(queue.shift());
		});
	}

	function cancel(): void {
		setTermination({ kind: 'cancel' });
		wakeDequeue();
	}

	function fail(reason?: unknown): void {
		setTermination({ kind: 'fail', reason });
		wakeDequeue();
	}

	async function* body(): AsyncGenerator<
		LinkedInterceptEvent,
		InterceptResult
	> {
		const resolvedOptions: InterceptOptions = options ?? {};
		const maxSeconds = resolvedOptions.seconds ?? 5;
		const maxIterations = resolvedOptions.iterations;
		const resolvedIo = buildResolvedIo(resolvedOptions.io);

		// 0. Consumer-initiated termination before first iterate — skip
		// all setup. Outcome + reason carry the signal; events stay empty
		// (no worker ran, no events were emitted). No AST built either.
		if (terminationCause?.kind === 'cancel') {
			resolveAst(null);
			return buildEarlyResult(code, resolvedOptions, 'cancel', []);
		}
		if (terminationCause?.kind === 'fail') {
			resolveAst(null);
			return buildEarlyResult(
				code,
				resolvedOptions,
				'fail',
				[],
				undefined,
				terminationCause.reason,
			);
		}

		// 1. Validation + format gates. validateProgram/checkFormat are
		// specified to never throw; any throw is caught here and
		// surfaced as a creation-phase ErrorEvent so iteration still
		// resolves cleanly rather than escaping to the consumer.
		// parsedProgram hoisted so the post-validation instrumentation
		// step can reach it without re-parsing.
		let parsedProgram: import('acorn').Program | null = null;
		try {
			const validationReport = validateProgram(code, justEnoughJs);
			if (validationReport.parseError) {
				resolveAst(null);
				return buildEarlyResult(code, resolvedOptions, 'error', [], {
					kind: 'parse',
					name: 'SyntaxError',
					message: validationReport.parseError.message,
					line: validationReport.parseError.location.line,
					column: validationReport.parseError.location.column,
				});
			}
			if (!validationReport.isValid) {
				resolveAst(null);
				return buildEarlyResult(code, resolvedOptions, 'error', [], {
					kind: 'validation',
					violations: validationReport.violations,
				});
			}
			// Successful validation — retain the AST for instrumentation,
			// build the LocationIndex now, and resolve handle.ast eagerly
			// so consumers can begin AST-shape work before the worker
			// even starts.
			parsedProgram = validationReport.ast!;
			locationIndex = buildLocationIndex(parsedProgram, code);
			resolveAst(toAstRecord(locationIndex.astByPath));

			const { formatted } = await checkFormat(code);
			if (!formatted) {
				return buildEarlyResult(code, resolvedOptions, 'error', [], {
					kind: 'formatting',
				});
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const name = error instanceof Error ? error.name : 'Error';
			const errorEvent: RunErrorEvent = {
				event: 'error',
				name,
				message,
				phase: 'creation',
				step: 1,
			};
			resolveAst(null);
			return buildEarlyResult(
				code,
				resolvedOptions,
				'error',
				[enrichEvent(errorEvent, locationIndex)],
				{
					kind: 'javascript',
					name,
					message,
					phase: 'creation',
				},
			);
		}

		// 2. Check SAB availability
		if (typeof SharedArrayBuffer === 'undefined') {
			const errorEvent: RunErrorEvent = {
				event: 'error',
				name: 'EnvironmentError',
				message:
					'SharedArrayBuffer is not available. The hosting page must ' +
					'serve Cross-Origin-Opener-Policy: same-origin and ' +
					'Cross-Origin-Embedder-Policy: require-corp headers.',
				phase: 'creation',
				step: 1,
			};
			return buildEarlyResult(
				code,
				resolvedOptions,
				'error',
				[enrichEvent(errorEvent, locationIndex)],
				{
					kind: 'javascript',
					name: errorEvent.name,
					message: errorEvent.message,
					phase: errorEvent.phase,
				},
			);
		}

		// 3a. Instrument: wrap every CallExpression with __$ic('nodePath', () => ...).
		// Trap functions inside the worker read __currentPath at fire time,
		// avoiding Error.stack parsing entirely. Lines preserved 1:1.
		// parsedProgram is non-null here because validation passed.
		let execCode = wrapCallExpressions(parsedProgram, code);

		// 3b. Apply loop guards if iterations limit is configured. Operates
		// on the INSTRUMENTED source — guard regex matches loop syntax which
		// is unaffected by the wrap (wraps only touch CallExpressions inside
		// loop bodies, not the loop headers).
		// Number.isFinite(Infinity) === false, so Infinity means "no guards";
		// any finite number (including 0 and negatives) injects guards, and
		// the `++loopN > maxIterations` template throws on the first iteration
		// for non-positive limits — counterintuitive otherwise.
		let loopCount = 0;
		if (maxIterations !== undefined && Number.isFinite(maxIterations)) {
			const guardResult = guardLoops(execCode, maxIterations);
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
		} catch (error: unknown) {
			URL.revokeObjectURL(url);
			const message =
				error instanceof Error ? error.message : 'Failed to create Worker';
			const errorEvent: RunErrorEvent = {
				event: 'error',
				name: 'WorkerError',
				message,
				phase: 'creation',
				step: 1,
			};
			return buildEarlyResult(
				code,
				resolvedOptions,
				'error',
				[enrichEvent(errorEvent, locationIndex)],
				{
					kind: 'javascript',
					name: errorEvent.name,
					message,
					phase: 'creation',
				},
			);
		}

		// 6. Wire up Worker callbacks (enqueue closes over outer queue state)
		worker.onmessage = function onWorkerMessage(
			e: MessageEvent<WorkerOutbound>,
		) {
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
				remainingMs -= YIELD_CHARGE_MS;
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

		const events: readonly LinkedInterceptEvent[] = [];

		try {
			while (true) {
				const message = await dequeue();

				// Termination check — first-write-wins via setTermination.
				// Whichever path got there first (cancel, timeout, worker-error)
				// is the cause; others are ignored. Cancellation supersedes any
				// in-flight event that arrived just before cancel fired.
				const cause = getTerminationKind();
				if (cause === 'cancel' || cause === 'fail') {
					// Consumer-initiated stop. Termination metadata goes on
					// the result (outcome + reason via buildResult); events
					// stay pure — no synthetic event is pushed here.
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
						step: events.length + 1,
					};
					const enriched = enrichEvent(timeoutEvent, locationIndex);
					appendEvent(events, enriched);
					yield enriched as unknown as LinkedInterceptEvent;
					break;
				}

				// 8a. Streamed event — route IO callback, yield to consumer
				if (message.type === 'event') {
					const { event } = message;
					const enriched = enrichEvent(event, locationIndex);
					appendEvent(events, enriched);

					// WHY pauseTimeout at the TOP of the event-path: the
					// cumulative timer counts only worker-thread code-execution
					// time. Console callback time, yield time, and consumer
					// processing time are all consumer/UI work. Matches the
					// IO-path discipline around handleIoRequest below. See
					// DOCS.md § Timer-vs-yield.
					pauseTimeout();

					if (event.event === 'console') {
						try {
							await resolvedIo.console[event.method](...event.args);
						} catch (error) {
							appendEvent(
								events,
								enrichEvent(
									makeInternalError(error, events.length + 1),
									locationIndex,
								),
							);
							break;
						}
					}

					yield enriched as unknown as LinkedInterceptEvent;

					// WHY termination check BEFORE releasing the Worker: if
					// cancel / fail fired during yield, we must NOT resume —
					// the finally block terminates the Worker still-paused.
					// Clean teardown. Loop-top check then breaks out on the
					// next iteration via the cause dispatch.
					{
						const postYieldCause = getTerminationKind();
						if (postYieldCause === 'cancel' || postYieldCause === 'fail')
							continue;
					}
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
				if (message.type === 'io-request') {
					pauseTimeout();
					try {
						await handleIoRequest(message, views, resolvedIo);
						Atomics.notify(views.control, CONTROL_INDEX);
					} catch (error) {
						appendEvent(
							events,
							enrichEvent(
								makeInternalError(error, events.length + 1),
								locationIndex,
							),
						);
						break;
					}
					startTimeout();
					continue;
				}

				// 8c. Complete — break out of loop
				if (message.type === 'complete') {
					break;
				}

				// 8d. Worker error — record and break
				if (message.type === 'worker-error') {
					appendEvent(
						events,
						enrichEvent(
							{
								event: 'error',
								name: 'WorkerError',
								message: message.message,
								phase: 'execution',
								step: events.length + 1,
							},
							locationIndex,
						),
					);
					break;
				}
			}
		} finally {
			clearTimeoutIfSet();
			worker.terminate();
			URL.revokeObjectURL(url);
		}

		// 9. Build result from collected events + terminationCause.
		// Consumer-initiated stops (cancel/fail) surface via outcome
		// + reason; engine-level failures (timeout, worker-error)
		// surface via errorEvent in events. The full-AST path through
		// `buildResult` calls `link()` to attach `.node` refs and
		// populate per-node `events[]` back-refs, then deep-freezes.
		return buildResult(
			code,
			resolvedOptions,
			events,
			maxSeconds,
			terminationCause,
			astRecord,
			maxIterations,
		);
	}

	const gen = body();

	// Replay support. Every path through which the InterceptResult emerges
	// goes through gen.next() returning {done:true, value}; we wrap
	// it once here to capture the settled value for replay. The
	// replayed event refs come from `value.events` — the same array
	// `body()` pushed into during live iteration, frozen in place by
	// buildResult. No clone; live and replay consumers see identical
	// event references. See DOCS.md § Replay / re-iteration.
	let isDone = false;
	let settledResult: InterceptResult | null = null;
	const origNext = gen.next.bind(gen);
	Object.defineProperty(gen, 'next', {
		value: async function interceptingNext(
			...arguments_: Parameters<typeof origNext>
		): Promise<IteratorResult<InterceptEvent, InterceptResult>> {
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
			const res = await origNext(...arguments_);
			// WHY the res.value !== undefined guard: the underlying
			// AsyncGenerator can emit {done:true, value:undefined} when
			// it has been aborted externally (e.g. .return() bypassing
			// our interceptor). Don't clobber settledResult with
			// undefined — interceptingReturn captures it authoritatively.
			if (res.done && res.value !== undefined) {
				isDone = true;
				settledResult = res.value;
			}
			return res;
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});
	// Intercept gen.return so for-await-break settles the InterceptResult
	// via the existing cancel path. Consumers who `break` out of a
	// live `for await (const e of gen)` get the same settled shape
	// as explicit `.cancel()` — outcome: 'cancel' on the result,
	// replay-identity preserved for worker-emitted events. See
	// DOCS.md § Replay and § Unified termination protocol.
	//
	// Invariants (from AR):
	// - Termination metadata (cancel/fail) lives on the InterceptResult as
	//   `outcome` + optional `reason`. Logs are pure worker events —
	//   no synthetic termination marker is pushed anywhere.
	// - Drive via origNext, never origReturn. Native .return() aborts
	//   body before buildResult — regresses to the pre-fix state.
	// - Short-circuit on isDone per ECMA-262 §27.6.3.3.
	Object.defineProperty(gen, 'return', {
		value: async function interceptingReturn(
			value?: InterceptResult,
		): Promise<IteratorResult<InterceptEvent, InterceptResult>> {
			if (isDone) {
				return {
					value: settledResult ?? (value as InterceptResult),
					done: true,
				};
			}
			if (terminationCause === null) cancel();
			while (!isDone) {
				const res = await origNext();
				if (res.done && res.value !== undefined) {
					isDone = true;
					settledResult = res.value;
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
	let resultPromise: Promise<InterceptResult> | null = null;
	function getResult(): Promise<InterceptResult> {
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

	// WHY defineProperty over Object.assign: the InterceptHandle type marks
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
	Object.defineProperty(gen, 'fail', {
		value: fail,
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
		value: function then<TResult1 = InterceptResult, TResult2 = never>(
			onFulfilled?:
				| ((value: InterceptResult) => TResult1 | PromiseLike<TResult1>)
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
		value: function asyncIterator(): AsyncIterator<
			LinkedInterceptEvent,
			InterceptResult
		> {
			// In-progress: delegate to the raw AsyncGenerator (which
			// returns `this`, so concurrent for-awaits silently split
			// via .next() serialization — DOCS.md § Replay).
			if (!isDone || settledResult === null) {
				return liveAsyncIterator() as unknown as AsyncIterator<
					LinkedInterceptEvent,
					InterceptResult
				>;
			}
			// Settled: fresh iterator replays the frozen event refs.
			// `result.events` (renamed from legacy `logs`) carries the
			// SAME LinkedInterceptEvent references the live iteration
			// yielded — this is the replay-identity invariant.
			const settled = settledResult;
			const { events } = settled;
			let index = 0;
			return {
				next(): Promise<IteratorResult<LinkedInterceptEvent, InterceptResult>> {
					if (index < events.length) {
						return Promise.resolve({ value: events[index++], done: false });
					}
					return Promise.resolve({ value: settled, done: true });
				},
			};
		},
		writable: false,
		configurable: false,
		enumerable: false,
	});

	// Eager handle data: code/options/ast are readable immediately
	// after construction, before any iteration. handle.ast resolves
	// when the validation gate completes (success → astByPath record;
	// failure → null). See DOCS.md § Eager handle data.
	Object.defineProperty(gen, 'code', {
		value: code,
		writable: false,
		configurable: false,
		enumerable: true,
	});
	Object.defineProperty(gen, 'options', {
		value: options ?? {},
		writable: false,
		configurable: false,
		enumerable: true,
	});
	Object.defineProperty(gen, 'ast', {
		value: astPromise,
		writable: false,
		configurable: false,
		enumerable: true,
	});

	return gen as unknown as InterceptHandle;
}

// --- Helpers ---

/**
 * Awaits the Resolved IO callback for a dialog io-request, then writes
 * the response to the SAB. Throws if the callback throws — caller
 * catches and surfaces as InternalError.
 */
async function handleIoRequest(
	message: IoRequestMessage,
	views: ReturnType<typeof createBufferViews>,
	resolvedIo: ResolvedIo,
): Promise<void> {
	const dialogMessage = String(message.args[0] ?? '');

	if (message.name === 'alert') {
		await resolvedIo.alert(dialogMessage);
		writeAlertResponse(views);
		return;
	}

	if (message.name === 'confirm') {
		const result = await resolvedIo.confirm(dialogMessage);
		writeConfirmResponse(views, result);
		return;
	}

	// msg.name === 'prompt'
	const defaultValue =
		message.args.length > 1 ? String(message.args[1] ?? '') : undefined;
	const result = await resolvedIo.prompt(dialogMessage, defaultValue);
	writePromptResponse(views, result);
}

/**
 * Builds a InterceptResult from the collected event logs + terminationCause.
 *
 * @remarks Sets the `outcome` field from:
 * - terminationCause is 'cancel' → `cancel` (consumer stopped)
 * - terminationCause is 'fail' → `fail` (consumer stopped with reason)
 * - TimeoutError in logs → `timeout`
 * - Iteration-limit RangeError in logs → `iteration-limit`
 * - Any other error event in logs → `error`
 * - Otherwise → `complete`
 *
 * Consumer-initiated stops take precedence over in-flight error events.
 * `logs` is a pure worker-emitted event stream — no synthetic cancel
 * marker is appended. The cancel/fail signal lives on outcome + reason.
 */
function buildResult(
	code: string,
	options: InterceptOptions,
	events: readonly LinkedInterceptEvent[],
	maxSeconds: number,
	terminationCause: TerminationCause | null,
	astRecord: Readonly<Record<string, ASTNode>> | null,
	maxIterations?: number,
): InterceptResult {
	// Events arrive already linked: `enrichEvent` (in the main loop)
	// resolves `.node` and pushes back-refs into `node.events[]` per
	// event before yielding. No post-completion link step needed.

	// Reuse the same Record reference the consumer awaited via
	// `handle.ast` — single-source-of-truth invariant per DOCS.md
	// § Navigation. `astRecord` was set by `resolveAst` at validation
	// time (or stays null if no AST was built). Building a fresh
	// Object.fromEntries here would produce a distinct shell with
	// the same inner ASTNode references — violating the invariant.
	const ast: Readonly<Record<string, ASTNode>> | null = astRecord;

	// Compute visitCounts from linked events. nodePath:null events
	// (no-ast / no-location) don't count toward any node.
	const visitCountsObject: Record<string, number> = {};
	for (const event of events) {
		if (event.nodePath !== null) {
			visitCountsObject[event.nodePath] =
				(visitCountsObject[event.nodePath] ?? 0) + 1;
		}
	}

	const baseFields = {
		events,
		code,
		options,
		ast,
		visitCounts: visitCountsObject as Readonly<Record<string, number>>,
	};

	if (terminationCause?.kind === 'cancel') {
		return deepFreezeInPlace({
			ok: true,
			outcome: 'cancel' as const,
			...baseFields,
		});
	}
	if (terminationCause?.kind === 'fail') {
		return deepFreezeInPlace({
			ok: true,
			outcome: 'fail' as const,
			reason: terminationCause.reason,
			...baseFields,
		});
	}

	const errorEvent = findErrorEvent(events);

	if (errorEvent) {
		if (errorEvent.name === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false,
				outcome: 'timeout' as const,
				error: {
					kind: 'timeout' as const,
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line === undefined ? {} : { line: errorEvent.line }),
					// Timeout fires only during worker execution; the type narrows
					// to the literal 'execution'. Construction-phase errors take a
					// different path (kind: 'javascript' below).
					phase: 'execution' as const,
					limit: maxSeconds,
				},
				...baseFields,
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
					kind: 'iteration-limit' as const,
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line === undefined ? {} : { line: errorEvent.line }),
					// Loop-guard RangeErrors are thrown inside running worker code,
					// never during construction. Type narrows to literal 'execution'.
					phase: 'execution' as const,
					limit: maxIterations,
				},
				...baseFields,
			});
		}

		return deepFreezeInPlace({
			ok: false,
			outcome: 'error' as const,
			error: {
				kind: 'javascript' as const,
				name: errorEvent.name,
				message: errorEvent.message,
				...(errorEvent.line === undefined ? {} : { line: errorEvent.line }),
				phase: errorEvent.phase,
			},
			...baseFields,
		});
	}

	return deepFreezeInPlace({
		ok: true,
		outcome: 'complete' as const,
		...baseFields,
	});
}

/**
 * Finds the last error event in a linked event array.
 */
function findErrorEvent(
	events: readonly LinkedInterceptEvent[],
): (RunErrorEvent & { readonly nodePath: string | null }) | undefined {
	for (let index = events.length - 1; index >= 0; index--) {
		const entry = events[index];
		if (entry.event === 'error') {
			return entry as RunErrorEvent & { readonly nodePath: string | null };
		}
	}
	return undefined;
}

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
	| { readonly kind: 'fail'; readonly reason: unknown }
	| { readonly kind: 'timeout' }
	| { readonly kind: 'worker-error' };

// Flat per-pause deduction representing the typical wall-clock cost
// of one event-cycle's consumer-side processing. Rounded up so a busy
// event loop times out at-or-before its `seconds` budget rather than
// after — see DOCS.md "Timer-vs-yield".
const YIELD_CHARGE_MS = 5;

// --- Resolved IO ---

const CONSOLE_METHODS: readonly ConsoleMethod[] = [
	'log',
	'debug',
	'info',
	'warn',
	'error',
	'assert',
	'table',
	'dir',
	'dirxml',
	'group',
	'groupCollapsed',
	'groupEnd',
	'count',
	'countReset',
	'time',
	'timeEnd',
	'timeLog',
	'trace',
	'clear',
];

type ResolvedConsole = Record<
	ConsoleMethod,
	(...arguments_: readonly unknown[]) => Promise<void>
>;

type ResolvedIo = {
	readonly prompt: (
		message: string,
		defaultValue?: string,
	) => Promise<string | null>;
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
			resolvedConsole[method] = async (...arguments_) => {
				await mock(...arguments_);
			};
		} else {
			const nativeFunction = (
				console as unknown as Record<
					ConsoleMethod,
					(...a: readonly unknown[]) => void
				>
			)[method];
			resolvedConsole[method] = async (...arguments_) => {
				nativeFunction?.(...arguments_);
			};
		}
	}

	return {
		prompt: io?.prompt
			? async (message, def) => io.prompt!(message, def)
			: async (message, def) =>
					def === undefined
						? globalThis.prompt(message)
						: globalThis.prompt(message, def),

		alert: io?.alert
			? async (message) => {
					await io.alert!(message);
				}
			: async (message) => {
					globalThis.alert(message);
				},

		confirm: io?.confirm
			? async (message) => io.confirm!(message)
			: async (message) => globalThis.confirm(message),
		console: resolvedConsole,
	};
}

// --- LinkedInterceptEvent enrichment helpers ---

/**
 * Enriches a worker-emitted `InterceptEvent` with AST navigation
 * fields (nodePath, nodePathSource, node, loc, callee, calleePath)
 * AND pushes the event into the resolved node's `events[]` back-ref
 * array. Entwining happens inline at emission time so consumers
 * iterating live see fully-linked events without waiting for run
 * completion.
 *
 * @remarks Mutates `event` in place to preserve reference identity
 * (load-bearing for the replay invariant: events yielded during
 * streaming must be `===` the same objects in `result.events`).
 *
 * Three branches:
 *
 * 1. **Worker-emitted with `nodePath` already set** (the happy path
 *    after the universal CallExpression wrap). Worker stamped
 *    `event.nodePath = __currentPath`. Stamp `nodePathSource:
 *    'instrumented'`, resolve `event.node` and `event.loc` from
 *    `locationIndex.astByPath[nodePath]`, push back-ref.
 * 2. **Residual error path** — runtime error fired OUTSIDE any
 *    wrapped CallExpression. Worker fell back to
 *    `extractPositionFromError` and emitted `line` (and maybe
 *    `column`) without `nodePath`. Look up via `lookupNodePath` to
 *    find the deepest containing AST node; stamp
 *    `nodePathSource: 'enclosing-fallback'`, resolve `event.node`
 *    and `event.loc`, push back-ref.
 * 3. **No AST built** — `locationIndex` is `null` (validation failed
 *    pre-parse) OR the event has no nodePath/line/column to look up.
 *    Stamp `nodePath: null, nodePathSource: 'no-ast', node: null,
 *    loc: null`. No back-ref to push.
 */
function enrichEvent(
	event: InterceptEvent,
	locationIndex: LocationIndex | null,
): LinkedInterceptEvent {
	const incomingNodePath = (event as { readonly nodePath?: string | null })
		.nodePath;

	// Branch 1: worker stamped nodePath via __$ic — instrumented path.
	if (typeof incomingNodePath === 'string' && locationIndex !== null) {
		const node = locationIndex.astByPath.get(incomingNodePath);
		const enriched = event as InterceptEvent & {
			readonly nodePath: string | null;
			readonly nodePathSource: NodePathSource;
			readonly node: ASTNode | null;
			readonly loc: {
				readonly start: { readonly line: number; readonly column: number };
				readonly end: { readonly line: number; readonly column: number };
			} | null;
			readonly callee: ASTNode | null;
			readonly calleePath: string | null;
		};
		enriched.nodePath = incomingNodePath;
		enriched.nodePathSource = 'instrumented';
		enriched.node = node ?? null;
		enriched.loc = node ? node.loc : null;
		// Direct callee navigation: only meaningful when node is a
		// CallExpression (the wrapped happy path). For non-call nodes
		// (residual error path), callee/calleePath stay null.
		if (node?.type === 'CallExpression') {
			const calleeReference = (
				node as unknown as { readonly callee: ASTNode | undefined }
			).callee;
			enriched.callee = calleeReference ?? null;
			enriched.calleePath = calleeReference ? calleeReference.syntaxId : null;
		} else {
			enriched.callee = null;
			enriched.calleePath = null;
		}
		// Push back-ref into node.events[] (the AST → events accessor).
		// Replaces what the post-completion `link()` step used to do; now
		// happens inline so consumers see populated back-refs mid-stream.
		if (node !== undefined) {
			node.events.push(enriched as unknown as LinkedInterceptEvent);
		}
		return enriched as unknown as LinkedInterceptEvent;
	}

	const { line } = event as { readonly line?: number };
	const { column } = event as { readonly column?: number };

	// Branch 3: no AST OR no usable position — no-ast.
	if (locationIndex === null || line === undefined || column === undefined) {
		const enriched = event as InterceptEvent & {
			readonly nodePath: string | null;
			readonly nodePathSource: NodePathSource;
			readonly node: ASTNode | null;
			readonly loc: {
				readonly start: { readonly line: number; readonly column: number };
				readonly end: { readonly line: number; readonly column: number };
			} | null;
			readonly callee: ASTNode | null;
			readonly calleePath: string | null;
		};
		enriched.nodePath = null;
		enriched.nodePathSource = 'no-ast';
		enriched.node = null;
		enriched.loc = null;
		enriched.callee = null;
		enriched.calleePath = null;
		return enriched as unknown as LinkedInterceptEvent;
	}

	// Branch 2: residual error path — fall back to (line, column) lookup.
	const lookup = lookupNodePath(locationIndex, line, column);
	const node = locationIndex.astByPath.get(lookup.nodePath);
	const enriched = event as InterceptEvent & {
		readonly nodePath: string;
		readonly nodePathSource: NodePathSource;
		readonly node: ASTNode | null;
		readonly loc: {
			readonly start: { readonly line: number; readonly column: number };
			readonly end: { readonly line: number; readonly column: number };
		} | null;
		readonly callee: ASTNode | null;
		readonly calleePath: string | null;
	};
	enriched.nodePath = lookup.nodePath;
	enriched.nodePathSource = lookup.source;
	enriched.node = node ?? null;
	enriched.loc = node ? node.loc : null;
	// Same CallExpression discriminator as Branch 1; residual lookups
	// usually land on non-call nodes (e.g. MemberExpression for
	// `let x = null.foo;`), in which case callee/calleePath stay null.
	if (node?.type === 'CallExpression') {
		const calleeReference = (
			node as unknown as { readonly callee: ASTNode | undefined }
		).callee;
		enriched.callee = calleeReference ?? null;
		enriched.calleePath = calleeReference ? calleeReference.syntaxId : null;
	} else {
		enriched.callee = null;
		enriched.calleePath = null;
	}
	// Push back-ref into node.events[] for residual-path attribution.
	if (node !== undefined) {
		node.events.push(enriched as unknown as LinkedInterceptEvent);
	}
	return enriched as unknown as LinkedInterceptEvent;
}

/**
 * Builds an InterceptResult for early-return paths that occur BEFORE
 * the AST exists (cancel/fail before iterate, validation/format/SAB
 * gate failures, Worker construction errors). Events on these paths
 * carry `nodePath: null, nodePathSource: 'no-ast', node: null` and
 * `result.ast` is `null`.
 *
 * For the post-execution full-AST path see `buildResult`.
 */
function buildEarlyResult(
	code: string,
	options: InterceptOptions,
	outcome: InterceptOutcome,
	events: readonly LinkedInterceptEvent[],
	error?: InterceptResultError,
	reason?: unknown,
): InterceptResult {
	const ok =
		outcome === 'complete' || outcome === 'cancel' || outcome === 'fail';
	const linked = events.map((e) => {
		const event = e as {
			readonly node: ASTNode | null;
			readonly callee: ASTNode | null;
			readonly calleePath: string | null;
		};
		event.node = null;
		event.callee = null;
		event.calleePath = null;
		return e as unknown as LinkedInterceptEvent;
	});
	// Wire prev/next as plain frozen properties — for one-shot finalization
	// the neighbor is known at build time, so accessor backing isn't needed.
	// Same observable shape as the streaming-path appendEvent helper.
	for (let index = 0; index < linked.length; index++) {
		const event = linked[index] as {
			readonly prev: LinkedInterceptEvent | null;
			readonly next: LinkedInterceptEvent | null;
		};
		event.prev = index > 0 ? (linked[index - 1] ?? null) : null;
		event.next = index + 1 < linked.length ? (linked[index + 1] ?? null) : null;
		Object.freeze(linked[index]);
	}
	return deepFreezeInPlace({
		ok,
		outcome,
		events: linked,
		...(error === undefined ? {} : { error }),
		...(reason === undefined ? {} : { reason }),
		code,
		options,
		ast: null as Readonly<Record<string, ASTNode>> | null,
		visitCounts: {} as Readonly<Record<string, number>>,
	});
}

// --- Internal error helper ---

function makeInternalError(error: unknown, step: number): RunErrorEvent {
	return {
		event: 'error',
		name: 'InternalError',
		message: error instanceof Error ? error.message : String(error),
		phase: 'execution',
		step,
	};
}
