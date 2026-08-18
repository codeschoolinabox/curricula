<!-- cspell:ignore socratizing quizzing unbuilt -->

# lib

Shared leaf libraries of the study-lenses package: peer-independent machinery
any region may import directly. Nothing here knows the package's domain — no
lifecycle phases, no levels, no lenses; each library states its own contract in
its own directory. A leaf may consume embody's **structural fact-types** (a
scope graph, an AST) **type-only** when that structure is the leaf's own
subject: a type-only import creates no runtime dependency and no import cycle
(embody imports nothing here), and the leaf stays blind to the lifecycle,
levels, and lenses built on those facts. This is a widening of the original "no
package region even for types" rule, scoped to structural fact-types a leaf
genuinely projects.

One entry below is a parent directory, not a leaf: `questioning/` holds a family
of one kind — questioners — plus, in the parent itself, only the kind's
definition and shared truth (the `Questioner` envelope, the BLOCK-model grid,
taxonomies, leveling) as documentation and types. It is admissible on this
tier's own terms: the tier's "no levels" bar means **language levels**, and the
questioning parent and every questioner under it are language-level-blind and
lens-blind, and read no lifecycle payload — the embodiment's study layer crosses
the kind's type boundary, and a law of the kind bars any questioner from reading
it. The tier's existing leaves already carry pedagogical domain models
(classifying's `Category`/`Role`, socratizing's framework stack), so the parent
changes the tier's depth, not its kind. The parent itself adds no machinery — it
composes nothing and runs nothing — and what may live inside is governed by the
family's admission rule: every child implements `Questioner`. Leaf questioners
qualify as tier leaves in their own right; a higher-order questioner
(designated, unbuilt) consumes its sibling questioners as its internal strategy,
and that reach never leaves the family — composition stays inside the parent
directory, off the tier's shared surface.

- [classifying/](./classifying/README.md) — exhaustive, selection-free
  syntax-element classification: one frozen `ClassifiedToken` per source token
  (category, role, partner) from a snippet's Acorn tokens + AST.
- [engine/](./engine/README.md) — the generic sandboxed streaming evaluator the
  evaluators region drives.
- [local-llm/](./local-llm/README.md) — the device-local LLM runtime: brings a
  small model up on the learner's own machine and turns a prompt into generated
  code, or refuses with a typed cause.
- [loop-guard/](./loop-guard/README.md) — line-preserving loop-guard splicer:
  finds each guarded loop and splices caller-supplied guard/reset call text into
  it without moving a line, returning the rewritten source and a count of loops
  guarded.
- [questioning/](./questioning/README.md) — a family of one kind, questioners:
  machinery turning embodiment facts into frozen, grid-tagged question items.
  The parent defines the kind (the `Questioner` envelope, the BLOCK-model grid
  types) and carries questioning's application of the package pedagogy; today's
  questioners are socratizing (the open register: questions a human judges) and
  quizzing (the closed register: questions a machine grades).
- [scanning/](./scanning/README.md) — the specification's own reading of a token
  stream: one frozen `InputElement` per span (kind, half-open span, verbatim
  slice, and the indices of the parser tokens it wraps) folded from embody's
  tokens fact, tiling the source exactly, for consumers that must account for
  every character rather than every token.
- [scoping/](./scoping/README.md) — a flat, per-declaration usage view of a
  program's variables: one frozen `VariableUsage` per `let`/`const` binding
  (name, kind, post-declaration read/write counts, declared identifier node, and
  whether it is exported) folded from embody's scope environment, for
  scope-aware consumers.
- [screening/](./screening/README.md) — the generic default-deny walk over a
  curated slice of JavaScript: one frozen `Violation` per place a parsed program
  leaves the slice an allowlist's node-rule table describes, plus the two data
  artifacts that walk depends on — the parse settings its soundness is relative
  to, and the structural floor a caller unions under a table it derived by
  inventorying an existing program.

Package root: [../README.md](../README.md).
