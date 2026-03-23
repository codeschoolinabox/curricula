# evaluating/shared — Architecture & Decisions

## Why allow AND block

Early chapters have few features (allowlist is short). Late chapters have most
features (blocklist is short). Supporting both avoids verbose configs in either
case. Mutual exclusivity (`allow` XOR `block`, never both) prevents ambiguity.

## Why schema-driven expansion

The `AllowConfig` type supports boolean shorthand at every nesting level:

```ts
{
	loops: true;
} // expands to { loops: { while: true, forOf: true } }
{
	strings: {
		methods: true;
	}
} // expands methods to all sub-keys
```

A JSON Schema defines the full structure. The expansion function inspects the
schema to know which keys exist at each level — same pattern as
`@study-lenses/tracing`'s `expandShorthand`, but recursive.

## Why no Ajv

The project does not depend on Ajv. Rather than adding a heavy dependency for
filling defaults, we use a simple recursive schema walker that sets omitted keys
to the provided default value (`false` for allow mode, `true` for block mode).

## Validator merging strategy

Multiple operator features may enable the same AST node type. For example,
`equality` and `arithmetic` both need `BinaryExpression`. The resolution step
collects all enabled operators per expression type into a single `Set`, then
builds one merged validator per type:

```ts
createBinaryValidator(new Set(['===', '!==', '+', '-', '*', '/']));
```

Same pattern for `UnaryExpression` (typeof, !, -) and `LogicalExpression` (&&,
||).

## Structural constraints vs configurable features

JeJ has two categories of validation rules:

**Configurable features** (controlled by allow/block): which AST node types are
permitted (e.g., WhileStatement, TemplateLiteral) and which APIs are available
at runtime (e.g., `console.log`, `Number`). These are the leaves of the
AllowConfig object.

**Structural constraints** (always enforced): camelCase variable names, single
declaration per statement, for-of must use `const`, block-required control flow.
These apply regardless of the allow/block config because they are JeJ
conventions — writing `let a, b` is wrong even if `variables.let` is enabled.
These constraints live in the base JeJ LanguageLevel validators and are carried
through to every narrowed level.

## Feature interdependencies

`loops.forOf` implicitly requires `variables.const` — the for-of loop variable
must be `const`, so if `forOf` is enabled but `const` is not in the config,
`resolveFeatures` auto-enables const in the narrowed LanguageLevel. This is
silent (no error thrown), documented, and tested.

No other implicit dependencies exist. `jumps.break`/`continue` without loops is
not an error — acorn will catch misplaced break/continue during parsing.

## Narrowed LanguageLevel construction

`resolveFeatures` builds a **new** LanguageLevel (not a patch):

1. Copy `meta` from the base JeJ level (sourceType, etc.)
2. Initialize `nodes` with base structural nodes (Program, ExpressionStatement,
   Identifier, Literal, BlockStatement, MemberExpression, CallExpression,
   AssignmentExpression)
3. For each `true` leaf in the expanded config, add corresponding node types and
   constraint validators from the feature mapping table
4. For operator nodes, collect enabled operators into a `Set` per expression
   type, build one merged validator each
5. Return `Object.freeze({ meta, nodes })`

## AllowConfig → AllowedConfig transformation

The AllowConfig (user input, nested object) maps to two outputs:

- **LanguageLevel** — for static validation (which AST nodes are legal)
- **AllowedConfig** — for runtime enforcement (which globals/prototypes are
  accessible)

The AllowedConfig is a flat `Record<string, true>` with dot-path keys (e.g.,
`'String.prototype.slice'`, `'console.log'`, `'Number'`). Only features with
enforcement entries in the mapping table produce AllowedConfig entries —
validation-only features (like loops, operators) don't appear in AllowedConfig.

The existing `enforceLevel(target, allowed)` works unchanged with partial
AllowedConfig. It blocks globals/prototypes NOT in the config, so fewer entries
= more blocking (correct behavior). Safety exemptions internal to the enforcer
are preserved.

## What this module deliberately does NOT do

- Does not validate user code — that's `validate-program`'s job
- Does not enforce at runtime — that's `enforce-level`'s job
- Does not execute code — that's the individual actions' job
- Only translates config → LanguageLevel + AllowedConfig
