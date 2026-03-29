# Just Enough JavaScript (JEJ)

JEJ is _just enough_ JavaScript to write imperative programs that interact with
users through text and numbers. These programs are the learning vehicle for
Welcome to Programming because they contain all three audiences of code in one
place:

- **Developers** read your code — through comments, variable names, and
  structure (console.log and console.assert help you communicate what's
  happening)
- **The computer** executes your code — you can trace exactly how the JS engine
  interprets each expression, with every piece of the program visually present
  on screen at once
- **Users** interact with your running program — through prompt, confirm, and
  alert

Within this structure, entire toolkits are open for exploring computational
concepts _through_ code: all String methods, all Math methods, RegExp, bitwise
operations and number helpers.

This is **_just enough JavaScript_** to:

- Read code as communication between three audiences
- Trace exactly how the JS engine interprets each line
- Explore creativity within the shape of imperative programs
- Explore style and readability tradeoffs to find your own voice
- Discuss a program's _behavior_, _strategy_ and _implementation_
- Explore different approaches to problem solving
- Explore concepts through code — text processing, geometry, pattern matching,
  randomness, number crunching — within interactive I/O programs
- Prepare for functions, data structures, and algorithms
- Build the foundations you need for whatever comes next in your studies

---

- [Key Concepts](#key-concepts)
  - [Few Options, Many Possibilities](#few-options-many-possibilities)
  - [Code & PseudoCode](#code--pseudocode)
  - [Statements vs Expressions](#statements-vs-expressions)
- [Code Style](#code-style)
  - [Program Type: Module](#program-type-module)
  - [Naming Convention: camelCase](#naming-convention-camelcase)
  - [Indentation: Tabs](#indentation-tabs)
  - [Semicolons](#semicolons)
  - [Before Your Code Runs](#before-your-code-runs)
- [Syntax You'll Write](#syntax-youll-write)
  - [Comments](#comments)
  - [Primitive Types](#primitive-types)
  - [Type Conversion](#type-conversion)
    - [Number()](#number)
    - [String()](#string)
    - [Boolean() & Truthiness](#boolean--truthiness)
    - [parseInt & parseFloat](#parseint--parsefloat)
  - [Number Helpers](#number-helpers)
  - [Math](#math)
  - [Operators](#operators)
    - [typeof](#typeof)
    - [Equality](#equality)
    - [String Concatenation](#string-concatenation)
    - [Arithmetic](#arithmetic)
    - [Comparison](#comparison)
    - [Negation](#negation)
    - [Short-Circuiting](#short-circuiting)
    - [Grouping with Parentheses](#grouping-with-parentheses)
    - [Bitwise](#bitwise)
  - [Logs & Assertions](#logs--assertions)
    - [Logging](#logging)
    - [Asserting](#asserting)
  - [String Access & Methods](#string-access--methods)
    - [Measuring](#measuring)
    - [Accessing Characters](#accessing-characters)
    - [Searching](#searching)
    - [Boundary Checks](#boundary-checks)
    - [Transforming](#transforming)
    - [Whitespace & Formatting](#whitespace--formatting)
  - [Optional Chaining](#optional-chaining)
  - [Template Literals](#template-literals)
  - [Variables](#variables)
    - [let](#let)
    - [const](#const)
  - [Assignment Operators](#assignment-operators)
    - [Assignment (`=`)](#assignment-)
    - [Compound Assignment](#compound-assignment)
  - [Interactions](#interactions)
    - [Input](#input)
    - [Output](#output)
  - [Block Scope](#block-scope)
  - [Conditionals](#conditionals)
  - [While Loops](#while-loops)
  - [Do-While Loops](#do-while-loops)
  - [For Loops](#for-loops)
  - [For-Of Loops](#for-of-loops)
  - [Break](#break)
  - [Continue](#continue)
- [Syntax You'll See (But Not Write)](#syntax-youll-see-but-not-write)
  - [debugger](#debugger)
  - [Braceless `if`](#braceless-if)
  - [Prefix Increment (`++`)](#prefix-increment-)
  - [`throw`](#throw)
  - [`new RangeError`](#new-rangeerror)

---

## Key Concepts

### Few Options, Many Possibilities

Your programs have a consistent shape: read input → perform computations →
produce output. Every program fits on a single printed page — the entire program
is visible at once.

**The structural tools** for writing these programs are: variables,
conditionals, loops (while, do-while, for, for-of), break, continue, and block
scope.

**The computational toolkits** that widen what computational concepts you can
explore are: all String methods, all Math methods and constants, regular
expressions, and number helpers. The only methods excluded are `.split()`,
`.match()`, and `.matchAll()` — these return arrays, a data type intentionally
excluded from JEJ.

You'll find more than one way to do the same thing within JEJ — like `str[0]` vs
`str.at(0)`, or `+` vs `.concat()`. This is intentional. Exploring these
alternatives builds judgment about trade-offs: readability, clarity, and edge
cases. Sections below note where alternatives exist.

**What kinds of alternative are included?** JEJ includes alternatives when the
two forms teach different mental models — when stepping through both programs
makes you _think_ differently about the problem. It excludes alternatives that
are purely syntactic convenience with no conceptual payoff.

- `[]` and `.at()` — both in. Indexing from the start vs. indexing from the end
  are genuinely different ways of thinking about position, and syntax (brackets)
  is a different mechanism than methods (.at()).
- `+` and `.concat()` — both in. Operator vs. method call on the same data.
- `++` is out — it's just shorthand for `+= 1`. No new mental model, just fewer
  characters and some new sneaky bugs you shouldn't spend your time on.

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

## Code Style

The learning environment checks your code through several steps before running
it. If something is wrong at any stage your program will be rejected and you'll
get feedback about what to fix:

1. **Parse Check**: Is it valid JavaScript syntax? Typos, missing brackets, and
   other syntax errors are caught here.
2. **Validation Check**: Does it stay within JEJ? Using features outside this
   page will produce _rejections_ that must be fixed before your code can run.
3. **Formatting Check**: Is it properly formatted? The learning environment
   requires your code to be formatted in a specific way. A format button is
   available to do this for you automatically. Your unformatted JEJ code is
   valid JavaScript and will run elsewhere. Formatting is a learning constraint,
   not a language constraint.
4. **Run it!**: Run the program and return data about the code's execution.

### Program Type: Module

Your programs run as modules, like using `<script type="module">` in HTML.
Module mode helps catch mistakes and is how modern JavaScript applications are
structured.

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
missing semicolons for you behind the scenes before it runs your code, but
relying on it can lead to a couple confusing bugs. Writing semicolons explicitly
makes your intent clear and avoids avoidable mistakes.

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

// use Number.isNaN() to check for NaN — see Number Helpers
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

```js
// "object" (RegExp) — only as literals, not new RegExp()
/hello/; // matches 'hello'
/^hi$/i; // matches 'Hi', 'HI', 'hi', etc.
/\d+/g; // matches one or more digits, globally
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

```txt
// "object" (RegExp)
/hello/
/^hi$/i
/\d+/g
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

> **RegExp** is a pattern-matching language embedded in JavaScript. The syntax
> is `/pattern/flags`. JEJ doesn't cover regex syntax — there are many resources
> for learning it separately. What matters here is that you can use regex
> literals with string methods like `.replace()` and `.search()`.

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

#### parseInt & parseFloat

`parseInt()` and `parseFloat()` parse numbers from the _start_ of a string,
stopping when they hit a character that doesn't fit. This is different from
`Number()`, which rejects the entire string if any part isn't a valid number.

<table>

<tr>
<td>

```js
// parseInt — parses an integer
parseInt('42px'); // 42
parseInt('3.14'); // 3 — stops at the decimal
parseInt('hello'); // NaN

// parseFloat — parses a decimal number
parseFloat('3.14px'); // 3.14
parseFloat('hello'); // NaN

// compare with Number() — strict conversion
Number('42px'); // NaN — rejects the whole string
Number('3.14'); // 3.14
```

</td>
<td>

```txt
parseInt('42px')
parseInt('3.14')
parseInt('hello')

parseFloat('3.14px')
parseFloat('hello')

Number('42px')
Number('3.14')
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Number Helpers

_expression_

Functions for validating numbers. These are especially useful after converting
user input with `Number()` or `parseInt()` — they tell you whether the result is
a usable value.

<table>

<tr>
<td>

```js
// is it NaN? (see Primitive Types for why NaN === NaN is false)
Number.isNaN(NaN); // true
Number.isNaN(42); // false
Number.isNaN('hello'); // false — it's a string, not NaN

// is it a whole number?
Number.isInteger(42); // true
Number.isInteger(3.14); // false
Number.isInteger(NaN); // false

// is it a finite number? (not Infinity, -Infinity, or NaN)
Number.isFinite(42); // true
Number.isFinite(Infinity); // false
Number.isFinite(NaN); // false
```

</td>
<td>

```txt
Number.isNaN(NaN)
Number.isNaN(42)
Number.isNaN('hello')

Number.isInteger(42)
Number.isInteger(3.14)
Number.isInteger(NaN)

Number.isFinite(42)
Number.isFinite(Infinity)
Number.isFinite(NaN)
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### Math

_expression_

The `Math` object provides mathematical operations and constants. All `Math`
methods and constants are available in JEJ.

> **Note about `Math.random()`:** This is the only feature in JEJ that produces
> a different result each time it runs. Your program will behave differently on
> every execution — predictive stepping won't be exact. That's the point:
> randomness is a new concept to explore.

#### Constants

```js
Math.PI; // 3.141592653589793
Math.E; // 2.718281828459045
Math.SQRT2; // 1.4142135623730951
Math.SQRT1_2; // 0.7071067811865476
Math.LN2; // 0.6931471805599453
Math.LN10; // 2.302585092994046
Math.LOG2E; // 1.4426950408889634
Math.LOG10E; // 0.4342944819032518
```

#### Rounding

```js
Math.round(3.7); // 4 — nearest integer
Math.round(3.2); // 3
Math.floor(3.7); // 3 — always rounds down
Math.ceil(3.2); // 4 — always rounds up
Math.trunc(3.7); // 3 — removes the decimal part
Math.trunc(-3.7); // -3
```

#### Arithmetic

```js
Math.abs(-7); // 7 — absolute value
Math.sign(-5); // -1 (also: 0 or 1)
Math.sqrt(16); // 4
Math.cbrt(27); // 3
Math.pow(2, 3); // 8 (same as 2 ** 3)
Math.hypot(3, 4); // 5 — √(3² + 4²)
```

#### Min / Max

```js
Math.min(5, 3, 8); // 3
Math.max(5, 3, 8); // 8
```

#### Logarithms & Exponentials

```js
Math.log(Math.E); // 1 — natural log (base e)
Math.log2(8); // 3
Math.log10(1000); // 3
Math.exp(1); // 2.718... (e¹)
Math.expm1(0); // 0 — exp(x) - 1, precise for small x
Math.log1p(0); // 0 — log(1 + x), precise for small x
```

#### Trigonometry (radians)

```js
Math.sin(0); // 0
Math.cos(0); // 1
Math.tan(0); // 0
Math.asin(1); // 1.5707... (π/2)
Math.acos(1); // 0
Math.atan(1); // 0.7853... (π/4)
Math.atan2(1, 1); // 0.7853... (y, x)
```

#### Hyperbolic

```js
Math.sinh(0); // 0
Math.cosh(0); // 1
Math.tanh(0); // 0
Math.asinh(0); // 0
Math.acosh(1); // 0
Math.atanh(0); // 0
```

#### Random

```js
Math.random(); // 0.0 to 0.999... — different each time!
```

#### Low-level

```js
Math.fround(1.337); // 1.3370000123977661 — 32-bit float
Math.imul(2, 3); // 6 — 32-bit integer multiply
Math.clz32(1); // 31 — count leading zeros
```

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
// notice!  this operator had double duty: concatenation and additions

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

#### Grouping with Parentheses

Parentheses `()` control the order of operations. Without them, JavaScript
follows its built-in operator precedence rules (e.g. `*` before `+`). With them,
you decide what gets evaluated first.

<table>

<tr>
<td>

<!-- markdownlint-disable MD010 -->

```js
// without parentheses — * happens first
2 + 3 * 4; // 14

// with parentheses — + happens first
(2 + 3) * 4; // 20

// clarifying complex conditions
let age = 25;
let hasTicket = true;
if ((age >= 18 && hasTicket) || age < 5) {
	// ...
}
```

<!-- markdownlint-enable MD010 -->

</td>
<td>

```txt
2 + 3 * 4

(2 + 3) * 4

age <- 25
hasTicket <- true
if ((age >= 18 AND hasTicket) OR age < 5)
```

</td>
</tr>
</table>

Even when parentheses aren't strictly needed, they can make your intent clearer
to other readers. Compare `a && b || c` with `(a && b) || c` — the second makes
the grouping explicit.

#### Bitwise

Bitwise operators treat numbers as 32-bit binary patterns. They're a different
way of thinking about numbers — not as quantities, but as rows of on/off
switches.

> Use `.toString(2)` to see the binary representation of a number:
> `(42).toString(2)` → `'101010'`. And `parseInt('101010', 2)` to go back.

<table>

<tr>
<td>

```js
// AND — both bits must be 1
5 & 3; // 1
// 101 & 011 = 001

// OR — either bit can be 1
5 | 3; // 7
// 101 | 011 = 111

// XOR — exactly one bit must be 1
5 ^ 3; // 6
// 101 ^ 011 = 110

// NOT — flips all bits
~5; // -6
// ~00000...101 = 11111...010

// left shift — moves bits left, fills with 0
5 << 1; // 10
// 101 << 1 = 1010

// right shift — preserves sign bit
-8 >> 2; // -2

// unsigned right shift — fills with 0
-8 >>> 2; // 1073741822
```

</td>
<td>

```txt
5 AND 3
5 OR 3
5 XOR 3
NOT 5
5 LEFT-SHIFT 1
-8 RIGHT-SHIFT 2
-8 UNSIGNED-RIGHT-SHIFT 2
```

</td>
</tr>
</table>

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
console.log('hello'); // print one thing

console.log('h', 'e', 'l', 'l', 'o'); // print many things
```

</td>
<td>

```txt
// no need for logs in PseudoCode, the program doesn't run!

// but if you really want to ...
log('hello')
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

All other `console` methods are also available in JEJ — see
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/console) for the full
list.

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

#### Boundary Checks

<table>

<tr>
<td>

```js
'hello world'.startsWith('hello'); // true
'hello world'.startsWith('world'); // false

'hello world'.endsWith('world'); // true
'hello world'.endsWith('hello'); // false
```

</td>
<td>

```txt
'hello world'.startsWith('hello')
'hello world'.startsWith('world')

'hello world'.endsWith('world')
'hello world'.endsWith('hello')
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

All `String.prototype` methods are available in JEJ, except `.split()`,
`.match()`, and `.matchAll()` (these return arrays, which are outside this
language level). If you find a string method on MDN that isn't shown above, you
can use it.

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
kind of like a box that can only hold one thing at a time. You can use a
anywhere in your code that you can write a primitive value. After all variables
just store values, so it makes sense you can use them anywhere you would use
their value!

Variables are also an important tool for writing code that is clear for other
developers to read and understand. Using helpful names can make your code read
(sort of) like a story. Declaring with `let` for values that may change and
`const` for values that should not be reassigned serves two purposes: it helps
developers understand your intention for each variable, _and_ it can help the
JavaScript engine optimize your code (_the first is more important!_).

> **A note about the "=" character:** The `=` in `let name = 'Java'` looks like
> assignment, but it's actually part of the _declaration_ syntax — it gives the
> variable its first value. Changing a variable's value later is a different
> operation covered in [Assignment Operators](#assignment-operators).

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
```

</td>
<td>

```txt
// declare
//  no need to declare variables

// declare and initialize
name <- 'Java'

// read
log(name)
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

### Assignment Operators

_expression (used as statements)_

Assignment operators are how you _change_ the value stored in a variable. There
is `=` for straightforward reassignment and compound operators like `+=` that
read, transform, and write back in one step. The compound forms are shorthand —
they don't change overall program behavior, but they can make your code more
readable. This is another chance to practice making style choices.

In JEJ, you can only assign to variable names — not to object properties.
`name = 'Alice'` works, but `obj.name = 'Alice'` does not.

> **A note about `=`:** The `=` character also appears in declarations like
> `let count = 0`, but that's _initialization_ — part of the declaration syntax,
> not an assignment expression. Assignment only applies to variables that
> already exist.

#### Assignment (`=`)

<table>

<tr>
<td>

```js
let count = 0; // ← initialization, not assignment
let name = 'Alice';

// assignment — changing an existing variable's value
count = 5;
console.log(count); // 5

name = 'Bob';
console.log(name); // "Bob"
```

</td>
<td>

```txt
count <- 0
name <- 'Alice'

count <- 5
name <- 'Bob'
```

</td>
</tr>
</table>

<table>

<tr>
<td>

```js
const language = 'JavaScript';

// reassigning a const causes an error
language = 'Python'; // TypeError!
```

</td>
<td>

```txt
// no need to specify const in PseudoCode
```

</td>
</tr>
</table>

#### Compound Assignment

Each compound assignment operator is shorthand for reading a variable, applying
an operation, and writing the result back. Here's a continuous example showing
each form alongside its longhand equivalent — notice how the same variable is
overwritten each time:

<table>

<tr>
<td>

<!-- markdownlint-disable MD010 -->

```js
let value = 10;

// longhand
value = value + 5; // 15

// shorthand — same result
value += 5; // 20

value = value - 3; // 17
value -= 3; // 14

value = value * 2; // 28
value *= 2; // 56

value = value / 4; // 14
value /= 4; // 3.5

value = value % 3; // 0.5
value %= 3; // 0.5

value = value ** 2; // 0.25
value **= 2; // 0.0625
```

<!-- markdownlint-enable MD010 -->

</td>
<td>

```txt
value <- 10

value <- value + 5
value += 5

value <- value - 3
value -= 3

value <- value * 2
value *= 2

value <- value / 4
value /= 4

value <- value % 3
value %= 3

value <- value ** 2
value **= 2
```

</td>
</tr>
</table>

The logical compound assignment operators short-circuit — the right side is only
evaluated if needed:

<table>

<tr>
<td>

<!-- markdownlint-disable MD010 -->

```js
let name = null;

// nullish — assigns only if null/undefined
name ??= 'anonymous'; // 'anonymous'
// same as: name = name ?? 'anonymous'

name = '';

// or — assigns only if falsy
name ||= 'fallback'; // 'fallback'
// same as: name = name || 'fallback'
name ||= 'Yogurt!'; // 'fallback'
// same as: name = name || 'Yogurt!'

name = 'Alice';

// and — assigns only if truthy
name &&= name.toUpperCase(); // 'ALICE'
// same as: name = name && name.toUpperCase()
```

<!-- markdownlint-enable MD010 -->

</td>
<td>

```txt
name <- null

name ??= 'anonymous'

name <- ''

name ||= 'fallback'
name ||= 'Yogurt!'

name <- 'Alice'

name &&= name.toUpperCase()
```

</td>
</tr>
</table>

> **`??=` vs `||=`**: Same difference as `??` vs `||` — see
> [Short-Circuiting](#short-circuiting). Use `??=` when empty strings and `0`
> are valid values that should not be overwritten.

The bitwise compound assignment operators work the same way — read, operate,
write back:

<table>

<tr>
<td>

<!-- markdownlint-disable MD010 -->

```js
let flags = 0b1010;

flags &= 0b1100; // 0b1000 — AND
flags |= 0b0011; // 0b1011 — OR
flags ^= 0b1111; // 0b0100 — XOR

let bits = 4;
bits <<= 2; // 16 — left shift
bits >>= 1; // 8 — right shift
bits >>>= 1; // 4 — unsigned right shift
```

<!-- markdownlint-enable MD010 -->

</td>
<td>

```txt
flags <- 0b1010

flags &= 0b1100
flags |= 0b0011
flags ^= 0b1111

bits <- 4
bits <<= 2
bits >>= 1
bits >>>= 1
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

### Do-While Loops

_statement_

Like `while`, but the body runs _first_, then the condition is checked. This
guarantees the body executes at least once.

1. Execute the block
2. Evaluate the expression
3. If it is `true`, return to step 1
4. Move on to the next line after the loop

<table>

<tr>
<td>

```js
do {
	// loop body — runs at least once
} while (anExpression);

// next line after the loop
```

</td>
<td>

```txt
DO:
  // loop body
:WHILE anExpression
```

</td>
</tr>
</table>

A `do...while` guarantees the body runs at least once. Here's the equivalent
using `while` — the body is written once before the loop to get that first
execution:

<table>

<tr>
<td>

```js
do {
	console.log('at least once');
} while (condition);
```

</td>
<td>

```js
console.log('at least once');
while (condition) {
	console.log('at least once');
}
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### For Loops

_statement_

A loop with initialization, condition, and update all in one header. The three
parts are separated by semicolons: `for (init; test; update)`.

1. Run the initialization (`let i = 0`)
2. Evaluate the test expression
3. If `true`, execute the body
4. Run the update (`i += 1`)
5. Return to step 2

<table>

<tr>
<td>

```js
for (let i = 0; i < 5; i += 1) {
	// loop body — runs 5 times
	// i is 0, 1, 2, 3, 4
}

// next line after the loop
```

</td>
<td>

```txt
FOR: i FROM 0 TO 4
  // loop body
:END FOR
```

</td>
</tr>
</table>

A `for` loop packages initialization, condition, and update into one header.
Here's the same loop written as a `while` — same behavior, different packaging:

<table>

<tr>
<td>

```js
for (
	//  begin - this line runs once at the beginning
	let step = 0;
	// condition - this line runs before each iteration, like a while loop
	step < 3;
	// step -  this line runs after each iteration
	step += 1
) {
	// body - runs after the condition and before the step
	console.log(step);
}
```

</td>
<td>

```js
//  begin - this line runs once at the beginning
let step = 0;
while (
	// condition - this line runs before each iteration, like a while loop
	step < 3
) {
	// body - runs after the condition and before the step
	console.log(step);
	// step - this line runs after each iteration
	step += 1; // step
}
```

</td>
</tr>
</table>

[TOP](#just-enough-javascript)

---

### For-Of Loops

_statement_

Iterate over a string, executing the loop body once for each character.

A new variable is declared for each character and that variable is scoped to the
block. Each time the block is executed the variable stores the next character in
the string. We use `const` because the character should not be reassigned within
the loop body.

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

When working with strings, `for-of` loops can be re-written as `for` loops:

<table>

<tr>
<td>

```js
const word = 'hello';

for (const character of word) {
	// loop body
}
```

</td>
<td>

```js
const word = 'hello';

for (let index = 0; index < word.length; index += 1) {
	const character = word[index];
	// loop body
}
```

</td>
</tr>
</table>

Which can also be rewritten as a `while` loop!

<table>

<tr>
<td>

```js
const word = 'hello';

for (let index = 0; index < word.length; index += 1) {
	const character = word[index];
	// loop body
}
```

</td>
<td>

```js
const word = 'hello';

let index = 0;
while (index < word.length) {
	const character = word[index];
	// loop body
	index += 1;
}
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

These features are added to your code _after_ you write it, for two purposes:
studying your code in the debugger (the `debugger` statement, added by the
[debug] button) and avoiding infinite loops (braceless `if`, prefix increment
`++`, `throw`, and `new RangeError` — added behind the scenes as part of a _loop
guard_). Here's what a loop guard looks like in the generated code:

```js
debugger;

// ... the beginning of a program

let loop1 = 0;
while (condition) {
	if (++loop1 > 100) throw new RangeError('loop 1 exceeded 100 iterations');

	// ... your loop body
}

// ... the rest of a program
```

You won't write any of this yourself — you just need to recognize these features
when you see them in the debugger or in an error message.

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

### Braceless `if`

_statement_

JavaScript allows `if (condition) statement;` without curly braces _only when_
your conditional has a single statement. In code you write for JEJ, braces are
always required — but you'll encounter this braceless form in generated code.

The following two conditionals have the same behavior. We use the inline
conditional in loop guards so it takes up less space in your program when you
debug it. You use blocks when you write conditionals for consistency and to
avoid distracting bugs.

<!-- prettier-ignore -->
```js
// braceless (you won't write this)
if (count > 100) throw new RangeError('too many iterations');

// your style (always use braces)
if (count > 100) {
  throw new RangeError('too many iterations');
}
```

### Prefix Increment (`++`)

_expression (operator)_

`++variable` adds 1 to the variable _and_ returns the new value, in a single
expression. In code you write, use `variable += 1` or explicit assignment
instead.

```js
// prefix increment (you won't write this)
++count;

// your style
count = count + 1;
count += 1;
```

[TOP](#just-enough-javascript)

---

### `throw`

_statement_

`throw` immediately stops execution and raises an error. Whatever value comes
after `throw` becomes the error. You'll see it paired with error constructors
like `new RangeError(...)`.

```js
// stops the program with an error
throw new RangeError('too many iterations');
// console -> RangeError: too many iterations

console.log('this line is not reached');
```

```js
// stops the program for a party
throw 'a party';
// console -> 'a party'

console.log('this line is not reached');
```

[TOP](#just-enough-javascript)

---

### `new RangeError`

_expression_

`new RangeError(message)` creates an error object for when a value is outside an
expected range. In the loop guard, it tells you which loop got stuck and how
many iterations it ran before being stopped.

```js
new RangeError('loop 1 exceeded 100 iterations');
```

[TOP](#just-enough-javascript)
