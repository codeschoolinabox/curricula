---
sidebar_position: 1
---

# Welcome to Programming: Syllabus

> The best authors and the best JavaScript developers are those who obsess about
> language, who explore and experiment with language every day and in doing so
> develop their own style, their own idioms, and their own expression.
>
> — [Angus Croll](https://anguscroll.com/),
> [If Hemingway Wrote JavaScript](https://anguscroll.com/hemingway/)

**Programming is collaborative communication.** A single piece of source code
simultaneously addresses multiple audiences: other developers who read it, a
computer that executes it, users who experience it, and agents who collaborate
on it. This course guides you from your first comment to fluent collaboration
with AI agents, using the smallest possible set of language features. It is
self-study: no time estimates, no deadlines. Go at your own pace.

**Three threads run beneath every chapter, every exercise, every lens**: and
together they build toward strong, intentional, impactful communication through
code:

- **Twinning**: building an accurate mental model of a process outside your own
  mind. Each chapter asks you to twin a different process: the _developer_ who
  reads your code (Ch1), the _computer_ that executes it (Ch2), the _user_ who
  experiences it (Ch3), the _agent_ you collaborate with (Ch4). You can't
  communicate well with something you don't understand.

- **Micro-decisions**: every keyword, name, operator, and structure in your code
  is a choice. These choices operate at multiple levels: _text voice_ (what does
  this name communicate?), _logical voice_ (how do you structure your
  programs?), and _computational voice_ (string operations, pattern matching, or
  bit manipulation: different models of computation, each with its own
  expressive range), _experience voice_ (the user's interactions), etc. Noticing
  these choices and understanding their effects is what separates a good
  programmer from a great one.

- **Perspective stacking**: any piece of code can be read at multiple levels
  simultaneously: individual syntax, what a line _does_, how parts _connect_,
  what the program is _for_, what the _user experiences_. Every chapter deepens
  your ability to hold more of these perspectives active at once. Study Lenses,
  trace, and socratizing automate different perspectives; PBSI names them
  explicitly.

**The spiral.** Skills introduced in earlier chapters are practiced and deepened
throughout. Each objective below marks where a skill is _first introduced_, not
where it ends. The "builds on" progressions are rough through-lines: the
strongest path from prior skills to the new one, not an exhaustive dependency
list.

**Study Lenses** is embedded directly in every page. Every code snippet has a
full suite of lenses available: trace tables, variable highlighters, Parsons
problems, flow charts, fill-in-the-blanks, and more. Exercises suggest lenses,
but you're always free to use whichever helps you most.

**JavaScript only** for now; Python track in development. Skill-level objectives
are identical for both languages. JS is the primary track because it makes the
developer/user split _architecturally visible_: `console.log` lives in devtools
(developer space), `prompt`/`alert`/`confirm` live in browser UI (user space).
That separation is the curriculum's rhetorical model made concrete.

---

## References

These two resources are always available alongside the curriculum. Neither is a
prerequisite: refer to them when you need them.

### Just Enough JavaScript

A curated subset of JavaScript: just enough to write imperative programs that
interact with users through text and numbers. Within this small surface, entire
domains open up: text processing, geometry, pattern matching, randomness, number
crunching: all within single-page programs where every line is visible at once.
The constraint is pedagogical: fewer features means more cognitive bandwidth for
the concepts that matter. See it as a companion reference, not a prerequisite.

### Studying with LLMs

Guidance and starter prompts for using LLM assistants as _study partners_: not
code generators: while working through earlier chapters. This is distinct from
Chapter 4, which is about agents as named collaborators in the development
process. The distinction matters: using an LLM to quiz yourself on trace tables
is study support; asking an LLM to trace code for you is bypassing the skill
you're trying to build. Available from Chapter 1 onward; revisited with new
depth in Chapter 4.

---

## Before You Begin

- [ ] Read the course expectations: understand the comprehension-first approach
      before starting
- [ ] Skim the exercise types guide: you don't need to understand everything
      yet, just orient yourself
- [ ] Skim the Just Enough JavaScript reference: same, just get a feel for the
      terrain
- [ ] _(coming soon)_ Download the curriculum for offline study

---

## Chapter 0: What is Programming?

No language features. Conceptual orientation only.

- 🥚 Articulate the three human audiences of source code: developers, the
  computer, users
- 🥚 Explain what it means for code to _address_ each audience simultaneously
- 🥚 Describe the twinning progression across chapters: developer twin (Ch1) →
  computer twin (Ch2) → user twin (Ch3) → agent twin (Ch4)
- 🥚 Identify agents (LLMs) as a fourth audience: they read and understand code
  differently from humans, and writing _for and with_ agents requires its own
  communication skills (explored in Ch4)
- 🥚 Describe why this course prioritizes comprehension before production
- 🥚 Identify the three threads that run the whole curriculum: twinning,
  micro-decisions, perspective stacking
- 🐣 Explain the spiral curriculum: why revisiting concepts at increasing depth
  produces deeper understanding than covering them once

---

## Chapter 1: Developers

Language features: comments, `console.log` and the full `console` API with
string literals.

A foundational conceptual distinction is introduced here: not as a technical
exercise but as orientation: **source code (static) vs. program execution
(dynamic)**. Comments exist in the static text; logs are observed during
execution. This sets up the developer twin: the developer who reads your code
sees the static text, not the runtime. Understanding this distinction is
prerequisite to understanding why comments and logs serve different purposes.

The computer is not yet a full audience. Devtools console is developer space.

### Comments

- 🥚 Write comments that describe what a program should do and why\
  _builds on: writing prose → writing intentional, purposeful notes inside code_
- 🥚 Identify and apply comment conventions: inline (`//`), block (`/* */`),
  doc-style (`/** */`), `*`-aligned block structure\
  _builds on: reading formatted text → recognizing conventions → applying them_
- 🥚 Understand "why not what": a comment explains the intent behind a line, not
  what the line literally does
- 🥚 **Micro-decisions in comments**: every choice (word selection, length,
  placement, convention) shapes how a comment reads; notice the choices,
  consider their effect on the developer-reader\
  _builds on: writing prose → noticing that every word is a choice with a
  consequence for the reader_
- 🐥 Read and appreciate real comments from real codebases: funny, desperate,
  poetic examples of developer-to-developer communication

### Logs

- 🥚 Source code (static) vs. program execution (dynamic): comments live in the
  static text; logs are observed at runtime\
  _builds on: reading comments as text → understanding that running code
  produces a different, separate experience_
- 🥚 The full `console` API: what each method communicates and when to reach for
  it:
  - **Output by intent**: `console.debug` (trace-level), `console.log`
    (general), `console.info` (informational), `console.warn` (unexpected but
    not broken), `console.error` (broken)
  - **Asserting**: `console.assert(condition, message)` — silent when true,
    logs an error when false
  - **Counting**: `console.count(label)` / `console.countReset(label)` —
    named counter tracking, useful in loops
  - **Grouping**: `console.group(label)` / `console.groupCollapsed(label)` /
    `console.groupEnd()` — collapsible indented output sections
  - **Timing**: `console.time(label)` / `console.timeLog(label)` /
    `console.timeEnd(label)` — named timer trio for rough measurement
  - **Utility**: `console.clear()` — clears all console output
- 🥚 When to use comments vs. logs: comments for reading the code; logs for
  observing it run
- 🥚 **Micro-decisions in logs**: which console method? what message? what data
  included? Why `.info` and not `.log`? Is `.warn` ever appropriate here? Each
  choice communicates different things to the developer watching the console\
  _builds on: micro-decisions in comments → now applied to the runtime channel_
- 🐣 Share code with others _(future feature: save-to-gist, pop-up sandbox)_

---

## Chapter 2: Developers and Computers

The computer is now a full audience. The primary learning objective is the
**notional machine**: the mental model of how JavaScript executes your code.
Programs produce output via logs and assertions but do not yet interact with
users. `undefined` is encountered naturally through variables; `null` is held
until Chapter 3 where `prompt()` can return it.

The chapter has two tracks:

- **NM core (2.0–2.8)**: the machine itself: expressions, values, bindings,
  scope chain, prototype chain, coercion, statements, and reading/writing code.
  All required.
- **Computational idioms (2A–2F)**: what you _do_ with the machine: logic and
  truthiness, text processing, number crunching, pattern matching, bit
  manipulation, date computation. **2A (Logic) and 2B (Strings) are required.**
  Choose at least one from 2C–2E. 2F is optional.

### 2.0 The Notional Machine

- 🥚 Name the components of the JEJ notional machine: values, bindings, scopes,
  expressions, statements, resolve, coercion, errors, scope chain lookup,
  prototype chain lookup
- 🥚 Distinguish the two viewing levels: _visual-syntax_ (expressions and
  statements: what you write) and _behind-the-scenes_ (values, bindings, scopes,
  coercion: what the VM does invisibly)
- 🥚 Explain what "twinning the computer" means: building an accurate internal
  model of what the VM does when it runs your code
- 🥚 Recognize that source code is static; execution produces a dynamic stream
  of **runtime events**: observable moments the VM produces as code runs

### 2.1 Running a Program

- 🥚 Static source code vs. dynamic execution: reading a file vs. running it\
  _builds on: comments as static text → logs as runtime observation →
  distinguishing the two clearly_
- 🥚 **Runtime events**: a running program produces an ordered stream of
  observable moments; the tracer captures these automatically; trace tables
  record them by hand\
  _builds on: static/dynamic distinction → now naming the individual moments of
  execution_
- 🥚 Logging string literals to the console from programs that execute
- 🥚 Fix errors: parse errors (creation phase) vs. runtime errors (execution
  phase)\
  _builds on: reading error messages → locating the source line → categorizing
  the failure type_

### 2.2 Expressions and Resolve

- 🥚 Identify an expression as syntax that produces a value: operators,
  literals, identifiers, calls, templates, property access, assignment
- 🥚 Trace how a compound expression evaluates step by step: sub-expressions
  resolve in order, precedence, parentheses
- 🥚 **Resolve**: every expression produces exactly one value; the VM hands this
  value back to the surrounding expression or statement
- 🥚 All operators: arithmetic, comparison, equality, logical, negation,
  `typeof`, grouping, compound assignment (`+=`, `-=`, etc.),
  increment/decrement (`++`, `--`)
- 🥚 **Implicit coercion**: the VM silently transforms types between operands
  and operators (`'5' - 1`, `if ('hello')`); a _behind-the-scenes_ event,
  invisible in the syntax\
  _builds on: knowing individual types → predicting what happens when types mix
  without being explicitly converted_
- 🥚 **Asserting on expressions**: `console.assert(1 + 1 === 2)` as a claim
  about what an expression resolves to; the program verifies the claim\
  _builds on: logging to observe values → now making a predictive claim_
- 🥚 Block scope as a container: empty `{}` blocks; code runs inside a scope;
  scopes can nest
- 🐣 Explicit type conversion vs. implicit coercion: `Number()`, `String()`,
  `Boolean()`, `parseInt`/`parseFloat`: learner-visible syntax vs. VM-invisible
  transformation

### 2.3 Values and Bindings

- 🥚 The binding lifecycle: declare → initialize → available → access / update\
  _builds on: expressions that produce values → now storing and retrieving those
  values in named memory slots_
- 🥚 `let` vs `const`: what each allows and what it communicates to the reader
- 🥚 Variable names as communication choices: naming conventions (camelCase,
  snake*case, CONSTANT_CASE, PascalCase)\
  \_builds on: micro-decisions in comments (Ch1) → the same intentionality now
  applied to names*
- 🥚 Log variable values to the console; observe state change over time\
  _builds on: logging string literals (Ch1) → logging computed values →
  observing state change_
- 🥚 **Trace tables**: systematic notation of execution: declare/initialize/
  access/update events for each binding, in steps-format and values-format\
  _builds on: reading code → logging to observe state → writing down every read
  and write in a table_
- 🥚 **Predictive stepping with a debugger**: predict what happens next → step →
  check → investigate\
  _builds on: trace tables → now stepping one instruction at a time with a tool_
- 🥚 **Scope chain walk**: when an identifier is read, the VM checks the current
  (innermost) scope first, then its parent, up to the global environment; each
  check is a miss (keep looking) or a hit (binding found)\
  _builds on: block scope as container (2.2) → now seeing how the VM navigates
  nested containers to find a name_
- 🥚 Block scope with variables: `let` declared inside `{}` is not accessible
  outside; scope chain walk makes this concrete
- 🥚 **Asserting on bindings**: predict what a binding holds at a specific
  point; write `console.assert` statements that must pass\
  _builds on: asserting on expressions (2.2) → now asserting about stored state_
- 🐣 Write code to satisfy assertions sprinkled through a script\
  _builds on: reading assertions → predicting what code produces → now writing
  the code to make the assertion true_

### 2.4 Statements and Control Flow

- 🥚 Conditionals: `if`/`else if`/`else`: reading and tracing branches\
  _builds on: tracing linear programs → now tracing programs where execution
  path depends on values_
- 🥚 Ternary expressions: recognizing as a compact conditional form\
  _builds on: reading if/else → recognizing ternary as equivalent → refactoring
  between them_
- 🥚 While loops, do-while loops, for loops, for-of loops: reading and tracing\
  _builds on: tracing sequential execution → now tracing repeated execution_
- 🥚 `break` and `continue`: recognizing and tracing their effect
- 🐣 Refactoring between equivalent loop forms (while ↔ for, do-while ↔ while)\
  _builds on: tracing loops → seeing structural equivalence → translating one
  form to another_
- 🐣 Block scope inside control flow: variables declared inside `if`/`while`
  bodies; scope chain walk makes the boundary concrete

### 2.6 Prototype Chain

- 🐣 **Auto-boxing**: when a method is called on a primitive, the VM temporarily
  wraps it in its constructor's object form (`'hello'` → `String` wrapper)\
  _builds on: primitive types → now seeing that primitives gain methods through
  a wrapping mechanism_
- 🐣 **Prototype chain lookup**: one-hop lookup for primitives: value →
  `Constructor.prototype` → method found; a _behind-the-scenes_ event parallel
  to scope chain lookup\
  _builds on: scope chain walk (2.3) → now a parallel lookup mechanism for
  methods instead of names_
- 🐣 Reading `str.toUpperCase()` as: look up `toUpperCase` on `String.prototype`
  → call it with `str` as the receiver
- 🐣 String methods are now available: all programs up to this point used only
  operators and literals; methods become available once the lookup mechanism is
  understood
- 🐥 The same mechanism applies to Number methods (`(3.14).toFixed(2)`) and
  RegExp methods (`/pattern/.test(str)`)

### 2.8 Reading, Writing, Reviewing Code

- 🥚 **PBSI Framework**: Purpose, Behavior, Strategy, Implementation: four
  perspectives for reading any program simultaneously\
  _builds on: reading comments → describing what code does → now naming four
  distinct levels of description_
- 🥚 "Why not what" comments applied to programs with logic: explaining strategy
  and behavioral correlations\
  _builds on: "why not what" in Ch1 → now grounded in PBSI vocabulary and
  applied to more complex programs_
- 🥚 **Logging strategies**: structured `console.log` placement: program
  structure, variables, control flow\
  _builds on: logging values (2.3) → now using logs as a deliberate, structured
  debugging strategy_
- 🐣 **Backtracing**: reasoning backwards from output to input\
  _builds on: trace tables (2.3) → predictive stepping (2.3) → now reversing the
  direction of analysis_
- 🐣 **Describing programs**: close reading across all PBSI levels: zooming out
  (purpose/behavior), zooming in (line-by-line), finding connections, labeling
  goals\
  _builds on: trace tables → PBSI framework → now a structured methodology
  combining both_
- 🐣 **Naming variables**: variable analysis → generic role-based names →
  specific domain names → variable roles (fixed value, stepper, flag, gatherer,
  holder, temporary)\
  _builds on: variable names as communication (2.3) → now a structured analysis
  methodology_
- 🥚 **Linting**: recognizing and fixing style issues automatically\
  _builds on: code conventions (Ch1) → now enforced by a tool_
- 🐣 **Refactoring**: changing implementation or strategy without changing
  program output (`console.log` output as the fixed point)\
  _builds on: BSI variations → now a formal discipline: same behavior, different
  code_
- 🐣 **Code review**: structured template: behavior, goals, comments, linting,
  variables\
  _builds on: describing programs → naming variables → now applied as a review
  of someone else's code_
- 🐣 **Comparing programs**: same behavior, different approaches; developing an
  eye for voice and readability tradeoffs\
  _builds on: refactoring → code review → now noticing aesthetic and stylistic
  choices within the language_

---

## Computational Idioms

These branches apply the notional machine to specific computational domains.
**2A and 2B are required.** Choose at least one from 2C–2E. 2F is optional.

### 2A: Logic and Truthiness 🥚

Required. Foundation for reading conditional programs and understanding how
values flow through boolean contexts.

- 🥚 Truthiness and falsiness: every value is truthy or falsy; the six falsy
  values (`false`, `0`, `''`, `null`, `undefined`, `NaN`)
- 🥚 Short-circuit evaluation: `&&` stops at first falsy, `||` stops at first
  truthy, `??` stops at first non-nullish; the expression resolves to the
  stopping value, not necessarily a boolean
- 🥚 Logical compound assignment: `&&=`, `||=`, `??=`
- 🐣 Using short-circuit for default values and guard clauses\
  _builds on: if/else (2.4) → recognizing short-circuit as a compact alternative
  for simple conditional assignments_
- 🐣 Refactoring between if/else, ternary, and short-circuit forms\
  _builds on: PBSI refactoring → now applied to conditional expression forms_

### 2B: Strings 🥚

Required. Needed for Chapter 3 user programs (`prompt`/`alert`/`confirm` work
with strings). Builds directly on the prototype chain understanding from 2.6.

- 🥚 String methods: measuring (`length`), accessing characters (`charAt`, `at`,
  bracket notation), searching (`indexOf`, `includes`, `startsWith`,
  `endsWith`), transforming (`toUpperCase`, `toLowerCase`, `trim`, `padStart`,
  `padEnd`, `repeat`), extracting and replacing (`slice`, `replace`,
  `replaceAll`, `split`)
- 🥚 Template literals: readable alternative to concatenation; expression
  interpolation\
  _builds on: string concatenation → recognizing template literals as a more
  readable alternative → refactoring between them_
- 🥚 `String.fromCharCode` / `String.fromCodePoint`: character encoding; code
  point ↔ character\
  _builds on: string methods → seeing strings as sequences of encoded
  characters_
- 🐣 Optional chaining: `str?.method()` for values that might be null or
  undefined
- 🐣 Text processing programs: searching, transforming, extracting substrings\
  _builds on: string methods → now composing them into full programs_

### 2C: Numbers and Math 🐣

Choose at least one from 2C–2E.

- 🥚 Math methods and constants: `Math.max`, `Math.min`, `Math.abs`,
  `Math.floor`, `Math.ceil`, `Math.round`, `Math.random`, `Math.pow`,
  `Math.sqrt`, `Math.PI`, `Math.E`
- 🥚 Number helpers: `Number.isNaN`, `Number.isFinite`, `Number.isInteger`,
  `parseInt`, `parseFloat`
- 🥚 Number prototype methods: `toFixed(n)`, `toString(radix)`, `toPrecision`,
  `toExponential`, `toLocaleString`
- 🥚 **Floating point representation**: why `0.1 + 0.2 !== 0.3`; precision
  limits of IEEE 754; when this matters and how to work around it\
  _builds on: arithmetic operators → understanding what the VM actually stores
  for a number literal_
- 🥚 **BigInt**: integers without precision limits: `42n` literal syntax,
  `BigInt()` constructor; `typeof` is `'bigint'`; can't mix with `number` in
  arithmetic; integer division truncates\
  _builds on: floating point limits → BigInt as the solution for exact large
  integer arithmetic_
- 🐣 Geometry and randomness programs
- 🐣 Number crunching programs: accumulation, running totals, summarization

### 2D: Pattern Matching 🐔

Choose at least one from 2C–2E.

- 🐔 **Regular expressions**: pattern-matching computation: instead of
  procedural string operations, declare the _shape_ of what you're looking for\
  _builds on: string methods (2B) → recognizing that some problems are better
  described as patterns than as sequences of operations_
- 🐔 `/pattern/flags` literals, `.test()`, `.match()`, `.replace()` with regex
- 🐔 **Computational micro-decisions**: regex vs. string methods: the choice is
  not just what works but what _expresses the problem clearly_

### 2E: Integers and Bits 🐔

Choose at least one from 2C–2E.

- 🐔 **Bitwise operators**: computation at the bit level: numbers as binary
  structures, not decimal values\
  _builds on: arithmetic and numeric types → seeing that numbers have an inner
  structure that can be directly manipulated_
- 🐔 `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`: what each does at the bit level
- 🐔 BigInt works with bitwise operators: see 2C for the BigInt introduction
- 🐔 **Computational micro-decisions**: bitwise vs. arithmetic: the choice
  expresses the problem's structure

### 2F: Dates 🐔

Optional extra.

- 🐔 `Date.now()`: current timestamp as a number (milliseconds since epoch)
- 🐔 `new Date()`: the sole `new` exception in JEJ; creates a date object whose
  methods all return primitives
- 🐔 `Date.parse(str)`: parsing a date string to a timestamp
- 🐔 Date instance methods: `getFullYear()`, `getMonth()` (0-indexed),
  `getDate()`, `getHours()`, `getMinutes()`, `getSeconds()`,
  `toLocaleDateString()`, `toLocaleTimeString()`, `toISOString()`
- 🐔 Date computation programs: elapsed time, formatting, internationalization\
  _builds on: numbers and arithmetic → now applied to time as a domain_

---

## Chapter 3: Developers, Computers, and Users

Language features: `prompt`, `alert`, `confirm`. All control flow features
(`if`, `while`, `break`/`continue`) were introduced in Chapter 2 and are now
applied in programs where user interactions are the fixed behavioral anchors.

All Chapter 2 skills: PBSI, naming variables, logging strategies, backtracing,
refactoring, code review: are practiced here under a new constraint:
user-visible behavior must be preserved.

### 3.1 User Input and Output

- 🥚 `prompt`, `alert`, `confirm`: user-facing I/O; devtools console is
  developer space, these are user space\
  _builds on: console.log for developers → now alert/prompt for users; the
  rhetorical split becomes architecturally visible_
- 🥚 Top-level doc comments: program name, purpose, and behavior\
  _builds on: writing "why" comments → now structuring them as a full program
  description for a reader_
- 🥚 Writing simple programs that process user input or perform string/number
  operations on it
- 🥚 `null`: what `prompt()` returns when the user cancels; the first encounter
  with null in a meaningful context

### 3.2 Variable Program Behaviors

- 🥚 Input/output pairs as test cases in the top-level doc comment\
  _builds on: asserting about state (2.3) → now specifying expected outputs for
  given inputs → documenting them_
- 🥚 Test coverage: are all conditional paths covered by your test cases?
- 🐣 **Fixing bugs**: code runs without error but produces wrong user-facing
  behavior\
  _builds on: fixing parse/runtime errors (2.1) → now the program runs but fails
  user expectations_
- 🐣 **Modifying programs**: one change at a time, predict, run, note the
  result; user interactions as fixed points\
  _builds on: refactoring in Ch2 (console.log as fixed point) → now user-visible
  behavior is the anchor_

### 3.3 Validating User Input

- 🥚 **Program structure pattern**: input + validation (while loop) → logic
  (conditional) → output\
  _builds on: reading programs as flat sequences → recognizing distinct
  structural phases_
- 🥚 Getting numbers from users: cast to number, validate the cast, validate the
  range
- 🥚 Full user-story-based top-level comments\
  _builds on: top-level doc comments (3.1) → now structured as a user story with
  personas and scenarios_

### 3.4 PBSI in User Programs

- 🥚 BSI variations in user programs: same user-facing behavior, different
  strategies and implementations\
  _builds on: PBSI introduced in Ch2 → now applied to programs with a user
  dimension_
- 🥚 Input validation strategies and their tradeoffs: all-in-while-head, boolean
  flag, do-while
- 🐣 **Describing user programs**: PBSI close reading where Purpose is now "why
  this exists for a user"\
  _builds on: describing programs in Ch2 (developer-facing output) → now the
  user's experience is part of the analysis_

### 3.5 Developing Programs

- 🐣 **Refactoring user programs**: changing code without changing user-visible
  behavior\
  _builds on: refactoring in Ch2 (console.log fixed point) → user interactions
  now the fixed point_
- 🐥 **Writing programs from spec**: graduated scaffolding: stepped examples →
  starter code → spec + goals → spec only\
  _builds on: modifying programs → refactoring → code review → now producing
  programs independently_
- 🐔 **Reverse engineering**: describe behavior → plan goals/strategy → write
  code from an obfuscated program
- 🐔 Writing programs from unstructured guidance (plain English, word problems,
  your own ideas)

### 3.6 Plaintext Programs

_The IDE disappears. A plain text editor and a run button: nothing else. No
lenses, no syntax highlighting, no autocomplete, no error highlighting._

- 🐣 Reading and understanding programs without IDE assistance\
  _builds on: all prior reading skills → now stripped of tooling that has been
  scaffolding comprehension_
- 🐣 Writing syntactically correct code without autocomplete or error
  highlighting\
  _builds on: all prior writing skills → now relying on internalized knowledge
  rather than tool feedback_
- 🐥 Appreciating concretely what IDE tools do: by experiencing their absence,
  you understand what each tool was compensating for\
  _builds on: using IDE tools throughout Ch1–3 → now understanding them as
  scaffolding, not crutches_

---

## Chapter 4: Developers, Computers, Users, and Agents

No new language features. This chapter applies all Chapter 1–3 skills in
collaboration with an LLM. Agents are a fourth audience: they read and
understand code differently from humans, and writing _for and with_ them
requires its own communication skills.

### 4.0 What is an LLM?

- 🥚 Explain why an LLM is not a database or keyword-lookup system
- 🥚 Describe what "predicting the next token" means in practical terms
- 🥚 Explain why the same prompt can produce different outputs (stochasticity)
- 🐣 Describe at least 2 key differences between LLM "cognition" and human
  reasoning
- 🐣 Identify when an LLM is likely to be unreliable (the jagged frontier)
- 🐥 Use the 4 Levels of Abstraction framework to discuss AI at the appropriate
  level
- 🐥 Explain the Gell-Mann Amnesia effect in the context of LLM output

### 4.1 Collaborating in Prose

- 🥚 Given an LLM response, hypothesize what patterns it might be matching
- 🥚 Write clear, specific prompts that provide necessary context
- 🐣 Ask the same question multiple ways and observe how outputs vary
- 🐣 When a response isn't useful, identify what to change and observe the
  effect
- 🐣 Predict how changes to a prompt will affect LLM output, and test the
  prediction\
  _builds on: predictive stepping (2.2) → now applied to prompts instead of
  programs_
- 🐥 Explain why an LLM produced incorrect or unexpected output
- 🐥 Reflect on when it helped to let the LLM lead vs. when you needed to drive

### 4.2 Agents and Developer Communication

_Revisits Chapter 1: comments, variable names: with an LLM collaborator._

- 🥚 Read LLM-generated comments and evaluate whether they are helpful for
  developers
- 🥚 Read LLM-suggested variable names and evaluate whether they follow naming
  conventions
- 🐣 **Perspective-Take**: hypothesize what training patterns produced a
  specific comment or name
- 🐣 **Articulate**: write prompts that give the LLM enough context to generate
  useful developer-facing output
- 🐣 Draft structured comments for programs that don't exist yet, using the LLM
  as a thinking partner
- 🐥 **Calibrate**: where is the LLM reliable at developer-facing output? Where
  does it fail?
- 🐥 **Delegate**: is this a task where the LLM adds value, or does using it
  undermine your learning?
- 🐔 SOLO check-in: are you building structure (learning conventions) or
  substituting the LLM for understanding?

### 4.3 Agents and Computer Communication

_Revisits Chapter 2: tracing, asserting: with an LLM collaborator._

- 🥚 Trace LLM-generated code using predictive stepping and trace tables (Ch2
  skills applied to unfamiliar code)
- 🐣 Have the LLM trace code, then evaluate whether its traces correctly track
  state
- 🐣 Have the LLM explain code, then describe whether the explanation matches a
  PBSI analysis
- 🐣 **Perspective-Take**: LLMs often produce plausible-looking but wrong traces
  : identify why
- 🐥 **Calibrate**: LLMs are better at generating code than tracing it: use this
  asymmetry deliberately
- 🐥 Evaluate LLM-generated traces for correctness
- 🐥 **Delegate**: when should you trace yourself vs. ask the LLM to trace?
- 🐔 SOLO check-in: tracing is a foundation-building skill: skipping it removes
  your ability to evaluate LLM output

### 4.4 Agents and User Communication

_Revisits Chapter 3: user programs: with an LLM collaborator._

- 🥚 Read LLM-generated programs and identify what they do (using Ch1–3 skills)
- 🐣 Apply full PBSI evaluation to LLM-generated programs
- 🐣 Code review LLM-generated code using the established code review framework
- 🐣 Design test cases for LLM-generated programs
- 🐣 Describe gaps between your intent and LLM output using PBSI vocabulary
- 🐥 Debug LLM-generated code: detect bugs, identify root causes, fix them
- 🐥 Full documentation generation and review: interact with LLMs around the
  full doc comment structure
- 🐥 **Iterate**: full collaboration loop: prompt → evaluate → refine → repeat
- 🐔 SOLO check-in (threshold moment): all collaboration approaches are now
  available: choose based on your learning position

### 4.5 Looking Back, Looking Forward

- 🐣 Given scenarios, identify which collaboration approach you'd use and why
- 🐣 Articulate programming concepts precisely enough for an LLM to act on them
- 🐥 Choose an appropriate collaboration approach based on your learning goals
  (SOLO framework)
- 🐥 Apply perspective-taking to evaluate LLM output in unfamiliar domains
- 🐔 Delegate effectively: identify which parts of a task benefit from LLM
  assistance vs. which undermine learning
- 🐔 Compare LLM "theory of mind" to human theory of mind: what transfers, what
  doesn't

### 4.6 Vibecoding

- 🐣 Decompose a complex request into smaller, verifiable steps (by contrast
  with unguided vibe-coding)
- 🐥 Evaluate code you didn't write or review during generation (PBSI autopsy)
- 🐥 Identify where the jagged frontier manifested in a concrete collaboration
- 🐔 Reflect on the difference between "it runs" and "I understand it"
