# verify-language-level

Validates JavaScript programs against configurable language level subsets using
AST analysis. Ships with a pre-built "Just Enough JavaScript" level for the
Welcome to Programming curriculum.

## Purpose

**Neutral infrastructure:** This module validates whether a JS program stays
within a defined language subset. It makes no pedagogical decisions about
_which_ subset to use — that belongs to the curriculum or tool that consumes it.

## Severity System

Violations have a `severity` of `'rejection'` or `'warning'`.

- **Rejections** indicate disallowed syntax — features outside the language level.
  A program with any rejections is **invalid** (`isValid: false`).
- **Warnings** indicate beginner mistakes that don't violate the language level
  but are likely accidental. A program with only warnings is **valid**
  (`isValid: true`).

**Boundary principle for warnings:** JeJ warnings catch syntax that is obviously
misused, overlooked, or misunderstood by beginners. The test: "Could a beginner
have written this by accident?" If producing the pattern requires intentional
knowledge, it belongs in linting, not JeJ warnings.

## Architecture

```text
source string
  → parseProgram(source, 'module')         — acorn parse to ESTree AST
  → collectViolations(ast, nodes)          — recursive walk, allowlist lookup
  → checkUndeclaredGlobals(ast, config)    — scope analysis
  → collectWarnings(ast, source)           — beginner mistake detection
  → ValidationReport { isValid, violations, source, levelName }
```

The `LanguageLevel` object controls everything:

- `name` — identifies the level in reports (e.g. `"Just Enough JavaScript"`)
- `allowedGlobals` — `ReadonlySet<string>` of identifier names that don't need a
  `let`/`const` declaration (e.g. `console`, `alert`, `String`)
- `allowedMemberNames` — `ReadonlySet<string>` of property names allowed in
  non-computed member expressions (e.g. `length`, `toLowerCase`, `log`)
- `nodes` — `Record<string, NodeRule>` where each key is an ESTree node type and
  each value is: `true` (unconditionally allowed), `false` (explicitly
  forbidden), or a `NodeValidator` function for constraint checking. Missing
  keys = automatic violation.

## Structure

| File                          | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `types.ts`                    | Domain types: Violation, ValidationReport, etc.            |
| `validate-program.ts`         | Public entry: `validateProgram(source, level)`             |
| `parse-program.ts`            | Acorn wrapper with error handling                          |
| `collect-violations.ts`       | Recursive AST walk + allowlist checking                    |
| `get-child-nodes.ts`          | Generic ESTree child node extraction                       |
| `create-violation.ts`         | Violation factory (with severity)                          |
| `just-enough-js.ts`           | Pre-built "Just Enough JS" LanguageLevel config            |
| `check-undeclared-globals.ts` | Scope analysis: undeclared globals, unused vars, shadowing |
| `index.ts`                    | Public API re-exports                                      |

## Just Enough JS Level Definition

The `just-enough-js.ts` config defines the ceiling of features available in the
JeJ curriculum. It must match `reference.md` (the learner-facing cheat sheet).

### Allowed features

**Variables**: `let` and `const` declarations. Single declaration per statement
(`let a, b` is a rejection).

**Control flow**: `if`/`else`, `while`, `for...of`, `break`, `continue` — all
require block statements (`{}`). Bare statements like `if (x) doThing()` are
violations because `IfStatement.consequent`/`.alternate` must be
`BlockStatement` (or null for missing else), and
`WhileStatement.body`/`ForOfStatement.body` must be `BlockStatement`.

**Operators**:

- Binary: `===`, `!==`, `+`, `-`, `*`, `/`, `%`, `**`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `??`
- Unary: `typeof`, `!`, `-`
- Ternary: `? :` (ConditionalExpression)
- Assignment: `=` only
- Optional chaining: `?.` (ChainExpression)

**Literals**: string, number, boolean, null, undefined, template literals. Regex
and BigInt literals are violations.

**Expressions**: member access (dot and bracket), function calls, identifiers,
template literals.

**Member access constraints**: Bracket access (`arr[0]`) always passes. Dot
access (`.foo`) only passes if the property name is in `allowedMemberNames`.

**Call constraints**: Computed method calls (`str['toLowerCase']()`) are
violations — only dot-access calls are allowed.

**Module mode**: Always parses as `sourceType: 'module'` (gives strict mode for
free).

### Scope analysis

The scope analyzer tracks `let`/`const` declarations per block scope and flags:

- **Undeclared globals** (rejection): identifiers referenced but not declared and
  not in `allowedGlobals` (e.g. `parseInt`, `Math`, `document`)
- **Unused variables** (warning): declared variables with zero references
- **Variable shadowing** (warning): inner block re-declares a name from an
  enclosing scope

Scope model is simplified for JeJ's subset — no functions, catch clauses,
classes, or `with`. Only `let`/`const` in blocks, for-of heads, and
Program-level. TDZ is not checked.

### Warnings

Warnings don't invalidate the program. They catch beginner mistakes:

- `'use strict'` — redundant in module mode
- Unused expression — expression result not used (e.g. `5;`, `x + 1;`)
- camelCase — variable names not matching `/^[a-z][a-zA-Z0-9]*$/`. Rejects
  `my_var`, `MyVar`, `_x`. Accepts `myVar`, `x`, `myLongName`.
- Empty blocks — `BlockStatement` with empty body
- Assignment in condition — `=` in `if`/`while` test (probably meant `===`)
- Unreachable code — statements after `break`/`continue`
- Missing semicolons — missing `;` at statement boundaries
- Unnecessary semicolons — `;` after `}` of control flow, or `;;`
- Unused variables — declared variable with zero references
- for-of with `let` — should use `const` (iteration variable isn't reassigned)
- for-of var reassigned — reassigning iteration variable inside loop body
- Variable shadowing — inner block re-declares outer scope name
- Tabs not spaces — leading spaces should be tabs (more accessible)
- Trailing newline — file should end with exactly one newline (missing or
  multiple)

### Blocked syntax

These AST node types are NOT in the allowed list and always produce rejections. Some
(`DebuggerStatement`, loop guards via `UpdateExpression`) appear in reference.md
under "Syntax You'll See (But Not Write)" — they are injected by tools, not
written by learners.

- `UpdateExpression` (`++`, `--`)
- `ThrowStatement`
- `NewExpression`
- `DebuggerStatement`
- `FunctionDeclaration`, `ArrowFunctionExpression`
- `ClassDeclaration`
- Any other ESTree node type not in the allowlist

## What this module does NOT do

- **No type checking.** Checks node types, properties, and variable scope.
  Cannot verify that `.length` is called on a string vs a number — that's
  runtime.
- **No fix suggestions.** Reports what's wrong and where, not how to fix it.
- **Never throws.** Parse errors are returned inside the `ValidationReport` (via
  `parseError` field). Educational tools need graceful degradation.

## Conventions

- One default export per file; no barrel imports
- Types in `types.ts`
- Tests in `tests/` subdirectory with `.test.ts` suffix
- Named function declarations; arrows only for inline callbacks
