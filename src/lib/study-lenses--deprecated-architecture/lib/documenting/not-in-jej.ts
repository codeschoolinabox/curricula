import type { DocEntry as DocumentEntry } from '../../orchestrate/lib/editing/types.js';

const NOT_IN_JEJ_ENTRIES: Readonly<Record<string, DocumentEntry>> = {
	var: {
		description:
			"JavaScript's older variable-declaration keyword. Function-scoped, hoisted, allows redeclaration.",
		example: 'var count = 0;\ncount = 1;',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, prefer 'let' (or 'const') — 'var' lingers in legacy code but isn't used at this language level.",
		commonMistakes: [
			"Using 'var' at this language level — JEJ uses 'let' (for changing values) and 'const' (for fixed bindings) instead.",
			'Function-scope vs block-scope confusion: var leaks past the nearest block, which let does not.',
			"Re-declaration without notice: 'var x = 1; var x = 2;' silently works with var but is rejected by let.",
		],
		whyNotInJej:
			'An older way to declare a variable that JEJ does not use. `var` changes three things compared to `let` and `const`: the name can be used before its declaration appears in the code (sometimes called "hoisting"), `{ }` blocks do not bound where the name is visible, and re-declaring the same name produces no error. JEJ keeps one declaration model — `let` and `const`, with `{ }` block boundaries and the TDZ rule you have already seen — so the scope chain stays simple. `var` would mean two parallel rules to track for the same idea.',
	},
	function: {
		description:
			"Declares a reusable named function (or, as 'function () {}', an anonymous expression).",
		example: 'function add(a, b) {\n\treturn a + b;\n}',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, for any reusable piece of code. JEJ runs as a flat script and uses no functions of any kind — declarations, expressions, or arrows. If you find yourself repeating, that's a sign the exercise scope is wrong.",
		commonMistakes: [
			"Reaching for 'function' at this language level — JEJ has no functions; reach for inline expressions and loops instead.",
			"Confusing function declarations (hoisted) with function expressions ('const f = function () {}', not hoisted) — both are outside JEJ.",
		],
		whyNotInJej:
			'A way to package some statements under a name so you can run them many times with different inputs. To support that, the machine has to keep track of where each call came from, what was passed in, and where to return when the call finishes. JEJ programs run as one flat sequence — there\'s never a "somewhere to come back to." Defining your own functions opens up a new language level with a new notional machine.',
	},
	class: {
		description:
			'Declares a class with constructor and methods — JavaScript syntactic sugar for prototype-based OO.',
		example:
			'class Point {\n\tconstructor(x, y) { this.x = x; this.y = y; }\n}',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, for grouping data with the behaviors that operate on it. JEJ programs use only primitive values and the small set of built-in objects (Math, String, etc.); user-defined classes are outside the language level.',
		commonMistakes: [
			"Reaching for 'class' at this language level — JEJ does not introduce user-defined types.",
			'Treating class as the only way to organize state — primitives + literals cover the JEJ exercise space.',
		],
		whyNotInJej:
			"A way to define your own type — a template that produces objects with their own data and methods. JEJ's value set is the primitives plus a fixed group of built-in objects (Math, String, Number, Date, etc.). User-defined types do not exist at this language level. Adding `class` would introduce object-creation machinery, the `this` binding, your own prototype chain entries, and inheritance relationships between your types — opening up a new language level with a new notional machine.",
	},
	'=>': {
		description:
			"The arrow-function syntax. '(a, b) => a + b' is shorthand for an anonymous function.",
		example: 'const add = (a, b) => a + b;',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, for concise inline callbacks or short functions. JEJ has no functions — arrow functions are not allowed at this language level.',
		commonMistakes: [
			"Reaching for '=>' at this language level — arrow functions ARE functions, and JEJ has none.",
			"Confusing the arrow with greater-than-or-equal '>=' — typing 'a => b' when you meant 'a >= b'.",
		],
		whyNotInJej:
			'Another way to define a function — the arrow expression. `(a, b) => a + b` is shorthand for a function. Since JEJ has no user-defined functions of any shape, arrow form is also out: the call-and-return bookkeeping the machine would need does not exist at this language level. Both `function` declarations and `=>` expressions open up the same new language level with a new notional machine.',
	},
	this: {
		description:
			"A binding to the 'receiver' of the current call — the object before the dot in 'obj.method()', or the global object in plain calls.",
		example: 'function describe() {\n\treturn this.name;\n}',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, inside methods and constructors. JEJ has no functions or classes for 'this' to refer to, so it's not used at this language level.",
		commonMistakes: [
			"Reaching for 'this' at this language level — there's nothing for it to point at.",
			"Confusing 'this' in arrow vs regular functions — arrows inherit it from the enclosing scope; regular functions get it from the call site.",
		],
		whyNotInJej:
			"A reference to the receiver — the value before the dot in a method call. JEJ has receivers: when you write `'hello'.toUpperCase()`, `'hello'` is the receiver, and the `this` machinery internally points at it while `.toUpperCase` runs. But user code in JEJ never sits inside a method or function body, so there is nowhere for your code to read `this` from. It is machinery without an anchor at this language level — meaningful when you can define methods, invisible when you cannot. Defining methods opens up a new language level with a new notional machine.",
	},
	throw: {
		description:
			'Raises an exception with the given value, unwinding the call stack until a `catch` is found.',
		example: 'throw new Error("something went wrong");',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, to signal an error from a function. JEJ programs do not handle exceptions; if a check fails, return early or 'console.error' the cause.",
		commonMistakes: [
			"Reaching for 'throw' at this language level — JEJ programs do not handle exceptions.",
			'Throwing a string (\'throw "oops"\') instead of an Error — the stack trace is lost.',
		],
		whyNotInJej:
			'A way to raise a signal that immediately jumps out of the current sequence and looks for `try`/`catch` to handle it (also not in JEJ). JEJ handles errors with one rule: a runtime error stops the program and surfaces in the dev console with its location. `throw` adds a second control-flow channel — one path for normal flow, another for raised signals — and learning when to use which opens up a new language level with a new notional machine.',
	},
	try: {
		description:
			'Wraps code that might throw; pair with `catch` (and optionally `finally`) to handle the error.',
		example: 'try {\n\trisky();\n} catch (e) {\n\tconsole.error(e);\n}',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, to recover from runtime errors. JEJ programs do not handle exceptions at this language level.',
		commonMistakes: [
			"Reaching for 'try/catch' at this language level — JEJ has no exception handling.",
			'Catching errors only to ignore them silently — at this level, you would write a guard before the operation instead.',
		],
		whyNotInJej:
			'The other half of `throw` (also not in JEJ). `try { ... } catch (e) { ... }` is the way code says "if a `throw` happens inside this block, jump here." JEJ has one control-flow path — errors stop the program in the dev console — so the second path that `try`/`catch` and `throw` set up has nothing to enable. Two parallel control-flow paths open up in a new language level with a new notional machine.',
	},
	import: {
		description:
			'Brings in bindings from another module (file). Pair with `export` in the source module.',
		example: 'import { add } from "./math.js";',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, for splitting code across files. JEJ programs are single-file scripts — module syntax isn't used at this language level.",
		commonMistakes: [
			"Reaching for 'import' at this language level — JEJ is single-file.",
			"Confusing static 'import' with dynamic 'import()' — they're different syntactic forms.",
		],
		whyNotInJej:
			"A way to bring names from another file into the current one. JEJ programs are a single file with a single scope chain; names come from your script plus the built-in globals (Math, console, prompt, etc.). `import` adds a second name-source that resolves through a module system rather than through your script's scope chain. JEJ keeps name resolution to one chain — the look-up walks you predict are the ones that run. Modules open up a new language level with a new notional machine.",
	},
	async: {
		description:
			"Marks a function as asynchronous — it always returns a Promise and may use 'await' inside.",
		example: 'async function load() {\n\tconst data = await fetch("/api");\n}',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, for code that waits on I/O or timers. JEJ has no functions to be async — and JEJ programs are synchronous at this language level.',
		commonMistakes: [
			"Reaching for 'async' at this language level — there are no functions, and no awaiting.",
		],
		whyNotInJej:
			'A marker on a function that makes it return a Promise — a value standing in for a result that has not arrived yet. JEJ does not have user-defined functions, and it also does not have Promises: JEJ programs are synchronous, meaning the next instruction runs immediately after the current one. Adding `async` would require both the function machinery (call/return bookkeeping) and the Promise machinery (a pending-result value-type with its own state), opening up a new language level with a new notional machine.',
	},
	await: {
		description:
			'Pauses an async function until the awaited Promise settles, then resumes with its resolved value.',
		example: 'const data = await fetch("/api");',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, inside async functions, to wait on Promises. JEJ programs are synchronous; 'await' is not used at this language level.",
		commonMistakes: [
			"Reaching for 'await' at this language level — JEJ is synchronous.",
			"Using 'await' outside an async function — that's a syntax error in regular modules.",
		],
		whyNotInJej:
			"The other half of `async`. Inside an `async` function, `await someValue` pauses the function until `someValue`'s pending result arrives, then resumes with the resolved value. JEJ programs run synchronously — every line runs to completion before the next, no pausing-and-resuming — so there is nothing for `await` to pause inside. Both `async` and `await` open up a new language level with a new notional machine for asynchronous code.",
	},
	split: {
		description:
			'String method that breaks a string into an array of substrings on a separator.',
		example: '"a,b,c".split(","); // ["a", "b", "c"]',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, for parsing CSVs and structured strings. JEJ does not use arrays — '.split' returns one, so it's outside this language level. To inspect characters use '.charAt(i)' inside a 'for' loop over '.length'.",
		commonMistakes: [
			"Reaching for '.split' at this language level — JEJ has no arrays.",
			'Forgetting that an empty separator splits into characters: "abc".split("") is ["a","b","c"].',
		],
		whyNotInJej:
			"A method that breaks a string into pieces and returns them as an array. You have used string methods that return primitives: `.toUpperCase` returns a string, `.indexOf` returns a number, `.includes` returns a boolean. `.split` is the same shape of method call, but its return value is an _array_ — and JEJ's value-type set is primitives only (string, number, boolean, BigInt, `null`, `undefined`). Arrays are a different value-type that opens up in a new language level with a new notional machine; `.split` waits for that level.",
	},
	match: {
		description:
			'String method that returns an array of regex matches (or capturing groups), or null if no match.',
		example: '"hello".match(/l/); // ["l", index: 2, ...]',
		isJEJ: false,
		whenToUse:
			"In modern JavaScript, for extracting regex matches from a string. JEJ does not use arrays — '.match' returns one, so it's outside this language level.",
		commonMistakes: [
			"Reaching for '.match' at this language level — its return shape is array-based.",
			"Expecting a non-null return for 'no match' — match returns null, not an empty array.",
		],
		whyNotInJej:
			"A method that searches a string for a pattern and returns the matches as an array. You have used string methods that return primitives: `.toUpperCase` returns a string, `.indexOf` returns a number, `.includes` returns a boolean. `.match` is the same shape of method call, but its return value is an _array_ — and JEJ's value-type set is primitives only. Arrays are a different value-type that opens up in a new language level with a new notional machine; `.match` waits for that level.",
	},
	matchAll: {
		description:
			'String method that returns all regex matches as an iterator over result arrays. Requires the `g` flag on the regex.',
		example:
			"\"abcabc\".matchAll(/a/g); // iterator over { 0: 'a', index: 0 }, { 0: 'a', index: 3 }",
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, when you need every regex match plus its position. JEJ does not use iterators or arrays — `.matchAll` returns both, so it is outside this language level.',
		commonMistakes: [
			"Reaching for '.matchAll' at this language level — JEJ has no arrays or iterators.",
			"Forgetting the required `g` flag — `'abc'.matchAll(/a/)` throws TypeError.",
		],
		whyNotInJej:
			"A method that returns all regex matches as an iterator over result arrays. You have used string methods that return primitives: `.toUpperCase` returns a string, `.indexOf` returns a number, `.includes` returns a boolean. `.matchAll` is the same shape of method call, but its return value is an _iterator_ yielding arrays — neither of which JEJ has. JEJ's value-type set is primitives only. Iterators and arrays open up in a new language level with a new notional machine; `.matchAll` waits for that level.",
	},
	constructor: {
		description:
			"A reference to the function that produced this value. `'hello'.constructor === String`, `(0).constructor === Number`, etc.",
		example: "'hello'.constructor; // String\n(0).constructor; // Number",
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, for runtime reflection — checking what kind of value you have. JEJ does not use code-level reflection; type-by-type behavior is decided by which method you call.',
		commonMistakes: [
			"Reaching for '.constructor' at this language level — JEJ treats values by what they let you do (their methods), not by introspecting which class produced them.",
		],
		whyNotInJej:
			"Every string, number, and built-in object in JEJ has a `.constructor` reference that points back at the function the language used to make it internally. You've used the prototype chain to find methods — `.toUpperCase` on a string, `.toFixed` on a number. `.constructor` walks the same chain but to ask about its own structure rather than to find a method. JEJ teaches the chain as a tool you use; `.constructor` treats the chain as a thing you inspect — _reflection_: code that asks about code, a programming pattern that opens up in a new language level with a new notional machine.",
	},
	// `__proto__` as a bare object-literal key is the special
	// prototype-setter form in JS, not a regular property. Using
	// computed-property syntax (`['__proto__']`) creates a normal
	// property named `__proto__` instead.
	['__proto__']: {
		description:
			'An older getter/setter exposing the prototype of a value — the next link in the prototype chain. Modern equivalents: `Object.getPrototypeOf` and `Object.setPrototypeOf`.',
		example: "'hello'.__proto__; // String.prototype",
		isJEJ: false,
		whenToUse:
			'Almost never in modern JavaScript — `Object.getPrototypeOf` is the standard read. Mutating `__proto__` is especially discouraged for performance and clarity reasons.',
		commonMistakes: [
			"Reaching for '.__proto__' at this language level — JEJ teaches the prototype chain as a method-lookup walk, not as a thing you reach in to manipulate.",
		],
		whyNotInJej:
			"A direct handle on the next link in the prototype chain — the object the language consults when a method is not found on the value itself. You have seen the prototype chain at work when `'hi'.toUpperCase` is found on `String.prototype`. `__proto__` lets your code grab that link directly, read it, or even replace it. JEJ teaches the chain as part of the machinery the language uses; `__proto__` opens up _reflection_ on that machinery — a programming pattern that comes with a new language level and a new notional machine.",
	},
	prototype: {
		description:
			'A property on constructor functions that holds the object new instances inherit from. `String.prototype` holds methods like `.toUpperCase` that strings inherit.',
		example:
			'String.prototype; // { toUpperCase, slice, ... }\nNumber.prototype; // { toFixed, ... }',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, when defining or extending classes and prototype objects. JEJ programs do not define classes, and built-in `.prototype` objects are not reached into directly — methods are called through the value, not through `String.prototype.toUpperCase.call(value)`.',
		commonMistakes: [
			"Reaching for '.prototype' at this language level — JEJ uses the prototype chain implicitly (via method calls); it does not expose `.prototype` as a learner-side surface.",
		],
		whyNotInJej:
			"The bag of methods every value of a given type inherits from. When you call `'hi'.toUpperCase()`, the language looks at `String.prototype` because strings inherit from it. `.prototype` lets your code grab that bag directly to read it, add to it, or rebuild it. JEJ teaches the prototype chain as the look-up the language performs for you; `.prototype` is the same chain as a thing you can hand-modify — a reflection-and-mutation pattern that opens up in a new language level with a new notional machine.",
	},
	call: {
		description:
			'Calls a function with a specified `this` value and arguments listed one-by-one. `f.call(thisArg, a, b)` is `f(a, b)` but with `this` set to `thisArg`.',
		example: 'Math.max.call(null, 1, 2, 3); // 3',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, when you need to call a method with a different `this` than its natural receiver. JEJ has no user-defined functions; built-in functions are called directly.',
		commonMistakes: [
			"Reaching for '.call' at this language level — JEJ does not redirect function calls.",
		],
		whyNotInJej:
			'A way to call a function while explicitly setting its `this` binding to a value of your choice. JEJ does not give you user-defined functions to call this way, and the built-in functions you do use (`Math.max`, `parseInt`, etc.) do not depend on a `this` for their work. The `this`-rebinding machinery exists at the language level — but it has no learner-side use until you can define your own functions and methods, which opens up in a new language level with a new notional machine.',
	},
	apply: {
		description:
			'Calls a function with a specified `this` value and arguments given as an array. `f.apply(thisArg, [a, b])` is `f(a, b)` but with `this` set to `thisArg`.',
		example: 'Math.max.apply(null, [1, 2, 3]); // 3',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, when you have arguments already in an array. The modern replacement is spread: `Math.max(...args)`.',
		commonMistakes: [
			"Reaching for '.apply' at this language level — JEJ has no arrays to pass and no user functions to rebind.",
		],
		whyNotInJej:
			'The same idea as `.call`, but with arguments handed in as an array. JEJ has no user-defined functions to rebind and no arrays to pass to begin with. The machinery exists at the language level but has no learner-side use until both functions and arrays come into reach — which opens up in a new language level with a new notional machine.',
	},
	bind: {
		description:
			'Returns a new function with `this` pre-bound to a value and (optionally) arguments pre-set. `f.bind(thisArg, a)` is a new function whose call site can omit `this` and `a`.',
		example: "const greetAlice = greet.bind(null, 'Alice');",
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, when handing a method to a callback that would otherwise lose its natural `this`. Mostly superseded by arrow functions, which inherit `this` from their surrounding scope.',
		commonMistakes: [
			"Reaching for '.bind' at this language level — JEJ does not bind functions to specific receivers.",
		],
		whyNotInJej:
			'A way to create a new function pre-configured with a specific `this` and (optionally) some arguments. JEJ has no user-defined functions to bind. The function-shaping machinery exists at the language level but has no learner-side use without user-defined functions, which open up in a new language level with a new notional machine.',
	},
	caller: {
		description:
			'A non-standard, deprecated property on functions that pointed at the function which invoked the current one. Throws in strict mode.',
		example: '// f.caller — deprecated; do not use',
		isJEJ: false,
		whenToUse:
			'Never in modern JavaScript — `.caller` is deprecated, throws in strict mode, and was never standardized. Modern call-stack inspection happens via stack traces on `Error` instances.',
		commonMistakes: [
			"Reaching for '.caller' at this language level — it is deprecated everywhere, not just JEJ.",
		],
		whyNotInJej:
			'A deprecated reference that pointed at the function which invoked the current one. JEJ has no user-defined functions, so there is no caller-side to reference, and the property is removed from JavaScript in strict-mode code anyway. Even in older JavaScript, reaching for `.caller` is discouraged; modern call-stack inspection happens through error-stack-trace reads. Both function-call machinery and call-stack reflection open up in a new language level with a new notional machine.',
	},
	arguments: {
		description:
			'An array-like object available inside every non-arrow function holding all arguments passed in.',
		example: 'function sum() { return arguments[0] + arguments[1]; }',
		isJEJ: false,
		whenToUse:
			'In modern JavaScript, the rest-parameter syntax `function sum(...nums)` replaces `arguments` in nearly every case.',
		commonMistakes: [
			"Reaching for 'arguments' at this language level — JEJ has no functions, so there is no function-body interior to look at.",
		],
		whyNotInJej:
			'An automatic array-like object every function-body had access to before rest-parameters existed, holding the arguments passed in. JEJ has no user-defined functions — there is no function-body interior to look at. The machinery exists at the language level for built-in functions but has no learner-side use without your own function bodies, which open up in a new language level with a new notional machine.',
	},
	__defineGetter__: {
		description:
			'An older method that adds a getter function to an object — code that runs when a property is read. Modern replacement: `Object.defineProperty(obj, name, { get })`.',
		example:
			"obj.__defineGetter__('full', function () { return this.first + this.last; });",
		isJEJ: false,
		whenToUse:
			'Almost never in modern JavaScript — `Object.defineProperty` is the standard and clearer way. Reach for getters when property access should run code, not just return stored data.',
		commonMistakes: [
			"Reaching for '.__defineGetter__' at this language level — JEJ does not use property-descriptor manipulation.",
		],
		whyNotInJej:
			'An older method that lets code make a property act like a function — reading `obj.full` runs a function instead of returning a stored value. JEJ properties always return what was stored; there is no machinery on the learner side for code-on-property-access. Property descriptors and getters/setters open up in a new language level with a new notional machine.',
	},
	__defineSetter__: {
		description:
			'An older method that adds a setter function to an object — code that runs when a property is written. Modern replacement: `Object.defineProperty(obj, name, { set })`.',
		example:
			"obj.__defineSetter__('name', function (v) { this._name = v.trim(); });",
		isJEJ: false,
		whenToUse:
			'Almost never in modern JavaScript — `Object.defineProperty` is the standard. Reach for setters when property assignment should run code, e.g. validation.',
		commonMistakes: [
			"Reaching for '.__defineSetter__' at this language level — JEJ does not use property-descriptor manipulation.",
		],
		whyNotInJej:
			'The setter sibling of `__defineGetter__` — assigning to a property runs a function instead of storing the value. JEJ properties always store what was assigned; there is no machinery on the learner side for code-on-property-assignment. Property descriptors and getters/setters open up in a new language level with a new notional machine.',
	},
	__lookupGetter__: {
		description:
			'An older method that returns the getter function (if any) attached to a property — the inverse of `.__defineGetter__`.',
		example:
			"obj.__lookupGetter__('full'); // returns the getter function or undefined",
		isJEJ: false,
		whenToUse:
			'Almost never — `Object.getOwnPropertyDescriptor(obj, name).get` is the modern equivalent. Used when introspecting whether a property is a getter or stored data.',
		commonMistakes: [
			"Reaching for '.__lookupGetter__' at this language level — JEJ does not introspect property descriptors.",
		],
		whyNotInJej:
			'An older method for inspecting whether a property is backed by a getter function. JEJ does not have getters in learner-side code, and does not let learner-side code peek at how a property was set up. Property-descriptor reflection opens up in a new language level with a new notional machine.',
	},
	__lookupSetter__: {
		description:
			'An older method that returns the setter function (if any) attached to a property — the inverse of `.__defineSetter__`.',
		example:
			"obj.__lookupSetter__('name'); // returns the setter function or undefined",
		isJEJ: false,
		whenToUse:
			'Almost never — `Object.getOwnPropertyDescriptor(obj, name).set` is the modern equivalent.',
		commonMistakes: [
			"Reaching for '.__lookupSetter__' at this language level — JEJ does not introspect property descriptors.",
		],
		whyNotInJej:
			"The setter sibling of `__lookupGetter__` — inspecting whether a property's assignment is backed by a setter function. JEJ does not have setters or property-descriptor reflection in learner-side code. The descriptor-introspection machinery opens up in a new language level with a new notional machine.",
	},
};

export default NOT_IN_JEJ_ENTRIES;
