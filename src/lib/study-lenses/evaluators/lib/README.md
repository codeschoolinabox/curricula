# evaluators/lib

Region-internal machinery shared by more than one evaluator — consumed only
inside the evaluators region, never from outside it, and free to import down
into the package's shared [`lib/`](../../lib/README.md) leaves. Type imports
follow the same arrow: a module here may import types from the shared leaves it
consumes (and re-export them through its own boundary), while the execution
engine's shapes stay **mirrored structurally, never imported** — the region
rule, unchanged by living in `lib/`.

- [`iteration-guard/`](./iteration-guard/README.md) — the engine-backed
  evaluators' shared iteration-guard semantics: the spliced guard/reset call
  text, the worker-side counter helpers behind it, and structural classification
  of the guard's marked throw.
