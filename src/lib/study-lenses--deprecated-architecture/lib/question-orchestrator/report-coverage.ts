/**
 * @file The coverage-report pass — over the delivered items, which distinct
 * Block Model cells the set SPANS and which configured target cells it leaves as
 * GAPS. Report only (the orchestrator never synthesizes an item to fill a gap).
 * Cells are compared by VALUE (`${dimension}:${level}`), never by reference —
 * distinct instances of the same cell must count once. See `./DOCS.md` §
 * Coverage semantics.
 */

import type { BlockCell } from '../../orchestrate/lib/socratizing/types.js';

import type { CoverageReport, OrchestratedItem } from './types.js';

/**
 * Report the Block Model coverage of the delivered items against the configured
 * targets. `spanned` = the distinct cells the items cover (deduped by value);
 * `gaps` = the distinct targets not spanned (empty when no targets). Both are
 * value-keyed on `${dimension}:${level}` — never reference identity, since
 * distinct instances of the same cell are equal. Freezes the report object and
 * its two arrays; the cells themselves are borrowed BY REFERENCE — `spanned` from
 * the items (frozen upstream by their source), `gaps` from the caller's target
 * cells — and left untouched (never cloned or reconstructed).
 */
function reportCoverage(
	items: readonly OrchestratedItem[],
	targetCells: readonly BlockCell[],
): CoverageReport {
	const spanned = distinctCells(items.flatMap((item) => item.cells));
	const spannedKeys = new Set(spanned.map((cell) => keyOf(cell)));
	const gaps = distinctCells(targetCells).filter(
		(cell) => !spannedKeys.has(keyOf(cell)),
	);
	return Object.freeze({
		spanned: Object.freeze(spanned),
		gaps: Object.freeze(gaps),
	});
}

/** The distinct cells, keeping the first occurrence of each value key. */
function distinctCells(cells: readonly BlockCell[]): readonly BlockCell[] {
	return cells.filter(
		(cell, index) =>
			cells.findIndex((other) => keyOf(other) === keyOf(cell)) === index,
	);
}

/** The value key of a cell — the equality basis for spanned/gaps. */
function keyOf(cell: BlockCell): string {
	return `${cell.dimension}:${cell.level}`;
}

export default reportCoverage;
