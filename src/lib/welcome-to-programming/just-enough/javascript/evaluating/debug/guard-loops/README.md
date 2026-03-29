# Guard Loops

Prevents infinite loops in learner-submitted JavaScript by injecting iteration
counters into `while` loops via AST transformation.

## What It Does

Given a string of JavaScript (or a parsed AST), `guardLoops` walks the tree,
finds `while` loops, and injects:

1. A counter variable before each loop (`let loop1 = 0;`)
2. A check at the top of each loop body (`if (++loop1 > max) throw ...`)

Loops are numbered in reading order (outer before inner). If a loop exceeds the
configured iteration limit, a `RangeError` is thrown at runtime — preventing browser
freezes in educational contexts.

`for-of` loops are not guarded — they iterate finite collections and cannot
produce infinite loops.

## API

```ts
function guardLoops(code: string | Node, maxIterations: number): string | Node;
```

Input and output types mirror each other: pass a string, get a string back; pass
an AST node, get a modified AST node back.

## Files

| File             | Purpose                         |
| ---------------- | ------------------------------- |
| `guard-loops.ts` | Main transformation function    |
| `types.ts`       | Type definitions for the module |
| `tests/`         | Unit tests                      |
