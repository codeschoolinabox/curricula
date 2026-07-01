# tracing — Test inventory

Seven tiers, each catching a distinct class of bug that no other tier catches.
This directory owns T2 (engine-seam conformance) and T3 (intra-pipeline seams);
T1 lives co-located next to each source file; T4–T7 live at the tracer level
([`../../tests/README.md`](../../tests/README.md)).

```text
┌─────────────────────────────────────────┐
│ T1  UNIT (per file)                     │  internal logic bugs in one unit
│     co-located tests/ directories       │  (e.g. a gate returns the wrong boolean)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T2  ENGINE-SEAM CONFORMANCE             │  drift between this tracer's worker/
│     worker + thread logic against the   │  thread logic and the engine contract
│     engine's fake AND real transports   │  (e.g. a clone-unsafe event payload)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T3  PIPELINE-SEAM INTEGRATION           │  seam bugs between adjacent phases
│     two adjacent phases, others mocked  │  (e.g. advice hands the dispatcher a
│                                         │   wrong node path)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T4  SEMANTIC-VERTICAL (profiles)        │  config-gate regressions
│ T5  SCHEMA CONFORMANCE                  │  event-shape drift (incl. semantics
│ T6  SEMANTIC EQUIVALENCE                │  per variant); subtle gating drift
│ T7  END-TO-END (real worker, browser)   │  transport-fidelity bugs
│     → ../../tests/ (tracer level)       │
└─────────────────────────────────────────┘
```

---

## T1 — Unit (co-located)

| Location                                                 | What it tests                                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `weaving/advice/tests/gating.test.ts`                    | Config gate predicates — leaf gates, composite gates, filter logic                                          |
| `weaving/advice/tests/scope-stack.test.ts`               | push/pop/lookup/shadowing                                                                                   |
| `weaving/advice/tests/emit-expression.test.ts`           | Field stamping, range window, name filters, state mutations, emission callback                              |
| `weaving/advice/tests/emit-resolve.test.ts`              | Same + visit-count bump + provenance ids                                                                    |
| `weaving/advice/tests/emit-error.test.ts`                | Error-specific fields + ErrorValue + approximate-location register                                          |
| `weaving/advice/tests/<advice>.test.ts` (one per advice) | Each advice's state updates + which emit it drives per discriminant                                         |
| `weaving/pointcut/tests/*.test.ts`                       | Config-gated node selection + semantic AND co-gating discriminants                                          |
| `event-generators/**/tests/*.test.ts`                    | Pure event factory output shapes (per-variant `semantics` included)                                         |
| `represent-value/tests/represent-value.test.ts`          | Value representation incl. ObjectValue and ErrorValue branches                                              |
| `tests/instrument.test.ts`                               | Parse + digest + tag map + mutable ast record construction                                                  |
| `tests/link.test.ts`                                     | Events + ast record + halt visit counts → linked events, back-refs, cycle-guarded freeze, double-link guard |
| `../prepare/tests/*.test.ts`                             | Config pipeline: expand-shorthand, fill-defaults, validate, verify-options, prepare-for-trace               |

---

## T2 — Engine-seam conformance

The tracer's worker logic and thread logic run against the engine's **fake
transport** (logic, clone-safety — the fake structured-clones every payload)
AND, in the browser suite, the **real transport** (the same doctrine as the
engine's own two-tier conformance: a green fake proves logic, never transport
fidelity).

| File                                     | What it asserts                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/worker-setup-conformance.test.ts` | setup registers advice + emission callback, dialog traps call the channel, halt author classifies the brand and carries visit counts |
| `tests/thread-logic-conformance.test.ts` | narrow yields typed events and drops malformed; onCall services each dialog kind; refineError types the branded halt                 |

---

## T3 — Pipeline-seam integration

Each file tests the seam between two adjacent phases, with the rest mocked.

| File                                   | Seam                | What it proves                                                                        |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `tests/instrument-integration.test.ts` | digest → record     | ast record populated for every node; parent refs + path twins wired; tag map complete |
| `tests/aspect-integration.test.ts`     | options → aspect    | weave-time gating registers exactly the enabled hooks; discriminants match the config |
| `tests/advice-integration.test.ts`     | advice → dispatcher | woven programs executed in Node drive advice → frozen, stamped events accumulate      |
| `tests/link-integration.test.ts`       | settlement → result | events + record + visit counts → linked result with back-refs and reference identity  |

---

## Constraints

- Node T1/T2/T3 suites execute woven output via `new Function` — the standalone
  weave keeps Node and worker execution identical.
- Browser suites live at the tracer level (T7) and run serially — shared worker
  churn causes flaky timeouts; COOP/COEP headers are provisioned by the vitest
  workspace.

## Related

- [`../../DOCS.md`](../../DOCS.md) — tracer phases + test taxonomy
- [`../../tests/README.md`](../../tests/README.md) — T4–T7 inventory
- [`../../tests/profiles/README.md`](../../tests/profiles/README.md) — the
  profile catalog
