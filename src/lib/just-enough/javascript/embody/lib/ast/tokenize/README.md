# tokenize

Owns the **token-stepping generator** for the JeJ AST stack: a sync
`createTokenizeGenerator(code, options?)` that yields one `TokenEvent` (or
`CommentEvent`, or `TokenizeErrorEvent`) at a time, allowing learners to step
forward and backward through tokenization, see exactly where a tokenize-time
error fires (e.g. an unterminated string), and inspect each token's source
range. Wraps `acorn.tokenizer()`. Returns a frozen `TokenizeResult` with
`outcome` ∈ `'complete' | 'cancel' | 'fail' | 'tokenize-error'`.

Self-contained: imports only `acorn` and `lib/ast/shared/`.

> **Read [glossary.md](./glossary.md) first.** The vocabulary defined there is
> load-bearing — every type, function, and test description in this module must
> use those terms exactly. This README and the (future) `DOCS.md` build on that
> contract.

> **Status — Phase 0 in progress.** This README and `glossary.md` are in place.
> `types.ts` and `tokenize.ts` land after the AR-1 design challenge. `DOCS.md`
> (architectural sketch) lands after `types.ts`, followed by AR-2.

## Why this module exists

The tokenize step is the **first stepping phase** in the JeJ predictive stepping
pipeline. Today's `lib/parse-old/parse(code)` is single-shot: it returns a
frozen AST or an error, in one bite. Useful for downstream consumers, but
invisible to learners — they cannot watch the tokens being consumed, cannot
pause when a string literal goes unterminated, cannot understand why a missing
quote produces a confusing line/col number.

`tokenize` makes that step observable. Together with its sibling
`lib/ast/parse/`, it forms the **creation phase** layer of the JeJ notional
machine — the predictive stepping that runs **before** the runtime predictive
stepping in `lib/evaluating/intercept/`.

`tokenize` is the base layer (mirrors `trace/semantics/`); `parse/` depends on
its `TokenEvent` type but invokes acorn separately to get tokens AND nodes in a
single pass via `acorn.parse(code, { onToken })`.

## Public API

The single public entry point:

```ts
import createTokenizeGenerator from './tokenize.js';

const handle = createTokenizeGenerator(code);

// Step-through (sync iteration)
for (const event of handle) {
	if (event.category === 'token') {
		console.log(
			`token #${event.step}: ${event.kind} = ${JSON.stringify(event.text)}`,
		);
	}
	if (event.category === 'comment') {
		console.log(
			`comment #${event.step}: ${event.kind} = ${JSON.stringify(event.text)}`,
		);
	}
	if (event.category === 'tokenize-error') {
		console.log(
			`error #${event.step} at ${event.line}:${event.column} — ${event.message}`,
		);
	}
}

// Or batch (async result)
const result = await handle;

if (result.outcome === 'complete') {
	console.log(
		`tokenized cleanly: ${result.events.length} events, ${result.tokens.length} tokens`,
	);
}
if (result.outcome === 'tokenize-error') {
	console.log(
		`tokenize error: ${result.error.message} at line ${result.error.line}`,
	);
	console.log(`tokens consumed before failure: ${result.tokens.length}`);
}

// Backward stepping: walk the doubly-linked event chain after settle
const last = result.events[result.events.length - 1];
let cursor: TokenizeEvent | null = last;
while (cursor) {
	render(cursor);
	cursor = cursor.prev;
}
```

The handle is settled exactly once (the generator runs once); a second
`for ... of` over the same handle yields the same event references in the same
order without re-tokenizing.

## Inputs and outputs at the boundary

**Inputs (what crosses into this module):**

- `code: string` — the source to tokenize. No assumptions about validity;
  tokenize-time errors are reified as data.
- `options?: TokenizeOptions` — gating flags (e.g. skip emitting `comment`
  events). NMConfig-style. All optional; default is "yield every event."

**Outputs (what crosses out of this module):**

- `TokenizeHandle` — the iterable + PromiseLike consumer surface described
  above.
- `TokenizeResult` — the settled artifact: `code`, `events`, `outcome`, optional
  `error` / `reason`. Frozen. Note we do NOT carry a separate `tokens` array —
  the `events` stream already contains every token (as `TokenEvent`s with
  `category: 'token'`), along with comments and any tokenize-error event
  interleaved by source position. A future additive change could expose
  `result.tokens` if a consumer's use case demands the raw acorn records; for
  now, consumers filter `events` themselves.

**The handle itself satisfies three contracts** simultaneously:

1. `Iterable<TokenizeEvent>` — sync iteration via `for ... of`.
2. `PromiseLike<TokenizeResult>` — `await handle` resolves to the settled
   result.
3. `SyncExecution<TokenizeEvent, TokenizeResult>` — composes (1) and (2) plus
   `.result` / `.cancel`. From `lib/ast/shared/`.

Plus tokenize-specific: `.fail(reason?)`, `.code`, `.options`.

## Edge cases

- **Empty source** (`code === ''`): acorn emits a single `eof` token. The result
  has `outcome: 'complete'`, `events.length === 1` (just the EOF TokenEvent).
- **Non-string input**: rejected at the boundary with a TypeError — `code` must
  be a string. We do not delegate to acorn for type checks because acorn's error
  message ("Cannot read properties of undefined …") is opaque for learners.
- **Large source**: no guard. Acorn tokenizes in O(n); memory is the only
  practical limit. The "just enough" curriculum's one-page-per- program
  constraint makes this a non-issue.
- **prev/next sequencing**: events are yielded with `prev: null` and
  `next: null` during live iteration. After the generator naturally completes
  (or terminates via cancel/fail/error), the engine walks the captured events
  and wires the doubly-linked chain via in-place mutation, THEN deep-freezes the
  result. So a consumer holding an event reference from live iteration will,
  after the run settles, see `prev` and `next` populated on that same object.
  Reference identity is preserved across live → settled.

## What this module deliberately does NOT do

- **Build an AST.** That is `lib/ast/parse/`'s job. tokenize stops at the
  lexical layer.
- **Validate JeJ-allowed constructs.** That is `lib/validating/`'s job. tokenize
  accepts any input acorn accepts.
- **Format-check.** That is `lib/formatting/`'s job.
- **Run / instrument / trace runtime semantics.** Those live in
  `lib/evaluating/`.
- **Implement a tokenizer from scratch.** We wrap `acorn.tokenizer()`. Acorn is
  the single source of tokenization truth.
- **Surface whitespace as events.** Acorn does not emit whitespace tokens; we
  follow suit. Comments DO get events (separate from tokens) because acorn
  delivers them via `onComment`.
- **Build the source ↔ token ↔ AST entwining.** That happens in `lib/ast/parse/`
  (which is the only layer that owns all three). tokenize knows about source ↔
  token only.

## Architecture

See `DOCS.md` for the architectural sketch (Phase 0.5; lands after `types.ts`
and AR-1). The sketch will describe execution phases, structural constraints,
and the termination protocol in domain terms, with a Mermaid data-flow diagram.

## Module ownership

Three files participate in the data flow (per AGENTS.md "one file per concept"):

- `glossary.md` — ubiquitous language. Phase 0.1, in place.
- `README.md` — this file. Phase 0.2, in place.
- `types.ts` — type contract. Phase 0.4 (post-AR-1).
- `DOCS.md` — architectural sketch. Phase 0.5.
- `tokenize.ts` — the public entry. Phase 1 (post-AR-2). Out of scope for the
  current DDD-only work.
- `tests/` — Phase 1 (post-AR-2). Out of scope for the current DDD-only work.

## Related modules

- `lib/ast/shared/types.ts` — `SyncExecution`, `BaseEvent`, `BaseError`.
- `lib/ast/parse/` — sibling module that depends on `TokenEvent` from this
  module. Builds the AST on top.
- `lib/parse-old/` — the legacy single-shot parser. Will be deleted in a
  follow-up PR after `lib/ast/` ships and existing consumers migrate.
- `lib/evaluating/intercept/` — the surface this module's handle mirrors (sync
  vs async; otherwise identical termination protocol, replay semantics,
  PromiseLike handle).
- `lib/evaluating/trace/semantics/` — reference for two-level discriminant
  (`category` + `kind`) and `step` numbering.
