# Refactor handoff — directory split + embody implementation

**Status:** roadmap, not yet executed.
**Audience:** the agent (Claude or otherwise) that will perform the
restructure described in [`DOCS.md`](./DOCS.md) § Directory architecture
§ Target shape (post-refactor).
**Lifecycle:** delete this file after the work is done. It exists to
hand off context, not to live forever.

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
Step 8's editor extraction consumes analysis libs that Step 9 moves):

```text
1 → 5 → 7 → 9 → 8 → 10 → 11 → 12 → 14 → 16 → 17
```

Why 9 before 8: Step 8 pulls editor concerns out of `study-lenses/`
into `orchestrate/editor/`, where the editor consumes analysis libs
(`error-interpreting`, `completing`, `editing`, `jej-documentation`)
via their new paths under `orchestrate/lib/*`. Step 9 must do the
move first; otherwise Step 8 lands with broken imports or has to
re-fix them post-Step-9.

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

> **Phase B — deferred until after the Step-5 mock lands.** The work
> happens in [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).
> Each module's typing is re-evaluated for pedagogical clarity as it
> moves; this is not a verbatim relocation.

**Copy semantics, not move.** The original `javascript/lib/<module>/`
paths stay in place during the migration so consumers can switch
incrementally. Once every consumer points at the new path AND the
new module is the canonical source, the original is deleted in a
later cleanup step. Two paths coexist during the transition.

```text
lib/ast/             ⇒ embody/lib/ast/         (copy; original kept)
lib/validating/      ⇒ embody/lib/validating/  (copy; original kept)
lib/formatting/      ⇒ embody/lib/formatting/  (copy; original kept)
lib/evaluating/      ⇒ embody/lib/evaluating/  (copy; original kept)
lib/scope/           ⇒ embody/lib/scope/       (copy; original kept)
lib/parse-old/       ⇒ embody/lib/parse-old/   (copy; both deleted at step 6 once parity confirmed)
```

After the copy: update internal imports across the new copies to
point at sibling new copies (so the new tree is self-contained).
Original `lib/<module>/` paths remain untouched until the cleanup
step.

**Verify:** TypeScript compiles; existing tests still pass against
both the copies AND the originals; consumers can opt-in to either
path during the transition.

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

### Step 5 — Build a full mock of `embody(code)`

> **Phase A — pivot from earlier draft.** This step builds a frozen-
> output mock that satisfies the `Snippet` contract from
> [`embody/types.ts`](./embody/types.ts) **without invoking any
> `embody/lib/*` internals** (the lib is moved/built in Phase B). The
> real per-module composition replaces this mock body in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) once each
> module's pedagogical re-typing is locked.

The mock at `embody/index.ts` (or similar) must:

1. **Be input-discriminated, not a constant.** Phase A's gate is
   "consumers compile and tests pass against the mock"; that gate is
   only meaningful if the mock can produce the staircase failures the
   `status` booleans gate against. At minimum three modes:
   - `code === ""` (empty) → tokenize fails: `status.tokenized: false`,
     `status.parsed: false`, `status.created: false`,
     `errors: { phase: 'parse:tokenize', kind: 'SyntaxError', message:
     'empty source', loc: null }`. Per types.ts § 12 staircase
     comment: only `source`, `parse.tokens` (partial), `errors`,
     `validation`, `streams.realm`, `streams.parse.tokenize` are
     available; everything else is per-status absent.
   - Sentinel `code === '/* MOCK_PARSE_FAIL */'` (or similar
     well-known marker) → tokenize succeeds, parse fails:
     `status.tokenized: true, parsed: false, created: false`,
     `errors: { phase: 'parse:ast', … }`.
   - Anything else → happy path: all `status.*: true`, `errors: null`.

   Plus an exported override builder:
   `embodyMock(code).with({ status: { … }, errors: { … }, … })` so
   Step 7 / Step 11 tests can construct partial-status fixtures
   without tripping the sentinel logic. The override builder accepts
   a deep-partial of `Snippet` and merges right-wins before freezing.

2. Accept `(code: string) => Snippet`. Return a deep-frozen object
   that satisfies the `Snippet` type from
   [`embody/types.ts`](./embody/types.ts) (lines 784-803). Fabricate
   shape-valid stub data per status-mode:

   | Field | Empty / parse-fail | Happy path |
   | --- | --- | --- |
   | `source` | `Source` from `code` (whitespace-only OK) | same |
   | `parse.tokens` | `[]` (empty per "partial" allowance) | array with one fake `AugmentedToken` spanning `[0, code.length]` |
   | `parse.comments` | `[]` | `[]` |
   | `parse.ast` | absent (not parsed) | fake `Program` node with `body: []`, wrapping a stub `acornNode` of `type: 'Program'` |
   | `static.*` | absent (not created) | every sub-field per types.ts §5 (`realm`, `initialScope`, `scope`, `dependencies`, `features`, `metrics`, `controlFlow`, `nonDeterminism`, `hasIo`) populated with empty-state defaults conforming to types.ts |
   | `validation` | `{ isJeJ: true, isDeterministic: true, doesPause: false, formatted: true, violations: [] }` | same |
   | `errors` | per-mode (see above) | `null` |
   | `status` | per-mode | all `true` |

   **All five `Validation` fields** must be set explicitly (per
   types.ts lines 378-384: `isJeJ`, `isDeterministic`, `doesPause`,
   `formatted`, `violations`). The earlier "etc." in this spec is
   not acceptable; enumerate every field.

3. **Stream method shapes match types.ts § Streams (lines 747-770)
   exactly.** The mock returns the right shape, not just the right
   slot:

   - `streams.realm()` → `Generator<RealmBindingEvent>` (mock yields
     nothing or one canned event).
   - `streams.parse.tokenize()` → `Generator<TokenEvent>`.
   - `streams.parse.parse()` → `Generator<NodeEvent>`.
   - `streams.create()` → `Generator<ScopeEvent | BindingEvent>`.
   - `streams.evaluate.run(options?)` → **`Promise<RunInstance>`**
     (NOT a `RunInstance`). Resolves to a frozen `RunInstance` with
     `events: []`, `endReport` carrying `success`, `finalEnvironment`
     a stub `Scope`, `runMetrics` per types.ts § 10.
   - `streams.evaluate.intercept(options?)` →
     **`EvaluateHandle`** (sync return; async-iterable + `.result`
     Promise per types.ts lines 742-745).
   - `streams.evaluate.trace.{syntax, semantics}(options?)` →
     **`EvaluateHandle`**.

   Generators may be empty (`function* () {}`); `EvaluateHandle`
   instances may resolve immediately to an empty-events
   `RunInstance`.

4. **Deep-freeze the returned graph including back-references.**
   `RunInstance.snippet` (types.ts line 711) is a back-ref to the
   embodiment that produced it. The existing
   [`@/utils/deep-freeze-in-place`](../../utils/deep-freeze-in-place.ts)
   utility tracks visited objects via a `WeakSet` parameter, so cycles
   are handled natively — wire `RunInstance.snippet` to the same
   frozen `Snippet` reference and call the freezer on the snippet
   graph; the back-ref is visited-once and skipped on re-entry. No
   need for a lazy getter.

**Why a mock first.** Pinning the consumption surface (orchestrator,
analysis libs in Step 7, lenses post-WS4) lets Phase A complete the
structural refactor without first solving real embody internals.
Token + AST type pedagogy refinement, event-payload locking, and the
generator surfaces all live in Phase B.

**Verify:** `embody(code)` returns a Snippet for any input string;
TypeScript compiles end-to-end against the returned shape;
`Object.isFrozen(snippet) === true` (recursively, including the
`RunInstance.snippet` back-ref); mutation attempts throw in strict
mode; the three input modes produce three distinct `status` shapes;
the override builder produces shape-valid fixtures with the
overridden fields applied; downstream code (Step 7 onward) can call
all the methods on `streams.*` without runtime errors **across all
three modes** (especially: an analysis lib must successfully
short-circuit on `embodiment.status.parsed === false`). At least one
mock fixture in each mode round-trips through a downstream consumer
(e.g. an analysis lib from Step 7) end-to-end.

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

### Step 8 — Create `orchestrate/`; move editor concerns

Pull editor concerns out of `study-lenses/` (the editor lens, its UI,
its state hooks) into `orchestrate/editor/`. The editor is no longer a
lens; it's the orchestrator's default home-base view.

**Verify:** `study-lenses/` no longer contains an editor lens;
`orchestrate/editor/` builds and renders the editor; `orchestrate/editor/`
mutates snippet source via the orchestrator.

### Step 9 — Copy analysis libs to `orchestrate/lib/`

**Copy semantics, not move.** Same pattern as Step 3 (Phase B):
originals stay at `javascript/lib/<module>/` while the new copies
land at `orchestrate/lib/<module>/`. Consumers migrate incrementally;
the originals are deleted in a later cleanup step.

```text
lib/socratizing/        ⇒ orchestrate/lib/socratizing/        (copy; original kept)
lib/jej-documentation/  ⇒ orchestrate/lib/jej-documentation/  (copy; original kept)
lib/completing/         ⇒ orchestrate/lib/completing/         (copy; original kept)
lib/editing/            ⇒ orchestrate/lib/editing/            (copy; original kept)
lib/error-interpreting/ ⇒ orchestrate/lib/error-interpreting/ (copy; original kept)
lib/recommender/        ⇒ orchestrate/lib/recommender/        (copy; original kept)
```

After the copy: update internal imports inside each new copy to
point at sibling new copies. Update the consumers that are part of
Phase A (the orchestrator + editor in Step 8/10, the
to-be-modified-in-Step-7 analysis-lib signatures) to point at the
new `orchestrate/lib/*` paths. Consumers outside Phase A (legacy
named exports per Step 12, V2 lenses still in `study-lenses/`)
continue to point at the originals until WS4 migrates them.

**Verify:** each module accessible from `orchestrate/lib/`;
Phase-A-touched consumers import from the new paths; the originals
at `javascript/lib/<module>/` still exist and are still imported by
non-Phase-A consumers.

### Step 10 — Move orchestrator + bake formatting pre-processing

Pull the orchestrator out of `study-lenses/` into
`orchestrate/`. Add a formatting pre-processing step in the
orchestrator's load pipeline so all source feeding into `embody(code)`
is consistently formatted.

**Verify:** orchestrator builds; loading any source produces a
formatted snippet; non-JEJ source is NOT rejected (validation is
metadata, not a gate).

### Step 11 — Migrate V2 lenses into `lenses/` (WS4-owned execution)

> **Phase A gate criterion lives here; per-lens execution is owned by
> WS4.** The new `lenses/` peer already exists with the canonical
> `LensModule` contract in [`lenses/types.ts`](./lenses/types.ts)
> (landed in Round 2). V2 lens code lives in
> `study-lenses/lenses/{editor, highlight, …}` and migrates one lens
> at a time per
> [`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md).
> Note `editor/` does NOT migrate to `lenses/` — Step 8 moves it to
> `orchestrate/editor/` as the home base.

For each V2 lens migrated to `lenses/<name>/`, verify it is
self-contained against the canonical contract:

- Conforms to `LensModule` (`name`, `Component`, `config`,
  `applicableTo`, `recommend`).
- Receives `embodiment` via props (not via direct embody import).
- Does not import from `embody/` or `orchestrate/` (top).
- May import from `orchestrate/lib/*` and `@-utils`.
- Receives whatever else it needs as props from the orchestrator.

`study-lenses/` is **deleted only after the last V2 lens migrates**
out of it (a Phase-A-completion marker enforced by WS4's last
increment).

**Verify (Phase-A gate):** at least one V2 lens — `highlight` is the
natural first since `editor` becomes the orchestrator's home base in
Step 8 — is migrated through this contract; the dependency-rule
audit passes for that lens; the path is unblocked for the rest of
WS4 to migrate the remaining lenses lens-by-lens.

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

> **Phase B — deferred.** This is the cleanup step that mirrors the
> copy-semantics of Steps 3 and 9: originals at `javascript/lib/*`
> are deleted only once every consumer has migrated to the new
> `embody/lib/*` and `orchestrate/lib/*` paths. Lives in
> [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md).

After every consumer has migrated to the new paths AND the new
copies are the canonical sources, delete the originals one module
at a time:

1. Confirm no remaining imports from `javascript/lib/<module>/`
   (grep across the repo).
2. Delete `javascript/lib/<module>/`.
3. Run the full test suite.
4. Repeat per module.

When all originals are gone, `javascript/lib/` should contain
nothing. Delete the directory itself.

**Verify:** `ls javascript/lib/` returns "no such file or directory";
full test suite passes; no import resolution errors.

### Step 14 — Update peer READMEs and DOCS

Each peer (`embody/`, `lenses/`, `orchestrate/`) gets its `README.md` and
`DOCS.md` updated to reflect the post-refactor reality. Also update:

- `javascript/README.md` directory-structure table → final shape
- `javascript/DOCS.md` "Current shape" section → drop (it IS the
  current shape now); keep "Locked decisions", "Dependency rules",
  "Categorization rationale", "Open specs"
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

Before deleting this file, confirm every item below. **All items
must be ticked**; "skipped because trivial" is not allowed (skip
each individually, document why in the deletion commit body).

- [ ] Step 1: `@`-alias resolves from each peer; `src/lib/utils/` is
      unchanged.
- [ ] Step 5: mock `embody(code)` returns a deep-frozen `Snippet`
      across all three input modes (empty / parse-fail / happy);
      override builder works; TypeScript compiles end-to-end against
      the returned shape.
- [ ] Step 7: each analysis lib (`recommender`, `socratizing`,
      `completing`, `editing`, `error-interpreting`,
      `jej-documentation`) accepts `(embodiment: Snippet)`; tests
      pass against all three mock modes; no `lib/parse-old/` or
      `lib/ast/` imports remain.
- [ ] Step 9 (executed before Step 8): all six analysis libs are
      **copied** to `orchestrate/lib/` (originals at
      `javascript/lib/*` kept). Phase-A-touched consumers
      (orchestrator, editor, the Step-7-modified analysis-lib
      signatures) import from the new `orchestrate/lib/*` paths.
      Non-Phase-A consumers (legacy named exports, V2 lenses still
      in `study-lenses/`) continue importing from originals.
- [ ] Step 8: editor concerns extracted to `orchestrate/editor/`;
      editor consumes `embodiment` via prop (not internal parsing);
      imports point at `orchestrate/lib/*` for analysis-lib usage.
- [ ] Step 10: orchestrator builds; formatting pre-processing on load
      works; non-JEJ source is **not** rejected (validation is
      metadata, not a gate).
- [ ] Step 11: at least one V2 lens (recommended: `highlight`) is
      migrated to `lenses/<name>/` against the `LensModule` contract;
      that lens passes the dependency-rule audit. WS4 owns migrating
      the rest; `study-lenses/` deletion is WS4's concern, NOT this
      checklist's.
- [ ] Step 12: `index.ts` exports `<StudyLenses>` as the public
      surface; legacy named exports still work with deprecation
      warnings; `embody` is not part of the public surface.
- [ ] Step 14 (Phase A portion): `lenses/` and `orchestrate/`
      `README.md` + `DOCS.md` reflect post-Phase-A reality;
      `javascript/README.md` directory-structure table updated;
      cross-doc links resolve. (`embody/` peer docs finalize in
      Phase B.)
- [ ] Step 16 (Phase A audit): dependency-rule audit passes for the
      Phase A-touched files. Note: a CI lint rule covering all rules
      may need a temporary allowlist for `study-lenses/` paths
      (lenses not yet migrated by WS4); document the allowlist.
- [ ] **All Phase B steps remain marked deferred** in this file (no
      one accidentally implemented Step 2/3/4/6/13 against the
      mock); they live in `EMBODY-IMPL-HANDOFF.md`.

## Notes for the refactor agent

- **Steps 8–11 are the highest-blast.** Editor extraction (Step 8)
  and per-lens migration into the new `lenses/` shell (Step 11, WS4-
  owned) touch many imports. Do them as coordinated commits; verify
  TypeScript at each one. Step 11's per-lens execution lives in
  [`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md);
  this file only carries the Phase-A gate criterion.
- **Step 5 is a mock, not the real factory.** Reference
  [`embody/types.ts`](./embody/types.ts) as the contract the mock
  satisfies. The mock fabricates shape-valid stub data without invoking
  any `embody/lib/*` internals. Real per-module composition replaces
  the mock body in
  [`EMBODY-IMPL-HANDOFF.md`](./EMBODY-IMPL-HANDOFF.md) (Phase B).
- **AR cycle.** Doc commits get full AR-1 + AR-2 (per repo convention).
  Code commits get at minimum AR-5 pre-merge audit. The Step-5 mock
  warrants AR-1 (mock-design challenge: are we faking enough fields
  to unblock consumers without faking so many that downstream tests
  pass against fiction?) and AR-2 (sketch challenge against
  `embody/types.ts`'s Snippet shape). The Step-8 orchestrate component
  shape warrants its own AR-1 design challenge.
- **Tests.** Existing tests live alongside the moved modules; expect
  them to need import-path updates but mostly to pass unchanged. The
  Step-5 mock needs new tests covering: shape-conformance (typecheck
  passes), deep-freeze, callable-stream methods, at least one
  round-trip through an analysis lib from Step 7.
- **`embodiment` parameter name everywhere.** When refactoring lib
  signatures (step 7), use this name consistently — it codifies the
  term across the codebase per the architectural decision. Function
  bodies that need fields the mock doesn't yet populate get
  `TODO(phase-b):` markers, not silent stubs.

## Quick reference — final import paths

After the refactor:

```ts
// Inside embody/
import { foo } from './lib/parse/index.js';            // OK
import { deepFreezeInPlace } from '@/utils/...';       // OK

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
  ordered steps for real embody internals (parse, NM-rep moves with
  pedagogical re-typing, validation strip, parity test, event
  payloads, generator surfaces).
- [`embody/types.ts`](./embody/types.ts) — the `Snippet` contract the
  Step-5 mock satisfies and that Phase B locks in real form.
- [`.planning-handoffs/03-orchestrator-and-contracts.md`](./.planning-handoffs/03-orchestrator-and-contracts.md)
  — the WS3 consumer this Phase A unblocks (orchestrator + four-prop
  public API).
- [`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md)
  — the WS4 owner of Step 11's per-lens execution.
