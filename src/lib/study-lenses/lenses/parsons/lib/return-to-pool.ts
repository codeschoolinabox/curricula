import type { Arrangement } from '../types.js';

/**
 * Remove a placed line from the solution and return it to the end of the pool
 * (discarding its indent level). No-op if `id` is not in the solution.
 */
export default function returnToPool(state: Arrangement, id: string): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: [...state.pool, id],
		solution: state.solution.filter((s) => s.id !== id),
	};
}
