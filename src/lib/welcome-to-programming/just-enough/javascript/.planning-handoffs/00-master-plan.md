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
| **WS3** | [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md) | Orchestrator + lens contracts (Foundation tier F1–F5; Layers I/II/III L1–L8) | **F1 done** (commits `bd98648`–`abe70bb`, 2026-05-06..07): four-prop `<StudyLenses>` + mount guard + editor home base + sandbox harness. Phase A migration closed (`REFACTOR-HANDOFF.md` self-deleted in `4526dc3`). Next: F2 (editor-vs-lens 2-mode state machine), or in-parallel B (cross-tier Docusaurus plugin alignment) — see `./B-plugin-alignment.md`. F3-F5 + L1-L8 follow. |
| **WS4** | [`04-lens-migration.md`](./04-lens-migration.md) | Individual lens implementations against the LensModule contract | Parallelizable once a lens has shipped against the contract. `highlight` exists as docs-only end-state at `lenses/highlight/{README,DOCS}.md` per C cleanup (`abe70bb`); source landing is part of WS4. |

## Inter-stream dependencies

```text
Phase A migration COMPLETE (2026-05-04..05; REFACTOR-HANDOFF.md self-deleted in 4526dc3)
  │
  ▼
WS3 F1 COMPLETE (2026-05-06..07; commits bd98648–abe70bb)
  │   four-prop <StudyLenses> + editor home base + sandbox harness
  │
  ├─► WS3 B (cross-tier Docusaurus plugin alignment) — see
  │   ./B-plugin-alignment.md
  │     │
  │     └ - - ▶ WS3 L7 + L8 (per-fence/per-directory ranking
  │             override; B must land first per kickoff cadence)
  │
  ├─► WS3 F2-F5 (mode machine, lazy embody, trial lens, internal
  │   bus) ──► WS3 L1-L6 (picker, panel, etc.)
  │
  └─► WS4 (each lens implements applicableTo + recommend against
            the LensModule contract; highlight reshape lands here)

WS1 (NM components / 3rd dim — `StepCategory` enum lands in
                                 lenses/types.ts)
   .  .  .  consumed-by  .  .  .
   ▼              ▼               ▼
  WS2          WS4            (WS3, only when an orchestrator
(recommender) (lens         surface routes a StepCategory)
              recommend()
              cells)
```

WS1 ships the `StepCategory` enum into `lenses/types.ts`; WS2's
recommender and WS4 lens `recommend()` consume it; WS3's
orchestrator surface uses it only when a recommendation flows
through. WS1 and WS3 can run in parallel — WS1's deliverable
lands *in* `lenses/types.ts` (the WS3-owned canonical contract)
without a hard build-order dependency on WS3.

WS3's structural prerequisites are in place (`embody/`,
`lenses/`, `orchestrate/` peer layout populated; F1 four-prop API
is stable); B is the post-F1 cross-tier task that closes the
plugin-emit gap (see [`./B-plugin-alignment.md`](./B-plugin-alignment.md)).
WS4 lens migrations (parsons, blanks, trace-table, etc.) come
from a richer-source project the user has, not from the deleted
`study-lenses/` directory.

## Pointers (where things live now)

| What you need | Where |
| --- | --- |
| Conceptual chain + four audiences + Pedagogical first principles | `../README.md` |
| Architectural decisions (single-writer state, lens-as-mini-web-app, dependency rules, Block Model 3D space, Explorotron mapping) | `../DOCS.md` |
| Structural-move recipe (lib split, study-lenses → lenses rename, etc.) | git history at commit `4526dc3^` (Phase A migration completed 2026-05-04..05; `REFACTOR-HANDOFF.md` self-deleted at end of Phase A) |
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
  quadrant + pyramid diagram in `03-orchestrator-and-contracts.md`
  § Locked architectural decisions § Bedrock orienting principle to
  a mermaid `flowchart` diagram, matching the user's standing
  preference for mermaid over ASCII.
