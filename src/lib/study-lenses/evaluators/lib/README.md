# evaluators/lib

Region-internal machinery the evaluators build on — anything well-abstracted and
potentially usable by an evaluator belongs here, whether one evaluator consumes
it today or several do (human ruling 2026-09-05, widening the earlier
shared-by-more-than-one rule: "just let me put things that can be
well-abstracted and potentially useable into lib/"; a member that grows a
consumer beyond the region can hoist to the package `lib/` then). Consumption
follows the same admission logic: today's consumers are inside the evaluators
region, and a consumer arriving from beyond it is not a violation but the
hoisting trigger — the member moves to the package `lib/`, it is not imported
across the region boundary in place. Modules here are free to import down into
the package's shared [`lib/`](../../lib/README.md) leaves. Type imports follow
the same arrow: a module here may import types from the shared leaves it
consumes (and re-export them through its own boundary), and may import the
region's contract types from [`../types.ts`](../types.ts) — the region root
never imports from `lib/`, so contract and construction cannot cycle. A
published `types.ts` here re-declares the engine shapes it must speak,
STRUCTURALLY, pinned by a compile-time probe in its tests — so the region's
exported types carry no engine dependency — while implementation modules at the
engine seam import the engine's types directly. That is the deprecated region's
measured practice, carried pending a region-level home in the root DOCS: its
README states the mirror half for published surfaces
([`../../evaluators-deprecated/README.md`](../../evaluators-deprecated/README.md)
§ Anatomy of an evaluator), and its seam modules import the engine's contract
types directly — nine names from `lib/engine/types.ts`, in `run/` and
`intercept/` only; the deprecated `lib/` itself imports none, which this rule
explains rather than contradicts (it publishes types and has no engine seam).

- [`environment-refusal/`](./environment-refusal/README.md) — the engine-backed
  evaluators' shared environment refusal: the machinery's two prerequisites read
  and worded once, so no two evaluators drift on the sentence.
- [`execution-handle/`](./execution-handle/README.md) — the execution-handle
  library: the factory that constructs the kind's handles, so the consumption
  laws every evaluator promises are built once and obeyed structurally.
- [`guarded-worker-base/`](./guarded-worker-base/README.md) — the guarded
  engine-backed evaluators' shared worker-setup opening: the iteration guard's
  helpers and the halt author answered together, so the two units' authors
  cannot drift.
- [`iteration-guard/`](./iteration-guard/README.md) — the engine-backed
  evaluators' shared iteration-guard semantics: the spliced guard/reset call
  text, the worker-side counter helpers behind it, and structural classification
  of the guard's marked throw.
- [`step-instrumentation/`](./step-instrumentation/README.md) — the
  instrumentation toolkit that makes a program report its own execution as typed
  semantic trace events: the Babel transform, the collector, and the value
  machinery (the adapted TypeScript port of the klve tracer core, speaking the
  semantics tracer's event/config surface; host-agnostic — a future tracer
  evaluator hosts it on the engine).
- Region root: [`../README.md`](../README.md)
