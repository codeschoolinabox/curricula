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
| **WS3** | [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md) | Orchestrator + lens contracts (Foundation tier F1–F5; Layers I/II/III L1–L8) | **Unblocked.** REFACTOR-HANDOFF Steps 3, 5, 8, 9, 10, 11 complete (commits `9f1db34`, `9df535e`, `5d6fc54`, `8db59e6`, 2026-05-04..05). Steps 7, 12, 14, 16 remain as the **post-migration sweep**; F1 starts once the sweep restores typecheck-green. |
| **WS4** | [`04-lens-migration.md`](./04-lens-migration.md) | Individual lens implementations against the LensModule contract | Parallelizable once WS3 trial lens lands. `highlight` already migrated as the Phase-A gate. |

## Inter-stream dependencies

```text
REFACTOR-HANDOFF Phase A — structural moves COMPLETE (2026-05-04..05)
                          — sweep + cleanup REMAINING (Steps 7, 12, 14, 16)
  │
  ▼
WS1 (NM components / 3rd dim)
  └─► WS2 (recommender consumes StepCategory + embodiment)
        └─► WS3 (orchestrator's recommender panel surfaces the grid)
              └─► WS4 (each lens implements applicableTo + recommend
                       against the LensModule contract)
```

WS1 and WS3 can run in parallel until WS3 needs to wire WS1's enum
into orchestrator types. WS3's structural prerequisites are now in
place (`embody/`, `lenses/`, `orchestrate/` peer layout exists with
populated subdirectories). The remaining REFACTOR-HANDOFF sweep
(Step 7 analysis-lib signature change + supporting Step 12 / 14 /
16 cleanup) is what restores typecheck-green and unblocks F1 dev.
WS4 already has its trial lens (`highlight`) migrated; richer
lenses migrate from a prior project.

## Pointers (where things live now)

| What you need | Where |
| --- | --- |
| Conceptual chain + four audiences + Pedagogical first principles | `../README.md` |
| Architectural decisions (single-writer state, lens-as-mini-web-app, dependency rules, Block Model 3D space, Explorotron mapping) | `../DOCS.md` |
| Structural-move recipe (lib split, study-lenses → lenses rename, etc.) | `../REFACTOR-HANDOFF.md` (Phase A migration executed 2026-05-04..05; Steps 7/12/14/16 remain as post-migration sweep) |
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

### Round-2 AR follow-ups (tabled as optional 2026-05-04)

These came out of AR-1 + AR-2 during the Round-2 canon/handoff
realignment (commit `3b8792d`). Each was reviewed; none are
load-bearing for unblocking WS3, so they were tabled. Address as
separate doc-only commits when bandwidth allows.

- **Four-audiences metadata on `LensModule`** (AR-1 P1) — add a
  `targetAudience: 'dev' | 'nm' | 'user' | 'agent'` (or array) field
  to the canonical `LensModule` so each lens declares which of the
  four audiences from `README.md` § Four audiences of code it
  primarily exercises for the learner. Value: the recommender grid
  can group by audience; lens authors get a forcing function to
  pick. Cost: contract change in `lenses/types.ts` + per-lens fills
  during WS4 migrations.
- **Pyramid placement paragraphs in WS handoffs** (AR-1 P2) — add a
  one-paragraph "Pyramid placement" subsection at the top of
  `01-NM-components.md`, `02-analysis-and-recommender.md`, and
  `04-lens-migration.md`, mirroring the one already in
  `lenses/README.md` § Pyramid placement. Names the layer + quadrant
  each WS serves; links to `README.md` § Pedagogical first
  principles. Mechanical — ~30 lines total.
- **Sharpen "three-peer" framing** (AR-1 P4) — `lenses/README.md`
  and `DOCS.md` describe `embody/`, `lenses/`, `orchestrate/` as
  "three peers", which is true at the directory layout level but
  hides the dependency hierarchy (`orchestrate → embody`,
  `orchestrate → lenses`, `lenses → embody types only`). Add an
  explicit one-paragraph "directory peers, dependency hierarchy"
  clarification in `DOCS.md` § Dependency rules and reference it
  from each peer's README.
- **Mermaid the ASCII pyramid in 03** (AR-2 CP3) — convert the ASCII
  quadrant + pyramid diagram in
  `03-orchestrator-and-contracts.md:46-61` to a mermaid `flowchart`
  diagram, matching the user's standing preference for mermaid over
  ASCII.
