/**
 * @file Reset All — the "start over from the author's default" action.
 *
 * `resetAll` restores `snippet = originalCode`, `activeLens =
 * initialLens`, `activeTransforms = initialTransforms`, dispatches
 * `state-reset-all` with the full restored state, then disposes every
 * cached mount and clears the cache (DOCS.md §5b).
 *
 * @remarks Dispatch-before-disposal order is deterministic and
 * load-bearing (DOCS.md §Structural constraints):
 * 1. Compute the next `OrchestratorState` with the three fields
 *    reset (`snippetName` is NOT reset — DOCS.md §5b doesn't list it
 *    among the restored fields).
 * 2. `bus.dispatch('state-reset-all', { snippet, lens, transforms })`
 *    — listeners observe the pre-disposal cache; the active lens's
 *    own listeners run against an instance that is still mounted.
 * 3. `cache.visit(entry => entry.mount.dispose())` — every cached
 *    mount is disposed. A throwing dispose is caught + warned so one
 *    buggy lens does not strand the other cached instances.
 * 4. `cache.clear()` — cache is now empty; the new initial lens will
 *    mount fresh on next access.
 * 5. Return the new frozen state.
 *
 * Reset All is the ONLY action that clears the cache.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type createLensCache from './create-lens-cache.js';
import type { EventBus, LensMount, OrchestratorState } from './types.js';

type LensCache = ReturnType<typeof createLensCache>;

function disposeOne(entry: {
	readonly mount: LensMount;
	readonly name: string;
}) {
	try {
		entry.mount.dispose();
	} catch (error) {
		console.warn(
			`Reset All: dispose on mount "${entry.name}" threw; continuing with remaining mounts`,
			error,
		);
	}
}

/**
 * Restores the orchestrator to its initial state and clears the cache.
 *
 * @param state - Current orchestrator state.
 * @param cache - The per-instance lens cache; every entry's `mount`
 *   is disposed and then the cache is cleared.
 * @param bus - The per-instance EventBus; used to dispatch
 *   `state-reset-all` with the full restored state BEFORE disposal.
 * @returns A new frozen `OrchestratorState` with `snippet`,
 *   `activeLens`, and `activeTransforms` restored to their
 *   `original*`/`initial*` counterparts. `snippetName` is unchanged
 *   (per DOCS.md §5b, which lists the restored fields explicitly).
 */
function resetAll(
	state: OrchestratorState,
	cache: LensCache,
	bus: EventBus,
): OrchestratorState {
	const { originalCode, initialLens, initialTransforms } = state;
	const nextState = freezeInPlace({
		...state,
		snippet: originalCode,
		activeLens: initialLens,
		activeTransforms: initialTransforms,
	});

	bus.dispatch('state-reset-all', {
		snippet: originalCode,
		lens: initialLens,
		transforms: initialTransforms,
	});

	cache.visit(disposeOne);
	cache.clear();

	return nextState;
}

export default resetAll;
