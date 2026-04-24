/**
 * @file Reset the orchestrator snippet to the original code (code-only reset).
 *
 * `resetSnippet` implements the **Reset** toolbar action: restore
 * `state.snippet` to `state.originalCode`, dispatch `state-reset`, and
 * push the restored snippet into every cached mount via the
 * `onSnippetChanged` IoC hook. Does NOT touch `activeLens`,
 * `activeTransforms`, `snippetName`, or the cache itself — stale-aware
 * reattachment is the orchestrator's responsibility, not a
 * cache-invalidation side effect (DOCS.md §5a).
 *
 * @remarks Dispatch-then-propagate order is deterministic:
 * 1. Compute the next `OrchestratorState` with `snippet = originalCode`.
 * 2. `bus.dispatch('state-reset', { snippet: originalCode })` — fires
 *    synchronously; listeners observe the reset before cached mounts do.
 * 3. `cache.visit(entry => entry.mount.onSnippetChanged?.(originalCode))`
 *    — every cached mount that declares the hook absorbs the change per
 *    its own semantics (editor appends an external edit preserving undo;
 *    blanks re-blanks; parsons reshuffles). Mounts without the hook
 *    retain their state; next reattach surfaces the stale-state
 *    affordance per DOCS.md §3.
 * 4. Return the new frozen state.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type createLensCache from './create-lens-cache.js';
import type { EventBus, LensMount, OrchestratorState } from './types.js';

type LensCache = ReturnType<typeof createLensCache>;

/**
 * Resets the orchestrator snippet to the original code.
 *
 * @param state - Current orchestrator state.
 * @param cache - The per-instance lens cache; iterated to push the
 *   restored snippet into every cached mount with an
 *   `onSnippetChanged` hook.
 * @param bus - The per-instance EventBus; used to dispatch
 *   `state-reset` once, before the IoC push.
 * @returns A new frozen `OrchestratorState` identical to the input
 *   except `snippet` is reset to `state.originalCode`.
 */
function resetSnippet(
	state: OrchestratorState,
	cache: LensCache,
	bus: EventBus,
): OrchestratorState {
	const { originalCode } = state;
	const nextState = freezeInPlace({ ...state, snippet: originalCode });
	bus.dispatch('state-reset', { snippet: originalCode });

	function pushReset(entry: { readonly mount: LensMount; readonly name: string }) {
		const hook = entry.mount.onSnippetChanged;
		if (!hook) return;
		try {
			hook(originalCode);
		} catch (error) {
			console.warn(
				`Reset: onSnippetChanged on mount "${entry.name}" threw; continuing with remaining mounts`,
				error,
			);
		}
	}

	cache.visit(pushReset);
	return nextState;
}

export default resetSnippet;
