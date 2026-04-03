# validating

Validates JavaScript programs against configurable language level subsets using
AST analysis. Ships with a pre-built "Just Enough JavaScript" level for the
Welcome to Programming curriculum.

Validation is a standalone module consumed by the `api/` layer and the code
object factory.

## Purpose

**Neutral infrastructure:** This module validates whether a JS program stays
within a defined language subset. It makes no pedagogical decisions about
_which_ subset to use — that belongs to the curriculum or tool that consumes it.

## Architecture

```text
source string
  → parseProgram(source, 'module')         — acorn parse to ESTree AST
  → collectViolations(ast, nodes)          — recursive walk, allowlist lookup
  → checkUndeclaredGlobals(ast, config)    — scope analysis
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
| `parse-program.ts`            | Acorn wrapper with `preserveParens: true`                  |
| `collect-violations.ts`       | Recursive AST walk + allowlist checking                    |
| `get-child-nodes.ts`          | Generic ESTree child node extraction                       |
| `create-violation.ts`         | Violation factory (with severity)                          |
| `just-enough-js.ts`           | Pre-built "Just Enough JS" LanguageLevel config            |
| `check-undeclared-globals.ts` | Scope analysis: disallowed globals detection               |
| `is-jej.ts`                   | Convenience: `isJej(code)` returns boolean                 |
| `tests/`                      | Unit tests                                                 |

## Just Enough JS Level Definition

The `just-enough-js.ts` config defines the ceiling of features available in the
JeJ curriculum. It must match `reference.md` (the learner-facing cheat sheet).

### Allowed features

**Variables**: `let` and `const` declarations. Single declaration per statement
(`let a, b` is a rejection). Assignment (`=` only) must target a variable name —
property assignment (`obj.prop = value`) is a rejection.

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
- Assignment: `=` only (to variables only, not properties)
- Optional chaining: `?.` (ChainExpression)

**Grouping**: Parentheses `()` for controlling operator precedence. Parsed with
`preserveParens: true` so `ParenthesizedExpression` nodes appear in the AST
(provides anchor points for trace visualization). Unconditionally allowed.

**Literals**: string, number, boolean, null, undefined, template literals. Regex
and BigInt literals are violations.

**Expressions**: member access (dot and bracket), function calls, identifiers,
template literals, parenthesized expressions.

**Member access constraints**: Bracket access (`arr[0]`) always passes. Dot
access (`.foo`) only passes if the property name is in `allowedMemberNames`.

**Call constraints**: Computed method calls (`str['toLowerCase']()`) are
violations — only dot-access calls are allowed.

**Module mode**: Always parses as `sourceType: 'module'` (gives strict mode for
free).

### Scope analysis

The scope analyzer tracks `let`/`const` declarations per block scope and flags
known JavaScript built-in globals (e.g. `Math`, `Date`, `document`) that are
not in the language level's `allowedGlobals` set. Unknown identifiers (typos,
user-invented names) are not flagged — they produce `ReferenceError` at runtime.

Scope model is simplified for JeJ's subset — no functions, catch clauses, or
classes. Only `let`/`const` in blocks, for-of heads, and Program-level. TDZ is
not checked.

### Blocked syntax

These AST node types are NOT in the allowed list and always produce rejections:

- `UpdateExpression` (`++`, `--`)
- `ThrowStatement`
- `NewExpression`
- `DebuggerStatement`
- `FunctionDeclaration`, `ArrowFunctionExpression`
- `ClassDeclaration`
- Property assignment (`obj.prop = value`, `arr[0] = value`)
- Any other ESTree node type not in the allowlist

Some (`DebuggerStatement`, loop guards via `UpdateExpression`) appear in
reference.md under "Syntax You'll See (But Not Write)" — they are injected by
tools, not written by learners.

## API

### `validateProgram`

```ts
function validateProgram(
  source: string,
  level: LanguageLevel,
): ValidationReport;
```

### `isJej`

```ts
function isJej(code: string): boolean;
```

Returns `true` when code parses, passes JeJ validation, AND is properly
formatted. Equivalent to `validate(code).ok && checkFormat(code).formatted`.
Synchronous (recast format check is sync).

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [../api/README.md](../api/README.md) — public API wrappers (`validate`,
  `isJej`)
- [../reference.md](../reference.md) — learner-facing language cheat sheet
