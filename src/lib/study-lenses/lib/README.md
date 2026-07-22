# lib

Shared leaf libraries of the study-lenses package: peer-independent machinery
any region may import directly. Nothing here knows the package's domain — no
lifecycle phases, no levels, no lenses; each library states its own contract in
its own directory.

- [classifying/](./classifying/README.md) — exhaustive, selection-free
  syntax-element classification: one frozen `ClassifiedToken` per source token
  (category, role, partner) from a snippet's Acorn tokens + AST.
- [engine/](./engine/README.md) — the generic sandboxed streaming evaluator the
  evaluators region drives.
- [local-llm/](./local-llm/README.md) — the device-local LLM runtime: brings a
  small model up on the learner's own machine and turns a prompt into generated
  code, or refuses with a typed cause.

Package root: [../README.md](../README.md).
