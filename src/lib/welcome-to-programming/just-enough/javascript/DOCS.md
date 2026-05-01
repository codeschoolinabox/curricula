# just-enough/javascript — Architecture & Decisions

This package is the language-level + tooling layer for Welcome to Frogramming.
It validates learner JavaScript against the JEJ subset, evaluates it in
sandboxed environments, and exposes a frozen-data + event-stream representation
of each snippet (via [`embody/`](./embody/)) for study lenses to consume.

The conceptual chain — **JEJ → NM → embody → lenses** — is established in
[`README.md`](./README.md). The NM is documented in
[`notional-machine.md`](./notional-machine.md). Embody architecture + data flow
are in [`embody/DOCS.md`](./embody/DOCS.md). This document captures the
**package-level architectural decisions**: directory shape, peer
responsibilities, dependency rules, and the migration roadmap.

A separate [`REFACTOR-HANDOFF.md`](./REFACTOR-HANDOFF.md) holds the ordered
step-by-step migration recipe a future refactor agent will follow (deletable
after the work is done).

## Directory architecture

The package is mid-migration. Both shapes are documented so contributors know
what is and what will be.

### Current shape

```text
javascript/
  README.md                     front door
  notional-machine.md           NM spec
  notional-machine.svg          canonical NM poster
  reference.md                  language reference
  DOCS.md                       this doc
  REFACTOR-HANDOFF.md           migration roadmap (deletable post-refactor)
  index.ts                      public API surface — exports the orchestrator's
                                <StudyLenses> component (the consumer-facing
                                interface)
  sandbox.html                  PLANNED — whole-setup smoke test (TBD agent)

  embody/                       NM embodiment (frozen data)
  study-lenses/                 lens system (will rename to lenses/)
  lib/                          shared helpers (will be split — see target shape)
  sandbox-programs/             test fixtures
```

### Target shape (post-refactor)

Three peers under `javascript/` mirror the conceptual chain. The implementation
peer (`compose/`) wires everything together for the learner.

```text
javascript/
  README.md
  notional-machine.md
  notional-machine.svg
  reference.md
  DOCS.md
  index.ts                      exports compose's <StudyLenses> orchestrator
                                component as the public interface
  sandbox.html                  whole-setup smoke test

  embody/                       NM embodiment (frozen data)
    README.md, DOCS.md, types.ts
    lib/                        NM-representation engine helpers
      parse/                    new acorn wrapper (replaces parse-old/)
      ast/                      AST utilities
      validating/               JEJ subset check
      formatting/               JEJ formatting
      evaluating/               run, intercept, trace.{syntax,semantics}
      scope/                    scope analysis

  lenses/                       (was study-lenses/) — stateful "mini web app" plugins
    README.md, DOCS.md
    parsons/, blanks/, trace-table/, …  (each lens self-contained)

  compose/                      orchestrator + default editor + analysis libs
    README.md, DOCS.md
    editor/                     default home base (the only writer of snippet state)
    orchestrator/               state mgmt + lens dispatch + pre-processing
    lib/                        analysis helpers — all (embodiment) → result
      recommender/              which lenses to surface for an embodiment
      completing/               autocomplete (editor concern)
      editing/                  editor integration (editor concern)
      error-interpreting/       learner-friendly error messages (editor concern)
      jej-documentation/        JEJ docs for editor tooltips (editor concern)
      socratizing/              Socratic micro-decision analysis

  sandbox-programs/             test fixtures
```

`utils/` (cross-cutting infra like `deep-freeze-in-place`) stays at
`src/lib/utils/` — outside `javascript/` — imported by all peers via the
existing `@`-alias.

## Locked decisions

### Single-writer state model

Only `compose/editor/` mutates the snippet's source. Everything else reacts:

- The editor is **always present** as the home base — even when no lenses apply,
  the learner sees the editor.
- Lens plugins are **read-only views**; they cannot change snippet state.
- Re-embody happens once per edit cycle; the orchestrator distributes the fresh
  embodiment to mounted lenses via props.

This is a major state-management simplification: one writer, many observers. No
reconciliation between competing mutators.

### Lenses are stateful "mini web apps"

Each lens is a self-contained component with its own UI, internal state, and
pedagogical logic. Lenses absorb what would otherwise be a "transforms" tier —
exercises like parsons (statement shuffling), blanks (fill-in), and
bug-injection are all implemented inside the relevant lens, not as a separate
pre-processing step.

Concretely a lens receives `embodiment` as a prop and:

- Shuffles / hides / mutates a _display_ derived from the embodiment
- Tracks learner interaction state (UI)
- Validates learner answers
- Scores / reports

There is **no separate `transforms/` or `remix/` peer.** Anything that produces
a derivative snippet for an exercise is a lens concern.

### Formatting is compose pre-processing (formatting only)

The orchestrator runs a **formatting** pre-processing step on source before
constructing the embodiment. By the time anything reaches a lens, the source is
consistently formatted regardless of how it was authored.

**Validation is NOT gated by the orchestrator.** Educators may intentionally
include non-JEJ examples (e.g., a `function` declaration to demonstrate what JEJ
excludes). embody still computes `validation.{isJeJ, violations, …}` as snippet
metadata; lenses choose whether to surface those — a "JEJ-conformance" lens can
highlight violations, other lenses can ignore them. Pre-processing does not
reject non-JEJ source.

### `embody/lib/*` returns raw data

The `embody()` factory composes raw `embody/lib/*` outputs and applies the
single deep-freeze + validation at the end. `embody/lib/*` modules do not
validate or freeze their own outputs — that responsibility lives centrally in
embody. (No `_meta` arg refactor; the simpler model suffices.)

### `embodiment` is the canonical parameter name

Anywhere a function takes a Snippet instance as input, the parameter is named
`embodiment`. Codifies the term across the codebase (lens props, analysis-helper
signatures, etc.).

### Strict immutability

All public results are deep-frozen. The codebase is consumed by LLMs (and any
number of lenses) that cannot be trusted not to mutate returned data. Freeze is
a hard guarantee, not a politeness. Consumers wanting a mutable working copy
`structuredClone` themselves.

### Three evaluation-engine isolation models

Each engine in `embody/lib/evaluating/` (post-refactor; today `lib/evaluating/`)
serves a different pedagogical purpose:

- **run** — Web Worker. No traps. Returns a final report. Cheapest; used when
  learners just want "did it work?"
- **intercept** — Web Worker with `console.*` + `alert`/`confirm`/ `prompt`
  trapped, SharedArrayBuffer + Atomics for synchronous I/O, SAB pause between
  events for correct ordering. Returns an event stream + final result.
- **trace** — Web Worker with Aran AST instrumentation, capturing every
  expression evaluation, variable access, control-flow step. Two flavors
  (`syntax` / `semantics`) at different granularities. SAB pause for
  step-by-step visualization.

`debug` (iframe + `debugger` statements) is a separate isolation model for
DevTools step-through.

### Module mode everywhere

All evaluation uses ES module mode (`type: 'module'` for scripts, module
workers). Implicit strict mode without requiring `'use strict'` or shifting line
numbers.

### Error-as-data

Engines never throw to the consumer. Errors are captured in result objects'
`error` field, discriminated by `kind`. One code path for all outcomes.

### Property assignment is blocked

JEJ has no object literals, no arrays, no constructors — zero valid use case for
`obj.prop = value`. Allowing it would risk learners overwriting built-in methods
(`console.log = 5`). Assignment is restricted to variable names only.

### `console.*` and dialog APIs are intercepted

`console.log` / `console.assert` / `alert` / `confirm` / `prompt` are trapped
and surfaced as events (Developer Console + User Interface channels per the NM).
Browser console forwarding is also kept for authenticity — code runs in a real
browser environment.

### No REPL

Code is treated as instructions in a stateless program — not an interactive
session. Each evaluation is a fresh run with no accumulated state.

### JEJ language level is an upper bound

JEJ defines the _maximum_ syntax available to learners. Features beyond JEJ
cannot be added. JEJ is the ceiling, not the floor.

## Pedagogical grounding

This package's architecture implements the framework described in
Malaise & Signer (2023), _Explorotron: An IDE Extension for Guided and
Independent Code Exploration and Learning_, Koli Calling '23.
[`README.md` § Pedagogical first principles](./README.md#pedagogical-first-principles)
has the conceptual narrative; this section maps each architectural
decision to the framework.

### Recommender = Applicability filter + Ranking engine

The paper's Figure 3 architecture (applicability filter → ranking
engine → recommended lenses) is the implementation contract for
[`compose/lib/recommender/`](#categorization-rationale-which-lib-modules-go-where).
**Snippet-fit only** — the recommender takes an embodiment and a
roster of lens plugins, runs applicability gates, ranks by snippet-fit,
returns recommended lenses. No learner state. ZPD-targeting at the
curricular scope is the embedding LMS's job (it picks which snippet
to render); we do not see learner state inside our recommender.

### Pyramid layers — the fractal claim

The framework's pyramid applies at two scopes. We own the snippet
scope; the LMS owns the curricular scope.

| Pyramid layer | Snippet scope (us) | Curricular scope (LMS) |
| --- | --- | --- |
| Base — Progress modelling | _(n/a)_ | Learner state / knowledge graph / ZPD positioning |
| Layer I — Lenses & defaults | `compose/lib/recommender/` ranks by snippet-fit; `lenses/` are the plugins | _(subsumed)_ |
| Layer II — Path generation | Open spec — auto-generated lens path on one snippet (3D Block × NM in draft) | Sequence of `<StudyLenses>` instances across snippets |
| Layer III — Manual recommendations | `<StudyLenses>` `recommendedLens` config | LMS picks the curated snippet |
| Layer IV — Manually crafted paths | `<StudyLenses>` `lensSequence` config | Full curriculum sequence |
| Top — Monitored learning | _(n/a)_ | Grade reports, LMS integration, cheating detection |

### What we explicitly do NOT own

- **System-wide learner state, knowledge graph, ZPD positioning.**
  Learner profiles live in the embedding LMS. Our recommender ranks
  by snippet-fit; we never see who the learner is.
- **Multi-snippet path arrangement.** The LMS decides which snippet
  to render next. `<StudyLenses>` is a stepping stone, not a path.
- **Grade reports / LMS integration / cheating detection.** Top of
  the pyramid; LMS responsibility.
- **A data-emit protocol from `<StudyLenses>` back to the LMS.**
  Deferred until a concrete integration target exists; out of scope
  for now.

### How architectural decisions implement framework principles

- **Single-writer state model + lens-as-mini-web-app** — derived from
  the paper's principle that lenses provide "views on a file that
  focus on learning or exploring certain aspects." Lenses produce the
  view; only the editor mutates the snippet.
- **`<StudyLenses>` as the public surface** — derived from the
  skill-transfer principle: learners use the same component for
  curriculum content and for any code they paste in (Quadrant I of
  the framework).
- **Lens plugins receive `embodiment` via props (no peer imports)** —
  derived from the modularity needs of an extensible lens roster:
  new lenses contributed independently must be wireable without
  reaching into embody internals.
- **`embody/lib/*` returns raw data; `embody()` deep-freezes once** —
  derived from the centralization needed when many downstream
  consumers (lenses, the editor, the recommender) all read the same
  snippet representation. One source of truth, frozen at the seam.

## Dependency rules (one-way)

```text
src/lib/utils/   (@-aliased; outside javascript/)
   ↑      ↑      ↑
   |      |      |
embody/lib/   compose/lib/   lenses/<lens>/lib/
   ↑              ↑                ↑
   |              |                |
embody/       compose/   ←    embody/  +  lenses/
                                 ↑
                                 |
                              (compose distributes embodiment to lenses via props)
```

Concrete:

- `embody/` may import from `embody/lib/*` and `@-utils`. Never from `compose/`
  or `lenses/`.
- `embody/lib/*` may import from sibling `embody/lib/*` and `@-utils`. Never
  from `embody/` (top), `compose/`, or `lenses/`.
- `lenses/<lens>/*` may import from sibling lens-internal files,
  `compose/lib/*`, and `@-utils`. Receives `embodiment` via props from the
  orchestrator. Never imports from `embody/` or `compose/` (top).
- `compose/` may import from `compose/lib/*`, `embody/`, `lenses/`, `@-utils`.
- `compose/lib/*` may import from sibling `compose/lib/*`, `embody/` (consume
  embodiment instances), `@-utils`. Never from `lenses/`.
- `@-utils` may not import from anywhere else in `javascript/`.

## Categorization rationale (which `lib/*` modules go where)

| Current path              | Target path                       | Why                                                            |
| ------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `lib/parse-old/`          | `embody/lib/parse-old/` (temp)    | Legacy; reference for new `parse/`; deleted after parity       |
| (new)                     | `embody/lib/parse/`               | Tokenize + AST-build → NM input                                |
| `lib/ast/`                | `embody/lib/ast/`                 | AST utilities are NM-data shape                                |
| `lib/validating/`         | `embody/lib/validating/`          | JEJ subset check → snippet metadata                            |
| `lib/formatting/`         | `embody/lib/formatting/`          | JEJ formatting → snippet metadata                              |
| `lib/evaluating/`         | `embody/lib/evaluating/`          | Evaluation engines that `embody.streams.evaluate.*` wrap       |
| `lib/scope/`              | `embody/lib/scope/`               | Scope analysis → NM scope-chain understanding                  |
| `lib/socratizing/`        | `compose/lib/socratizing/`        | Socratic micro-decision analysis (orchestrator-level pedagogy) |
| `lib/jej-documentation/`  | `compose/lib/jej-documentation/`  | JEJ docs for editor tooltips                                   |
| `lib/completing/`         | `compose/lib/completing/`         | Autocomplete (editor concern)                                  |
| `lib/editing/`            | `compose/lib/editing/`            | Editor integration                                             |
| `lib/error-interpreting/` | `compose/lib/error-interpreting/` | Learner-friendly error messages (editor concern)               |
| `lib/recommender/`        | `compose/lib/recommender/`        | Exercise recommender; consumes embodiment after refactor       |
| Cross-cutting infra       | stays at `src/lib/utils/`         | Used by all peers via @-alias                                  |

The full step-by-step move sequence is in
[`REFACTOR-HANDOFF.md`](./REFACTOR-HANDOFF.md).

## Public API: `<StudyLenses>` (orchestrator-primary, not embody-primary)

The package's public interface is the **`<StudyLenses>`** React component
exported from `compose/orchestrator/`. `index.ts` re-exports it. Consumers
mount `<StudyLenses snippet={…} />`; everything else (embody, lenses,
editor, analysis libs) is internal implementation.

embody is **not** part of the public surface. It is the operational data
layer the orchestrator consumes. Lens authors and curriculum authors don't
import `embody` directly — they ship lens plugins that the orchestrator
mounts under `<StudyLenses>`, and lens plugins receive `embodiment` via
props from the orchestrator.

embody architecture, data flow, and tradeoffs are documented in
[`embody/DOCS.md`](./embody/DOCS.md). The `embody/lib/*` evaluation engines
(`run`, `intercept`, `trace.syntax`, `trace.semantics`) are what
`embody.streams.evaluate.*` wraps internally.

## Open specs (placeholders)

Not yet locked; will firm up during implementation. Consumers should not rely on
shapes here:

- **embody static-side stream generators** — `streams.realm()`,
  `streams.parse.tokenize()`, `streams.parse.parse()`, `streams.create()` — new
  modules built on `embody/lib/*` outputs. Implementation pending.
- **embody evaluate-side streams** — wrap the existing evaluation engines. Each
  call returns a `RunInstance`; final entwinement details (events array vs.
  linked list refs vs. derived indexes) lock during implementation per
  `lib/evaluating/intercept`'s `LinkedInterceptEvent` + `InterceptResult` prior
  art.
- **Per-category event payload kinds** — sketched in `embody/types.ts` but full
  payload shape per kind locks as event emission is implemented.
- **`Distribution` exposure for metrics** — currently
  `{ min, max, mean, median, samples }`. Whether `samples` stays as raw arrays
  vs. pre-computed stats only locks once lenses consume them.
- **`HasIo` shape** — per-method counts plus convenience sums currently; may
  simplify.
- **`features` enumeration** — boolean record may grow as lenses pull on it.
- **embody `opts` backdoors** — small config surface for downstream consumers
  (e.g., a remix-style lens that wants to skip auto-format on its derivative
  source). Shape TBD.
- **Public API surface for `index.ts`** — exports the `<StudyLenses>`
  orchestrator component as the consumer-facing interface. Legacy
  named-function re-exports (`run`, `trace`, `validate`, `parse`, `format`,
  `checkFormat`) will be reconsidered as embody/orchestrator land (no
  deprecation timeline set).

## Contributor guidelines

- Don't add new public-API functions ad hoc. Either fold observability features
  into embody, or keep them internal to the relevant peer.
- New types belong in `embody/types.ts` (canonical contract) or a peer's local
  types module. Don't add types elsewhere.
- All public results deep-frozen. No exceptions.
- Respect the dependency rules above. Lenses don't import from embody; compose
  distributes embodiment via props.
- Cross-doc links (`README` ↔ `notional-machine` ↔ peer `README`/`DOCS`) must
  stay alive after structural moves.
