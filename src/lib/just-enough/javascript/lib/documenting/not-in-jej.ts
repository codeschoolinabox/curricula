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
	function: {
		description:
			"Declares a reusable named function (or, as 'function () {}', an anonymous expression).",
		example: 'function add(a, b) {\n\treturn a + b;\n}',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for any reusable piece of code. JEJ runs as a flat script and uses no functions of any kind — declarations, expressions, or arrows. If you find yourself repeating, that's a sign the exercise scope is wrong.",
		commonMistakes: [
			"Reaching for 'function' at this language level — JEJ has no functions; reach for inline expressions and loops instead.",
			"Confusing function declarations (hoisted) with function expressions ('const f = function () {}', not hoisted) — both are outside JEJ.",
		],
	},
	class: {
		description:
			'Declares a class with constructor and methods — JavaScript syntactic sugar for prototype-based OO.',
		example: 'class Point {\n\tconstructor(x, y) { this.x = x; this.y = y; }\n}',
		category: 'not in JEJ',
		whenToUse:
			'In modern JavaScript, for grouping data with the behaviors that operate on it. JEJ programs use only primitive values and the small set of built-in objects (Math, String, etc.); user-defined classes are outside the language level.',
		commonMistakes: [
			"Reaching for 'class' at this language level — JEJ does not introduce user-defined types.",
			'Treating class as the only way to organize state — primitives + literals cover the JEJ exercise space.',
		],
	},
	'=>': {
		description:
			"The arrow-function syntax. '(a, b) => a + b' is shorthand for an anonymous function.",
		example: 'const add = (a, b) => a + b;',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for concise inline callbacks or short functions. JEJ has no functions — arrow functions are not allowed at this language level.",
		commonMistakes: [
			"Reaching for '=>' at this language level — arrow functions ARE functions, and JEJ has none.",
			"Confusing the arrow with greater-than-or-equal '>=' — typing 'a => b' when you meant 'a >= b'.",
		],
	},
	this: {
		description:
			"A binding to the 'receiver' of the current call — the object before the dot in 'obj.method()', or the global object in plain calls.",
		example: 'function describe() {\n\treturn this.name;\n}',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, inside methods and constructors. JEJ has no functions or classes for 'this' to refer to, so it's not used at this language level.",
		commonMistakes: [
			"Reaching for 'this' at this language level — there's nothing for it to point at.",
			"Confusing 'this' in arrow vs regular functions — arrows inherit it from the enclosing scope; regular functions get it from the call site.",
		],
	},
	throw: {
		description:
			'Raises an exception with the given value, unwinding the call stack until a `catch` is found.',
		example: 'throw new Error("something went wrong");',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, to signal an error from a function. JEJ programs do not handle exceptions; if a check fails, return early or 'console.error' the cause.",
		commonMistakes: [
			"Reaching for 'throw' at this language level — JEJ programs do not handle exceptions.",
			"Throwing a string ('throw \"oops\"') instead of an Error — the stack trace is lost.",
		],
	},
	try: {
		description:
			'Wraps code that might throw; pair with `catch` (and optionally `finally`) to handle the error.',
		example: 'try {\n\trisky();\n} catch (e) {\n\tconsole.error(e);\n}',
		category: 'not in JEJ',
		whenToUse:
			'In modern JavaScript, to recover from runtime errors. JEJ programs do not handle exceptions at this language level.',
		commonMistakes: [
			"Reaching for 'try/catch' at this language level — JEJ has no exception handling.",
			'Catching errors only to ignore them silently — at this level, you would write a guard before the operation instead.',
		],
	},
	import: {
		description:
			'Brings in bindings from another module (file). Pair with `export` in the source module.',
		example: 'import { add } from "./math.js";',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for splitting code across files. JEJ programs are single-file scripts — module syntax isn't used at this language level.",
		commonMistakes: [
			"Reaching for 'import' at this language level — JEJ is single-file.",
			"Confusing static 'import' with dynamic 'import()' — they're different syntactic forms.",
		],
	},
	async: {
		description:
			"Marks a function as asynchronous — it always returns a Promise and may use 'await' inside.",
		example: 'async function load() {\n\tconst data = await fetch("/api");\n}',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for code that waits on I/O or timers. JEJ has no functions to be async — and JEJ programs are synchronous at this language level.",
		commonMistakes: [
			"Reaching for 'async' at this language level — there are no functions, and no awaiting.",
		],
	},
	await: {
		description:
			"Pauses an async function until the awaited Promise settles, then resumes with its resolved value.",
		example: 'const data = await fetch("/api");',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, inside async functions, to wait on Promises. JEJ programs are synchronous; 'await' is not used at this language level.",
		commonMistakes: [
			"Reaching for 'await' at this language level — JEJ is synchronous.",
			"Using 'await' outside an async function — that's a syntax error in regular modules.",
		],
	},
	split: {
		description:
			'String method that breaks a string into an array of substrings on a separator.',
		example: '"a,b,c".split(","); // ["a", "b", "c"]',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for parsing CSVs and structured strings. JEJ does not use arrays — '.split' returns one, so it's outside this language level. To inspect characters use '.charAt(i)' inside a 'for' loop over '.length'.",
		commonMistakes: [
			"Reaching for '.split' at this language level — JEJ has no arrays.",
			'Forgetting that an empty separator splits into characters: "abc".split("") is ["a","b","c"].',
		],
	},
	match: {
		description:
			'String method that returns an array of regex matches (or capturing groups), or null if no match.',
		example: '"hello".match(/l/); // ["l", index: 2, ...]',
		category: 'not in JEJ',
		whenToUse:
			"In modern JavaScript, for extracting regex matches from a string. JEJ does not use arrays — '.match' returns one, so it's outside this language level.",
		commonMistakes: [
			"Reaching for '.match' at this language level — its return shape is array-based.",
			"Expecting a non-null return for 'no match' — match returns null, not an empty array.",
		],
	},
};

export default NOT_IN_JEJ_ENTRIES;

export const NOT_IN_JEJ_LABELS: ReadonlySet<string> = new Set(
	Object.keys(NOT_IN_JEJ_ENTRIES),
);
