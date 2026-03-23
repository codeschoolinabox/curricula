# just-enough-javascript — Architecture & Decisions

## Why this library exists

Beginners learning to read code before writing it need a constrained JavaScript
subset — small enough to trace mentally, strict enough to prevent confusing
patterns. "Just Enough JavaScript" (JeJ) is that subset: an allowlist-based
language level that limits what syntax, operators, and globals learners can use.

This library enforces that subset (validation) and provides sandboxed execution
environments (run, debug, trace) so learners can safely experiment within bounds.

## Architecture

### Validate-first pipeline

All execution modes follow the same pattern:

```text
code (string)
  → validate(code)           ← language-level check (shared preamble)
  → [if !ok: return early]
  → execute(code, ...)       ← mode-specific engine
  → frozen result            ← deep-frozen before returning
```

`validate()` is both the public validation API and the internal preamble. This
avoids duplicating validation logic — each wrapper calls `validate()` first and
early-returns the validation result if `!result.ok`.

### Module layout

```text
just-enough-javascript/
  index.ts                ← Package entry: re-exports validate, run, debug, trace
  api/                    ← Unified wrappers (the public API)
  evaluating/             ← Raw execution engines
    run/                  ← Web Worker + SAB for synchronous I/O
    debug/                ← iframe + debugger statements
    trace/                ← Aran AST instrumentation in Worker
    shared/               ← Types and schemas shared across engines
  verify-language-level/  ← AST-based validation pipeline
  reference.md            ← Learner-facing language cheat sheet
```

### Dependency DAG

```text
index.ts
  → api/validate, api/run, api/debug, api/trace

api/*
  → verify-language-level/ (validation preamble)
  → evaluating/*/          (raw execution)

evaluating/*/
  → evaluating/shared/     (common types)

verify-language-level/
  (no internal deps on evaluating/)
```

## Key design decisions

### Why three separate execution engines

Each serves a different pedagogical purpose with a different isolation model:

- **run** — Web Worker. Trapped `console.log`, `alert`, `confirm`, `prompt`.
  Returns an event log. Synchronous I/O via SharedArrayBuffer + Atomics (worker
  blocks while main thread shows native dialogs). Timeout via
  `worker.terminate()`.

- **debug** — iframe with module `<script>` tags. Injects `debugger` statements
  so learners can step through in DevTools. Cannot use a Worker because `debugger`
  only pauses when DevTools is open on the main thread. Loop guards are AST
  transforms to prevent infinite loops from freezing the page.

- **trace** — Web Worker with Aran AST instrumentation. Captures every expression
  evaluation, variable access, and control-flow step. Returns structured
  `AranStep[]`. Uses a Vite-bundled module worker (not blob URL) because the Aran
  tracer is ~500KB of ESM code.

There is no unified "execute" function — each engine returns fundamentally
different output types (`RunEvent[]` vs `AranStep[]` vs nothing).

### Why module mode everywhere

All execution uses ES module mode (`type: 'module'` for scripts, module workers).
This gives implicit strict mode without requiring `'use strict'` or adding an
extra line that would shift line numbers. It also prepares learners for modern
JavaScript conventions.

### Why console.log and console.assert are traps

Learners are not expected to look in the browser console unless debugging.
Everything is surfaced in a friendly UI. `console.log` and `console.assert` are
intercepted and recorded as events in the log, not sent to the real console.

### Why language level is an upper bound

The JeJ language level defines the maximum syntax available to learners. The
`allow`/`block` config in execution wrappers can narrow it further (e.g. hiding
`for-of` loops early in the course), but features beyond JeJ cannot be added.
JeJ is the ceiling, not the floor.

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
