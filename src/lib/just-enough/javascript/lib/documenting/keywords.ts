import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

const KEYWORD_ENTRIES: Readonly<Record<string, DocEntry>> = {
	let: {
		description:
			'Declares a block-scoped variable whose value can change.',
		example: 'let count = 0;\ncount = count + 1;',
		category: 'variables',
		whenToUse: 'When the value will be reassigned later.',
		commonMistakes: [
			"Redeclaration in the same scope: 'let x = 1; let x = 2;' is an error.",
		],
	},
	const: {
		description:
			'Declares a block-scoped name whose binding cannot change.',
		example: 'const name = "Alice";',
		category: 'variables',
		whenToUse: 'When the binding should not be reassigned.',
		commonMistakes: [
			"Trying to reassign: 'const x = 1; x = 2;' is an error.",
		],
	},
};

export default KEYWORD_ENTRIES;

export const KEYWORD_LABELS: ReadonlySet<string> = new Set(
	Object.keys(KEYWORD_ENTRIES),
);
