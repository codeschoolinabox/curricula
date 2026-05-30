import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

const GLOBAL_ENTRIES: Readonly<Record<string, DocEntry>> = {
	console: {
		description:
			'Built-in object for writing diagnostic output to the host log.',
		example: 'console.log("hello");',
		category: 'i/o',
		whenToUse: 'For seeing what your code is doing as it runs.',
		commonMistakes: [
			"Treating 'console.log' as if it returns a value — it returns undefined.",
			'Leaving console.log calls in code submitted for grading or shipped to production.',
		],
	},
	Math: {
		description:
			'Built-in object holding mathematical constants and helper methods.',
		example: 'Math.PI;\nMath.floor(3.7);',
		category: 'built-in object',
		whenToUse:
			'For numeric calculations beyond the basic +, -, *, / operators.',
		commonMistakes: [
			"Forgetting Math members are method calls: 'Math.abs(-5)', not 'Math.abs -5'.",
			"Expecting 'Math.random()' to give integers — it returns a float in [0, 1) which you then scale.",
		],
	},
};

export default GLOBAL_ENTRIES;

export const GLOBAL_LABELS: ReadonlySet<string> = new Set(
	Object.keys(GLOBAL_ENTRIES),
);
