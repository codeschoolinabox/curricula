# parse

Owns the **AST-stepping generator** for the JeJ AST stack: a sync
`createParseGenerator(code, options?)` that yields one event at a
time during parsing, allowing learners to step forward and backward
through tree construction, see exactly where a syntax error fires
(with the tokens consumed before the failure preserved), and explore
each AST node's role in the program. The yielded stream interleaves
tokens (from tokenization), comments, node-enter, node-exit, and any
error event by source/walk order. Returns a frozen `ParseResult`
with `outcome` ∈ `'complete' | 'cancel' | 'fail' | 'parse-error'`,
plus a fully entwined AST.

Self-contained except for its sibling-layer dependency: imports
`acorn`, `lib/ast/shared/`, and `lib/ast/tokenize/` (for `TokenEvent`
and `CommentEvent` types only — runtime invocation of acorn happens
within this module via `acorn.parse(code, { onToken, onComment })`,
not by driving the tokenize generator).

> **Read [glossary.md](./glossary.md) first.** The vocabulary defined
> there is load-bearing — every type, function, and test description
> in this module must use those terms exactly. This README and the
> (future) `DOCS.md` build on that contract.

> **Status — Phase 0 in progress.** This README and `glossary.md` are
> in place. `types.ts` lands after the AR-1 design challenge.
> `DOCS.md` (architectural sketch) follows, then AR-2.

## Why this module exists

Today's `lib/parse-old/parse(code)` is single-shot: it returns a
frozen AST or an error, in one bite. Useful for downstream tooling,
but invisible to learners — they cannot watch the tree being built,
cannot pause when a missing closing brace causes a syntax error,
cannot understand why parsing failed at line 7 when the actual
mistake was on line 5.

`parse` makes the tree-building observable. With its sibling
`lib/ast/tokenize/`, it forms the **creation phase** layer of the
JeJ notional machine — the predictive stepping that runs **before**
the runtime predictive stepping in `lib/evaluating/intercept/`.

This is the layer that produces the **fully entwined AST**: every
node carries `.parent`, `.children`, `.text`, `.tokens`,
`.roleInParent`, `.willEmit`, plus `.precedence` / `.associativity`
on operator nodes. The entwining lets a UI ask questions like "what
tokens produced this node?", "what role does this node play in its
parent?", "what runtime tracer events should fire here?"

## Public API

The single public entry point:

```ts
import createParseGenerator from './parse.js';

const handle = createParseGenerator(code);

// Step-through (sync iteration)
for (const event of handle) {
	switch (event.category) {
		case 'token':
			render(`token #${event.step}: ${event.kind} ${event.text}`);
			break;
		case 'comment':
			render(`comment #${event.step}: ${event.kind}`);
			break;
		case 'node-enter':
			render(`enter #${event.step}: ${event.kind} (role: ${event.node.roleInParent ?? 'root'})`);
			break;
		case 'node-exit':
			render(`exit #${event.step}: ${event.kind}`);
			break;
		case 'parse-error':
			render(`error #${event.step} at ${event.line}:${event.column} — ${event.message}`);
			break;
	}
}

// Or batch (async result)
const result = await handle;

if (result.outcome === 'complete') {
	console.log(`AST built: ${result.events.length} events; root has ${result.ast.children.length} children`);
}
if (result.outcome === 'parse-error') {
	console.log(`parse error: ${result.error.message} at line ${result.error.line}`);
	const tokensBeforeFail = result.events.filter((e) => e.category === 'token').length;
	console.log(`tokens consumed before failure: ${tokensBeforeFail}`);
}
if (result.scriptMode) {
	console.log('used script-mode fallback (with-statement easter egg)');
}

// Backward stepping via the doubly-linked event chain
const last = result.events[result.events.length - 1];
let cursor = last;
while (cursor) {
	render(cursor);
	cursor = cursor.prev;
}

// Tree navigation via the wired-in entwining
const callExprs = collectByType(result.ast, 'CallExpression');
for (const node of callExprs) {
	console.log(`call at ${node.text}; role: ${node.roleInParent}; emits: ${node.willEmit.join(', ')}`);
	// e.g. "call at foo(1, 2); role: argument-0; emits: expression, resolve"
	console.log(`  tokens: ${node.tokens.map((t) => t.text).join(' ')}`);
	console.log(`  parent: ${node.parent?.type ?? 'none'}`);
}
```

The handle is settled exactly once (the generator runs once); a
second `for ... of` over the same handle yields the same event
references in the same order without re-parsing.

## Inputs and outputs at the boundary

**Inputs:**

- `code: string` — the source to parse. No assumptions about
  validity; parse errors are reified as data.
- `options?: ParseOptions` — gating flags for which event categories
  fire. NMConfig-style: top-level booleans `{ tokens?, comments?,
  nodeEnter?, nodeExit? }`, all optional, all default to `true`.
  Pedagogical metadata (`text`, `parent`, `children`, `tokens`,
  `roleInParent`, `willEmit`, `precedence`, `associativity`) is
  always populated — not gateable. The cost is small (one walk),
  the convenience is large.

**Outputs:**

- `ParseHandle` — the iterable + PromiseLike consumer surface.
- `ParseResult` — the settled artifact: `code`, `events`, `ast`
  (or `null` if no AST could be produced), `outcome`, optional
  `error` / `reason` / `scriptMode`, plus the resolved `options`.
  Frozen.

**The handle satisfies three contracts** simultaneously:

1. `Iterable<ParseEvent>` — sync iteration via `for ... of`.
2. `PromiseLike<ParseResult>` — `await handle` resolves to the
   settled result.
3. `SyncExecution<ParseEvent, ParseResult>` — composes (1) and (2)
   plus `.result` / `.cancel`. From `lib/ast/shared/`.

Plus parse-specific: `.fail(reason?)`, `.code`, `.options`.

## What you get on each AST node

Every node in `result.ast` (the Program root and every descendant)
carries the fields below, wired in during the entwine pass and
frozen in place.

| Field            | Type                          | Meaning                                                                                                           |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `type`           | `string`                      | ESTree node type. Acorn-native; not added by us.                                                                  |
| `start`, `end`   | `number`                      | Source char positions. Acorn-native (with `locations: true`).                                                     |
| `loc`            | `SourceLocation`              | Acorn-native source location (line/column).                                                                       |
| `text`           | `string`                      | `code.slice(start, end)` — precomputed source substring.                                                          |
| `parent`         | `AstNode \| null`             | Parent node; `null` only for the Program root. Cycle.                                                             |
| `children`       | `readonly AstNode[]`          | Direct children, in source order. Empty for leaves.                                                               |
| `tokens`         | `readonly TokenEvent[]`       | Tokens whose source ranges fall within this node's range. Same `TokenEvent` references as in `result.events`.     |
| `roleInParent`   | `string \| null`              | Categorical role label (e.g. `'condition'`, `'consequent'`, `'callee'`, `'argument-0'`). `null` for Program root. |
| `willEmit`       | `readonly string[]`           | Predicted runtime tracer event categories (e.g. `['expression.call', 'resolve.call']`).                           |
| `precedence`     | `number?`                     | Operator precedence — present on `BinaryExpression` / `LogicalExpression` / `AssignmentExpression`; absent otherwise. |
| `associativity`  | `'left' \| 'right' \| undefined` | Operator associativity, alongside `precedence`.                                                                |

Plus all other ESTree fields acorn produces (e.g. `body`, `test`,
`consequent`, `arguments`, …) — preserved as-is.

## Edge cases

- **Empty source** (`code === ''`): `result.ast` is the Program node
  with empty `body`. Events: a single EOF TokenEvent, then the
  Program node-enter and node-exit. `outcome: 'complete'`.
- **Syntax error of any kind** (lexical OR grammatical, e.g. `let x
  = ;` or `let x = "unterminated`): tokens consumed before the
  failure are preserved in `result.events`; a `ParseErrorEvent` is
  the last entry; `outcome: 'parse-error'`; `result.ast === null`.
  Acorn does not recover; we don't expose a partial tree. The error
  message (`result.error.message`) distinguishes the cause.
- **`with`-statement easter egg**: module-mode parse fails; script-
  mode parse retried. If script-mode succeeds and contains a
  `WithStatement`, the script-mode AST is used and
  `result.scriptMode === true`. Otherwise, the module-mode error is
  the canonical failure (the script-mode error is never surfaced).
  Truth table is in `DOCS.md` § Script-mode fallback.
- **Non-string input**: rejected at the boundary with a TypeError —
  `code` must be a string (mirrors tokenize's policy).
- **BOM (byte-order mark)** at start of source: acorn strips it
  before tokenization. Not surfaced as a token; source ranges are
  unaffected.
- **Hashbang** (`#!/usr/bin/env node` on line 1): acorn supports it
  via `allowHashBang: true`; we enable that option. The hashbang is
  preserved in `code` but does not produce a TokenEvent.
- **`'use strict'` directive**: preserved as an `ExpressionStatement`
  in the AST (acorn's standard handling). No special treatment.
- **Top-level `import` / `export`**: allowed in module mode (the
  default). If module-mode parse succeeds, these are normal nodes.
  Script-mode fallback would reject them — but the fallback only
  triggers on module-mode failure AND a `WithStatement` in the
  script-mode result, so this is moot in practice.
- **prev/next sequencing**: events are yielded with `prev: null` /
  `next: null` during live iteration; the doubly-linked chain is
  wired during the entwine pass after the run settles, before deep-
  freeze. Reference identity is preserved across live → settled.
- **Cancel before first iteration**: termination check at the top
  of the loop observes `cause: 'cancel'` immediately;
  `result.events` empty; `result.ast === null`.

## What this module deliberately does NOT do

- **Validate JeJ-allowed constructs.** That is `lib/validating/`'s
  job. We accept any input acorn accepts (modulo `with` for the
  easter egg).
- **Stamp `node.jejStatus`** (`'allowed'` / `'forbidden'` /
  `'easter-egg'` / `'computational-only'`). **Deferred to v2** — a
  follow-up PR migrates `lib/validating/` to consume `lib/ast/parse/`,
  and at that point validation can stamp the tag on each node. v1
  ships without the slot to avoid creating a circular dependency
  between `parse/` and `validating/` (today `validating/` consumes
  `parse-old/`; we don't want it to consume `parse/` until parse/
  has stabilised).
- **Format-check.** That is `lib/formatting/`'s job.
- **Run / instrument / trace runtime semantics.** Those live in
  `lib/evaluating/`. We PREDICT runtime categories (`willEmit`) but
  do not produce them.
- **Emit scope or binding events.** Scopes and bindings exist at
  RUNTIME, not at parse time. The notional machine's "creation
  phase" stops short of scope construction. (Hoisting analysis,
  TDZ regions, etc. are runtime concerns.)
- **Build a normalized AST or a different IR.** We use acorn's
  ESTree shape, enriched in place. Consumers who need a different
  shape transform our output themselves.
- **Run with a Worker, SAB, timeouts, or iteration limits.** Parsing
  is sync and O(n) in source length; no need for any of these. A
  consumer wanting a wall-clock cap calls `.cancel()` themselves.

## Architecture

See `DOCS.md` for the architectural sketch (Phase 0.5; lands after
`types.ts` and AR-1). The sketch will describe execution phases
(tokenize-and-parse via `acorn.parse(code, { onToken, onComment })`,
walk the AST depth-first emitting node-enter / node-exit, entwine,
freeze, settle), structural constraints, and the termination
protocol in domain terms with a Mermaid data-flow diagram.

## Module ownership

Per AGENTS.md "one file per concept":

- `glossary.md` — ubiquitous language. Phase 0.1, in place.
- `README.md` — this file. Phase 0.2, in place.
- `types.ts` — type contract. Phase 0.4 (post-AR-1).
- `DOCS.md` — architectural sketch. Phase 0.5.
- `parse.ts` — the public entry. Phase 1 (post-AR-2). Out of scope
  for the current DDD-only work.
- `tests/` — Phase 1 (post-AR-2). Out of scope for the current
  DDD-only work.

## Related modules

- `lib/ast/shared/types.ts` — `SyncExecution`, `BaseEvent`, `BaseError`.
- `lib/ast/tokenize/` — base layer; this module imports its
  `TokenEvent` and `CommentEvent` types.
- `lib/parse-old/` — legacy single-shot parser. Will be deleted in a
  follow-up PR after `lib/ast/` ships and existing consumers
  (`lib/validating/`, `lib/scope/`, `lib/socratizing/`) migrate.
- `lib/evaluating/intercept/` — the surface this module mirrors
  (sync vs async; otherwise identical termination protocol, replay
  semantics, PromiseLike handle).
- `lib/evaluating/trace/syntax/` — reference for `willEmit` category
  vocabulary.
