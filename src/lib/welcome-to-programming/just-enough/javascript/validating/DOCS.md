# validating — Architecture & Decisions

## Why this module exists

Validates JavaScript programs against configurable language level subsets for
education. Replaces the previous runtime enforcement approach (monkey-patching
`globalThis` to block disallowed methods/globals at runtime). Runtime
enforcement needed ~40 safety exemptions because blocking things like
`Object.prototype.toString` breaks JS engine internals (implicit coercion,
template literals, `console.log`). Static AST validation eliminates all safety
exemptions — the AST only contains student-written code, engine internals are
invisible.

## Why extracted from verify-language-level

The original `verify-language-level/` module mixed two concerns:

1. **Rejections** — disallowed syntax (validation proper)
2. **Warnings** — beginner mistakes (hinting)

These serve different consumers at different pipeline stages. Validation gates
execution (must pass to run). Warnings are informational (never block execution).
Splitting them into `validating/` and `hinting/` makes the dependency DAG
cleaner and lets each module evolve independently.

The code is the same — this is a boundary change, not a rewrite.

## Architecture

### Pipeline

```text
source string
  → parseProgram(source, 'module')         — acorn parse to ESTree AST
  → collectViolations(ast, nodes)          — recursive walk, allowlist lookup
  → checkUndeclaredGlobals(ast, config)    — scope analysis pass
  → ValidationReport { isValid, violations, source, levelName }
```

Note: `collectWarnings` is no longer called here — it moved to `hinting/`.

### Scope analysis model

JeJ has no functions, no catch clauses, no classes, no `with`. Only
`let`/`const` in blocks, for-of heads, and `Program`-level. This dramatically
simplifies scope analysis compared to general JavaScript.

**Scope boundaries:** `Program`, `BlockStatement`, `ForOfStatement`

**Declaration forms tracked:** `let`/`const` in `VariableDeclaration`, for-of
`left` declaration.

**Positions skipped (not references):**

- `VariableDeclarator.id` — declaration site, not a reference
- `MemberExpression.property` when `computed: false` — property name lookup
- `ForOfStatement.left` variable — declaration site

**Out of scope:** Temporal dead zone (TDZ), alias tracking, runtime semantics,
fix suggestions.

## Key decisions

1. **Static replaces runtime entirely.** Safety exemptions are unnecessary when
   analyzing student source code only. Better error messages, source locations
   on every violation, simpler architecture.

2. **Single allowlist object.** The `LanguageLevel.nodes` record maps ESTree
   node type strings to `NodeRule` values: `true` (unconditionally allowed),
   `false` (explicitly forbidden), or a `NodeValidator` function for constraint
   checking. If a node's type is not a key in the record, it's an automatic
   violation. Safer than a denylist — new JS features are blocked by default.

3. **Injectable configuration.** `validateProgram` takes the `LanguageLevel` as
   an argument rather than hardcoding it. Different exercises can use different
   subsets. `allowedGlobals` and `allowedMemberNames` are `ReadonlySet<string>`
   for the same reason — injectable, not hardcoded.

4. **No type checking.** `.log` called on a string is a runtime error, not a
   static validation concern. We check property _names_ against an allowlist,
   not the _types_ of their receivers.

5. **No callee identity checking.** `let f = alert; f()` is valid (alert is in
   allowedGlobals, f is declared). We don't track that f "is" alert.
   MemberExpression property name checking + undeclared globals analysis covers
   the important cases without alias tracking.

6. **Scope analysis simplified for JeJ.** No functions means no function scope,
   no hoisting, no parameters, no closures. No catch/class/with means fewer
   binding forms. This is a feature, not a limitation — the scope model matches
   exactly what JeJ learners can write.

7. **Always module mode.** `sourceType: 'module'` is hardcoded in
   `validateProgram` (the pipeline entry point). `parseProgram` itself accepts
   `sourceType` as a parameter for flexibility, but the pipeline always passes
   `'module'`. Module mode provides strict mode for free and matches how modern
   JS applications work.

8. **Warning boundary principle.** Warnings are now in `hinting/`, but the
   principle still governs what was originally here: "Could a beginner have
   written this by accident?" If producing the pattern requires intentional
   knowledge (e.g., `!!value` for boolean coercion), it belongs in linting, not
   JeJ warnings.

## Why preserveParens is enabled

Acorn's `preserveParens: true` option emits `ParenthesizedExpression` nodes in
the ESTree AST for every parenthesized expression (e.g., `(a + b) * c`). Without
this option, parentheses are syntactically transparent — acorn produces the inner
expression node with correct precedence but no wrapper.

We enable it for trace visualization: when the Aran tracer emits
`parenthesis.enter`/`parenthesis.leave` events, the UI needs an ESTree node to
highlight. `ParenthesizedExpression` provides that anchor point.

The cost is minimal — `ParenthesizedExpression: true` in the allowlist, and the
generic `getChildNodes` walker handles wrapper nodes automatically.

## Why property assignment is blocked

`validateAssignmentExpression` checks that `left.type === 'Identifier'`. This
blocks property assignment (`obj.prop = value`, `arr[0] = value`) while allowing
variable assignment (`x = 5`).

**Rationale:** JeJ has no object literals, no array constructors, no `new` — there
is zero valid use case for assigning to a property. Allowing it risks learners
accidentally overwriting built-in methods (`console.log = 5`) or creating
confusing patterns with no pedagogical value.

The error message is clear: "You can only assign to variables — property
assignment is not allowed."

## What this module deliberately does NOT do

- **No TDZ detection.** `let x = x + 1` is not flagged. TDZ is a subtle runtime
  behavior that beginners won't encounter in practice.
- **No alias tracking.** `let f = alert; f()` is valid. We don't track that f
  "is" alert.
- **No runtime semantics.** Can't check that `for...of` iterates a string vs. an
  array, or that a function returns the right type.
- **No fix suggestions.** Reports problems with locations. Suggesting fixes is a
  different tool's job.
- **Never throws.** Parse errors are captured in the report. Educational tools
  need graceful degradation for broken student code.
- **No warnings.** Warnings moved to `hinting/`. This module only produces
  rejections.

## Module boundaries

- `validating/` is self-contained — no cross-module imports
- The ESLint `boundaries` plugin enforces a DAG between modules
- No acorn-walk dependency — a simple recursive `getChildNodes` helper walks the
  tree generically

### File roles

**`just-enough-js.ts`** — The pre-built "Just Enough JavaScript" language level
configuration. Defines `allowedGlobals`, `allowedMemberNames`, and the `nodes`
allowlist with constraint validators. This is the single source of truth for
what JeJ permits — it must match `reference.md`. The `ALLOWED_MEMBER_NAMES` Set
is defined once and referenced by both the `createMemberValidator` factory (for
runtime checking) and the `allowedMemberNames` config field (for external
consumers).

**`parse-program.ts`** — Acorn wrapper. Parses with `locations: true` (for error
locations), `sourceType` parameter (always `'module'` in the pipeline), and
`preserveParens: true` (for trace visualization anchor nodes).

**`check-undeclared-globals.ts`** — Scope analysis pass. Walks the AST
maintaining a scope chain and performs three checks: (1) flags undeclared
identifiers (not declared and not in `allowedGlobals`) as rejections, (2) detects
unused variables (declared but zero reads) as warnings, (3) detects variable
shadowing (inner block re-declares an outer scope name) as warnings. Also tags
for-of iteration variables and warns when they are reassigned inside the loop
body.

**`collect-violations.ts`** — Recursive AST walker. For each node, looks up
`node.type` in the `nodes` record. If missing: rejection. If `false`: rejection.
If validator function: calls it. If `true`: allowed. Recurses into children via
`getChildNodes`.
