# just-enough-javascript

A curated JavaScript language level + static and dynamic tooling for
introductory programming education. JEJ programs are the learning vehicle for
the Welcome to Programming curriculum.

## Why a language level?

JEJ is _just enough_ JavaScript to write imperative programs that interact with
users through text and numbers. Every program fits on a single printed page —
the entire program is visible on screen at once, traceable step-by-step.

The language level is designed around a specific balance: **meaningful
computational exploration** within a **manageable notional machine** — which is
why we've defined the NM explicitly in this directory (see
[notional-machine.md](./notional-machine.md)). The NM is the learning objective.

### Few options, many possibilities

JEJ programs have a consistent shape: read input → perform computations →
produce output. Within this shape:

**The structural tools** for writing programs are: variables (`let`, `const`),
conditionals, loops (while, do-while, for, for-of), break, continue, and block
scope.

**The computational toolkits** that widen what learners can explore are: all
String methods, all Math methods and constants, regular expressions, number
helpers, type conversion (`Number()`, `String()`, `Boolean()`), character
encoding (`String.fromCharCode`, `String.fromCodePoint`), timestamps
(`Date.now()`), and date objects (`new Date()` — the sole `new` exception in
JEJ, whose methods all return primitives).

More operators and methods expand what learners can compute — string
manipulation, math, pattern matching, bitwise logic, comparison — without
complicating the notional machine. They're all expressions that resolve to
values through the same mechanisms.

### Three audiences of code

Every JEJ program reaches all three audiences at once:

- **Developers** read your code — through comments, variable names, and
  structure (`console.log` and `console.assert` help you communicate what's
  happening)
- **The computer** executes your code — you can trace exactly how the JS engine
  interprets each expression, with every piece of the program visually present
  on screen at once
- **Users** interact with your running program — through `prompt`, `confirm`,
  and `alert`

### What learners can do with JEJ

- Read code as communication between three audiences
- Trace exactly how the JS engine interprets each line
- Explore creativity within the shape of imperative programs
- Explore style and readability tradeoffs to find your own voice
- Discuss a program's _behavior_, _strategy_, and _implementation_
- Explore different approaches to problem solving
- Explore concepts through code — text processing, geometry, pattern matching,
  randomness, number crunching — within interactive I/O programs
- Prepare for functions, data structures, and algorithms
- Build the foundations you need for whatever comes next

### What's excluded and why

Each excluded feature would add a new notional machine component that isn't
needed for introductory programming:

| Excluded feature               | NM component it would add                                                  |
| ------------------------------ | -------------------------------------------------------------------------- |
| User-defined functions         | Call stack depth, closures, hoisting of function declarations              |
| Arrays and objects as literals | Heap allocation, reference vs value identity, mutation through references  |
| Classes                        | Prototype chains on user objects, constructor semantics, `this` binding    |
| `try`/`catch`                  | Exception propagation model, control flow branching at error sites         |
| `async`/`await`                | Event loop, microtask queue, Promise state machine                         |
| `var`                          | Function-scoped hoisting (confusing alongside `let`/`const` block scoping) |
| Destructuring, spread/rest     | Pattern matching on data structures (needs arrays/objects)                 |

The result: the notional machine has a fixed set of components that learners can
master, while the computational toolkits provide enough depth for genuine
exploration and creativity.

## Language level documentation

| Document                                           | Purpose                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| [reference.md](./reference.md)                     | Learner-facing cheat sheet — every allowed syntax with examples |
| [notional-machine.md](./notional-machine.md)       | The conceptual execution model JEJ programs run on              |
| [tracer.md](./tracer.md)                           | How the tracer captures the NM as data (config, result shape)   |
| [tracer.walkthroughs.md](./tracer.walkthroughs.md) | Event sequences for every JEJ construct                         |
| [tracer.architecture.md](./tracer.architecture.md) | Implementation layers, vocabulary, test taxonomy                |
| [open-questions.md](./open-questions.md)           | Questions for the Aran creator about capabilities and design    |

## Tooling (under active development)

Validates learner JavaScript against the language level and executes it in
sandboxed environments. Provides validation, formatting, parsing, and execution
modes — all through a unified API with a code object factory as the default
export.

> **Note**: the API surface and available tooling are under active development.
> The exports and function signatures below will change as the tracer refactor
> and new execution modes are implemented.

## Structure

| Path                      | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `lib/`                    | Public modules and internal libraries (see sub-modules below)       |
| `lib/parse/`              | `parse(code)` public entry + parse primitives (acorn wrapper, AST walker) |
| `lib/validating/`         | `validate(code)` public entry + AST-based validation pipeline        |
| `lib/formatting/`         | `format(code)` and `checkFormat(code)` — recast-based               |
| `lib/evaluating/`         | Execution engines — trace (Aran), run (Worker)                      |
| `lib/editing/`            | Editor integration (completions, hints)                             |
| `lib/completing/`         | Code completion                                                     |
| `lib/error-interpreting/` | Learner-friendly error message translation                          |
| `lib/socratizing/`        | Socratic code analysis (micro-decisions)                            |
| `lib/scope/`              | Scope analysis utilities                                            |
| `lib/jej-documentation/`  | JEJ documentation generation for editor support                     |
| `study-lenses/`           | Study lenses system (orchestrator, transforms, lenses, recommender) |
| `components/`             | UI components (V2 lens components, migration source)                |
| `index.ts`                | Package entry — re-exports public API functions and types           |
| `api/`                    | Legacy directory; trace/run/debug-related types remain here pending parallel migration. The validate/parse/format/default migration is complete. |

## Study Lenses: research translation platform

The study-lenses system is a research translation platform (TCER Phase 4) built
on top of JEJ's tooling. The tracer captures the notional machine as data; the
study-lenses system turns that data — and any JEJ snippet — into interactive
learning exercises. Each lens embodies a computing education research-backed
pedagogical intervention: blanks (fill-in-the-blank), parsons (line ordering),
trace tables (predict-then-compare), and more.

The architecture separates transforms (code-to-code, e.g., format or
loop-guard) from lenses (code-to-component, e.g., editor or blanks) and
composes them into pipelines. A recommender analyzes each snippet against the
JEJ notional machine and suggests relevant exercises organized in a 3D Block
Model grid (comprehension level x scope x NM components). This enables rapid
iteration on exercise design — researchers prototype new interventions by
composing existing lenses, curriculum authors embed them in code fences, and
learners choose their own path through the recommendations.

See [`study-lenses/README.md`](./study-lenses/README.md) for the full
architecture, module contracts, and directory layout.

## Public API (current snapshot — will change)

```ts
import {
	run,
	trace,
	debug,
	validate,
	parse,
	isJej,
	format,
	checkFormat,
} from './index.js';
```

> The package no longer has a default export. The previous `createJejProgram`
> code-object factory was removed as YAGNI bloat — superseded by the
> `<StudyLenses>` container component.

### Tooling functions

| Function            | Returns         | What it does                                                 |
| ------------------- | --------------- | ------------------------------------------------------------ |
| `format(code)`      | `string`        | Formats source code to JEJ conventions                       |
| `checkFormat(code)` | `{ formatted }` | Check if code matches JEJ conventions                        |
| `validate(code)`    | `BaseResult`    | Returns an array with any JEJ language constraint violations |
| `isJej(code)`       | `boolean`       | Convenience: is this valid JeJ?                              |

### Execution functions

| Function              | Returns                              | Engine                             |
| --------------------- | ------------------------------------ | ---------------------------------- |
| `run(code, config)`   | `Execution<InterceptEvent, InterceptResult>`     | Web Worker                         |
| `trace(code, config)` | `Execution<AranStep, TraceResult>`   | Web Worker w/ Aran instrumentation |
| `debug(code, config)` | `Execution<DebugEvent, DebugResult>` | iframe                             |

## Result Shape

All execution results share a common base:

```ts
type Result<TEvent> = {
	readonly ok: boolean;
	readonly error?: ResultError;
	readonly rejections?: readonly Violation[];
	readonly logs?: readonly TEvent[];
};
```

## Navigation

- [lib/parse/README.md](./lib/parse/README.md) — `parse(code)` + parse primitives
- [lib/validating/README.md](./lib/validating/README.md) — `validate(code)` + validation pipeline
- [lib/formatting/README.md](./lib/formatting/README.md) — `format(code)` / `checkFormat(code)`
- [lib/evaluating/README.md](./lib/evaluating/README.md) — execution engines
- [study-lenses/README.md](./study-lenses/README.md) — study lenses system
- [DOCS.md](./DOCS.md) — architecture decisions and design rationale
- [reference.md](./reference.md) — learner-facing language reference
