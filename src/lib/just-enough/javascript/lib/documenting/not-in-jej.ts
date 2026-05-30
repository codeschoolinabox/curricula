import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

const NOT_IN_JEJ_ENTRIES: Readonly<Record<string, DocEntry>> = {
	var: {
		description:
			"JavaScript's older variable-declaration keyword. Function-scoped, hoisted, allows redeclaration.",
		example: 'var count = 0;\ncount = 1;',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, prefer 'let' (or 'const') — 'var' lingers in legacy code but isn't used at this language level.",
		commonMistakes: [
			"Using 'var' at this language level — JEJ uses 'let' (for changing values) and 'const' (for fixed bindings) instead.",
			'Function-scope vs block-scope confusion: var leaks past the nearest block, which let does not.',
			"Re-declaration without notice: 'var x = 1; var x = 2;' silently works with var but is rejected by let.",
		],
	},
};

export default NOT_IN_JEJ_ENTRIES;

export const NOT_IN_JEJ_LABELS: ReadonlySet<string> = new Set(
	Object.keys(NOT_IN_JEJ_ENTRIES),
);
