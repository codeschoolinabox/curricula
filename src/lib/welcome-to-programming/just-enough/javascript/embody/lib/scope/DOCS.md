# scope — Architecture & Decisions

## Why a shared scope module

The previous scope analysis lived inside `validating/check-undeclared-globals.ts`
and tracked only declaration existence for undeclared-global detection. The
micro-decisions module needs richer data: read counts, write counts, and init
expressions for each variable.

Rather than build a second independent scope walker, this module extracts scope
analysis into a shared dependency. Both consumers get a single source of truth
about variable usage.

## Why not extend the existing walker

The existing walker in `check-undeclared-globals.ts` was tightly coupled to its
specific concern (flagging known globals not in the allowlist). Its data model
tracked declarations but not references. Extending it would have meant adding
reference tracking to a module whose name and purpose don't suggest it — making
it harder for contributors to find and understand.

A dedicated scope module with a clear name, clear types, and clear purpose is
easier to maintain than a validation helper that quietly also does reference
counting.

## Scope model simplifications

JeJ has no functions, classes, catch clauses, or `var` declarations. This means:

- **No hoisting** — declarations are visible from their position forward, never
  earlier
- **No function scope** — only block scope exists
- **No closures** — without functions, there are no captured variables
- **No TDZ hazards** — `let`/`const` in JeJ are always initialized at
  declaration (or immediately assigned in the same statement)

These simplifications make the scope walker straightforward: enter a scope
boundary, track declarations, resolve references through parent pointers.

## Reference resolution strategy

When an `Identifier` appears in a read or write position, the tracker walks up
the scope chain from the current scope to the root, looking for a matching
declaration. If found, it increments the appropriate counter on the
`DeclarationInfo`.

Identifiers that don't resolve to any declaration are ignored by the scope
tracker — they might be globals (allowed or otherwise). The validation module
handles that concern separately.

## What counts as a read vs write

- **Read**: Any `Identifier` in an expression context that resolves to a
  declaration. Excludes declaration sites themselves and property names in
  non-computed member expressions.
- **Write**: An `Identifier` as the left-hand side of an `AssignmentExpression`
  that resolves to a declaration. The initial value in a `VariableDeclarator`
  is NOT counted as a write — it's tracked separately as the `initNode`.

This distinction matters for micro-decisions: a `let` with zero writes after
declaration could be `const`.

## Freezing

The returned `ScopeAnalysis` and all nested objects are deeply frozen. Consumers
cannot accidentally mutate scope data. This follows the codebase convention for
all returned data structures.
