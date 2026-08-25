<!-- cspell:ignore socratizing quizzing socratize Schulte unbuilt -->
<!-- cspell:ignore linearization unleveled gradability -->

# lib/questioning

A folder of one kind — **questioners**: machinery that turns a program's
embodiment facts into frozen, grid-tagged question items. The parent defines the
kind — this documentation and the one `types.ts` every child imports, including
the `Questioner` envelope itself — and every child implements it. Its leaf
questioners: socratizing serves the **open** register (questions a human judges
— no answer key); quizzing serves the **closed** register (questions a machine
grades — answer key, mastery); each fronts its own engine. The parent composes
nothing and runs nothing.

The pedagogy the questioners build on is the package's, stated once in
[PEDAGOGY.md](../../PEDAGOGY.md); this directory carries questioning's
interpretation and application of it — the grid its items tag, the two
registers, the shared taxonomy vocabulary, the leveling, and the laws every
questioner obeys.

## The questioner family

`questioning/` is a folder of a kind, not a roster: the parent's docs and types
define what a questioner IS, and the directory admits any child that implements
it. The admission rule: **every child implements `Questioner`** — admitting a
child that is not a questioner is a ruling, not an edit. Two shapes exist within
the kind:

- A **leaf questioner** walks the code itself, fronting an engine — the
  analyzers or generators that do the reading. Socratizing and quizzing are the
  leaf questioners.
- A **higher-order questioner** implements the same envelope while consuming
  other questioners as its internal strategy — mixing, matching, and aligning
  both registers' items into one questioning experience. One is designated,
  unbuilt; [DOCS.md](./DOCS.md) § Carried collateral records the concerns
  waiting for it.

The kind's contract is the `Questioner` envelope in [types.ts](./types.ts): a
name, a pure `serves` predicate (may this questioner serve this code?), one ask
entry (embodiment in, frozen items out), and a pinned refusal shape (refusal as
data). `serves` is an options-list answer, not a total pre-check: a questioner
whose `serves` held may still refuse at ask, as data — the pairing is legal. A
read-bound is a law of the kind: **a questioner reads `embodiment.facts` and
never `embodiment.study`** — the lifecycle payload crosses the type boundary,
and no questioner reads it. What the envelope deliberately does not carry: no
unified item type — each questioner's items are its own, and merging item models
is a higher-order questioner's job at its own boundary — no declared-coverage
field (cells ride the items; how a child derives a declared cell union is its
own business), and no learner model (§ Assessment is data).

## The BLOCK model (Schulte 2008)

A 12-cell matrix crossing three dimensions (text surface, program execution,
function/purpose) with four levels (atom, block, relation, macro). The grid has
two axes — dimension × level. The model's own treatment — the paper, the three
colliding axis vocabularies, the linearization's derivation — is package
pedagogy truth:
[PEDAGOGY.md § The BLOCK model of program comprehension](../../PEDAGOGY.md#the-block-model-of-program-comprehension).
The recommender's three-axis extension — the "3D Block Model space" — is a
different object, documented in
[PEDAGOGY.md § The 3D Block Model space](../../PEDAGOGY.md#the-3d-block-model-space-recommender-extension);
see the glossary entry. What this region keeps is the working vocabulary its
items tag:

- **Dimensions**: `text-surface` · `execution` · `purpose`
- **Levels**: `atom` · `block` · `relation` · `macro`

The per-value glosses live with the theory (the PEDAGOGY.md section above) and,
as working JSDoc, on the types themselves ([types.ts](./types.ts)).

Every item a questioner emits carries cells (`BlockCell[]` — zero or more; every
open-register form today emits at least one, and zero-cell items are admitted by
the type as unleveled). The raw cells are what make item coverage auditable
across the 12-cell grid.

## The two registers

Quizzing and socratizing are the **two registers of the same Block Model**: the
closed, gradable register (quizzing — "what category is this?", checkable) and
the open, Socratic register (socratizing — "why is it written this way?",
reflective). The two registers deliberately share one `BlockCell` vocabulary —
this region's — so a learning environment can place both registers on one grid.

The closed register is confined to the text-surface and execution dimensions,
under its charter of **machine-gradability**: every closed item carries a
machine-derived answer key — derived statically, from an execution trace, or
however the questioner obtained its ground truth — even where its prompt or
option copy is authored. (Today's closed engine derives every key statically —
**static decidability**, its own mode of the charter.) The open register spans
all three dimensions; the purpose dimension is open-register-exclusive, because
purpose questions — why code exists, design rationale, intent — have no
machine-derivable answer for a grader to check. The registers do not partition
the grid: they overlap on text-surface and execution.

Each engine is complete within its register, and no layer composes them:
socratizing has no answer key, no grading, no mastery; quizzing has all three.
They share the grid vocabulary and nothing else.

## Static and dynamic ground truth

The theory's static/dynamic distinction
([PEDAGOGY.md § Static and dynamic](../../PEDAGOGY.md#static-and-dynamic))
crosses the registers rather than aligning with them: a questioner's ground
truth is its own choice.

- **Static ground truth** — the text as parsed. Today's leaf questioners read it
  from the embodiment's facts and never run the program.
- **Dynamic ground truth** — what the program actually does when run: variable
  values through execution, call order, output. A **dynamic questioner** runs
  the code to get it, and serves either register: closed items with
  trace-derived answer keys (the QLC family's variable-trace MCQs are the
  reference case), and open questions — including deliberately undecidable ones
  — about what happened at runtime.

None is built yet; the kind admits them, and the grid requires them: **full
coverage of the execution dimension needs dynamic questions** — static analysis
reaches execution cells only by inference from the text.

How a dynamic questioner runs the code is its own business: itself, through the
in-tier sandboxed evaluator ([../engine/](../engine/README.md)), or through the
package's evaluator kind — the tested path with tracers built for exactly this
data, and a case-in-point rather than a requirement (the evaluators live in a
package region the lib tier's import law does not admit, so an
evaluators-consuming questioner's own Phase 0 also settles its tier placement).
Nondeterminism is likewise its own business: a nondeterministic program yields
nondeterministic runtime facts, and any questioner may deliberately randomize
wording or option order. The kind's laws are elsewhere — the envelope,
assessment as data, cells and anchors on every item — never in the means.

What a dynamic questioner's own Phase 0 settles: the shape its runtime
facts take; its tier placement if it consumes the evaluators region; and
its re-encounter story under randomization. The ask seam is settled (human
ruling 2026-08-18): ask answers directly or behind a promise that settles
as data — consumers await uniformly, and a sync leaf is untouched. The
`serves` gate stays static either way: a pure, synchronous predicate over
the parsed facts — gate on statics, run inside ask.

## One grid (the curriculum commitment)

A learning environment should be able to place open and closed questions on one
shared BLOCK-model grid — complementary views of the same comprehension model.
The phrasing is the closed register's own founding goal, and it is a
curriculum-level commitment, not a mechanism this region implements.

The commitment has two mechanized anchors. First, the shared `BlockCell` type
both engines tag their items with — one type, defined here, so "one grid" needs
no type mapping (a consumer still reads a different field per engine: `block` in
the open register, `cells` in the closed; the unification to one field name
lived in the retired composition layer and is itself carried, unbuilt
collateral). Second, one anchor coordinate system: both engines locate items as
half-open character-offset ranges into the source.

The full carrier of the commitment — placing, recommending, sequencing across
registers — is a future recommender/curriculum layer, not this region. The
instruments that once mechanized parts of it (a coverage reporter over the grid,
whose recorded rationale is that coverage is meaningful only over both
registers' items together; a concrete-to-abstract difficulty ladder) are carried
forward, unbuilt — [DOCS.md](./DOCS.md) § Carried collateral records the carry.

## Leveling

Three vocabularies share the word "level"; this region resolves them once:

- **Language level** — the package's dominant sense: a curated slice of
  JavaScript owned by the language-levels region. This parent and every
  questioner under it are language-level-blind; the lib tier's "no levels"
  admission rule means these levels, and this region does not touch them.
- The BLOCK **level** axis — atom, block, relation, macro — is the grid's own
  ordinal, concrete to abstract. Unqualified "level" in this region means this
  axis.
- The consumer-facing **`Level`** linearization — `syntax`, `semantics`,
  `connections`, `goals`, `userExperience` — flattens the 12-cell matrix into
  five named levels matching the curriculum's skill progression; a single
  question can span multiple levels. Its fifth value, `userExperience`, projects
  the question's audience rather than a grid cell — one reason the linearization
  is the open register's consumer surface, not a grid axis. In prose this
  vocabulary is always written by its type name, `Level`.

The two registers consume the leveling differently: the open register's
questions carry both raw `block` cells (for audit) and the linearized `levels`
field (for filtering); the closed register's items carry raw `cells` only.

## Three hardness axes

Three notions of "harder" meet in this region, on three different axes;
conflating them is the mistake this section exists to prevent:

- **BLOCK level** — atom → block → relation → macro, the grid's own ordinal,
  concrete to abstract. A property of the ITEM: how much of the program it is
  about, carried in its cells.
- **SOLO depth** — Pre-Structural through Extended-Abstract
  ([PEDAGOGY.md § SOLO applies within each layer](../../PEDAGOGY.md#solo-applies-within-each-layer)),
  the depth of conceptual integration in a LEARNER's engagement. A property of
  the response, not the item: no item field carries it, and no questioner
  measures it — a consumer diagnosing SOLO depth reads it from what the learner
  does with the items.
- **The carried difficulty ladder** — the concrete-to-abstract ordering of a
  delivered item STREAM by each item's most-concrete cell ([DOCS.md](./DOCS.md)
  § Carried collateral). A property of a sequence, not of any single item;
  unbuilt — today the open register sorts by source offset, and nothing forward
  orders items by difficulty.

An item's hardness signals are therefore its cells (and, in the open register,
its `levels`); everything beyond that — how deep the learner goes, in what order
items arrive — belongs to consumers.

## Taxonomies

Each engine organizes its own catalog. The closed register's catalog is
organized by BLOCK-model cell (dimension × level), each entry one form served by
one generator; the open register's catalog is organized by category and kind.
Both registers tag every emission with cells. Each analyzer or generator and its
tests are the durable spec for its form; the per-form inventory lives with each
engine — see each engine's own README.

The closed register's families build in order: `variables` first, then
`operators`, `literals`, `keywords`, `delimiters`, `calls`, `io`.

**Curated bank vs generated** (closed register) — two provenances of closed
items under one contract. A **generated** item is computed from the snippet's
structure. A **curated-bank** item is authored copy keyed to a named language
concept, instantiated against an anchor in the snippet but with hand-written
prompt/options/feedback. Both grade identically; the distinction is only where
the content comes from. Either way the correct answer is machine-determined
(which curated card applies to this anchor is machine-decided — statically, in
today's bank); only the prose is authored. The bank is un-bounded: it grows
toward all of JavaScript, and whether a questioner can serve a given snippet is
its `serves` predicate's answer, never a concept-set bound.

**Family vs Feature.** Quizzing's `Family` — the syntax-element domain a form
belongs to (`variables`, `operators`, `literals`, `keywords`, `delimiters`,
`calls`, `io`) — and socratizing's `Feature` (`variables`, `data`, `operators`,
`controlFlow`, `functions`, `userInteraction`, `reading`) are each engine's own
coarse axis above its forms. They are related but non-isomorphic: the
correspondence is only partial — `variables` / `operators` match, `literals` /
`calls` / `io` rename (socratizing's `data` / `functions` / `userInteraction`),
but `keywords` and `delimiters` have no `Feature`, and `Feature`'s `reading`
(open-register-only) has no family. Neither engine promises a total map; a
future recommender builds the partial correspondence where it needs it. Neither
axis is classifying's `Category` (a per-token kind that is sometimes a
question's answer — see [../classifying/](../classifying/README.md)).

## ATT applied: the -speak a prompt is written in

The five-tier Abstraction Transition Taxonomy
([PEDAGOGY.md § The 5-tier ATT](../../PEDAGOGY.md#the-5-tier-att)) names the
linguistic registers practitioners emit — context-speak, user-speak,
artifact-speak, NM-speak, CS-speak. For a questioner it is an authoring
instrument: every prompt, option, hint, and feedback string is written IN one of
those -speaks, and the choice is a design decision, not an accident of phrasing.

- Closed-register copy works the artifact-speak ↔ NM-speak edge: a prompt names
  elements of the written text (artifact-speak's static face), and feedback
  explains the verdict in NM vocabulary — the machine events that make the
  answer true.
- Open-register copy ranges over more tiers, following its wider grid span:
  implementation and strategy questions stay near artifact-speak, execution
  questions reach NM-speak, and purpose questions reach user-speak and
  context-speak — why this exists, for whom.
- Re-tiering the copy moves the question without moving its anchor: the same
  anchored decision can be asked in NM-speak ("which scope does this name
  resolve in?") or in user-speak ("what would the person running this notice?").
  A questioner fixes each item's tier at authoring time; a consumer choosing
  among items by audience is choosing among tiers.

## Assessment is data

Questioners are stateless about the learner; whatever assessment machinery a
register owns, it is delivered as data on the item or as a pure function of item
and response, never as held state:

- **Answer keys ride the item** — a closed item carries its own machine-derived
  ground truth.
- **Grading is pure** — one item and one response in, one verdict out; the
  grader reads nothing else and remembers nothing.
- **Propagation edges are data** — where demonstrating one form counts as
  evidence toward another, that relation is stated as data a consumer can fold,
  never accumulated inside the questioner.

What no questioner ever holds: mastery accumulation, a learner model, session
state, memory between calls. The open register has none of the above by charter
(§ Ownership boundary); the closed register provides all three — as data.

The neutrality law — the embody Core Boundary Principle one layer up:
**questioners provide question data; consumers provide the educational
intelligence.** A consumer that wants adaptivity maps its learner model onto
questioner config from the outside; config is declarative and serializable
precisely so that mapping stays entirely on the consumer's side of the boundary.

## Glossary

The package glossary owns the shared meanings; these entries add what this
parent owns.

- **questioner** — anything implementing the parent's `Questioner` envelope
  ([types.ts](./types.ts)). Leaf questioners front an engine; a higher-order
  questioner consumes other questioners as its strategy.
- **higher-order questioner** — a questioner whose internal strategy is other
  questioners: it merges, orders, and aligns their items behind the same
  envelope. One is designated and unbuilt ([DOCS.md](./DOCS.md) § Carried
  collateral).
- **engine** — the machinery a leaf questioner fronts: socratizing's analyzers,
  quizzing's generators. The machinery that turns an embodiment into items —
  reading the program, running it, or both; rendering belongs to lenses. An
  engine is not a roster slot — any future leaf questioner fronts an engine of
  its own.
- **serves** — the questioner kind's gate predicate: may this questioner serve
  this code? Deliberately NOT named `applicability`: the package's study-utility
  envelope names that field for embody's gate-time offering, and a questioner is
  not offered by embody's roster — the distinct name keeps the two envelopes
  from silently aliasing. `serves` answers an options list; ask may still
  refuse.
- **ask** — the kind's main operation: embodiment in, frozen items out, or a
  refusal as data. The counterpart of the lens kind's `main`, named for what a
  questioner does.
- **anchor** — the source location an item is about: a half-open
  character-offset range into the snippet, one coordinate system across both
  registers. "At the anchor" always means by offset, never by line.
- **verdict** — the closed register's grading outcome (correct / incorrect /
  not-interpretable, with feedback). A different word from the evaluators
  region's "verdict", which there names an applicability answer — the two
  regions' uses do not travel.
- **item** — one unit an engine emits: a `CodeQuestion` in the open register, a
  `QuizItem` in the closed. This README uses "item" as the umbrella noun;
  "question" unqualified is avoided because socratizing has an inner `Question`
  type two levels down.
- **catalog** — an engine's own inventory of the forms it serves. Each engine
  organizes and documents its own (see § Taxonomies).
- **cell** — one coordinate `{ dimension, level }` on the grid; twelve exist. An
  item may carry several, so the carrying fields are plural: socratizing names
  its field `block`, quizzing names its field `cells`; both hold this region's
  `BlockCell[]`.
- **dimension** — one of the grid's three axis values: `text-surface`,
  `execution`, `purpose`.
- **level** — three senses, resolved in § Leveling: a language level (the
  package's sense — not this region's), the grid's four-value BLOCK level axis
  (this region's unqualified sense), and the five-value `Level` linearization
  (always written in code voice).
- **block** — three uses, disambiguated by context: the model's name (the BLOCK
  model), the level value `block` (a coherent group of statements), and
  socratizing's field name `block` (its `BlockCell[]` field). This region writes
  "BLOCK model", following the engines; the primary source writes "Block Model".
- **register** — the open/closed distinction between the two engines: open
  (Socratic — a human judges, no answer key) versus closed (gradable — a machine
  grades). Unqualified "register" in this region means this sense. Two other
  senses exist and stay out of the parent: socratizing's inner
  `Question.register` (`open` | `pointed` | `comparative` — the Feedback Ladder
  rung, engine-local; hazard: the token `open` legitimately appears in both
  senses with different meanings), and roster _registration_ of a lens — a
  lens-layer term, not a question-engine term at all.
- **static decidability** — the mode of the closed charter today's closed engine
  works in: every one of its answer keys is derivable from the snippet's static
  structure alone, and neither landed leaf ever evaluates the snippet. The
  charter itself is machine-gradability — a dynamic closed item's key is
  machine-derived from an execution trace instead, and open questions from trace
  data may be deliberately undecidable (§ Static and dynamic ground truth).
- **answer key / mastery** — closed-register machinery: the machine-derivable
  correct answer, and the accumulated evidence a learner has demonstrated a
  form. Neither exists in the open register (charter law, § Ownership boundary).
- **family / feature** — each engine's own coarse taxonomy axis; related,
  partial, non-isomorphic, no total map (see § Taxonomies). One further
  homonym, resolved the way quizzing's glossary resolves it: lowercase
  unqualified "family" in this region's prose means the questioner family
  (the kind this README defines); code-voiced `Family` always means
  quizzing's taxonomy type.
- **form** — the closed register's typed field: the stable content-spec key of
  one generator's output. The open register has no `form` field; its counterpart
  is the analyzer id. "Form" in this README means "one question template an
  engine serves" and is owned per engine.
- **the "3D Block Model space"** — a DIFFERENT object from this grid: a
  three-axis recommender space — Level × Scope × NM components — whose cell type
  `BlockModelCell` carried the third axis as `nmComponents`. This region's grid
  is two-axis, dimension × level; the space is carried as package pedagogy truth
  in
  [PEDAGOGY.md § The 3D Block Model space](../../PEDAGOGY.md#the-3d-block-model-space-recommender-extension),
  reachable also through the pointer heading kept in [DOCS.md](./DOCS.md).
- **`BlockCell` vs `BlockModelCell`** — a forward guard. The deprecated
  architecture carried `BlockModelCell`, the lenses' recommender coordinate,
  deliberately non-isomorphic with `BlockCell` (axis names swap; `text-surface`
  ↔ `surface`; `purpose` ↔ `function`; `atom` ↔ `atoms`; plus the `nmComponents`
  third axis). No such type exists in the greenfield tree, and the lens playbook
  ruled the recommender field dropped. If a recommender coordinate returns, the
  bridge is a mapping, never a cast or a rename.
- **region** — used informally here for "this parent directory and its
  questioners." The questioning parent is NOT one of the package's six
  architecture regions; it lives inside the lib tier, as a parent directory
  whose children are questioners.

## What lives here

```text
lib/questioning/
  README.md            ← you are here — the shared truth
  DOCS.md                architecture and decisions
  types.ts               the shared grid types + the Questioner envelope
  notional-machine.md    the machine twin — the questioner kind's NM
  ux/                    the user twin — learner journeys through questioning
  LOSS-LEDGER.md         transport provenance for these docs
  sandbox.html           permanent dev page — both registers over one snippet
  socratizing/           the open register's leaf questioner
  quizzing/              the closed register's leaf questioner
```

Each child's README carries its own catalog, API, and configuration; the parent
carries only the kind and what is shared. The open register's leaf questioner
lives at [socratizing/](./socratizing/README.md).

## Ownership boundary

Positive invariants — true of every questioner under this parent:

- Returned values arrive frozen.
- Items anchor as half-open character-offset ranges into the source — one
  coordinate system across both registers.
- No learner in view: a questioner holds no learner state between calls (§
  Assessment is data). Ground truth, by contrast, is unconstrained — static
  reading or actual execution, the questioner's own choice (§ Static and dynamic
  ground truth).
- Leaf questioners never import each other; consuming another questioner is
  exclusively a higher-order questioner's role, and composition never lives in a
  leaf. The rest of the import law, per counterpart: the parent's types —
  type-only; sibling lib-tier leaves — allowed, runtime included; embody — the
  embodiment envelope, its structural fact-types, and its refusal cause,
  type-only. The only types the questioners' contracts share are this
  directory's — a hand-tracked convention; no lint rule enforces this boundary.
- Refusal is data or a loud gate, never a half-result; emitting zero items on a
  snippet that fits no form is normal operation.

The parent **composes nothing and runs nothing**: no composition entry point, no
cross-register co-anchoring, no coverage instrument, no difficulty ladder, no
source registry. Those concerns belonged to the retired question-orchestrator;
what survives of them survives as concepts, not mechanism, designated to the
higher-order questioner ([DOCS.md](./DOCS.md) § Carried collateral).

Two charter laws bind every future change:

- Never widen the closed register's item model with an open mode — it breaks the
  closed charter: a machine grades every closed item.
- Never add grading, mastery, or verdicts to the open register.

## Conventions

- This directory is types and documentation only. `types.ts` has zero runtime
  exports and exactly one import — embody's structural types, type-only, carried
  by the `Questioner` envelope — so it still compiles away entirely. Adding a
  runtime export here is a design event, not an edit.
- Grid and taxonomy vocabulary changes are cross-questioner contract events.
- Children import the parent's types type-only, by relative path.
- Inherited conventions: [../README.md](../README.md) (the lib tier) and the
  repo's `DEV.md`.

## Navigation

- Up: [../README.md](../README.md) — the lib tier and its admission rules.
- Architecture and decisions: [DOCS.md](./DOCS.md).
- The twins: [notional-machine.md](./notional-machine.md) (the questioner kind's
  machine) and [ux/user-journeys.md](./ux/user-journeys.md) (learner journeys
  through questioning).
- Transport provenance: [LOSS-LEDGER.md](./LOSS-LEDGER.md).
- The questioners: [socratizing/](./socratizing/README.md) (open register) and
  quizzing (closed register).
