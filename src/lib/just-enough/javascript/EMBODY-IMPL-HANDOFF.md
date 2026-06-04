# Embody implementation handoff — Phase B

**Status:** Phase B is **unblocked**. Phase A is closed —
`REFACTOR-HANDOFF.md` self-deleted in commit `4526dc3`
(2026-05-06, "Phase A complete"). The three-peer
embody/lenses/orchestrate architecture is the running shape;
the `embody()` factory at `embody/index.ts` is live with 11 named
scenarios on the scenario-dispatch branch (canned-stub Snippet shapes
per scenario) and a throw on non-scenario input pending real
composition; F1 of the orchestrator pyramid landed
across commits `bd98648`–`dd5e55b` (2026-05-06) bringing the
new four-prop `<StudyLenses>` component online and clearing the
pre-refactor `orchestrate/orchestrator/` archival. The
sandbox harness for direct orchestrator mounting lives at
`src/pages/study-lenses-smoke.tsx`.

Phase B re-types `embody/lib/*` modules in place per the locked
decisions, replacing slices of the canned-stub body with real
composition one module at a time. The named scenarios at the top of
`embody/index.ts` are **permanent end-state** (per
[`embody/README.md` § Named scenarios](./embody/README.md)); what Phase B
replaces is the **throw-on-non-scenario** fallback with real composition
that produces a shape-valid `Snippet` for arbitrary JEJ input.

**Audience:** the agent (Claude or otherwise) that will wire real
`embody/lib/*` composition into the non-scenario branch of
`embody/index.ts`, one module at a time.

**Lifecycle:** delete this file after Phase B is done, verified,
and merged. The companion `REFACTOR-HANDOFF.md` self-deleted at
end of Phase A; this file follows the same pattern at end of
Phase B. Both files are migration scaffolding, not permanent
docs.

**Architectural narrative.** The two-phase refactor split the substrate
work into a Phase-A move (relocate modules without re-typing — fast,
mechanical, deletes the old locations) and a Phase-B re-typing pass
(each module gets its own DDD cycle in its new home, picking up
pedagogical clarity that the verbatim moves didn't). The
canned-scenario branch at `embody/index.ts` is the load-bearing
simplification — it keeps `embody(code) → Snippet` callable for the 11
named scenarios through Phase B while real-composition modules flip
from stub to real one at a time. The scenario branch itself does NOT
disappear at end of Phase B (it's a permanent integration-testing
fixture set); only the non-scenario throw is replaced. The contract
every step here must satisfy is [`embody/types.ts`](./embody/types.ts).

## Constraints to honor

The Phase A constraints carry forward into Phase B:

- **Three peers + utils.** Final shape is `embody/`, `lenses/`,
  `orchestrate/` under `javascript/`; cross-cutting infra stays
  at `src/lib/utils/` and is imported via the existing `@`-alias.
  Any new `embody/lib/<module>/` module honors this — no
  cross-peer reaches.
- **Single writer of snippet state.** Only the orchestrator's
  editor home base mutates the snippet string. Lenses are
  read-only views over a frozen embodiment; analysis libs and
  recommenders are read-only too.
- **Lens purity.** Lenses receive `embodiment` via React props
  from the orchestrator; they never import from `embody/` (top)
  or `orchestrate/` (top), only type-only from
  `embody/types.ts` and runtime from `orchestrate/lib/*` or
  `@-utils`.
- **`embody/lib/*` outputs are raw data.** Each module's output
  is plain (post-Phase-B Step B3, no boundary-side validation
  or freezing); the factory at `embody/index.ts` is the single
  freezing point.
- **`embodiment` is the canonical parameter name** wherever a
  function takes a `Snippet` instance.
- **Dependency rules** per `DOCS.md` § Dependency rules:
  `embody/` and `lenses/` and `orchestrate/lib/*` are pure-TS
  peers; `orchestrate/` is the React seam.
- **Strict immutability.** All factory outputs are deep-frozen.
- **Evaluation phase is named "evaluation"** (not "execution"
  or "run"); the per-call object is an `Execution<…>` per
  `embody/types.ts`.

Phase B adds the following:

- **Contract is the contract.** Every Phase-B step wires real
  composition into the non-scenario branch of `embody/index.ts`; the
  **return type is unchanged** (the locked `Snippet` shape remains the
  contract). Any type change to `embody/types.ts` is a separate doc
  commit with full AR-1 + AR-2 — not an inline body change.
- **One module per increment.** Each `embody/lib/<module>/` lands as
  its own atomic commit with its own DDD cycle (Phase 0 → Phase 1
  TDD → Phase 2 AR-5). No "let me also fix the next module while I'm
  here." The scenario branch keeps `embody(code)` callable for the 11
  named scenarios while real-composition modules flip from stub to
  real one at a time.
- **Pedagogical re-typing is explicit.** Token and AST types from the
  acorn output are NOT relocated verbatim; each is re-evaluated as it
  moves into `embody/lib/parse/` and `embody/lib/ast/`. Pedagogical
  context (binding kinds, scope-chain hooks, NM-component
  annotations) gets first-class type representation. This is why the
  scenario-branch canned stubs can't be "implementation in disguise"
  — the real internals need shape rework that the stubs aren't
  blocking.
- **No consumer-side branching on `snippet.source.code`** (handoff rule
  that aligns with the embody/orchestrate/lenses end-state docs).
  Orchestrator and lens code MUST NOT use `source.code` content as a
  branching key (e.g. `if (snippet.source.code === 'EVAL_TIMEOUT')`).
  Always branch on the resulting `Snippet`'s `status` / `endReport` /
  `validation` shape. Scenarios are producer-side inputs to `embody()`;
  the Snippet shape is the consumer-side surface. Rendering
  `source.code` verbatim is allowed; using it as a discriminator is
  not. AR-4 / AR-5 audits grep consumer code for `source.code ===` /
  substring tests against scenario keywords and fail any non-test
  occurrence.
- **Hard-gated pipeline.** The construction pipeline is
  `tokenize → parse → validate → create`. Each gate failure produces a
  structurally distinct leaf (5 total: tokenize-fail, parse-fail,
  validate-fail, create-fail, apex). Downstream surfaces (event
  streams) are absent on leaves where the chain didn't complete:
  validate-fail and earlier have no `streams.create` and no
  `streams.evaluate`; create-fail has no `streams.evaluate`. Real-
  composition modules wiring into the non-scenario branch MUST honor
  this — no event streams for programs that won't run. The validate
  gate criterion is `validation.isJeJ` (i.e., `violations.length ===
  0`); `validation.isDeterministic` and `validation.doesPause` are
  consumer-side metadata, NOT gate criteria.
- **Runtime errors not embodied.** `streams.evaluate.*` outcomes
  (`'errored'`, `'timed-out'`, `'limit-exceeded'`, `'cancelled'`)
  live on `RunInstance.endReport`, not on the static Snippet. The
  apex leaf is shape-identical across `OK` and `EVAL_*` scenarios;
  the EVAL_* overlay is interpreted by `streams.evaluate.*` at call
  time.

## Ordered steps

Numbering picks up where `REFACTOR-HANDOFF.md` left off
conceptually — these were originally REFACTOR-HANDOFF Steps 2, 3, 4,
6, 13, plus new Phase-B-only work (token re-typing, event payload
locking, generator surface locking).

### Step B1 — Build `embody/lib/parse/` against re-typed tokens + AST

The acorn wrapper itself is mostly a mechanical port from
`lib/parse-old/`; the type design isn't.

1. Phase 0 DDD on `embody/lib/parse/types.ts`:
   - Token kinds — drop acorn's flat `Token` shape; introduce a
     discriminated union by token category (literal, identifier,
     keyword, punctuator, …) so lenses can pattern-match without
     string-equality on `.type.label`.
   - AST nodes — the acorn `Node` shape is preserved (we wrap it in
     `AugmentedASTNode.acornNode`), but cross-references (parent
     pointers, scope-chain hooks, token-of-record back-refs) are
     first-class typed fields, not stringly-keyed extensions.
2. AR-1 on the type design (drift catch — does this stay coherent
   with `embody/types.ts`'s `ParseGraph`, `AugmentedToken`,
   `AugmentedASTNode`?).
3. Implement the wrapper using TDD against fixtures from
   `sandbox-programs/`.
4. AR-4 + AR-5 + commit.

**Verify:** `embody/lib/parse/` builds tokens + AST for sandbox-programs
fixtures; the typed surface drives at least one consumer's pattern-
match cleanly (e.g. a lens reading token kinds without
string-equality).

### Step B2 — Pedagogical re-typing of NM-rep modules at `embody/lib/`

The Phase A relocation already happened in commit `9df535e`
(2026-05-04): the 6 NM-rep modules now live at
`embody/lib/<module>/` verbatim. `javascript/lib/` is gone.
Phase B re-types them in place.

Phase B's focus here is **pedagogical re-typing in place**:

```text
embody/lib/parse-old/    — re-typed by B1 (re-emits as embody/lib/parse/)
embody/lib/ast/          — re-typed in place
embody/lib/validating/   — re-typed in place
embody/lib/formatting/   — re-typed in place
embody/lib/evaluating/   — re-typed in place (token kinds, event payloads)
embody/lib/scope/        — re-typed in place
```

For each module: read the existing types, audit pedagogical clarity
(does a learner-facing lens find the field it needs without
spelunking into ECMA-262?), update types if needed (separate doc
commit if the public type shape changes), and refit the
implementation against the re-typed surface. Each module is its own
atomic increment with its own DDD/AR cycle.

**Verify (per module):** TypeScript compiles; existing tests pass;
the non-scenario branch in `embody/index.ts` now wires the module's
real output for that module's slice of `Snippet`, while other slices
remain canned-stub.

### Step B3 — Strip validation/freezing from `embody/lib/*`

Walk each `embody/lib/*` module, remove output-side validation
wrappers and `Object.freeze` / `deepFreezeInPlace` calls at the
module boundary. Keep internal
correctness checks; only strip boundary defenses. The factory becomes
the single freezing point — including for the not-yet-real-module
slices on the non-scenario branch (canned stubs were freezing them
before; real impl now does).

**Verify:** `embody/lib/*` outputs are plain (mutable, unvalidated)
data; the test suite still passes; `embody(code)` still returns a
deep-frozen Snippet on both branches (factory-level freeze still works).

### Step B4 — Validate new `embody/lib/parse/` against `parse-old/`

Run both over the sandbox-programs corpus.
Compare token streams + AST shapes. When parity is confirmed (ideally
automated diff test), delete `embody/lib/parse-old/`.

**Verify:** parity test passes; `parse-old/` removed; no remaining
imports.

### Step B5 — Replace non-scenario canned stubs with real composition

Once B1-B4 land enough modules that the non-scenario branch is
composing nothing of its own (every slice of the non-scenario-branch
`Snippet` is sourced from a real `embody/lib/*` module): the
real-composition path is fully wired. The scenario branch is
unaffected and stays as the canonical fixture set.
This step is mostly verification:

1. Confirm no canned values remain in the non-scenario branch of
   `embody/index.ts`. (The scenario branch keeps its canned shapes
   permanently — that's by design, not residue.)
2. Confirm `status.{tokenized, parsed, validated, created}` flips
   correctly per the real pipeline (tokenized fails → `parsed`,
   `validated`, and `created` all `false`; parsed fails → `validated`
   and `created` false; etc.) on the non-scenario branch.
3. Confirm the deep-freeze still passes on non-trivial fixtures.

### Step B6 — Delete originals at `javascript/lib/`

> **✓ Obsolete.** Originals were deleted in Phase A commit
> `9df535e` (2026-05-04) per the user's delete-originals policy.
> `javascript/lib/` is gone. This step survives as a sanity-check
> grep at the end of Phase B:
>
> ```bash
> grep -rn 'javascript/lib/\(parse-old\|ast\|validating\|formatting\|evaluating\|scope\|socratizing\|editing\|error-interpreting\|recommender\)' src/
> # expected: zero hits
> ```

### Step B7 — Lock event-type payloads

[`embody/DOCS.md` § Open holes in the contract](./embody/DOCS.md#open-holes-in-the-contract)
captures that per-category event payload kinds are intentionally
left open in the contract: the kinds within each category are named
in `embody/types.ts`, but the full payload shape per kind is open.
This step does the locking.

For each `EventCategory` in `embody/types.ts`:

1. Read the current sketch.
2. Audit against the trace-side prior art (`lib/evaluating/trace/syntax/`
   already emits events; what payload shape does it actually need?).
3. Lock the payload type with full DDD + AR-1.
4. Update consumers (any analysis lib reading `embodiment.streams.evaluate.*().events`)
   to the locked shape.

**Current state (deferred — excluded from gates).**
`embody/lib/evaluating/trace/semantics/` is currently excluded from
`tsconfig.json`, `tsconfig.lint.json`, `eslint.config.mjs` ignores, and
both vitest workspaces (commits `4f8981f`, `1673d7f`, `37e747f`,
`30edd8b`). The exclusions were landed because an AR-1 design challenge
surfaced five systemic blockers that are Step B7 work, not Phase B2
typecheck cleanup:

1. The `category: 'controlFlow'` split (into `'conditional' | 'loop' |
   'jump'`) is system-wide — touches generators, advice files, namespace
   keys, and tests. Only partially landed.
2. The "missing" event types (`BranchEvent`, `DoEvent`, `IterationEvent`,
   etc.) are NOT one-to-one mappings to the new `ConditionalEvent` /
   `LoopEvent` — they carry semantic fields the redesign doesn't yet
   have (e.g., `IterationEvent.iterationVariable`, `TestEvent.result:
   boolean`).
3. `FunctionReturnEvent` is deliberately deleted by design (per
   `types.ts:419`: "ResolveEvent(kind:'call') carries the return
   value"), but the runtime still emits it from `apply-around.ts:182-187`.
   Fixing requires the full removal cascade (generator + advice + config
   gate + test).
4. Stripping `value` / `result` fields from expression events
   (`LiteralEvent`, `PureOperatorEvent`, etc.) would silently drop trace
   value transport because the paired `emitResolve` machinery isn't
   built yet — there is no `createResolveEvent` generator, no `resolve:`
   namespace key in `generators.ts`, no `emitResolve` helper.
5. `LinkedTraceEvent` is genuinely missing from `types.ts`, and
   `BaseEvent` shape disagrees with the documented wire-safe shape
   (types.ts has `node: ASTNode`; DOCS describe `nodePath + type + loc +
   source` for postMessage safety).
6. `ControlFlowStructure` has no canonical equivalent in `types.ts` to
   redirect to.

**First act of Step B7:** remove the exclusions in `tsconfig.json`,
`tsconfig.lint.json`, `eslint.config.mjs`, and `vitest.workspace.ts`.
Then let the resulting failures (24 typecheck + ~265 lint + N test) drive
the redesign category-by-category with full DDD + AR-1 per the four
steps above. The AR-1 review of these blockers (session `af0e7c7b7a6123f2d`)
has detailed counter-proposals for each.

### Step B8 — Lock generator surfaces

The static-side stream generators (`streams.realm()`,
`streams.parse.tokenize()`, `streams.parse.parse()`,
`streams.create()`) yield event-wrapped views over `embody/lib/*`
outputs. Their return-type contracts are typed in `embody/types.ts`
but the implementation lives only in the canned-stub generator
surfaces (scenario branch) until this step lands the real ones for the
non-scenario branch.

For each generator: lock its return-type contract (DDD + AR-1),
implement against `embody/lib/*` outputs, integrate into the factory.
The non-scenario canned generator returns are replaced one generator at
a time. (Scenario-branch canned shapes stay; they're the permanent
fixture set.)

### Step B9 — Final dependency-rule audit (Phase B side)

End-of-Phase-B dependency-rule audit. Verify:

- No `embody/lib/*` imports from `embody/` (top), `orchestrate/`, or
  `lenses/`.
- No `embody/` imports from `orchestrate/`, `lenses/`, or
  `embody/lib/` → `embody/` (cycle).
- No `@-utils` imports from anywhere inside `javascript/`.

Consider committing a CI lint rule that catches violations going
forward.

### Step B10 — Delete this file

Once Phase B is done, verified, and merged: delete
`EMBODY-IMPL-HANDOFF.md`. At this point both refactor handoffs have
self-deleted; the embody/lenses/orchestrate three-peer architecture
is the running shape, and `DOCS.md` § Locked decisions is the only
permanent record of how we got here.

## Cross-references

- [`embody/types.ts`](./embody/types.ts) — the `Snippet` contract
  every Phase-B step must satisfy on output.
- [`embody/index.ts`](./embody/index.ts) — the `embody()` factory.
  Phase B wires real composition into the non-scenario branch module
  by module; the scenario branch (named scenarios at the top of the
  file) is permanent end-state.
- [`DOCS.md`](./DOCS.md) § Locked decisions — the permanent record
  of architectural decisions the two-phase refactor implemented.
  REFACTOR-HANDOFF.md (Phase A's companion to this file) was
  migration scaffolding and self-deleted in commit `4526dc3` at
  end of Phase A; the load-bearing constraints carried across
  into the Constraints section above.
- [`.planning-handoffs/01-NM-components.md`](./.planning-handoffs/01-NM-components.md)
  — semi-hallucinated; reconciled here as the syntax-tracer
  `StepCategory` enum wires through `embody/lib/evaluating/trace/`
  during Phase B's evaluating-module increment.

## Open questions (deliberately unresolved)

These get answered by the human coordinator when Phase B opens, not
in this stub:

- **Token re-typing approach.** Discriminated union by category
  (literal / identifier / keyword / punctuator / …)? Or finer kinds
  per category (number-literal vs string-literal vs template-literal,
  etc.)? Pedagogical readability vs match-exhaustiveness tradeoff.
- **Event payload shape.** Flat `EventBase + kind-specific fields`
  vs. nested `EventBase.payload: kind-specific`? Affects how lenses
  pattern-match on event streams.
- **Generator implementation order.** Do all four generators
  (`realm`, `parse.tokenize`, `parse.parse`, `create`) lock together,
  or one at a time? If one at a time, which first?
- **`01-NM-components.md` reconciliation.** That handoff has known
  drift (semi-hallucinated against the actual syntax-tracer
  `StepCategory` enum). Does Phase B rewrite the handoff, or treat
  the syntax tracer's enum as the authoritative source and let the
  handoff atrophy?
