/**
 * @file The ladder pass — orders the merged, mixed-register item stream by
 * difficulty: each item's MOST-CONCRETE Block level (`atom < block < relation <
 * macro`), ties broken by the item's original (emission / source) order, and
 * zero-cell (unleveled) items sorted last. Pure and total; returns a new frozen
 * array. See `./DOCS.md` § Execution phases (Ladder) and the ladder-rank rule.
 */

import type { BlockLevel } from '../../orchestrate/lib/socratizing/types.js';

import type { OrchestratedItem } from './types.js';

/**
 * Ladder rank per Block level (most concrete = lowest). A
 * `Readonly<Record<BlockLevel, number>>` (not an ordered array + `indexOf`) so a
 * future `BlockLevel` member is a compile error here rather than a silent `-1`
 * mis-rank.
 */
const LEVEL_RANK: Readonly<Record<BlockLevel, number>> = {
	atom: 0,
	block: 1,
	relation: 2,
	macro: 3,
};

/**
 * One past the coarsest level — unleveled (zero-cell) items fold here (via the
 * `Math.min` seed), so they sort strictly last. Derived from the rank table so it
 * tracks any added level.
 */
const ZERO_CELL_RANK = Object.keys(LEVEL_RANK).length;

/**
 * Order the stream by most-concrete Block level, ties by original position,
 * zero-cell items last. Decorate each item with its rank and original index,
 * sort by `(rank, index)` (an explicit stable tie-break — the emission order is a
 * load-bearing contract, not left to engine sort stability), then strip. Freezes
 * the new array it builds; the items themselves are borrowed (already frozen by
 * their source) and left untouched.
 */
function ladder(
	items: readonly OrchestratedItem[],
): readonly OrchestratedItem[] {
	const ordered = items
		.map((item, index) => ({ item, index, rank: rankOf(item) }))
		.toSorted((a, b) => a.rank - b.rank || a.index - b.index)
		.map((entry) => entry.item);
	return Object.freeze(ordered);
}

/**
 * An item's ladder rank: the most-concrete (minimum) level rank across its cells.
 * A zero-cell item folds to `ZERO_CELL_RANK` via the `Math.min` seed, so it ranks
 * strictly after every leveled item — no special case.
 */
function rankOf(item: OrchestratedItem): number {
	return Math.min(
		ZERO_CELL_RANK,
		...item.cells.map((cell) => LEVEL_RANK[cell.level]),
	);
}

export default ladder;
