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
	let drainStarted = false;

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
		if (drainStarted) {
			// Already draining or drained — wait for result
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
			return next.value;
		} catch {
			// Generator threw — should not happen per error-as-data
			// convention, but handle gracefully
			done = true;
			throw new Error('Execution generator threw unexpectedly');
		}
	}

	// The result Promise — created eagerly so multiple .then() calls
	// share the same Promise. The drain starts when first accessed.
	const resultPromise: Promise<TResult> = new Promise((resolve, reject) => {
		// Use queueMicrotask to allow the consumer to set up iteration
		// before the drain starts. If they iterate first, drain() will
		// be a no-op (drainStarted = true from the iterator).
		queueMicrotask(() => {
			drain().then(resolve, reject);
		});
	});

	function cancel(): void {
		if (!done && generator !== null) {
			generator.return(undefined as unknown as TResult);
		}
		cancelFn();
	}

	// First iteration: live generator. Second+: replay from cache.
	function createIterator(): AsyncIterator<TEvent> {
		if (done && resolvedResult !== null) {
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
