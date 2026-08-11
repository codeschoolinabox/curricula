<!-- cspell:ignore socratizing quizzing socratize Schulte unbuilt -->
<!-- cspell:ignore linearization unleveled -->

# lib/questioning

The shared parent of the curriculum's two question engines. The parent carries
their shared truth — the BLOCK-model grid, the shared taxonomy vocabulary, and
the leveling — as documentation and as the one `types.ts` both engines import.
Each engine keeps its own register logic: socratizing serves the **open**
register (questions a human judges — no answer key), quizzing the **closed**
register (questions a machine grades — answer key, mastery). The parent composes
nothing and runs nothing.

## The BLOCK model (Schulte 2008)

A 12-cell matrix crossing three dimensions (text surface, program execution,
function/purpose) with four levels (atom, block, relation, macro). The grid has
two axes — dimension × level. The recommender's three-axis extension — the "3D
Block Model space" — is a different object, documented in [DOCS.md](./DOCS.md);
see the glossary entry.

| Dimension      | Gloss                                          |
| -------------- | ---------------------------------------------- |
| `text-surface` | the written code — syntax, layout, naming      |
| `execution`    | what happens at runtime — data flow, state     |
| `purpose`      | why the code exists — intent, design rationale |

| Level      | Gloss                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| `atom`     | individual language elements (a single statement, operator, or identifier) |
| `block`    | a coherent group of statements achieving a sub-task                        |
| `relation` | connections between blocks (data / control flow)                           |
| `macro`    | the overall program                                                        |

Every item an engine emits carries cells (`BlockCell[]` — zero or more; every
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
under its charter of **static decidability**: every closed item's correct answer
is machine-derivable from the snippet, even where its prompt or option copy is
authored. The open register spans all three dimensions; the purpose dimension is
open-register-exclusive, because purpose questions — why code exists, design
rationale, intent — have no machine-derivable answer for a grader to check. The
registers do not partition the grid: they overlap on text-surface and execution.

Each engine is complete within its register, and no layer composes them:
socratizing has no answer key, no grading, no mastery; quizzing has all three.
They share the grid vocabulary and nothing else.

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
forward, unbuilt — [DOCS.md](./DOCS.md) § Carried collateral records the carry
(human ruling 2026-08-11, promoting the durable home here from the open engine's
DOCS).

## Leveling

Three vocabularies share the word "level"; this region resolves them once:

- **Language level** — the package's dominant sense: a curated slice of
  JavaScript owned by the language-levels region. This parent and both engines
  are language-level-blind; the lib tier's "no levels" admission rule means
  these levels, and this region does not touch them.
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
structure. A **curated-bank** item is authored copy keyed to a finite JEJ
concept, instantiated against an anchor in the snippet but with hand-written
prompt/options/feedback. Both grade identically; the distinction is only where
the content comes from. Either way the correct answer is machine-determined
(which curated card applies to this anchor is statically decided); only the
prose is authored. The bank is bounded because JEJ's concept set is finite.

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

## Glossary

The package glossary owns the shared meanings; these entries add what this
parent owns.

- **engine** — one of the two question libraries under this parent: socratizing
  (open register) or quizzing (closed register). Pure, synchronous machinery
  that turns an embodiment into items; rendering belongs to lenses.
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
- **static decidability** — the closed register's charter: a closed item's
  correct answer is derivable from the snippet's static structure alone. Its
  boundary is shared by both engines: no engine ever evaluates the snippet.
- **answer key / mastery** — closed-register machinery: the machine-derivable
  correct answer, and the accumulated evidence a learner has demonstrated a
  form. Neither exists in the open register (charter law, § Ownership boundary).
- **family / feature** — each engine's own coarse taxonomy axis; related,
  partial, non-isomorphic, no total map (see § Taxonomies).
- **form** — the closed register's typed field: the stable content-spec key of
  one generator's output. The open register has no `form` field; its counterpart
  is the analyzer id. "Form" in this README means "one question template an
  engine serves" and is owned per engine.
- **the "3D Block Model space"** — a DIFFERENT object from this grid: a
  three-axis recommender space — Level × Scope × NM components — whose cell type
  `BlockModelCell` carried the third axis as `nmComponents`. This region's grid
  is two-axis, dimension × level; the space is carried as shared truth in
  [DOCS.md](./DOCS.md) § The 3D Block Model space (human ruling 2026-08-11
  widened the transport to include it).
- **`BlockCell` vs `BlockModelCell`** — a forward guard. The deprecated
  architecture carried `BlockModelCell`, the lenses' recommender coordinate,
  deliberately non-isomorphic with `BlockCell` (axis names swap; `text-surface`
  ↔ `surface`; `purpose` ↔ `function`; `atom` ↔ `atoms`; plus the `nmComponents`
  third axis). No such type exists in the greenfield tree, and the lens playbook
  ruled the recommender field dropped. If a recommender coordinate returns, the
  bridge is a mapping, never a cast or a rename.
- **region** — used informally here for "this parent directory and its two
  engines." The questioning parent is NOT one of the package's six architecture
  regions; it lives inside the lib tier, as a parent directory whose children
  are engine leaves.

## What lives here

```text
lib/questioning/
  README.md        ← you are here — the shared truth
  DOCS.md            architecture and decisions
  types.ts           the shared grid types
  LOSS-LEDGER.md     transport provenance for these docs
  socratizing/       the open register engine
  quizzing/          the closed register engine
```

Each engine's README carries its own catalog, API, and configuration; the parent
carries only what is shared.

## Ownership boundary

Positive invariants — true of every engine under this parent:

- Pure, synchronous, and deterministic; returned values are frozen.
- Items anchor as half-open character-offset ranges into the source — one
  coordinate system across both registers.
- Ground truth is static: no engine ever evaluates the snippet. Anything that
  needs the program to run belongs to the runtime trace layer, not to a question
  engine.
- Engines never import each other. The import law, per counterpart: the parent's
  types — type-only; sibling lib-tier leaves — allowed, runtime included; embody
  — the embodiment envelope, its structural fact-types, and its refusal cause,
  type-only. The only types both engines' contracts share are this directory's —
  a hand-tracked convention; no lint rule enforces this boundary.
- Refusal is data or a loud gate, never a half-result; emitting zero items on a
  snippet that fits no form is normal operation.

The parent **composes nothing and runs nothing**: no composition entry point, no
cross-register co-anchoring, no coverage instrument, no difficulty ladder, no
source registry. Those concerns belonged to the retired question-orchestrator;
what survives of them survives as concepts, not mechanism, in
[DOCS.md](./DOCS.md).

Two charter laws bind every future change:

- Never widen the closed register's item model with an open mode — it breaks the
  closed charter of static decidability.
- Never add grading, mastery, or verdicts to the open register.

## Conventions

- This directory is types and documentation only. `types.ts` has zero imports
  and zero runtime exports — it compiles away entirely. Adding a runtime export
  here is a design event, not an edit.
- Grid and taxonomy vocabulary changes are cross-engine contract events.
- Engines import the parent's types type-only, by relative path.
- Inherited conventions: [../README.md](../README.md) (the lib tier) and the
  repo's `DEV.md`.

## Navigation

- Up: [../README.md](../README.md) — the lib tier and its admission rules.
- Architecture and decisions: [DOCS.md](./DOCS.md).
- Transport provenance: [LOSS-LEDGER.md](./LOSS-LEDGER.md).
- The engines: socratizing (open register) and quizzing (closed register), each
  in its own directory above.
