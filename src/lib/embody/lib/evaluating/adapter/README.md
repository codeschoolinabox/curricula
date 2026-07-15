# evaluating/adapter

The **embody adapter**: the one module that maps a foreign run handle — from the
worker-based [`../evaluators/intercept/`](../evaluators/intercept/) evaluator or
the same-origin-iframe
[`../../../../lib/danger-runner/`](../../../../lib/danger-runner/) runner — onto
embody's `EvaluateHandle` (an `AsyncIterable<AnyNMEvent>` plus a `RunInstance`
result), and produces the gate short-circuit **not-runnable** handle. It is the
single, deliberate embody→danger type seam, so the engine, the evaluator, and
the danger runner all stay backend-agnostic.

It is authored **from** the gate-approved mapping in the intercept evaluator's
[DOCS.md § Downstream](../evaluators/intercept/DOCS.md) — the outcome-vocabulary
table and the event mapping. Every import is `import type` (erased at compile;
no runtime coupling).

## The three operations

- **`normalizeIntercept(handle, ctx)`** — stream each `InterceptEvent` as an
  `EmitNMEvent`, reconstruct the terminal `ErrorNMEvent` from an errored throw
  halt, assemble the `RunInstance`, and take the authoritative deep-freeze.
- **`normalizeDanger(handle, ctx)`** — map the result-only `DangerRunHandle`
  onto a full `EvaluateHandle` with an empty event stream (danger has no
  per-event surface).
- **`makeNotRunnableHandle(snippet)`** — the gate short-circuit, engine never
  invoked; mirrors embody's `makeStubEvaluateHandle` + `NOT_RUNNABLE_REPORT`.

## Vocabulary

These terms propagate into `types.ts`, JSDoc, `DOCS.md`, and tests.

- **normalizer** — one of the two `(handle, ctx) → EvaluateHandle` mappers
  (`normalizeIntercept`, `normalizeDanger`). Each receives an already-obtained
  foreign handle; the admission fork that selected the backend (and the
  gated/ungated posture) is decided a level up.
- **admission mode** (`AdmissionMode` = `'gated' | 'ungated'`) — whether the JEJ
  admission gate ran before the handle was obtained. Carried on
  `NormalizeContext` for provenance; the mapping is identical either way.
- **the two `limit-exceeded` mechanisms** — intercept reaches it by REMAP
  (`errored` with `halt.iterationLimit`); danger reaches it as a DIRECT public
  literal (`DangerOutcome` already carries `'limit-exceeded'`), with a
  SYNTHESIZED `RangeError` `EmbodyError` (danger carries no `error` there).
- **NM-event base seams** (`MakeNMBase`, `MakeInertBindings`) — the `NMEvent`
  fields the § Downstream spec is silent on, pinned inert:
  `phase: 'evaluation'`, `entwined: null`, and a `bindings` view that reports
  every name `unbound` (intercept observes no interior). `prev`/`next` are
  getters over a single-writer timeline, sealed by the deep-freeze.
- **authoritative deep-freeze** — the adapter's own deep pass over the
  `RunInstance`; the engine and the evaluator freeze only their own shallow
  structures.

## Bounded context

This module **owns**: the two normalizers and the not-runnable short-circuit;
the `InterceptEvent → EmitNMEvent` and `halt → terminal ErrorNMEvent`
reconstruction; the outcome-vocabulary map (both `limit-exceeded` mechanisms,
the `ok`-axis, the one authoritative `EmbodyError` constructor); the inert
NM-event base (bindings, `entwined`, `prev`/`next` wiring); and the
authoritative `RunInstance` deep-freeze.

It does **not** own, and explicitly excludes:

- **Admission and the fork.** The gated-vs-ungated decision and populating the
  gate `EmbodyError` onto `snippet.errors` happen a level up (the caller); the
  adapter reads `snippet.errors`, never sets it.
- **Running code.** Neither backend is invoked here — the adapter maps
  already-run (or gate-rejected) handles. The engine, the intercept evaluator,
  and the danger runner own execution.
- **The loop guard.** Both backends' guard-tripped runs arrive as a settled
  `limit-exceeded`; the splicer's home is `lib/loop-guard/`, imported down by
  each backend, never seen by the adapter.
- **Entwinement.** `entwined` stays `null` until `lib/parse` supplies real
  entwinement; the adapter observes no interior.

## Structure

| File       | Purpose                                                                             |
| ---------- | ----------------------------------------------------------------------------------- |
| `types.ts` | The contract: the three normalizers + the internal seams (event, error, end-report) |
| `DOCS.md`  | Architecture: the data-state flow, both `limit-exceeded` mechanisms, the R1 close   |

## Navigation

- Architecture and the Mermaid data flow: [`./DOCS.md`](./DOCS.md)
- The contract: [`./types.ts`](./types.ts)
- The gate-approved mapping this module realizes:
  [`../evaluators/intercept/DOCS.md`](../evaluators/intercept/DOCS.md) §
  Downstream
- The embody target types: [`../../../types.ts`](../../../types.ts)
- The danger backend it also normalizes:
  [`../../../../lib/danger-runner/README.md`](../../../../lib/danger-runner/README.md)
