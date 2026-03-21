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
AST. It provides `enter`/`leave` hooks and a `this.skip()` mechanism to prune
subtrees.

The `this.skip()` API is the only way to prevent the walker from descending into
generated nodes. This requires using `this` inside callbacks — an intentional
exception to the project's "no `this`" convention, since `estree-walker`
provides no alternative API.

## Why Only `while` and `for-of`?

Just Enough JavaScript (JeJ) restricts the language to these two loop types,
always with block bodies (`{ }`). Other loop constructs (`for`, `do-while`,
`for-in`) are outside the JeJ language level and are rejected by the language
level validator before code reaches the guard-loops transform.

## AST Mutation Pattern

The walker's `leave` callback mutates nodes in place:

- `.body.body.unshift(...)` — inserts check statements at the top of the loop
  body
- `parent.body.splice(...)` — inserts the counter variable declaration before
  the loop statement

This is unavoidable with `recast`'s design and is documented with WHY comments
in the source.
