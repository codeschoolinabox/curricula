# Just Enough JavaScript

A quick reference to all the JavaScript syntax and features in this language
level. Studying a smaller and simpler set of language features allows you to
focus on programming _skills_ instead of memorizing endless lists of syntax.
This list is small, but it's **_just enough JavaScript_** to:

- Focus on deep _program comprehension_
- Understand exactly how the JS engine interprets your code
- Explore creativity within constraints
- Explore style and readability tradeoffs to find your own voice
- Discuss a program's _behavior_, _strategy_ and _implementation_
- Explore problem solving with code
- Prepare for functions and algorithms
- Build the foundations you need for whatever comes next in your studies

---

- [Key Concepts](#key-concepts)
  - [Few Options, Many Possibilities](#few-options-many-possibilities)
  - [Program Type: Module](#program-type-module)
  - [Naming Convention: camelCase](#naming-convention-camelcase)
  - [Indentation: Tabs](#indentation-tabs)
  - [Semicolons](#semicolons)
  - [Errors & Warnings](#errors--warnings)
  - [Code & PseudoCode](#code--pseudocode)
  - [Statements vs Expressions](#statements-vs-expressions)
- [Syntax You'll Write](#syntax-youll-write)
  - [Comments](#comments)
  - [Primitive Types](#primitive-types)
  - [Type Conversion](#type-conversion)
    - [Number()](#number)
    - [String()](#string)
    - [Boolean() & Truthiness](#boolean--truthiness)
  - [Operators](#operators)
    - [typeof](#typeof)
    - [Equality](#equality)
    - [String Concatenation](#string-concatenation)
    - [Arithmetic](#arithmetic)
    - [Comparison](#comparison)
    - [Negation](#negation)
    - [Short-Circuiting](#short-circuiting)
  - [Logs & Assertions](#logs--assertions)
    - [Logging](#logging)
    - [Asserting](#asserting)
  - [String Access & Methods](#string-access--methods)
    - [Measuring](#measuring)
    - [Accessing Characters](#accessing-characters)
    - [Searching](#searching)
    - [Transforming](#transforming)
    - [Whitespace & Formatting](#whitespace--formatting)
  - [Optional Chaining](#optional-chaining)
  - [Template Literals](#template-literals)
  - [Variables](#variables)
    - [let](#let)
    - [const](#const)
  - [Interactions](#interactions)
    - [Input](#input)
    - [Output](#output)
  - [Block Scope](#block-scope)
  - [Conditionals](#conditionals)
  - [While Loops](#while-loops)
  - [For-Of Loops](#for-of-loops)
  - [Break](#break)
  - [Continue](#continue)
- [Syntax You'll See (But Not Write)](#syntax-youll-see-but-not-write)
  - [debugger](#debugger)
  - [Loop Guards](#loop-guards)

---

## Key Concepts

### Few Options, Many Possibilities

You'll notice that JeJ sometimes offers more than one way to do the same thing.
For example, you can access a character in a string with `str[0]` or
`str.at(0)`. You can join strings with `+` or `.concat()`. This is intentional.

Exploring different approaches within a tightly constrained language level
builds judgment about trade-offs: readability, clarity, edge cases. When there
are only a few tools to choose from, the _choice_ itself becomes a learning
opportunity. Sections below note where alternatives exist and what the
trade-offs are.

**When is an alternative worth including?** JeJ includes alternatives when the
two forms teach different mental models — when stepping through both programs
makes you _think_ differently about the problem. It excludes alternatives that
are purely syntactic convenience with no new conceptual payoff.

- `[]` and `.at()` — both in. Indexing from the start vs. indexing from the end
  are genuinely different ways of thinking about position.
- `+` and `.concat()` — both in. Operator vs. method call on the same data.
- `while` but not `do...while` — `do...while` checks the condition _after_ the
  first iteration, which is a different execution model visible in predictive
  stepping. But in practice, beginners rarely encounter problems where "run at
  least once" is the natural framing. It may be added in the future.
- `++` is out — it's just shorthand for `+= 1` (which is also out because only
  `=` assignment is allowed). No new mental model, just fewer characters.

### Program Type: Module

Your programs run as modules using `<script type="module">` in HTML. Module mode
helps catch mistakes and is how modern JavaScript applications are structured.

<table>

<tr>
<td>

```html
<!-- in your HTML file -->
<script type="module" src="./your-program.js"></script>
```

</td>
<td>

_N/A in PseudoCode_

</td>
</tr>
</table>

<details>
<summary>Fun fact: `"strict mode"`</summary>
<br>

JavaScript also has an older "script" program type. In script mode, you can opt
in to stricter error checking by writing `"use strict"` at the top of your file.
Module mode has this built in — one less thing to think about.

<table>

<tr>
<td>

```js
'use strict';
// ... your code in script mode
```

</td>
<td>

_N/A in PseudoCode_

</td>
</tr>
</table>

</details>

### Naming Convention: camelCase

In JavaScript, the convention is to name variables using `camelCase` — start
with a lowercase letter, then capitalize the first letter of each new word:

```js
let userName = 'Alice';
let isLoggedIn = true;
let totalCount = 42;
```

This is a convention we follow, not something enforced by JavaScript itself. You
could name a variable `username` or `user_name` and it would work, but
`camelCase` is what JavaScript developers expect.

### Indentation: Tabs

Tabs vs spaces is a long-running debate in programming. We use **tabs** for
indentation because they're more accessible — a screen reader or Braille reader
can read out one tab character instead of out multiple individual spaces.

Each tab represents one level of indentation so you should add a tab each time
you enter a `{ }` block. Indentation isn't _required_ in JavaScript, but it
makes your code so much easier to read that we'll pretend it is required!

<!-- markdownlint-disable MD010 -->

```js
if (condition) {
	let name = prompt('enter your name');
	if (name !== null) {
		alert(`hello, ${name}!`);
	}
}
```

<!-- markdownlint-enable MD010 -->

### Semicolons

JavaScript uses semicolons (`;`) to mark the end of certain statements. The
rules are simple in Just Enough JavaScript:

**Use a semicolon after:**

- Expression statements: `alert('hello');`, `console.log(x);`
- Variable declarations: `let name = 'Alice';`, `const x = 5;`
- `break;`
- `continue;`

**No semicolon after closing `}`:**

- `if (...) { ... }` — no `;`
- `while (...) { ... }` — no `;`
- `for (const c of str) { ... }` — no `;`

JavaScript has a feature called _Automatic Semicolon Insertion_ (ASI) that adds
missing semicolons for you, but relying on it can lead to confusing bugs.
Writing semicolons explicitly makes your intent clear.

### Errors & Warnings

When you write code outside the Just Enough JavaScript language level, the
validator will flag it. There are two levels:

- **Errors** mean "this is not JeJ." Your code uses syntax or features that are
  outside the language level. These must be fixed before your program can run.
  - _Example:_ using `var` instead of `let`, calling `Math.random()`, writing a
    `function` declaration
- **Warnings** mean "this is valid JeJ, but something looks off." Your program
  can still run, but you should review the flagged code.
  - _Example:_ missing a semicolon, using `snake_case` instead of `camelCase`,
    declaring a variable you never use, writing `'use strict'` in a module, a
    file that doesn't end with exactly one newline

Think of errors as guardrails that keep you inside JeJ, and warnings as gentle
nudges toward clearer code.

### Code & PseudoCode

Throughout this reference, each section shows **JavaScript** on the left and
**PseudoCode** on the right:

<table>

<tr>
<td>

**JavaScript**

</td>
<td>

**PseudoCode**

</td>
</tr>

<tr>
<td>

The exact syntax and spelling you must use for the computer to understand your
code.

</td>
<td>

Simpler, more flexible notation you can use to sketch your ideas before writing
JavaScript code.

</td>
</tr>
</table>

PseudoCode is not a real programming language — it's an informal way to describe
what a program does without worrying about exact syntax. It helps you think
about _what_ your program should do before worrying about _how_ to write it.

### Statements vs Expressions

Every piece of JavaScript code (except comments) is either a **statement** or an
**expression**. Understanding the difference helps you predict where you can use
each piece of syntax.

- **Expression**: produces a value. Can be used anywhere a value is expected.
  - `1 + 2`, `'hello'`, `true ? 'yes' : 'no'`, `typeof 'hi'`
- **Statement**: performs an action. Cannot be used where a value is expected.
  - `if (...) {}`, `while (...) {}`, `let x = 5;`, `break;`

Each syntax section below is labeled as one or the other.

[TOP](#just-enough-javascript)

---

## Syntax You'll Write

### Comments

Notes written in your code for developers to read. The computer will ignore
these when executing your code.

<table>

<tr>
<td>

```js
// inline comment

/*
  block comment
*/
```

</td>
<td>

```txt
// inline comment

/*
  block comment
*/
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Primitive Types

_expression_

The smallest pieces of data in a JS program. There are many primitive types but
you only need to know these for now:

<table>

<tr>
<td>

<!-- prettier-ignore -->
```js
// "boolean"
true;
false;
```

```js
// "string"
''; // empty string
'hello';
'"hello"'; // quotes in a string (1)
"'hello'"; // quotes in a string (2)
```

```js
// "number"
-1;
0;
1;
1.5;
2;

// special number values
NaN; // "Not a Number" — but typeof is "number"!
Infinity; // larger than any other number
-Infinity; // smaller than any other number

// NaN is not equal to itself!
NaN === NaN; // false

// use Number.isNaN() to check for NaN
Number.isNaN(NaN); // true
Number.isNaN(42); // false
```

```js
// "undefined"
undefined;
```

```js
// "object"
null;
```

</td>
<td>

```txt
// "string"
'' // empty string
'hello'
'"hello"'

```

```txt
// "boolean"
true
false

```

```txt
// "number"
0
1
1.5
2

// special number values
NaN
Infinity
-Infinity

Number.isNaN(NaN)
Number.isNaN(42)

```

```txt
// "undefined"
undefined

```

```txt
// "object"
null
```

</td>
</tr>
</table>

<details>
<summary>Why Number.isNaN and not isNaN?</summary>
<br>

JavaScript also has a global `isNaN()` function, but it secretly converts the
value to a number before checking — which can give confusing results.
`Number.isNaN()` only returns true when the value is actually NaN, no surprises.

</details>

[TOP](#just-enough-javascript)

---

### Type Conversion

_expression_

JavaScript can convert values between types. This is especially important with
`prompt()`, which always returns a string — even when the user types a number.

#### Number()

<table>

<tr>
<td>

```js
Number('42'); // 42
Number('3.14'); // 3.14
Number(''); // 0
Number('hello'); // NaN
Number(true); // 1
Number(false); // 0
```

</td>
<td>

```txt
Number('42')
Number('3.14')
Number('')
Number('hello')
Number(true)
Number(false)
```

</td>
</tr>
</table>

> **Gotcha**: these might surprise you:
>
> ```js
> Number(''); // 0 — empty string becomes 0, not NaN!
> Number(' '); // 0 — whitespace-only string also becomes 0!
> Number(null); // 0 — null becomes 0, not NaN!
> Number(undefined); // NaN — but null was 0?
> ```

#### String()

<table>

<tr>
<td>

```js
String(42); // "42"
String(true); // "true"
String(false); // "false"
String(null); // "null"
String(undefined); // "undefined"
String(NaN); // "NaN"
```

</td>
<td>

```txt
String(42)
String(true)
```

</td>
</tr>
</table>

#### Boolean() & Truthiness

<table>

<tr>
<td>

```js
// falsy values — these all become false
Boolean(0); // false
Boolean(''); // false
Boolean(null); // false
Boolean(undefined); // false
Boolean(NaN); // false
```

```js
// truthy values — everything else is true
Boolean(1); // true
Boolean('hello'); // true
Boolean(' '); // true  (space is not empty!)
Boolean(-1); // true  (any non-zero number)
```

</td>
<td>

```txt
Boolean(0)
Boolean('')
Boolean(null)
Boolean(undefined)
Boolean(NaN)
```

```txt
Boolean(1)
Boolean('hello')
Boolean(' ')
Boolean(-1)
```

</td>
</tr>
</table>

When you write `if (someValue)`, JavaScript secretly converts `someValue` to a
boolean. Knowing which values are "falsy" helps you predict what your
conditionals will do.

> **Gotcha**: these might surprise you:
>
> ```js
> Boolean('0'); // true — it's a non-empty string!
> Boolean('false'); // true — still a non-empty string!
> Boolean(' '); // true — a space is not empty!
> Boolean(0); // false — the number 0
> Boolean(''); // false — the empty string
> ```

[TOP](#just-enough-javascript)

---

### Operators

_expression_

Ways to transform data. An operator takes in 1 or more values and _evaluates to_
a new value.

Operators in JavaScript are a huge topic with many details and exceptions, for
now this should be enough:

#### typeof

<table>

<tr>
<td>

```js
typeof 'a string'; // "string"

typeof true; // "boolean"

typeof 1; // "number"
typeof NaN; // "number"
typeof Infinity; // "number"

typeof null; // "object"

typeof undefined; // "undefined"
```

</td>
<td>

```txt
typeof 'a string'

typeof true

typeof 1
typeof NaN
typeof Infinity

typeof null

typeof undefined
```

</td>
</tr>
</table>

#### Equality

<table>

<tr>
<td>

```js
// strict equality
4 === '4'; // false

// strict inequality
4 !== '4'; // true
```

</td>
<td>

```txt
// strict equality
4 === '4'

// strict inequality
4 !== '4'
```

</td>
</tr>
</table>

#### String Concatenation

<table>

<tr>
<td>

```js
'hello' + ' ' + 'world'; // "hello world"
```

</td>
<td>

```txt
'hello' + ' ' + 'world'
```

</td>
</tr>
</table>

#### Arithmetic

<table>

<tr>
<td>

```js
// addition
4 + 2; // 6

// subtraction
4 - 2; // 2

// multiplication
4 * 2; // 8

// division
4 / 2; // 2

// remainder (modulo)
7 % 3; // 1

// exponentiation
2 ** 3; // 8
```

</td>
<td>

```txt
// addition
4 + 2

// subtraction
4 - 2

// multiplication
4 * 2

// division
4 / 2

// remainder (modulo)
7 % 3

// exponentiation
2 ** 3
```

</td>
</tr>
</table>

#### Comparison

<table>

<tr>
<td>

```js
// greater than
4 > 3; // true
4 > 4; // false

// less than
4 < 4; // false
4 < 5; // true

// greater than or equal to
4 >= 3; // true
4 >= 4; // true
4 >= 5; // false

// less than or equal to
4 <= 3; // false
4 <= 4; // true
4 <= 5; // true
```

</td>
<td>

```txt
// greater than
4 > 3
4 > 4

// less than
4 < 4
4 < 5

// greater than or equal to
4 >= 3
4 >= 4
4 >= 5

// less than or equal to
4 <= 3
4 <= 4
4 <= 5
```

</td>
</tr>
</table>

#### Negation

<table>

<tr>
<td>

```js
!true; // false
!false; // true
```

</td>
<td>

```txt
NOT true
NOT false
```

</td>
</tr>
</table>

#### Short-Circuiting

The `&&`, `||`, `??`, and `?:` operators don't always evaluate both sides — they
"short-circuit" by stopping as soon as the result is determined.

<table>

<tr>
<td>

```js
// and — returns first falsy, or the last value
true && 'hello'; // 'hello'
false && 'hello'; // false
```

```js
// or — returns first truthy, or the last value
'' || 'fallback'; // 'fallback'
'hello' || 'world'; // 'hello'
```

```js
// nullish coalescing — returns left if not null/undefined
let input = prompt('name');
let name = input ?? 'anonymous'; // 'anonymous' if user cancels
null ?? 'fallback'; // 'fallback'
undefined ?? 'fallback'; // 'fallback'
'' ?? 'fallback'; // '' — empty string is NOT null/undefined!
0 ?? 'fallback'; // 0 — zero is NOT null/undefined!
```

```js
// ternary — evaluates exactly one branch
true ? 'yes' : 'no'; // 'yes'
let age = 25;
age >= 18 ? 'adult' : 'minor'; // 'adult'
```

</td>
<td>

```txt
true AND 'hello'
false AND 'hello'
```

```txt
'' OR 'fallback'
'hello' OR 'world'
```

```txt
input <- prompt('name')
name <- input ?? 'anonymous'
null ?? 'fallback'
undefined ?? 'fallback'
'' ?? 'fallback'
0 ?? 'fallback'
```

```txt
true ? 'yes' : 'no'
age <- 25
age >= 18 ? 'adult' : 'minor'
```

</td>
</tr>
</table>

**`||` vs `??`**: Both provide fallbacks, but they differ on _what counts as
missing_. `||` treats any falsy value as missing (`''`, `0`, `false`, `null`,
`undefined`). `??` only treats `null` and `undefined` as missing — so `''` and
`0` pass through. Use `??` when empty strings or zero are valid values.

> **Gotcha**: `&&`, `||` and `??` return actual values, not always
> `true`/`false`:
>
> ```js
> 'hello' && 'world'; // 'world' — not true!
> '' || 0; // 0 — not false!
> ```

[TOP](#just-enough-javascript)

---

### Logs & Assertions

_expression (used for side effects)_

#### Logging

A simple way to print data to the developer console while the program is
running. This is helpful for knowing what data is stored in your program at
different points in execution.

<table>

<tr>
<td>

```js
console.log('hello');
```

</td>
<td>

```txt
// no need for logs in PseudoCode
```

</td>
</tr>
</table>

#### Asserting

A way to check your assumptions while the program runs. If the assertion is
true, nothing happens. If it's false, an error message is logged to the console.

<table>

<tr>
<td>

```js
// no output when the assertion is true
console.assert(1 === 1, 'this will not show');

// logs an error message when the assertion is false
console.assert(1 === 2, '1 is not equal to 2!');
```

</td>
<td>

```txt
ASSERT: 1 === 1, 'this will not show'
ASSERT: 1 === 2, '1 is not equal to 2!'
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### String Access & Methods

_expression_

The data type used for storing and manipulating text data. Strings will be the
main type of data used in Welcome to Programming.

#### Measuring

<table>

<tr>
<td>

```js
''.length; // 0
'a'.length; // 1
'ab'.length; // 2
```

</td>
<td>

```txt
''.length
'a'.length
'ab'.length
```

</td>
</tr>
</table>

#### Accessing Characters

Two ways to get a character by position:

<table>

<tr>
<td>

```js
// bracket notation
'abc'[0]; // 'a'
'abc'[1]; // 'b'
'abc'[2]; // 'c'

// .at() — also supports negative indexes
'abc'.at(0); // 'a'
'abc'.at(1); // 'b'
'abc'.at(-1); // 'c' — counts from the end
'abc'.at(-2); // 'b'
```

</td>
<td>

```txt
'abc'[0]
'abc'[1]
'abc'[2]

'abc'.at(0)
'abc'.at(1)
'abc'.at(-1)
'abc'.at(-2)
```

</td>
</tr>
</table>

#### Searching

<table>

<tr>
<td>

```js
// does the string contain a substring?
'abc'.includes('b'); // true
'abc'.includes('x'); // false

// where is a substring? (-1 = not found)
'abc'.indexOf('a'); // 0
'abc'.indexOf(''); // 0
'abc'.indexOf('b'); // 1
'abc'.indexOf('bc'); // 1
'abc'.indexOf('x'); // -1
```

</td>
<td>

```txt
'abc'.includes('b')
'abc'.includes('x')

'abc'.indexOf('a')
'abc'.indexOf('')
'abc'.indexOf('b')
'abc'.indexOf('bc')
'abc'.indexOf('x')
```

</td>
</tr>
</table>

#### Transforming

Methods that produce a new string by changing, replacing, extracting, joining,
or repeating content.

<table>

<tr>
<td>

```js
// --- case ---
'HeLlO'.toLowerCase(); // 'hello'
'HeLlO'.toUpperCase(); // 'HELLO'

// --- replacing ---
'+a+b+c+'.replaceAll('+', ''); // 'abc'

// --- extracting ---
'abc'.slice(0); // 'abc'
'abc'.slice(1); // 'bc'
'abc'.slice(2); // 'c'

'abc'.slice(0, 0); // ''
'abc'.slice(0, 1); // 'a'
'abc'.slice(0, 2); // 'ab'
'abc'.slice(1, 1); // ''
'abc'.slice(1, 2); // 'b'
'abc'.slice(2, 2); // ''

// --- joining — two ways ---
'hello'.concat(' ', 'world'); // 'hello world'
'hello' + ' ' + 'world'; // 'hello world'

// --- repeating ---
'ha'.repeat(3); // 'hahaha'
'-'.repeat(10); // '----------'
```

</td>
<td>

```txt
// case
'HeLlO'.toLowerCase()
'HeLlO'.toUpperCase()

// replacing
'+a+b+c+'.replaceAll('+', '')

// extracting
'abc'.slice(0)
'abc'.slice(1)
'abc'.slice(2)

'abc'.slice(0, 0)
'abc'.slice(0, 1)
'abc'.slice(0, 2)
'abc'.slice(1, 1)
'abc'.slice(1, 2)
'abc'.slice(2, 2)

// joining
'hello'.concat(' ', 'world')
'hello' + ' ' + 'world'

// repeating
'ha'.repeat(3)
'-'.repeat(10)
```

</td>
</tr>
</table>

#### Whitespace & Formatting

<table>

<tr>
<td>

```js
// trimming whitespace
'  abc    '.trim(); // 'abc'
'  abc    '.trimStart(); // 'abc    '
'  abc    '.trimEnd(); // '  abc'

// padding to a target length
'42'.padStart(5, '0'); // '00042'
'hi'.padEnd(10, '.'); // 'hi........'
```

</td>
<td>

```txt
'  abc    '.trim()
'  abc    '.trimStart()
'  abc    '.trimEnd()

'42'.padStart(5, '0')
'hi'.padEnd(10, '.')
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Optional Chaining

_expression_

The `?.` operator lets you safely access properties or call methods on a value
that might be `null` or `undefined`. Instead of throwing an error, it
short-circuits and returns `undefined`.

This is especially useful with `prompt()`, which returns `null` when the user
clicks "Cancel".

<table>

<tr>
<td>

```js
// without optional chaining — crashes if null
let input = prompt('name');
input.toLowerCase(); // TypeError if user cancelled!

// with optional chaining — safe
let input = prompt('name');
input?.toLowerCase(); // undefined if user input was null (they canceled)

// works with property access too
input?.length; // undefined if null, number if string

// works with method calls
input?.includes('a'); // undefined if null, boolean if string
```

</td>
<td>

```txt
input <- prompt('name')
input?.toLowerCase()

input?.length

input?.includes('a')
```

</td>
</tr>
</table>

> **`?.` vs `??`**: These pair well together. Use `?.` to safely access, then
> `??` to provide a fallback:
>
> ```js
> let input = prompt('name');
> let name = input?.trim() ?? 'anonymous';
> ```

[TOP](#just-enough-javascript)

---

### Template Literals

_expression_

Template literals use backticks (`` ` ``) instead of quotes, and let you embed
expressions directly in a string using `${...}`. They can also span multiple
lines.

<table>

<tr>
<td>

```js
let name = 'World';
`Hello, ${name}!`; // 'Hello, World!'
```

```js
// expressions inside templates
let x = 5;
`x + 1 = ${x + 1}`; // 'x + 1 = 6'
```

```js
// multi-line strings — whitespace is preserved exactly
let poem = `  roses are red
  violets are blue`;
// "  roses are red\n  violets are blue"
//  ^^ leading spaces are part of the string
```

</td>
<td>

```txt
name <- 'World'
'Hello, {name}!'
```

```txt
x <- 5
'x + 1 = {x + 1}'
```

```txt
poem <- '  roses are red
  violets are blue'
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Variables

_statement_

Variables allow you to save values to use again later in your program. They're
kind of like a box that can only hold one thing at a time. Use `let` for values
that may change and `const` for values that should not be reassigned.

Variables are also an important tool for writing code that is clear for other
developers to read and understand. Using helpful names can make your code read
(sort of) like a story.

#### let

<table>

<tr>
<td>

```js
// declare
let greeting;

// declare and initialize
let name = 'Java';

// read
console.log(name);

// assign a new value
name = 'Script';
```

</td>
<td>

```txt
// declare
//  no need to declare variables

// declare and initialize (same as assign)
name <- 'Java'

// read
log(name)

// assign a new value
name <- 'Script'
```

</td>
</tr>
</table>

#### const

<table>

<tr>
<td>

```js
// declare and initialize (cannot be reassigned)
const language = 'JavaScript';

// reassigning a const causes an error
language = 'Python'; // TypeError!

// cannot be declared without initialization
const language; // SyntaxError
```

</td>
<td>

```txt
// no need to specify const in PseudoCode
language <- 'JavaScript'
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Interactions

_expression_

Ways for users to pass data into your programs (_input_), and ways to display
data from inside your program to a user (_output_).

#### Input

<table>

<tr>
<td>

```js
// allows users to say "yes" or "no"
//  inputs a boolean value into your program
let didConfirm = confirm('yes or no');

// allows the user to enter text or click "cancel"
//  inputs a string or null into your program
let userInput = prompt('enter some text');
```

</td>
<td>

```txt
didConfirm <- confirm('yes or no')

userInput <- prompt('enter some text')
```

</td>
</tr>
</table>

#### Output

<table>

<tr>
<td>

```js
// displays a message but does not take user input
alert('a message');
```

</td>
<td>

```txt
alert('a message')
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Block Scope

Variables declared _inside_ curly braces can only be used inside those curly
braces. Trying to use a variable in an _outer scope_ will cause an error.

Variables declared _outside_ of curly braces can be used outside or inside the
curly braces. Both `let` and `const` follow the same scoping rules.

<table>

<tr>
<td>

```js
let outer = 'declared outside the block';
{
	outer = 'reassigned in the block';
	let inner = 'only defined in the block';
}
console.log(outer); // 'reassigned in ...'
console.log(inner); // ReferenceError
```

```js
// const is also block scoped
{
	const secret = 'only in this block';
}
console.log(secret); // ReferenceError
```

</td>
<td>

```txt
// don't worry about scope in PseudoCode
// you can fix scoping when you translate to JS
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Conditionals

_statement_

Execute different blocks of code depending on whether an expression evaluates to
`true` or to `false`. The expression in `if (...)` is converted to a boolean
using the same rules as `Boolean()` — see
[Boolean() & Truthiness](#boolean--truthiness).

<table>

<tr>
<td>

```js
if (anExpression) {
	// path 1: if anExpression is true
}
```

```js
if (anExpression) {
	// path 1: if anExpression is true
} else {
	// path 2: if anExpression is false
}
```

```js
if (firstExpression) {
	// path 1: if firstExpression is true
} else if (secondExpression) {
	// path 2: if secondExpression is true
} else {
	// path 3: if both expressions are false
}
```

</td>
<td>

```txt
IF: anExpression
  // path 1
:END IF
```

```txt
IF: anExpression
  // path 1
ELSE:
  // path 2
:END IF
```

```txt
IF: firstExpression
  // path 1
ELSE: IF: secondExpression
  // path 2
ELSE:
  // path 3
:END IF
```

</td>
</tr>
</table>

Always use braces `{ }` for Just Enough JavaScript.

[TOP](#just-enough-javascript)

---

### While Loops

_statement_

Repeat a block of code as long as an expression evaluates to `true`. The
expression in `while (...)` follows the same `Boolean()` rules — see
[Boolean() & Truthiness](#boolean--truthiness).

1. Evaluate the expression
2. Check if it is `true` or `false`
   1. if it is `true`, execute the block
   2. return to step 2
3. Move on to the next line after the loop

<table>

<tr>
<td>

```js
while (anExpression) {
	// loop body
}

// next line after the loop
```

</td>
<td>

```txt
WHILE: anExpression
  // loop body
:END WHILE
```

</td>
</tr>
</table>

Always use braces `{ }` for Just Enough JavaScript.

[TOP](#just-enough-javascript)

---

### For-Of Loops

_statement_

Iterate over a string, executing the loop body once for each character.

A new `const` variable is declared for each character and that variable is
scoped to the block. Each time the block is executed the variable stores the
next character in the string. We use `const` because the character should not be
reassigned within the loop body.

<table>

<tr>
<td>

```js
for (const character of 'hello') {
	// loop body
}

// next line after the loop
```

</td>
<td>

```txt
FOR: character OF 'hello'
  // loop body
:END FOR-OF
```

</td>
</tr>
</table>

Always use braces `{ }` for Just Enough JavaScript.

[TOP](#just-enough-javascript)

---

### Break

_statement_

Exit a loop immediately and skip to the next line after the loop.

<table>

<tr>
<td>

```js
while (anExpression) {
	// this line is executed once
	break; // exit the loop immediately
	// this line is not executed
}

// next line after the loop
```

</td>
<td>

```txt
WHILE: anExpression
  BREAK
:END WHILE
```

</td>
</tr>

<tr>
<td>

```js
for (const character of 'hello') {
	// this line is executed once
	break; // exit the loop immediately
	// this line is not executed
}

// next line after the loop
```

</td>
<td>

```txt
FOR: character OF 'hello'
  BREAK
:END FOR-OF
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Continue

_statement_

Skip the rest of the loop body and go to the next iteration.

<table>

<tr>
<td>

```js
while (anExpression) {
	// this line is repeated
	continue; // skip to the loop check
	// this line is not executed
}

// next line after the loop
```

</td>
<td>

```txt
WHILE: anExpression
  CONTINUE
:END WHILE
```

</td>
</tr>

<tr>
<td>

```js
for (const character of 'hello') {
	// this line is repeated
	continue; // skip to the next character
	// this line is not executed
}

// next line after the loop
```

</td>
<td>

```txt
FOR: character OF 'hello'
  CONTINUE
:END FOR-OF
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

## Syntax You'll See (But Not Write)

These are things you'll encounter in the debugger or console but won't write
yourself. They're added by tools or loop guards behind the scenes.

### debugger

_statement_

When you click the [debug] button, a `debugger` statement is added to your code.
This pauses your program and opens the browser's debugging tools. From there you
can set breakpoints, inspect variables, and step through your code line by line.

You won't write `debugger` yourself — use the [debug] button to start, then set
breakpoints in the browser's dev tools where you want to pause.

<table>

<tr>
<td>

```js
// this is what the [debug] button adds to your code:
debugger; // pauses here, opens dev tools

let name = 'World';
// set a breakpoint on any line in dev tools
// to pause there instead
console.log(name);
```

</td>
<td>

_N/A in PseudoCode_

</td>
</tr>
</table>

### Loop Guards

Loop guards protect your program from running forever. If a `while` loop runs
too many times, a loop guard will stop it with an error. You'll see this in the
console or debugger when a loop gets stuck — it means your loop condition never
became `false`.

This is what a loop guard looks like behind the scenes:

```js
let loop1 = 0;
while (condition) {
	if (++loop1 > 100) throw new RangeError('loop 1 exceeded 100 iterations');
	// ... your loop body
}
```

You won't write any of this — you just need to understand the error message when
you see it. Here's what each unfamiliar piece means:

#### Braceless `if`

_statement_

JavaScript allows `if (condition) statement;` without curly braces — the loop
guard uses this form. In code you write, braces are always required. This form
only appears in generated loop guards.

<!-- prettier-ignore -->
```js
// loop guard style (you won't write this)
if (++loop1 > 100) throw new RangeError('maximum iterations exceeded in loop 1');

// your style (always use braces)
if (condition) {
  // ...
}
```

#### Prefix Increment (`++`)

_expression (operator)_

`++variable` adds 1 to the variable and returns the new value. Loop guards use
`++loop1` to count how many times the loop has run.

In code you write, use `variable += 1` or explicit assignment instead.

```js
// loop guard style (you won't write this)
++loop1;

// your style
count = count + 1;
count += 1;
```

#### `throw new RangeError`

_statement_

`throw` stops execution with an error. `new RangeError(message)` creates an
error for values outside an expected range. In loop guards, it signals the loop
ran too many times.

```js
// you'll see this error in the console:
// RangeError: loop 1 exceeded 100 iterations
```

[TOP](#just-enough-javascript)
