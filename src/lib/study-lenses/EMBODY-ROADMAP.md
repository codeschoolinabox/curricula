# embody — gap-closure roadmap & delegation plan

> **Transitional handoff** (DEV.md § What goes in docs vs plans vs handoffs).
> This is the durable map for conforming embody's **code** to its **locked
> contract** (`README.md` / `DOCS.md` / `types.ts`). It is migration
> scaffolding, not end-state truth — the end-state docs are. **Self-delete when
> the migration completes.** Supersedes the former `EMBODY-IMPL-HANDOFF.md`
> (deleted 2026-06-18; its inbound references now point here — see §
> Provenance).
>
> Verified 2026-06-18 by a 16-agent read-only gap-analysis pass (adversarially
> checked) + manual confirmation. See § Provenance.

## How to use this doc

- **Human** owns: tier ordering, the Phase-0→1 review gates, and roadmap calls
  (module retirements, deletions, scope). Each STEP names where you decide.
- **Agent** owns: pick the next unblocked STEP, read its spec + the cited docs,
  run the **full DDD/AR ceremony** (DEV.md Phase 0 → Phase 1 per increment →
  Phase 2), **stop at the human Phase-0→1 gate**, one behavior per commit. ARs
  are mandatory and not agent-skippable.

## Orientation (read before any step)

embody (`src/lib/study-lenses/embody/`) turns a JS source string into a
frozen-data + event-stream embodiment of the JEJ notional machine. Its contract
is unusually mature: a **three-layer framework** (Data → Entwined → NMEvent), a
phase×layer grid, a 6-leaf hard-gated staircase
(`tokenize → parse → validate → create`, branched by source `type`), tiered
runnability, `byPath`/`byOffset` indexes, and language-levels-as-plugins. The
implementation is mid-migration: the `embody()` factory serves 11 canned
scenario fixtures (permanent) plus a real-composition branch that today produces
only raw acorn output and **stubs everything the contract layers on top**.

**Design-target doctrine (do not lose this):** the `README.md` / `DOCS.md` /
`types.ts` are the design target. Conform **code → docs**, never docs → code.
Classify every finding as one of:

- **Genuine divergence** — code contradicts/omits a locked contract element →
  _close it_.
- **Deliberate open hole** — `DOCS.md § Open holes` / `§ Out of scope`
  intentionally leaves it unspecified → _leave it_ (it is a future-DDD slot).
- **Migration staleness** — a handoff/plan may be stale vs. the code → _not
  ground truth_; verify against the end-state docs.

**Key reads:** `0-curricula/DEV.md` (conventions, the Phase 0→1→2 workflow, the
AR protocol, the DOCS/README and `## Data flow` Mermaid rules); the contract
(`embody/README.md`, `embody/DOCS.md`, `embody/types.ts`); and `embody/index.ts`
(the factory — scenario dispatch plus the stubbed real-composition branch).

## Current state (verified 2026-06-18)

- The factory imports **zero `embody/lib/*`** modules — it runs acorn inline and
  stubs every phase's `.data`/`.entwined`/`.events`, plus
  `analysis`/`validation`/`creation`. Real input plateaus at "parsed".
- `embody/lib/parse/` **does not exist**; `parse-old/` remains
  (tsconfig-excluded); `embody/lib/ast/` is a **types-only Phase-0 sketch** (see
  STEP 0 — being retired).
- `embody(code: string)` takes **no `{ type }` option** — `SnippetType` /
  `EmbodyOptions` are orphaned; the `script-parsed` leaf is unreachable.
- All of `evaluating/{trace,intercept,run,shared}` + `parse-old` are
  **tsconfig-excluded**; `trace/semantics` is **vitest-excluded** too.
- The `lib/*` modules are NOT dead: `lib/linting`, `lib/formatting-editor`,
  `lib/completing`, `orchestrate/lib/socratizing` consume
  `validating`/`scope`/`formatting` via the old (pre-contract) APIs.

## TIER 0 — resolved decisions (2026-06-18)

- **Parse-layer naming = (i):** builder = **`lib/parse/`** (produces
  `parseAST.data`/`.entwined` + `byPath`/`byOffset`); generator =
  **`parseAST.events()`** (replays the static data as `NodeNMEvent`). This is
  the human's two-layer model and matches the contract exactly.
- **`lib/ast/` is retired** (STEP 0). It is a learner-facing AST-stepping engine
  (its own `ParseHandle`/`cancel`/`fail`/`willEmit` vocabulary) that fuses both
  layers into one and explicitly disclaims `byPath` — superseded by the clean
  builder + `parseAST.events()` split. Its stepping role is already covered by
  `parseAST.events()` (NodeNMEvent enter/exit).

## Ordered delegation plan

Dependency-bottom-up (DEV.md "leaves first"). Each STEP is one DDD cycle (or a
small precursor). `S/M/L/XL` = effort. Each STEP's _Closes:_ names the gap IDs
it resolves; the full list is in § Verified gap inventory.

### STEP 0 — Retire `lib/ast/` (precursor, S, no DDD)

- **Goal:** delete the superseded stepping-engine sketch so it stops confusing
  readers (and gap tooling). **Blast radius (measured):** 9 files, all
  types+docs, no impl/tests; **zero external importers**; **zero**
  tsconfig/eslint/vitest/package refs; removes a latent cross-dep on the
  excluded `trace/syntax/StepCategory`.
- **Do:** first lift the reusable design thinking (two-level token-kind
  discrimination; the `roleInParent`/`precedence`/`willEmit` pedagogy-field
  ideas; node-enter/exit + source-position-drain discipline) into STEP 1's
  Phase-0 docs. Then `git rm -r embody/lib/ast/` + 1-line doc edits in
  `study-lenses/DOCS.md` (layout), `embody/DOCS.md` § lib integration (drop
  `ast/`, name `parse/` as the builder), `parse-old/{DOCS,README}.md` status
  notes (point at `lib/parse/`).
- **Gate:** human confirms the retirement (roadmap call). Standalone atomic
  commit, or fold into STEP 1's AR-5.

### STEP 1 — Build `lib/parse/` (the builder) + wire the factory (XL, the floor)

- **Closes:** `lib-parse-dir-absent`, `factory-no-lib-parse`,
  `factory-bypath-byoffset-never-produced`,
  `factory-phase-data-entwined-empty-stubs` (the L2/L3 portion),
  `factory-real-apex` (tokenize/parse slices), `ast-parse-phase0-no-impl`.
- **Goal:** acorn output → `TokenData[]`/`TokenizeEntwined` and
  `NodeData`/`NodeEntwined` tree + the contract-locked `byPath`/`byOffset`
  indexes; then wire into the factory replacing
  `makeStubTokenizePhase`/`makeStubParseASTPhase`, and have `parseAST.events()`
  replay the static graph as `NodeNMEvent`.
- **L1 types live in `embody/types.ts`** (lines ~112/115/118/265/268 — fill the
  placeholder interfaces), NOT a new `lib/parse/types.ts`. The L2 Entwined +
  `byPath`/`byOffset` + `Snippet` shapes are already locked and stay
  byte-stable; every field-add needs a full-package typecheck.
- **Module shape:** `classify-token.ts` (sole reader of acorn `.type.label` → a
  two-level `{ category, kind }` discriminant mirroring `NMEvent`),
  `tokenize.ts`, `parse-ast.ts`, `node-path.ts` + `child-segments.ts` (re-derive
  parse-old's `$`-rooted path spec — parity oracle), `build-by-path.ts`,
  `build-by-offset.ts`, `entwine-tokens-to-nodes.ts`, `key-token.ts`;
  `README.md`/`DOCS.md`/`glossary.md`.
- **lib/parse receives `RawAcorn` from the factory** (factory owns the acorn
  invocation); returns raw/unfrozen data (factory's single deep-freeze).
- **Ceremony:** Phase 0 (glossary → README → **AR-1** → fill `types.ts` holes →
  DOCS sketch + `## Data flow` Mermaid → **AR-2** → **human gate**). Phase 1
  TDD: **first increment = `node-path`/`child-segments`** (deepest leaf; ZOMBIES
  Z→O→M→B triangulated by "many declarations" + "sparse-array hole
  `[1,,3]`→`elements.0,.2`"; `classify-token` is the alt first leaf). Parity
  test vs `parse-old/` across the 20 `study-lenses/sandbox-programs/*.js`.
  AR-3/AR-4 per increment, AR-5 pre-merge.
- **Gate:** human review after Phase 0 (before any test) and at AR-5.
- **Open Phase-0 sub-questions for the human:** `ParseASTData.root` navigable vs
  scalar-root-only; `NodeData` minimal vs rich
  (`operator`/`value`/`name`/`raw`); token-kind granularity.

### STEP 2 — Source-type option `{ type }` (L, consumers waiting)

- **Closes:** `factory-no-type-option`,
  `factory-script-parsed-leaf-unreachable`,
  `orchestrator-hardcodes-module-no-type-toggle`.
- **Goal:** `embody(code, { type })`; reach the `script-parsed` leaf; thread
  `SnippetType`. `deriveStationAvailability` already has a tested `script`
  branch that is currently unreachable — a real consumer is waiting. Depends on
  STEP 1 (real parse) to be meaningful.
- **Ceremony:** full DDD cycle; small, cleanly TDD-shaped.

### STEP 3 — Complete the staircase: validating + scope → real apex (XL)

- **Closes:** `validating-produces-old-baseresult-not-validation`,
  `validating-no-determinism-pause-derivation`,
  `scope-legacy-shape-not-creationdata`,
  `scope-validating-not-wired-to-factory`, `factory-real-apex-no-staircase`.
- **Goal (two sub-cycles):** (a) `validating/` emits the contract `Validation`
  (`isJeJ` gate + `violations`; **the `isDeterministic`/`doesPause`/`formatted`
  derivation belongs in the composing FACTORY** from `snippet.analysis`, not in
  validating); (b) `scope/` emits `CreationData`/`CreationEntwined` (resolve the
  `DeclarationInfo` name collision). Then wire the validate + create gates into
  the factory → real `validate-fail`/`create-fail`/apex leaves + `analysis`.
- **Caveat:** these modules have **live external consumers** (`lib/linting`,
  `lib/completing`, `socratizing`) on the old API — migrate or dual-path
  carefully. Each sub-cycle is its own DDD/AR cycle.

### STEP 4 — Evaluating engine: un-exclude + `RunInstance` adapter + wire (XL; overlaps the separate evaluating campaign)

- **Closes:** `engines-not-wired-into-factory`,
  `engine-result-types-diverge-from-runinstance`, `outcome-vocabulary-mismatch`,
  `endreport-ok-axis-inverted`, `engines-tsconfig-excluded`,
  `readonly-local-mutation-hazard-live`,
  `engine-handle-not-anynmevent-iterable`.
- **Goal:** un-exclude `run/intercept/shared` from tsconfig (apply the readonly
  recovery recipe first — see § Landmines); adapter mapping
  `RunResult`/`RunHandle`/`InterceptResult` → `RunInstance`/`EndReport`/
  `EvaluateHandle` (outcome-vocab map; `ok` true iff `completed`; synthesize
  `runMetrics`; `failReason` placement; `AnyNMEvent` iteration); wire
  `run`/`intercept` into `evaluation.events` + tiered runnability.
- **Note:** re-measure the "~100 errors on un-exclusion" figure first — it is
  the old handoff's claim, not re-verified here.

### STEP 5 — Trace/semantics redesign (XL; the B7 ledger)

- **Closes:** `trace-semantics-unexcluded`, `controlflow-split-incomplete`
  (system-wide: generators + advice + config/pointcut),
  `functionreturnevent-emitted-but-deleted`, `resolve-machinery-missing`,
  `linkedtraceevent-missing-and-baseevent-not-wiresafe`.
- **Goal:** un-exclude `trace/semantics` from tsconfig+eslint+vitest; let the
  surfaced failures drive the redesign per § B7 blocker ledger. Largest item;
  its own campaign.

### Cross-cutting — doc/convention polish (batchable anytime, S)

Empty `evaluating/DOCS.md`; missing `## Data flow` Mermaid in
`formatting/`/`scope/`/`tracing/`/`trace/syntax/`/`trace/semantics/`/parent
`study-lenses/DOCS.md`; missing README+DOCS in `ast/shared`/`intercept/link`/
container dirs; barrel `trace/semantics/index.ts`; `index.ts`-named
single-function files; tests-alongside-source; doc-staleness (validating README
sync-vs-async; `scope/` phantom consumer; `shared/DOCS.md` logs vocab). Low
severity; fold into whichever STEP touches the dir, or batch.

## Verified gap inventory

The findings each STEP closes, with severity (the open-hole items below are
_deliberate_ — do not close them). IDs are stable handles.

### Parse-builder gaps (STEP 1)

- `lib-parse-dir-absent` (critical) — `embody/lib/parse/` does not exist; the
  empty bottom of the dependency staircase.
- `factory-no-lib-parse` (high) — factory runs acorn inline, composes no
  `lib/parse`.
- `factory-bypath-byoffset-never-produced` (high) — `byPath`/`byOffset` are
  contract-locked _required_ fields, but the factory ships
  `{} as ParseASTEntwined`.
- `factory-phase-data-entwined-empty-stubs` (medium) — all phase
  `.data`/`.entwined`/`.events` are empty stubs for real input (the L2/L3
  portion is the gap; L1 `*Data` is a deliberate open hole).
- `ast-parse-phase0-no-impl` (high) — `lib/ast/` is a types-only Phase-0 sketch
  with no impl (retired in STEP 0).

### Source-type gaps (STEP 2)

- `factory-no-type-option` (high) — `embody(code)` ignores the locked
  `{ type }`; `SnippetType`/`EmbodyOptions` orphaned; README ships an
  uncompilable `embody(code, { type: 'script' })` example.
- `factory-script-parsed-leaf-unreachable` (high) — 6th leaf + all script
  branches dead; acorn hardcoded `sourceType: 'module'`.
- `orchestrator-hardcodes-module-no-type-toggle` (high) — orchestrator pins
  `module`; a tested `script` branch in `deriveStationAvailability` is
  unreachable end-to-end.

### Validating and scope gaps (STEP 3)

- `validating-produces-old-baseresult-not-validation` (critical) — emits old
  `BaseResult`/`ValidationReport` (`isValid`), not the contract `Validation`.
- `validating-no-determinism-pause-derivation` (high) —
  `isDeterministic`/`doesPause`/`formatted` derivation unimplemented (belongs in
  the factory).
- `scope-legacy-shape-not-creationdata` (high) — emits legacy `ScopeAnalysis`,
  not `CreationData`/`CreationEntwined`; `DeclarationInfo` name collision.
- `scope-validating-not-wired-to-factory` (high) — neither feeds the
  creation/validate phases.
- `factory-real-apex-no-staircase` (high) — real valid input never reaches apex
  (`validated`/`created` false; `analysis`/`validation`/`creation` null).

### Evaluating-engine gaps (STEP 4)

- `engines-not-wired-into-factory` (critical) — real `run`/`intercept` never
  reach `evaluation.events`.
- `engine-result-types-diverge-from-runinstance` (critical) — engines expose
  `RunResult`/`RunHandle`/`InterceptResult`, not `RunInstance`/`EndReport`/
  `EvaluateHandle`.
- `outcome-vocabulary-mismatch` (high) —
  `complete/cancel/timeout/iteration-limit` vs contract
  `completed/cancelled/timed-out/limit-exceeded/…`.
- `endreport-ok-axis-inverted` (high) — engines map cancel/fail to `ok:true`;
  contract `ok` is true iff `completed`.
- `engines-tsconfig-excluded` (high) — `run/intercept/shared` (and `trace`)
  excluded from typecheck.
- `readonly-local-mutation-hazard-live` (high) — un-reverted
  `prefer-readonly-type` autofix on mutated locals; ~100 type errors on
  un-exclusion (re-measure).
- `engine-handle-not-anynmevent-iterable` (medium) — intercept handle iterates
  engine-local events, not the `AnyNMEvent` union. Adapter sub-gaps:
  `runMetrics` has no engine source; `failReason` placement; `run` `IoMocks`
  lacks the `console` slot.

### Trace/semantics gaps (STEP 5)

See § B7 blocker ledger for detail.

- `trace-semantics-unexcluded` (high) — un-excluding is the gating prerequisite.
- `controlflow-split-incomplete` (high) — `conditional|loop|jump` split landed
  in types only, not generators/advice/config/pointcut (system-wide).
- `functionreturnevent-emitted-but-deleted` (high) — deleted from the union by
  design; runtime still emits it.
- `resolve-machinery-missing` (high) — no `emitResolve`/`createResolveEvent`/
  `resolve:` namespace.
- `linkedtraceevent-missing-and-baseevent-not-wiresafe` (high) —
  `LinkedTraceEvent` undefined; `BaseEvent` carries cyclic `node: ASTNode` not
  the documented wire-safe shape.

## Deliberate open holes — DO NOT close

L1 `*Data` interfaces (locked incidentally by STEP 1); per-category evaluation
event payloads; `RunInstance` entwinement detail; `RunInstance.finalEnvironment`
non-null shape; `validation.formatted` semantics (pending `lib/formatting/`
DDD); `Distribution`/`HasIo`/`features` shapes; `lib/* _meta`; dock
danger-iframe backend; `tracers/variables` own `VariablesTraceEvent` union
(bounded-context decision).

## Landmines

- **Editing the locked `embody/types.ts`** (STEP 1) is high-blast-radius — fill
  only the L1 placeholder interfaces; never perturb L2/L3/`ParseASTEntwined`/
  `Snippet`. Typecheck the whole package after each field-add. The 162 scenario
  tests, the factory, and lenses depend on the stable shapes.
- **`prefer-readonly-type` recovery recipe** (for STEP 4, absorbed from the old
  handoff): the Sprint-6.15 `eslint --fix` sweep (commit `0e05c5a`) added
  `readonly`/`ReadonlyArray`/`ReadonlyMap` to locals these files mutate
  (`.push`/`.sort`/`.set`); the recovery hid ~21 files behind the tsconfig
  `exclude` instead of reverting. Per-file fix (safe now that
  `prefer-readonly-type` is `off`, commit `8295a67`):
  `git show 0e05c5a^:<file> > <file>`, then drop the path from `exclude`.
- **Concurrent sessions share the working tree** (e.g. the `aithor/` campaign
  under `embody/language-levels/just-enough-javascript/`). Stay out of others'
  subtrees; stage explicitly (never `git add -A`); expect HEAD to move.
- **Don't branch on `snippet.source.code`** in consumers (scenario keywords are
  a producer affordance); branch on `status`/`validation`/`endReport` shape.

## B7 blocker ledger (absorbed from the former EMBODY-IMPL-HANDOFF)

The deferred `trace/semantics` redesign (STEP 5) must address (verify each
against current code — line numbers in the old handoff are stale):

1. `controlFlow` category split into `conditional|loop|jump` — landed in types,
   **not** in generators, advice, or config/pointcut (system-wide).
2. `BranchEvent`/`DoEvent`/`IterationEvent`/`TestEvent`/`ForInitializeEvent`/
   `ForIncrementEvent` are imported by generators but no longer exist in
   `tracing/types.ts`; they carry semantic fields the redesign lacks.
3. `FunctionReturnEvent` deleted from the union by design but the runtime still
   emits it (`weaving/advice/apply-around.ts`) — needs the full removal cascade.
4. Stripping `value`/`result` from expression events needs `emitResolve`
   machinery that does not exist (no `createResolveEvent`, no `resolve:`
   namespace key).
5. `LinkedTraceEvent` is used by `link.ts` but undefined; `BaseEvent` carries
   cyclic `node: ASTNode` instead of the documented wire-safe
   `nodePath+loc+source`. (Blocker #6 from the old handoff —
   `ControlFlowStructure` — is stale; not referenced in current code.)

## Provenance

- **`EMBODY-IMPL-HANDOFF.md` was deleted 2026-06-18.** It was stale on its
  central premise (it said the non-scenario branch "throws pending real
  composition"; the throw is gone — `index.ts` does real acorn tokenize/parse).
  This roadmap supersedes it; its two live bits (the readonly recovery recipe +
  the B7 ledger) are absorbed above. Its 12 inbound references — 6 JSDoc
  comments in `index.ts`, one in `trace/semantics/index.ts`, two in
  `vitest.workspace.ts`, and links in `study-lenses/DOCS.md`,
  `orchestrate/README.md`, `lenses/debug-props/DOCS.md` — were repointed here.
- **Verified 2026-06-18** by an 8-subsystem read-only gap-analysis workflow + 8
  adversarial critics (run `wf_e20ed9da-bb4`). Only 2 findings were refuted —
  both because code moved ahead: `tracers/variables/instrument-variables.ts` is
  a complete impl (not a stub); `aithor/` now has DOCS.md + types.ts.
- **Corrections from the pass:** `EMBODY_SCENARIOS` exists
  (`embody/embody-scenarios.ts`); `sandbox-programs/` is at
  `study-lenses/sandbox-programs/` (sibling of `embody/`).
- "~100 type errors on `evaluating/` un-exclusion" is the old handoff's claim,
  **not re-measured** — STEP 4 re-verifies it.
