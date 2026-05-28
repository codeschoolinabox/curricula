# lib

JeJ-package-level shared adapters. Each subdirectory is one
JeJ-aware utility module that may be consumed by more than one peer
([`../embody/`](../embody/), [`../lenses/`](../lenses/),
[`../orchestrate/`](../orchestrate/)) without requiring an upward
dependency between peers.

`lib/` sits **between** the conceptual-chain peers
(`embody → lenses → orchestrate`) and the per-peer internal
libraries (`embody/lib/*`, `orchestrate/lib/*`). The distinction:

- A module under `embody/lib/` is internal to embody's pipeline.
- A module under `orchestrate/lib/` is internal to the orchestrator.
- A module under `lib/` is **JeJ-aware** (it knows about the JeJ
  language level, the JeJ validation pipeline, the JeJ notional
  machine) but **peer-independent** — usable from any peer that
  needs JeJ-shaped data over a code string.

## What lives here

```text
lib/
  README.md              (this — orientation + navigation)
  linting/               validation-feed adapter: JeJ violations
                         shaped as editor lint diagnostics
```

`linting/` is the first inhabitant. Additional JeJ-aware adapters
(e.g. documentation lookup, completion sources) land here as the
package's tooling needs expand.

## Why a separate peer

The alternative — placing JeJ-aware adapters inside
[`../orchestrate/lib/`](../orchestrate/lib/) — would force any
non-orchestrator consumer (a lens, a sandbox tool, the package's
top-level tooling exports) to reach across the
`lenses/` ↔ `orchestrate/` boundary. Promoting these adapters to
the JeJ-package level keeps cross-peer consumption flat.

The alternative — placing them inside
[`../embody/lib/`](../embody/lib/) — would conflate JeJ-aware
adapters (which produce shapes for editor / lens / tool consumption)
with embody's internal pipeline (which produces the canonical
`Snippet` embodiment).

`lib/` is the home for the in-between: peer-independent, JeJ-aware.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md) (if applicable), and the
top-level `AGENTS.md` / `DEV.md`. Module-specific rules:

- **JeJ-aware, peer-independent.** A module under `lib/` may import
  from JeJ data layers (`../embody/types.js`, `../embody/lib/*`)
  and from peer-shared contracts (`../orchestrate/lib/editing/types.js`
  for editor-shape types when relevant). It must not import from
  peer-internal implementation files outside its own dependency chain.
- **Each module is its own DDD cycle.** README + DOCS + types per
  module, Phase 0 AR ceremony per new module.
- **Pure-function default.** Modules under `lib/` produce shapes,
  not side effects. State, async, and DOM ownership stay in the
  peers that consume the adapters.

## Navigation

- **Parent peer index:** [`../README.md`](../README.md).
- **Conceptual chain:** [`../README.md`](../README.md) § The story.
- **Current inhabitants:**
  [`./linting/README.md`](./linting/README.md) — validation-feed
  adapter for editor lint diagnostics.
