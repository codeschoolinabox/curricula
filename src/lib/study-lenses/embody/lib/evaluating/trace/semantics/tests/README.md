# trace/semantics/tests

Tracer-level suites — the tiers that exercise the WHOLE pipeline through the
public entry (`traceSemantics`), as opposed to the co-located unit tests under
`tracing/**/tests/` (T1) and the seam suites under `tracing/tests/` (T2/T3).
Taxonomy: [`../DOCS.md § Test taxonomy`](../DOCS.md).

## Structure

| File / directory                      | Tier | Runner  | Catches                                                                                                          |
| ------------------------------------- | ---- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `config-pipeline.test.ts`             | T4   | Node    | prepare pipeline → weave gating integration (fake transport)                                                     |
| `profiles/profiles.ts`                | —    | —       | the named config profiles (single frozen default export)                                                         |
| `profiles/profile-*.test.ts`          | T4   | Node    | one profile per file — config-gate regressions (fake transport)                                                  |
| `schema-conformance.test.ts`          | T5   | Node    | event-shape drift — every emitted event validates against its variant contract, per-variant `semantics` included |
| `semantic-equivalence.test.ts`        | T6   | Node    | subtle gating drift — equivalent configs (shorthand vs explicit) produce identical streams                       |
| `trace-semantics-e2e.browser.test.ts` | T7   | Browser | transport-fidelity bugs no fake catches — one case per transport-distinct settlement                             |

## Conventions

- **Node tests** drive `traceSemantics` through the engine's **fake transport**
  (`lib/engine/testing/fake-transport.ts` via the entry's test-only transport
  seam). The fake structured-clones every payload, so clone-safety violations
  surface here — but a green fake run is evidence for logic, never for transport
  fidelity.
- **The browser suite** runs the real worker + shared-memory transport
  (COOP/COEP provisioned by the vitest workspace). Its matrix is per-settlement:
  completed / errored (halt attribution) / cancelled (break mid-stream) /
  timed-out / iteration-limit refinement / dialog round-trip — plus one
  event-correctness and one gating spot-check through the real transport.
- **Dialog-bearing programs** always run with scripted `dialogs` handlers in
  tests; a dialog with no provider settles as a call error by design.
- Keep browser files small — worker churn exhausts the browser's thread pool
  (the workspace runs browser tests serially for the same reason).

## Running

```sh
npm run test:unit    # Node projects (includes the T4/T5/T6 suites)
npm run test:browser # real-worker suites (includes the T7 matrix)
npm test             # Both
```
