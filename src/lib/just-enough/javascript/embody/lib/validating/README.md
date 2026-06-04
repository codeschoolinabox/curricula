# validating

Validates JavaScript programs against configurable language level subsets using
AST analysis. Ships with a pre-built "Just Enough JavaScript" level for the
Welcome to Programming curriculum.

Consumes the parse primitives (`parseProgram`, `getChildNodes`) from
[`../parse-old/`](../parse-old/README.md). Provides the `validate(code)` public
entry (see Structure below).

## Purpose

**Neutral infrastructure:** This module validates whether a JS program stays
within a defined language subset. It makes no pedagogical decisions about
_which_ subset to use — that belongs to the curriculum or tool that consumes it.

## Architecture

```text
source string
  → parseProgram(source, 'module')         — from ../parse-old/parse-program.ts
  → collectViolations(ast, nodes)          — recursive walk, allowlist lookup
  → checkUndeclaredGlobals(ast, config)    — scope analysis
  → ValidationReport { isValid, violations, source, levelName }
```

The `LanguageLevel` object controls everything:

- `name` — identifies the level in reports (e.g. `"Just Enough JavaScript"`)
- `allowedGlobals` — `ReadonlySet<string>` of identifier names that don't need a
  `let`/`const` declaration (e.g. `console`, `alert`, `String`)
- `blockedMemberNames` — `ReadonlySet<string>` of property names FORBIDDEN in
  non-computed member expressions (e.g. `split`, `constructor`); every other
  name passes (allow-all-except-blocklist)
- `nodes` — `Record<string, NodeRule>` where each key is an ESTree node type and
  each value is: `true` (unconditionally allowed), `false` (explicitly
  forbidden), or a `NodeValidator` function for constraint checking. Missing
  keys = automatic violation.

## Structure

| File                          | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `types.ts`                    | Domain types: Violation, ValidationReport, BaseResult, etc.         |
| `validate-program.ts`         | Building block: `validateProgram(source, level)` → ValidationReport |
| `validate.ts`                 | Public entry: `validate(code)` → frozen `BaseResult`                |
| `collect-violations.ts`       | Recursive AST walk + allowlist checking                             |
| `create-violation.ts`         | Violation factory (with severity)                                   |
| `just-enough-js.ts`           | Pre-built "Just Enough JS" LanguageLevel config                     |
| `check-undeclared-globals.ts` | Scope analysis: disallowed globals detection                        |
| `is-jej.ts`                   | Convenience: `isJej(code)` returns boolean                          |
| `tests/`                      | Unit tests                                                          |

Files moved out: `parse-program.ts` and `get-child-nodes.ts` now live in
[`../parse-old/`](../parse-old/README.md). `ParseError` type also moved there.

## Glossary additions

These terms join the existing `Violation` / `ValidationReport` / `LanguageLevel`
vocabulary; they are produced by the public `validate(code)` entry.

- **BaseResult** — frozen `{ ok, error?, rejections? }` returned by
  `validate(code)`. The `ok` boolean is the primary success signal; `error` and
  `rejections` are mutually exclusive optional details. The optional-fields
  shape is preserved verbatim from the api-layer contract; `BaseResult` is
  **not** a TypeScript discriminated union (consumers should check `ok` and
  presence of `error`/`rejections` rather than rely on type narrowing). The
  `error` field uses the validate-stage error union
  (`ParseResultError | FormattingResultError`); execution wrappers (`run` /
  `trace` / `debug`) compose `BaseResult` with their own wider error union via
  the type's `E` parameter.
- **FormattingResultError** — frozen `{ kind: 'formatting' }`. Returned when a
  downstream pipeline includes a format gate and the source doesn't match
  recast's expected output. Lives in lib/validating because it is part of the
  unified result-error vocabulary consumed by `BaseResult.error`; it is distinct
  from `lib/formatting/`'s internal `CheckFormatResult`
  (`{ formatted: boolean }`), which is the format gate's own return shape.
- **Rejection** — a `Violation` with `severity: 'rejection'`. All violations are
  rejections in this module (no informational warnings).
- **nodePath** — a NodePath string rooted at the Program node (e.g.
  `'$.body.0.declarations.0'`) carried on every `Violation`, identifying the
  offending AST node. Lets consumers navigate from a violation back to its node
  for structured tooling (lens highlighting, editor diagnostics). Both
  collecting walkers (`collect-violations`, `check-undeclared-globals`) build a
  node → path map once via `buildNodePathMap` (in `../parse-old/`) and look up
  each offending node's path from it; `NodeValidator`s receive the path as their
  second argument and forward it to `createViolation` (a required argument — no
  default). Matches the `nodePath` convention used by the tracer and
  `embody/types.ts`.
- **Blocked member name** — a property name in
  `LanguageLevel.blockedMemberNames`. Non-computed dot access to a blocked name
  (`x.split`, `x.constructor`) is a rejection; every other dot name passes. This
  allow-all-except-blocklist model is the inverse of an allowlist — chosen so
  the validator tracks reference.md's "all String methods except
  split/match/matchAll" framing without enumerating the full permitted surface.
- **Date-only `new`** — `NewExpression` is allowed only when the callee is the
  identifier `Date` (`new Date(...)`). reference.md states `new Date()` is the
  sole use of `new` in JeJ; every other `new` is a rejection.
- **Computed access vs computed call** — bracket access (`x[k]`, `Math[method]`)
  and computed method calls (`Math[method]()`) both pass. The member blocklist
  governs only non-computed dot access, so surface integrity is scoped to dot
  access; computed access is not gated (an accepted residual hole — see DOCS.md
  § Member model).

### When to use `BaseResult` vs `ValidationReport`

Both shapes describe a validation outcome but are aimed at different consumers:

| Use this           | When you want…                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BaseResult`       | Public-facing shaped result. `ok` boolean, `error` flattened to `{ kind, ... }`, deep-frozen. Returned by `validate(code)`. Composed by execution wrappers.                                         |
| `ValidationReport` | Lower-level full report. `isValid`, raw `violations[]`, `source`, `levelName`, optional `parseError` (with nested `location`), optional `scriptMode`. Returned by `validateProgram(source, level)`. |

## Public API

### `validate(code)`

```ts
function validate(code: string): BaseResult;
```

Public entry. Returns a frozen `BaseResult`. Never throws.

- `{ ok: true }` — code parses and passes JeJ language-level validation.
- `{ ok: false, error: { kind: 'parse', name, message, line, column } }` — code
  is not valid JavaScript syntax.
- `{ ok: false, rejections: [...] }` — code parses but contains language-level
  violations (e.g. `var`, `for-in`, etc.).

Internally composes `parseProgram` (`../parse-old/`) and `collectViolations` /
`checkUndeclaredGlobals` (this module). The `with`-statement script-mode
fallback in `validate-program.ts` remains; `validate(code)` inherits it.

#### Input-boundary behavior

- **Empty input** parses successfully and validates as `{ ok: true }` (empty
  Program has no nodes to reject).
- **Non-string `code`** — TypeScript types require `code: string`. A non-string
  runtime value reaches `parseProgram` and produces a parse-shaped `BaseResult`
  failure or, depending on shape, a thrown error from acorn that bubbles up.
  `validate(code)` is documented as "never throws" only for string input.
- **Source with shebang / BOM / unicode identifiers** — accepted per acorn's
  defaults (see `lib/parse-old/README.md` § Parse semantics).
- **`with`-statement easter egg** — programs that fail module-mode parse but
  succeed in script mode and contain a `WithStatement` validate against the
  script-mode AST. The resulting `ValidationReport.scriptMode` flag is **not**
  surfaced on `BaseResult` — `validate(code)` flattens that detail away. Tools
  that need to know whether script-mode was used should call `parse(code)`
  (which exposes `scriptMode`) or `validateProgram` (which exposes
  `ValidationReport.scriptMode`) directly.

### `validateProgram(source, level)` (building block)

```ts
function validateProgram(
	source: string,
	level: LanguageLevel,
): ValidationReport;
```

Lower-level entry. Returns a `ValidationReport` instead of the shaped
`BaseResult`. Suitable for tools that want the raw `violations` array, the
`levelName`, or to validate against a custom (non-JeJ) `LanguageLevel`.

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

- Binary: `===`, `!==`, `+`, `-`, `*`, `/`, `%`, `**`, `>`, `<`, `>=`, `<=`,
  bitwise `&`, `|`, `^`, `<<`, `>>`, `>>>`, and `in`
- Logical: `&&`, `||`, `??`
- Unary: `typeof`, `!`, `-`, `~`, `void`
- Update: `++`, `--` (prefix and postfix)
- Ternary: `? :` (ConditionalExpression)
- Assignment: `=` plus compound `+=`, `-=`, `*=`, `/=`, `%=`, `**=`, `??=`,
  `||=`, `&&=`, and bitwise-compound `&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=` (all
  to variables only, not properties)
- Optional chaining: `?.` (ChainExpression)
- `new`: only `new Date(...)` — the sole `new` in JeJ

**Grouping**: Parentheses `()` for controlling operator precedence. Parsed with
`preserveParens: true` so `ParenthesizedExpression` nodes appear in the AST
(provides anchor points for trace visualization). Unconditionally allowed.

**Literals**: string, number, boolean, null, undefined, template literals, regex
literals, and BigInt literals (`42n`). Every literal form JeJ can produce is
allowed.

**Expressions**: member access (dot and bracket), function calls, identifiers,
template literals, parenthesized expressions.

**Member access constraints**: Bracket/computed access (`arr[0]`,
`Math[method]`) always passes. Dot access (`.foo`) passes unless the property
name is in `blockedMemberNames` (allow-all-except-blocklist).

**Call constraints**: Computed method calls (`Math[method](3.7)`) are allowed —
`reference.md` shows them as valid JeJ. The member blocklist governs only
non-computed dot access; computed access (literal or dynamic) is not gated (see
DOCS.md § Member model for the accepted residual hole).

**Module mode**: parses `sourceType: 'module'` by default (strict mode for
free). Sole exception: the `with`-statement easter egg falls back to script mode
(see § Input-boundary behavior).

### Scope analysis

The scope analyzer tracks `let`/`const` declarations per block scope and flags
known JavaScript built-in globals (e.g. `document`, `fetch`, `setTimeout`) that
are not in the language level's `allowedGlobals` set. Unknown identifiers
(typos, user-invented names) are not flagged — they produce `ReferenceError` at
runtime.

Scope model is simplified for JeJ's subset — no functions, catch clauses, or
classes. Only `let`/`const` in blocks, for-of heads, and Program-level. TDZ is
not checked.

### Blocked syntax

These AST node types are NOT in the allowed list and always produce rejections:

- `ThrowStatement`
- `FunctionDeclaration`, `ArrowFunctionExpression`, `FunctionExpression`
- `ClassDeclaration`
- `new` with any constructor other than `Date` — `new Date(...)` is allowed;
  `new Foo()`, `new RegExp(...)` are rejections
- Property assignment (`obj.prop = value`, `arr[0] = value`)
- Any other ESTree node type not in the allowlist

`UpdateExpression` (`++`, `--`) IS allowed — reference.md teaches it. (An
earlier version of this doc listed it as blocked; that was drift between code
and docs.)

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
- [../parse-old/README.md](../parse-old/README.md) — parse primitives this
  module consumes
- [../reference.md](../reference.md) — learner-facing language cheat sheet
