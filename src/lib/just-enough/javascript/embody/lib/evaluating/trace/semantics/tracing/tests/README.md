# tracing — Test inventory

Seven tiers, each catching a distinct class of bug that no other tier catches.

```text
┌─────────────────────────────────────────┐
│ T1  UNIT (architecture-layer)           │  internal logic bugs in one layer
│     one layer, everything else mocked   │  (e.g. gating returns wrong boolean)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T2  CONTRACT (protocol surface)         │  wire-format drift between layers
│     message shapes + SAB byte layout    │  (e.g. Worker changes message shape)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T3  ARCHITECTURE-SEAM INTEGRATION       │  seam bugs between two layers
│     two adjacent layers, others mocked  │  (e.g. advice passes wrong nodePath
│                                         │   to dispatcher)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T4  SEMANTIC-VERTICAL INTEGRATION       │  config-gate regressions
│     one named config profile,           │  (e.g. disabling expression layer
│     full architecture, Node-level       │   doesn't actually suppress events)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T5  SCHEMA CONFORMANCE                  │  event-shape drift
│     every emitted event validates       │  (e.g. factory adds field not in
│     against its category schema         │   schema)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T6  SEMANTIC EQUIVALENCE                │  subtle gating drift
│     equivalent configs produce same     │  (e.g. shorthand expansion produces
│     event streams                       │   different stream than explicit form)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T7  END-TO-END (smoke + browser)        │  integration bugs no mock catches
│     full stack, real Worker, real SAB   │  (e.g. real Worker crashes on new
│                                         │   Aran version)
└─────────────────────────────────────────┘
```

---

## T1 — Unit (architecture-layer)

Co-located `tests/` directories next to each layer's source.

### L3 helpers

| File | Layer | What it tests |
| --- | --- | --- |
| `weaving/advice/tests/gating.test.ts` | L3 helper | Config gate predicates (ZOMBIES tests) — leaf gates, composite gates, filter logic |
| `weaving/advice/tests/scope-stack.test.ts` | L3 helper | push/pop/lookup/shadowing |
| `weaving/advice/tests/iteration-counters.test.ts` | L3 helper | increment/reset/lookup per loop |
| `weaving/advice/tests/template-decomposition.test.ts` | L3 helper | Aran template concat → begin/eval/end decomposition |
| `tracing/event-generators/**/tests/*.test.ts` (22 files) | L3 helper | Pure event factory output shapes |
| `tracing/represent-value/tests/represent-value.test.ts` | L3 helper | Value serialization including ErrorValue branch |

### L4 Dispatcher

| File | What it tests |
| --- | --- |
| `weaving/advice/tests/emit-expression.test.ts` | Field stamping, range filter, state mutations, onEvent call |
| `weaving/advice/tests/emit-resolve.test.ts` | Same as above + visitCount bump + provenance fields |
| `weaving/advice/tests/emit-error.test.ts` | Error-specific fields + ErrorValue shape |

### L2 Instrumentation + L3 Execution (per-advice files)

| File | What it tests |
| --- | --- |
| `weaving/advice/tests/block-setup.test.ts` | Scope push + scope tracking state |
| `weaving/advice/tests/block-declaration.test.ts` | Variable registration + BindingEvent(declare) |
| `weaving/advice/tests/block-before.test.ts` | Branch/iteration events + loop guard |
| `weaving/advice/tests/block-after.test.ts` | ScopeEvent(completion) |
| `weaving/advice/tests/block-throwing.test.ts` | ScopeEvent(interrupt) + ErrorEvent emission |
| `weaving/advice/tests/block-teardown.test.ts` | Scope pop + ScopeEvent(leave) |
| `weaving/advice/tests/expression-after.test.ts` | Dispatch branches per semantic discriminant |
| `weaving/advice/tests/apply-around.test.ts` | Binop + call + template + increment + intrinsics |
| `weaving/advice/tests/effect-before.test.ts` | Compound assignment pre-read |
| `weaving/advice/tests/effect-after.test.ts` | BindingEvent(assign/initialize/available) + TDZ |
| `weaving/advice/tests/statement-before.test.ts` | JumpEvent (break/continue) |
| `weaving/pointcut/tests/*.test.ts` (5 files) | Config-gated node selection + co-gating discriminant |
| `weaving/tests/create-aspect.test.ts` | Aspect assembly: pointcut+advice wiring, initialState shape |
| `tracing/tests/instrument.test.ts` | Parse + digest + ast record construction + tagMap |
| `tracing/tests/link.test.ts` | Scalar events → LinkedTraceEvent + ast population + freeze |
| `prepare/tests/*.test.ts` (7 files) | Config pipeline: expand-shorthand, fill-defaults, validate, verify-options, prepare-for-trace |

---

## T2 — Contract

| File | What it asserts |
| --- | --- |
| `tracing/tests/worker-protocol-contract.test.ts` | Every message shape (setup, execute, entry, io-request, error, complete, ready); SAB layout; control indices; response types |

---

## T3 — Architecture-seam integration

Each file tests the seam between two adjacent layers, with all others mocked.

| File | Seam | What it proves |
| --- | --- | --- |
| `tracing/tests/instrument-integration.test.ts` | L2 internal | ast record populated for every node; parent refs wired; tagMap built; not yet frozen |
| `tracing/tests/emit-integration.test.ts` | L3 → L4 | Factory output + mock tag + mock state → Dispatcher stamps correct fields + pushes to trace + bumps visits |
| `tracing/tests/advice-dispatcher-integration.test.ts` | L3 → L4 | Advice calls factory + dispatcher → `state.trace` has expected frozen event |
| `tracing/tests/aspect-integration.test.ts` | L2 internal | `createAspect(config)` → correct pointcut+advice wiring + `initialState` shape |
| `tracing/tests/link-integration.test.ts` | L5 → L6 | Scalar events + ast + visitCounts → frozen `TraceResult` with correct back-refs and `===` identity |
| `tracing/tests/create-tracing-generator-prep.test.ts` | L1 → L2 | Prep-failure wrapping: bad input → failure `TraceResult` without throwing |

---

## T4 — Semantic-vertical (profile-driven)

Lives in `trace/tests/profiles/`. See `trace/tests/profiles/README.md` for the full catalog.

---

## T5 — Schema conformance

| File | What it asserts |
| --- | --- |
| `trace/tests/schema-conformance.test.ts` | Every event from an `ALL_ON` trace validates against its category JSON schema |

---

## T6 — Semantic equivalence

| File | What it asserts |
| --- | --- |
| `trace/tests/semantic-equivalence.test.ts` | Equivalent config pairs (`{ expression: true }` vs full explicit form) produce identical event streams for the same program |

---

## T7 — End-to-end (smoke + browser)

All T7 tests use a **real Worker, real SharedArrayBuffer, real `Atomics.wait()`**. No mocking.

| File | What it tests |
| --- | --- |
| `api/tests/trace-e2e.browser.test.ts` | Full generator API contract through `api/trace.ts`: drain, stepping, cancel, timeout, AST entwining, range filter |
| `api/tests/smoke.test.ts` | 5 short programs through `api/trace.ts`; asserts `result.ok === true` |

**Browser test constraints:**

- Run serially (`browser.instances: 1` or equivalent) — SAB contention causes random timeouts
- Requires cross-origin isolation: `COOP: same-origin` + `COEP: require-corp` headers for SharedArrayBuffer
- Symptom of SAB contention: timeout failures that don't reproduce consistently → increase `testTimeout`, reduce parallelism

---

## Related

- `trace/DOCS.md` — vocabulary, architecture axes, test taxonomy, key design decisions
- `trace/tests/profiles/README.md` — full profile catalog
- `tracing/DOCS.md` — 6-layer architecture table + control enforcement table
