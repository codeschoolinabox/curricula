/**
 * @file All error explanation patterns for JEJ learners, inline.
 *
 * @remarks Each entry matches one error pattern that JEJ learners
 * encounter. Entries are matched by `errorName` (exact) and `match`
 * (case-insensitive substring of error.message).
 *
 * Text fields are templates with `{{placeholder}}` tokens filled
 * at interpretation time by `interpolate-template.ts`.
 *
 * Available placeholders: `{{errorName}}`, `{{errorMessage}}`,
 * `{{line}}`, `{{column}}`, `{{name}}`, `{{actualType}}`,
 * `{{expression}}`, `{{suggestion}}`.
 *
 * **To add a new error pattern:** add a frozen object to the array.
 * **To edit an explanation:** find the entry by `id` and modify its
 * text fields. Keep each section to 2-4 sentences. Write for someone
 * who has been programming for days, not years.
 */

import type { ExplanationPattern } from './types.js';

import deepFreezeInPlace from '../../../../utils/deep-freeze-in-place.js';

// ─── Parse errors ───────────────────────────────────────────

const PARSE_ERRORS: ExplanationPattern[] = [
	{
		id: 'unexpected-token',
		errorName: 'SyntaxError',
		match: 'Unexpected token',
		phase: 'parse',
		whatWentWrong:
			"JavaScript found a character or symbol it didn't expect on line {{line}}.\n" +
			'The code near `{{expression}}` has something out of place — a missing\n' +
			'bracket, an extra symbol, or a typo in a keyword.',
		howToFix:
			'Look at line {{line}} and the line just before it. Common causes:\n' +
			'- A missing closing `}`, `)`, or `]` from an earlier line\n' +
			'- A typo in a keyword (e.g. `whille` instead of `while`)\n' +
			'- A missing operator between two values (e.g. `5 3` instead of `5 + 3`)\n' +
			'- An extra or misplaced comma, semicolon, or bracket',
		likelyMisunderstanding:
			'A common beginner belief is that the error is always *on* the line JavaScript\n' +
			'points to. In reality, the actual mistake is often on an earlier line — JavaScript\n' +
			'only notices the problem when it reaches a point where the syntax no longer makes\n' +
			'sense (McCracken et al., 2001). Think of it like a missing word in a sentence —\n' +
			'you might not notice until several words later.',
		howToAdjust:
			'When you see "Unexpected token," look *above* the reported line first. Check\n' +
			"that every opening `{`, `(`, or `'` has a matching closing partner. Reading\n" +
			'your code from the top and counting brackets can help find the mismatch.',
	},
	{
		id: 'unterminated-string',
		errorName: 'SyntaxError',
		match: 'Unterminated string constant',
		phase: 'parse',
		seeAlso: 'primitive-types',
		whatWentWrong:
			'You started a string with a quote (`\'` or `"`) but never closed it.\n' +
			'JavaScript reached the end of the line (or the file) still looking\n' +
			'for the matching closing quote.',
		howToFix:
			'Find the string that starts on or near line {{line}} and add the\n' +
			'matching closing quote. Make sure you use the same type of quote\n' +
			"to open and close: `'hello'` not `'hello\"`.",
		likelyMisunderstanding:
			'Strings in JavaScript must be wrapped in matching quotes — the opening\n' +
			'and closing quote must be the same character. A common mistake is\n' +
			'forgetting the closing quote, or accidentally using a different quote\n' +
			'character to close (e.g. opening with `\'` and closing with `"`). This\n' +
			'is part of the "missing delimiters are invisible" pattern common among\n' +
			'new programmers (McCracken et al., 2001).',
		howToAdjust:
			'Think of quotes as bookends — they always come in matching pairs.\n' +
			'When you type an opening quote, immediately type the closing one too,\n' +
			'then move your cursor back to type the string content between them.',
	},
	{
		id: 'unterminated-template',
		errorName: 'SyntaxError',
		match: 'Unterminated template',
		phase: 'parse',
		seeAlso: 'template-literals',
		whatWentWrong:
			'You started a template literal with a backtick (`` ` ``) but never\n' +
			'closed it. JavaScript reached the end of the file still inside the\n' +
			'template.',
		howToFix:
			'Find the template literal near line {{line}} and add a closing\n' +
			'backtick (`` ` ``). Be careful not to confuse backticks with\n' +
			'single quotes — they look similar but are different characters.\n' +
			'The backtick is usually on the key to the left of `1` on your keyboard.',
		likelyMisunderstanding:
			'Backticks (`` ` ``), single quotes (`\'`), and double quotes (`"`)\n' +
			'look similar but serve different purposes. Template literals use\n' +
			'backticks and allow `${...}` expressions inside them. If you close\n' +
			'a backtick-opened string with a regular quote, JavaScript sees them\n' +
			'as separate, unfinished strings.',
		howToAdjust:
			'When using template literals, make sure both the opening and closing\n' +
			"character are backticks. If you don't need `${...}` interpolation,\n" +
			'regular quotes (`\'` or `"`) are simpler and avoid this confusion.',
	},
	{
		id: 'unterminated-regexp',
		errorName: 'SyntaxError',
		match: 'Unterminated regular expression',
		phase: 'parse',
		whatWentWrong:
			'You started a regular expression with `/` but never closed it.\n' +
			'JavaScript expected a matching `/` to end the pattern.',
		howToFix:
			'Find the regular expression near line {{line}} and add a closing `/`.\n' +
			'A complete regex looks like `/pattern/flags` — for example,\n' +
			'`/hello/i` or `/\\d+/g`.',
		likelyMisunderstanding:
			'The `/` character has two jobs in JavaScript: division (`10 / 2`)\n' +
			'and regex delimiters (`/pattern/`). When JavaScript sees `/` and\n' +
			'expects a value (not an operator), it interprets it as the start\n' +
			'of a regex. A missing closing `/` leaves the regex open.',
		howToAdjust:
			'Regular expressions always come in `/` pairs, just like quotes\n' +
			'come in pairs. When you type the opening `/`, add the closing `/`\n' +
			'right away, then fill in the pattern between them.',
	},
	{
		id: 'missing-semicolon',
		errorName: 'SyntaxError',
		match: 'Missing semicolon',
		phase: 'parse',
		seeAlso: 'semicolons',
		whatWentWrong:
			"JavaScript expected a semicolon (`;`) near line {{line}} but didn't\n" +
			'find one. This usually means two statements are running together\n' +
			"on the same line, and JavaScript can't figure out where one ends\n" +
			'and the next begins.',
		howToFix:
			'Add a semicolon at the end of the statement on or just before\n' +
			'line {{line}}. In JEJ, semicolons go after:\n' +
			'- Variable declarations: `let x = 5;`\n' +
			'- Expression statements: `console.log(x);`\n' +
			'- `break;` and `continue;`',
		likelyMisunderstanding:
			'JavaScript has a feature called Automatic Semicolon Insertion (ASI)\n' +
			'that adds missing semicolons in most cases. But ASI has edge cases\n' +
			'where it guesses wrong, especially when a line starts with `(`, `[`,\n' +
			"or a template literal. Relying on ASI makes your code's behavior\n" +
			'depend on invisible rules.',
		howToAdjust:
			'Write semicolons explicitly after every statement that needs one.\n' +
			'This makes your intent clear and avoids the rare but confusing\n' +
			'cases where ASI does the wrong thing.',
	},
	{
		id: 'bad-escape-sequence',
		errorName: 'SyntaxError',
		match: 'Bad escape sequence',
		phase: 'parse',
		seeAlso: 'primitive-types',
		whatWentWrong:
			'Your string contains a backslash (`\\`) followed by a character that\n' +
			"JavaScript doesn't recognize as a valid escape sequence.",
		howToFix:
			'Check the string near line {{line}} for backslashes. Common valid\n' +
			'escapes are `\\n` (newline), `\\t` (tab), `\\\\` (literal backslash),\n' +
			'`\\\'` (single quote), and `\\"` (double quote). If you want a literal\n' +
			'backslash in your string, use `\\\\`.',
		likelyMisunderstanding:
			"The backslash `\\` is special in JavaScript strings — it doesn't\n" +
			'mean "backslash." It means "the next character is special." So `\\n`\n' +
			'means newline, not the two characters `\\` and `n`. Writing `\\q` or\n' +
			"`\\k` doesn't make sense to JavaScript because there's no `q` or `k`\n" +
			'escape.',
		howToAdjust:
			'Think of `\\` as an instruction to JavaScript, not a visible character.\n' +
			'If you want an actual backslash to appear in your string, write two\n' +
			"of them: `\\\\`. For example, a file path would be `'C:\\\\Users\\\\name'`.",
	},
	{
		id: 'identifier-after-number',
		errorName: 'SyntaxError',
		match: 'Identifier directly after number',
		phase: 'parse',
		whatWentWrong:
			'You wrote a number immediately followed by a word (like `42abc`)\n' +
			"near line {{line}}. JavaScript can't tell if this is a number, a\n" +
			'variable name, or something else entirely.',
		howToFix:
			'Separate the number and the identifier. If you meant multiplication,\n' +
			'add `*`: `42 * abc`. If you meant a variable name, names cannot\n' +
			'start with a digit — rename it to something like `value42` or `abc42`.',
		likelyMisunderstanding:
			'In everyday writing, "42nd" or "3rd" make sense. But JavaScript\n' +
			'variable names cannot start with a number. A sequence like `42abc`\n' +
			"is neither a valid number nor a valid name — it's ambiguous, and\n" +
			'JavaScript refuses to guess.',
		howToAdjust:
			'Numbers and names are separate things in JavaScript. Numbers start\n' +
			'with a digit (`42`, `3.14`). Names start with a letter, `_`, or `$`\n' +
			'(`count`, `_temp`, `$total`). They can contain digits after the\n' +
			'first character, but never before it.',
	},
	{
		id: 'unexpected-reserved-word',
		errorName: 'SyntaxError',
		match: 'Unexpected reserved word',
		phase: 'parse',
		whatWentWrong:
			'You used a word that JavaScript has reserved for its own use in a\n' +
			"place where it doesn't expect it. Near line {{line}}, a keyword\n" +
			'like `class`, `function`, `import`, `export`, `async`, `await`,\n' +
			'or similar appeared where JavaScript expected a value or variable name.',
		howToFix:
			'If you used one of these words as a variable name, rename it —\n' +
			"JavaScript reserves these words and you can't use them as names.\n" +
			'If you were trying to use a JavaScript feature (like `function` or\n' +
			'`class`), this feature is not part of JEJ. Stick to the tools\n' +
			'in the JEJ reference.',
		likelyMisunderstanding:
			'JavaScript has many reserved words that look like they could be\n' +
			'variable names (`class`, `import`, `super`, `yield`). Even if you\n' +
			"aren't using them as JavaScript features, you can't use them as\n" +
			'variable names because JavaScript has already claimed them for its\n' +
			'own syntax.',
		howToAdjust:
			'When naming variables, use descriptive camelCase names that describe\n' +
			'what the variable holds: `userName`, `totalCount`, `isLoggedIn`.\n' +
			"Avoid single words that might clash with JavaScript's reserved words.",
	},
];

// ─── Runtime errors ─────────────────────────────────────────

const RUNTIME_ERRORS: ExplanationPattern[] = [
	{
		id: 'reference-error-not-defined',
		errorName: 'ReferenceError',
		match: 'is not defined',
		phase: 'runtime',
		seeAlso: 'variables',
		whatWentWrong:
			'You used the variable `{{name}}` on line {{line}}, but JavaScript\n' +
			"doesn't know what `{{name}}` is — it hasn't been declared with\n" +
			'`let` or `const` anywhere that this line can see.',
		howToFix:
			'Check the **spelling** of `{{name}}`. Variable names are case-sensitive,\n' +
			'so `userName` and `username` are different variables. {{suggestion}}\n' +
			'If the spelling is correct, add a `let` or `const` declaration\n' +
			'before line {{line}}.',
		likelyMisunderstanding:
			'A common beginner belief is that variables exist as soon as you think\n' +
			'of a name for them — that writing `userName` is enough to create it.\n' +
			'In JavaScript, a variable only exists after a `let` or `const`\n' +
			'statement explicitly creates it. This is called the "variables exist\n' +
			'by naming" misconception (Sorva, 2012). Another frequent cause is a\n' +
			'simple spelling mistake — `userName` vs `username` — because our eyes\n' +
			"tend to read what we *expect* rather than what's actually written.",
		howToAdjust:
			"Before using any variable, make sure there's a `let` or `const`\n" +
			'line above it that creates it. Think of `let` as introducing someone\n' +
			"by name — you can't refer to them in a conversation before you've\n" +
			"introduced them. If you're getting this error and the variable *is*\n" +
			'declared, compare the spelling character by character.',
	},
	{
		id: 'reference-error-tdz',
		errorName: 'ReferenceError',
		match: 'before initialization',
		phase: 'runtime',
		seeAlso: 'variables',
		whatWentWrong:
			'You tried to use the variable `{{name}}` on line {{line}}, but its\n' +
			'`let` or `const` declaration comes *after* this line. JavaScript\n' +
			"knows `{{name}}` exists (it's declared somewhere in this scope), but\n" +
			"you can't use it until after the declaration line runs.",
		howToFix:
			'Move the line that uses `{{name}}` to *after* the `let` or `const`\n' +
			'line that declares it. Or move the declaration to earlier in your\n' +
			'program, before line {{line}}.',
		likelyMisunderstanding:
			'You might think that if a variable is declared anywhere in a block,\n' +
			'you can use it anywhere in that block. JavaScript actually creates a\n' +
			'"temporal dead zone" (TDZ) — the region between the start of the block\n' +
			"and the declaration line where the variable exists but can't be accessed.\n" +
			'This is a scope-related misconception: "variables exist everywhere once\n' +
			'declared" (Qian & Lehman, 2017).',
		howToAdjust:
			'Think of your program as running top to bottom. A variable only becomes\n' +
			'usable *after* JavaScript executes the line that declares it. Code\n' +
			"above that line cannot see it yet, even though it's in the same block.\n" +
			'Order matters: declare first, then use.',
	},
	{
		id: 'type-error-null-property',
		errorName: 'TypeError',
		match: 'Cannot read properties of null',
		phase: 'runtime',
		seeAlso: 'interactions',
		whatWentWrong:
			'On line {{line}}, you tried to access `.{{name}}` on a value that is\n' +
			'`null`. This commonly happens when `prompt()` returns `null` because\n' +
			'the user clicked **Cancel** instead of typing something.',
		howToFix:
			"Before using the result of `prompt()`, check if it's `null`:\n" +
			'```js\n' +
			"let input = prompt('enter text');\n" +
			'if (input !== null) {\n' +
			'  // safe to use input here\n' +
			'  input.toLowerCase();\n' +
			'}\n' +
			'```\n' +
			'Or use optional chaining: `input?.toLowerCase()` — this returns\n' +
			'`undefined` instead of crashing when `input` is `null`.',
		likelyMisunderstanding:
			'A common assumption is that `prompt()` always returns a string — after\n' +
			"all, it's asking the user to type something. But `prompt()` returns\n" +
			'`null` when the user clicks Cancel or presses Escape. Calling any\n' +
			'method on `null` crashes your program. This reflects the "all operations\n' +
			'work on all values" misconception (Kaczmarczyk et al., 2010) — the\n' +
			'belief that methods like `.toLowerCase()` will work on any value.',
		howToAdjust:
			'`prompt()` returns *either* a string *or* `null`. Your code must handle\n' +
			'both possibilities. Think of it as a conversation: you asked a question,\n' +
			'but the person might choose not to answer. You need a plan for both\n' +
			'"they answered" and "they walked away."',
	},
	{
		id: 'type-error-undefined-property',
		errorName: 'TypeError',
		match: 'Cannot read properties of undefined',
		phase: 'runtime',
		whatWentWrong:
			'On line {{line}}, you tried to access `.{{name}}` on a value that is\n' +
			"`undefined`. The variable or expression you used doesn't have a value\n" +
			'yet, or it was never assigned one.',
		howToFix:
			'Check what value the expression on line {{line}} actually holds. Common\n' +
			'causes:\n' +
			"- A variable declared with `let` but never assigned a value (it's\n" +
			'  `undefined` by default)\n' +
			'- A string method that returned `undefined` (e.g. accessing a character\n' +
			"  index that doesn't exist: `'hi'[5]` is `undefined`)\n" +
			"Add a check before using the value, or make sure it's assigned first.",
		likelyMisunderstanding:
			'`undefined` means "this exists but has no value yet" — like an empty box\n' +
			'with a label. It\'s different from `null` (which means "intentionally\n' +
			'empty") and from "not defined" (which means the variable doesn\'t exist at\n' +
			"all). Trying to access a property on `undefined` crashes because there's\n" +
			'nothing there to look up a property on.',
		howToAdjust:
			"When you declare a variable with `let x;` and don't give it a value,\n" +
			"`x` is `undefined` — not `0`, not `''`, not `null`. If your code\n" +
			'later tries `x.something`, it will crash. Always give variables an\n' +
			'initial value, or check for `undefined` before using methods on them.',
	},
	{
		id: 'type-error-not-a-function',
		errorName: 'TypeError',
		match: 'is not a function',
		phase: 'runtime',
		whatWentWrong:
			'On line {{line}}, you tried to call `{{name}}` as if it were a function\n' +
			"using `()`, but it's not a function — it's a {{actualType}} value.",
		howToFix:
			'Check what `{{name}}` actually refers to. Common causes:\n' +
			"- A typo in a method name (e.g. `'hello'.toLowercase()` instead of\n" +
			"  `'hello'.toLowerCase()` — capitalization matters)\n" +
			'- Calling a variable that holds a string or number, not a function\n' +
			"- Using `()` on something that doesn't need it (e.g. `'hello'.length()`\n" +
			"  — `.length` is a property, not a method, so use `'hello'.length`)",
		likelyMisunderstanding:
			'The `()` at the end of a name tells JavaScript to *call* it as a\n' +
			"function. If the value isn't callable, JavaScript throws this error.\n" +
			'A common confusion is between **properties** (accessed with `.name`)\n' +
			'and **methods** (called with `.name()`). For example, `.length` is\n' +
			'a property (no parentheses), while `.toLowerCase()` is a method\n' +
			'(needs parentheses).',
		howToAdjust:
			'When you see "is not a function," ask: "Did I mean to call this with\n' +
			'`()`?" Check the spelling (JavaScript methods are case-sensitive),\n' +
			"and check whether it's a property or a method. The JEJ reference\n" +
			"shows which string operations use `()` and which don't.",
	},
	{
		id: 'type-error-const-assignment',
		errorName: 'TypeError',
		match: 'Assignment to constant variable',
		phase: 'runtime',
		seeAlso: 'variables',
		whatWentWrong:
			'On line {{line}}, you tried to change the value of a variable that was\n' +
			'declared with `const`. Variables declared with `const` cannot be\n' +
			'reassigned after their initial value is set.',
		howToFix:
			"If you need to change this variable's value later, declare it with\n" +
			'`let` instead of `const`:\n' +
			'```js\n' +
			'let count = 0;  // can be changed later\n' +
			'count = count + 1;  // this works\n' +
			'```\n' +
			"If you don't intend to change it, the assignment on line {{line}} may\n" +
			'be a mistake — remove it or use a different variable name.',
		likelyMisunderstanding:
			'`const` means "this binding cannot be reassigned" — once you write\n' +
			'`const x = 5`, the name `x` is permanently linked to `5` in that\n' +
			'scope. A common misconception is confusing `const` with the idea\n' +
			'that "the value itself is immutable." In JEJ, where values are\n' +
			"primitives, this distinction doesn't matter much — but the key\n" +
			'concept is that `const` protects the *name*, preventing accidental\n' +
			'reassignment (Qian & Lehman, 2017).',
		howToAdjust:
			'Choose between `let` and `const` based on whether the variable will\n' +
			'ever need a new value. Use `const` for things that stay the same\n' +
			"(like a user's name once you have it) and `let` for things that\n" +
			'change (like a counter or a running total). When in doubt, start\n' +
			'with `const` — if you later need to reassign, the error message\n' +
			'will remind you to switch to `let`.',
	},
	{
		id: 'range-error-invalid-count',
		errorName: 'RangeError',
		match: 'Invalid count value',
		phase: 'runtime',
		seeAlso: 'string-access--methods',
		whatWentWrong:
			"On line {{line}}, you called `.repeat()` with a value that isn't a\n" +
			'valid repeat count. The argument must be a non-negative integer\n' +
			'(0, 1, 2, ...) — not negative, not `Infinity`, and not `NaN`.',
		howToFix:
			"Check the value you're passing to `.repeat()`. If it comes from\n" +
			"user input or a calculation, make sure it's a whole number >= 0:\n" +
			'```js\n' +
			"let count = Number(prompt('how many times?'));\n" +
			'if (Number.isInteger(count) && count >= 0) {\n' +
			"  '-'.repeat(count);\n" +
			'}\n' +
			'```',
		likelyMisunderstanding:
			'It might seem like `.repeat(-1)` should just return an empty string\n' +
			'or that `.repeat(3.5)` should repeat 3 times. But JavaScript is\n' +
			'strict about this: the count must be a non-negative integer.\n' +
			'Fractional or negative values are explicitly rejected rather than\n' +
			'silently rounded or ignored.',
		howToAdjust:
			'When using `.repeat()`, the number must make physical sense — you\n' +
			"can't repeat something a negative number of times or half a time.\n" +
			'If your count comes from user input or math, validate it first:\n' +
			"use `Math.floor()` for decimals and check that it's >= 0.",
	},
	{
		id: 'range-error-iteration-limit',
		errorName: 'RangeError',
		match: 'exceeded',
		phase: 'runtime',
		whatWentWrong:
			'A loop in your program ran too many times and was stopped by a\n' +
			"safety guard. This usually means the loop's condition never becomes\n" +
			'`false`, creating an **infinite loop**.',
		howToFix:
			'Check your loop near line {{line}}:\n' +
			'- **`while` loop**: Is the condition ever becoming `false`? Is there\n' +
			'  code inside the loop that changes the variables in the condition?\n' +
			'- **`for` loop**: Does the update step (`i += 1`) actually move\n' +
			'  toward the end condition?\n' +
			'- **Common mistake**: Updating the wrong variable, or using `=`\n' +
			'  (assignment) instead of `===` (comparison) in the condition.',
		likelyMisunderstanding:
			'A common beginner assumption is that loops "know" when to stop.\n' +
			'In reality, a loop only stops when its condition evaluates to `false`.\n' +
			'If nothing inside the loop changes the variables used in the condition,\n' +
			'the condition stays `true` forever. Computers follow instructions\n' +
			"literally — they don't notice that a loop is going nowhere\n" +
			'(Sirkia & Sorva, 2012).',
		howToAdjust:
			'Before writing a loop, answer three questions: (1) What makes the\n' +
			'condition `true` to start? (2) What inside the loop changes the\n' +
			'variables in the condition? (3) Will those changes eventually make\n' +
			"the condition `false`? If you can't answer all three, your loop\n" +
			'may run forever. Trace through 2-3 iterations by hand to check.',
	},
	{
		id: 'range-error-call-stack',
		errorName: 'RangeError',
		match: 'Maximum call stack',
		phase: 'runtime',
		whatWentWrong:
			'Your program ran out of memory because too many operations were\n' +
			"stacked on top of each other. In JEJ (which doesn't use functions),\n" +
			'this is unusual and may indicate a deeply nested expression or a\n' +
			'problem with a regular expression.',
		howToFix:
			'Check your code for very complex expressions or regular expressions\n' +
			"that might cause excessive internal processing. If you're using\n" +
			'regex, simplify the pattern — some patterns cause "catastrophic\n' +
			'backtracking" where the regex engine tries exponentially many paths.',
		likelyMisunderstanding:
			'JavaScript uses a "call stack" to keep track of what it\'s doing.\n' +
			'Each nested operation adds a layer. When there are too many layers,\n' +
			'the stack overflows. In programs with functions, this usually means\n' +
			"a function calls itself forever. In JEJ, it's more likely caused\n" +
			'by a regex that takes exponentially long on certain inputs.',
		howToAdjust:
			"If you're using regular expressions and getting this error, try\n" +
			'simpler patterns. If the error seems unrelated to regex, check for\n' +
			'very deeply nested expressions. This error is rare in JEJ — if\n' +
			"you're seeing it, the cause is likely something unusual.",
	},
	{
		id: 'uri-error-malformed',
		errorName: 'URIError',
		match: 'URI malformed',
		phase: 'runtime',
		whatWentWrong:
			'On line {{line}}, you used `decodeURI()` or `decodeURIComponent()`\n' +
			'with a string that contains an invalid percent-encoded sequence.\n' +
			"For example, `%` followed by characters that aren't valid hex digits.",
		howToFix:
			"Check the string you're passing to the decode function. A valid\n" +
			'percent-encoded sequence looks like `%20` (space), `%2F` (slash),\n' +
			'etc. — always `%` followed by exactly two hexadecimal digits (0-9,\n' +
			'A-F). If your string has a bare `%` or `%` followed by non-hex\n' +
			"characters, that's the problem.",
		likelyMisunderstanding:
			'The `%` character has special meaning in URIs — it starts an\n' +
			"encoded character sequence. A bare `%` in a string isn't just\n" +
			'a percent sign to the decoder; it signals the start of a code\n' +
			'that the decoder then fails to read.',
		howToAdjust:
			"If you're working with URIs or URLs, use `encodeURIComponent()`\n" +
			'to encode strings before including them in a URL, and\n' +
			"`decodeURIComponent()` to decode them back. Don't try to manually\n" +
			'add or remove `%` sequences.',
	},
	{
		id: 'internal-error-recursion',
		errorName: 'InternalError',
		match: 'too much recursion',
		phase: 'runtime',
		whatWentWrong:
			'Your program ran out of memory because too many operations were\n' +
			'stacked on top of each other. This is the Firefox equivalent of\n' +
			'"Maximum call stack size exceeded" — the same problem, different\n' +
			'wording.',
		howToFix:
			'Check your code for deeply nested expressions or regular expressions\n' +
			"that might cause excessive internal processing. If you're using\n" +
			'regex, simplify the pattern — some patterns cause "catastrophic\n' +
			'backtracking" where the regex engine tries exponentially many paths.',
		likelyMisunderstanding:
			'Different browsers describe this error differently. Chrome/Node.js\n' +
			'says "Maximum call stack size exceeded" while Firefox says "too much\n' +
			'recursion." Both mean the same thing: your program is doing so many\n' +
			'nested operations that it ran out of space to keep track of them all.',
		howToAdjust:
			"If you're using regular expressions and getting this error, try\n" +
			"simpler patterns. In JEJ (which doesn't use functions), this error\n" +
			'is rare. If you see it, look for complex regex patterns or very\n' +
			'deeply nested expressions.',
	},
	{
		id: 'syntax-error-runtime-regex',
		errorName: 'SyntaxError',
		match: 'Invalid regular expression',
		phase: 'runtime',
		whatWentWrong:
			'On line {{line}}, you wrote a regular expression with invalid syntax.\n' +
			"The pattern between the `/` delimiters contains something JavaScript's\n" +
			"regex engine can't understand.",
		howToFix:
			'Check the regex near line {{line}}. Common mistakes:\n' +
			'- Unmatched `(` or `)` — parentheses must be paired\n' +
			'- Unmatched `[` — character classes must be closed with `]`\n' +
			'- Using `\\` at the end of the pattern (nothing to escape)\n' +
			'- Invalid quantifier (e.g. `{abc}` — quantifiers need numbers like `{2,5}`)',
		likelyMisunderstanding:
			'Regular expressions are a language-within-a-language with their own\n' +
			'syntax rules. Characters that are normal in JavaScript strings (like\n' +
			'`(`, `[`, `{`, `\\`) have special meanings inside a regex. If you\n' +
			'want to match these characters literally, you need to escape them\n' +
			'with `\\` — e.g., `\\(` to match an actual parenthesis.',
		howToAdjust:
			'Regex syntax is separate from JavaScript syntax. When writing regex,\n' +
			'think of the characters between `/` delimiters as instructions to\n' +
			'the pattern matcher, not as literal text. If your pattern needs to\n' +
			'match special characters literally, prefix them with `\\`.',
	},
];

// ─── Combined + frozen ──────────────────────────────────────

const EXPLANATIONS: readonly ExplanationPattern[] = deepFreezeInPlace([
	...PARSE_ERRORS,
	...RUNTIME_ERRORS,
]);

export default EXPLANATIONS;
