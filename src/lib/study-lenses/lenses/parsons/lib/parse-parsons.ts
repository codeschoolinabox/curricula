/**
 * @file Parse a snippet into a Parsons exercise — vendored & slimmed from the
 * legacy `parsons.js` `parseCode` (L935) + `normalizeIndents` (L1167) +
 * `ParsonsCodeline` ctor (L794). Splits the source into solution lines and
 * distractor lines (marked `// distractor`), normalizes leading whitespace into
 * relative indent levels, selects the distractor subset, and produces the
 * initial shuffled pool.
 *
 * Eslint-ignored (vendored) per `eslint.config.mjs`.
 */

import type { ParsedParsons } from '../types.js';
import extractHints from './extract-hints.js';
import parseLines from './parse-lines.js';

/**
 * Fisher–Yates shuffle (in place on a copy): for i from n-1 down to 1, swap
 * element i with a random index in [0, i].
 */
function shuffle<T>(items: ReadonlyArray<T>, random: () => number): T[] {
	const arr = [...items];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
	}
	return arr;
}

/**
 * Full parse: extract hint blocks, then `parseLines` the stripped code + select
 * `min(maxDistractors, declared)` distractors (random subset) + build and shuffle
 * the initial pool of line ids.
 *
 * @param random injectable RNG in `[0,1)`; defaults to `Math.random`. Pass a
 *   deterministic stub in tests.
 */
export default function parseParsons(
	source: string,
	maxDistractors: number,
	random: () => number = Math.random,
): ParsedParsons {
	const { code, hints } = extractHints(source);
	const { solution, distractors } = parseLines(code);
	const count = Math.max(0, Math.min(maxDistractors, distractors.length));
	const selected = shuffle(distractors, random).slice(0, count);
	const pool = shuffle(
		[...solution.map((l) => l.id), ...selected.map((l) => l.id)],
		random,
	);
	return { solution, distractors: selected, pool, hints };
}
