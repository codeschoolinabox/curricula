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
- [scoping/](./scoping/README.md) — a flat, per-declaration usage view of a
  program's variables: one frozen `VariableUsage` per `let`/`const` binding
  (kind, post-declaration read/write counts, declared node) folded from embody's
  scope environment, for scope-aware consumers.
- [socratizing/](./socratizing/README.md) — a Socratic code analyzer: turns an
  embodiment into frozen `CodeQuestion`s (questions, not corrections) about a
  program's micro-decisions and comprehension, anchored to source offsets and
  tagged with pedagogical metadata.

Package root: [../README.md](../README.md).
