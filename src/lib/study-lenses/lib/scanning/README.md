<!-- cspell:ignore Punctuator Punctuators IdentifierName PrivateIdentifier -->
<!-- cspell:ignore NumericLiteral StringLiteral RegularExpressionLiteral -->
<!-- cspell:ignore TemplateSubstitutionTail CommonToken DivPunctuator LineTerminator -->
<!-- cspell:ignore RightBracePunctuator OtherPunctuator OptionalChainingPunctuator -->
<!-- cspell:ignore NoSubstitutionTemplate TemplateHead TemplateMiddle TemplateTail -->
<!-- cspell:ignore HashbangComment InputElementDiv InputElementRegExp tokenizer -->
<!-- cspell:ignore retokenize lookaheads spellme ZWNBSP -->

# lib/scanning

Turns a snippet's token stream back into the sequence the language specification
describes: **input elements**, tiling the source exactly, in the specification's
own vocabulary.

The parser this package uses hands back a token array and a comment array. That
pair is faithful to the parser and is not a partition of anything — it skips
whitespace entirely, it splits one template literal across three tokens, and it
can emit tokens of zero width. This module reads those published facts and
returns the reading the specification would have produced: one element per span,
covering `[0, source.length)` with no gaps, no overlaps, and nothing of zero
width.

Every rule here is a **minimal transformation of published data** — range
arithmetic, a naming table read against the source slice, and two one-token
lookaheads. Nothing re-tokenizes, nothing re-parses, and nothing infers.

## Glossary

**Every section number below is ECMA-262, 15th edition (ES2024)** — the edition
this package's parser targets. The numbering is not stable across editions and
it moved exactly where this module cites it: `HashbangComment` was inserted as
§12.5 in ES2023, pushing Tokens to §12.6, Names and Keywords to §12.7 and
Punctuators to §12.8. A reader who opens an earlier edition at these numbers
lands on different productions.

**Input element** — what the scanner produces on one turn, per the goal symbols
defined in clause 12's preamble. Fourteen kinds exist across all goal symbols,
and this module publishes all of them:

| Kind                       | Reaches                              |
| -------------------------- | ------------------------------------ |
| `IdentifierName`           | `x`, `count`, **and every keyword**  |
| `PrivateIdentifier`        | `#count`                             |
| `Punctuator`               | `=`, `(`, `;`, `++`, `=>`, `?.`      |
| `DivPunctuator`            | `/`, `/=`                            |
| `RightBracePunctuator`     | `}` outside a template               |
| `NumericLiteral`           | `1`, `0x1f`, `1_000`                 |
| `StringLiteral`            | `'hi'`, `"hi"`                       |
| `Template`                 | `` `a` ``, `` `a${ ``                |
| `TemplateSubstitutionTail` | `}b${`, `` }b` ``                    |
| `RegularExpressionLiteral` | `/ab+c/gi`                           |
| `Comment`                  | `// …`, `/* … */`                    |
| `HashbangComment`          | `#!…` at offset 0 only               |
| `WhiteSpace`               | a run of space, tab, NBSP, ZWNBSP, … |
| `LineTerminator`           | a run of LF, CR, U+2028, U+2029      |

**Element kind** — which of the fourteen productions an element is, and the term
this module uses in prose and in its published field. Never bare "kind": the
package glossary already owns that word for a **kind of study utility** (lens
kind, evaluator kind), and one word for two unrelated things is the homonym a
glossary exists to prevent. The sibling leaf
[`../classifying/`](../classifying/README.md) publishes **syntax-element**
categories over the same tokens — a different taxonomy with a different extent,
so "element" alone is ambiguous across the two and both modules say which they
mean.

**Goal symbol** — which question the scanner was asked before it read. The
specification defines several, and the answer changes what the same characters
become. The parser does not publish which one was in force; it is recoverable
from the element kind, which is § Corollary below and this module's sharpest
reason to exist.

**Template chunk** — the text run between a template's delimiters, as the parser
emits it. **Two token types carry it**, not one (see § The two lookaheads), and
both lookaheads test for it.

**Trivia** — the elements that are not tokens: `WhiteSpace`, `LineTerminator`,
`Comment`, `HashbangComment`. They wrap no parser tokens, they exist here only
because tiling demands it, and they are the join between this module and a
consumer's own advance rules.

**Source-slice authority** — the rule that the verbatim slice of the source, and
never the parser's processed value, is what this module publishes and what its
naming rule consults when a parser type is ambiguous.

**Run collapsing** — the specification makes each whitespace character its own
input element, and `<CR><LF>` two line terminators. This module publishes a
maximal run of `WhiteSpace` as one element and a maximal run of `LineTerminator`
as one, and never merges the two kinds. This is the module's **one departure
from the specification**, taken so the sequence is usable by a surface that
draws it; it is stated at the field in `types.ts` and every consumer inherits
it. **The specification's own reading is recoverable** — split a run's text per
character and the per-character elements come back — so this is a projection a
consumer can undo, not information the module destroyed.

**Tiling** — the invariant that makes this module worth having: the returned
elements are ascending, non-overlapping, non-empty, and their spans join to
cover `[0, source.length)` exactly. A consumer may walk the array and know it
has seen every character once.

## The vocabulary is the specification's, not the parser's

The vocabulary is ECMA-262's, not the parser's labels and not
[`../classifying/`](../classifying/README.md)'s notional-machine taxonomy (human
ruling 2026-08-13). The parser's token labels are its own debugging strings, not
names: its label for the `??=` token type is `_=`, and its label for `>=` is the
whole family `</>/<=/>=`. This module maps them to the productions ECMA-262
actually defines.

Two consequences a consumer should expect, because both look wrong at first:

**Every keyword is an `IdentifierName`.** §12.6 gives
`CommonToken :: IdentifierName | PrivateIdentifier | Punctuator | NumericLiteral | StringLiteral | Template`
— there is no `ReservedWord` arm. `ReservedWord` (§12.7.2) is an enumerated
subset of `IdentifierName` that the **syntactic** grammar consults. So `if`,
`while`, and `const` are `IdentifierName`s here — and so are `null`, `true` and
`false`, which are `ReservedWord`s too and therefore **not** literals at this
level, however much they look like values.

**That is the naming rule's largest row, and it is a many-to-one collapse.** The
parser gives **each** reserved word its own token type — thirty-five of them,
`break` through `delete`, `this` and `super` among them — and every one of those
types names the same production here. A naming rule built one type at a time
will be mostly this collapse.

**The contextual keywords arrive already collapsed, which makes them the wrong
example.** `let`, `async`, `of`, `yield`, `await`, `get`, `set`, `static`,
`from` and `as` are not reserved words, so the parser types them as plain
identifiers and no correction is needed. A reader — or a lens — demonstrating
"every keyword is an `IdentifierName`" with `let` demonstrates nothing: that is
the one family where the parser already agrees. `if` and `const` are where the
claim has teeth.

> This is the sharpest place where this module and
> [`../classifying/`](../classifying/README.md) disagree on purpose. Classifying
> bins `null` / `true` / `false` as `literal` and `typeof` as `operator`, by
> what each does in the notional machine. This module reports what the lexical
> grammar matched. Same tokens, two phases of the program's life, two true
> answers — a consumer that needs one must not reach for the other.

**`/`, `/=` and `}` are not `Punctuator`.** §12.8 gives
`Punctuator :: OptionalChainingPunctuator | OtherPunctuator`, and
`OtherPunctuator` enumerates every punctuator by hand without those three. Each
has its own production, and the specification explains why in its own voice:
_"The DivPunctuator, RegularExpressionLiteral, RightBracePunctuator, and
TemplateSubstitutionTail productions derive additional tokens that are not
included in the CommonToken production."_ They are separated because the scanner
is asked **which goal symbol** before it reads.

**And `DivPunctuator` cannot be reached from the token type at all.** The parser
gives **one** token type to every compound assignment: `/=` shares it with `+=`,
`**=` and `??=`, under the debugging label `_=`. So the naming rule is not a
pure type lookup. Where one parser type serves several productions the **source
slice decides**, and `/=` is separated from its type-mates by reading the
characters its own span already points at. That is not a second reading of the
source in the sense the no-re-tokenizing rule forbids — it is this module's
source-slice authority, the same rule that makes the verbatim slice and not the
parser's processed value the published truth.

**Corollary, and the reason this module is worth extracting:** the goal symbol
the scanner was asked is not published anywhere, but it is recoverable from the
kind. A `DivPunctuator` means `InputElementDiv` was asked; a
`RegularExpressionLiteral` means `InputElementRegExp` was; a
`TemplateSubstitutionTail` means a template-tail goal was. The same character
under a different question is a different element, and this sequence is where
that becomes visible.

## The two lookaheads

Everything else is arithmetic or a table. These two are the only rules that read
more than one token, and both read exactly one more.

**What counts as a template chunk — two token types, not one.** A tagged
template may carry an escape sequence the language permits only under a tag, and
the parser types that chunk **differently** from an ordinary one rather than
refusing the program. Both rules below ask "is the successor a template chunk",
so both admit both types. Reading only the ordinary type is not a cosmetic
mis-naming: the `}` before such a chunk is then reported as a
`RightBracePunctuator`, and the template's closing backtick is left opening a
run whose closer never arrives.

**Template folding.** A backtick, or a `}` that is a template continuation,
opens a run: `opener · template chunk · closer`, where the closer is `${` or a
backtick. The run becomes one element — `Template` when the opener is a
backtick, `TemplateSubstitutionTail` when it is a `}`. Nesting needs no stack:
each run is closed by its own closer before any inner run opens.

**Each of those two kinds covers two of the specification's productions**, and a
consumer that surfaces them to a reader should expect the question. `Template`
is `NoSubstitutionTemplate` (`` `a` ``) and `TemplateHead` (`` `a${ ``);
`TemplateSubstitutionTail` is `TemplateMiddle` (`}b${`) and `TemplateTail`
(`` }b` ``). The pairs are distinguished only by which closer ended the run, and
this module publishes the two-kind reading because that is the level the goal
symbols are asked at.

**`}` disambiguation.** A `}` whose immediate successor is a template chunk is a
template continuation; every other `}` is a `RightBracePunctuator`. This is
exact because the parser only ever emits a template chunk directly after a
backtick or after a continuation `}`. (`../classifying/` answers the same
question with a balanced stack walk and an AST; one lookahead suffices here, and
needs no tree — which is what lets this module serve a program that lexes but
does not parse.)

## What lives here

```text
lib/scanning/
  README.md          (this — orientation, vocabulary, the two lookaheads)
  DOCS.md            architectural sketch + Mermaid data flow
  types.ts           InputElementKind, InputElement, ScanInput
  derive-input-elements.ts   the single public export
  tests/
```

The fold, the naming and the gap split are **hoisted helpers inside the public
export**, not files of their own. Each has exactly one call site, and this
package extracts to a new file only at two or more; the sibling that runs five
phases through a single file states the same rule for itself. If readability
ever forces a split, the tier's precedent is flat siblings beside the export.
Two leaves on this tier do nest a directory — one holds a sub-module with its
own README, the other a worker — but neither nests a helper bag, and none is
named for the tier it already sits on.

## Public API

```ts
import deriveInputElements from './derive-input-elements.js';

const elements: readonly InputElement[] = deriveInputElements({
	code, // facts.source.value
	tokens, // facts.tokens.value.tokens
	comments, // facts.tokens.value.comments
});
```

`ScanInput` is declared in the parser's own terms — that is what this module
walks. Since the embody integration (human rulings 2026-08-17 and 2026-08-18), a
consumer holding an `Embodiment` does not call this module at all: the factory
calls it once per settle and publishes the result at
`facts.tokens.value.inputElements`, with the input-coherence precondition closed
by construction. Direct calls remain for tests and for callers outside the
embodiment's reach; such a caller projects the three values behind a
successful-tokens check — its one-line boundary, never this module's concern.

The function **throws** on missing or null input. Deliberate: it is called only
behind a `facts.tokens.ok` gate, so a null here is a caller bug to surface, not
a runtime state to absorb.

Each element carries its kind, its half-open `[start, end)` span, its verbatim
source slice, and **the indices of the parser tokens it wraps** — positions in
the very `tokens` array the caller passed in, so a consumer that needs more than
this module offers indexes back into what it already holds. Trivia elements wrap
no tokens.

**Indices rather than token references, deliberately** (human ruling
2026-08-14). An acorn token's type field is a **process-global singleton shared
by every parse in the process**, so an element holding a token by reference
cannot also be deeply frozen without reaching outside this module and freezing
the parser's own tables — a defect embody hit first and guards against by name.
Indices are numbers: they freeze, they serialize, they survive `postMessage`,
and they keep the reach-past-me escape hatch intact. It is also the rule this
package already states for foreign objects generally, and the shape
[`../classifying/`](../classifying/README.md) already uses for its partner
links.

**The index is into the input stream**, not into this module's output, and that
is what makes it a **join key**: two derivations over the same token array can
be composed on it. A consumer that needs both this module's tiling and
classifying's semantic categories — a colorizer is the obvious one — has no
other way to line them up, because neither output array is one-to-one with the
tokens.

## Behavior

- **Total and tiling**, for any coherent reading (see § Where this module and
  the specification part ways). Ascending, non-overlapping, non-empty, covering
  `[0, source.length)` exactly. `text === code.slice(start, end)` always — the
  source slice is authoritative, never the parser's processed value.
- **Pure.** No mutation of any input; safe on deep-frozen embodiment data, and
  it never freezes anything it did not build.
- **Frozen.** The returned array and every element are deeply frozen — which is
  a promise this module can actually keep, because everything it publishes is a
  string or a number.
- **Deterministic.** Same inputs, same output. No config, no randomness — a
  consumer filters and selects; this module only describes.
- **Tree-free.** Reads no syntax tree, so it serves a program that lexes but
  does not parse.

## Edge cases

- **Empty source** — the empty array.
- **Only whitespace, or only a comment** — one or more trivia elements; no
  `CommonToken` at all.
- **Zero-width template chunks** — the parser emits one wherever a template has
  no text at a chunk position, which is **three** positions in `` `${a}${b}` ``:
  before the first interpolation, between the two, and after the last. The fold
  absorbs all of them into their runs, so nothing zero-width is ever published.
  A fixture set built only from the between-interpolations case misses two
  thirds of the shape.
- **A tagged template carrying a tag-only escape** — the parser types that chunk
  differently from an ordinary one rather than refusing the program (see § The
  two lookaheads). Both the fold and the `}` rule admit both types; admitting
  only the ordinary one mis-names the preceding `}` and then runs off the end of
  the token array looking for a closer.
- **Hashbang** — the parser reports `#!…` on the comment channel typed as a line
  comment, which is wrong: the specification gives `HashbangComment` its own
  production, legal at offset 0 only. **Position alone does not identify it**,
  and this is the trap: a program opening with `// x` also produces a line
  comment starting at offset 0. The rule is position **and** the opening
  characters — a comment at offset 0 whose source begins with the hashbang
  sequence — and nothing else is corrected. **The published fact it corrects is
  a defect recorded upstream**; when that is fixed, this correction becomes a
  no-op rather than a conflict.
- **`<CR><LF>`** — one `LineTerminator` element, not two (see § run collapsing).
- **A parser that refuses the source** — not this module's case. The caller
  gates on the tokens stage first.

## Where this module and the specification part ways

Three places. A module that re-words the machine's reading in the
specification's terms owes an account of where its reading is not the
specification's.

**Whitespace runs are collapsed** — see the glossary entry. The specification
makes each character its own element; this module publishes maximal runs, so a
consumer drawing the sequence has spans it can render. Nothing else here departs
on purpose.

**The parser mis-reads a slash after `await`.** In
`async function f(){ await /re/ }` the tokenizer emits `/`, `re`, `/` where the
language has one `RegularExpressionLiteral` — its context tracking re-opens the
regular-expression goal after `of` and `yield` but not after `await`. The
sequence this module returns is therefore wrong on that input, and it cannot
detect it: the tokens it is handed carry no sign of the mistake. Programs put in
front of a consumer of this module should not contain it.

**Tiling survives that, and the distinction is load-bearing.** The three
elements returned there cover, contiguously, exactly the span the one correct
element would have — so the tiling invariant holds on an input the module reads
wrongly. That is the general shape: **tiling is a property of the published
sequence, never evidence that the sequence is the specification's.** A consumer
may rely on the invariant for any coherent reading, and must not read it as a
fidelity guarantee.

**"Coherent" is the caller's obligation, and it is the invariant's one
precondition.** The source text, the token array and the comment array must come
from **one reading of one source**. This module checks that they are present,
not that they belong together; hand it tokens from a different source and the
spans will not join. Projecting the three values off one embodiment's facts,
behind one successful-tokens gate, is what satisfies it — which is the whole of
the caller's boundary.

**The parser refuses some programs the language accepts, so this module never
sees them.** A reserved word spelled with a Unicode escape — `\u0069f`, six
characters — is a well-formed `IdentifierName` at this level, and the
restriction against it is an early error in the syntactic grammar. The tokenizer
enforces it while reading, so the tokens stage fails and the caller's gate
closes before this module is called. The consequence is recorded upstream, in
embody's machine twin (`../../embody/notional-machine.md`): the tokens stage
fails, and the phases below tokens close — on a program V8 itself runs.

## Consumers

The lenses of the tokens phase. The first is
[`../../lenses/spellme/`](../../lenses/spellme/README.md), which asks a learner
to claim each element before the machine confirms it. The family it opens — a
lens for the goal-symbol question, one for the scanner's stopping point, one for
one-character sabotage — reads the same sequence and would otherwise each
re-derive these same two lookaheads.

**And any consumer that must cover the whole source, which is the stronger
argument.** A colorizer is the case: it has to paint every character, including
the ones inside comments and whitespace, and
[`../classifying/`](../classifying/README.md) publishes no element for either —
comments are not tokens there, and zero-width chunks are dropped. Classifying
answers "what does this mean in the notional machine"; this module answers "what
did the scanner produce, and where". **Neither is a superset of the other, and a
colorizer needs both** — composed on the token index each publishes, which is
why that index is a contract field and not an implementation detail.

That is this module's answer to the bounded-context question a concurrent
campaign raised about three siblings deriving from one fact: they are not three
readings competing to be the truth. Two publish different projections of the
same tokens, and the third composes them.

## Why this module exists

The two lookaheads are small and easy to get subtly wrong, and their failure
mode is silent: a mis-folded template or a mis-read `}` produces a plausible
sequence with the wrong boundaries, and a lens built on it teaches a falsehood
confidently. Deriving them once, proving the tiling invariant once, and sharing
the result is the whole argument — the same argument
[`../classifying/`](../classifying/README.md) makes for its own walk.

It is a shared `lib/` leaf rather than lens-local code or an embody enrichment
(human ruling 2026-08-13). The argument this module was built under: it is a
leaf rather than a fact on the embodiment because what it produces is a
**projection into a chosen vocabulary**, not a new truth about the program.
Embody publishes the machine's own reading; this module re-words that reading in
the specification's terms for the consumers that teach in them. The parse itself
is not repeated, and there is still one parse truth.

**That argument had a live counter-argument, and it is now resolved** (question
raised 2026-08-14; settled by human rulings 2026-08-17 and 2026-08-18). The
counter held: input elements are not a _chosen_ vocabulary — they are the
**language's own** — and the tiling invariant's one precondition, input
coherence, is a guarantee only the embodiment's factory can give by
construction. The resolution takes both sides' ground: this leaf stays exactly
as built, and embody publishes the sequence by calling it — an optional
enrichment member on the tokens stage's value
(`facts.tokens.value.inputElements`), no stage of its own, recorded at embody's
DOCS.md § Embodiment decisions (E9). The door this module kept open — publishing
indices rather than token references so the sequence survives embody's deep
freeze — is the door the integration walked through.

The measured ground for that question, and the record of its resolution, is
collected in this repo's planning handoffs under `embody-derivation-facts` —
named in prose, as a campaign record rather than a load-bearing link.

## Conventions

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **Domain-blind leaf.** Consumes the raw parser shapes by value; imports no
  package region — not embody, not lenses, not levels — not even for types.
- **No re-tokenizing, ever** (human ruling 2026-08-13) — no counterfactual scan
  either. Every rule reads published tokens, published comments, and the source
  text. A rule that needed to lex again would belong somewhere else.
- **Vocabulary changes are cross-consumer events.** The fourteen kinds are
  shared with every consumer; widening or re-binning them is a contract change,
  not a local edit.
- **Cite the specification by section**, and name the edition — the numbering
  moves between editions.

## Navigation

- **Parent peer:** [`../README.md`](../README.md) — the lib tier and its
  admission rules.
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **The sibling that answers a different question:**
  [`../classifying/`](../classifying/README.md) — the notional-machine taxonomy
  over the same tokens.
