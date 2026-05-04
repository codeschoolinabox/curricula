# Embody implementation handoff — Phase B

**Status:** Phase B of the embody refactor. Runs **after Phase A**
([`REFACTOR-HANDOFF.md`](./REFACTOR-HANDOFF.md)) lands the mock at
`embody/index.ts` plus the structural moves (orchestrate, lenses,
analysis-libs signature change). Not yet executed.

**Audience:** the agent (Claude or otherwise) that will replace the
Phase-A mock with real `embody/lib/*` composition, one module at a
time.

**Lifecycle:** delete this file after Phase B is done, verified, and
merged. Companion to `REFACTOR-HANDOFF.md` (which self-deletes at end
of Phase A); both files are migration scaffolding, not permanent docs.

The architectural narrative (mock-first split, why each module gets
its own DDD cycle) is in
[`REFACTOR-HANDOFF.md` § Two-phase refactor](./REFACTOR-HANDOFF.md).
The contract every step here must satisfy is
[`embody/types.ts`](./embody/types.ts).

## Constraints to honor

The Phase A constraints in `REFACTOR-HANDOFF.md` § Constraints to
honor still apply (single writer, lens purity, `embody/lib/*` raw
data, `embodiment` canonical parameter name, dependency rules,
strict immutability, evaluation phase named "evaluation"). Phase B
adds the following:

- **Mock is the contract.** Every Phase-B step replaces some part of
  the mock body with real composition; the **return type is
  unchanged** (the mock's `Snippet` shape remains the contract). Any
  type change to `embody/types.ts` is a separate doc commit with full
  AR-1 + AR-2 — not an inline body change.
- **One module per increment.** Each `embody/lib/<module>/` lands as
  its own atomic commit with its own DDD cycle (Phase 0 → Phase 1
  TDD → Phase 2 AR-5). No "let me also fix the next module while I'm
  here." The Phase A mock keeps `embody(code)` callable while modules
  flip from stub to real one at a time.
- **Pedagogical re-typing is explicit.** Token and AST types from the
  acorn output are NOT relocated verbatim; each is re-evaluated as it
  moves into `embody/lib/parse/` and `embody/lib/ast/`. Pedagogical
  context (binding kinds, scope-chain hooks, NM-component
  annotations) gets first-class type representation. This is why the
  Phase A mock can't be "implementation in disguise" — the real
  internals need shape rework that the mock isn't blocking.

## Ordered steps

Numbering picks up where `REFACTOR-HANDOFF.md` left off
conceptually — these were originally REFACTOR-HANDOFF Steps 2, 3, 4,
6, 13, plus new Phase-B-only work (token re-typing, event payload
locking, generator surface locking).

### Step B1 — Build `embody/lib/parse/` against re-typed tokens + AST

Was REFACTOR-HANDOFF Step 2. The acorn wrapper itself is mostly a
mechanical port from `lib/parse-old/`; the type design isn't.

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

### Step B2 — Copy NM-rep modules to `embody/lib/` with per-module re-evaluation

Was REFACTOR-HANDOFF Step 3, expanded. Each module is its own
increment.

**Copy semantics, not move.** The originals at `javascript/lib/*`
stay in place during the migration. Each module is copied to
`embody/lib/<module>/`, the copy is pedagogically re-typed and
becomes the canonical source, and the original is deleted later in
Step B6 once every consumer has migrated.

```text
lib/ast/             ⇒ embody/lib/ast/         (copy; original kept until B6)
lib/validating/      ⇒ embody/lib/validating/  (copy; original kept until B6)
lib/formatting/      ⇒ embody/lib/formatting/  (copy; original kept until B6)
lib/evaluating/      ⇒ embody/lib/evaluating/  (copy; original kept until B6)
lib/scope/           ⇒ embody/lib/scope/       (copy; original kept until B6)
lib/parse-old/       ⇒ embody/lib/parse-old/   (copy; both deleted at B4 once parity confirmed)
```

For each module: read the existing types, audit pedagogical clarity
(does a learner-facing lens find the field it needs without spelunking
into ECMA-262?), update if needed (separate doc commit if the public
type shape changes), copy the implementation, update internal imports
inside the new copy to point at sibling new copies. Migrate consumers
to the new path once the copy is verified.

**Verify (per module):** TypeScript compiles; existing tests pass
against the new copy; the mock factory body now wires the module's
real output for that module's slice of `Snippet`, while other slices
remain mock-stub; the original at `javascript/lib/<module>/` still
exists and is still imported by any non-yet-migrated consumer.

### Step B3 — Strip validation/freezing from `embody/lib/*`

Was REFACTOR-HANDOFF Step 4. Walk each `embody/lib/*` module, remove
output-side validation wrappers and `Object.freeze` /
`deepFreezeInPlace` calls at the module boundary. Keep internal
correctness checks; only strip boundary defenses. The factory becomes
the single freezing point — including for the not-yet-real-module
slices (the mock kept freezing them, the real impl now does).

**Verify:** `embody/lib/*` outputs are plain (mutable, unvalidated)
data; the test suite still passes; `embody(code)` still returns a
deep-frozen Snippet (factory-level freeze still works).

### Step B4 — Validate new `embody/lib/parse/` against `parse-old/`

Was REFACTOR-HANDOFF Step 6. Run both over the sandbox-programs corpus.
Compare token streams + AST shapes. When parity is confirmed (ideally
automated diff test), delete `embody/lib/parse-old/`.

**Verify:** parity test passes; `parse-old/` removed; no remaining
imports.

### Step B5 — Replace mock factory body with real composition

Once B1-B4 land enough modules that the mock factory is composing
nothing of its own (every slice of the returned `Snippet` is sourced
from a real `embody/lib/*` module): the factory IS the real thing.
This step is mostly verification:

1. Confirm no mock fixtures or canned values remain in
   `embody/index.ts`.
2. Confirm `status.{tokenized, parsed, created}` flips correctly per
   the real pipeline (tokenized fails → `parsed` and `created` both
   `false`, etc.).
3. Confirm the deep-freeze still passes on non-trivial fixtures.

### Step B6 — Delete originals at `javascript/lib/`

Was REFACTOR-HANDOFF Step 13. After every consumer has migrated to
the new paths (`embody/lib/*` for NM-rep modules per B2;
`orchestrate/lib/*` for analysis libs per Phase A Step 9) AND the
new copies are the canonical sources, delete the originals one
module at a time:

1. Confirm no remaining imports from `javascript/lib/<module>/`
   (grep across the repo).
2. Delete `javascript/lib/<module>/`.
3. Run the full test suite.
4. Repeat per module.

When all originals are gone, `javascript/lib/` should contain
nothing. Delete the directory itself.

**Verify:** `ls javascript/lib/` returns "no such file or directory";
full test suite passes; no import resolution errors.

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

### Step B8 — Lock generator surfaces

The static-side stream generators (`streams.realm()`,
`streams.parse.tokenize()`, `streams.parse.parse()`,
`streams.create()`) yield event-wrapped views over `embody/lib/*`
outputs. Their return-type contracts are typed in `embody/types.ts`
but the implementation lives only in the Phase A mock until this
step lands the real ones.

For each generator: lock its return-type contract (DDD + AR-1),
implement against `embody/lib/*` outputs, integrate into the factory.
The mock's canned generator returns are replaced one generator at a
time.

### Step B9 — Final dependency-rule audit (Phase B side)

Mirror of `REFACTOR-HANDOFF.md` Step 16, but applied at end of Phase
B. Verify:

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
- [`embody/index.ts`](./embody/index.ts) — the Phase-A mock factory
  whose body Phase B replaces module by module.
- [`REFACTOR-HANDOFF.md`](./REFACTOR-HANDOFF.md) — Phase A. Carries
  the § Two-phase refactor narrative for the Phase A/B split.
  Self-deletes at end of Phase A; if you're reading this, that file
  may already be gone.
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
