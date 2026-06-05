/**
 * @file Pure reducer for the learner's Parsons arrangement — NEW code. The
 * testable heart of the native HTML5 drag-and-drop interaction: the wrapper's
 * `onDrop` / indent-control handlers are thin adapters that derive an index and
 * call one of these transitions, so the reordering LOGIC is unit-tested without
 * a DOM (jsdom does not implement real drag-and-drop). See `../README.md`
 * § Interaction contract and `../DOCS.md` § "Why a pure arrange.ts reducer".
 *
 * Every transition is pure: it takes an `Arrangement` and returns a NEW
 * `Arrangement`, never mutating the input. Each preserves the invariant that
 * every line id is in exactly one of `pool` / `solution`. An operation on an id
 * that is not where it is expected (e.g. placing an id not in the pool) is a
 * no-op that returns the input unchanged.
 *
 * Pure. Lives under `lib/` (eslint-ignored carve-out) but is our code.
 */

import type { Arrangement } from '../types.js';

/**
 * The starting arrangement: all pool ids available, the solution column empty.
 *
 * @param poolIds the shuffled line ids from `ParsedParsons.pool`.
 */
export function initialArrangement(
	poolIds: ReadonlyArray<string>,
): Arrangement {
	return { pool: [...poolIds], solution: [] };
}

/**
 * Move a line from the pool into the solution column at `index`, starting it at
 * indent level 0. No-op (returns the input ref) if `id` is not currently in the
 * pool. `index` is clamped to `[0, solution.length]`. Assumes the partition
 * invariant holds (an id is never in both pool and solution); it does not guard
 * against a dual-presence id, which no transition in this module can produce.
 */
export function placeFromPool(
	state: Arrangement,
	id: string,
	index: number,
): Arrangement {
	if (!state.pool.includes(id)) return state;
	const at = Math.max(0, Math.min(index, state.solution.length));
	return {
		pool: state.pool.filter((p) => p !== id),
		solution: [
			...state.solution.slice(0, at),
			{ id, indent: 0 },
			...state.solution.slice(at),
		],
	};
}

/**
 * Move an already-placed line to a new position within the solution column,
 * **preserving its indent level**. `index` is clamped to
 * `[0, state.solution.length - 1]` (the input length minus one): the line is
 * removed, then spliced back in at the clamped index of the now-(length-1)
 * array, so the maximum index appends to the end. No-op (returns the input ref)
 * if `id` is not in the solution.
 *
 * Note: reordering to a line's CURRENT position still returns a NEW `Arrangement`
 * (not the input ref), so it would trigger a `useReducer` re-render. Callers that
 * want to skip that should short-circuit at dispatch when the source and target
 * indices are equal.
 */
export function reorderWithinSolution(
	state: Arrangement,
	id: string,
	index: number,
): Arrangement {
	const line = state.solution.find((s) => s.id === id);
	if (line === undefined) return state;
	const without = state.solution.filter((s) => s.id !== id);
	const at = Math.max(0, Math.min(index, state.solution.length - 1));
	return {
		pool: state.pool,
		solution: [...without.slice(0, at), line, ...without.slice(at)],
	};
}

/**
 * Remove a placed line from the solution and return it to the end of the pool
 * (discarding its indent level). No-op if `id` is not in the solution.
 */
export function returnToPool(state: Arrangement, id: string): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: [...state.pool, id],
		solution: state.solution.filter((s) => s.id !== id),
	};
}

/** Increase a placed line's indent level by one. No-op if `id` is not placed. */
export function indentLine(state: Arrangement, id: string): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((s) =>
			s.id === id ? { id: s.id, indent: s.indent + 1 } : s,
		),
	};
}

/** Decrease a placed line's indent level by one, flooring at 0. No-op if `id` is not placed. */
export function outdentLine(state: Arrangement, id: string): Arrangement {
	if (!state.solution.some((s) => s.id === id)) return state;
	return {
		pool: state.pool,
		solution: state.solution.map((s) =>
			s.id === id ? { id: s.id, indent: Math.max(0, s.indent - 1) } : s,
		),
	};
}
