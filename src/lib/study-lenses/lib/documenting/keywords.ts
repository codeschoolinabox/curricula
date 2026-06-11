import type { DocEntry as DocumentEntry } from '../../orchestrate/lib/editing/types.js';

const KEYWORD_ENTRIES: Readonly<Record<string, DocumentEntry>> = {
	let: {
		description: 'Declares a block-scoped variable whose value can change.',
		example: 'let count = 0;\ncount = count + 1;',
		isJEJ: true,
		whenToUse: 'When the value will be reassigned later.',
		commonMistakes: [
			"Redeclaration in the same scope: 'let x = 1; let x = 2;' is an error.",
		],
	},
	const: {
		description: 'Declares a block-scoped name whose binding cannot change.',
		example: 'const name = "Alice";',
		isJEJ: true,
		whenToUse: 'When the binding should not be reassigned.',
		commonMistakes: ["Trying to reassign: 'const x = 1; x = 2;' is an error."],
	},
	if: {
		description: 'Runs a block only when its condition is true.',
		example: 'if (age >= 18) {\n\tconsole.log("adult");\n}',
		isJEJ: true,
		whenToUse: 'To choose whether a block runs at all.',
		commonMistakes: [
			"Writing '=' (assignment) instead of '===' or '==' in the condition.",
			"Forgetting that '0', empty strings, and undefined are falsy — 'if (x)' is not the same as 'if (x !== undefined)'.",
		],
	},
	else: {
		description: 'Pairs with `if` to run a block when the condition was false.',
		example: 'if (x > 0) {\n\t// positive\n} else {\n\t// zero or negative\n}',
		isJEJ: true,
		whenToUse: 'To handle the "otherwise" branch of an if.',
		commonMistakes: [
			"Putting 'else' on its own line without an 'if' before — 'else' is never standalone.",
		],
	},
	for: {
		description:
			'Repeats a block a controlled number of times, with an init, a condition, and an update step.',
		example: 'for (let i = 0; i < 5; i++) {\n\tconsole.log(i);\n}',
		isJEJ: true,
		whenToUse: 'When you know (or can compute) how many iterations you need.',
		commonMistakes: [
			"Off-by-one: 'i <= length' often goes one past the end; use 'i < length'.",
			"Forgetting the update step — 'for (let i = 0; i < n;) {}' loops forever.",
		],
	},
	while: {
		description: 'Repeats a block as long as its condition stays true.',
		example: 'let n = 10;\nwhile (n > 0) {\n\tn = n - 1;\n}',
		isJEJ: true,
		whenToUse: "When the number of iterations isn't known up front.",
		commonMistakes: [
			'Forgetting to change the condition inside the body — produces an infinite loop.',
		],
	},
	do: {
		description:
			'Repeats a block at least once, then keeps going while a condition is true.',
		example:
			'let answer;\ndo {\n\tanswer = prompt("Yes or no?");\n} while (answer !== "yes" && answer !== "no");',
		isJEJ: true,
		whenToUse:
			'When the body must run at least once before its condition is checked.',
		commonMistakes: ["Forgetting the trailing semicolon after 'while (...)'."],
	},
	break: {
		description:
			'Stops the nearest enclosing loop immediately, jumping past it.',
		example: 'for (let i = 0; i < 10; i++) {\n\tif (i === 3) break;\n}',
		isJEJ: true,
		whenToUse: 'To exit a loop early when you find what you were looking for.',
		commonMistakes: [
			"Using 'break' outside a loop — it only stops loops (and switch, which JEJ doesn't use).",
		],
	},
	continue: {
		description:
			'Skips the rest of this iteration and continues with the next one.',
		example:
			'for (let i = 0; i < 5; i++) {\n\tif (i % 2 === 0) continue;\n\tconsole.log(i);\n}',
		isJEJ: true,
		whenToUse: 'To skip a single iteration without leaving the loop.',
		commonMistakes: [
			"Confusing 'continue' with 'break' — 'continue' keeps looping, 'break' exits.",
		],
	},
	return: {
		description:
			'Hands a value back from a function and exits the function immediately.',
		isJEJ: true,
		whenToUse:
			'In modern JavaScript, to produce the result of a function. JEJ runs as a flat script and uses no functions, so `return` has no standalone form at this language level — the keyword is recognised but you would not write it.',
		commonMistakes: [
			"Putting code after 'return' — it never runs.",
			"Forgetting 'return' — the function silently returns 'undefined'.",
			"Reaching for 'return' at this language level — JEJ has no functions to return from.",
		],
	},
	true: {
		description: 'The boolean literal for "yes / on".',
		example: 'const isReady = true;',
		isJEJ: true,
		whenToUse:
			'When you need to assert a positive condition without computing one.',
	},
	false: {
		description: 'The boolean literal for "no / off".',
		example: 'const isDone = false;',
		isJEJ: true,
		whenToUse:
			'When you need to assert a negative condition without computing one.',
	},
	null: {
		description: 'The literal value meaning "intentionally no value here".',
		example: 'let chosen = null; // not picked yet',
		isJEJ: true,
		whenToUse:
			"Available, but 'undefined' is the conventional 'no value' marker in JEJ. Use 'null' only when you deliberately need to distinguish \"set to nothing\" from \"never set\".",
		commonMistakes: [
			"Reaching for 'null' when 'undefined' is more conventional in JEJ.",
			"Treating 'null' and 'undefined' as identical — they're equal under '==' but not '==='.",
		],
	},
	new: {
		description:
			'Calls a constructor function and returns the newly-built object.',
		example: 'const today = new Date();',
		isJEJ: true,
		whenToUse:
			"In JEJ, 'new' is only allowed with 'Date' (e.g. 'new Date()'). No other constructors are available at this language level.",
		commonMistakes: [
			"Using 'new' with anything other than 'Date' at this language level — it's rejected.",
			"Forgetting 'new' on 'Date()' — calling 'Date()' without 'new' returns a string, not a Date object.",
		],
	},
	typeof: {
		description:
			'Returns a lowercase string naming the type of its operand: "string", "number", "bigint", "boolean", "undefined", "object", or "function".',
		example: 'typeof "hello"; // "string"\ntypeof 42;      // "number"',
		isJEJ: true,
		whenToUse: "To check what kind of value you're holding.",
		commonMistakes: [
			"Expecting 'typeof null' to be 'null' — it's actually 'object' (a famous JavaScript quirk).",
			'Comparing the result without quotes: typeof x === number is a reference error — write typeof x === "number".',
		],
	},
	in: {
		description:
			'Tests whether a property name exists on an object (or somewhere in its prototype chain).',
		example: 'const point = { x: 1, y: 2 };\n"x" in point; // true',
		isJEJ: true,
		whenToUse:
			"To check for the presence of a named property when you don't care about its value. The right-hand side must be an object.",
		commonMistakes: [
			"Using 'in' on a primitive (string, number) — throws TypeError; the right-hand side must be an object.",
			"Using 'in' to test for values — 'in' checks property names, not contents.",
		],
	},
};

export default KEYWORD_ENTRIES;

