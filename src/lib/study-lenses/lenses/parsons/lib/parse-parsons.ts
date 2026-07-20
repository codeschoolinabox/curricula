// cspell:ignore distractor distractors codeline

/**
 * Parse a source into a Parsons exercise — vendored & slimmed from the
 * legacy JSParsons `parseCode` + `normalizeIndents` + `ParsonsCodeline`.
 * Splits the source into solution lines and distractor lines (marked
 * `// distractor`), normalizes leading whitespace into relative indent
 * levels, selects the distractor subset, and produces the initial shuffled
 * pool.
 */

import type { ParsedParsons } from '../types.js';

import extractHints from './extract-hints.js';
import parseLines from './parse-lines.js';

/**
 * Full parse: extract hint blocks, then `parseLines` the stripped code +
 * select `min(maxDistractors, declared)` distractors (random subset) +
 * build and shuffle the initial pool of line ids.
 *
 * @param random - injectable RNG in `[0,1)`; defaults to `Math.random`.
 *   Pass a deterministic stub in tests.
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
		[...solution.map((line) => line.id), ...selected.map((line) => line.id)],
		random,
	);
	return { solution, distractors: selected, pool, hints };
}

/**
 * Fisher–Yates shuffle (in place on a copy): for i from n-1 down to 1, swap
 * element i with a random index in [0, i].
 */
function shuffle<Item>(
	items: ReadonlyArray<Item>,
	random: () => number,
): Item[] {
	const shuffled = [...items];
	for (let index = shuffled.length - 1; index > 0; index--) {
		const other = Math.floor(random() * (index + 1));
		const held = shuffled[index];
		shuffled[index] = shuffled[other];
		shuffled[other] = held;
	}
	return shuffled;
}
