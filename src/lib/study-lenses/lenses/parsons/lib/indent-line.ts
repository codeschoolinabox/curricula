import type { Arrangement } from '../types.js';

/** Increase a placed line's indent level by one. No-op if `id` is not placed. */
export default function indentLine(
	state: Arrangement,
	id: string,
): Arrangement {
	if (!state.solution.some((placed) => placed.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((placed) =>
			placed.id === id ? { id: placed.id, indent: placed.indent + 1 } : placed,
		),
	};
}
