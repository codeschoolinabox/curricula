# Pointcut Functions

One function per Aran flexible hook category. Each inspects an AranLang node
and returns either `null` (skip) or `Json[]` point data (intercept).

## Files

- `expression-pointcut.ts` — PrimitiveExpression (literals), ReadExpression
  (binding reads), ConditionalExpression (short-circuiting), test position
  detection (if/while conditions)
- `apply-pointcut.ts` — ALL ApplyExpression nodes (single cut). Operators,
  property access, function calls, and templates all route through here.
- `effect-pointcut.ts` — WriteEffect (assignments), ConditionalEffect (logical
  compound assignments ??=/||=/&&=)
- `block-pointcut.ts` — ALL blocks (always matches — scope tracking is
  always needed). Returns parent type, parent kind, and tag.
- `statement-pointcut.ts` — BreakStatement (jumps), WhileStatement (iterations,
  loop guards), IfStatement (branches)

## How pointcut functions work

Each receives `(node, parent, root)`:
- `node` — the AranLang AST node being visited
- `parent` — the immediate AranLang parent node (NOT ESTree parent)
- `root` — the complete instrumented program

Returning `null` or `undefined` means "don't intercept this node." Returning a
`Json[]` array means "intercept, and pass this data to the advice function."

The config object is closed over at aspect creation time, so pointcut functions
can check config without receiving it as a parameter.
