/**
 * @file The `trace-debugging` lens's async orchestration seam — the async heart
 * of the lens, factored out of the React shell for **Node-testability, not
 * reuse** (see `./DOCS.md` § Why the orchestration seam exists). `runTrace` owns
 * the four moving parts of a streamed trace run, none of which the React wrapper
 * can exercise without jsdom plus a faked worker:
 *
 * 1. **The call (channel 1)** — the embody call wrapped in a `try/catch`, so a
 *    synchronous admission throw routes to `onAdmissionError` and no run happens.
 * 2. **The drain** — a `for await` that pulls every streamed event to completion,
 *    appending each through `onEvent` ONLY when mounted. The mounted-guard gates
 *    the callback, never the pull: an abandoned `for await` imposes backpressure
 *    and hangs the worker (`./DOCS.md` § no-undrained-iterable invariant).
 * 3. **The settle (channel 2)** — `await handle.result` once, surfacing only the
 *    settlement (`result.events` is ignored — the stream is the single source of
 *    truth) through `onSettlement` when mounted. Channel 2 never throws.
 * 4. **Idempotent cancel** — a null-safe, idempotent `cancel` (a no-op pre-run /
 *    post-settle / on a second call), plus a guarded `finally` cancel so the
 *    drain is total: `done` resolves on every path and never rejects.
 *
 * @remarks Imports ZERO React — the layer boundary stays honest. Trace types are
 * imported TYPE-ONLY from `../../embody/types.js` (lens purity forbids a runtime
 * import from `embody/`). Driven in plain Node against a fake handle injected via
 * the `start` thunk — see `./tests/run-trace.test.ts`.
 */

import type { VariablesTraceHandle } from '../../../embody/types.js';

import type { RunTrace } from './types.js';

/** Shared no-op cancel for the channel-1 (never-started) controller. */
function noop(): void {
	// Intentionally empty — no run to cancel (a channel-1 admission throw, or a
	// controller whose run never started).
}

/**
 * The orchestration seam (signature `RunTrace`, locked in `./types.ts`).
 *
 * Returns the `TraceController` **synchronously** — before the first event — so
 * Stop can cancel immediately; the drain runs in the detached `drainAndSettle`
 * promise stored as `done`. A synchronous `start()` throw is channel 1: surface
 * it raw and return an inert controller (no handle, nothing to drain, `done`
 * already resolved). Otherwise the drain pulls every event (mounted-guarding the
 * callback, never the pull), reads `result` once for the settlement (ignoring
 * `result.events`), and — through a swallowing `catch` plus a guarded `finally`
 * cancel — guarantees `done` resolves on every path and never rejects, which is
 * why the React shell may ignore it (store the controller, never read `done`)
 * without a `.catch` (`void` is banned by `sonarjs/void-use`).
 */
const runTrace: RunTrace = function runTrace(start, callbacks, isMounted) {
	let handle: VariablesTraceHandle;
	try {
		handle = start(); // CHANNEL 1: the embody call may throw synchronously.
	} catch (error) {
		// Inadmissible input — no run happened. Surface the raw throw (the shell
		// formats it via `core.formatAdmissionError`) and settle `done` now. The
		// mounted-guard is applied uniformly to every state-bearing callback — at
		// this synchronous click-time the wrapper is always mounted, so the guard
		// never actually gates here, but it keeps the contract uniform.
		if (isMounted()) {
			callbacks.onAdmissionError(error);
		}
		return Object.freeze({ cancel: noop, done: Promise.resolve() });
	}
	// TS narrowing: `let` is required because the assignment lives in the `try`;
	// this `const` alias gives the closures below a definitely-assigned handle.
	const liveHandle = handle;

	/**
	 * Best-effort, idempotent teardown. The handle's `cancel` is contracted
	 * idempotent but NOT no-throw (it forwards bare to the worker/iframe
	 * teardown), so a throwing cancel is swallowed — stop is first-write-wins and
	 * a no-op after settle.
	 */
	function cancel(): void {
		try {
			liveHandle.cancel();
		} catch {
			// Swallow a throwing teardown — best-effort, idempotent.
		}
	}

	/**
	 * Drains the stream, settles channel 2, fires the mounted-guarded callbacks,
	 * and tears the handle down on every path. The swallowing `catch` (a throwing
	 * callback, a rejected pull) plus the guarded `finally` cancel are what make
	 * `done` resolve always and never reject.
	 */
	async function drainAndSettle(): Promise<void> {
		try {
			for await (const event of liveHandle) {
				// The mounted-guard gates the CALLBACK only — never the pull. The
				// loop drains to `{ done: true }` so no undrained iterable hangs
				// the worker (M2).
				if (isMounted()) {
					callbacks.onEvent(event);
				}
			}
			// CHANNEL 2: read the `result` getter exactly once (a cleanliness
			// discipline — a second read re-mints harmlessly) and surface ONLY the
			// settlement; `result.events` is ignored (the stream is the single
			// source of truth — S1). Channel 2 never throws.
			const { settlement } = await liveHandle.result;
			if (isMounted()) {
				callbacks.onSettlement(settlement);
			}
		} catch {
			// Swallow any drain / callback throw so `done` resolves and never
			// rejects. A throwing `onEvent` already routed teardown through the
			// iterator's `return()`; the `finally` below is belt-and-suspenders.
		} finally {
			cancel(); // Teardown on EVERY path; an idempotent no-op once settled.
		}
	}

	return Object.freeze({ cancel, done: drainAndSettle() });
};

export default runTrace;
