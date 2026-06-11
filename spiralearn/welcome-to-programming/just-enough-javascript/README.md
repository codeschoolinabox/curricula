# Just Enough JavaScript (JEJ)

JEJ is _just enough_ JavaScript to write imperative programs that interact with
users through text and numbers. These programs are the learning vehicle for
Welcome to Programming because with this subset of JavaScript you can explore
computation and write programs that reach the three audiences of code at once in
bite-sized, single-page programs:

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
  - [Before Your Code Runs](#program-type-module)
- [Language Reference](./reference.md)

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

<strong>JavaScript</strong>

</td>
<td>

<strong>PseudoCode</strong>

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

[TOP](#just-enough-javascript-jej)

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

<em>N/A in PseudoCode</em>

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

<em>N/A in PseudoCode</em>

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

<strong>No semicolon after closing `}`:</strong>

- `if (...) { ... }` — no `;`
- `while (...) { ... }` — no `;`
- `for (const c of str) { ... }` — no `;`

<strong>Use a semicolon at the end of each line after everything else:</strong>

- Expression statements: `alert('hello');`, `console.log(x);`
- Variable declarations: `let name = 'Alice';`, `const x = 5;`
- `break;`
- `continue;`

JavaScript has a feature called _Automatic Semicolon Insertion_ (ASI) that adds
missing semicolons for you behind the scenes before it runs your code, but
relying on it can lead to a couple confusing bugs. Writing semicolons explicitly
makes your intent clear and avoids avoidable mistakes.

[TOP](#just-enough-javascript-jej)
