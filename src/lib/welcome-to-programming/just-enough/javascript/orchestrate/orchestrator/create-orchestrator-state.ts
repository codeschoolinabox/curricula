/**
 * @file Orchestrator state factory.
 *
 * `createOrchestratorState` builds the initial per-instance state for
 * a `<StudyLenses>` orchestrator from the resolved props (originalCode,
 * validated pipeline lens + transforms, optional snippet name).
 *
 * @remarks
 * The factory is pure: given the same input, it produces an
 * equivalent-by-value `OrchestratorState` every time. At creation, the
 * mutable fields start equal to their immutable counterparts — `snippet
 * === originalCode`, `activeLens === initialLens`, `activeTransforms ===
 * initialTransforms` — so the first render reflects the author's chosen
 * configuration. Transitions (applied by future increments) produce new
 * frozen state objects via functional update; this factory does not
 * provide setters.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { OrchestratorState } from '../types.js';

type InitialOrchestratorState = {
	readonly originalCode: string;
	readonly initialLens: string;
	readonly initialTransforms: ReadonlyArray<string>;
	readonly snippetName?: string;
};

/**
 * Builds the initial frozen `OrchestratorState` from resolved props.
 *
 * @param initial - Resolved props. `originalCode` is the immutable reset
 *   target; `initialLens` and `initialTransforms` are pinned from
 *   validated pipeline; `snippetName` defaults to the empty string.
 * @returns A new frozen `OrchestratorState`. `snippet`, `activeLens`,
 *   and `activeTransforms` start equal to their `initial*` counterparts.
 */
function createOrchestratorState(
	initial: InitialOrchestratorState,
): OrchestratorState {
	const {
		originalCode,
		initialLens,
		initialTransforms,
		snippetName = '',
	} = initial;
	const frozenTransforms = freezeInPlace([...initialTransforms]);
	return freezeInPlace({
		originalCode,
		snippet: originalCode,
		initialLens,
		activeLens: initialLens,
		initialTransforms: frozenTransforms,
		activeTransforms: frozenTransforms,
		snippetName,
	});
}

export default createOrchestratorState;
