# Refactor handoff — directory split + embody implementation

**Status:** Phase A in progress. Steps 3, 5, 8, 9, 10, 11 complete and
merged to `main` (commits `9f1db34`, `9df535e`, `5d6fc54`, `8db59e6`,
2026-05-04..05). **Steps 7, 12, 14, 16, 17 remain** — the
post-migration sweep + cleanup work. Phase B
(`EMBODY-IMPL-HANDOFF.md`) is ready once Step 17 deletes this file.

**Audience:** the agent (Claude or otherwise) that will perform the
**remaining** Phase A work — the post-migration sweep (Step 7
analysis-lib signature change), the package-index update (Step 12),
peer doc audit (Step 14), dependency-rule audit (Step 16), and final
file deletion (Step 17).

**Lifecycle:** delete this file after Step 17 (final cleanup).

The architectural narrative — *why* this shape — is in
[`DOCS.md`](./DOCS.md). This file is the *how*: ordered steps with
verification criteria. Read DOCS.md first.

## Two-phase refactor

The 17 steps below are split across two phases. **Phase A**
(structural refactor + mock embody) lives in this file. **Phase B**
(real per-module embody internals) lives in
[`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).

**Why split.** The original draft of Step 5 implemented the real
`embody(code)` factory — composing real `embody/lib/*` outputs into a
frozen `Snippet`. That bundles two concerns: pinning the consumption
surface (orchestrator, analysis libs, lenses) **and** locking the
embody internals (token/AST types for pedagogical clarity, event
payloads, generator surfaces, NM-component reconciliation per the
still-evolving `01-NM-components.md`). The internals aren't ready to
lock, but downstream consumers need a stable surface to develop
against.

**Phase A** rewrites Step 5 as a **mock** that satisfies the `Snippet`
contract from [`embody/types.ts`](./embody/types.ts) without invoking
any `embody/lib/*` internals. Steps 7-12 then complete the structural
moves and pin the cross-peer surface against that mock.

**Phase B** lands the real internals one module at a time, each with
its own DDD/AR cycle. The mock factory body gets replaced once all
modules are real. See
[`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).

| Step | Phase | Lives in |
| --- | --- | --- |
| 1, 5, 7-12, 14 (orchestrate/lenses portion), 16 (Phase-A audit), 17 | A | this file |
| 2, 3, 4, 6, 13, 14 (embody portion), 16 (Phase-B audit) | B | EMBODY-IMPL-HANDOFF.md |
| 11 (gate criterion) | A | this file (gate) + `.planning-handoffs/04-lens-migration.md` (per-lens execution) |
| 15 | n/a (separate ticket) | — |

**Phase A execution order** (within-phase ordering matters because
Step 8's editor extraction consumes analysis libs that Step 9
copies):

```text
1 → 5 → 7 → 9 → 8 → 10 → 11 → 12 → 14 → 16 → 17
```

Why 9 before 8: Step 8 copies editor concerns from `study-lenses/`
to `orchestrate/editor/`, where the editor consumes analysis libs
(`error-interpreting`, `completing`, `editing`, `jej-documentation`)
via their new paths under `orchestrate/lib/*`. Step 9 must do the
copy first; otherwise Step 8 lands with broken imports or has to
re-fix them post-Step-9.

### Cross-stream impact

Phase A unblocks parallel work on the four work streams in
`.planning-handoffs/`. Which streams unblock when:

- **WS3** (`03-orchestrator-and-contracts.md`): unblocked once
  Step 5 lands. Mounts lenses with mock embodiments; passes the
  four-prop API (`snippet`, `lens?`, `config?`, `configs?`)
  through to picker/recommender. WS3's F1-F5 + L1-L8 increments
  exercise the orchestrator surface independently of real embody
  internals.
- **WS4** (`04-lens-migration.md`): partially unblocked once
  Step 5 + Step 11 land. Static-side lenses (`highlight`,
  `parsons`, `blanks`) — anything that reads `parse`, `static`,
  `validation`, `errors` — unblocks fully. Dynamic-side lenses
  (e.g. `trace-table` validating predictions against the syntax
  tracer) gate on Phase B Step B7 (event-payload locking) for
  their specific evaluation module.
- **WS1** (`01-NM-components.md`): independent of the mock/real
  split — the `StepCategory` enum's implementation lives in
  Phase B's evaluating module, but WS1's consumer interface (the
  `nmComponents` field on `BlockModelCell`) is already locked in
  [`lenses/types.ts`](./lenses/types.ts) and unaffected. The
  handoff itself is known-drifty (per
  [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) § Open
  questions); resolve when WS1 picks up.
- **WS2** (`02-analysis-and-recommender.md`): consumes mock
  embodiments via the Step-7 signature change. Step 7's scope is
  static-side only — any analysis-lib **code path** that today
  reads `embodiment.streams.evaluate.*().events` is deferred
  per-code-path (not whole-lib) to Phase B Step B7. Static-side
  recommender ranking unblocks fully once Step 7 lands.

## Constraints to honor

- **Three peers + utils.** Final shape is `embody/`, `lenses/`,
  `orchestrate/` under `javascript/`; cross-cutting infra stays at
  `src/lib/utils/` and is imported via the existing `@`-alias.
- **Single writer.** Only `orchestrate/editor/` mutates snippet source.
  Lenses are read-only views.
- **Lens purity.** Lens plugins receive `embodiment` via props. They
  do not import from `embody/` (top) or `orchestrate/` (top). They may
  import from `orchestrate/lib/*` for shared analysis utilities and from
  `@-utils` for generic infra.
- **`embody/lib/*` returns raw data.** No validation/freezing in lib;
  the `embody()` factory does both at the end.
- **`embodiment` is the canonical parameter name** for any function
  taking a Snippet instance.
- **`evaluation` not `execution`.** The phase 3 name is "evaluation"
  throughout docs and canon (already done at this handoff's creation
  time; preserve it).
- **Formatting in orchestrate pre-processing; not validation.** The
  orchestrator formats source on load; it does NOT gate on JEJ-ness.
  Lenses choose what to do with `embodiment.validation.violations`.
- **Dependency rules** (per DOCS.md § Dependency rules) must hold at
  the end. Audit them.

## Ordered steps

### Step 1 — utils stays put

`src/lib/utils/` is at its current location and imported via the
existing `@`-alias. Do **not** create `javascript/utils/`. The new
peers (`embody`, `lenses`, `orchestrate`) import from the existing path.

**Verify:** `@`-alias resolves from each peer; `src/lib/utils/`
unchanged.

### Step 2 — Build `embody/lib/parse/`

> **Phase B — deferred until after the Step-5 mock lands.** The mock
> fabricates parse data; the real `embody/lib/parse/` ships in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md), where the
> token + AST types are re-evaluated for pedagogical clarity before
> implementation begins.

Create a fresh acorn wrapper + AST primitives at `embody/lib/parse/` to
replace `lib/parse-old/`. Reference (don't copy) `parse-old/` for prior
art and edge-case coverage.

`parse-old/` is not deleted yet — kept for parity validation in step 6.

**Verify:** `embody/lib/parse/` builds tokens + AST for sandbox-programs
fixtures.

### Step 3 — Copy NM-rep modules to `embody/lib/`

> **✓ Complete (commit `9df535e`, 2026-05-04).** The 6 NM-rep
> modules (`parse-old`, `ast`, `validating`, `formatting`,
> `evaluating`, `scope`) were **moved** (not copied) from
> `javascript/lib/<module>/` to `javascript/embody/lib/<module>/`.
> Originals deleted; `javascript/lib/` directory removed entirely.
> The user chose delete-originals (deviating from the spec's
> copy-and-keep) since Explore verified zero external consumers
> existed.
>
> Pedagogical re-typing is **deferred to Phase B**
> ([`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) Step B2)
> per the user's "defer types and signatures and logic later"
> mandate. The modules sit at their new homes verbatim; the sweep
> then re-types them in place.

### Step 4 — Strip validation/freezing from `embody/lib/*`

> **Phase B — deferred.** Only meaningful once real `embody/lib/*`
> modules live in `embody/lib/` (Step 3, also Phase B). Lives in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).

The `embody()` factory (built in step 5) handles validation + freeze
centrally. Walk each `embody/lib/*` module and remove any output-side
validation wrappers and `Object.freeze` / `deepFreezeInPlace` calls
that happen at the module's boundary. Keep internal correctness
checks; only strip the boundary defenses.

**Verify:** `embody/lib/*` outputs are plain (mutable, unvalidated)
data; the test suite still passes; no public boundary leaks unfrozen
data (because nothing public consumes raw `embody/lib/*` outputs yet).

### Step 5 — Build a named-scenario mock of `embody(code)`

> **Phase A — named-scenario discriminator.** This step builds a
> frozen-output mock that satisfies the `Snippet` contract from
> [`embody/types.ts`](./embody/types.ts) **without invoking any
> `embody/lib/*` internals** (the lib is copied/built in Phase B). The
> real per-module composition replaces this mock body in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) once each
> module's pedagogical re-typing is locked.
>
> Orchestrator and lens dev passes scenario sentinels (e.g.
> `embody("FAIL_AT_PARSE")`, `embody("EVAL_TIMEOUT")`) to drive
> specific UI paths without authoring real JEJ source. Phase B
> replaces the discriminator with real tokenization; the sentinels
> become defunct and the discriminator + scenarios delete in one
> cleanup commit.

The mock at `embody/index.ts` must:

1. **Discriminate on a closed set of named-scenario sentinels.**
   The mock branches on `code` (exact `===` match) into one of 11
   scenarios. Anything not in the named set throws
   `Error: Unknown embody mock scenario: "<input>". Expected one of: …`.

   The 11 scenarios:

   | Sentinel | status | errors | static | run().endReport |
   | --- | --- | --- | --- | --- |
   | `OK` | t:T p:T c:T | null | full | ok:T outcome:'completed' |
   | `FAIL_AT_TOKENIZE` | t:F p:F c:F | parse:tokenize | absent | n/a (streams.evaluate absent) |
   | `FAIL_AT_PARSE` | t:T p:F c:F | parse:ast | absent | n/a |
   | `FAIL_AT_CREATE` | t:T p:T c:F | create | absent | n/a |
   | `VALIDATION_FAIL` | t:T p:T c:T | null | full + violations | ok:T outcome:'completed' |
   | `NON_DETERMINISTIC` | t:T p:T c:T | null | nonDeterminism.random:T | ok:T outcome:'completed' |
   | `PAUSES` | t:T p:T c:T | null | hasIo.user.total:1 | ok:T outcome:'completed' |
   | `EVAL_ERROR` | t:T p:T c:T | null | full | ok:F outcome:'errored' |
   | `EVAL_TIMEOUT` | t:T p:T c:T | null | full | ok:F outcome:'timed-out' |
   | `EVAL_LIMIT` | t:T p:T c:T | null | full | ok:F outcome:'limit-exceeded' |
   | `EVAL_CANCELLED` | t:T p:T c:T | null | full | ok:F outcome:'cancelled' |

   Naming convention:

   - `FAIL_AT_<STAGE>` — the named stage's status flag is false; the
     subsequent stages cascade-false per types.ts § 12 staircase.
   - `EVAL_<OUTCOME>` — apex `status.*: true`, but `run()` resolves
     to a frozen `RunInstance` whose `endReport.outcome` matches.
     types.ts has no `status.evaluated` flag (eval failure is a
     per-call `endReport.outcome` concern), hence the asymmetric
     shape vs. the `FAIL_AT_*` family.
   - `OK`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES` — apex
     status with overlay flips on validation / nonDeterminism /
     hasIo respectively.

   Composition is **not** supported. A snippet that needs `OK +
   NON_DETERMINISTIC + PAUSES` gets a future `NON_DETERMINISTIC_AND_
   PAUSES` named mode added when a lens needs it. If the combo
   surface exceeds N=3 modes, revisit composition.

   The scenario list is exported as a frozen
   `EMBODY_MOCK_SCENARIOS: ReadonlyArray<string>` named export from
   `embody/index.ts` so the throw error message, orchestrator dev
   code, and test fixtures share one source. The named export is
   `@internal` Phase A scaffolding; deletes in Phase B.

2. Accept `(code: string) => Snippet`. Return a deep-frozen object
   that satisfies the `Snippet` type from
   [`embody/types.ts`](./embody/types.ts) (lines 784-803). Fabricate
   shape-valid stub data per status-mode:

   | Field | FAIL_AT_TOKENIZE | FAIL_AT_PARSE | FAIL_AT_CREATE | apex (OK + overlays + EVAL_*) |
   | --- | --- | --- | --- | --- |
   | `source` | `Source` from `code` | same | same | same |
   | `parse.tokens` | `[]` | one stub `AugmentedToken` (eof) | same as parse | same as parse |
   | `parse.comments` | absent | absent | `[]` | `[]` |
   | `parse.ast` | absent | absent | stub `Program` AST + acornNode | same as create-fail |
   | `static.*` | absent | absent | absent | every sub-field per types.ts §4 populated with empty-state defaults; `realm` carries the canonical ECMA-262 + HTML host bindings; `metrics.source.{chars,lines,tokens}` derive from `code` and `tokens` |
   | `validation` | `{ isJeJ:T, isDeterministic:T, doesPause:F, formatted:T, violations:[] }` | same | same | derived per types.ts lines 380-381 (`isDeterministic = !any(nonDeterminism)`, `doesPause = hasIo.user.total > 0`); `violations` non-empty only for `VALIDATION_FAIL`; `isJeJ === violations.length === 0` |
   | `errors` | `parse:tokenize` mock | `parse:ast` mock | `create` mock | `null` |
   | `status` | t:F p:F c:F | t:T p:F c:F | t:T p:T c:F | t:T p:T c:T |

   **All five `Validation` fields** are set explicitly (per types.ts
   lines 378-384). For `FAIL_AT_*` modes (no `static`), the
   validation values are stub defaults; for apex modes, validation
   derives from the populated `static.*` per the contract.

   **Open holes preserved** (per `embody/DOCS.md` § Open holes):
   - `Distribution.samples: []` (raw vs stats-only resolution open).
   - `HasIo` ships only `total` keys; per-method counts (alert/
     prompt/confirm/log/etc) omitted (per-method-vs-sums-only
     resolution open).
   - `Features` ships only the 12 fields enumerated in types.ts.
   - The canned `Violation` for `VALIDATION_FAIL`, the eval-failure
     `EmbodyError` shapes (`endReport.error`), and the
     `FAIL_AT_<STAGE>` `errors.kind` are all Phase-A mock-shape;
     downstream tests should branch on the named field (e.g.
     `errors.phase === 'create'`, `validation.violations.length > 0`,
     `endReport.outcome === 'errored'`) rather than on specific
     kind/message/path values.

3. **Stream method shapes match types.ts § Streams (lines 747-770)
   exactly.** The mock returns the right shape, not just the right
   slot:

   - `streams.realm()` → `Generator<RealmBindingEvent>` (yields
     nothing in the mock).
   - `streams.parse.tokenize()` → `Generator<TokenEvent>`.
   - `streams.parse.parse()` → `Generator<NodeEvent>`.
   - `streams.create()` → `Generator<ScopeEvent | BindingEvent>` —
     present in `FAIL_AT_CREATE` and apex modes; absent in
     `FAIL_AT_TOKENIZE` and `FAIL_AT_PARSE`.
   - `streams.evaluate.run(options?)` → **`Promise<RunInstance>`**
     (NOT a `RunInstance`). Apex modes resolve to a frozen
     `RunInstance` with `events: []`, `endReport` per the scenario,
     `finalEnvironment` a stub `Scope`, `runMetrics` per types.ts
     § 10. Absent in `FAIL_AT_*` modes.
   - `streams.evaluate.intercept(options?)` → **`EvaluateHandle`**
     (sync return; async-iterable yielding zero events; `.result`
     Promise resolving to the same canned `RunInstance` `run()`
     produces; `.cancel()` is a no-op).
   - `streams.evaluate.trace.{syntax, semantics}(options?)` → same
     `EvaluateHandle` shape as intercept.

4. **Deep-freeze the returned graph.** Apex-status modes wire the
   `RunInstance.snippet` back-ref before freezing; calling
   `deepFreezeInPlace(runInstance)` walks `.snippet` into the snippet
   graph and freezes both in one pass. The
   [`@utils/deep-freeze-in-place`](../../utils/deep-freeze-in-place.ts)
   utility's visited-set guard prevents infinite recursion on the
   cycle. `FAIL_AT_*` modes have no `RunInstance` and freeze the
   snippet directly.

5. **No consumer-side sentinel string branching** (Phase B handoff
   rule). Orchestrator and lens code MUST NOT branch on the sentinel
   string identity (e.g. `if (snippet.source.code === 'EVAL_TIMEOUT')`).
   Always branch on the resulting Snippet's status / endReport /
   validation fields. Sentinels are inputs to `embody()` only; they
   are NOT consumed downstream. This rule is durable across Phase A
   and survives Phase B unchanged: in Phase B, `snippet.source.code`
   becomes real source, and any consumer code that branched on the
   sentinel breaks. AR-4 / AR-5 audits should grep consumer code for
   sentinel literal occurrences and fail any non-test usage.

**Why a mock first.** Pinning the consumption surface (orchestrator,
analysis libs in Step 7, lenses post-WS4) lets Phase A complete the
structural refactor without first solving real embody internals.
Token + AST type pedagogy refinement, event-payload locking, and the
generator surfaces all live in Phase B.

**Verify:** `embody(code)` returns a Snippet for any of the 11
scenario sentinels; `embody("anything-else")` throws; TypeScript
compiles end-to-end against the returned shape;
`Object.isFrozen(snippet) === true` recursively across all 11
scenarios; mutation attempts throw in strict mode; the eleven inputs
produce eleven distinct combinations of `status` /
`validation.isJeJ` / `static.nonDeterminism.random` /
`static.hasIo.user.total` / `endReport.outcome`; downstream code
(Step 7 onward) can call all the methods on `streams.*` without
runtime errors **across all apex-status scenarios** (especially: an
analysis lib must successfully short-circuit on
`embodiment.status.parsed === false` and `embodiment.status.created
=== false` without crashing on absent optional fields).

### Step 6 — Validate new `embody/lib/parse/` against `parse-old/`

> **Phase B — deferred.** Depends on Step 2 (Phase B) producing a real
> `embody/lib/parse/`. Lives in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).

Run both over the sandbox-programs corpus. Compare token streams + AST
shapes. When parity is confirmed (ideally automated diff test), delete
`embody/lib/parse-old/`.

**Verify:** parity test passes; `parse-old/` removed; no remaining
imports.

### Step 7 — Refactor analysis libs to take `embodiment`

> **Phase A — runs against the Step-5 mock embodiment.** The signature
> change to `(embodiment: Snippet)` is adopted immediately so the
> cross-peer consumption surface is pinned end-to-end before any real
> embody internals exist. Function bodies may stub fields the mock
> doesn't yet populate; mark those with `TODO(phase-b):` so they're
> easy to find when real data lands.

**Scope clarification.** Step 7 covers only the **static-side**
consumption of `embodiment` — i.e., `parse`, `static`, `validation`,
`errors`, `status`. Any analysis-lib code path that today reads
**evaluation events** (the dynamic side, via
`embodiment.streams.evaluate.*().events`) is gated on Phase B Step
B7 (event-payload locking) and stays in pre-refactor `lib/<module>/`
until then. Audit each lib for evaluation-event reads before
migrating; if found, defer that lib (or that code path within the
lib) and document the deferral here.

For each of: `recommender`, `socratizing`, `completing`, `editing`,
`error-interpreting`, `jej-documentation` — change the function
signature to accept an `embodiment` parameter (and any per-call
context). Remove any internal parsing/AST building these modules
currently do; consume the embedded data instead. Where the mock
doesn't yet populate a needed field, leave a `TODO(phase-b):` marker
in the body and stub a sensible default that keeps tests green.

**Verify:** each module's tests pass against an `embody(code)` mock
fixture **across all three input modes** (empty / parse-fail /
happy); module's TypeScript compiles cleanly against the new
`(embodiment: Snippet)` signature; modules correctly short-circuit
on `embodiment.status.parsed === false` without crashing on absent
optional fields; no `lib/parse-old/` or `lib/ast/` imports remain in
these modules.

### Step 8 — Create `orchestrate/`; copy editor concerns

> **✓ Complete (commit `5d6fc54`, 2026-05-05).** Editor moved (not
> copied) from `study-lenses/lenses/editor/` to
> `orchestrate/editor/`. Original deleted along with the rest of
> `study-lenses/`. The editor is the orchestrator's default
> home-base view, the only writer of snippet state.
>
> Pre-existing references in `src/theme/MDXComponents.js` were
> updated to the new path. The `<StudyLenses>` runtime resolution
> path is intact.

### Step 9 — Copy analysis libs to `orchestrate/lib/`

> **✓ Complete (commit `9df535e`, 2026-05-04).** 4 of the 6
> originally-listed analysis libs existed and moved (not copied):
> `socratizing`, `editing`, `error-interpreting`, `recommender`.
> The other two listed (`completing`, `jej-documentation`) were
> never created and are not part of this commit. Originals deleted.
>
> Cross-tree imports updated:
> `orchestrate/lib/socratizing/{analyzers,tests}/` references to
> `scope/` and `parse-old/` rewrote `'../../<module>/'` →
> `'../../../../embody/lib/<module>/'` (depth shift across peers).
>
> Pre-Step-7 signatures preserved verbatim — the actual signature
> change to `(embodiment: Snippet)` is the post-migration sweep
> (Step 7 below).

### Step 10 — Copy orchestrator; bake formatting pre-processing

> **✓ Relocation complete (commit `5d6fc54`, 2026-05-05).** The V2
> orchestrator (`study-lenses.tsx`, `default-registry.ts`,
> `toolbar.tsx`, tests/) moved (not copied) to
> `orchestrate/orchestrator/`. The 5 top-level helpers
> (`create-event-bus`, `create-orchestrator-state`,
> `execute-pipeline`, `pipeline`, `registry`) moved alongside.
> Originals deleted along with `study-lenses/`.
>
> **Formatting pre-processing NOT yet added** — left for the
> post-migration sweep / WS3 F1 work. The orchestrator code
> currently has typecheck errors from referencing the deleted
> `study-lenses/types.ts`; the sweep also fixes that.

### Step 11 — Migrate V2 lenses into `lenses/` (WS4-owned execution)

> **✓ Phase-A gate criterion met (commit `5d6fc54`, 2026-05-05).**
> `highlight` migrated to `lenses/highlight/` (contains
> `highlight.ts`, `DOCS.md`, `README.md`, `tests/`). Editor did NOT
> migrate to `lenses/` — instead moved to `orchestrate/editor/` as
> the orchestrator home base per Step 8. `study-lenses/`
> directory was deleted entirely along with all migrations.
>
> The migrated `highlight/` carries its **pre-Step-7 signatures
> verbatim** — the entry function still expects raw input, not
> `(embodiment: Snippet)`. The post-migration sweep + WS4 follow-up
> migrate the rest of WS4's lens roster (parsons, blanks,
> trace-table, etc.) from a richer-source project the user has.

The `LensModule` contract lives in
[`lenses/types.ts`](./lenses/types.ts). Future lens migrations
must be self-contained against the canonical contract:

- Conforms to `LensModule` (`name`, `Component`, `config`,
  `applicableTo`, `recommend`).
- Receives `embodiment` via props (not via direct embody import).
- Does not import from `embody/` or `orchestrate/` (top).
- May import from `orchestrate/lib/*` and `@-utils`.
- Receives whatever else it needs as props from the orchestrator.

### Step 12 — Update `index.ts`

Export the orchestrator's `<StudyLenses>` component as the primary
public surface (NOT embody — embody is internal):

```ts
export { StudyLenses } from './orchestrate/index.js';
// Optionally re-export types consumers need to type their snippet props
export type { … } from './orchestrate/types.js';
```

`embody` is **not** exported. Lens authors and curriculum authors don't
import `embody` directly; they consume `<StudyLenses>`, which builds
embodiments internally and distributes them to mounted lenses.

Deprecate the legacy named exports (`run`, `trace`, `validate`,
`parse`, `format`, `checkFormat`) — point each to the `<StudyLenses>`
equivalent in a deprecation warning. Migration window: TBD with the
package owner.

**Verify:** existing legacy callers still work (with warning);
`<StudyLenses snippet={…} />` works as the primary entry; `embody` is
NOT exposed as a public export.

### Step 13 — Delete originals at `javascript/lib/`

> **✓ Obsolete (effectively merged into Step 9).** The user chose
> delete-originals semantics; `javascript/lib/` was deleted in
> commit `9df535e` (2026-05-04) at the same time the modules
> moved. There are no remaining originals. This step exists in the
> original spec but is now a no-op.

### Step 14 — Update peer READMEs and DOCS

Each peer (`embody/`, `lenses/`, `orchestrate/`) gets its `README.md` and
`DOCS.md` updated to reflect end-state reality. Also update:

- `javascript/README.md` directory-structure table — already reflects
  the final shape (commit `0368be3`); verify it still does.
- `javascript/DOCS.md` § Directory architecture — already restructured
  to § Directory layout end-state-only (commit applying the
  end-state-only rule); verify the locked decisions, dependency rules,
  categorization rationale, and open holes sections still align.
- Cross-doc links: every reference to the old `lib/*` path is dead;
  fix them all.

**Verify:** front-door test: someone landing in
`javascript/README.md` cold can answer JEJ / NM / embody / lenses /
where-to-next; all cross-doc links resolve.

### Step 15 — Build `sandbox.html`

Out of scope for this refactor agent; flagged as a separate
ticket / different agent. The smoke-test harness at
`javascript/sandbox.html` exercises embody + lenses + orchestrate
end-to-end during development. README + DOCS already mention it as
planned.

### Step 16 — Final dependency-rule audit

Verify (manually or with a lint rule):

- No `lenses/<lens>/*` imports from `embody/` (top) or `orchestrate/` (top)
- No `embody/` imports from `orchestrate/`, `lenses/`, or `embody/lib/`
  → `embody/` (cycle)
- No `embody/lib/*` imports from `embody/` (top), `orchestrate/`, or
  `lenses/`
- No `orchestrate/lib/*` imports from `lenses/`
- No `@-utils` imports from anywhere inside `javascript/`

**Verify:** audit passes; consider committing a CI check that catches
violations going forward.

### Step 17 — Delete this file (end of Phase A)

Once **Phase A** is done, verified, and merged: delete
`REFACTOR-HANDOFF.md`. Its purpose is to bridge the gap between
"plan written" and "Phase A executed" — once executed, it's noise.

Phase B carries its own lifecycle in
[`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md), which
self-deletes at end of Phase B.

#### Phase A completion checklist

Steps marked `[✓]` are complete and merged. Steps marked `[ ]` are
the remaining work — the **post-migration sweep** + cleanup. This
file deletes (Step 17) once every item below is ticked.

- [✓] Step 1: `@`-alias resolves from each peer; `src/lib/utils/` is
      unchanged.
- [✓] Step 3: NM-rep modules relocated to `embody/lib/*`
      (commit `9df535e`, 2026-05-04). Originals deleted.
- [✓] Step 5: mock `embody(code)` returns a deep-frozen `Snippet`
      across all 11 named-scenario sentinels (`OK`, `FAIL_AT_*`,
      `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES`, `EVAL_*`);
      `embody("<unknown>")` throws; TypeScript compiles end-to-end
      against the returned shape (commit `9f1db34`, 2026-05-05).
- [~] Step 7: each analysis lib at `orchestrate/lib/<module>/`
      (`recommender`, `socratizing`, `editing`,
      `error-interpreting`) accepts `(embodiment: Snippet)`; tests
      pass against the relevant scenario sentinels covering each
      staircase rung. **The post-migration sweep.** Partial:
      `error-interpreting` complete (2026-05-05; `(embodiment: Snippet,
      error, options?)` shape; 67/67 tests pass; bundled
      `'../../../../utils/' → '@utils/'` path-fix in 3 files;
      tsc error-line count dropped 102 → 79). Remaining:
      `socratizing` (heaviest; 22 source files, ~1400 tests, deep
      parse/scope coupling); `editing` (CodeMirror wrapper —
      Step 7 fit nuanced; revisit shape). `recommender` is empty
      on disk (only a 0-byte `README.md`); WS2 lands the source
      separately, so it is OUT OF SCOPE for this sweep.
- [✓] Step 8: editor moved (not copied) from
      `study-lenses/lenses/editor/` to `orchestrate/editor/`
      (commit `5d6fc54`, 2026-05-05). Originals deleted.
- [✓] Step 9: 4 analysis libs (`socratizing`, `editing`,
      `error-interpreting`, `recommender`) moved to `orchestrate/
      lib/` (commit `9df535e`). Originals deleted.
- [✓] Step 10: V2 orchestrator + 5 helpers moved to
      `orchestrate/orchestrator/` (commit `5d6fc54`). Originals
      deleted. **Formatting pre-processing NOT yet added** — Step 7
      sweep or WS3 F1 picks this up.
- [✓] Step 11 (Phase-A gate): `highlight` migrated to
      `lenses/highlight/` (commit `5d6fc54`). WS4 owns migrating
      the rest from a richer-source project.
- [ ] Step 12: `javascript/index.ts` exports `<StudyLenses>` as the
      public surface; `embody` is NOT part of the public surface.
      Legacy named exports (`run`, `trace`, `validate`, etc.) are
      deleted (the prior `api/` directory is already gone).
- [ ] Step 13: ✓ Obsolete (effectively merged into Step 9 by the
      delete-originals policy).
- [~] Step 14: `lenses/` and `orchestrate/` `README.md` + `DOCS.md`
      reflect post-Phase-A reality; `javascript/README.md`
      directory-structure table verified; cross-doc links resolve.
      (`embody/` peer docs finalize in Phase B.) **Partial — the
      doc-completeness sweep landed 2026-05-05** (locked four-prop
      API + `configs` resolution chain documented, no-consumer-side-
      sentinel-branching rule pinned across all peer docs,
      transforms-as-lens-internal explicit, validation derivation
      rules cross-referenced, pre-refactor subdirs (`orchestrate/
      orchestrator/`, `orchestrate/editor/`, `lenses/highlight/`)
      banner-flagged STALE pending Step-7 regeneration). What
      remains for Step 14: regenerate the STALE-banner-flagged files
      bottom-up after Step 7 lands and after WS3 F1 ships the real
      orchestrator wiring.
- [ ] Step 16: dependency-rule audit passes for all Phase-A-touched
      files. Consider adding a CI lint rule.
- [ ] Step 17: delete this file.

**All Phase B steps remain in `EMBODY-IMPL-HANDOFF.md`** (B1, B2
re-typing, B3 strip validation/freezing, B4 parity, B5 replace mock
body, B6 obsolete now, B7 event payloads, B8 generators, B9 final
audit, B10 delete EMBODY-IMPL-HANDOFF.md).

## Notes for the next agent (post-migration sweep)

- **The remaining steps are the sweep.** Step 7 is the load-bearing
  one: walk each `orchestrate/lib/<module>/` and update the entry
  function's signature to `(embodiment: Snippet, …rest)`. Drop
  internal parsing/AST building; consume `embodiment.parse`,
  `embodiment.static`, `embodiment.errors`, `embodiment.status`.
  Tests update in lockstep — pass `embody("OK")` (or other named
  scenarios) instead of building ASTs directly.
- **Typecheck is RED post-migration.** Multiple causes — analysis
  libs' pre-Step-7 signatures, orchestrator code referencing
  deleted `study-lenses/types.ts`, and pre-existing broken imports
  (`@study-lenses/tracing` package alias, `'../../../../utils/'`
  relative paths in `orchestrate/lib/error-interpreting/*.ts`).
  Sweep restores typecheck-green.
- **Embody mock tests are the only verified-green signal.** 102/102
  passing. The mock factory at `embody/index.ts` and its contract
  at `embody/types.ts` are LOCKED — do not touch.
- **`embodiment` parameter name everywhere.** When refactoring lib
  signatures, use this name consistently. Function bodies that need
  fields the mock doesn't yet populate get `TODO(phase-b):` markers,
  not silent stubs.
- **No consumer-side sentinel string branching** (durable rule):
  orchestrator and lens code MUST NOT branch on `code === "OK"` or
  any sentinel literal. Branch on the resulting `Snippet`'s status
  / endReport / validation fields. AR audits grep consumer code for
  sentinel literals and fail any non-test usage.
- **AR cycle.** AR-3 (test strategy) + AR-4 (impl audit) per atomic
  commit per AGENTS.md non-negotiable. AR-5 at end of the sweep.
- **Per-module atomic commits.** One commit per analysis lib + one
  for orchestrator/editor `study-lenses/types.ts` cleanup. Avoid
  monolithic sweep commits.

## Quick reference — final import paths

After the refactor:

```ts
// Inside embody/
import { foo } from './lib/parse/index.js';            // OK
import { deepFreezeInPlace } from '@utils/deep-freeze-in-place.js'; // OK

// Inside lenses/parsons/
import type { Snippet } from '../../embody/types.js';  // OK (type only)
import { interpret } from '../../orchestrate/lib/error-interpreting/...';  // OK
import { foo } from '../../embody/index.js';           // ❌ never

// Inside orchestrate/
import { embody } from '../../embody/index.js';        // OK
import { ParsonsLens } from '../../lenses/parsons/...';  // OK
import { recommend } from '../lib/recommender/...';    // OK
```

## Cross-references

- [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) — Phase B's
  ordered steps for real embody internals (parse, NM-rep copies with
  pedagogical re-typing, validation strip, parity test, event
  payloads, generator surfaces).
- [`embody/types.ts`](./embody/types.ts) — the `Snippet` contract the
  Step-5 mock satisfies and that Phase B locks in real form.
- [`.planning-handoffs/03-orchestrator-and-contracts.md`](./.planning-handoffs/03-orchestrator-and-contracts.md)
  — the WS3 consumer this Phase A unblocks (orchestrator + four-prop
  public API).
- [`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md)
  — the WS4 owner of Step 11's per-lens execution.
