# step-instrumentation/runtime

The PROGRAM-REALM half of [step-instrumentation](../README.md): everything the
instrumented text touches while running — in a hosted worker, this is the worker
chunk. The realm split is an import direction (the module DOCS' structural
constraint): nothing here may import a thread-side module; thread-side modules
may import this half's types.

- [`create-collector.ts`](./create-collector.ts) — one run's collector:
  counting, recording, caps, latched intrinsics, log parking, the anchor family.
- [`events/`](./events/README.md) — the event-builder layer (transported from
  the semantics event-generators) and the emit discipline.
- [`represent-value.ts`](./represent-value.ts) — raw value →
  ValueRepresentation.
- [`compute-coercion.ts`](./compute-coercion.ts) _(Phase 1)_ — the inferred
  coercion legs, spec-widened from the transported starting point.
- [`scope-stack.ts`](./scope-stack.ts) _(Phase 1)_ — scope-instance runtime,
  transported.
- [`describe.ts`](./describe.ts) — the deep snapshot codec, capture side.
- [`read-cap-trip.ts`](./read-cap-trip.ts) — structural trip classification,
  in-realm only.
- Parent: [`../README.md`](../README.md) · sketch: [`../DOCS.md`](../DOCS.md).
