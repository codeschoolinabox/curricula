import type { Arrangement } from '../types.js';

/**
 * Move a line from the pool into the solution column at `index`, starting it
 * at indent level 0. No-op (returns the input ref) if `id` is not currently
 * in the pool. `index` is clamped to `[0, solution.length]`. Assumes the
 * partition invariant holds (an id is never in both pool and solution); it
 * does not guard against a dual-presence id, which no transition in this
 * module can produce.
 */
export default function placeFromPool(
	state: Arrangement,
	id: string,
	index: number,
): Arrangement {
	if (!state.pool.includes(id)) return state;
	const at = Math.max(0, Math.min(index, state.solution.length));
	return {
		pool: state.pool.filter((pooledId) => pooledId !== id),
		solution: [
			...state.solution.slice(0, at),
			{ id, indent: 0 },
			...state.solution.slice(at),
		],
	};
}
