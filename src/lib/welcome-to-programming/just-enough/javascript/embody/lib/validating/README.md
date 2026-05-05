# validating

Validates JavaScript programs against configurable language level subsets using
AST analysis. Ships with a pre-built "Just Enough JavaScript" level for the
Welcome to Programming curriculum.

Consumes the parse primitives (`parseProgram`, `getChildNodes`) from
[`../parse/`](../parse/README.md). Provides the `validate(code)` public entry
(see Structure below).

## Purpose

**Neutral infrastructure:** This module validates whether a JS program stays
within a defined language subset. It makes no pedagogical decisions about
_which_ subset to use — that belongs to the curriculum or tool that consumes it.

## Architecture

```text
source string
  → parseProgram(source, 'module')         — from ../parse/parse-program.ts
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

| File                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `types.ts`                    | Domain types: Violation, ValidationReport, BaseResult, etc.   |
| `validate-program.ts`         | Building block: `validateProgram(source, level)` → ValidationReport |
| `validate.ts` (Phase 1a)      | Public entry: `validate(code)` → frozen `BaseResult`          |
| `collect-violations.ts`       | Recursive AST walk + allowlist checking                       |
| `create-violation.ts`         | Violation factory (with severity)                             |
| `just-enough-js.ts`           | Pre-built "Just Enough JS" LanguageLevel config               |
| `check-undeclared-globals.ts` | Scope analysis: disallowed globals detection                  |
| `is-jej.ts`                   | Convenience: `isJej(code)` returns boolean                    |
| `tests/`                      | Unit tests                                                    |

Files moved out: `parse-program.ts` and `get-child-nodes.ts` now live in
[`../parse/`](../parse/README.md). `ParseError` type also moved there.

## Glossary additions

These terms join the existing `Violation` / `ValidationReport` /
`LanguageLevel` vocabulary; they are produced by the public
`validate(code)` entry (Phase 1a).

- **BaseResult** — frozen `{ ok, error?, rejections? }` returned by
  `validate(code)`. The `ok` boolean is the primary success signal;
  `error` and `rejections` are mutually exclusive optional details.
  The optional-fields shape is preserved verbatim from the api-layer
  contract; `BaseResult` is **not** a TypeScript discriminated union
  (consumers should check `ok` and presence of `error`/`rejections`
  rather than rely on type narrowing). The `error` field uses the
  validate-stage error union (`ParseResultError |
  FormattingResultError`); execution wrappers (`run` / `trace` /
  `debug`) compose `BaseResult` with their own wider error union via
  the type's `E` parameter.
- **FormattingResultError** — frozen `{ kind: 'formatting' }`.
  Returned when a downstream pipeline includes a format gate and the
  source doesn't match recast's expected output. Lives in
  lib/validating because it is part of the unified result-error
  vocabulary consumed by `BaseResult.error`; it is distinct from
  `lib/formatting/`'s internal `CheckFormatResult` (`{ formatted:
  boolean }`), which is the format gate's own return shape.
- **Rejection** — a `Violation` with `severity: 'rejection'`. All
  violations are rejections in this module (no informational
  warnings).

### When to use `BaseResult` vs `ValidationReport`

Both shapes describe a validation outcome but are aimed at different
consumers:

| Use this              | When you want…                                                                 |
| --------------------- | ------------------------------------------------------------------------------ |
| `BaseResult`          | Public-facing shaped result. `ok` boolean, `error` flattened to `{ kind, ... }`, deep-frozen. Returned by `validate(code)`. Composed by execution wrappers. |
| `ValidationReport`    | Lower-level full report. `isValid`, raw `violations[]`, `source`, `levelName`, optional `parseError` (with nested `location`), optional `scriptMode`. Returned by `validateProgram(source, level)`. |

## Public API

### `validate(code)` (planned — Phase 1a)

```ts
function validate(code: string): BaseResult;
```

Public entry. Returns a frozen `BaseResult`. Never throws.

- `{ ok: true }` — code parses and passes JeJ language-level
  validation.
- `{ ok: false, error: { kind: 'parse', name, message, line, column } }`
  — code is not valid JavaScript syntax.
- `{ ok: false, rejections: [...] }` — code parses but contains
  language-level violations (e.g. `var`, `for-in`, etc.).

Internally composes `parseProgram` (`../parse/`) and
`collectViolations` / `checkUndeclaredGlobals` (this module). The
`with`-statement script-mode fallback in `validate-program.ts`
remains; `validate(code)` inherits it.

#### Input-boundary behavior

- **Empty input** parses successfully and validates as
  `{ ok: true }` (empty Program has no nodes to reject).
- **Non-string `code`** — TypeScript types require `code: string`. A
  non-string runtime value reaches `parseProgram` and produces a
  parse-shaped `BaseResult` failure or, depending on shape, a
  thrown error from acorn that bubbles up. `validate(code)` is
  documented as "never throws" only for string input.
- **Source with shebang / BOM / unicode identifiers** — accepted per
  acorn's defaults (see `lib/parse-old/README.md` § Parse semantics).
- **`with`-statement easter egg** — programs that fail module-mode
  parse but succeed in script mode and contain a `WithStatement`
  validate against the script-mode AST. The resulting
  `ValidationReport.scriptMode` flag is **not** surfaced on
  `BaseResult` — `validate(code)` flattens that detail away. Tools
  that need to know whether script-mode was used should call
  `parse(code)` (which exposes `scriptMode`) or `validateProgram`
  (which exposes `ValidationReport.scriptMode`) directly.

### `validateProgram(source, level)` (building block)

```ts
function validateProgram(
  source: string,
  level: LanguageLevel,
): ValidationReport;
```

Lower-level entry. Returns a `ValidationReport` instead of the
shaped `BaseResult`. Suitable for tools that want the raw
`violations` array, the `levelName`, or to validate against a
custom (non-JeJ) `LanguageLevel`.

### `isJej(code)` (boolean convenience)

```ts
function isJej(code: string): boolean;
```

Returns `true` when code parses, passes JeJ validation, AND is properly
formatted. Equivalent to `validate(code).ok && checkFormat(code).formatted`.
Synchronous (recast format check is sync).

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
- `FunctionDeclaration`, `ArrowFunctionExpression`
- `ClassDeclaration`
- Property assignment (`obj.prop = value`, `arr[0] = value`)
- Any other ESTree node type not in the allowlist

Some (loop guards via `UpdateExpression`) appear in reference.md under "Syntax
You'll See (But Not Write)" — they are injected by tools, not written by
learners.

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
- [../parse/README.md](../parse/README.md) — parse primitives this module
  consumes
- [../reference.md](../reference.md) — learner-facing language cheat sheet
