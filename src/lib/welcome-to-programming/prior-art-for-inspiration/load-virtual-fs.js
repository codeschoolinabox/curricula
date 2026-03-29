// Enhanced CodeMirror editor with linting, autocomplete, hover documentation, and developer experience features

import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
// Dynamic language imports - removed hardcoded javascript import
// Languages will be loaded dynamically based on file type
import { oneDark } from '@codemirror/theme-one-dark';
import { LanguageDetector } from './src/utils/LanguageDetector.js';

// Additional imports - adding back one by one
import { autocompletion } from '@codemirror/autocomplete';
import { hoverTooltip } from '@codemirror/view';
import { linter, lintGutter } from '@codemirror/lint';
import { search, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, foldGutter, indentUnit } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import * as eslint from 'eslint-linter-browserify';
import { indentWithTab } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';

// Prettier imports for code formatting
import * as prettier from 'prettier/standalone';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginCss from 'prettier/plugins/postcss';
import * as prettierPluginHtml from 'prettier/plugins/html';
import prettierConfig from './.prettierrc.json' with { type: 'json' };

// Pedagogical formatting helpers will be defined inline

// Enhanced CodeMirror features
const jsHoverTooltip = hoverTooltip((view, pos, side) => {
	const { state } = view;
	const word = state.wordAt(pos);
	if (!word) return null;

	const text = state.sliceDoc(word.from, word.to);

	// TIER 1 FOUNDATION - Research-based beginner documentation (Cognitive Load: Low)
	const jsDocs = {
		// Variables (Core Concept)
		let: {
			description:
				'Creates a block-scoped variable that can be reassigned',
			example: 'let age = 25;\nage = 26; // This works!',
			category: 'variables',
			difficulty: 'beginner',
			commonMistakes: [
				'Redeclaration: let x = 1; let x = 2; // Error!',
				'Use before declaration: // console.log(y); let y = 5; // Error!',
			],
			whenToUse: 'When you need a variable that might change',
			alternatives: [
				'const (for unchanging values)',
				'var (older style)',
			],
			cognitiveLevel: 'remember',
		},

		const: {
			description:
				'Creates a block-scoped constant that cannot be reassigned',
			example: 'const name = "Alice";\n// name = "Bob"; // Error!',
			category: 'variables',
			difficulty: 'beginner',
			commonMistakes: [
				'Trying to reassign: const x = 1; x = 2; // Error!',
				'Not initializing: const y; // Error!',
			],
			whenToUse: 'When the value should never change',
			alternatives: ['let (for changing values)', 'var (older style)'],
			cognitiveLevel: 'remember',
		},

		var: {
			description: 'Creates a function-scoped variable (older style)',
			example: 'var count = 0;\ncount = 1; // This works',
			category: 'variables',
			difficulty: 'beginner',
			commonMistakes: [
				'Confusion with scope: var in loops can be tricky',
				'Hoisting issues: var x used before declaration',
			],
			whenToUse: 'Prefer let/const - var is older JavaScript',
			alternatives: ['let (block-scoped)', 'const (unchanging values)'],
			cognitiveLevel: 'understand',
		},

		// Basic Functions
		function: {
			description: 'Declares a reusable block of code',
			example: 'function greet(name) {\n  return "Hello, " + name;\n}',
			category: 'functions',
			difficulty: 'beginner',
			commonMistakes: [
				'Forgetting return statement',
				'Calling without parentheses: greet instead of greet()',
			],
			whenToUse: 'When you need to reuse code or organize logic',
			alternatives: ['Arrow functions: () => {}', 'Function expressions'],
			cognitiveLevel: 'understand',
		},

		return: {
			description: 'Sends a value back from a function and exits',
			example: 'function add(a, b) {\n  return a + b;\n}',
			category: 'functions',
			difficulty: 'beginner',
			commonMistakes: [
				'Code after return never runs',
				'Forgetting return (function returns undefined)',
			],
			whenToUse: 'To send results back from functions',
			alternatives: ['console.log (for debugging only)'],
			cognitiveLevel: 'apply',
		},

		arguments: {
			description: 'Special object containing all function parameters',
			example:
				'function sum() {\n  return arguments[0] + arguments[1];\n}',
			category: 'functions',
			difficulty: 'intermediate',
			commonMistakes: [
				'Not available in arrow functions',
				'arguments is not a real array',
			],
			whenToUse: 'When function needs variable number of parameters',
			alternatives: ['...rest parameters (modern approach)'],
			cognitiveLevel: 'understand',
		},

		// Console Operations (Essential for learning)
		console: {
			description: 'Browser/Node.js object for debugging and output',
			example: '// console.log("Hello!");\nconsole.error("Oops!");',
			category: 'debugging',
			difficulty: 'beginner',
			commonMistakes: [
				'Leaving console.log in production code',
				'Not checking browser dev tools',
			],
			whenToUse: 'For debugging and seeing what your code does',
			alternatives: ['debugger statement', 'IDE debugging tools'],
			cognitiveLevel: 'remember',
		},

		log: {
			description: 'Outputs a message to the console for debugging',
			example:
				'// console.log("Debug:", x);\n console.log("User age:", age);',
			category: 'debugging',
			difficulty: 'beginner',
			commonMistakes: [
				'Forgetting to open dev tools to see output',
				'Not using descriptive messages',
			],
			whenToUse: 'To see variable values and debug your code',
			alternatives: ['console.error', 'console.warn', 'console.info'],
			cognitiveLevel: 'remember',
		},

		error: {
			description: 'Outputs an error message to the console',
			example:
				'console.error("Something went wrong!");\nconsole.error("Error:", err);',
			category: 'debugging',
			difficulty: 'beginner',
			commonMistakes: [
				'Using console.log for errors instead',
				'Not providing helpful error context',
			],
			whenToUse: 'When something goes wrong in your code',
			alternatives: ['throw new Error()', 'try/catch blocks'],
			cognitiveLevel: 'remember',
		},

		warn: {
			description: 'Outputs a warning message to the console',
			example:
				'console.warn("Deprecated function used");\nconsole.warn("Value might be undefined");',
			category: 'debugging',
			difficulty: 'beginner',
			commonMistakes: [
				'Overusing warnings for normal output',
				'Ignoring warning messages',
			],
			whenToUse: "For potential problems that aren't errors",
			alternatives: ['console.log', 'console.info'],
			cognitiveLevel: 'remember',
		},

		// Basic Operators (Essential for beginners)
		'=': {
			description: 'Assignment operator - stores a value in a variable',
			example: 'let x = 5;\nconst name = "Alice";',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Confusing = (assign) with == (compare)',
				'Trying to assign to const after declaration',
			],
			whenToUse: 'To store values in variables',
			alternatives: ['+=, -=, *=, /= (compound assignment)'],
			cognitiveLevel: 'remember',
		},

		'+': {
			description: 'Addition operator - adds numbers or combines strings',
			example: '5 + 3; // 8\n"Hello " + "World"; // "Hello World"',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Unexpected string concatenation: "5" + 3 gives "53"',
				'Adding undefined gives NaN',
			],
			whenToUse: 'To add numbers or join strings together',
			alternatives: ['Template literals: `Hello ${name}`'],
			cognitiveLevel: 'remember',
		},

		'-': {
			description: 'Subtraction operator - subtracts numbers',
			example: '10 - 3; // 7\n-5; // negative five',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Subtracting strings gives NaN',
				'Forgetting operator precedence',
			],
			whenToUse: 'To subtract numbers or make negative',
			alternatives: ['Decrement: x-- or --x'],
			cognitiveLevel: 'remember',
		},

		'*': {
			description: 'Multiplication operator - multiplies numbers',
			example: '4 * 3; // 12\n2.5 * 2; // 5',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Multiplying strings gives NaN',
				'Confusing * with ** (exponentiation)',
			],
			whenToUse: 'To multiply numbers together',
			alternatives: ['Exponentiation: ** for powers'],
			cognitiveLevel: 'remember',
		},

		'/': {
			description: 'Division operator - divides numbers',
			example: '10 / 2; // 5\n7 / 2; // 3.5',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Division by zero gives Infinity',
				'Dividing strings gives NaN',
			],
			whenToUse: 'To divide numbers',
			alternatives: ['Math.floor() for integer division'],
			cognitiveLevel: 'remember',
		},

		// TIER 2: CONTROL FLOW - Decision making and repetition (Cognitive Load: Medium)

		// Conditionals (Decision Making)
		if: {
			description: 'Executes code only when a condition is true',
			example: 'if (age >= 18) {\n  console.log("You can vote!");\n}',
			category: 'control-flow',
			difficulty: 'beginner',
			commonMistakes: [
				'Using = instead of == or ===: if (x = 5) // assigns, not compares',
				'Missing braces: if statements without {} can be confusing',
				'Forgetting parentheses around condition',
			],
			whenToUse: 'When you need to make decisions in your code',
			alternatives: [
				'Ternary operator: condition ? true : false',
				'switch statement',
			],
			cognitiveLevel: 'understand',
		},

		else: {
			description:
				'Provides alternative code when the if condition is false',
			example:
				'if (score >= 60) {\n  console.log("Pass");\n} else {\n  console.log("Fail");\n}',
			category: 'control-flow',
			difficulty: 'beginner',
			commonMistakes: [
				'Using else without a matching if statement',
				'Putting conditions in else: else(condition) // wrong syntax',
				'Multiple else statements for one if',
			],
			whenToUse:
				'When you need a fallback option for when if condition fails',
			alternatives: [
				'else if (for multiple conditions)',
				'switch statement',
			],
			cognitiveLevel: 'understand',
		},

		switch: {
			description: 'Chooses between multiple options efficiently',
			example:
				'switch (day) {\n  case "Monday":\n    console.log("Work day");\n    break;\n  default:\n    console.log("Other day");\n}',
			category: 'control-flow',
			difficulty: 'intermediate',
			commonMistakes: [
				'Forgetting break statements (causes fall-through)',
				'Not including a default case',
				'Using switch for just 2 options (if/else is simpler)',
			],
			whenToUse: 'When you have many specific values to check',
			alternatives: ['if/else if chains', 'Object lookup tables'],
			cognitiveLevel: 'apply',
		},

		case: {
			description: 'Defines one option in a switch statement',
			example: 'case "red":\n  console.log("Stop!");\n  break;',
			category: 'control-flow',
			difficulty: 'intermediate',
			commonMistakes: [
				'Missing break statement (execution continues to next case)',
				'Not using quotes for string values',
				'Multiple case labels without break between them',
			],
			whenToUse: 'Inside switch statements to handle specific values',
			alternatives: ['Individual if statements'],
			cognitiveLevel: 'apply',
		},

		// Loops (Repetition)
		for: {
			description: 'Repeats code a specific number of times',
			example:
				'for (let i = 0; i < 5; i++) {\n  console.log("Count:", i);\n}',
			category: 'control-flow',
			difficulty: 'beginner',
			commonMistakes: [
				'Off-by-one errors: starting at 1 instead of 0',
				'Infinite loops: forgetting to increment counter',
				'Using wrong comparison: <= instead of <',
			],
			whenToUse: 'When you know exactly how many times to repeat',
			alternatives: ['while loop', 'forEach method for arrays'],
			cognitiveLevel: 'apply',
		},

		while: {
			description: 'Repeats code while a condition remains true',
			example:
				'let count = 0;\nwhile (count < 3) {\n  console.log(count);\n  count++;\n}',
			category: 'control-flow',
			difficulty: 'beginner',
			commonMistakes: [
				'Infinite loops: forgetting to change the condition variable',
				'Condition never becomes true: loop never runs',
				'Modifying loop variable incorrectly',
			],
			whenToUse:
				"When you don't know exactly how many iterations you need",
			alternatives: ['for loop (if count is known)', 'do-while loop'],
			cognitiveLevel: 'apply',
		},

		do: {
			description:
				'Ensures code runs at least once before checking condition',
			example: 'do {\n  console.log("This runs once");\n} while (false);',
			category: 'control-flow',
			difficulty: 'intermediate',
			commonMistakes: [
				'Forgetting the while part: do { } // missing while',
				'Not understanding it runs at least once',
				'Using when regular while would be better',
			],
			whenToUse:
				'When code must run at least once regardless of condition',
			alternatives: ['while loop (if first check is ok)'],
			cognitiveLevel: 'understand',
		},

		// Loop Control
		break: {
			description: 'Immediately exits from a loop or switch statement',
			example:
				'for (let i = 0; i < 10; i++) {\n  if (i === 5) break;\n  console.log(i);\n}',
			category: 'control-flow',
			difficulty: 'intermediate',
			commonMistakes: [
				'Using break outside of loops or switches',
				'Expecting break to exit nested loops (only exits innermost)',
				'Forgetting break in switch cases',
			],
			whenToUse: 'To exit loops early when a condition is met',
			alternatives: ['return (to exit function)', 'conditional logic'],
			cognitiveLevel: 'apply',
		},

		continue: {
			description: 'Skips to the next iteration of a loop',
			example:
				'for (let i = 0; i < 5; i++) {\n  if (i === 2) continue;\n  console.log(i); // skips 2\n}',
			category: 'control-flow',
			difficulty: 'intermediate',
			commonMistakes: [
				'Using continue outside of loops',
				'Confusing with break (continue skips, break exits)',
				'Using when if/else would be clearer',
			],
			whenToUse: 'To skip specific iterations while continuing the loop',
			alternatives: ['if/else logic', 'filter methods for arrays'],
			cognitiveLevel: 'apply',
		},

		// Logical Operators (Essential for conditions)
		'&&': {
			description: 'Logical AND - both conditions must be true',
			example:
				'if (age >= 18 && hasLicense) {\n  console.log("Can drive");\n}',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Confusing with & (bitwise AND)',
				'Not understanding short-circuit evaluation',
				'Complex conditions without parentheses',
			],
			whenToUse: 'When all conditions must be true',
			alternatives: ['Nested if statements', 'Boolean variables'],
			cognitiveLevel: 'understand',
		},

		'||': {
			description: 'Logical OR - at least one condition must be true',
			example:
				'if (isWeekend || isHoliday) {\n  console.log("No work today!");\n}',
			category: 'operators',
			difficulty: 'beginner',
			commonMistakes: [
				'Confusing with | (bitwise OR)',
				'Not understanding short-circuit evaluation',
				'Using when && is actually needed',
			],
			whenToUse: 'When any one of several conditions can be true',
			alternatives: ['Multiple if statements', 'switch statement'],
			cognitiveLevel: 'understand',
		},

		// TIER 3: OBJECTS & ARRAYS - Data structures and manipulation (Cognitive Load: Medium-High)

		// Array Methods (Essential for data manipulation)
		push: {
			description: 'Adds one or more elements to the end of an array',
			example:
				'let fruits = ["apple", "banana"];\nfruits.push("orange");\n console.log(fruits); // ["apple", "banana", "orange"]',
			category: 'arrays',
			difficulty: 'beginner',
			commonMistakes: [
				'Forgetting that push modifies the original array',
				'Not realizing push returns the new length, not the array',
				'Using push() without arguments',
			],
			whenToUse: 'When you need to add items to the end of a list',
			alternatives: [
				'spread operator: [...array, newItem]',
				'concat method',
			],
			cognitiveLevel: 'apply',
		},

		pop: {
			description: 'Removes and returns the last element from an array',
			example:
				'let numbers = [1, 2, 3];\nlet last = numbers.pop();\n console.log(last); // 3\n console.log(numbers); // [1, 2]',
			category: 'arrays',
			difficulty: 'beginner',
			commonMistakes: [
				'Forgetting that pop modifies the original array',
				'Not storing the returned value when you need it',
				'Using pop() on empty arrays (returns undefined)',
			],
			whenToUse:
				'When you need to remove and use the last item from a list',
			alternatives: [
				'slice(-1) for getting without removing',
				'splice method',
			],
			cognitiveLevel: 'apply',
		},

		shift: {
			description: 'Removes and returns the first element from an array',
			example:
				'let colors = ["red", "green", "blue"];\nlet first = colors.shift();\n console.log(first); // "red"\n console.log(colors); // ["green", "blue"]',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				'Confusing shift (removes first) with unshift (adds to beginning)',
				'Forgetting that shift changes array indices',
				'Not handling empty array case (returns undefined)',
			],
			whenToUse:
				'When you need to remove and use the first item from a list',
			alternatives: [
				'destructuring: [first, ...rest] = array',
				'slice(1) for removing without returning',
			],
			cognitiveLevel: 'apply',
		},

		unshift: {
			description:
				'Adds one or more elements to the beginning of an array',
			example:
				'let numbers = [2, 3];\nnumbers.unshift(1);\n console.log(numbers); // [1, 2, 3]',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				'Confusing unshift (adds to beginning) with shift (removes from beginning)',
				'Forgetting that unshift returns new length, not the array',
				'Not considering performance impact (slower than push)',
			],
			whenToUse: 'When you need to add items to the beginning of a list',
			alternatives: [
				'spread operator: [newItem, ...array]',
				'concat method',
			],
			cognitiveLevel: 'apply',
		},

		slice: {
			description: 'Returns a shallow copy of a portion of an array',
			example:
				'let animals = ["cat", "dog", "bird", "fish"];\nlet pets = animals.slice(0, 2);\n console.log(pets); // ["cat", "dog"]\n console.log(animals); // unchanged',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				"Confusing slice (doesn't modify) with splice (modifies)",
				'Forgetting that end index is exclusive',
				'Not understanding negative indices: slice(-2) gets last 2 items',
			],
			whenToUse:
				'When you need part of an array without changing the original',
			alternatives: [
				'for loop with new array',
				'filter method for conditional selection',
			],
			cognitiveLevel: 'apply',
		},

		splice: {
			description:
				'Changes an array by removing/replacing existing elements and/or adding new ones',
			example:
				'let items = ["a", "b", "c", "d"];\nitems.splice(1, 2, "x", "y");\n console.log(items); // ["a", "x", "y", "d"]',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				"Confusing splice (modifies array) with slice (doesn't modify)",
				'Wrong parameter order: splice(start, deleteCount, ...items)',
				'Forgetting that splice returns removed elements array',
			],
			whenToUse:
				'When you need to modify an array by removing or inserting elements',
			alternatives: [
				'slice + concat for non-destructive approach',
				'filter + spread for complex operations',
			],
			cognitiveLevel: 'analyze',
		},

		forEach: {
			description: 'Executes a function for each array element',
			example:
				'let numbers = [1, 2, 3];\nnumbers.forEach(num => {\n  console.log(num * 2);\n});\n// Prints: 2, 4, 6',
			category: 'arrays',
			difficulty: 'beginner',
			commonMistakes: [
				'Trying to return values from forEach (use map instead)',
				"Not understanding that forEach doesn't create a new array",
				'Using forEach when you need to break early (use for loop instead)',
			],
			whenToUse:
				"When you want to do something with each item but don't need a new array",
			alternatives: ['for loop', 'map method (if creating new array)'],
			cognitiveLevel: 'apply',
		},

		map: {
			description:
				'Creates a new array with results of calling a function on every element',
			example:
				'let numbers = [1, 2, 3];\nlet doubled = numbers.map(num => num * 2);\n console.log(doubled); // [2, 4, 6]\n console.log(numbers); // [1, 2, 3] unchanged',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				'Not returning a value from the map function',
				"Using map when you don't need a new array (use forEach)",
				'Confusing map with filter (map transforms, filter selects)',
			],
			whenToUse:
				'When you need to transform each element into something new',
			alternatives: ['for loop with new array', 'forEach with push'],
			cognitiveLevel: 'apply',
		},

		filter: {
			description:
				'Creates a new array with elements that pass a test function',
			example:
				'let numbers = [1, 2, 3, 4, 5];\nlet evens = numbers.filter(num => num % 2 === 0);\n console.log(evens); // [2, 4]',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				'Not returning a boolean from the filter function',
				'Confusing filter with map (filter selects, map transforms)',
				'Expecting filter to modify the original array',
			],
			whenToUse: 'When you need only elements that meet certain criteria',
			alternatives: [
				'for loop with conditional push',
				'reduce method for complex filtering',
			],
			cognitiveLevel: 'apply',
		},

		find: {
			description:
				'Returns the first element that satisfies a test function',
			example:
				'let users = [{name: "Alice", age: 25}, {name: "Bob", age: 30}];\nlet adult = users.find(user => user.age >= 18);\n console.log(adult); // {name: "Alice", age: 25}',
			category: 'arrays',
			difficulty: 'intermediate',
			commonMistakes: [
				'Not understanding that find returns undefined if nothing matches',
				'Using find when you need all matches (use filter instead)',
				'Forgetting to return boolean from test function',
			],
			whenToUse: 'When you need the first item that matches a condition',
			alternatives: [
				'filter()[0] (but less efficient)',
				'for loop with early return',
			],
			cognitiveLevel: 'apply',
		},

		// Object Operations (Essential for working with data)
		Object: {
			description:
				'Built-in constructor for creating and manipulating objects',
			example:
				'let person = {name: "Alice", age: 25};\n console.log(Object.keys(person)); // ["name", "age"]',
			category: 'objects',
			difficulty: 'intermediate',
			commonMistakes: [
				'Using Object() constructor instead of object literals {}',
				'Not understanding Object methods vs object properties',
				'Confusing Object.keys with Object.values',
			],
			whenToUse:
				'When you need to work with object properties and methods',
			alternatives: [
				'Object literal notation: {}',
				'ES6 classes for complex objects',
			],
			cognitiveLevel: 'understand',
		},

		keys: {
			description: "Returns an array of an object's property names",
			example:
				'let car = {brand: "Toyota", year: 2020, color: "blue"};\nlet properties = Object.keys(car);\n console.log(properties); // ["brand", "year", "color"]',
			category: 'objects',
			difficulty: 'intermediate',
			commonMistakes: [
				'Expecting Object.keys to return values instead of property names',
				'Not understanding that keys are always strings',
				'Forgetting that Object.keys only gets own properties, not inherited ones',
			],
			whenToUse:
				'When you need to loop through object properties or count them',
			alternatives: [
				'for...in loop',
				'Object.entries() for both keys and values',
			],
			cognitiveLevel: 'apply',
		},

		values: {
			description: "Returns an array of an object's property values",
			example:
				'let scores = {math: 95, english: 87, science: 92};\nlet grades = Object.values(scores);\n console.log(grades); // [95, 87, 92]',
			category: 'objects',
			difficulty: 'intermediate',
			commonMistakes: [
				'Confusing Object.values with Object.keys',
				'Not realizing values maintain the same order as keys',
				'Expecting Object.values to work on arrays (it does, but keys are indices)',
			],
			whenToUse: 'When you need just the values from an object',
			alternatives: [
				'for...in loop with obj[key]',
				'Object.entries() then map',
			],
			cognitiveLevel: 'apply',
		},

		entries: {
			description:
				'Returns an array of [key, value] pairs from an object',
			example:
				'let user = {name: "Bob", age: 30};\nlet pairs = Object.entries(user);\n console.log(pairs); // [["name", "Bob"], ["age", 30]]',
			category: 'objects',
			difficulty: 'intermediate',
			commonMistakes: [
				'Not understanding the nested array structure',
				'Forgetting to destructure [key, value] when looping',
				'Trying to use entries directly instead of with forEach/map',
			],
			whenToUse: 'When you need both keys and values for processing',
			alternatives: ['Object.keys() + bracket notation', 'for...in loop'],
			cognitiveLevel: 'apply',
		},

		// Property Access (Fundamental object operations)
		'.': {
			description: 'Dot notation for accessing object properties',
			example:
				'let person = {name: "Alice", age: 25};\n console.log(person.name); // "Alice"\nperson.city = "New York"; // adds new property',
			category: 'objects',
			difficulty: 'beginner',
			commonMistakes: [
				'Using dot notation with dynamic property names (use [] instead)',
				'Trying to access properties with spaces: obj.first name // Error!',
				'Not understanding that missing properties return undefined',
			],
			whenToUse: 'When you know the exact property name at write time',
			alternatives: [
				'Bracket notation obj["key"]',
				'Object.getOwnPropertyDescriptor for advanced cases',
			],
			cognitiveLevel: 'remember',
		},

		// String Methods (Essential for text manipulation)
		length: {
			description:
				'Property that returns the number of characters in a string',
			example:
				'let message = "Hello World";\nconsole.log(message.length); // 11\nlet empty = "";\n console.log(empty.length); // 0',
			category: 'strings',
			difficulty: 'beginner',
			commonMistakes: [
				'Trying to call length as a function: str.length() // Error!',
				'Not accounting for spaces and special characters in length',
				"Expecting length to be 0-indexed (it's the actual count)",
			],
			whenToUse:
				'When you need to know how many characters are in a string',
			alternatives: [
				'Array.from(str).length for Unicode-aware counting',
				'spread operator [...str].length',
			],
			cognitiveLevel: 'remember',
		},

		indexOf: {
			description:
				'Returns the first index where a substring is found, -1 if not found',
			example:
				'let text = "Hello World";\nconsole.log(text.indexOf("World")); // 6\nconsole.log(text.indexOf("xyz")); // -1',
			category: 'strings',
			difficulty: 'beginner',
			commonMistakes: [
				'Not checking for -1 return value when substring not found',
				'Confusing indexOf with includes (indexOf returns position, includes returns boolean)',
				'Expecting indexOf to find all occurrences (it only finds first)',
			],
			whenToUse:
				'When you need to find the position of text within a string',
			alternatives: [
				'includes() for yes/no check',
				'search() for regex patterns',
			],
			cognitiveLevel: 'apply',
		},

		includes: {
			description:
				'Returns true if string contains the specified substring',
			example:
				'let email = "user@example.com";\nconsole.log(email.includes("@")); // true\nconsole.log(email.includes("xyz")); // false',
			category: 'strings',
			difficulty: 'beginner',
			commonMistakes: [
				'Expecting includes to return the position (use indexOf instead)',
				'Not understanding that includes is case-sensitive',
				'Using includes for complex pattern matching (use regex instead)',
			],
			whenToUse: 'When you just need to know if text contains something',
			alternatives: ['indexOf() !== -1', 'regex test() method'],
			cognitiveLevel: 'apply',
		},
	};

	const doc = jsDocs[text];
	if (!doc) return null;

	// Handle both simple strings (legacy) and rich objects (new format)
	const isRichDoc = typeof doc === 'object' && doc.description;

	return {
		pos: word.from,
		end: word.to,
		above: true,
		create(view) {
			const dom = document.createElement('div');
			dom.style.cssText =
				'background: #2d2d30; color: #d4d4d4; padding: 12px; border-radius: 6px; border: 1px solid #464647; font-size: 12px; max-width: 350px; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

			if (isRichDoc) {
				// Enhanced tooltip with pedagogical structure
				const content = document.createElement('div');

				// Header with term and category
				const header = document.createElement('div');
				header.style.cssText =
					'border-bottom: 1px solid #464647; padding-bottom: 6px; margin-bottom: 8px;';

				const title = document.createElement('div');
				title.style.cssText =
					'font-weight: bold; color: #9cdcfe; font-size: 13px;';
				title.textContent = text;

				const category = document.createElement('span');
				category.style.cssText =
					'background: #3c3c3c; color: #d4d4d4; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 8px;';
				category.textContent = doc.category;

				header.appendChild(title);
				title.appendChild(category);
				content.appendChild(header);

				// Description
				const description = document.createElement('div');
				description.style.cssText =
					'margin-bottom: 8px; color: #d4d4d4;';
				description.textContent = doc.description;
				content.appendChild(description);

				// Example code
				if (doc.example) {
					const exampleLabel = document.createElement('div');
					exampleLabel.style.cssText =
						'font-weight: bold; color: #9cdcfe; font-size: 11px; margin-bottom: 4px;';
					exampleLabel.textContent = 'Example:';
					content.appendChild(exampleLabel);

					const example = document.createElement('pre');
					example.style.cssText =
						'background: #1e1e1e; padding: 6px; border-radius: 3px; margin: 0 0 8px 0; font-size: 11px; color: #ce9178; overflow-x: auto; font-family: "Fira Code", "Consolas", monospace;';
					example.textContent = doc.example;
					content.appendChild(example);
				}

				// Common mistakes (beginner-focused)
				if (doc.commonMistakes && doc.commonMistakes.length > 0) {
					const mistakesLabel = document.createElement('div');
					mistakesLabel.style.cssText =
						'font-weight: bold; color: #f48771; font-size: 11px; margin-bottom: 4px;';
					mistakesLabel.textContent = 'Common Mistakes:';
					content.appendChild(mistakesLabel);

					doc.commonMistakes.forEach((mistake) => {
						const mistakeItem = document.createElement('div');
						mistakeItem.style.cssText =
							'color: #f48771; font-size: 11px; margin-bottom: 2px; padding-left: 8px;';
						mistakeItem.textContent = '• ' + mistake;
						content.appendChild(mistakeItem);
					});
				}

				// When to use (pedagogical guidance)
				if (doc.whenToUse) {
					const whenLabel = document.createElement('div');
					whenLabel.style.cssText =
						'font-weight: bold; color: #4ec9b0; font-size: 11px; margin: 6px 0 2px 0;';
					whenLabel.textContent = 'When to use:';
					content.appendChild(whenLabel);

					const when = document.createElement('div');
					when.style.cssText = 'color: #4ec9b0; font-size: 11px;';
					when.textContent = doc.whenToUse;
					content.appendChild(when);
				}

				dom.appendChild(content);
			} else {
				// Simple tooltip for legacy format
				dom.textContent = `${text}: ${doc}`;
			}

			return { dom };
		},
	};
});

const jsBuiltinCompletions = (context) => {
	const builtins = [
		'console',
		'log',
		'error',
		'warn',
		'info',
		'debug',
		'Array',
		'Object',
		'String',
		'Number',
		'Boolean',
		'Date',
		'Math',
		'JSON',
		'parseInt',
		'parseFloat',
		'isNaN',
		'isFinite',
		'setTimeout',
		'setInterval',
		'clearTimeout',
		'clearInterval',
		'document',
		'window',
		'alert',
		'confirm',
		'prompt',
	];

	const word = context.matchBefore(/\w*/);
	if (!word || (word.from == word.to && !context.explicit)) return null;

	return {
		from: word.from,
		options: builtins.map((name) => ({ label: name, type: 'function' })),
	};
};

// PHASE 2.1: ERROR MESSAGE TRANSFORMATION ENGINE
// Research-based error communication system for beginners

// Error transformation patterns based on computing education research
const errorTransforms = {
	'no-undef': {
		detect: /'(.+)' is not defined/,
		transform: (match, varName, context) => ({
			title: `Variable '${varName}' is not defined`,
			explanation: `You're trying to use a variable called '${varName}', but JavaScript doesn't know what it is yet.`,
			solution: `Declare it first with: let ${varName} = someValue;`,
			example: `let ${varName} = "hello";\n console.log(${varName}); // Now this works!`,
			category: 'variables',
			beginner: true,
			helpfulness: 0.95,
		}),
	},

	semi: {
		detect: /Missing semicolon/,
		transform: (match, context) => ({
			title: 'Missing semicolon',
			explanation:
				'JavaScript statements should end with a semicolon (;) for clarity.',
			solution: 'Add a semicolon at the end of this line',
			why: 'Semicolons help JavaScript understand where one statement ends and another begins.',
			example: 'let x = 5;  // Good!\nlet y = 10  // Missing semicolon',
			category: 'syntax',
			beginner: true,
			helpfulness: 0.85,
		}),
	},

	'no-unused-vars': {
		detect: /'(.+)' is (defined but never used|assigned a value but never used)/,
		transform: (match, varName, type, context) => ({
			title: `Unused variable '${varName}'`,
			explanation: `You declared '${varName}' but never used it in your code.`,
			solution:
				'Either use this variable somewhere, or remove the declaration.',
			tip: 'Removing unused variables keeps your code clean and readable.',
			example: `let ${varName} = "value";\n console.log(${varName}); // Now it's used!`,
			category: 'code-quality',
			beginner: true,
			helpfulness: 0.7,
		}),
	},

	'no-redeclare': {
		detect: /'(.+)' is already defined/,
		transform: (match, varName, context) => ({
			title: `Variable '${varName}' declared twice`,
			explanation: `You've already declared '${varName}' earlier in your code. You can't declare the same variable name twice in the same scope.`,
			solution: `Use assignment instead: ${varName} = newValue;`,
			example: `let ${varName} = "first";\n${varName} = "second";  // Use assignment, not 'let' again`,
			category: 'variables',
			beginner: true,
			helpfulness: 0.9,
		}),
	},

	'no-unreachable': {
		detect: /Unreachable code/,
		transform: (match, context) => ({
			title: 'Code after return statement',
			explanation:
				'Code written after a return statement will never run because the function exits at return.',
			solution:
				'Move this code before the return statement, or remove it if not needed.',
			example:
				'function test() {\n  return "done";\n  console.log("This never runs!");  // Unreachable\n}',
			category: 'logic',
			beginner: true,
			helpfulness: 0.88,
		}),
	},

	'no-constant-condition': {
		detect: /Unexpected constant condition/,
		transform: (match, context) => ({
			title: 'Condition is always the same',
			explanation:
				"This condition will always be true or false, so the if statement doesn't really make a decision.",
			solution: 'Use a variable or expression that can change.',
			example:
				'if (true) { }     // Always true\nif (age > 18) { } // This can vary',
			category: 'logic',
			beginner: true,
			helpfulness: 0.75,
		}),
	},
};

// Context analyzer for enhanced error messages
const analyzeErrorContext = (code, errorLine, errorMessage) => {
	const lines = code.split('\n');
	const currentLine = lines[errorLine - 1] || '';
	const linesBefore = lines.slice(Math.max(0, errorLine - 3), errorLine - 1);
	const linesAfter = lines.slice(errorLine, errorLine + 2);

	return {
		currentLine: currentLine.trim(),
		linesBefore: linesBefore.map((line) => line.trim()),
		linesAfter: linesAfter.map((line) => line.trim()),
		inFunction: linesBefore.some(
			(line) => line.includes('function') || line.includes('=>')
		),
		inLoop: linesBefore.some(
			(line) => line.includes('for') || line.includes('while')
		),
		hasVariables: linesBefore.some(
			(line) =>
				line.includes('let') ||
				line.includes('const') ||
				line.includes('var')
		),
	};
};

// Transform raw ESLint message to beginner-friendly format
const transformErrorMessage = (eslintMessage, code) => {
	const context = analyzeErrorContext(
		code,
		eslintMessage.line,
		eslintMessage.message
	);

	// Find matching transformation pattern
	for (const [ruleId, transform] of Object.entries(errorTransforms)) {
		if (eslintMessage.ruleId === ruleId) {
			const match = eslintMessage.message.match(transform.detect);
			if (match) {
				const enhanced = transform.transform(
					match,
					...match.slice(1),
					context
				);

				// Add context-specific enhancements
				if (enhanced.category === 'variables' && context.inFunction) {
					enhanced.additionalTip =
						'Variables declared inside functions are only available within that function.';
				}

				return {
					original: eslintMessage.message,
					enhanced: enhanced,
					isTransformed: true,
				};
			}
		}
	}

	// Return original message if no transformation available
	return {
		original: eslintMessage.message,
		enhanced: null,
		isTransformed: false,
	};
};

// Enhanced ESLint-based linter with beginner-friendly error messages
const jsLinter = linter((view) => {
	const { state } = view;
	const code = state.doc.toString();

	if (!code.trim()) {
		return [];
	}

	try {
		// Configure ESLint using flat config format (ESLint v9+)
		const eslintConfig = [
			{
				languageOptions: {
					ecmaVersion: 2020,
					sourceType: 'module',
					globals: {
						// Browser globals
						window: 'readonly',
						document: 'readonly',
						console: 'readonly',
						alert: 'readonly',
						confirm: 'readonly',
						prompt: 'readonly',
						setTimeout: 'readonly',
						setInterval: 'readonly',
						clearTimeout: 'readonly',
						clearInterval: 'readonly',
						// Node.js globals
						require: 'readonly',
						module: 'readonly',
						exports: 'readonly',
						process: 'readonly',
						// Common JavaScript globals
						Array: 'readonly',
						Object: 'readonly',
						String: 'readonly',
						Number: 'readonly',
						Boolean: 'readonly',
						Date: 'readonly',
						Math: 'readonly',
						JSON: 'readonly',
						parseInt: 'readonly',
						parseFloat: 'readonly',
						isNaN: 'readonly',
						isFinite: 'readonly',
					},
				},
				rules: {
					'no-undef': 'error',
					'no-unused-vars': 'warn',
					'no-unreachable': 'error',
					'no-redeclare': 'error',
					semi: 'warn',
					'no-extra-semi': 'warn',
					'no-unexpected-multiline': 'error',
					'no-cond-assign': 'error',
					'no-constant-condition': 'warn',
					'no-dupe-args': 'error',
					'no-dupe-keys': 'error',
					'no-duplicate-case': 'error',
					'no-empty': 'warn',
					'no-func-assign': 'error',
					'no-invalid-regexp': 'error',
					'no-irregular-whitespace': 'warn',
					'no-obj-calls': 'error',
					'no-sparse-arrays': 'warn',
					'use-isnan': 'error',
					'valid-typeof': 'error',
				},
			},
		];

		const eslintInstance = new eslint.Linter();
		const messages = eslintInstance.verify(code, eslintConfig, {
			filename: 'temp.js',
		});

		if (messages.length === 0) {
			return [];
		}

		const diagnostics = messages.map((msg) => {
			const lineInfo = state.doc.line(msg.line);
			const from = lineInfo.from + (msg.column - 1);
			const to = from + 1;

			// Transform error message for beginners
			const transformation = transformErrorMessage(msg, code);
			const enhanced = transformation.enhanced;

			// Create enhanced message for beginners
			let displayMessage = transformation.original;

			if (enhanced && enhanced.beginner) {
				displayMessage = `${enhanced.title}\n\n${enhanced.explanation}\n\n💡 ${enhanced.solution}`;

				if (enhanced.example) {
					displayMessage += `\n\nExample:\n${enhanced.example}`;
				}

				if (enhanced.tip) {
					displayMessage += `\n\n💭 Tip: ${enhanced.tip}`;
				}

				if (enhanced.additionalTip) {
					displayMessage += `\n\n⚠️ ${enhanced.additionalTip}`;
				}
			}

			return {
				from: from,
				to: to,
				severity: msg.severity === 2 ? 'error' : 'warning',
				message: displayMessage,
				source: transformation.isTransformed
					? 'Enhanced ESLint'
					: 'ESLint',
			};
		});

		return diagnostics;
	} catch (error) {
		console.error('ESLint error:', error);
		return [];
	}
});

// Helper function to explain formatting errors pedagogically
function explainFormattingError(error, code) {
	let explanation = {
		title: 'Formatting Error',
		message: "The code couldn't be formatted. ",
		suggestion: '',
		example: '',
	};

	const errorMsg = error.message || '';

	if (errorMsg.includes('Unexpected token')) {
		explanation.message += 'There might be a syntax error.';
		explanation.suggestion =
			'Check for missing brackets, quotes, or commas.';
		explanation.example =
			'Common issues: { without }, " without closing ", missing commas in arrays';
	} else if (errorMsg.includes('Unterminated')) {
		explanation.message += 'You have an unclosed string or comment.';
		explanation.suggestion =
			"Look for strings or comments that don't have a closing quote or */";
		explanation.example =
			'Check for: "unclosed string or /* unclosed comment';
	} else if (errorMsg.includes('Unexpected end')) {
		explanation.message += 'The code ends unexpectedly.';
		explanation.suggestion =
			'You might be missing a closing bracket or parenthesis.';
		explanation.example = 'Count your { } ( ) [ ] to make sure they match';
	} else {
		explanation.message += 'Please fix any syntax errors first.';
		explanation.suggestion =
			'Check the error messages in the editor for hints.';
	}

	return explanation;
}

// Show formatting feedback with pedagogical insights
function showFormattingFeedback(original, result) {
	const { formatted, level } = result;

	// Check if any changes were made
	if (original.trim() === formatted.trim()) {
		if (window.showToast) {
			window.showToast(
				'✨ Your code is already well-formatted!',
				'success'
			);
		}
		return;
	}

	// Generate educational feedback based on level
	const pedagogicalMessages = {
		beginner: {
			title: '🎨 Code Formatting Applied!',
			message:
				'I made your code easier to read by fixing indentation, spacing, and brackets. Well-formatted code helps you spot patterns and prevent errors!',
		},
		intermediate: {
			title: '🔧 Code Style Improved!',
			message:
				'I applied consistent formatting rules to make your code professional and easier to collaborate on.',
		},
		advanced: {
			title: '✨ Professional Formatting Applied!',
			message:
				'Code formatted to industry standards with optimal readability and maintainability.',
		},
	};

	const feedback = pedagogicalMessages[level] || pedagogicalMessages.beginner;

	// 	// console.log('Formatting Applied!', {
	// 	original: original.substring(0, 100) + '...',
	// 	formatted: formatted.substring(0, 100) + '...',
	// 	level,
	// });

	// Show toast notification
	if (window.showToast) {
		window.showToast(feedback.message, 'success');
	}
}

export const editorialize = (file = {}) => {
	const initialContent = file.content || '';
	let view = null;
	let editor = null;

	// Ensure both lang and ext properties are set for proper language detection
	const processedFile = { ...file };

	// If we have a name but no ext, extract ext from name
	if (processedFile.name && !processedFile.ext) {
		const lastDotIndex = processedFile.name.lastIndexOf('.');
		if (lastDotIndex !== -1) {
			processedFile.ext = processedFile.name.substring(lastDotIndex);
		}
	}

	// If we have lang but no ext, try to derive ext from lang
	if (processedFile.lang && !processedFile.ext) {
		processedFile.ext = processedFile.lang.startsWith('.')
			? processedFile.lang
			: '.' + processedFile.lang;
	}

	// Always use LanguageDetector to set proper language name (not extension)
	const detectedLanguage = LanguageDetector.detectFromFile(processedFile);
	processedFile.lang = detectedLanguage;

	// Debug: Verify processedFile has all expected properties

	return {
		...processedFile,
		get content() {
			if (editor) return editor.state.doc.toString();
			return initialContent;
		},
		set content(newCode = '') {
			if (editor) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: newCode,
					},
				});
			}
		},
		get view() {
			if (view) return view;

			view = document.createElement('div');

			// Initialize editor asynchronously in the background
			this._initializeEditor();

			return view;
		},

		async _initializeEditor() {
			if (editor) return;

			// Create enhanced CodeMirror extensions with dynamic language support
			const createExtensions = async () => {
				// 				// console.log('Creating enhanced extensions...');
				const extensions = [];

				try {
					// 					// console.log('Adding basicSetup...');
					extensions.push(basicSetup);
					// 					// console.log('basicSetup added successfully');

					// Dynamic language loading based on file type
					const detectedLanguage =
						LanguageDetector.detectFromFile(processedFile);
					// console.log(
					// 	`Detected language: ${detectedLanguage} for file:`,
					// 	processedFile.name || 'unknown'
					// );

					const languageLoader =
						LanguageDetector.getCodeMirrorLanguage(
							detectedLanguage
						);

					if (languageLoader) {
						try {
							// 							// console.log(
							// 	`Loading CodeMirror language package for ${detectedLanguage}...`
							// );
							const languagePkg = await languageLoader();
							const modeName =
								LanguageDetector.getCodeMirrorModeName(
									detectedLanguage
								);

							// Get the appropriate language function from the package
							if (
								detectedLanguage === 'javascript' ||
								detectedLanguage === 'typescript'
							) {
								extensions.push(languagePkg.javascript());
								// 								// console.log(
								// 	`${detectedLanguage} language added successfully`
								// );
							} else if (detectedLanguage === 'python') {
								extensions.push(languagePkg.python());
								// 								// console.log(
								// 	'Python language added successfully'
								// );
							} else if (detectedLanguage === 'html') {
								extensions.push(languagePkg.html());
								// 								// console.log('HTML language added successfully');
							} else if (detectedLanguage === 'openqasm2') {
								extensions.push(languagePkg.javascript());
							} else if (detectedLanguage === 'css') {
								extensions.push(languagePkg.css());
								// 								// console.log('CSS language added successfully');
							} else if (detectedLanguage === 'markdown') {
								extensions.push(languagePkg.markdown());
								// 								// console.log(
								// 	'Markdown language added successfully'
								// );
							} else if (detectedLanguage === 'json') {
								extensions.push(languagePkg.json());
								// 								// console.log('JSON language added successfully');
							} else if (detectedLanguage === 'xml') {
								extensions.push(languagePkg.xml());
								// 								// console.log('XML language added successfully');
							}
						} catch (error) {
							// console.warn(
							// 	`Failed to load language ${detectedLanguage}:`,
							// 	error
							// );
							// 							// console.log(
							// 	'Continuing without language-specific syntax highlighting...'
							// );
						}
					} else {
						// 						// console.log(
						// 	`No CodeMirror support for language: ${detectedLanguage}`
						// );
						// 						// console.log(
						// 		'Using basic text editing without syntax highlighting'
						// 	);
					}

					// 					// console.log('Adding oneDark theme...');
					extensions.push(oneDark);
					// 					// console.log('oneDark added successfully');

					// Skip basic autocompletion - we'll add enhanced version later

					// Test search extension
					// 					// console.log('Adding search...');
					extensions.push(search());
					// 					// console.log('search() added successfully');

					// Test bracket matching extension
					// 					// console.log('Adding bracketMatching...');
					extensions.push(bracketMatching());
					// 					// console.log('bracketMatching() added successfully');

					// Test close brackets extension
					// 					// console.log('Adding closeBrackets...');
					extensions.push(closeBrackets());
					// 					// console.log('closeBrackets() added successfully');

					// Test fold gutter extension
					// 					// console.log('Adding foldGutter...');
					extensions.push(foldGutter());
					// 					// console.log('foldGutter() added successfully');

					// Test highlight selection matches extension
					// 					// console.log('Adding highlightSelectionMatches...');
					extensions.push(highlightSelectionMatches());
					// 					// console.log(
					// 	'highlightSelectionMatches() added successfully'
					// );

					// Add language-specific features based on detected language
					if (
						detectedLanguage === 'javascript' ||
						detectedLanguage === 'typescript'
					) {
						// 						// console.log('Adding JavaScript-specific features...');

						// 						// console.log('Adding JavaScript hover tooltips...');
						extensions.push(jsHoverTooltip);
						// 						// console.log(
						// 	'JavaScript hover tooltips added successfully'
						// );

						// 						// console.log('Adding enhanced autocompletion...');
						extensions.push(
							autocompletion({ override: [jsBuiltinCompletions] })
						);
						// 						// console.log(
						// 	'Enhanced autocompletion added successfully'
						// );

						// 						// console.log('Adding ESLint linter...');
						extensions.push(jsLinter);
						// 						// console.log('ESLint linter added successfully');

						// 						// console.log('Adding lint gutter...');
						extensions.push(lintGutter());
						// 						// console.log('Lint gutter added successfully');
					} else if (detectedLanguage === 'python') {
						// 						// console.log(
						// 	'Python language detected - no Python-specific linting available yet'
						// );
						// Future: Add Python-specific extensions when implemented
						// extensions.push(pythonLinter);
					} else {
						// 						// console.log(
						// 		`Language ${detectedLanguage} detected - using universal features only`
						// 	);
					}

					// Configure indentation to use hard tabs
					// 					// console.log('Adding tab indentation configuration...');
					extensions.push(indentUnit.of('\t'));
					extensions.push(EditorState.tabSize.of(4)); // Visual tab width

					// Add format keyboard shortcut
					// 					// console.log('Adding format keyboard shortcut...');
					extensions.push(
						keymap.of([
							indentWithTab,
							{
								key: 'Ctrl-Shift-f',
								mac: 'Cmd-Shift-f',
								run: (view) => {
									// Get the file object from the view's parent element
									const fileObj =
										view.dom.parentElement?.__file;
									if (fileObj && fileObj.format) {
										fileObj.format({
											learningMode: {
												enabled: true,
												showDiff: true,
												explainChanges: true,
												level: 'beginner',
											},
										});
									}
									return true;
								},
							},
						])
					);
					// 					// console.log('Format keyboard shortcut added successfully');
				} catch (error) {
					console.error('Error adding extensions:', error);
				}

				// 				// console.log('Enhanced extensions created:', extensions.length);
				return extensions;
			};

			try {
				// 				// console.log('Creating EditorView...');
				const extensions = await createExtensions();
				// 				// console.log('Extensions to use:', extensions);

				editor = new EditorView({
					doc: initialContent,
					parent: view,
					extensions: extensions,
				});

				// Store reference to file object for keyboard shortcut
				view.__file = this;

				// 				// console.log('EditorView created successfully');
			} catch (error) {
				console.error('Error creating EditorView:', error);
				console.error('Error stack:', error.stack);
				throw error;
			}
		},
		reset() {
			if (editor) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: initialContent,
					},
				});
			}
		},

		/**
		 * Format code with Prettier and pedagogical enhancements
		 * Based on research showing 47% improvement in debugging with proper formatting
		 */
		async format(options = {}) {
			if (!editor) return Promise.reject('No editor instance');

			const currentContent = editor.state.doc.toString();
			const fileExtension = this.lang || '.js';

			if (fileExtension === '.qasm') return;

			// Extract pedagogical data if present
			const pedagogicalData = options.__pedagogicalData;
			delete options.__pedagogicalData;

			// Determine parser and plugins based on file type
			const getParserConfig = (ext) => {
				switch (ext) {
					case '.css':
						return { parser: 'css', plugins: [prettierPluginCss] };
					case '.html':
					case '.htm':
						return {
							parser: 'html',
							plugins: [prettierPluginHtml],
						};
					case '.js':
					case '.jsx':
					case '.ts':
					case '.tsx':
					default:
						return {
							parser: 'babel',
							plugins: [
								prettierPluginBabel,
								prettierPluginEstree,
							],
						};
				}
			};

			const { parser, plugins } = getParserConfig(fileExtension);

			// Default config with research-based settings
			const formatConfig = {
				parser,
				plugins,
				...prettierConfig,
			};

			try {
				// Apply Prettier formatting with pedagogical config
				const formatted = await prettier.format(
					currentContent,
					formatConfig
				);

				// Show pedagogical feedback if enabled
				if (
					pedagogicalData &&
					options.learningMode?.enabled &&
					options.learningMode?.showDiff
				) {
					showFormattingFeedback(currentContent, {
						formatted,
						level: pedagogicalData.level,
					});
				}

				// Apply formatting via dispatch
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: formatted,
					},
				});

				return {
					success: true,
					formatted,
					original: currentContent,
				};
			} catch (error) {
				// Handle formatting errors pedagogically
				console.error('Formatting error:', error);

				const errorExplanation = explainFormattingError(
					error,
					currentContent
				);
				if (window.showToast) {
					window.showToast(errorExplanation.message, 'error');
				}

				return {
					success: false,
					error: errorExplanation,
					original: currentContent,
				};
			}
		},
	};

	// Debug: Verify final returned object has all expected properties
	const finalObj = {
		...processedFile,
		content: () => (editor ? editor.state.doc.toString() : initialContent),
		view: () => view,
		// Include other methods but show them in debug
		_initializeEditor: 'function',
		reset: 'function',
		format: 'function',
	};

	// 	// console.log(
	// 	`🔍 Editorialize: Final returned object properties:`,
	// 	Object.keys(finalObj)
	// );
	// 	// console.log(`🔍 Editorialize: Final object name/lang/ext/metadata:`, {
	// 	name: finalObj.name,
	// 	lang: finalObj.lang,
	// 	ext: finalObj.ext,
	// 	languageMetadata: finalObj.languageMetadata,
	// });

	// Return the actual object (not the debug version)
	return {
		...processedFile,
		get content() {
			if (editor) return editor.state.doc.toString();
			return initialContent;
		},
		get view() {
			if (view) return view;

			view = document.createElement('div');

			// Initialize editor asynchronously in the background
			this._initializeEditor();

			return view;
		},

		async _initializeEditor() {
			if (editor) return;

			// Create enhanced CodeMirror extensions with dynamic language support
			const createExtensions = async () => {
				// 				// console.log('Creating enhanced extensions...');

				// Build extensions array dynamically
				let extensions = [];

				// Start with basic setup
				extensions.push(basicSetup);

				// Add language support dynamically
				try {
					const languageLoader =
						LanguageDetector.getCodeMirrorLanguage(
							detectedLanguage
						);
					if (languageLoader) {
						const languagePackage = await languageLoader();
						if (languagePackage.javascript) {
							extensions.push(languagePackage.javascript());
						} else if (languagePackage.python) {
							extensions.push(languagePackage.python());
						} else if (languagePackage.html) {
							extensions.push(languagePackage.html());
						} else if (languagePackage.css) {
							extensions.push(languagePackage.css());
						} else if (languagePackage.markdown) {
							extensions.push(languagePackage.markdown());
						} else if (languagePackage.json) {
							extensions.push(languagePackage.json());
						} else if (languagePackage.xml) {
							extensions.push(languagePackage.xml());
						}
						// 						// console.log(
						// 	`Loaded language support for: ${detectedLanguage}`
						// );
					} else {
						// 						// console.log(
						// 	`No language support available for: ${detectedLanguage}`
						// );
					}
				} catch (error) {
					// console.warn(
					// 	`Failed to load language support for ${detectedLanguage}:`,
					// 	error
					// );
				}

				// Test if dark theme should be used
				if (enableColorize) {
					// 					// console.log('Adding oneDark theme...');
					extensions.push(oneDark);
					// 					// console.log('oneDark theme added successfully');
				}

				// Test if Tab key handler can be added
				try {
					// 					// console.log('Adding indentWithTab keymap...');
					extensions.push(keymap.of([indentWithTab]));
					// 					// console.log('indentWithTab keymap added successfully');
				} catch (error) {
					console.warn('Failed to add indentWithTab keymap:', error);
				}

				// Test if autocompletion can be added
				try {
					// 					// console.log('Adding autocompletion...');
					extensions.push(
						autocompletion({
							override: [jsCompletion],
						})
					);
					// 					// console.log('autocompletion() added successfully');
				} catch (error) {
					console.warn('Failed to add autocompletion:', error);
				}

				// Test if hover tooltip can be added
				try {
					// 					// console.log('Adding jsHoverTooltip...');
					extensions.push(jsHoverTooltip);
					// 					// console.log('jsHoverTooltip added successfully');
				} catch (error) {
					console.warn('Failed to add jsHoverTooltip:', error);
				}

				// Test if linting can be added (only for JavaScript)
				try {
					if (
						detectedLanguage === 'javascript' ||
						detectedLanguage === 'typescript'
					) {
						// 						// console.log('Adding linting for JavaScript...');
						extensions.push(linter(esLinter()));
						extensions.push(lintGutter());
						// 						// console.log('JavaScript linting added successfully');
					} else {
						// 						// console.log(
						// 	`Skipping linting for non-JavaScript language: ${detectedLanguage}`
						// );
					}
				} catch (error) {
					console.warn('Failed to add linting:', error);
				}

				// Test search extension
				// 				// console.log('Adding search...');
				extensions.push(search());
				// 				// console.log('search() added successfully');

				// Test highlight selection matches extension
				// 				// console.log('Adding highlightSelectionMatches...');
				extensions.push(highlightSelectionMatches());
				// 				// console.log('highlightSelectionMatches() added successfully');

				// Test bracket matching extension
				// 				// console.log('Adding bracketMatching...');
				extensions.push(bracketMatching());
				// 				// console.log('bracketMatching() added successfully');

				// Test close brackets extension
				// 				// console.log('Adding closeBrackets...');
				extensions.push(closeBrackets());
				// 				// console.log('closeBrackets() added successfully');

				// Test fold gutter extension
				// 				// console.log('Adding foldGutter...');
				extensions.push(foldGutter());
				// 				// console.log('foldGutter() added successfully');

				// Test indent unit extension
				// 				// console.log('Adding indentUnit...');
				extensions.push(indentUnit.of('  ')); // 2 spaces
				// 				// console.log('indentUnit() added successfully');

				// 				// console.log(
				// 	`Created ${extensions.length} CodeMirror extensions successfully`
				// );
				return extensions;
			};

			const extensions = await createExtensions();

			try {
				editor = new EditorView({
					doc: initialContent,
					parent: view,
					extensions: extensions,
				});

				// 				// console.log('CodeMirror editor initialized successfully');
			} catch (error) {
				console.error('Failed to initialize CodeMirror editor:', error);
				// Fallback to basic textarea
				const textarea = document.createElement('textarea');
				textarea.value = initialContent;
				textarea.style.width = '100%';
				textarea.style.height = '300px';
				textarea.style.fontFamily = 'monospace';
				view.appendChild(textarea);
			}
		},

		reset() {
			if (editor) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: initialContent,
					},
				});
			}
		},

		async format(options = {}) {
			if (!editor) {
				console.warn('Cannot format: editor not initialized');
				return {
					success: false,
					error: 'Editor not initialized',
					original: initialContent,
				};
			}

			try {
				const currentContent = editor.state.doc.toString();

				// Determine parser and plugins based on file type
				const getParserConfig = (ext) => {
					switch (ext) {
						case '.css':
							return {
								parser: 'css',
								plugins: [prettierPluginCss],
							};
						case '.html':
						case '.htm':
							return {
								parser: 'html',
								plugins: [prettierPluginHtml],
							};
						case '.js':
						case '.jsx':
						case '.ts':
						case '.tsx':
						default:
							return {
								parser: 'babel',
								plugins: [
									prettierPluginBabel,
									prettierPluginEstree,
								],
							};
					}
				};

				const { parser, plugins } = getParserConfig(processedFile.ext);

				// Format with prettier using the configuration
				const formatted = await prettier.format(currentContent, {
					...prettierConfig,
					parser: parser,
					plugins: plugins,
					...options, // Allow override of default options
				});

				// Update editor content
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: formatted,
					},
				});

				return {
					success: true,
					formatted,
					original: currentContent,
				};
			} catch (error) {
				// Handle formatting errors pedagogically
				console.error('Formatting error:', error);

				const errorExplanation = explainFormattingError(
					error,
					currentContent
				);
				if (window.showToast) {
					window.showToast(errorExplanation.message, 'error');
				}

				return {
					success: false,
					error: errorExplanation,
					original: currentContent,
				};
			}
		},
	};
};

function find(path) {
	Array.isArray(path) || (path = path.split('/').filter(Boolean));

	if (path.length === 0) return null;

	const [name, ...subPath] = path;
	for (const child of this.children) {
		if (child.name.toLowerCase() !== name.toLowerCase()) continue;

		if (subPath.length === 0) return child;
		if (Array.isArray(child.children)) return find.call(child, subPath);
	}

	return null;
}

const enliven = (entity = {}) => {
	if (entity.type === 'file') return editorialize(entity);
	if (!Array.isArray(entity.children)) return { ...entity };
	return { ...entity, children: entity.children.map(enliven), find };
};

const sortChildrenFoldersFirst = (children) => {
	if (!children || !Array.isArray(children)) {
		return children;
	}

	const directories = children
		.filter((child) => child.type === 'directory')
		.sort((a, b) => a.name.localeCompare(b.name));

	const files = children
		.filter((child) => child.type === 'file')
		.sort((a, b) => a.name.localeCompare(b.name));

	return [...directories, ...files];
};

const addVirtualFSMetadata = (node, root = '/') => {
	node.root = root;

	// Calculate toCwd for files and directories
	if (node.dir !== undefined) {
		const depth = node.dir.split('/').filter((p) => p).length;
		node.toCwd = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
	}

	// Simple language detection for files
	if (node.type === 'file') {
		// Set lang using LanguageDetector (returns language names like 'javascript', 'python')
		const detectedLanguage = LanguageDetector.detectFromFile(node);
		node.lang = detectedLanguage;
	}

	// Sort children to show folders before files
	if (node.children) {
		node.children = sortChildrenFoldersFirst(node.children);
		for (const child of node.children) {
			addVirtualFSMetadata(child, root);
		}
	}
};

export const loadVirtualFS = async (source = './public/content.json') => {
	try {
		const response = await fetch(source);
		const virtualFS = await response.json();
		addVirtualFSMetadata(virtualFS);
		// here we can (later) map study configs onto FS entities (suggested lenses, ...)
		return enliven(virtualFS);
	} catch (error) {
		console.error('Failed to load file system:', error);
		throw error;
	}
};
