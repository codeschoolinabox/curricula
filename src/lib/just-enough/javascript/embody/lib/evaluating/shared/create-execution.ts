/**
 * @file Factory that wraps an async generator into an Execution object.
 *
 * Each engine builds its own async generator (yielding events, returning
 * a result) and passes it here. The factory adds PromiseLike backward
 * compatibility, re-iteration support, and cancellation.
 *
 * @remarks Per AGENTS.md: no classes. Returns a plain object with
 * closure-captured state. The factory knows nothing about Workers,
 * SABs, or engines — it only wraps generators.
 */

import type { Execution } from './types.js';

/**
 * Wraps an async generator function into an `Execution` object.
 *
 * @remarks The returned object is:
 * - `AsyncIterable<TEvent>` — for step-through consumption
 * - `PromiseLike<TResult>` — for batch consumption (`await execution`)
 * - Has `.result` Promise and `.cancel()` method
 *
 * **First iteration** runs the generator live. Events are collected
 * into an internal buffer as they are yielded.
 *
 * **Second+ iteration** replays from the cached `.result.logs` array
 * (no re-execution).
 *
 * **PromiseLike** delegates `.then()` to `.result`. If nobody iterates,
 * an internal drain loop consumes all events so `.result` resolves.
 *
 * **cancel()** calls `.return()` on the generator (if still running)
 * and is idempotent. After cancel, `.result` resolves with whatever
 * partial result the generator returns from its finally block.
 *
 * @param generatorFn - Factory that creates the async generator.
 *   Called lazily on first iteration or when `.result` is awaited.
 * @param cancelFn - Called when `.cancel()` is invoked. Should
 *   terminate any external resources (Workers, iframes). Idempotent.
 * @returns An Execution object
 */
export default function createExecution<TEvent, TResult>(
	generatorFn: () => AsyncGenerator<TEvent, TResult>,
	cancelFn: () => void,
): Execution<TEvent, TResult> {
	let generator: AsyncGenerator<TEvent, TResult> | null = null;
	let done = false;
	let resolvedResult: TResult | null = null;
	// WHY hasResult: resolvedResult uses null as "not set" but TResult is
	// generic and could be null legitimately. hasResult is the real sentinel.
	let hasResult = false;
	let drainStarted = false;
	let cancelled = false;
	// WHY resolveResultPromise: cancel() and drain() both need to resolve
	// the shared resultPromise. Extracted so cancel() can resolve it
	// directly after generator.return() instead of waiting for drain().
	let resolveResultPromise: ((value: TResult) => void) | null = null;
	let rejectResultPromise: ((reason: unknown) => void) | null = null;

	// Lazily create the generator
	function getGenerator(): AsyncGenerator<TEvent, TResult> {
		if (generator === null) {
			generator = generatorFn();
		}
		return generator;
	}

	// Internal drain: consume all events, resolve to result.
	// Started lazily when .result or .then() is accessed before
	// anyone iterates, OR after the first iteration completes.
	async function drain(): Promise<TResult> {
		// WHY check done first: if live iteration already completed,
		// resolvedResult is set. Return it directly — returning
		// resultPromise here would deadlock (circular: resultPromise
		// waits for drain(), drain() returns resultPromise).
		if (done && hasResult) {
			return resolvedResult as TResult;
		}
		if (drainStarted || cancelled) {
			return resultPromise;
		}
		drainStarted = true;

		const gen = getGenerator();
		try {
			let next = await gen.next();
			while (!next.done) {
				next = await gen.next();
			}
			done = true;
			resolvedResult = next.value;
			hasResult = true;
			return next.value;
		} catch {
			// Generator threw — should not happen per error-as-data
			// convention, but handle gracefully. Set hasResult so replay
			// returns empty instead of trying to iterate a dead generator.
			done = true;
			hasResult = true;
			resolvedResult = null;
			throw new Error('Execution generator threw unexpectedly');
		}
	}

	// The result Promise — created eagerly so multiple .then() calls
	// share the same Promise. The drain starts when first accessed.
	const resultPromise: Promise<TResult> = new Promise((resolve, reject) => {
		resolveResultPromise = resolve;
		rejectResultPromise = reject;
		// Use queueMicrotask to allow the consumer to set up iteration
		// before the drain starts. If they iterate first, drain() will
		// be a no-op (drainStarted = true from the iterator).
		queueMicrotask(() => {
			if (cancelled) return;
			drain().then(resolve, reject);
		});
	});

	function cancel(): void {
		if (cancelled) return;
		cancelled = true;

		if (!done && generator !== null) {
			// WHY await .return(): generator.return() triggers the finally
			// block which returns the partial result. We need that value
			// to resolve resultPromise (otherwise it deadlocks when
			// break in for-await is followed by await .result).
			const returnResult = generator.return(undefined as unknown as TResult);
			returnResult.then(
				function onCancelResult(iterResult) {
					done = true;
					// Spec: generator.return() resolves with done:true, so
					// iterResult.value is TResult, not TEvent. Guard narrows
					// the IteratorResult<TEvent, TResult> union for TS.
					if (!iterResult.done) return;
					resolvedResult = iterResult.value;
					hasResult = true;
					if (resolveResultPromise) {
						resolveResultPromise(iterResult.value);
						resolveResultPromise = null;
					}
				},
				function onCancelError(err) {
					done = true;
					if (rejectResultPromise) {
						rejectResultPromise(err);
						rejectResultPromise = null;
					}
				},
			);
		} else if (!done && generator === null) {
			// Cancel before iteration — generator was never created.
			// The queueMicrotask drain will see cancelled=true and skip.
			// Resolve resultPromise with undefined (no execution occurred).
			done = true;
			hasResult = true;
			if (resolveResultPromise) {
				resolveResultPromise(undefined as unknown as TResult);
				resolveResultPromise = null;
			}
		}

		cancelFn();
	}

	// First iteration: live generator. Second+: replay from cache.
	function createIterator(): AsyncIterator<TEvent> {
		if (done && hasResult) {
			// Replay from cached result
			const logs = (resolvedResult as Record<string, unknown>).logs as
				| readonly TEvent[]
				| undefined;
			const items = logs ?? [];
			let index = 0;

			return {
				next(): Promise<IteratorResult<TEvent>> {
					if (index < items.length) {
						return Promise.resolve({
							value: items[index++],
							done: false,
						});
					}
					return Promise.resolve({
						value: undefined as unknown as TEvent,
						done: true,
					});
				},
			};
		}

		// Live iteration — mark drain as started so the eager drain
		// doesn't race with us
		drainStarted = true;
		const gen = getGenerator();

		return {
			async next(): Promise<IteratorResult<TEvent>> {
				const result = await gen.next();
				if (result.done) {
					done = true;
					resolvedResult = result.value;
					hasResult = true;
					// WHY resolve here: the queueMicrotask drain sees
					// drainStarted=true and returns resultPromise (self-ref).
					// Resolving directly avoids the circular dependency.
					if (resolveResultPromise) {
						resolveResultPromise(result.value);
						resolveResultPromise = null;
					}
					return { value: undefined as unknown as TEvent, done: true };
				}
				return { value: result.value, done: false };
			},
			async return(): Promise<IteratorResult<TEvent>> {
				cancel();
				return { value: undefined as unknown as TEvent, done: true };
			},
		};
	}

	const execution: Execution<TEvent, TResult> = {
		[Symbol.asyncIterator](): AsyncIterator<TEvent> {
			return createIterator();
		},

		then<TFulfilled = TResult, TRejected = never>(
			onfulfilled?:
				| ((value: TResult) => TFulfilled | PromiseLike<TFulfilled>)
				| null,
			onrejected?:
				| ((reason: unknown) => TRejected | PromiseLike<TRejected>)
				| null,
		): Promise<TFulfilled | TRejected> {
			return resultPromise.then(onfulfilled, onrejected);
		},

		get result(): Promise<TResult> {
			return resultPromise;
		},

		cancel,
	};

	return execution;
}
