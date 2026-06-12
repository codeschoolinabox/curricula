# lib/classifying

Exhaustive syntax-element classification for a parsed JavaScript snippet. Given
a snippet's source text plus its Acorn token stream and AST, produces one frozen
`ClassifiedToken` per source token: the token's text, its `[start, end)` range,
its **category set** (identifier / keyword / operator / literal / delimiter — a
token may belong to more than one), its **role** (an AST-context refinement,
e.g. _this `(` opens call arguments_ vs _this `(` groups an expression_), and —
for paired delimiters — the index of its **partner** token.

Classification is **total**: every non-empty token in the stream is classified.
Consumers select from the classification; this module never selects, never
blanks, never rolls probabilities, and never mutates its inputs. The category
taxonomy is the house taxonomy established by the blanks lens (ternary `?` / `:`
are delimiters, not operators; generator `*` is a delimiter; template text
chunks are literals).

## Glossary

**Category** — one of the five house syntax-element kinds: `identifier`,
`keyword`, `operator`, `literal`, `delimiter`. The taxonomy is shared vocabulary
across blanks (its five content-type checkboxes) and quizzing (its category
questions).

**Category set** — the ordered, non-empty list of categories a token belongs to,
primary first. Most tokens have exactly one. Overlap tokens carry the full set:
`typeof` is `['keyword', 'operator']`, `null` / `true` / `false` are
`['keyword', 'literal']`, a contextual keyword used as a plain variable name
(`let of = 3`) is `['keyword', 'identifier']`. The primary rule is the one the
blanks lens's locks actually pin: **keyword wins primary wherever a token also
classifies under an AST-derived category**. All span collisions are
keyword-vs-AST: `Identifier`/`Literal` node coverage, and `UnaryExpression` /
`BinaryExpression` operator positions (`typeof x`, `a in b`, `a instanceof B`);
delimiter tokens never collide. With those alternates carried,
selection-by-primary reproduces the legacy dedupe winner and
selection-by-any-match reproduces legacy per-category eligibility. Every
category a token carries is keyed to that token's `[start, end)` span;
AST-derived categories attach to the token whose span they fall within.

**Home category / alternate / re-bin** — the _home category_ is what the
classification table assigns from the token type alone; it is always primary.
_Alternates_ are AST-derived additional categories appended after it. The
_re-bin_ is the single sanctioned home-category change: generator `*` moves
`operator` → `delimiter`.

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
token label — a deliberate, documented totality improvement (and the one known
behavior delta vs. legacy for blanks: under operators-only configs those
previously-unreachable stars become eligible; irrelevant within JEJ, locked by
the blanks regression suite for JEJ constructs).

## The taxonomy

Categories are assigned **token-stream-first**: every token's category comes
from its Acorn token type via the classification table; the AST contributes only
alternates, roles, and the one re-bin (generator `*`). Each token type has
exactly one home row and the final row is a catch-all, which is what makes
totality provable rather than asserted.

| Token (by Acorn token type)                                                                                                                                 | Category                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| punctuator with a delimiter label (parens, braces, brackets, `;`, `,`, `.`, `=>`, `?`, `:`, `?.`, `...`, backtick, `${`)                                    | `delimiter`             |
| TokenType carrying an operator flag (`binop` / `isAssign` / `prefix` / `postfix`) or the `**` family (`+`, `=`, `===`, `<`, `&&`, `??`, `++`, `!`, `**`, …) | `operator`              |
| token with the `.keyword` flag, or a `name` token in the contextual-keyword set                                                                             | `keyword`               |
| `name` / `privateId` token (not contextual-keyword)                                                                                                         | `identifier`            |
| `num` / `string` / `regexp` / non-empty `template` token                                                                                                    | `literal`               |
| anything else                                                                                                                                               | `delimiter` (catch-all) |

Token-derivable **role seeds** are assigned in the same token-stream pass
(literal kinds; `statement-end` for `;`; `member-access` for `.` / `?.`;
`template-delimiter` for backticks; `template-expression` for `${`; default
`'other'` or `null`). AST augmentation (second pass, never reassigns the home
category except the named re-bin):

- **Alternates**: a keyword token whose span is covered by an `Identifier` node
  gains `identifier`; by a `Literal` node gains `literal`; in a
  `UnaryExpression` or `BinaryExpression` operator position gains `operator`
  (`typeof`, `void`, `delete`, `in`, `instanceof`).
- **Generator `*` re-bin**: a `*` token in function/method/property generator
  position is re-binned `delimiter` with role `generator` (house taxonomy,
  inherited from blanks). The `*` of `yield*` delegation and of `import * as ns`
  stays `operator` (role `other`).
- **Role refinement**: strictly AST-context work on opener/contextual tokens —
  the `=` split (declarator-init vs assignment), paren roles, block braces —
  from the owning node's kind and the token's position within it.

**Role keying**: `role` refines the **primary** category. Keyword-primary tokens
therefore never carry a literal role (`null` / `true` / `false` are
keyword-primary with `literal` as alternate and `role: null`).

Roles, by category (JEJ-precise for the named consumers' needs; everything else
`'other'`; new roles land with the catalog clusters that need them — widening
the union is a cross-consumer contract event):

- **delimiter**: `call-arguments`, `control-head`, `grouping`, `block`,
  `template-expression`, `template-delimiter`, `statement-end`, `member-access`,
  `generator`, `other`
- **operator**: `binary`, `logical`, `unary`, `update`, `assignment`,
  `declarator-init`, `other`
- **literal**: `number`, `string`, `regexp`, `template-chunk`, `other`
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
- **`}` disambiguation**: Acorn emits one `braceR` token type for block,
  switch-body, and template-expression closers. The pairing pass assigns the
  closer the role of its opener (`block`, `template-expression` for a `${`
  partner, or the opener's `other` until finer brace roles land).
- **Contextual keywords as plain names**: `of`, `get`, `set`, `from`, `as`,
  `async`, `await`, `yield`, `let`, `static` classify as `keyword` (primary)
  wherever they appear — including positions where the parser treats them as
  identifiers (`let of = 3`). There they carry `identifier` as an alternate.
  This preserves the blanks lens's locked, intentionally false-positive behavior
  (see `lenses/blanks/tests/blankenate.test.ts` § contextual keywords) while
  letting precision-needing consumers detect the overlap from the category set.
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
