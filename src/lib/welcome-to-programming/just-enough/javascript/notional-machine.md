# JEJ Notional Machine

The mental model of how JavaScript works that JEJ learners build. This document
defines the conceptual model — what elements exist, how they relate, and how
execution proceeds. The tracer captures this model as data; educational tools
visualize it.

Covers exactly the language features in [reference.md](./reference.md).

See also:

- [tracer.md](./tracer.md) — how the tracer captures this model (config, result
  shape, entwined data)
- [tracer.walkthroughs.md](./tracer.walkthroughs.md) — event sequences for every
  JEJ construct
- [tracer.architecture.md](./tracer.architecture.md) — implementation layers,
  vocabulary, test taxonomy

---

## The machine at a glance

```text
┌─── PROGRAM SOURCE CODE ───────────────────────────────────────────────────────┐
│  let greeting = 'hello';                                                      │
│  let shout = greeting.toUpperCase() + '!';                                   │
│  if (shout.length > 3) {                                                     │
│    alert(shout);                                                             │
│  }                                                                           │
└───────────────────────────────────────────────────────────────────────────────┘
        │                                    │                                │
        │ VISUAL-SYNTAX LEVEL                │ BEHIND-THE-SCENES LEVEL        │ I/O CHANNELS
        │ (what the code DOES)               │ (what the VM does invisibly)    │ (outside the VM)
        │                                    │                                │
        ▼                                    ▼
┌─── EXPRESSIONS ───────────┐    ┌─── VALUES ──────────────────────────────────┐
│ syntax → value            │    │ primitive data flowing through the program  │
│                           │    │                                             │
│ operators: +, >, ===, ... │    │ string number bigint boolean null undefined │
│ literals: 5, 'hello', ... │    │                                             │
│ identifiers: x, y        │    │ primitives: direct containment (x holds 5)   │
│ calls: alert(...), ...    │    │ globals: reference (Math → register)        │
│ templates: `${x}`        │     └─────────────────────────────────────────────┘
│ property: str.length      │              ▲ stored in       │ flow through
│ assignment: x = ...       │              │                 ▼
├───────────────────────────┤    ┌─── BINDINGS ────────────────────────────────┐
│    resolve ──────────────────→ │ named memory slots holding values           │
│ (bridges visual ↔ behind) │    │                                             │
└───────────────────────────┘    │ lifecycle:                                  │
                                 │   declare → initialize → available          │
┌─── STATEMENTS ────────────┐    │   → access / update                         │
│ syntax → control flow     │    │ kind: let | const | global                  │
│                           │    └─────────────────────────────────────────────┘
│ declarations, if/else,    │              │ contained in
│ while, for, do-while,     │              ▼
│ for-of, break, continue   │    ┌─── SCOPES (chain, walked top-down) ─────────┐
└───────────────────────────┘    │                                             │
                                 │ ┌─ global environment ──────────────────┐   │
┌─── ERRORS ────────────────┐    │ │                                       │   │
│ abnormal termination      │    │ │ REGISTERS (by reference)              │   │
│ (cross-cutting, with      │    │ │                                       │   │
│ creation/execution phase) │    │ │ Math ──→ ┌──────────────────────┐     │   │
│                           │    │ │          │ max min abs floor    │     │   │
│ ReferenceError            │    │ │          │ ceil round random    │     │   │
│ TypeError                 │    │ │          │ PI E sqrt pow ...    │     │   │
│ RangeError                │    │ │          └──────────────────────┘     │   │
└───────────────────────────┘    │ │ String ──→ ┌────────────────────┐     │   │
                                 │ │            │ ƒ String()         │     │   │
                                 │ │            │ fromCharCode       │     │   │
                                 │ │            │ fromCodePoint      │     │   │
                                 │ │            │ ┌ prototype ─────┐ │     │   │
                                 │ │            │ │ toUpperCase    │ │     │   │
                                 │ │            │ │ toLowerCase    │ │     │   │
                                 │ │            │ │ slice trim     │ │     │   │
                                 │ │            │ │ includes       │ │     │   │
                                 │ │            │ │ indexOf        │ │     │   │
                                 │ │            │ │ replace ...    │ │     │   │
                                 │ │            │ └────────────────┘ │     │   │
                                 │ │            └────────────────────┘     │   │
                                 │ │ Number ──→ ┌────────────────────┐     │   │
                                 │ │            │ ƒ Number()         │     │   │
                                 │ │            │ isNaN isFinite     │     │   │
                                 │ │            │ isInteger          │     │   │
                                 │ │            │ ┌ prototype ─────┐ │     │   │
                                 │ │            │ │ toString       │ │     │   │
                                 │ │            │ │ toFixed        │ │     │   │
                                 │ │            │ │ toPrecision    │ │     │   │
                                 │ │            │ │ toExponential  │ │     │   │
                                 │ │            │ │ toLocaleString │ │     │   │
                                 │ │            │ └────────────────┘ │     │   │
                                 │ │            └────────────────────┘     │   │
                                 │ │ Date ──→ ┌──────────────────────┐     │   │
                                 │ │          │ static: now  parse   │     │   │
                                 │ │          │ ctor: new Date()     │     │   │
                                 │ │          │ ┌ instance ────────┐ │     │   │
                                 │ │          │ │ getFullYear      │ │     │   │
                                 │ │          │ │ getMonth getDate │ │     │   │
                                 │ │          │ │ getHours         │ │     │   │
                                 │ │          │ │ getMinutes       │ │     │   │
                                 │ │          │ │ getSeconds       │ │     │   │
                                 │ │          │ │ getTime          │ │     │   │
                                 │ │          │ │ toLocaleDateStr  │ │     │   │
                                 │ │          │ │ toLocaleTimeStr  │ │     │   │
                                 │ │          │ │ toISOString      │ │     │   │
                                 │ │          │ └──────────────────┘ │     │   │
                                 │ │          └──────────────────────┘     │   │
                                 │ │ console ──→ ┌──────────────────┐     │   │──→ ┌─ DEV CONSOLE ──────────────┐
                                 │ │             │ log warn error   │     │   │    │ devtools output             │
                                 │ │             │ assert ...       │     │   │    │ (append-only, no pause)     │
                                 │ │             └──────────────────┘     │   │    └─────────────────────────────┘
                                 │ │                                       │   │
                                 │ │ (regex /pat/ → RegExp.prototype       │   │
                                 │ │  .test() — not in global register)    │   │
                                 │ │                                       │   │
                                 │ │ FUNCTIONS (callable, marked ƒ)        │   │
                                 │ │ ƒ alert   ──────────────────────────────────→ ┌─ USER INTERFACE ────────────┐
                                 │ │ ƒ confirm ←────────────────────────────────→  │ browser dialogs             │
                                 │ │ ƒ prompt  ←────────────────────────────────→  │ (pauses until user responds)│
                                 │ │ ƒ parseInt  ƒ parseFloat              │   │   └─────────────────────────────┘
                                 │ │ ƒ Boolean()                           │   │
                                 │ │                                       │   │
                                 │ │ CONSTANTS (bare values)               │   │
                                 │ │ Infinity  NaN  undefined              │   │
                                 │ │                                       │   │
                                 │ └───────────────────────────────────────┘   │
                                 │   ▲ (top of scope chain)                    │
                                 │   │                                         │
                                 │ ┌─ script scope ────────────────────────┐   │
                                 │ │ greeting: let │ 'hello'               │   │
                                 │ │ shout:    let │ 'HELLO!'              │   │
                                 │ └───────────────────────────────────────┘   │
                                 │   ▲                                         │
                                 │   │                                         │
                                 │ ┌─ block scope (if-body) ───────────────┐   │
                                 │ │ (no bindings in this block)           │   │
                                 │ └───────────────────────────────────────┘   │
                                 └─────────────────────────────────────────────┘

TWO KINDS OF CHAIN LOOKUP:
  Scope chain:     block → script → global   (finding a VARIABLE by name)
  Prototype chain: value → Constructor.prototype   (finding a METHOD on a value)


```
---

## Two viewing levels

**Visual-syntax level** — anchored to code the learner sees:

- **Expressions** — syntax that produces values through evaluation
- **Statements** — syntax that controls which code runs and when

**Behind-the-scenes level** — what the VM does invisibly:

- **Values** — primitive data flowing through the program
- **Bindings** — named memory slots that hold values
- **Scopes** — containers for bindings, forming a chain
- **Global environment** — built-in objects, functions, and constants (top of
  the scope chain)
- **Coercion** — implicit type transformations (invisible in code, observable
  only in the trace — fires between operand resolution and operator)

**Control panel vs. machine**: The visible syntax (expressions + statements) is
the CONTROL PANEL — the interface through which the programmer controls the
machine. The behind-the-scenes level (bindings, scopes, values, coercion) is
what JavaScript actually IS — the machine itself. The code text is a
representation designed to help us program the machine; it is not the machine.

**Bridge**: resolve captures when an expression produces a value — connecting
which syntax (visual) to which data (behind-the-scenes).

**Cross-cutting**: errors (abnormal termination).

**External channels** (outside the computation model, reached via function calls):

- **Developer Console** — append-only output stream (devtools); `console.*` writes here
- **User Interface** — synchronous browser dialogs; `alert`/`confirm`/`prompt`

---

## Components

### Values

Primitive data: `string`, `number`, `bigint`, `boolean`, `null`, `undefined`.

Values are the currency of the notional machine. They:

- Flow through expressions (as operands and results)
- Are stored in bindings (via initialize and update)
- Are retrieved from bindings (via access)
- Are passed as arguments to function calls and returned as results
- Are transformed by coercion (one type becomes another implicitly)

**Containment model**: primitives use direct containment — "the box labeled x
contains 5." Global objects use reference — "Math points to a register of
available methods."

### Bindings

Named memory slots that hold values. Each binding has:

- **name**: the identifier (`x`, `userName`, `i`)
- **kind**: `let`, `const`, or `global`
- **value**: the current value held
- **scope**: which scope this binding lives in

Lifecycle:

1. **declare** — the binding exists but is in the Temporal Dead Zone (TDZ).
   Fires at SCOPE CREATION (hoisting) — before the declaration line runs.
2. **initialize** — the binding receives its first value. `let x = 5` → value
   is `5`. `let x;` → value is `undefined`. TDZ ends.
3. **available** — the binding is safe to read. Fires immediately after
   initialize.
4. **access** — the binding's current value is read (behind-the-scenes
   perspective). Fires when an identifier is evaluated.
5. **update** — the binding's value changes. Fires on assignment (`x = 6`,
   `x += 1`, `x++`).

There is also an expression-level **identifiers.read** event that fires for ALL
identifier nodes in the AST — both scope-chain identifiers (`x`, `Math`) AND
property-key identifiers (`.max`, `.length`, `.toUpperCase`). This is the
visual-syntax perspective: "I see this identifier in the code." The
behind-the-scenes counterpart for scope-chain identifiers is `bindings.access`
(binding lifecycle); for property-key identifiers it's `register-check` or
`proto-check` (property resolution). Mirrors the assignment/update split.

`const` bindings: initialize once, never update. Update attempt → TypeError.

### Scopes

Containers for bindings. Scopes form a chain — inner scopes can see bindings in
outer scopes via name resolution.

Kinds:

- **script scope** — top-level scope of the program
- **block scope** — created by each `{ }` block (if-bodies, loop bodies, bare
  blocks)
- **global environment** — the outermost scope. Built-in objects, functions, and
  constants. Always present. Top of the scope chain.

Lifecycle:

1. **create** — scope created. All bindings hoisted (declare events fire here).
2. **enter** — execution enters the scope body.
3. **completion** — scope body finishes normally.
4. **interrupt** — scope body exits abnormally (break, continue, or error).
5. **leave** — execution leaves the scope. Always fires (like `finally`).

### Scope chain lookup (name resolution)

When an identifier is evaluated, the engine walks the scope chain. Each scope
checked is a separate observable step:

```
scope-check(block, names: [y, z], result: miss)
scope-check(script, names: [greeting, shout], result: hit)
→ found greeting in script scope
```

Failed lookup = chain of misses ending in error:

```
scope-check(block, miss) → scope-check(script, miss) → scope-check(global, miss)
→ ReferenceError: undeclaredVar is not defined
```

### Prototype chain lookup (method resolution)

When a method is accessed on a value (`str.toUpperCase()`), JavaScript walks the
prototype chain. Parallels scope chain lookup — both are "walk a chain to find
a name."

```
proto-check(value: 'hello', miss)
proto-check(String.prototype, hit: toUpperCase)
→ found toUpperCase on String.prototype
```

For JEJ primitives, the chain is always two steps (value → Constructor.prototype):

- `string` → `String.prototype` (toUpperCase, slice, trim, includes, ...)
- `number` → `Number.prototype` (toString, toFixed, toPrecision, toExponential,
  toLocaleString)
- regex literal → `RegExp.prototype` (test)

### Global environment

Top of the scope chain. Everything JavaScript provides that the learner didn't
create. Distinguished by visual form:

**Object registers** (boxes with methods + prototype):

- **Math**: `max`, `min`, `abs`, `floor`, `ceil`, `round`, `random`, `PI`, ...
- **String**: `f String()` (conversion), `fromCharCode`, `fromCodePoint`.
  Prototype: `toUpperCase`, `toLowerCase`, `slice`, `trim`, `includes`,
  `indexOf`, `replace`, `charAt`, `charCodeAt`, `at`, ...
- **Number**: `f Number()` (conversion), `isNaN`, `isFinite`, `isInteger`.
  Prototype: `toString`, `toFixed`, `toPrecision`, `toExponential`,
  `toLocaleString`.
- **Date**: static: `now`, `parse`. Constructor: `new Date()` (the sole `new`
  exception in JEJ). Instance methods: `getFullYear`, `getMonth`, `getDate`,
  `getHours`, `getMinutes`, `getSeconds`, `getTime`, `toLocaleDateString`,
  `toLocaleTimeString`, `toISOString`. Date methods return primitives (numbers
  or strings) — no mutation, making Date a gentle intro to reference types.
- **console**: output by intent: `debug`, `log`, `info`, `warn`, `error`;
  asserting: `assert`; counting: `count`, `countReset`; grouping: `group`,
  `groupCollapsed`, `groupEnd`; timing: `time`, `timeLog`, `timeEnd`;
  utility: `clear`

**Standalone functions** (marked `f`):

- `f prompt`, `f confirm`, `f alert` — user I/O
- `f parseInt`, `f parseFloat` — string-to-number parsing
- `f Boolean()` — explicit boolean conversion (teaches truthiness)
- Global `isNaN`/`isFinite` are NOT in JEJ — use only the namespaced
  `Number.isNaN` / `Number.isFinite`

**Constants**: `Infinity`, `NaN`, `undefined`

Regex literals (`/pattern/flags`) create RegExp instances — `.test()` is found
via `RegExp.prototype`. No `RegExp` constructor in JEJ.

### Expressions

Syntax that produces values through evaluation. Compound expressions have
sub-expressions that evaluate in order (left-to-right, respecting precedence).

Expression kinds in JEJ: operators, short-circuit operators (`&&`, `||`, `??`),
ternary (`a ? b : c`), assignment (`=`, `+=`, `??=`, ...), increment/decrement
(`++x`, `x++`), property access (`.`, `[]`, `?.`), function calls, template
literals, identifiers, literals.

### Statements

Syntax that controls which code runs and when.

Statement kinds in JEJ: variable declarations (`let`, `const`), expression
statements, if/else, while, do-while, for, for-of (strings only), break,
continue.

Statements have an exit reason: `normal`, `break`, `continue`, or `error`.

### Coercion

Implicit type transformation. Fires BETWEEN operand resolution and operator
application — making the invisible visible.

Key coercion moments:

- **String concatenation**: `'5' + 1` → coerces `1` to `'1'`
- **Numeric operations**: `'5' - 1` → coerces `'5'` to `5`
- **Boolean contexts**: `if (x)`, `while (x)`, `!x` — truthiness
- **Template interpolation**: `${value}` → coerces to string
- **Comparison**: `'5' == 5` → coercion before comparison
- **Type conversion functions**: `Number('hello')` → `NaN`, `Boolean(0)` →
  `false` — explicit coercion visible as function calls

### Resolve

The moment an expression produces a value. Bridges the two viewing levels:
which syntax (visual) produced which data (behind-the-scenes).

Resolve kinds: variable, literal, operator, shortCircuit, conditional,
assignment, increment, property, call, template.

Resolves are traceable in isolation — filtering only resolves shows the complete
data flow through a program, including provenance (which value came from which).

### Errors

JEJ has no `try`/`catch` — every runtime error is unhandled. Errors occur in
two phases:

**Creation phase** (before execution starts): the learning environment validates
and instruments the code. Failures here include parse errors (syntax mistakes),
JEJ validation rejections (using features outside the language level), and
instrumentation failures. The program never runs.

**Execution phase** (during execution): runtime errors that occur while the
program is running:

- **ReferenceError**: undeclared variable, or TDZ access
- **TypeError**: wrong type for operation, or assigning to `const`
- **RangeError**: loop guard exceeded (generated by the learning environment)

Both phases are part of the JS notional machine — learners need to understand
that code goes through steps BEFORE it runs (parse → validate → instrument)
and can fail at any of them.

### I/O Channels

Two external channels through which a JEJ program communicates with the outside
world. Not part of the computation model (values, bindings, scopes) — these are
the places where the program's effects become visible to humans.

#### Developer Console

An append-only output stream, visible to the developer in browser devtools. Does
not pause execution. Accessed via the `console` object in the global environment.

`console.*` calls write to this stream — the method signals intent:

| Group | Methods | When to use |
|---|---|---|
| Output | `debug`, `log`, `info`, `warn`, `error` | Trace-level detail through broken output |
| Asserting | `assert(condition, message)` | Claims about what the program should be doing |
| Counting | `count(label)`, `countReset(label)` | How many times a path has been reached |
| Grouping | `group(label)`, `groupCollapsed(label)`, `groupEnd()` | Hierarchical output structure |
| Timing | `time(label)`, `timeLog(label)`, `timeEnd(label)` | Rough duration measurements |
| Utility | `clear()` | Reset the stream |

#### User Interface

A synchronous dialog channel. Pauses execution until the user responds. Visible
to the user as a browser dialog.

| Function | User sees | Program receives | Direction |
|---|---|---|---|
| `alert(msg)` | message + OK button | `undefined` | one-way → |
| `confirm(msg)` | message + OK/Cancel | `boolean` | two-way ←──→ |
| `prompt(msg)` | message + text field + OK/Cancel | `string` or `null` | two-way ←──→ |

The User Interface channel is the primary subject of Chapter 3: writing programs
that communicate with users via these three functions.

**Tracer visibility**: I/O channel interactions are observable as tracer events.
`io.dev.*` gates fire one event per `console.*` call carrying the method and
arguments. `io.user.display` fires when a dialog appears; `io.user.input` fires
when the user responds. See [tracer.md](./tracer.md) for event shapes.

---

## Cross-component interactions

The richest moments in the notional machine are where multiple components
interact simultaneously:

| Moment | Visual-syntax | Behind-the-scenes |
|---|---|---|
| `let x = 5;` | statement enters/exits | binding declare (hoisted) → initialize → available |
| `x` in expression | identifiers.read(x) | scope chain lookup → binding access → resolve |
| `x = x + 1` | expression (= and +) | scope lookup → binding access → resolve → binding update |
| `'5' + 1` | expression (+) | operand resolves → **coercion** → operator |
| `if (x > 0) {...}` | statement (if) | test expression → coercion (to boolean) → scope create/enter/leave |
| `Math.max(3, 7)` | expression (call) | scope lookup (Math) → prototype check (.max) → call → resolve |
| `str.toUpperCase()` | expression (call) | scope lookup (str) → proto check (String.prototype) → call → resolve |
| `x++` | expression (update) | identifiers.read(x) → binding access → arithmetic (+1) → binding update → resolve (old or new depending on prefix/postfix) |
| `break;` | statement exit(break) | scope interrupt → scope leave (always) |
| `??=` (short-circuit) | expression | access → resolve → NO RHS, NO update (short-circuited) |
| `console.log(x)` | expression (call) | scope lookup (console) → proto check (.log) → call → resolve(undefined) → **DEV CONSOLE: line appended** |
| `prompt(msg)` | expression (call) | scope lookup (prompt) → call → **USER INTERFACE: dialog shown, execution pauses, user responds** → resolve(string\|null) |

---

## JEJ language scope

**In scope**: primitives (including `bigint`), `let`/`const`, all operators in
reference.md, block scope, conditionals, all loop types, break/continue,
template literals, optional chaining, `in` operator, property access on
built-ins, built-in function calls, regex literals, `Boolean()`,
`String.fromCharCode`/`fromCodePoint`,
`Number.isNaN`/`isFinite`/`isInteger`, `Number.prototype` methods (`toString`,
`toFixed`, `toPrecision`, `toExponential`, `toLocaleString`), `Date.now()`,
`Date.parse()`, `new Date()` + all Date instance methods, all console methods.
Note: `new Date()` is the sole `new` exception — Date methods return primitives
(numbers or strings), require no mutation, and serve as a gentle introduction to
reference types without requiring full object/class coverage.

**Out of scope**: user-defined functions, arrays, objects as literals, classes,
`var`, `try`/`catch`, async/await, destructuring, spread/rest. Exception:
`new Date()` is permitted despite using `new` — Date instance methods return
only primitives, involve no mutation, and provide a controlled introduction to
reference types.

**Easter eggs**: `void` operator, comma/sequence operator, `with` statement.
