/**
 * @file Pure seeded shuffle for the `parsons` lens. Splits source by
 * `\n` (preserving empty lines), assigns each line its 0-based
 * `originalIndex`, then runs a seeded Fisher-Yates permutation. No
 * React imports.
 *
 * @remarks Per `./DOCS.md` § Execution phases 3, this is the
 * Split + shuffle phase. A snippet with 0 or 1 lines is passed
 * through as-is (no meaningful shuffle). The shuffle is deterministic
 * given the same `(source, seed)` pair.
 *
 * @remarks Split out of `core.ts` because the algorithm is testable
 * as a standalone pure function (no `LensConfig` ceremony) and may
 * lift to `orchestrate/lib/` once a second seeded-RNG consumer
 * surfaces. Until then, keeps the LCG local to parsons.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Row } from './types.js';

/**
 * Split + shuffle entry-point.
 *
 * @param source - The snippet's source code (`embodiment.source.code`).
 * @param seed - Numeric seed for the deterministic Fisher-Yates
 *   permutation. The wrapper computes a per-mount random seed via
 *   `useMemo([])` when `config.seed` is unset.
 * @returns Frozen `ReadonlyArray<Row>` in shuffled order. For a
 *   source with 0 or 1 lines, returns the rows in source order (no
 *   meaningful shuffle).
 */
function shuffle(source: string, seed: number): ReadonlyArray<Row> {
	const rows = splitIntoRows(source);
	if (rows.length < 2) return freezeInPlace(rows);
	return freezeInPlace(fisherYates(rows, seed));
}

/**
 * Split `source` on `\n` into one `Row` per line, preserving empty
 * lines. Each row's `originalIndex` is its 0-based position in the
 * unshuffled sequence.
 *
 * @remarks Special-cases the empty string: `''.split('\n')` returns
 * `['']` (one empty entry), which would render as a single empty row
 * in the UI. Empty source produces an empty row sequence instead.
 */
function splitIntoRows(source: string): ReadonlyArray<Row> {
	if (source === '') return [];
	const lines = source.split('\n');
	// eslint-disable-next-line functional/prefer-readonly-type -- local mutable builder; return type is ReadonlyArray
	const rows: Row[] = [];
	for (const [index, text] of lines.entries()) {
		rows.push({ text, originalIndex: index });
	}
	return rows;
}

/**
 * Fisher-Yates permutation seeded from `seed`. Walks `i` from
 * `rows.length - 1` down to `1`, picks `j` deterministically from
 * the seeded LCG, swaps `rows[i]` and `rows[j]`. Pure: produces a
 * new array, does not mutate the input.
 *
 * @remarks LCG (Numerical Recipes constants) — deterministic given
 * the seed; not cryptographic. Sufficient for the shuffle's
 * randomization needs.
 */
function fisherYates(
	rows: ReadonlyArray<Row>,
	seed: number,
): ReadonlyArray<Row> {
	// eslint-disable-next-line functional/prefer-readonly-type -- local mutable builder; return type is ReadonlyArray
	const result: Row[] = [...rows];
	let state = seed >>> 0;
	for (let index = result.length - 1; index > 0; index -= 1) {
		const draw = nextRandom(state);
		state = draw.nextState;
		const swap = Math.floor(draw.value * (index + 1));
		// eslint-disable-next-line functional/immutable-data -- local mutable builder; Fisher-Yates swap
		[result[index], result[swap]] = [result[swap], result[index]] as [Row, Row];
	}
	return result;
}

/**
 * One step of a Numerical-Recipes LCG. Deterministic given seed;
 * good enough for shuffle (not a cryptographic RNG). State is a
 * uint32; output is in `[0, 1)`.
 */
function nextRandom(state: number): {
	readonly value: number;
	readonly nextState: number;
} {
	const next = (state * 1_664_525 + 1_013_904_223) >>> 0;
	return { value: next / 0x1_00_00_00_00, nextState: next };
}

export default shuffle;
