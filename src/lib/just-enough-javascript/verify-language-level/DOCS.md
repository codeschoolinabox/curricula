# verify-language-level — Architecture & Decisions

## Why this package exists

Validates JavaScript programs against configurable language level subsets for
education. Replaces the previous runtime enforcement approach (monkey-patching
`globalThis` to block disallowed methods/globals at runtime). Runtime
enforcement needed ~40 safety exemptions because blocking things like
`Object.prototype.toString` breaks JS engine internals (implicit coercion,
template literals, `console.log`). Static AST validation eliminates all safety
exemptions — the AST only contains student-written code, engine internals are
invisible.

## Architecture

### Pipeline

```text
source string
  → parseProgram(source, 'module')         — acorn parse to ESTree AST
  → collectViolations(ast, nodes)          — recursive walk, allowlist lookup
  → checkUndeclaredGlobals(ast, config)    — scope analysis pass
  → collectWarnings(ast, source)           — beginner mistake detection
  → ValidationReport { isValid, violations, source, levelName }
```

`isValid` is `true` when there are zero error-severity violations. Warning-
severity violations don't invalidate the program.

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

4. **Warning boundary principle.** JeJ warnings catch syntax that is obviously
   misused, overlooked, or misunderstood by beginners. The test: "Could a
   beginner have written this by accident?" If producing the pattern requires
   intentional knowledge (e.g., `!!value` for boolean coercion), it belongs in
   linting, not JeJ warnings.

5. **No type checking.** `.log` called on a string is a runtime error, not a
   static validation concern. We check property _names_ against an allowlist,
   not the _types_ of their receivers.

6. **No callee identity checking.** We don't track whether `alert` was
   reassigned before being called. MemberExpression property name checking +
   undeclared globals analysis covers the important cases without alias
   tracking.

7. **Scope analysis simplified for JeJ.** No functions means no function scope,
   no hoisting, no parameters, no closures. No catch/class/with means fewer
   binding forms. This is a feature, not a limitation — the scope model matches
   exactly what JeJ learners can write.

8. **Always module mode.** `sourceType: 'module'` is hardcoded in the parser. No
   configuration field. Module mode provides strict mode for free and matches
   how modern JS applications work.

## What this package deliberately does NOT do

- **No TDZ detection.** `let x = x + 1` is not flagged. TDZ is a subtle runtime
  behavior that beginners won't encounter in practice.
- **No alias tracking.** `let f = alert; f()` is valid (alert is in
  allowedGlobals, f is declared). We don't track that f "is" alert.
- **No runtime semantics.** Can't check that `for...of` iterates a string vs. an
  array, or that a function returns the right type.
- **No fix suggestions.** Reports problems with locations. Suggesting fixes is a
  different tool's job.
- **Never throws.** Parse errors are captured in the report. Educational tools
  need graceful degradation for broken student code.

## Module boundaries

- `verify-language-level/` is self-contained — no cross-module imports
- `index.ts` re-exports the public API
- The ESLint `boundaries` plugin enforces a DAG between modules
- No acorn-walk dependency — a simple recursive `getChildNodes` helper walks the
  tree generically
