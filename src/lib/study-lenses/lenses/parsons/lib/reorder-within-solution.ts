import type { Arrangement } from '../types.js';

/**
 * Move an already-placed line to a new position within the solution column,
 * **preserving its indent level**. `index` is clamped to
 * `[0, state.solution.length - 1]` (the input length minus one): the line is
 * removed, then spliced back in at the clamped index of the now-(length-1)
 * array, so the maximum index appends to the end. No-op (returns the input
 * ref) if `id` is not in the solution.
 *
 * @remarks
 * Reordering to a line's CURRENT position still returns a NEW `Arrangement`
 * (not the input ref), so it would trigger a `useReducer` re-render. Callers
 * that want to skip that should short-circuit at dispatch when the source
 * and target indices are equal.
 */
export default function reorderWithinSolution(
	state: Arrangement,
	id: string,
	index: number,
): Arrangement {
	const line = state.solution.find((placed) => placed.id === id);
	if (line === undefined) return state;
	const without = state.solution.filter((placed) => placed.id !== id);
	const at = Math.max(0, Math.min(index, state.solution.length - 1));
	return {
		pool: state.pool,
		solution: [...without.slice(0, at), line, ...without.slice(at)],
	};
}
