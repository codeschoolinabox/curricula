# parse-old

> **Status — being superseded by `lib/ast/`.** This module is kept as a working
> reference and continues to serve its existing consumers (`lib/validating/`,
> `lib/scope/`, `lib/socratizing/`, plus the top-level `parse` export in
> `index.ts`). The new stepping-generator-based `lib/ast/tokenize/` and
> `lib/ast/parse/` are being built alongside; consumers will migrate in a
> follow-up PR, after which `lib/parse-old/` is deleted.

Owns the parse step for the JeJ ecosystem: the acorn primitive, the
generic AST child walker, and the public `parse(code)` entry that wraps
both with `with`-statement script-mode fallback and a frozen
`ParseResult`. Self-contained: imports only `acorn`.

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this README.
Use them consistently.

- **AST** — an acorn-flavored ESTree `Program` node. We import `Program`
  from `acorn`; structurally it matches ESTree but includes acorn's
  `sourceType` and (with `preserveParens`) `ParenthesizedExpression`
  nodes. When the codebase says "AST node" it means an acorn `Node`.
- **parseProgram** — the low-level acorn wrapper. Takes source +
  sourceType, returns an acorn `Program` node (an AST) or a
  `ParseError`. Never throws. Used by `parse()` (this module) and by
  `validateProgram` (lib/validating).
- **getChildNodes** — generic ESTree child node walker. Replaces the need
  for an `acorn-walk` dependency. Used internally by parse, validating,
  scope, and socratizing.
- **getChildNodesWithPath** — the path-tracking companion to
  `getChildNodes`. Returns each direct child paired with its JSONPath
  `segment` (`'init'` for an object-valued property, `'body[0]'` for an
  array element). The validation walkers use it to build
  `Violation.nodePath`. See **ChildWithPath**.
- **ChildWithPath** — a `{ child, segment }` pair produced by
  `getChildNodesWithPath`. `segment` is one JSONPath step; a walker joins
  it onto a parent path with `'.'`.
- **buildNodePathMap** — builds a `Map<Node, string>` from every node in
  an AST to its full Program-rooted JSONPath, in one traversal. The
  validation walkers look up a node's path here (instead of threading a
  path argument through their recursion) when stamping
  `Violation.nodePath`.
- **ParseError** — the low-level shape produced by `parseProgram` on
  failure: `{ message, location: { line, column } }`. Frozen.
- **ParseResult** — the public value returned by `parse(code)`. A
  discriminated union: `{ ok: true, code, ast, scriptMode? }` on success,
  `{ ok: false, code, error }` on failure. Always frozen.
- **ParseResultError** — the failure shape inside `ParseResult`:
  `{ kind: 'parse', name: 'SyntaxError', message, line, column }`.
  Discriminated by `kind` to slot into broader result-error unions.
  Always frozen.
- **`with` fallback** (a.k.a. **scriptMode** in the result shape) —
  module-mode parse fails → try script-mode parse → if the script AST
  contains a `WithStatement`, accept the script result and set
  `scriptMode: true`. Otherwise keep the original module-mode error.
  The result field is named `scriptMode` to match
  `ValidationReport.scriptMode` in `lib/validating/types.ts`.
- **Frozen AST** — every node in the returned `ast` is deep-frozen at
  runtime. The TypeScript type is shallow `Readonly<Program>`; the
  runtime guarantee is stronger. See `types.ts` for the gap note.
- **Discriminator conventions** — results discriminate on `ok`
  (boolean); errors discriminate on `kind` (string literal). Pattern is
  consistent across the codebase's result types.

## Structure

| File                | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `types.ts`          | `ParseError`, `ParseResult`, `ParseResultError`, `ChildWithPath`   |
| `parse-program.ts`  | Acorn wrapper: `parseProgram(source, sourceType?)`                 |
| `get-child-nodes.ts`| Generic ESTree child walker: `getChildNodes(node)`                 |
| `get-child-nodes-with-path.ts` | Path-tracking child walker: `getChildNodesWithPath(node)` |
| `build-node-path-map.ts` | Node-to-JSONPath map: `buildNodePathMap(root)`                |
| `parse.ts` (Phase 1a) | Public entry: `parse(code): ParseResult`                         |
| `tests/`            | Unit tests for each source file                                    |

## Public API

### `parseProgram(source, sourceType?)`

```ts
function parseProgram(
  source: string,
  sourceType?: 'script' | 'module',
): Program | ParseError;
```

Direct acorn wrapper. Defaults to `'script'`. Always uses
`ecmaVersion: 'latest'`, `locations: true`, `preserveParens: true`.
Returns `Program` on success, `ParseError` on failure. Never throws.

### `getChildNodes(node)`

```ts
function getChildNodes(node: Node): readonly Node[];
```

Returns the immediate child AST nodes of any acorn node. Skips metadata
properties (`type`, `start`, `end`, `loc`), nulls, primitives, and
non-node objects. The signature `readonly Node[]` signals callers should
treat the array as immutable; the underlying value is mutable for
performance and is intended to be iterated and discarded by the caller.

### `parse(code)` (planned — Phase 1a)

```ts
function parse(code: string): ParseResult;
```

Parses JavaScript source into a frozen `ParseResult`. Never throws.
Module mode is attempted first; on failure, script mode is attempted
as a fallback; the script result is used **only** if the AST contains
a `WithStatement` (the `with` easter egg). All other failures surface
the original module-mode error. The returned `ast` is deep-frozen.

## Parse semantics (delegated to acorn)

Behavior delegated to acorn unchanged:

- **Empty input** parses successfully to a `Program` with empty `body`.
- **Unicode identifiers** accepted per ES spec.
- **BOM** (`﻿`) stripped per ES spec.
- **Shebang** (`#!/usr/bin/env node`) accepted by acorn at supported
  ECMA versions.
- **HTML-line comments** (`<!--`, `-->`) accepted in script mode only.
- **No source length limit** — acorn handles large inputs (memory
  permitting).

JeJ-specific:

- `parse()` always tries module mode first (matches the production
  pipeline used by `validateProgram`).
- `with` is rejected by module mode; the script-mode fallback exists
  solely for the `with` easter egg.

## Future direction

Planned but not yet implemented:

- **Learner-facing AST fields.** Augment AST nodes with extra fields
  aimed at learners — plain-English descriptions of node roles,
  suggested next steps, links to `reference.md` sections, and similar
  pedagogical metadata. Goal: make the AST itself an explorable
  artifact for learn/teach/explore tooling. Specifics deferred until a
  consumer use case appears; tracked as a TODO in `parse.ts` when it
  lands.

## Navigation

- [DOCS.md](./DOCS.md) — design decisions, architectural sketch, data flow
- [../validating/README.md](../validating/README.md) — language-level
  validation; consumes `parseProgram` and `getChildNodes` from this module
- [../formatting/README.md](../formatting/README.md) — recast-based
  formatter (independent of parse)
