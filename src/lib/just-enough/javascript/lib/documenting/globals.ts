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
	String: {
		description:
			'Built-in for converting values to strings; also holds string-related helpers.',
		example: 'String(42); // "42"',
		category: 'type conversion',
		whenToUse: 'To force a value to its string form.',
		commonMistakes: [
			"Calling with 'new' (e.g. 'new String(\"x\")') wraps the string in an object — JEJ uses the bare String(...) call.",
		],
	},
	Number: {
		description:
			'Built-in for converting values to numbers; also holds number-related helpers.',
		example: 'Number("3.14"); // 3.14',
		category: 'type conversion',
		whenToUse: 'To force a value to its numeric form.',
		commonMistakes: [
			"Returning NaN for unparseable strings: 'Number(\"hello\")' is NaN, not 0.",
			"Confusing with 'parseInt' / 'parseFloat' — Number(\"3px\") is NaN, parseInt(\"3px\") is 3.",
		],
	},
	Boolean: {
		description:
			'Built-in for converting values to true or false (the same coercion the `if` condition uses).',
		example: 'Boolean(0);     // false\nBoolean("hi"); // true',
		category: 'type conversion',
		whenToUse: 'To force a value to its boolean form.',
		commonMistakes: [
			"Calling with 'new' wraps in an object whose truthiness is always 'true' — JEJ uses the bare Boolean(...) call.",
		],
	},
	Date: {
		description:
			'Built-in for working with dates and times. Construct with `new Date()`.',
		example: 'const today = new Date();',
		category: 'built-in object',
		whenToUse: 'To get the current time or to represent a moment.',
		commonMistakes: [
			"Forgetting 'new': 'Date()' (without new) returns a string, not a Date.",
			'Months are 0-indexed: new Date(2024, 0, 1) is January 1, not February.',
		],
	},
	RegExp: {
		description:
			'Built-in for regular-expression patterns. Most code uses the literal form `/pattern/flags`.',
		example: 'const word = /\\w+/;',
		category: 'built-in object',
		whenToUse: 'For matching patterns within strings.',
		commonMistakes: [
			"Escaping issues when building from a string: 'new RegExp(\"\\\\d\")' for one literal backslash before d.",
		],
	},
	BigInt: {
		description:
			'Built-in for integers larger than Number can safely represent (above 2^53 - 1).',
		example: 'const huge = BigInt("9007199254740993");',
		category: 'type conversion',
		whenToUse: 'For arithmetic on integers beyond Number safety.',
		commonMistakes: [
			"Mixing BigInt and Number directly: '1n + 1' throws — convert one side first.",
		],
	},
	parseInt: {
		description:
			'Reads an integer from the start of a string, ignoring trailing non-digit characters.',
		example: 'parseInt("3px"); // 3',
		category: 'type conversion',
		whenToUse: 'To extract a leading integer from a string.',
		commonMistakes: [
			'Forgetting the radix on user input: parseInt("08") is 8 in modern engines, but pass 10 explicitly to be safe.',
			"Expecting it to floor: 'parseInt(3.9)' is 3 because it stringifies first; use Math.floor for floats.",
		],
	},
	parseFloat: {
		description:
			'Reads a floating-point number from the start of a string.',
		example: 'parseFloat("3.14em"); // 3.14',
		category: 'type conversion',
		whenToUse: 'To extract a leading float from a string.',
		commonMistakes: [
			'Returning NaN for non-numeric leading characters: parseFloat("price: 3.14") is NaN.',
		],
	},
	alert: {
		description:
			'Shows a modal dialog with the given message and blocks until the user dismisses it.',
		example: 'alert("Hello!");',
		category: 'i/o',
		whenToUse: 'For a quick "stop and read this" message during practice.',
		commonMistakes: [
			"Treating alert as 'console.log' — it blocks the whole page until dismissed.",
		],
	},
	confirm: {
		description:
			'Shows a modal yes/no dialog and returns true if the user clicked OK.',
		example: 'if (confirm("Are you sure?")) {\n\t// proceed\n}',
		category: 'i/o',
		whenToUse: 'For a quick yes/no decision from the user during practice.',
		commonMistakes: [
			"Forgetting the boolean return — 'confirm(\"x\");' alone discards the answer.",
		],
	},
	prompt: {
		description:
			'Shows a modal text-input dialog and returns the entered string, or null if cancelled.',
		example: 'const name = prompt("What is your name?");',
		category: 'i/o',
		whenToUse:
			'For a quick free-form input from the user during practice.',
		commonMistakes: [
			"Treating the result as a number — prompt always returns a string (or null); convert with Number() or parseInt() if you need a number.",
			"Forgetting the null on cancel — 'prompt(...)' returns null when the user dismisses the dialog.",
		],
	},
	undefined: {
		description:
			'The value of any variable that has been declared but never assigned, and of any property that does not exist.',
		example: 'let x;\nconsole.log(x); // undefined',
		category: 'literal',
		whenToUse:
			'As the conventional "no value yet" marker in JEJ (preferred over null for unset / absent states).',
		commonMistakes: [
			"Comparing with '=='  instead of '===' — undefined == null is true, undefined === null is false.",
		],
	},
	NaN: {
		description:
			'The special "not a number" value, produced by numeric operations that have no meaningful result.',
		example: 'Number("hello"); // NaN\n0 / 0;            // NaN',
		category: 'literal',
		whenToUse:
			'You usually do not write NaN directly; you check for it with Number.isNaN(x).',
		commonMistakes: [
			"Comparing with '===': NaN === NaN is false. Use Number.isNaN(x) to test.",
		],
	},
	Infinity: {
		description:
			'The numeric value representing positive overflow (and -Infinity for negative).',
		example: '1 / 0; // Infinity',
		category: 'literal',
		whenToUse:
			'You usually do not write Infinity directly; check for finiteness with Number.isFinite(x).',
		commonMistakes: [
			"Treating Infinity as a sentinel — '1 + Infinity' is still Infinity, so it propagates through arithmetic.",
		],
	},
};

export default GLOBAL_ENTRIES;

export const GLOBAL_LABELS: ReadonlySet<string> = new Set(
	Object.keys(GLOBAL_ENTRIES),
);
