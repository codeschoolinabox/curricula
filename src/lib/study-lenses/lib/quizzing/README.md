# lib/quizzing

Pure, deterministic question generation and grading for the syntax-element quiz
lens. Given a parsed JavaScript snippet, its already-classified tokens, and a
filter, `generateQuiz` produces an array of frozen `QuizItem`s — auto-gradable
questions anchored to clickable syntax elements; given a `QuizItem` and a
learner response, `grade` produces a `Verdict`. Every question's **correct
answer** is machine-derivable — statically decidable from the snippet — even
where its prompt or option copy is authored: quizzing is the **closed,
gradable** complement to socratizing's **open** Socratic register.

Quizzing owns the question **content** and the **grading**. It does not render,
it does not hold mastery state, and it never classifies tokens itself — the lens
([`../../lenses/quiz`](../../lenses/quiz)) supplies the classification and owns
everything the learner sees and clicks.

## Glossary

The ubiquitous language for this module. Functions, types, tests, and prose all
use these terms.

**QuizItem** — one auto-gradable question, fully resolved against a specific
snippet: its anchor in the source, its catalog `form`, its Block-Model `cells`,
the prompt and answer mode, the machine-derived correct answer, the propagation
`groupKey`, and the post-grade `feedback`. A `QuizItem` is **self-contained
ground truth**: grading needs only the item plus the learner's response, never
the snippet. It is the unit `generateQuiz` emits and `grade` consumes.

**Generator** — a pure function that emits zero or more `QuizItem`s of exactly
one `form` (the V1 generator, the V8 generator, …). Generators are registered;
each declares the **anchor type** it fires on (see _anchor_). The analogue of
socratizing's `PointAnalyzer` / `ProgramAnalyzer`, generalized so a generator
can anchor to a token, an AST node, or the whole program.

**generateQuiz** — the single content entry point:
`generateQuiz(snippet, classified, filter?) → readonly QuizItem[]`. It runs the
registered generators over the snippet and its classified tokens, applies the
filter, and returns a frozen, source-ordered array. Quizzing never calls
`classifyTokens` itself — `classified` arrives as a parameter (see § Public API
for the input asymmetry).

**grade** — the single grading entry point: `grade(item, response) → Verdict`.
Pure, deterministic, and total over the answer-mode space. It reads only the
item and the response — never the snippet — because the item carries its own
ground truth.

**Verdict** — the frozen result of grading one response against one item: the
judgment (`correct` / `incorrect` / `malformed`) and the `feedback` to surface.
The correct answer itself is not echoed — the lens reveals it from the item's
answer key it already holds, so the seam stays one-sided. The closed-register
counterpart to socratizing's `CodeQuestion`, which has no verdict because
Socratic questions are open.

**Learner response** (`LearnerResponse`) — what the learner submitted, in the
shape the answer mode dictates: option id(s) for panel modes, clicked or
selected range(s) for code-surface modes. Named `LearnerResponse`, not
`Response`, to avoid colliding with the DOM `Response` global in the React-side
lens. `grade` matches it against the item's answer key.

**Answer mode** — _how_ a learner answers, which determines the shape of both
the response and the answer key. Two surfaces:

- **panel modes** — answered by option id(s): single-select (`mcq`) and
  multi-select (`multi-mcq`).
- **code-surface modes** — answered by clicked or selected source range(s):
  `click-token`, `click-line`, `select-in-code`.

Quizzing owns the answer-mode **data** (which options are correct, which ranges
are targets); the lens owns the **interaction mechanic** (how a click is
captured).

**Form** — the catalog identity of a question template: the appendix id (`'V1'`,
`'V8'`, `'V10a'`, `'O3'`, …). One `form` maps to one generator and one question
shape. `form` is the stable content-spec key an educator filter names to enable
or disable a question type.

**Family** — the syntax-element domain a `form` belongs to: `variables`,
`operators`, `literals`, `keywords`, `delimiters`, `calls`, `io`. The coarse
domain axis above `form`. Family is quizzing's own vocabulary; it is **not**
classifying's `Category` (a per-token kind that is sometimes a question's
_answer_) and **not** socratizing's `Feature`. `Feature` is a _related but
non-isomorphic_ axis: the correspondence is only partial — `variables` /
`operators` match, `literals` / `calls` / `io` rename (socratizing's `data` /
`functions` / `userInteraction`), but `keywords` and `delimiters` have no
`Feature`, and `Feature`'s `reading` (the open register) has no family. Quizzing
does not promise a total map; the M3 recommender builds the partial
correspondence where it needs it (the same posture as the
`BlockCell → BlockModelCell` mapping below).

**Group key** (propagation group) — the identity string that ties together the
`QuizItem`s that share mastery credit, so answering one can credit its group.
The group key is keyed on the **classification axis its form uses**: the
category-ID form keys on `Category` (group key `category:<category>`);
role-aware forms narrow to category-and-role; binding-aware forms key on binding
identity; block and loop forms key on their structural anchor. Quizzing decides
what a group is _keyed_ on; the lens decides how a completed group is
_presented_. The group key is deterministic from `(snippet, classified, filter)`
— it never depends on a lens display choice quizzing never receives.

**Sameness unlock** — the earned-propagation mechanic, expressed as data. A
"sameness" form (V10a/b/c — "click every occurrence of this same variable / used
the same way") names, via its `unlocks` field, the group(s) whose propagation it
earns. Passing a sameness item is what authorizes bulk-crediting its group.
Quizzing emits the unlock relationship; the lens owns when propagation fires and
how it shows.

**Curated bank vs generated** — two provenances of `QuizItem`s under one
contract. A **generated** item is computed from the snippet's structure (V1
category, V7 usage-kind). A **curated-bank** item is authored copy keyed to a
finite JEJ concept (the let/const/TDZ/const-error cards, misconception
distractors from the notional-machine doc), instantiated against an anchor in
the snippet but with hand-written prompt/options/feedback. Both are `QuizItem`s
and both grade identically; the distinction is only where the content comes
from. Either way the _correct answer_ is machine-determined (which curated card
applies to this anchor is statically decided); only the prose is authored. The
bank is bounded because JEJ's concept set is finite — it is not a different
type, just a generator whose option text is a compile-time constant table rather
than a computed string.

**Occurrence → binding resolution** — the static, shadowing-aware pass that maps
each identifier _occurrence_ (a token in the source) to the _binding_ it
resolves to under lexical scoping. It is the ground-truth source for
binding-identity group keys (V8, V12) and for provenance and shadow questions
(V3, V9). An **occurrence** is a source token; a **binding** is a declared name
in a scope — keep them distinct. This resolution is computed inside quizzing,
behind the accessor seam (see § Public API), because no embody surface exposes
it on parseable code.

**Anchor / anchorRange** — the single source element a `QuizItem` is attached
to: `anchorRange` is its `[start, end)` (zero-indexed, half-open into
`source.code`, matching classifying's range convention) — always present, since
every anchor is a source span. `anchorPath` is its AST node path, present only
for node-anchored forms; a token-anchored form (the category-ID question)
carries only `anchorRange`, because a token is not an AST node and has no path.
The anchor is what the learner clicks to open the item — a token for atom
questions, a brace for block questions. A `QuizItem` has exactly one anchor;
selection _targets_ — the ranges a code-surface answer must hit — are carried
separately by the code-surface answer modes, not by the anchor.

**Block-Model cell (`cells`)** — the pedagogical coordinate(s) of a `QuizItem`
on the Block Model: its dimension (`text-surface` / `execution`) and level
(`atom` / `block` / `relation` / `macro`). Plural to match socratizing's
`BlockCell[]` and to admit forms that span cells without a later contract
change. This is **socratizing's `BlockCell`**, not the lenses' `BlockModelCell`
— see the ruling below.

**Category, Role** (borrowed, not introduced here) — quizzing consumes
classifying's `Category` and `Role`; it never defines its own. V1's group key is
keyed on `Category`; later forms key on `Role`. Where this README says
"category" or "role" it means classifying's, imported.

### The Block-Model homonym (one word, two incompatible types)

Two types in this codebase are both "a Block-Model cell." Quizzing uses exactly
one:

- **`BlockCell`** — socratizing's pedagogical-content coordinate
  ([`../../orchestrate/lib/socratizing/types.ts`](../../orchestrate/lib/socratizing/types.ts)):
  `{ dimension: 'text-surface' | 'execution' | 'purpose'; level: 'atom' | 'block' | 'relation' | 'macro' }`.
  **`QuizItem.cells` uses this** — the same vocabulary the question catalog is
  organized by ("Text-surface × atom", "Execution × relation"). Imported
  type-only via a deep import (socratizing has no barrel).
- **`BlockModelCell`** — the lenses' _recommender_ coordinate
  ([`../../lenses/types.ts`](../../lenses/types.ts)):
  `{ level: 'surface' | 'execution' | 'function'; scope: 'atoms' | … }`.
  Quizzing does **not** use it. The M3 lens's `recommend()` maps quizzing's
  `BlockCell` coverage onto `BlockModelCell` for the recommender; that mapping
  is a future increment, not a rename. The two are deliberately non-isomorphic
  (axis names swap, `purpose` ↔ `function`, `atom` ↔ `atoms`), which is
  precisely why the bridge is a mapping and not a cast.

The catalog appendix's legend ("Cell: Level × Scope") uses the _recommender's_
axis words; this README and `types.ts` use socratizing's — **dimension × level**
— for the field that holds `BlockCell`s.

## The question catalog

The catalog is the set of `form`s quizzing serves, organized by Block-Model cell
(dimension × level); each row is one `form` served by one generator. The
families build in order: `variables` first, then `operators`, `literals`,
`keywords`, `delimiters`, `calls`, `io`. Curated-bank content is finite because
JEJ's concept set is finite. The catalog grows with the module: each generator
and its tests are the durable spec for its `form`, and a module-level catalog
index is the eventual home for the full table. The originating design and the
redlined draft live in the campaign plan's `## Appendix — question catalog`
(planning rationale and git history, not an end-state dependency).

## Bounded context

Quizzing covers the **text-surface** and **execution** rows of the Block Model
only. The **purpose** row — why code exists, design rationale, intent — belongs
to the Socratic register
([`../../orchestrate/lib/socratizing/`](../../orchestrate/lib/socratizing/)),
not to quizzing: purpose questions are open and reflective, so they have no
machine-derivable answer for `grade` to check.

The governing criterion is **static decidability**: every quizzing question has
ground truth derivable from the snippet's source, tokens, and AST by pure static
analysis — its category and role (from classifying), its binding and scope
structure (from a static, shadowing-aware walk), its Block-Model coordinates.
Anything that needs the program to _run_, or that calls for subjective or
open-ended judgment, is out of scope: it belongs to the runtime trace layer or
to the Socratic register, respectively. This is why `QuizItem.cells` never
carries a `purpose` cell, and why quizzing never evaluates the snippet —
questions about a value "at a point" (V13) or a lookup's depth (V14) are
answered by a _static_ scope walk, not a runtime trace.

## What lives here

```text
lib/quizzing/
  README.md             (this — orientation + glossary + public API)
  DOCS.md               architectural sketch + Mermaid data flow
  types.ts              QuizItem, Verdict, LearnerResponse, AnswerMode, Family,
                        QuizFilter, and the generateQuiz / grade signatures
  generate-quiz.ts      the generateQuiz public export (gate → context → run → filter → freeze)
  grade.ts              the grade public export (pure comparator; dispatch on answer mode)
  filter-quiz-items.ts  post-generation config filter (mirrors socratizing/filter-questions)
  generators/           one registered generator per form (the V1 generator first)
  tests/
```

The exact file split is the implementation's to discover under the house
extraction rule; the tree above is the structural target, not a contract. The
accessor-helper seam (the narrow, domain-named readers every `Snippet` access
goes through — see DOCS.md) lives wherever readability places it.

## Public API

```ts
import generateQuiz from './generate-quiz.js';
import grade from './grade.js';

const items: readonly QuizItem[] = generateQuiz(snippet, classified, filter);
const verdict: Verdict = grade(items[0], learnerResponse);
```

**Input asymmetry (deliberate).** `generateQuiz` takes the whole `Snippet`
_plus_ the pre-computed `classified` array — quizzing never calls
`classifyTokens`; the consumer narrows the snippet to `{ code, tokens, ast }`,
calls `classifyTokens`, and passes the result in. The whole `Snippet` is taken
so quizzing's accessor seam can grow into binding and scope reads as later forms
need them; on parseable code today it reads only `source.code` and
`raw.{tokens, ast}` (plus the supplied `classified`), and every other surface is
reached only through a helper. This mirrors the asymmetry classifying already
documents (classifying takes three narrow values; quizzing takes the Snippet).

**Grading is one-sided.** `grade` reads only `(item, response)` and never the
snippet: each `QuizItem` carries its ground truth (correct option ids or target
ranges), precomputed at generation. Grading is therefore a pure comparator the
lens can run on every click without re-parsing. Grading is **binary** — a
response is correct only on an exact match of the answer key (all correct option
ids, all target ranges, no extras); there is no partial credit. A response that
cannot be interpreted against the item (a mode mismatch, an unknown option id)
is a distinct `malformed` verdict, not a wrong answer, so the lens does not
penalize a UI bug as a learner error. `grade` is total and never throws — it
runs in the lens's interaction loop on every click.

Behavior:

- **Pure.** No mutation of `snippet`, `classified`, or `code` — safe on
  deep-frozen embodiment data. No `embody()`, no `Snippet` construction, no AST
  mutation.
- **Frozen.** The returned array and every `QuizItem` are deeply frozen; every
  `Verdict` is frozen.
- **Deterministic.** Same inputs, same output. No randomness, no sampling — the
  only configuration is the `filter`.
- **Filter semantics** mirror socratizing's `MicroDecisionConfig` — the
  _semantics_, not the literal shape (quizzing's filter is a flatter
  `Partial<Record<…, boolean>>` because every `Family` / `Category` value is a
  single lowercase token, so no kebab→camel key map is needed): an omitted group
  imposes no filter; an all-false group excludes everything; groups are AND-ed
  and a multi-value group is OR-ed within; `range` is **1-based inclusive line
  numbers** and keeps any item whose `anchorRange` line span overlaps it
  (offsets→lines via `Source.offsets`); `count` caps the source-ordered result
  last.

## What this module explicitly does NOT do

- **No UI, no React, no CodeMirror.** Quizzing emits data; the lens renders it.
- **No mastery state.** It emits `groupKey` and `unlocks` (the data for
  propagation); the lens folds verdicts into per-group mastery and decides
  presentation.
- **No classification.** It consumes classifying's `ClassifiedToken[]`; it never
  re-derives category, role, or partner.
- **No blanking, no probability rolls.** That is the blanks lens.
- **No open / Socratic questions.** The purpose row, open-ended reflection, and
  voice / clarity / trap registers belong to socratizing. Quizzing is
  closed-register only.
- **No runtime evaluation.** All ground truth is statically decidable; quizzing
  never executes the snippet.
- **No recommender mapping.** The `BlockCell → BlockModelCell` remap for the
  recommender is the M3 lens's `recommend()`.

The split is strict: **quizzing asks and grades; the lens presents.**

## Consumers

- **[`../../lenses/quiz`](../../lenses/quiz)** — the quiz lens, the only
  consumer. It narrows the snippet and calls `classifyTokens`, then
  `generateQuiz`; maps anchors to clickable decorations on a read-only
  un-colorized CodeMirror; renders the question panel; captures responses and
  calls `grade`; folds verdicts into within-mount mastery; and (in a later
  increment) maps quizzing's `BlockCell` coverage to the recommender's
  `BlockModelCell`.

## Why this module exists

The quiz lens needs auto-gradable questions grounded in the Block Model and the
JEJ notional machine. That content-and-grading logic is pure, exhaustively
testable in isolation, and (like classifying) consumed only at one place today
but conceptually peer-independent — so it lives in the JEJ-peer `lib/` tier
rather than inside the lens, the same extraction rationale as
[`../classifying/`](../classifying/README.md).

Quizzing and socratizing are the **two registers of the same Block Model**: the
closed, gradable register (quizzing — "what category is this?", checkable) and
the open, Socratic register (socratizing — "why is it written this way?",
reflective). Quizzing is the closed complement; it deliberately shares
socratizing's `BlockCell` vocabulary so a learning environment can place both
registers on one grid.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` / `DEV.md`.
Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **No `embody()`, no `Snippet` construction.** The module consumes the frozen
  embodiment by value; type-only imports from `embody/types.ts` are fine.
- **No AST mutation.** Inputs may be deep-frozen; the module must work unchanged
  on frozen data.
- **Reads through the accessor seam.** Every `Snippet` access goes through a
  narrow, domain-named helper — never an inline field access in a generator or
  in `grade`.
- **Borrowed vocabulary is shared contract.** Family is quizzing's own;
  `Category` / `Role` come from classifying and `BlockCell` from socratizing.
  Widening the `Family`, `AnswerMode`, or answer-key shapes is a cross-consumer
  contract event with the lens, not a local edit.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Dependency (classification):**
  [`../classifying/README.md`](../classifying/README.md) — `Category`, `Role`,
  `ClassifiedToken`, default-export `classifyTokens`.
- **Peer register + `BlockCell` source:**
  [`../../orchestrate/lib/socratizing/types.ts`](../../orchestrate/lib/socratizing/types.ts)
  and its `analyze-micro-decisions.ts` / `filter-questions.ts` (the pipeline
  pattern).
- **Recommender coordinate (the M3 mapping target):**
  [`../../lenses/types.ts`](../../lenses/types.ts) § `BlockModelCell`.
- **Input shapes:** [`../../embody/types.ts`](../../embody/types.ts) § Snippet,
  RawAcorn, Status.
- **Consumer (the lens):** [`../../lenses/quiz`](../../lenses/quiz).
