// cspell:ignore outdent

import type { Arrangement } from '../types.js';

/**
 * Decrease a placed line's indent level by one, flooring at 0. No-op if `id`
 * is not placed.
 */
export default function outdentLine(
	state: Arrangement,
	id: string,
): Arrangement {
	if (!state.solution.some((placed) => placed.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((placed) =>
			placed.id === id
				? { id: placed.id, indent: Math.max(0, placed.indent - 1) }
				: placed,
		),
	};
}
