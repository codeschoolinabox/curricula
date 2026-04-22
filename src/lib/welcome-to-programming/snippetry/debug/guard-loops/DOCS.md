# Guard Loops — Architecture & Decisions

## Why `recast`?

We need to parse learner code into an AST and print it back. `recast` preserves
the original source formatting (whitespace, comments) when printing — unlike raw
code generators like `astring` or `escodegen` which reformat everything. This
matters because learners should recognise their own code after transformation.

The tradeoff: `recast` works by mutating the original AST in place. This is an
intentional exception to the project's pure-functional convention — creating new
nodes would lose the formatting metadata that `recast` attaches to the
originals.

## Why `estree-walker`?

Lightweight, dependency-free AST walker that works with any ESTree-compatible
AST. It provides `enter`/`leave` hooks for pre-order and post-order traversal.

We use the `enter` hook (pre-order) to collect `while` loops in reading order —
outer loops get lower numbers than inner loops, which is more intuitive for
learners.

## Why Only `while`?

Just Enough JavaScript (JeJ) has two loop types: `while` and `for-of`. Only
`while` loops can produce infinite loops — `for-of` iterates finite collections
and always terminates. Other loop constructs (`for`, `do-while`, `for-in`) are
outside the JeJ language level and are rejected by the language level validator
before code reaches the guard-loops transform.

## Two-Pass Architecture

The transformation uses two passes instead of a single walker callback:

1. **Collect** — walk the AST with `enter`, recording each `WhileStatement` and
   its parent. Pre-order traversal gives reading order (outer before inner).
2. **Apply** — iterate collected loops in reverse source order, inserting guards.
   Reverse iteration keeps `parent.body.splice()` indices stable.

## AST Mutation Pattern

The apply pass mutates nodes in place:

- `.body.body.unshift(...)` — inserts check statements at the top of the loop
  body
- `parent.body.splice(...)` — inserts the counter variable declaration before
  the loop statement

This is unavoidable with `recast`'s design and is documented with WHY comments
in the source.
