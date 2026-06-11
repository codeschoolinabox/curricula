import type { Arrangement } from '../types.js';

/** Decrease a placed line's indent level by one, flooring at 0. No-op if `id` is not placed. */
export default function outdentLine(state: Arrangement, id: string): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((s) =>
			s.id === id ? { id: s.id, indent: Math.max(0, s.indent - 1) } : s,
		),
	};
}
