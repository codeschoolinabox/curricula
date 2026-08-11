<!-- cspell:ignore respec -->

# Phase-1 Handoff — building the concrete evaluators

> **Transitional coordination scaffolding, NOT an end-state doc.** Delete when
> the evaluators region's implementation lands. The end-state contract is the
> committed `README.md` / `DOCS.md` / `types.ts`; this file carries only what a
> cold Phase-1 agent needs that those (correctly) do not: current status,
> prior-art pointers, and the human-gate decisions still open. Authored
> 2026-07-17 at the close of the kind-contract re-spec; validated against a
> context-free reader.

**⚠️ SUPERSEDED for the danger sub-effort (2026-07-22).** This doc frames the
_first_ concrete evaluator as a **tracer**. A later human pivot made **danger**
the first concrete evaluator: its Phase-0 DDD is committed (`09045cb4`) and its
Phase-1 handoff is `danger/PHASE-1-HANDOFF.md`. The "no implementation exists"
and tracer-first framing below is **pre-danger** — still valid as the eventual
_tracer_ Phase 1, but do NOT follow it to build a tracer ahead of danger.

## Where Phase 0 left things

- Phase 0 re-spec'd the **kind contract only** — `README.md` / `DOCS.md` /
  `types.ts` — committed **`54754e1`**
  (`docs: re-spec evaluator kind to take embody Facts`), baseline `541d561`,
  **not yet pushed**. The contract is sound: AR-1 (design), AR-2 (sketch), and a
  context-free cold read all confirm it, and its "gate-guaranteed facts" claim
  verifies against `embody/DOCS.md`.
- **No implementation exists.** The region is `README.md` + `DOCS.md` +
  `types.ts` only. The "What lives here" tree in `README.md` (`run/`,
  `intercept/`, `tracers/`, `danger/`) is the **end-state target** per the
  end-state-docs convention — none are built. Do not read it as current state.

## STOP — the Phase-0 → Phase-1 human gate is not passed

Per `AGENTS.md` invariants 2 / 3 / 5 / 10: do **not** start building. First get
the human's explicit Phase-1 approval; then enter plan mode and run a Plan-agent
design pass; the human locks the type-defined build DAG at the gate. This
handoff is **input** to that gate, not a license to skip it.

## The ground is moving — verify before trusting it

- The tree is **shared and actively churning** (a concurrent embody / JEJ-level
  stream). HEAD has already moved past the Phase-0 commit. Run
  `git rev-parse HEAD` and `git status` first, and attribute foreign churn by
  **file**, never by path prefix.
- **Two `embody` trees exist — do not confuse them:**
  - `src/lib/study-lenses/embody/` — the **greenfield** embody. The contract
    imports `Facts` from here. Currently uncommitted-modified by the concurrent
    stream (an `Embodiment.lifecycle → Embodiment.study` rename; `Facts` itself
    is unchanged, so the evaluators import still resolves — but confirm before
    building).
  - `src/lib/embody/` (legacy monolith) and
    `src/lib/study-lenses--deprecated-architecture/` — the **quarry**: READ-ONLY
    / copy-only, never edited or staged (repo convention).

## Prior art the docs deliberately don't cite — here it is

Working tracers live in the quarry at `src/lib/embody/lib/evaluating/trace/`:

- `variables/` — the variable-lifecycle tracer. Carries `ScopeTable` (a
  clone-safe, `nodePath`-keyed scope projection handed to the worker), a
  `VariablesTraceEvent` union (`scope-push`/`scope-pop` +
  `initialize`/`read`/`assign`/`increment`, each with `priorValue`/`nextValue`),
  `scopeInstanceId`, and worker-entry / thread-logic split. The **closest
  precedent to the intended greenfield first tracer.**
- `semantics/` — the Aran-woven tracer. Carries a `workerConfig` /
  `RuntimeGates` bundle, a `ChainedTraceEvent` union (non-enumerable
  `prev`/`next` doubly-linked chain), a tagged `ValueRepresentation`, and an
  `eventsByNode` post-run attribution index.
- `syntax/` — the syntax-element tracer.

Copy patterns; never modify the quarry.

## Open decisions the human owns at the gate (a tracer is undefined without them)

1. **Which tracer(s), and build order.** The kind names only "the tracers" (a
   family). Quarry precedent = `variables` / `semantics` / `syntax`. The
   recorded design intent (see the session memory topic in § Pointers) points at
   a **variable/binding-lifecycle tracer first** — it matches the intended
   `environmentDiff` / time-travel design below. Not the agent's call to decree.
2. **The execution engine — a hard dependency.** A tracer _drives_ an engine
   (worker / sandbox) that the kind puts explicitly out of scope ("shared leaf
   machinery, owned elsewhere"). **No greenfield engine exists under
   `src/lib/study-lenses/` yet.** Confirm its status and home before building a
   tracer that drives it — the quarry engine lives under
   `src/lib/embody/lib/evaluating/`, and prior engine campaigns are recorded in
   the authoring session's memory. Likely its own coordination, upstream of any
   tracer.
3. **The consumer.** No consuming lens exists — the trace-debugging / run /
   danger lenses are docs+types only (`src/lib/study-lenses/lenses/`). A
   tracer's event union is shaped by its consumer, so build the union against
   the quarry precedent + the recorded design (below), and/or coordinate the
   tracer with its lens, rather than inventing an unconstrained union.

## The intended per-tracer event design (decided in Phase 0; out of scope for the kind)

A single notional-machine moment fans into up to three config-gated event
families:

- **variable event** — a syntax occurrence (a read/write at a source location);
- **binding event** — one slot's value life (the `TDZ → initialized` transition,
  reads, writes);
- **environmentDiff event** — a git-style delta to the live environment records
  (new scopes / frames on recursion, declarations).

Events are reversible (carry both sides, à la the quarry's
`priorValue`/`nextValue`), `prev`/`next`-linked, and folded by a lens into a
scrubbable timeline. `environment` stays **strictly the static fact** in all
kind-level vocabulary; the runtime lives in these tracer event unions. Full
rationale: the session memory topic (§ Pointers).

## How a tracer attaches to the kind (from the committed contract)

- Each tracer is `tracers/<name>/`, exporting one `Evaluator` object (`index.ts`
  default export), its own event union + settlement in its own `types.ts`, plus
  `README.md` / `DOCS.md` / `tests/`.
- Input is `EvaluationSpec = { facts, execution, iterations? }`. `run` /
  `intercept` read `facts.source.value`; a tracer resolves each event's
  `nodePath` via `facts.entwined` (`byPath` / `byOffset` → span) and scope via
  `facts.environment`.
- **Read-contract caveat for tracers:** `environment` is the one stage that is
  _not_ gate-guaranteed — it can fail as a loud dev-mode embody defect. Narrow
  its `.ok` once; on failure treat it as that defect — e.g. refuse-as-data (a
  spec the tracer cannot serve, the tracer's own call), never a throw at the
  learner. The guaranteed _derived_ stages (`tokens` / `ast` / `entwined`) are
  narrowed once too, their failure arm unreachable; `source` and `type` are
  given stages with no failure arm — read directly.
- `Facts` is embody's frozen main-thread graph — a tracer whose worker half
  needs data mints its **own** clone-safe slice (the quarry `ScopeTable` /
  `RuntimeGates` pattern) and posts that, never the cyclic graph.
- Emit the tracer's own union over the open `{ kind: string }` envelope; return
  an `EvaluationStream` (plus its companion `settled` promise) or an
  `EvaluatorRefusal`.

## Pointers (read, don't restate)

- Governance: `CLAUDE.md` → `AGENTS.md` → `DEV.md`. Each tracer's own build
  repeats Phase 0 (ubiquitous language → README → AR-1 → types → DOCS sketch →
  AR-2), then per-increment TDD with AR-3 / AR-4, then AR-5. ARs take no `model`
  parameter.
- The kind contract: `evaluators/README.md` / `DOCS.md` / `types.ts` at commit
  `54754e1`.
- The full decision trail (the pivot rationale, the AR resolutions, the
  `environmentDiff` design) lives in the session memory topic
  `project_evaluators_kind_facts_respec`. Note: the _original_ cold-start brief
  for this effort described a **pre-pivot** design (a pre-built projection on
  the spec) that was reversed mid-flight — trust this handoff and the memory
  topic, not that brief.
