# step-instrumentation/runtime/events

The event-builder layer: pure builders (one per event kind) answering the domain
fields the collector's emit discipline stamps into
[`../../types.ts`](../../types.ts)'s union — transported high-fidelity from the
semantics tracer's event-generators (this repo's own read-only lineage at
`src/lib/embody/lib/evaluating/trace/semantics/tracing/event-generators/`, with
their tests and compile-conformance asserts), widened per the module contract.
Builders land in Phase 1 with their transported tests; the emit discipline
(count → gate → number → stamp → freeze) is the collector's.

- Parent: [`../README.md`](../README.md) · module root:
  [`../../README.md`](../../README.md).
