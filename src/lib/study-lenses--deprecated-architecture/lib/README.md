# lib

JeJ-package-level shared adapters. Each subdirectory is one JeJ-aware utility
module that may be consumed by more than one peer ([`../embody/`](../embody/),
[`../lenses/`](../lenses/), [`../orchestrate/`](../orchestrate/)) without
requiring an upward dependency between peers.

`lib/` sits **between** the conceptual-chain peers
(`embody → lenses → orchestrate`) and the per-peer internal libraries
(`embody/lib/*`, `orchestrate/lib/*`). The distinction:

- A module under `embody/lib/` is internal to embody's pipeline.
- A module under `orchestrate/lib/` is internal to the orchestrator.
- A module under `lib/` is **peer-independent** — usable from any peer — and is
  either **JeJ-aware** (it knows about the JeJ language level, the JeJ
  validation pipeline, the JeJ notional machine) or **fully generic** (the
  sandbox `engine/` knows nothing of JeJ at all).

## What lives here

```text
lib/
  README.md              (this — orientation + navigation)
  admitting/             JEJ-admission gate: is a snippet JEJ-compliant?
                         a re-pointable boolean seam a lens self-gates
                         its applicableTo on (consumed by quiz)
  classifying/           exhaustive token classification: category
                         set × role × range per token (consumed by
                         blanks + quizzing)
  completing/            completion-callback adapter: JeJ-curated
                         suggestions with blocked-marker overlay
  documenting/           docLookup-callback adapter: JEJ-aware
                         hover documentation
  engine/                generic sandboxed streaming evaluator:
                         killable module Worker, opaque items, one
                         termination machine — fully JeJ-agnostic
  formatting-editor/     format-callback adapter: JeJ canonical
                         formatting delegated to the runtime formatter
  linting/               validation-feed adapter: JeJ violations
                         shaped as editor lint diagnostics
  local-llm/             device-local LLM runtime: capability-aware
                         model selection + load-once backends, returns
                         decomposed code — code-oriented, JeJ-agnostic
```

Adapters land here as the package's tooling needs expand.

## Why a separate peer

The alternative — placing JeJ-aware adapters inside
[`../orchestrate/lib/`](../orchestrate/lib/) — would force any non-orchestrator
consumer (a lens, a sandbox tool, the package's top-level tooling exports) to
reach across the `lenses/` ↔ `orchestrate/` boundary. Promoting these adapters
to the JeJ-package level keeps cross-peer consumption flat.

The alternative — placing them inside [`../embody/lib/`](../embody/lib/) — would
conflate JeJ-aware adapters (which produce shapes for editor / lens / tool
consumption) with embody's internal pipeline (which produces the canonical
`Snippet` embodiment).

`lib/` is the home for both: the JeJ-aware adapters and the fully generic engine
— peer-independent either way.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md) (if applicable), and the top-level
`AGENTS.md` / `DEV.md`. Module-specific rules:

- **Peer-independent.** A module under `lib/` may import from JeJ data layers
  (`../embody/types.js`, `../embody/lib/*`) and from peer-shared contracts
  (`../orchestrate/lib/editing/types.js` for editor-shape types when relevant) —
  or import nothing at all (the engine). It must not import from peer-internal
  implementation files outside its own dependency chain.
- **Each module is its own DDD cycle.** README + DOCS + types per module, Phase
  0 AR ceremony per new module.
- **Pure-function default.** Modules under `lib/` produce shapes, not side
  effects. Async is permitted when an upstream dependency is async (e.g.
  Prettier inside the canonical formatter); the pure-function intent — no I/O,
  no observable side effects, no hidden state — still holds. Mutable state and
  DOM ownership stay in the peers that consume the adapters.

## Navigation

- **Parent peer index:** [`../README.md`](../README.md).
- **Conceptual chain:** [`../README.md`](../README.md) § The story.
- **Current inhabitants:**
  - [`./admitting/README.md`](./admitting/README.md) — JEJ-admission gate: a
    re-pointable boolean seam (`isJejCompliant(embodiment)`) a lens self-gates
    its `applicableTo` on when its analysis assumes the JEJ scope model.
  - [`./classifying/README.md`](./classifying/README.md) — exhaustive
    syntax-element classification (category set × role × range per token).
  - [`./completing/README.md`](./completing/README.md) — completion-callback
    adapter with JEJ-curated suggestions and a blocked-marker overlay.
  - [`./documenting/README.md`](./documenting/README.md) — docLookup-callback
    adapter with a curated JEJ-aware hover-doc table (keywords, allowed globals,
    curated members, plus blocked-stumble entries badged `not in JEJ`).
  - [`./engine/README.md`](./engine/README.md) — generic sandboxed streaming
    evaluator; the substrate the embody evaluate tiers run on.
  - [`./formatting-editor/README.md`](./formatting-editor/README.md) —
    format-callback adapter delegating to the canonical formatter.
  - [`./linting/README.md`](./linting/README.md) — validation-feed adapter for
    editor lint diagnostics.
  - [`./local-llm/README.md`](./local-llm/README.md) — device-local
    language-model runtime: capability-aware model selection and load-once
    backends, returning decomposed code; code-oriented and JeJ-agnostic.
    Injected by aithor as its model runtime.
