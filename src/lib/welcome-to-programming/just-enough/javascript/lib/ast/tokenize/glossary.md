# `lib/ast/tokenize/` — Ubiquitous Language

The vocabulary established here propagates into every function signature,
type name, test description, error message, and JSDoc comment in the
tokenize module. Names from this glossary are load-bearing — using a
different name in code is a bug, not a stylistic choice.

This module is the **base layer** of `lib/ast/`. It depends on `acorn`
and `lib/ast/shared/`. It does NOT depend on `lib/ast/parse/` (the
direction is reversed: `parse/` depends on this module's `TokenEvent`
type for its own interleaved token+node stream).

## Domain terms

| Term                      | Definition                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **token**                 | A single lexical unit produced by acorn's tokenizer. Each token has a type (acorn's `TokenType`), a `value` (the token's text), `start`/`end` (char positions), and a `loc` (line/column). Whitespace is implicit between tokens; it is not a token.                                                                                                                            |
| **comment**               | Source text starting with `//` (Line comment) or enclosed in `/* */` (Block comment). Acorn does NOT emit comments through the token stream; they are delivered via the `onComment` callback. We surface them as their own event type, distinct from tokens.                                                                                                                    |
| **token event**           | A yielded event signaling a token was produced. Outer category `'token'`; inner `kind` is acorn's `TokenType.label` (`'name'`, `'num'`, `'string'`, `'regexp'`, `'template'`, `'punc'`, …). Carries `text`, `start`, `end`, `loc`, plus the `BaseEvent` fields (`step`, `prev`, `next`).                                                                                         |
| **comment event**         | A yielded event signaling a comment was encountered. Outer category `'comment'`; inner `kind` is `'Line'` or `'Block'`. Carries `text`, `start`, `end`, `loc`, plus `BaseEvent` fields.                                                                                                                                                                                          |
| **tokenize error**        | A tokenization-time `SyntaxError` thrown by acorn (unterminated string literal, illegal escape, invalid regex flag, …). Caught by the engine and reified as data; never thrown to the consumer. Carries `kind: 'tokenize'`, plus acorn's `name`/`message`/`line`/`column`.                                                                                                       |
| **tokenize error event**  | The yielded event carrying a tokenize error. Always the last event before the run settles. Outer category `'tokenize-error'`.                                                                                                                                                                                                                                                    |
| **tokenize handle**       | The consumer-facing object returned by `createTokenizeGenerator(code, options?)`. Composes `Iterable<TokenizeEvent>`, `PromiseLike<TokenizeResult>`, plus `.cancel()`, `.fail(reason?)`, `.code`, `.options`, `.result`. Settle once, then replay yields the same event references.                                                                                              |
| **tokenize result**       | The settled artifact returned by awaiting the handle. Frozen. Carries `code`, `events` (the yielded event stream including comments and any error event), `outcome`, plus `error?` / `reason?` slots.                                                                                                                                                                          |
| **tokenize outcome**      | First-write-wins discriminator on the result: `'complete'` (acorn reached EOF naturally), `'cancel'` (consumer called `.cancel()`), `'fail'` (consumer called `.fail(reason)`), `'tokenize-error'` (acorn threw a `SyntaxError` mid-tokenization). Termination metadata never appears as an event. (No catch-all `'error'` outcome — sync tokenize has no async/Worker machinery to fail mid-stream.) |
| **category**              | Outer discriminant on the yielded event union: `'token'` \| `'comment'` \| `'tokenize-error'`. Mirrors `trace/semantics/`'s `category` convention. The first thing every consumer switches on.                                                                                                                                                                                  |
| **kind**                  | Inner discriminant within a category. For `'token'`: acorn's `TokenType.label`. For `'comment'`: `'Line'` \| `'Block'`. For `'tokenize-error'`: a literal `'tokenize'` (single-kind category — the category itself is the discriminant for routing, `kind` exists only for shape consistency with the rest of the union).                                                       |
| **step**                  | 1-indexed contiguous sequence number on each event. `result.events[i].step === i + 1`. Inherited from `BaseEvent`. Matches intercept and trace/semantics for cross-tool consistency.                                                                                                                                                                                            |
| **acorn tokenizer**       | The underlying API: `acorn.tokenizer(code, options)` returns a JS iterator over tokens. Supports an `onComment` option for separate comment delivery. The single source of tokenization truth — we do not implement a tokenizer; we wrap acorn's.                                                                                                                                |
| **EOF token**             | Acorn emits a final token with `type.label === 'eof'`. We surface this as a normal TokenEvent with `kind: 'eof'` so consumers see a clear termination marker in the stream.                                                                                                                                                                                                      |
| **termination cause**     | The single-source-of-truth slot, set by exactly one of: natural completion (EOF reached), consumer cancel, consumer fail, or tokenize-error. First-write-wins; later triggers are ignored. Read at settle time to classify `outcome`. Never appears as an event in the stream — it's metadata on the result. Mirrors intercept's unified termination protocol.                  |
| **held-comments slot**    | The state holding comments delivered by acorn's comment callback that have not yet been positioned in the event stream. Drained in source-position order each time a token is pulled, before that token's event is yielded. Internal to the engine; not exposed on the result.                                                                                                  |
| **captured events**       | The ordered collection of events that have been yielded so far in a run. Threaded through the engine across phases; becomes `result.events` after the chain is wired and the result is frozen. Reference identity preserved across live iteration, settle, and replay.                                                                                                          |

## Synonyms resolved

- "lex" / "scan" / "tokenize" → **tokenize** (we use this verb consistently)
- "lexeme" / "token text" / "raw" → **text** (the token's source substring)
- "position" / "offset" / "index" → **start** and **end** (char indices into the source)
- "type" (in the acorn-token sense) → **kind** (we rename to avoid collision with TS's `type` keyword and to align with the codebase's two-level discriminant pattern)

## Out of scope (terms that belong elsewhere)

- **AST node**, **node-enter**, **node-exit**, **role-in-parent** → `lib/ast/parse/`'s domain.
- **scope**, **binding**, **resolve** → runtime concepts; live in `lib/evaluating/trace/semantics/`.
- **JEJ subset**, **validation rule**, **violation** → `lib/validating/`'s domain.
- **trap**, **wrap**, **nodePath** → `lib/evaluating/intercept/`'s domain.
- **format check**, **prettier-equivalent** → `lib/formatting/`'s domain.
