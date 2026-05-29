# `lib/ast/parse/` — Ubiquitous Language

The vocabulary established here propagates into every function
signature, type name, test description, error message, and JSDoc
comment in the parse module. Names from this glossary are
load-bearing — using a different name in code is a bug, not a
stylistic choice.

This module **depends on `lib/ast/tokenize/`** for the `TokenEvent`
and `CommentEvent` types it shares (both modules use the same
event shapes for tokens and comments; the parse stream interleaves
them with node-events). It also depends on `lib/ast/shared/` for
`SyncExecution`, `BaseEvent`, and `BaseError`.

Mirrors the pattern of `lib/evaluating/trace/syntax/` depending on
`lib/evaluating/trace/semantics/`: the higher layer adds richer
events on top of the base layer's stream.

## Domain terms

| Term                  | Definition                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AST node**          | An ESTree-compatible node produced by acorn, enriched with the entwining metadata listed below. The Program root and every descendant share the same shape; navigation up/down/sideways works via the wired-in `.parent` and `.children` properties. References cyclic; frozen in place after the wire.                                                                                                          |
| **node-enter event**  | Yielded when the engine begins visiting a node during the depth-first walk. Outer category `'node-enter'`; inner `kind` is the node's ESTree `type` (`'Program'`, `'IfStatement'`, `'BinaryExpression'`, `'CallExpression'`, …). Carries the node reference plus `BaseEvent` fields.                                                                                                                                |
| **node-exit event**   | Yielded when the engine finishes visiting a node (after all its children have been entered/exited). Outer category `'node-exit'`; inner `kind` is the node's ESTree type. Pairs 1:1 with the corresponding node-enter event for that node. Reference identity preserved: `enterEvent.node === exitEvent.node`.                                                                                                      |
| **parse error**       | A parse-time `SyntaxError` thrown by acorn (mismatched brackets, unexpected token, etc.). Caught by the engine and reified as data; never thrown to the consumer. Carries `kind: 'parse'` plus acorn's `name`/`message`/`line`/`column`.                                                                                                                                                                            |
| **parse error event** | The yielded event carrying a parse error. Always the last event in the stream when `outcome === 'parse-error'`. Outer category `'parse-error'`. Token and comment events emitted by acorn before the failure point are preserved in `result.events`.                                                                                                                                                                |
| **parse handle**      | The consumer-facing object returned by `createParseGenerator(code, options?)`. Same surface as `TokenizeHandle`: composes `Iterable<ParseEvent>`, `PromiseLike<ParseResult>`, plus `.cancel()`, `.fail(reason?)`, `.code`, `.options`, `.result`. Settles once; replay yields the same event references.                                                                                                            |
| **parse result**      | The settled artifact returned by awaiting the handle. Frozen. Carries `code`, `events`, `ast` (the Program node, or `null` if parse failed before any AST was produced), `outcome`, plus `error?` / `reason?` / `scriptMode?` slots, and the resolved `options`.                                                                                                                                                    |
| **parse outcome**     | First-write-wins discriminator: `'complete'` (acorn produced a full AST and the walk finished), `'cancel'` (consumer cancelled), `'fail'` (consumer called `.fail(reason)`), `'parse-error'` (acorn raised a `SyntaxError` — covers both lexical and grammatical failures since acorn's single-pass parser doesn't cleanly separate them at the API boundary). Termination metadata never appears as an event. |
| **parse event**       | Discriminated union of every event the parse generator yields: `TokenEvent` \| `CommentEvent` \| `NodeEnterEvent` \| `NodeExitEvent` \| `ParseErrorEvent`. The first two are imported from `lib/ast/tokenize/`; the latter three are owned here.                                                                                                                                                                |
| **entwine**           | The post-parse pass that wires bidirectional references between source, tokens, and AST nodes: `node.text` from source slices, `token.containingNode` and `node.tokens[]` for token↔node bridges, `node.parent` and `node.children[]` for tree navigation, `node.roleInParent` from parent↔child relationship, `node.willEmit` from a static lookup table, and `node.precedence` / `node.associativity` for operator nodes. Followed by the prev/next chain wire across `result.events`. The single mutation step in the engine; all mutation happens before deep-freeze. |
| **role-in-parent**    | A categorical label on every non-root AST node describing its semantic role within its parent. Common values: `'condition'` (test of an `IfStatement` / `WhileStatement` / `DoWhileStatement` / `ConditionalExpression` / `ForStatement`), `'consequent'` / `'alternate'`, `'callee'`, `'argument-0'` / `'argument-1'` / …, `'init'`, `'declarator-0'` / …, `'body'`, `'object'` / `'property'`, `'left'` / `'right'` (for binary/logical/assignment), `'discriminant'` / `'case-0'` (for switch). Type is `string` (rules-derived from parent shape, not a closed enum). Computed during entwine.            |
| **will-emit**         | An array of `trace/syntax` step categories that the engine PREDICTS this node will fire at runtime (e.g. `['expression', 'resolve']` for a `CallExpression`). Strings match `StepCategory` from `lib/evaluating/trace/syntax/types.ts` exactly: `'expression'` \| `'resolve'` \| `'statement'` \| `'scope'` \| `'control-flow'` \| `'initialization'` \| `'for-init'` \| `'write'` \| `'emit'` \| `'error'`. Computed during entwine from a static lookup table keyed on ESTree node type. Coarse by design; finer prediction (e.g. expression-sub-kind) is a future refinement.                              |
| **precedence**        | Numeric operator-precedence rank (per the JavaScript operator-precedence table) for `BinaryExpression`, `LogicalExpression`, and `AssignmentExpression` nodes. Lets consumers explain why `1 + 2 * 3` parses as `1 + (2 * 3)`. Set during entwine from a static table; absent on non-operator nodes.                                                                                                                |
| **associativity**     | `'left'` or `'right'` for the same operator-bearing node types. Set during entwine alongside `precedence`. Absent on non-operator nodes.                                                                                                                                                                                                                                                                            |
| **script-mode fallback** | If module-mode parse fails AND a script-mode parse succeeds AND the script-mode AST contains a `WithStatement`, the script-mode AST is used and `result.scriptMode === true`. Otherwise, the module-mode error is the canonical failure. Mirrors `lib/parse-old/`'s identical handling for the `with` easter egg.                                                                                                |
| **category**          | Outer discriminant on the parse-event union: `'token'` \| `'comment'` \| `'node-enter'` \| `'node-exit'` \| `'parse-error'`. The first two carry the same shape as in `lib/ast/tokenize/`.                                                                                                                                                                                                                          |
| **kind**              | Inner discriminant within a category. For `'node-enter'` / `'node-exit'`: the node's ESTree `type`. For `'parse-error'`: a literal `'parse'` (single-kind category). Other categories per `lib/ast/tokenize/glossary.md`.                                                                                                                                                                                            |
| **step**              | 1-indexed contiguous sequence number on each event. `result.events[i].step === i + 1`. Same convention as tokenize, intercept, and trace/semantics.                                                                                                                                                                                                                                                                  |
| **termination cause** | Same single-write slot as in tokenize, with one additional triggering source: parse error.                                                                                                                                                                                                                                                                                                                          |
| **captured events**   | Same ordered slot as in tokenize; here it accumulates tokens, comments, node-enters, node-exits, and any error event in source/walk order.                                                                                                                                                                                                                                                                          |

## Implementation-internal terms (used in DOCS.md)

These names appear in the architectural sketch but are not part of
the public surface. They describe internal state that the
implementation must maintain; consumers never see them.

- **current ancestor pointer** — the runtime reference to the
  immediate parent during a depth-first walk; what gets wired onto
  each visited node as `.parent`.
- **step-categories table** — the static `ESTree-type → trace/syntax
  StepCategory[]` lookup that supplies each node's `willEmit`. A
  read-only constant, internal to the engine.
- **AST node** vs **ESTree node** — synonyms in this codebase. The
  type alias `AstNode` is the preferred public name (used in
  `types.ts`); "ESTree node" is used colloquially in prose to
  emphasise the structural standard.

## Synonyms resolved

- "tree" / "AST" / "syntax tree" → **AST** (we use this consistently;
  `AstNode` is the runtime shape, `ast` is the result field).
- "walk" / "traverse" / "visit" → **walk** (one verb across the
  module).
- "ESTree type" / "node kind" / "node type" → **kind** on the event
  (matches the codebase's two-level discriminant).
- "operator precedence" / "binding power" → **precedence**.
- "back-reference" / "back-pointer" / "parent pointer" → **parent**
  (one term).

## Out of scope (terms that belong elsewhere)

- **token**, **comment**, **acorn tokenizer** → `lib/ast/tokenize/`'s
  domain. We re-use the event shapes; we do not re-define the terms.
- **scope**, **binding**, **resolve**, **value**, **coercion** →
  runtime concepts; live in `lib/evaluating/trace/semantics/`. We
  predict which categories will fire (`willEmit`) but do not produce
  the events themselves.
- **JEJ subset**, **validation rule**, **violation** →
  `lib/validating/`'s domain. The `node.jejStatus` field (a
  per-node tag like `'allowed'` / `'forbidden'` / `'easter-egg'` /
  `'computational-only'`) is **deliberately deferred** to v2; a
  follow-up PR migrates `lib/validating/` to consume `lib/ast/parse/`
  and at that point validation can stamp the tag on each node. v1
  ships without this slot.
- **trap**, **wrap** → `lib/evaluating/intercept/`'s domain. At this
  layer we expose `parent`/`children`/`tokens` directly on each node
  rather than via a side-Map, and this low-level parse `AstNode` carries
  no node-path. Canonical **node-path** identity and the `byPath` index
  live one layer up, at the embody entwined layer (`NodeEntwined.path` +
  `ParseASTEntwined.byPath`).
- **source-map generation**, **format check** — not in scope for
  this module.
