# Master plan: study-lens infrastructure (WS coordination)

> **Coordination matrix.** This file used to be the architecture spec
> too. After the locks landed in `../README.md`, `../DOCS.md`,
> `../REFACTOR-HANDOFF.md`, `../notional-machine.md`, and
> `../embody/{README,DOCS}.md`, the architectural content moved into
> those canonical homes. What remains here is the cross-stream
> coordination matrix that ties WS1–WS4 together.

## Context

The package builds the JEJ tooling that powers `<StudyLenses>` for
Welcome to Frogramming. Conceptual chain (see `../README.md`):

```text
JEJ → notional machine → embody → lenses
```

`<StudyLenses>` (orchestrator-primary public API) renders one snippet
with the lens machinery. The work is split into four parallel work
streams whose handoff files coordinate the implementation.

## Work-stream matrix

| WS | Handoff file | What it does | Status |
| --- | --- | --- | --- |
| **WS1** | [`01-NM-components.md`](./01-NM-components.md) | Wires the syntax tracer's `StepCategory` enum (10 unordered NM components) into the shared types as the 3rd Block Model dimension | Small; mostly done |
| **WS2** | [`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md) | Recommender (applicability filter + ranking engine, per Explorotron Figure 3) with internal analysis helpers. Pure TS, consumed by orchestrator | Phase 0 not yet started |
| **WS3** | [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md) | Orchestrator + lens contracts (Foundation tier F1–F5; Layers I/II/III L1–L8) | Spec ready; **blocked on REFACTOR-HANDOFF Steps 1–16** |
| **WS4** | [`04-lens-migration.md`](./04-lens-migration.md) | Individual lens implementations against the LensModule contract | Parallelizable once WS3 trial lens lands |

## Inter-stream dependencies

```text
REFACTOR-HANDOFF (Steps 1–16)  ← hard prerequisite for WS3
  │
  ▼
WS1 (NM components / 3rd dim)
  └─► WS2 (recommender consumes StepCategory + embodiment)
        └─► WS3 (orchestrator's recommender panel surfaces the grid)
              └─► WS4 (each lens implements applicableTo + recommend
                       against the LensModule contract)
```

WS1 and WS3 can run in parallel until WS3 needs to wire WS1's enum
into orchestrator types. WS3 itself cannot start until
REFACTOR-HANDOFF Steps 1–16 (the structural moves) execute and merge —
those steps are the prerequisite for the post-refactor `embody/`,
`lenses/`, `orchestrate/` peer layout WS3 targets. WS4 starts once
WS3's trial lens (`editor`, `highlight`) proves the contract.

## Pointers (where things live now)

| What you need | Where |
| --- | --- |
| Conceptual chain + four audiences + Pedagogical first principles | `../README.md` |
| Architectural decisions (single-writer state, lens-as-mini-web-app, dependency rules, Block Model 3D space, Explorotron mapping) | `../DOCS.md` |
| Structural-move recipe (lib split, study-lenses → lenses rename, etc.) | `../REFACTOR-HANDOFF.md` |
| NM model (phases, scopes, bindings, evaluation) | `../notional-machine.md` |
| Canonical type contract (Snippet, Event, RunInstance, etc.) | `../embody/types.ts` |
| Embody architecture | `../embody/{README,DOCS}.md` |
| Process playbook (session length, kickoff prompts, red flags) | [`development-guide.md`](./development-guide.md) |
| Per-WS specifics | the handoff file for that WS |

## Process

Each handoff doc follows the template in `development-guide.md` and
includes:

- Prerequisites (read AGENTS.md + DEV.md + this file + relevant canon)
- Context (what the WS does + where it fits)
- Dependencies (what must complete first; who depends on this WS)
- Non-negotiable constraints (sourced from the canonical docs)
- Phase 0 → Phase 1 → Phase 2 cycle per AGENTS.md
- Verification

When a WS finishes, its handoff archives (= deletes; git history
retains). `.planning-handoffs/` is a transitional directory.

## Backlog (WS-overflow items not assigned to a specific stream)

- Cache eviction strategy (memory trade-off when learners dwell on
  one snippet across many lens switches)
- Plugin changes for richer fence syntax + build-time validation
- Remove rendering components from the Docusaurus plugin (plugin
  becomes purely build/config/injection)
- `[open in]` external tool integration (jsTutor, jsViz, etc.)
- Program-naming / gisting feature
- Refactor `orchestrate/lib/socratizing/` to consume the shared
  embodiment instead of doing its own parsing (post-refactor)
- Analytics / engagement event collection — deferred until concrete
  LMS integration target exists (see `../DOCS.md` § What we
  explicitly do NOT own)
- Learner-modelling / progress modelling — out of scope for this
  package; lives in the embedding LMS
