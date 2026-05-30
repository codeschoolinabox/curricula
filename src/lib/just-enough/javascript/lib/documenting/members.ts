import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

const MEMBER_ENTRIES: Readonly<Record<string, DocEntry>> = {
	charAt: {
		description:
			'Returns the single character at the given index of a string.',
		example: '"hello".charAt(0); // "h"',
		category: 'string method',
		whenToUse:
			'To inspect one character at a known position; pair with .length and a for-loop.',
		commonMistakes: [
			"Expecting charAt to return a number — it returns a single-character string.",
			'Off-by-one when iterating: use < .length, not <=.',
			'Out-of-range indices return an empty string, not an error or undefined.',
		],
	},
};

export default MEMBER_ENTRIES;

export const MEMBER_LABELS: ReadonlySet<string> = new Set(
	Object.keys(MEMBER_ENTRIES),
);
