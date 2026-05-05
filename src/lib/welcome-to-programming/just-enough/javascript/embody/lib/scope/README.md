# scope

Shared scope analysis for JeJ programs. Builds a data structure that represents
every variable declaration, every read reference, and every write reference in a
program, organized by lexical scope.

## Purpose

**Shared infrastructure:** This module is consumed by both `validating/`
(undeclared global detection) and `micro-decisions/` (variable usage analysis).
It replaces the scope tracking previously embedded in
`validating/check-undeclared-globals.ts` with a richer, reusable analysis.

The scope tracker is a pure function: AST in, frozen scope structure out. No
side effects, no mutation, no state.

## Architecture

```text
AST (acorn Node with locations)
  -> buildScope(ast)
  -> ScopeAnalysis {
       root: ScopeInfo (tree of nested scopes),
       allDeclarations: DeclarationInfo[] (flat convenience view)
     }
```

### Scope boundaries

JeJ has a simplified scope model (no functions, classes, or catch clauses):

- **Program** — top-level scope
- **BlockStatement** — `if`/`else`/`while` bodies
- **ForOfStatement** — iterator variable + loop body

Each scope tracks its own declarations and has a parent pointer for upward name
resolution.

### What the tracker records

For each `let`/`const` declaration:

- The declaration kind (`let` or `const`)
- The `VariableDeclarator` AST node and its init expression
- How many times the variable is **read** (Identifier references resolved
  through the scope chain)
- How many times the variable is **written** after declaration (assignment
  targets)
- The scope depth (0 = program level)

### What the tracker does NOT do

- **No runtime analysis** — this is static AST analysis only
- **No TDZ checking** — JeJ's scope model doesn't require it
- **No error reporting** — it builds the data structure, consumers decide what
  to do with it

## Structure

| File              | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `types.ts`        | Domain types: ScopeInfo, DeclarationInfo, etc.   |
| `build-scope.ts`  | Pure function: AST -> ScopeAnalysis              |
| `tests/`          | Unit tests                                       |

## API

### `buildScope`

```ts
function buildScope(ast: Node): ScopeAnalysis;
```

Takes a parsed AST (acorn Node with `locations: true`). Returns a frozen
`ScopeAnalysis` containing the full scope tree and a flat list of all
declarations with their reference counts.

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [../validating/README.md](../validating/README.md) — validation module
  (consumer)
- [../micro-decisions/README.md](../micro-decisions/README.md) —
  micro-decisions module (consumer)
