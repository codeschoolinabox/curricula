# lib/classifying

Exhaustive syntax-element classification for a parsed JavaScript snippet. Given
a snippet's source text plus its Acorn token stream and AST, produces one frozen
`ClassifiedToken` per source token: the token's text, its `[start, end)` range,
its **category** (identifier / keyword / operator / literal / delimiter —
semantic, by what the element does in the NM, not by Acorn's lexer flag), its
**role** (an AST-context refinement, e.g. _this `(` opens call arguments_ vs
_this `(` groups an expression_), and — for paired delimiters — the index of its
**partner** token.

Classification is **total**: every non-empty token in the stream is classified.
Consumers select from the classification; this module never selects, never
blanks, never rolls probabilities, and never mutates its inputs. The category
taxonomy is the house taxonomy established by the blanks lens (ternary `?` / `:`
are delimiters, not operators; generator `*` is a delimiter; template text
chunks are literals).

## Glossary

**Category** — one of the five house syntax-element kinds, defined by what the
element DOES in the notional machine, not by Acorn's lexer:

- `identifier` — names a binding (references/stores a value)
- `keyword` — marks a statement, declaration, or control structure that directs
  the NM; it neither transforms data nor produces/references a value
- `operator` — transforms operands / produces a value
- `literal` — is a value
- `delimiter` — structural punctuation

The decisive consequence: **a reserved word is not automatically a keyword.**
`typeof` / `in` / `instanceof` / `void` / `delete` produce values → operators;
`null` / `true` / `false` are values → literals — even though Acorn flags all of
them `.keyword`. True keywords are `if`, `else`, `while`, `for`, `const`, `let`,
`function`, `return`, … The taxonomy is shared vocabulary across blanks (its
five content-type checkboxes) and quizzing (its category questions).

**Category set** — the `categories` array, primary first. Under the semantic
taxonomy most tokens settle to exactly one category once context is known;
`categories` stays an array because a few tokens are genuinely context-dependent
(a contextual keyword like `of` is the for-of keyword in `for (x of …)` but an
identifier in `let of = 3` — disambiguated by the AST), and whether any token is
ever simultaneously multi-category is settled in the alternates increment. Every
category a token carries is keyed to that token's `[start, end)` span.

**Home category / re-bin** — the _home category_ is what the classification
table assigns from the token type; in increment 1 it is the whole (single-entry)
`categories` array. The _re-bin_ is the single sanctioned home-category change:
generator `*` moves `operator` → `delimiter` (an AST pass).

**Role** — a finer, AST-context-dependent refinement within a category. Roles
answer "what is this token doing HERE": the same `(` text is `call-arguments` in
`Math.max(a, b)`, `control-head` in `while (x < 3)`, and `grouping` in
`(a + b) * c`. Roles are precise for JEJ-level constructs and fall back to
`'other'` beyond JEJ — categories are total over full JavaScript, roles are
total via the fallback.

**Partner** — for paired delimiters (`(`/`)`, `[`/`]`, `{`/`}`, `` ` ``/
`` ` ``, `${`/`}`), the index (into the returned array) of the other half of the
pair. Pairing is what disambiguates a `}` that closes a block from a `}` that
closes a template expression (Acorn gives both the same `braceR` token), and it
is the ground truth for "click this brace's matching partner" exercises.

**Totality** — the invariant that every token Acorn emits for the snippet
(excluding `eof` and zero-length template chunks) appears exactly once in the
output with a non-empty category set. Totality is provable from the
classification table below: every token type has exactly one home row, and the
final row is a catch-all. Exotic constructs the legacy walk silently skipped
(the `*` in `import * as ns`, the `*` in `yield* g()`) classify as `operator` by
token type — a deliberate totality improvement.

**Behavior deltas vs. legacy blanks** (the semantic taxonomy reclassifies what
acorn's `.keyword` flag conflated; the blanks refactor adopts the corrected
categories rather than preserving legacy): `typeof` / `in` / `instanceof` /
`void` / `delete` move keyword → operator; `null` / `true` / `false` move
keyword → literal; the previously-skipped stars become operators. So a learner
filtering blanks by "keywords" no longer blanks `typeof`; by "operators" now
does — the corrected, more accurate behavior.

## The taxonomy

Categories are assigned **token-stream-first**: every token's category comes
from its Acorn token type via the classification table; the AST contributes only
roles and the one re-bin (generator `*`). The rows are tried in order — **first
match wins** — and the final row is a catch-all, which is what makes totality
provable rather than asserted. Two precedences are load-bearing, both because
Acorn's `.keyword` flag is broader than the semantic keyword category:

- **operator and literal before keyword** — the reserved-word operators
  (`typeof`, `in`, `instanceof`, `void`, `delete`) and reserved-word literals
  (`null`, `true`, `false`) carry `.keyword` but are categorized by what they
  do, so their token-type sets are checked first.
- **keyword before identifier** — contextual keywords (`let`, `of`, `as`, …) are
  emitted as bare `name` tokens, so the keyword row must precede the identifier
  row or they would classify as identifiers.

| Token (first matching row wins)                                                                                                                                                                                                           | Category                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| delimiter punctuator (parens, braces, brackets, `;`, `,`, `.`, `=>`, `?`, `:`, `?.`, `...`, backtick, `${`)                                                                                                                               | `delimiter`             |
| an operator token type (`=` and compound assigns, `++`/`--`, `!`/`~`, `&&`/`\|\|`/`??`, comparison / arithmetic / bitwise / shift families, `*` `/` `**` `%`, and the reserved-word operators `typeof` `in` `instanceof` `void` `delete`) | `operator`              |
| a literal token type (`num`, `string`, `regexp`, non-empty `template`, and the reserved-word literals `null` `true` `false`)                                                                                                              | `literal`               |
| has a `.keyword` flag, or a `name` token whose text is a contextual keyword (`let`, `of`, `as`, `from`, `get`, `set`, …)                                                                                                                  | `keyword`               |
| `name` / `privateId` token (not a contextual keyword)                                                                                                                                                                                     | `identifier`            |
| anything else                                                                                                                                                                                                                             | `delimiter` (catch-all) |

Token-derivable **role seeds** are assigned in the same token-stream pass
(literal kinds incl. `null`/`boolean`; `statement-end` for `;`; `member-access`
for `.` / `?.`; `template-delimiter` for backticks; `template-expression` for
`${`; default `'other'` or `null`). AST augmentation (second pass) never
reassigns the home category except the generator re-bin:

- **Generator `*` re-bin**: a `*` token in function/method/property generator
  position is re-binned `delimiter` with role `generator` (house taxonomy,
  inherited from blanks). The `*` of `yield*` delegation and of `import * as ns`
  stays `operator` (role `other`).
- **Role refinement**: strictly AST-context work on opener/contextual tokens —
  the `=` split (declarator-init vs assignment), paren roles, block braces —
  from the owning node's kind and the token's position within it.

**Role keying**: `role` refines the token's category.

Roles, by category (JEJ-precise for the named consumers' needs; everything else
`'other'`; new roles land with the catalog clusters that need them — widening
the union is a cross-consumer contract event):

- **delimiter**: `call-arguments`, `control-head`, `grouping`, `block`,
  `template-expression`, `template-delimiter`, `statement-end`, `member-access`,
  `generator`, `other`
- **operator**: `binary`, `logical`, `unary`, `update`, `assignment`,
  `declarator-init`, `other`
- **literal**: `number`, `string`, `boolean`, `null`, `regexp`,
  `template-chunk`, `other`
- **identifier**, **keyword**: no finer roles — `role` is `null`. (Identifier
  usage analysis — read vs assign, binding resolution — is scope-aware work that
  belongs to consumers with scope context, not to token classification.)

## What lives here

```text
lib/classifying/
  README.md             (this — orientation + taxonomy + public API)
  DOCS.md               architectural sketch + Mermaid data flow
  types.ts              Category, Role, ClassifiedToken, ClassifyInput
  classify-tokens.ts    the single public export
  tests/
    classify-tokens.test.ts
```

## Public API

```ts
import classifyTokens from './classify-tokens.js';

const classified: readonly ClassifiedToken[] = classifyTokens({
	code, // snippet source text
	tokens, // Acorn token stream (Snippet.raw.tokens)
	ast, // Acorn Program (Snippet.raw.ast)
});
```

`ClassifyInput` is declared in **acorn terms**
(`tokens: readonly acorn.Token[]`, `ast: acorn.Node`) — that is what the
classifier actually walks. A parsed `Snippet` carries these values on
`source.code`, `raw.tokens`, and `raw.ast` (see
[`../../embody/types.ts`](../../embody/types.ts) § RawAcorn, where they are
typed loosely as `unknown[]`/`AcornNode`), so the `Snippet → ClassifyInput`
narrowing is the caller's one-line cast at the boundary; tests may equally
construct inputs with a direct `acorn.parse` call.

The function **throws** on missing or null inputs. This deliberately diverges
from `../completing/`'s never-throw posture: the editor-callback adapters must
degrade gracefully inside CodeMirror's render loop, whereas classifying is
called only behind a `status.parsed` gate (or a successful local parse) — null
inputs here are a caller bug to surface, not a runtime state to absorb.

Behavior:

- **Total and source-ordered.** One `ClassifiedToken` per non-empty token,
  ascending by `start`. Ranges are zero-indexed half-open `[start, end)` into
  `code`; `text === code.slice(start, end)` always (the source slice is
  authoritative — never Acorn's processed `value`).
- **Pure.** No mutation of `tokens`, `ast`, or `code` — safe on deep-frozen
  embodiment data. (The legacy blanks walk wrote synthetic `.operator` fields
  onto AST nodes; this module never does.)
- **Frozen.** The returned array and every element are deeply frozen.
- **Deterministic.** Same inputs, same output. No randomness, no config —
  filtering and sampling are consumer concerns.

## Edge cases

- **Zero-length template chunks** (the empty span between adjacent
  interpolations in `` `${a}${b}` ``) are dropped — a zero-width element can be
  neither blanked nor clicked.
- **`invalidTemplate` chunks** — the template chunk Acorn emits for an illegal
  escape in a tagged template (`` tag`\unicode` ``, which still parses) classify
  as `literal` with role `template-chunk`, the same as a normal chunk; they are
  not a parse failure.
- **`}` disambiguation**: Acorn emits one `braceR` token type for block,
  switch-body, and template-expression closers. The pairing pass records mutual
  `partner` indices that tell them apart — a `}` partnered with a `${` closes a
  template expression; partnered with a `{`, a block. A closer then inherits its
  opener's final role via that link: a block `}` is `block`, a switch/object `}`
  is `'other'`, a closing backtick is `template-delimiter`, and a `)` inherits
  its `(`'s role (`call-arguments` / `control-head` / `grouping` / `'other'`).
- **Parameter-list parens**: the `(` of a function / arrow / method parameter
  list is `'other'` — JEJ assigns it no finer role, but its owning node still
  _claims_ it so that `grouping`-by-elimination stays sound; an unclaimed
  function paren would wrongly read as a grouping expression. Dynamic
  `import(...)` is outside the claim list, so its `(` is `grouping` (JEJ does
  not use dynamic import).
- **Reserved-word operators and literals**: `typeof` / `in` / `instanceof` /
  `void` / `delete` classify as `operator` and `null` / `true` / `false` as
  `literal`, by what they do — not as `keyword`, even though Acorn flags them
  `.keyword`. (`in` is also an operator inside `for (… in …)`, where it is
  statement glue; disambiguating that needs the AST and is out of JEJ scope.)
- **Contextual keywords as plain names**: `of`, `get`, `set`, `from`, `as`,
  `async`, `await`, `yield`, `let`, `static` classify as `keyword` wherever they
  appear — including positions where the parser treats them as identifiers
  (`let of = 3`). By the semantic taxonomy `of`-as-a-variable should be
  `identifier`; distinguishing it from for-of `of` needs the AST, so the
  token-stream pass leaves it `keyword` for now (a deferred refinement, flagged
  for the AST increment).
- **Open rulings (flagged, low priority — all outside JEJ except `new`)**: `new`
  (`new Date()` produces a value, leans `operator`), `this` / `super` (reference
  values, so not keywords by the definition, but identifier-vs- operator is
  unsettled), and `yield` / `await` keep their provisional `keyword` home
  pending a ruling.
- **Comments are not tokens** and do not appear in the output. (They live on
  `Snippet.raw.comments`; classifying them is out of scope.)
- **Regex literals** are one `regexp` token: one `literal` element; the slashes
  are not separate delimiters. (Acorn's tokenizer already disambiguates
  regex-start `/` from division by parse context; this module never re-derives
  that.)

## Consumers

- **`lenses/blanks`** — derives blank eligibility by filtering classified tokens
  on the learner's enabled content types (any-match over the category set), then
  applies its own probability roll and placeholder replacement.
- **`lib/quizzing`** — derives quiz anchors and category/role ground truth for
  the quiz lens's generated questions ("what kind of element is this?", "what
  role do these parentheses play?", "click this brace's partner").

The input asymmetry between the two `lib/` siblings is deliberate: quizzing
takes a whole `Snippet` (it reads scope and analysis surfaces too), while
classifying takes three narrow values — it underlies any Snippet-shaped consumer
and must not assume one.

## Why this module exists

Token classification originated inside the blanks lens
([`../../lenses/blanks/lib/blankenate.ts`](../../lenses/blanks/lib/blankenate.ts)),
entangled with blank selection: the legacy walk rolled probabilities during
classification, skipped everything a roll or config excluded, and mutated AST
nodes en route. The quiz lens's question generator is a second consumer that
needs the classification (and only the classification) — exhaustive, pure, and
reusable. Per the extraction rule (new file at 2+ call sites) the classification
core was raised to the JEJ-peer `lib/` tier, where any peer can consume it
without an upward dependency (same rationale as
[`../completing/`](../completing/README.md) § Why this module exists).

The split of responsibilities is strict: **classifying describes; consumers
select.** Blank probability, content-type filtering, quiz-item generation, and
mastery bookkeeping all stay with their owners.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.fable.md` /
`DEV.md`. Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **No `embody()`, no `Snippet` construction.** The module consumes the raw
  parse shapes by value; it never imports `embody/` (top) or constructs
  embodiments. Type-only imports from `embody/types.ts` are fine.
- **No AST mutation.** Inputs may be deep-frozen; the module must work unchanged
  on frozen data.
- **Source-slice authority.** `text` always comes from `code.slice(...)`, never
  from Acorn's `.value` / `.keyword` strings (quote-stripping and coercion make
  those unfaithful to the source).
- **Taxonomy changes are cross-consumer events.** The five categories and the
  role unions are shared vocabulary with blanks and quizzing; widening or
  re-binning them is an inter-module contract change, not a local edit.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Prior art (legacy, selection-entangled):**
  [`../../lenses/blanks/lib/blankenate.ts`](../../lenses/blanks/lib/blankenate.ts)
  and its behavior locks in
  [`../../lenses/blanks/tests/blankenate.test.ts`](../../lenses/blanks/tests/blankenate.test.ts).
- **Input shapes:** [`../../embody/types.ts`](../../embody/types.ts) § RawAcorn.
- **Sibling adapters:** [`../completing/README.md`](../completing/README.md),
  [`../documenting/README.md`](../documenting/README.md),
  [`../linting/README.md`](../linting/README.md),
  [`../formatting-editor/README.md`](../formatting-editor/README.md).
