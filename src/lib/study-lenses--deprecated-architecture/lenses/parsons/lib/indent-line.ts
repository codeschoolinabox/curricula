import type { Arrangement } from '../types.js';

/** Increase a placed line's indent level by one. No-op if `id` is not placed. */
export default function indentLine(
	state: Arrangement,
	id: string,
): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((s) =>
			s.id === id ? { id: s.id, indent: s.indent + 1 } : s,
		),
	};
}
