import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

const MEMBER_ENTRIES: Readonly<Record<string, DocEntry>> = {
	length: {
		description: 'The number of characters in a string.',
		example: '"hello".length; // 5',
		isJEJ: true,
		whenToUse:
			'To loop over a string by index, or to check whether it is empty.',
		commonMistakes: [
			"Treating .length as a method: '\"hi\".length()' is an error; it's a property, no parens.",
		],
	},
	toString: {
		description:
			'Returns the string form of a number, boolean, or other value.',
		example: '(42).toString();    // "42"\n(true).toString();  // "true"',
		isJEJ: true,
		whenToUse:
			"To convert a value to a string explicitly; usually 'String(x)' is preferred for readability.",
		commonMistakes: [
			'Calling on undefined or null throws: undefined.toString() is a TypeError.',
		],
	},
	valueOf: {
		description:
			"Returns the primitive value of an object (rarely called directly; JavaScript invokes it during coercion).",
		example: '(42).valueOf(); // 42',
		isJEJ: true,
		whenToUse:
			'Almost never called directly; most code lets coercion happen implicitly.',
		commonMistakes: [
			'Confusing valueOf with toString — valueOf returns the unwrapped primitive; toString returns its string form.',
		],
	},
	charAt: {
		description:
			'Returns the single character at the given index of a string.',
		example: '"hello".charAt(0); // "h"',
		isJEJ: true,
		whenToUse:
			'To inspect one character at a known position; pair with .length and a for-loop.',
		commonMistakes: [
			'Expecting charAt to return a number — it returns a single-character string.',
			'Off-by-one when iterating: use < .length, not <=.',
			'Out-of-range indices return an empty string, not an error or undefined.',
		],
	},
	charCodeAt: {
		description:
			'Returns the UTF-16 code-unit number at the given index of a string.',
		example: '"A".charCodeAt(0); // 65',
		isJEJ: true,
		whenToUse:
			'When you need the numeric encoding of a character (for arithmetic comparisons, for example).',
		commonMistakes: [
			'Returning NaN for out-of-range indices, not an error.',
		],
	},
	slice: {
		description:
			'Returns a substring between start and end indices (end is exclusive).',
		example: '"hello".slice(1, 4); // "ell"',
		isJEJ: true,
		whenToUse:
			'To take a contiguous chunk of a string by position; negative indices count from the end.',
		commonMistakes: [
			"Expecting 'end' to be inclusive — slice(1, 4) gives indices 1, 2, 3.",
		],
	},
	substring: {
		description:
			'Returns a substring between two indices; swaps arguments if start > end.',
		example: '"hello".substring(1, 4); // "ell"',
		isJEJ: true,
		whenToUse:
			'Mostly redundant with slice; slice is the conventional choice.',
		commonMistakes: [
			'Negative indices clamp to 0 rather than counting from the end, unlike slice.',
		],
	},
	toUpperCase: {
		description:
			'Returns a copy of the string with all characters uppercased.',
		example: '"hello".toUpperCase(); // "HELLO"',
		isJEJ: true,
		whenToUse:
			'For case-insensitive comparisons or normalizing display.',
		commonMistakes: [
			'Strings are immutable — toUpperCase returns a new string; the original is unchanged.',
		],
	},
	toLowerCase: {
		description:
			'Returns a copy of the string with all characters lowercased.',
		example: '"HELLO".toLowerCase(); // "hello"',
		isJEJ: true,
		whenToUse:
			'For case-insensitive comparisons or normalizing display.',
		commonMistakes: [
			'Strings are immutable — toLowerCase returns a new string; the original is unchanged.',
		],
	},
	indexOf: {
		description:
			'Returns the index of the first occurrence of a substring, or -1 if not found.',
		example: '"hello".indexOf("l"); // 2',
		isJEJ: true,
		whenToUse: 'To find where (or whether) a substring appears.',
		commonMistakes: [
			"Treating -1 as 'found at the end' — it means 'not found'.",
			"Forgetting that 0 is a valid (truthy-looking, but falsy under '!') index; check 'indexOf(...) !== -1' explicitly.",
		],
	},
	includes: {
		description:
			'Returns true if the string contains the given substring.',
		example: '"hello".includes("ell"); // true',
		isJEJ: true,
		whenToUse:
			"When you only care whether the substring exists — clearer than 'indexOf(...) !== -1'.",
		commonMistakes: [
			'Case-sensitive — "Hello".includes("hello") is false.',
		],
	},
	startsWith: {
		description: 'Returns true if the string begins with the given prefix.',
		example: '"hello".startsWith("he"); // true',
		isJEJ: true,
		whenToUse: 'For prefix checks like protocols or file extensions.',
		commonMistakes: ['Case-sensitive — "Hello".startsWith("hello") is false.'],
	},
	endsWith: {
		description: 'Returns true if the string finishes with the given suffix.',
		example: '"hello".endsWith("lo"); // true',
		isJEJ: true,
		whenToUse: 'For suffix checks like file extensions.',
		commonMistakes: ['Case-sensitive — "Hello.JS".endsWith(".js") is false.'],
	},
	repeat: {
		description: 'Returns the string repeated the given number of times.',
		example: '"ab".repeat(3); // "ababab"',
		isJEJ: true,
		whenToUse: 'For building separators, padding, or visual lines.',
		commonMistakes: [
			'Negative counts throw a RangeError — clamp with Math.max(0, n) if needed.',
			'Fractional counts are floored silently: "ab".repeat(2.7) is "abab", not "ababab".',
		],
	},
	trim: {
		description:
			'Returns the string with leading and trailing whitespace removed.',
		example: '"  hi  ".trim(); // "hi"',
		isJEJ: true,
		whenToUse:
			'For cleaning up user input before parsing or comparing it.',
		commonMistakes: [
			'Strings are immutable — trim returns a new string; the original is unchanged.',
		],
	},
	concat: {
		description: 'Returns the original string joined with the arguments.',
		example: '"hello".concat(" ", "world"); // "hello world"',
		isJEJ: true,
		whenToUse:
			"Mostly redundant with the '+' operator or template literals; the + operator is the conventional choice.",
		commonMistakes: [
			"Forgetting that concat doesn't insert a separator: '\"a\".concat(\"b\")' is \"ab\", not \"a b\".",
		],
	},
	replace: {
		description:
			"Returns a copy of the string with the FIRST match replaced.",
		example: '"hello".replace("l", "L"); // "heLlo"',
		isJEJ: true,
		whenToUse: 'For one-shot substitutions.',
		commonMistakes: [
			"Replacing all occurrences — replace replaces only the first; use replaceAll for every match.",
		],
	},
	replaceAll: {
		description:
			'Returns a copy of the string with every match replaced.',
		example: '"hello".replaceAll("l", "L"); // "heLLo"',
		isJEJ: true,
		whenToUse: 'For global substitutions.',
		commonMistakes: [
			'When using a regex argument, the regex MUST have the global flag /g, or replaceAll throws.',
		],
	},
	toFixed: {
		description:
			'Returns a string with the number formatted to a fixed number of decimal places.',
		example: '(3.14159).toFixed(2); // "3.14"',
		isJEJ: true,
		whenToUse:
			'For displaying numbers to a chosen precision (returns a string, not a number).',
		commonMistakes: [
			'Forgetting the return is a STRING — adding to it concatenates.',
			'Binary floating-point representation can surprise: (1.005).toFixed(2) is "1.00" because 1.005 is not exactly representable.',
		],
	},
	toPrecision: {
		description:
			"Returns a string with the number formatted to a total of N significant digits.",
		example: '(123.456).toPrecision(4); // "123.5"',
		isJEJ: true,
		whenToUse:
			'For showing numbers with a total digit budget (scientific style).',
		commonMistakes: [
			'Returning a STRING, not a number.',
			'May fall back to scientific notation for very large or very small values.',
		],
	},
	abs: {
		description:
			'Returns the absolute (non-negative) value of its argument.',
		example: 'Math.abs(-7); // 7',
		isJEJ: true,
		whenToUse: 'To strip the sign of a number.',
	},
	floor: {
		description:
			'Returns the largest integer less than or equal to its argument.',
		example: 'Math.floor(3.7); // 3',
		isJEJ: true,
		whenToUse: 'To round downward to an integer.',
		commonMistakes: [
			"Floor of a negative non-integer rounds AWAY from zero: 'Math.floor(-3.2)' is -4, not -3.",
		],
	},
	ceil: {
		description:
			'Returns the smallest integer greater than or equal to its argument.',
		example: 'Math.ceil(3.2); // 4',
		isJEJ: true,
		whenToUse: 'To round upward to an integer.',
		commonMistakes: [
			"Ceil of a negative non-integer rounds TOWARD zero: 'Math.ceil(-3.7)' is -3, not -4.",
		],
	},
	round: {
		description:
			'Returns the value rounded to the nearest integer (.5 always rounds toward positive infinity).',
		example: 'Math.round(3.5); // 4\nMath.round(-3.5); // -3',
		isJEJ: true,
		whenToUse: 'For ordinary half-up rounding to an integer.',
		commonMistakes: [
			"Negative .5 rounds toward zero: 'Math.round(-2.5)' is -2, not -3.",
		],
	},
	max: {
		description: 'Returns the largest of its arguments.',
		example: 'Math.max(1, 3, 2); // 3',
		isJEJ: true,
		whenToUse: 'To pick the highest of several known values.',
	},
	min: {
		description: 'Returns the smallest of its arguments.',
		example: 'Math.min(1, 3, 2); // 1',
		isJEJ: true,
		whenToUse: 'To pick the lowest of several known values.',
	},
	pow: {
		description: 'Returns the first argument raised to the power of the second.',
		example: 'Math.pow(2, 10); // 1024',
		isJEJ: true,
		whenToUse:
			"For exponentiation; the '**' operator is the modern alternative.",
	},
	sqrt: {
		description: 'Returns the (non-negative) square root of its argument.',
		example: 'Math.sqrt(16); // 4',
		isJEJ: true,
		whenToUse: 'For square roots.',
		commonMistakes: [
			'Returning NaN for negative inputs, not an error.',
		],
	},
};

export default MEMBER_ENTRIES;

export const MEMBER_LABELS: ReadonlySet<string> = new Set(
	Object.keys(MEMBER_ENTRIES),
);
