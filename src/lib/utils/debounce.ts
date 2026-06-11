/**
 * @file Debounce utility — `debounce(fn, ms)` with `.cancel()`.
 *
 * Trailing-edge debounce: the returned wrapper defers the function until `ms`
 * have elapsed with no further calls. Rapid calls within the window reset the
 * timer, and the last call's arguments win. The wrapper carries a `.cancel()`
 * method that clears any pending invocation (a no-op when nothing is pending),
 * which is what makes it safe to call from a React effect cleanup.
 *
 * Leaf utility — domain-agnostic, no dependencies beyond the host timer API.
 */

/**
 * Wraps a function so it runs once after `ms` of idle, on the trailing edge.
 *
 * Each call to the wrapper resets the idle window; if the window elapses with no
 * further calls, the function runs once with the most recent call's arguments.
 * The wrapper returns `void` — the deferred call has no synchronous result. Call
 * `.cancel()` to drop any pending invocation (no-op when nothing is pending).
 *
 * @param function_ - The function to defer
 * @param ms - Idle window in milliseconds
 * @returns A debounced wrapper with a `.cancel()` method
 *
 * @example
 * const refresh = debounce(loadData, 200);
 * refresh('a'); refresh('b');     // only the 'b' call survives
 * // ...200ms later → loadData('b') runs once
 * refresh.cancel();               // drop a pending invocation
 */
export default function debounce<A extends unknown[]>(
	function_: (...arguments_: A) => void,
	ms: number,
): DebouncedFunction<A> {
	// Mutable closure for the live timer handle — the deliberate low-level
	// exception in DEV.md §8 (interfacing with the stateful setTimeout API). A
	// debounce cannot exist without holding the pending timer to reset/cancel it.
	// `undefined` means "nothing pending"; every path that ends a window restores
	// that state, so the invariant reads straight off the variable.
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function debounced(...arguments_: A): void {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(function fire(): void {
			// Clear the handle BEFORE the call so a re-entrant `debounced()` from
			// inside the function schedules cleanly instead of being wiped after.
			timeoutId = undefined;
			function_(...arguments_);
		}, ms);
	}

	// `Object.assign` attaches `.cancel` and types the result as the
	// callable-with-method `DebouncedFunction` (function ⊕ { cancel }).
	// eslint-disable-next-line functional/immutable-data -- only way to attach a typed property to a function; `debounced` is fresh + in-scope, so the mutation never escapes
	return Object.assign(debounced, {
		cancel(): void {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		},
	});
}

/**
 * A debounced wrapper: callable like the wrapped function (returning `void`,
 * since the call is deferred) with an attached `.cancel()` to drop a pending
 * invocation.
 */
type DebouncedFunction<A extends unknown[]> = ((...arguments_: A) => void) & {
	cancel: () => void;
};
