# just-enough-javascript — Architecture & Decisions

## Why this library exists

Beginners learning to read code before writing it need a constrained JavaScript
subset — small enough to trace mentally, strict enough to prevent confusing
patterns. "Just Enough JavaScript" (JeJ) is that subset: an allowlist-based
language level that limits what syntax, operators, and globals learners can use.

This library enforces that subset (validation), provides sandboxed execution
environments (run, debug, trace), and offers tooling functions (format, validate)
so learners can safely experiment within bounds.

## Architecture

### Execution pipeline

All execution modes run the same pipeline before evaluating code:

```text
code (string)
  → parse              ← is it syntactically valid?
  → validate (JeJ)     ← does it use things it shouldn't?
  → format check       ← is it properly formatted?
  → execute            ← what happens when we run it?
  → frozen result      ← deep-frozen before returning
```

Each API function uses the pipeline up to a different point. Tooling functions
(`format`, `validate`) help learners GET to valid formatted JeJ — they don't
block. Execution functions (`run`, `trace`, `debug`) require valid formatted
JeJ — they gate.

### Module layout

```text
just-enough-javascript/
  index.ts          ← Package entry: default export + named exports
  api/              ← Public API (wrappers + code object factory)
  evaluating/       ← Raw execution engines
    run/            ← Web Worker + SAB for synchronous I/O
    debug/          ← iframe + debugger statements
    trace/          ← Aran AST instrumentation in Worker
    shared/         ← Execution type, SAB protocol, guard-loops
  validating/       ← AST-based validation pipeline
  formatting/       ← Recast-based formatting and format checking
  reference.md      ← Learner-facing language cheat sheet
```

### Dependency DAG

```text
index.ts
  → api/*

api/*
  → validating/        (validation preamble)
  → formatting/        (format check + formatting)
  → evaluating/*/      (raw execution)

evaluating/*/
  → evaluating/shared/ (Execution type, SAB protocol)

validating/
  (no deps on evaluating/ or formatting/)

formatting/
  (no deps on validating/ or evaluating/)
```

## Key design decisions

### Why three separate execution engines

Each serves a different pedagogical purpose with a different isolation model:

- **run** — Web Worker. Trapped `console.log`, `alert`, `confirm`, `prompt`.
  Returns `RunEvent` stream. Synchronous I/O via SharedArrayBuffer + Atomics.
  SAB pause between events for correct I/O ordering.

- **debug** — iframe with module `<script>` tags. Injects `debugger` statements
  so learners can step through in DevTools. Cannot use a Worker because
  `debugger` only pauses when DevTools is open on the main thread. No SAB pause.

- **trace** — Web Worker with Aran AST instrumentation. Captures every
  expression evaluation, variable access, and control-flow step. Returns
  `AranStep` stream. SAB pause for step-by-step visualization.

There is no unified "execute" function — each engine returns fundamentally
different event types.

### Why AsyncGenerator for all engines

All engines return `Execution<TEvent, TResult>` — an async generator that is
also `PromiseLike`. This gives consumers two modes:

- **Step-through**: `for await (const event of execution)` — SAB pause keeps
  the Worker frozen between events
- **Batch**: `await execution` — PromiseLike drains the generator, resolves to
  the full result (backward compatible with the old Promise API)

### Why format is a pipeline gate

Formatting is required before execution. Same pedagogical philosophy as JeJ
language constraints — remove choices to focus learning. All code from all
learners looks identical in structure.

### Why parentheses are explicitly tracked

Acorn parses with `preserveParens: true`, emitting `ParenthesizedExpression`
nodes in the AST. This provides anchor nodes for trace visualization — when the
Aran tracer emits parenthesis enter/leave events, the UI can highlight the
corresponding ESTree node.

### Why property assignment is blocked

JeJ has no object literals, no arrays, no constructors — zero valid use case for
`obj.prop = value`. Allowing it risks learners overwriting built-in methods
(`console.log = 5`). Assignment is restricted to variable names only.

### Why module mode everywhere

All execution uses ES module mode (`type: 'module'` for scripts, module workers).
This gives implicit strict mode without requiring `'use strict'` or adding an
extra line that would shift line numbers.

### Why console.log and console.assert are traps

Learners are not expected to look in the browser console unless debugging.
Everything is surfaced in a friendly UI. `console.log` and `console.assert` are
intercepted and recorded as events in the log. Console forwarding is also kept
for authenticity — learner code runs in a real browser environment.

### Why language level is an upper bound

The JeJ language level defines the maximum syntax available to learners.
Features beyond JeJ cannot be added. JeJ is the ceiling, not the floor.

### No REPL mode

Code is treated as instructions in a simple stateless program — not an
interactive session. Each execution is a fresh run with no accumulated state.

### Deep-freeze all results

Per AGENTS.md convention: this codebase is consumed by LLMs that cannot be
trusted not to mutate returned data. All result objects are deep-frozen in place
before returning.

### Error-as-data

Execution functions never throw. Errors are captured and returned in the result
object's `error` field, discriminated by `kind`. This gives consumers a single
code path for all outcomes.
