# guard-loops

Loop-guard injection for the run engine. Caps learner-code iteration counts on
`while`, `for`, `do-while`, and `for-of` loops, throwing `RangeError` when a
loop exceeds its limit.

`run` is the sole consumer — the module lives here (not in `shared/`) to
reflect that.

## What it does

Given a source string and a `maxIterations` limit, rewrites the source to
inject an iteration guard into the body of every loop. The rewrite is a pure
string transformation driven by AST positions — no characters in the original
source are moved to a different `{line, column}`.

```ts
guardLoops(code: string, maxIterations: number): GuardResult

type GuardResult = {
  readonly code: string;       // transformed source
  readonly loopCount: number;  // number of loops guarded (IDs run 1..loopCount)
};
```

## Supported loop types

| AST type           | Guarded | Reset insertion point                         |
| ------------------ | ------- | --------------------------------------------- |
| `WhileStatement`   | yes     | after the body's closing `}`                  |
| `ForStatement`     | yes     | after the body's closing `}`                  |
| `DoWhileStatement` | yes     | after the full statement's parser-end         |
| `ForOfStatement`   | yes     | after the body's closing `}`                  |
| `ForInStatement`   | **no**  | not in the JeJ surface — deliberately skipped |

### Why for-of is guarded, for-in is not

A learner can construct an infinite iterator (generator functions are the
canonical case: `function* g() { let i = 0; while (true) yield i++; }`),
and a `for-of` over such an iterator loops forever. Defensive coverage is
the safer default.

`for-in` is excluded because the JeJ (Just-Enough-JavaScript) curriculum
surface omits object-property iteration entirely. The upstream validator
at `lib/validating/just-enough-js.ts` does not include `ForInStatement` in
its node allow-list; a learner who attempts one is rejected before this
module is invoked. If a `for-in` somehow reaches here, it passes through
unguarded — the same default behavior applied to any non-covered AST node.

## Template

Body-injection, uniform across the four covered loop types. The module
emits statements that reference `loopN` identifiers by name; declaring
those identifiers is the caller's responsibility (see § Counter
declaration).

Example (`maxIterations = 100`, one `while` loop):

```js
// Original source:
while (x < 10) {
    x++;
}
console.log(x);

// After guardLoops(..., 100) → code:
while (x < 10) { if (++loop1 > 100) throw new RangeError("Loop 1 exceeded 100 iterations.");
    x++;
} loop1 = 0;
console.log(x);
```

Line 1 stays line 1. Line 3 stays line 3. Columns are unshifted on every
line. The guard string is glued to the character immediately after `{`;
the reset string is glued to the character immediately after `}`.

### Do-while specifics

For `do-while`, the reset is glued to the **parser-reported end of the
full statement**, not the body's closing `}`. The end position is usually
the character after the trailing `;` of `while (cond);`:

```js
// Original:
do {
    x++;
} while (x < 10);

// After:
do { if (++loop1 > 100) throw new RangeError("Loop 1 exceeded 100 iterations.");
    x++;
} while (x < 10);; loop1 = 0;
```

If the learner omits the trailing `;` and relies on ASI (Automatic
Semicolon Insertion), the end position falls after `)` instead. The reset
text for `do-while` begins with `;` so it cannot fuse with the preceding
`while (cond)` as its body (`while (cond) loop1 = 0;` would otherwise parse
as an infinite loop with `loop1 = 0;` as the body). The `;` adds an
empty-statement effect that is harmless in both the explicit-`;` and
ASI-relied cases.

### Input precondition

Upstream, `run.ts` format-gates source through `checkFormat` before
invoking this module. The format gate runs through recast's `prettyPrint`,
which emits explicit semicolons after `while (cond)` tails. In practice
all production inputs to this module have explicit `;`; the ASI case is a
defensive safety net, not a regular path.

## Loop numbering

Loop IDs are assigned in **source-text reading order** — top-to-bottom,
left-to-right. This matches how the learner reads their own code, so when
an error says `Loop 3 exceeded 100 iterations`, the third loop they can
see in their source is the one that blew up.

```js
while (x < 10) {        // Loop 1 — first `while` in the source
    while (y < 10) {    // Loop 2 — nested inside Loop 1, appears after
        y++;            //          Loop 1's opening brace
    }
    x++;
}

for (let i = 0; i < 5; i++) {   // Loop 3 — appears after Loop 1 closes
    do {                        // Loop 4 — nested inside Loop 3
        z++;
    } while (z < 10);
}
```

Nested inner loops always get higher IDs than their outer loops (a
learner writes the outer keyword first, then moves inside the braces to
write the inner). Sibling loops written one after another get consecutive
IDs in the order they appear.

The numbering is stable for a given source: the same code always produces
the same IDs. Editing the source adds, removes, or renumbers IDs the way a
human reader would expect — insert a loop above an existing Loop 2, and
the old Loop 2 becomes Loop 3.

### Dependency on the JeJ language surface

This guarantee holds because the JeJ validator excludes
`FunctionDeclaration`, `FunctionExpression`, `ArrowFunctionExpression`,
and `ClassDeclaration` from its node allow-list (see
`lib/validating/just-enough-js.ts`). Without user-defined functions, a
loop cannot appear inside an expression that precedes a sibling loop
(e.g., a default argument value, an IIFE), so pre-order AST traversal and
reading order coincide. If JeJ grows user-defined functions in the
future, this equivalence must be re-verified before the reading-order
guarantee is sustained.

## Glossary

- **Loop guard** — the mechanism that caps an iteration count on a loop,
  throwing `RangeError` when exceeded.
- **Body-injection** — the technique: insert a guard statement at the top
  of the loop body + a counter-reset statement after the loop's closing
  brace (or after the trailing `while (cond);` for `do-while`).
- **Counter** — a per-loop numeric variable `loopN` declared as a
  Worker-setup global (`var loop1 = 0, ..., loopN = 0;` emitted by
  `create-worker-script.ts`), incremented on each loop iteration.
- **Guard limit** — `maxIterations`, the numeric threshold passed to the
  module. `Infinity` means "no guard" and is filtered by the caller
  before invoking `guardLoops`. Any finite value — including `0` and
  negatives — injects guards; see § Task B contract below.
- **Counter allocation** — see § Loop numbering.
- **Loop type** — one of `WhileStatement` | `ForStatement` |
  `DoWhileStatement` | `ForOfStatement`. `ForInStatement` is deliberately
  excluded (see § Supported loop types).
- **Instrumentation** — the transformation from learner source to guarded
  source.
- **Zero-line-shift** — the invariant that
  `guardedSource.split('\n').length === source.split('\n').length` for
  any input.
- **Zero-column-shift** — the invariant that every character in the
  original source retains its `{line, column}` position in the
  transformed source.

## Task B contract

Finite `maxIterations ≤ 0` values are valid and inject guards that throw
on the first iteration:

| `maxIterations` | Body executions before throw | Reason                                |
| --------------- | ---------------------------- | ------------------------------------- |
| `-1`            | 0                            | `++loop1 > -1` is true immediately    |
| `0`             | 0                            | `++loop1 > 0` is true immediately     |
| `1`             | 1                            | `++loop1 > 1` is true on second entry |
| `3`             | 3                            | `++loop1 > 3` is true on fourth entry |
| `Infinity`      | unguarded (caller filters)   | caller does not invoke `guardLoops`   |

Preservation of this contract across all four supported loop types is a
regression test gate (see `tests/guard-loops.test.ts` — Task B ZOMBIES
edge cases).

## Counter declaration

`guardLoops` returns `loopCount` but does NOT declare the counters. The
Worker script in `create-worker-script.ts` consumes `loopCount` and
emits matching declarations as Worker-setup globals:

```js
var loop1 = 0, loop2 = 0, loop3 = 0;  // for loopCount === 3
```

These live above the trap function definitions in the Worker script
string. Explicit `= 0` initializers are required — a bare `var loop1;`
would leave `loop1` as `undefined`, and `++undefined` is `NaN`, breaking
the guard check.

Nested and sequential loops correctly reuse counters: the `loopN = 0;`
reset string injected after each loop's closing brace restores the
counter to zero so that a subsequent entry to the same loop (via an
outer iteration) or a sequential loop later in the source starts fresh.

### ID range is dense

`loopCount === N` means the emitted code references exactly
`loop1, loop2, …, loopN` — no gaps. The Worker's one-shot declaration
depends on this; non-contiguous IDs would leave referenced counters
undefined.

## Consumer contract

Callers must declare `loop1..loopN` as numeric-initialized identifiers
reachable at the transformed code's call site. Under strict mode
(`"use strict"`, which the Worker prepends by default), executing the
transformed code without declarations throws `ReferenceError: loopN is
not defined` on the first guarded iteration — deterministic failure, not
undefined behavior.

Test harnesses running transformed code outside the Worker (via
`new Function` or `eval`) must provide matching declarations. See
`tests/guard-loops.test.ts` for the current convention: tests pass
`loop1, …, loopN` as `new Function` parameters with initial value `0`.

## Navigation

- [types.ts](./types.ts) — `GuardResult`, `LoopType`
- [tests/](./tests/) — unit tests (ZOMBIES + Task B edge cases per loop type)
- [../README.md](../README.md) — parent: run engine
- [DOCS.md](./DOCS.md) — architecture: execution phases and structural
  constraints
