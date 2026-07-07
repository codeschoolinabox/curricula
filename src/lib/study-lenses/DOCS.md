# study-lenses — Architecture & Decisions

This package is the JavaScript study environment + language-level layer for
Welcome to Frogramming. A JS-generic core reads any source text; the
just-enough-javascript **language level** (semantic models + admission gate)
turns admitted snippets into a frozen-data + event-stream embodiment of the
notional machine (via [`embody/`](./embody/)) for study lenses to consume — and
the run/debug surface serves every snippet, admitted or not.

The conceptual chain — **JEJ → NM → embody → lenses** — is established in
[`README.md`](./README.md). The NM is documented in
[`notional-machine.md`](./embody/language-levels/just-enough-javascript/notional-machine.md).
Embody architecture + data flow are in [`embody/DOCS.md`](./embody/DOCS.md).
This document captures the **package-level architectural decisions**: directory
shape, peer responsibilities, and dependency rules.

## Directory layout

Three peers under `study-lenses/` mirror the conceptual chain. The
implementation peer (`orchestrate/`) wires everything together for the learner.

```text
study-lenses/
  README.md
  notional-machine.md
  notional-machine.svg
  reference.md
  DOCS.md
  index.ts                      exports orchestrate's <StudyLenses>
                                component as the public interface
  sandbox.html                  whole-setup smoke test

  embody/                       NM embodiment (frozen data)
    README.md, DOCS.md, types.ts
    language-levels/            language-level plugins (semantic models + admission gates)
      just-enough-javascript/   the first language level
    lib/                        NM-representation engine helpers
      parse-old/                acorn wrapper (legacy; re-typed → parse/ per Phase B)
      ast/                      AST utilities
      validating/               the JEJ admission gate (SyntaxAllowlist config)
      formatting/               JEJ formatting
      evaluating/               run, intercept, trace.{syntax,semantics}
      scope/                    scope analysis

  lenses/                       stateful "mini web app" plugins
    README.md, DOCS.md, types.ts
    annotate/, blanks/, debug-props/, parsons/, writeme/

  orchestrate/                  orchestrator + default editor + analysis libs
    README.md, DOCS.md, types.ts
    index.tsx                   the <StudyLenses> component (state mgmt + lens dispatch)
    phases-panel/, event-bus.ts affordance container (the phases panel) + internal bus
    stations.ts, derive-station-*.ts  the panel's three pure derivations
    editor/                     default home base (the only writer of snippet state)
    lib/                        analysis helpers — all (embodiment) → result
      recommender/              which lenses to surface for an embodiment
      editing/                  editor integration (editor concern)
      error-interpreting/       learner-friendly error messages (editor concern)
      socratizing/              Socratic micro-decision analysis

  lib/                          JEJ-aware editor adapters (peer-independent):
                                completing/, documenting/, formatting-editor/, linting/

  sandbox-programs/             test fixtures
```

`utils/` (cross-cutting infra like `deep-freeze-in-place`) stays at
`src/lib/utils/` — outside `javascript/` — imported by all peers via the
existing `@`-alias.

## Locked decisions

### Single-writer state model

Only `orchestrate/editor/` mutates the snippet's source. Everything else reacts:

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

**Lenses are pure exercise renderers in this sense:** a lens renders its
exercise UI + its own config panel — and nothing else. No toolbar, no
lens-switching, no snippet state management, no pre-processing. All that
infrastructure is the orchestrator's. The **trial / Phase-1 lens roster** (the
validated-first set; the full migration roadmap covers more lenses — see
[`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md)):

- `editor` — CodeMirror editor (lives in `orchestrate/editor/`, not `lenses/`).
  The default home base; the only writer of snippet state.
- `annotate` — annotation workbench over code or generated flowchart; toggles
  between two views without losing annotations on either. Formerly `highlight`
  (renamed during WS4 Phase 0; see `.planning-handoffs/04-lens-migration.md` §
  Editor placement + annotate lens status).
- `trace-table` — split view: code display + manual trace table + [check]
  button. Validates predictions against the JEJ tracer's ground truth. Different
  configs for steps / values / operators (see
  `.planning-handoffs/04-lens-migration.md` § lens design patterns for the
  multi-variant pattern).

Additional pedagogical lenses (`blanks` fill-in-the-blank, `parsons`
line-ordering, …) land per the per-lens sessions in
[`.planning-handoffs/04-lens-migration.md`](./.planning-handoffs/04-lens-migration.md).

Each lens is self-describing via the `LensModule` contract in
[`lenses/types.ts`](./lenses/types.ts):

```ts
type LensModule = Readonly<{
	name: string;
	Component: ComponentType<LensProps>; // React component reference
	config: (overrides?: Partial<LensConfig>) => LensConfig;
	applicableTo: (embodiment: Snippet) => boolean; // cheap O(1) gate
	recommend: (embodiment: Snippet) => ReadonlyArray<Recommendation>;
}>;
```

`applicableTo` is a fast pure boolean (parse-failed snippet → `false` for
AST-dependent lenses); `recommend` is the richer relevance computation that runs
only on already-applicable lenses. Splitting them keeps the recommender's
applicability-filter pass cheap.

### Formatting is the learner's responsibility (no pre-processing)

The orchestrator does NOT pre-format snippets. Format compliance surfaces as
metadata (`Snippet.validation.formatted`) when the admission gate runs; the
learner formats their own code (the editor-only `format` subtoolbar is the
affordance). This aligns the package-level record with the locked decision in
[`orchestrate/README.md` § Public API](./orchestrate/README.md).

**Validation is NOT gated by the orchestrator.** Educators may intentionally
include non-JEJ examples (e.g., a `function` declaration to demonstrate what JEJ
excludes), and learners may write any JavaScript. embody computes
`validation.{isJeJ, violations, …}` as snippet metadata on module-type snippets;
the orchestrator's station-availability derivation and the editor's gutter
markers surface it — nothing rejects non-JEJ source.

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

Each engine in `embody/lib/evaluating/` serves a different pedagogical purpose:

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
DevTools step-through. The dock's **danger mode** (see
[`orchestrate/README.md` § The dock](./orchestrate/README.md)) is this isolation
model's successor: an iframe evaluating the snippet as a script tag — pure JS
only — as a second **execution backend** behind the same embody-level evaluate
contract (`EvaluateHandle` / `RunInstance`) that the worker backend implements.
The danger backend's internal contract is deliberately deferred (named, not yet
specified) until the worker-backend engine settles.

### Module is the NM-study default; script is the low-floor escape

Every snippet carries a **source type** (`'script' | 'module'`,
`embody(code, { type })`, default `'module'`). Module is the NM-study posture:
implicit strict mode without `'use strict'` injection or line shift, and the
language level's admission gate can run. Script is the validator-free posture —
learners explore any JavaScript with the JS-generic core (tokenize, parse) and
the run/debug surface; no language level is active. The dock's type toggle is
the learner-facing selector.

### Language levels are semantic plugins inside embody

A language level provides the NM's semantic models (realm, creation, evaluation)
plus a validator as admission gate guaranteeing those models never lie about
admitted programs — semantic, not syntactic (the canonical statement is
[`README.md` § A language level is semantic, not syntactic](./README.md#a-language-level-is-semantic-not-syntactic)).
Plugins live at `embody/language-levels/<name>/`, imported by the embody root;
`just-enough-javascript` is the first. The validator's `SyntaxAllowlist` config
(in `embody/lib/validating/`) is the level's derived syntax surface.

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

### JEJ is the ceiling of the language level, not of the tool

JEJ defines the _maximum_ syntax the **language level admits and models** —
features beyond JEJ are never added to the level (the NM's component set stays
fixed and masterable). The TOOL accepts any JavaScript: source-level lenses and
the run/debug surface serve code beyond JEJ; what withdraws beyond the level is
the NM scaffolding (low floor, high ceiling — expertise reversal, per
[`README.md` § Pedagogical first principles](./README.md#pedagogical-first-principles)).

## Pedagogical grounding

This package's architecture implements the framework described in Malaise &
Signer (2023), _Explorotron: An IDE Extension for Guided and Independent Code
Exploration and Learning_, Koli Calling '23.
[`README.md` § Pedagogical first principles](./README.md#pedagogical-first-principles)
has the conceptual narrative; this section maps each architectural decision to
the framework.

### Philosophy

Five principles shape the architecture:

- **Peel-away design.** Lenses are training wheels on a bike, not a tricycle.
  They layer support on top of a real dev environment; as learners progress they
  peel away layers to reveal the full environment underneath. Lenses never
  change how the language or environment works.
- **Learner autonomy.** Educators _suggest_ lenses; learners are always free to
  choose their own or bypass lenses entirely. The free-form lens dropdown inside
  `<StudyLenses>` is always available regardless of what config was passed in.
- **All code is content.** Any JS file can be studied with lenses — not just
  curriculum-curated snippets. This is Quadrant I (uncurated / unguided) of the
  Explorotron framework, and it's the core pedagogical bet on lifelong-learning
  autonomy.
- **Web-standard syntax only.** No proprietary formats. JEJ programs are valid
  JavaScript that runs anywhere; lenses operate on the same source.
- **Idea, not implementation.** Study Lenses is a design principle adaptable to
  different host environments (browser, IDE, static site). This package is the
  browser embodiment.

### Recommender = Applicability filter + Ranking engine

The paper's Figure 3 architecture (applicability filter → ranking engine →
recommended lenses) is the implementation contract for
[`orchestrate/lib/recommender/`](#categorization-rationale-which-lib-modules-go-where).
**Snippet-fit only** — the recommender takes an embodiment and a roster of lens
plugins, runs applicability gates, ranks by snippet-fit, returns recommended
lenses. No learner state. ZPD-targeting at the curricular scope is the embedding
LMS's job (it picks which snippet to render); we do not see learner state inside
our recommender.

### Pyramid layers — the fractal claim

The framework's pyramid applies at two scopes. We own the snippet scope; the LMS
owns the curricular scope.

| Pyramid layer                      | Snippet scope (us)                                                                                                                                                                                                           | Curricular scope (LMS)                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Base — Progress modelling          | _(n/a)_                                                                                                                                                                                                                      | Learner state / knowledge graph / ZPD positioning     |
| Layer I — Lenses & defaults        | `orchestrate/lib/recommender/` ranks by snippet-fit; `lenses/` are the plugins                                                                                                                                               | _(subsumed)_                                          |
| Layer II — Path generation         | Open spec — auto-generated lens path on one snippet (3D Block × NM in draft)                                                                                                                                                 | Sequence of `<StudyLenses>` instances across snippets |
| Layer III — Manual recommendations | `lens` prop: "open in this lens first" (per-fence `js:trace?…` or directory `lenses.json` cascade)                                                                                                                           | LMS picks the curated snippet                         |
| Layer IV — Manually crafted paths  | **Deferred** — Q-IV at snippet scope is owned by the LMS; auto-recommended Q-II tours suffice for in-snippet guidance. Future shape (new prop / meta-key in `configs` / directory-level setting) is intentionally undecided. | Full curriculum sequence                              |
| Top — Monitored learning           | _(n/a)_                                                                                                                                                                                                                      | Grade reports, LMS integration, cheating detection    |

### 3D Block Model space

The Block Model of Program Comprehension (Schulte 2008) — referenced in the
curriculum's `exercise-types.md` — describes comprehension across two
dimensions. We extend it to **three** as the recommender's organizing space:

1. **Level** — text surface → program execution → function/purpose
2. **Scope** — atoms → blocks → relations → macro
3. **NM components** — the 10 step categories from the syntax tracer's
   `StepCategory` enum (`expression`, `resolve`, `statement`, `scope`,
   `control-flow`, `initialization`, `for-init`, `write`, `emit`, `error`).
   **Unordered set** — no ordinal "level" is derived from this dimension.

The third dimension is unordered for a deliberate reason: NM components don't
compose into a single learning progression. A snippet with `expression` +
`resolve` isn't "earlier" than one with `scope` + `control-flow`; they're
different teaching opportunities. The spiral comes from **(a)** lens-config
variation across snippets (a `blanks` lens configured for keywords vs. operators
vs. control-flow reads differently at each configuration) and **(b)**
curriculum-author-imposed ordering of category-filtered recommendations, chosen
pedagogically rather than enforced by the NM model.

The recommender folds the three dimensions into the `RecommendationGrid`: each
cell is `{level, scope, nmComponents}` populated only where the snippet ×
available lenses intersect. A short snippet with no loops won't have trace-table
options; a literal-only snippet won't have variables-lens options.

WS1 (`.planning-handoffs/01-NM-components.md`) is the implementation
pave-the-way: it wires `StepCategory` into the shared types and ties the syntax
tracer's enum to Block-model cells. This DOCS section sets the direction; that
handoff covers the implementation specifics.

### What we explicitly do NOT own

- **System-wide learner state, knowledge graph, ZPD positioning.** Learner
  profiles live in the embedding LMS. Our recommender ranks by snippet-fit; we
  never see who the learner is.
- **Multi-snippet path arrangement.** The LMS decides which snippet to render
  next. `<StudyLenses>` is a stepping stone, not a path.
- **Grade reports / LMS integration / cheating detection.** Top of the pyramid;
  LMS responsibility.
- **A data-emit protocol from `<StudyLenses>` back to the LMS.** Deferred until
  a concrete integration target exists; out of scope for now.

### How architectural decisions implement framework principles

- **Single-writer state model + lens-as-mini-web-app** — derived from the
  paper's principle that lenses provide "views on a file that focus on learning
  or exploring certain aspects." Lenses produce the view; only the editor
  mutates the snippet.
- **`<StudyLenses>` as the public surface** — derived from the skill-transfer
  principle: learners use the same component for curriculum content and for any
  code they paste in (Quadrant I of the framework).
- **Lens plugins receive `embodiment` via props (no peer imports)** — derived
  from the modularity needs of an extensible lens roster: new lenses contributed
  independently must be wireable without reaching into embody internals.
- **`embody/lib/*` returns raw data; `embody()` deep-freezes once** — derived
  from the centralization needed when many downstream consumers (lenses, the
  editor, the recommender) all read the same snippet representation. One source
  of truth, frozen at the seam.

## Dependency rules (one-way)

```text
src/lib/utils/   (@-aliased; outside javascript/)
   ↑      ↑      ↑
   |      |      |
embody/lib/   orchestrate/lib/   lenses/<lens>/lib/
   ↑              ↑                ↑
   |              |                |
embody/       orchestrate/   ←    embody/  +  lenses/
                                 ↑
                                 |
                              (orchestrate distributes embodiment to lenses via props)
```

Plus the JEJ-peer `lib/` tier (canonical conventions:
[`lib/README.md`](./lib/README.md)): `lib/*` sits between `@-utils` and the
three conceptual-chain peers — peer-independent shared adapters that any peer
may consume without an upward dependency between peers.

Concrete:

- `lib/*` (JEJ-peer shared adapters — completing, documenting, classifying, …)
  may import from `embody/types.ts` (types), `embody/lib/*`, peer-shared
  contracts (`orchestrate/lib/*/types.ts`), sibling `lib/*`, and `@-utils`.
  Never from `embody/` (top), `orchestrate/` (top), or `lenses/`. Any peer —
  `embody/`, `lenses/<lens>/*`, `orchestrate/` — may import from `lib/*`.
- `embody/` may import from `embody/language-levels/*`, `embody/lib/*`, and
  `@-utils`. Never from `orchestrate/` or `lenses/`.
- `embody/language-levels/*` (language-level plugins) may import from
  `embody/lib/*` and `@-utils`. Never from `embody/` (top — no cycle),
  `orchestrate/`, or `lenses/`. The embody root composes plugins; plugins never
  reach back.
- `embody/lib/*` may import from sibling `embody/lib/*` and `@-utils`. Never
  from `embody/` (top), `embody/language-levels/*`, `orchestrate/`, or
  `lenses/`.
- `lenses/<lens>/*` may import from sibling lens-internal files, `lib/*`
  (JEJ-peer shared adapters), `orchestrate/lib/*`, and `@-utils`. Receives
  `embodiment` via props from the orchestrator. Never imports from `embody/` or
  `orchestrate/` (top).
- `orchestrate/` may import from `orchestrate/lib/*`, `embody/`, `lenses/`,
  `@-utils`.
- `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`
  (consume embodiment instances), `@-utils`. Never from `lenses/`.
- `@-utils` may not import from anywhere else in `javascript/`.

## Categorization rationale (which `lib/*` modules go where)

| Current path              | Target path                           | Why                                                            |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `lib/parse-old/`          | `embody/lib/parse-old/` (temp)        | Legacy; reference for new `parse/`; deleted after parity       |
| (new)                     | `embody/lib/parse/`                   | Tokenize + AST-build → NM input                                |
| `lib/ast/`                | `embody/lib/ast/`                     | AST utilities are NM-data shape                                |
| `lib/validating/`         | `embody/lib/validating/`              | JEJ subset check → snippet metadata                            |
| `lib/formatting/`         | `embody/lib/formatting/`              | JEJ formatting → snippet metadata                              |
| `lib/evaluating/`         | `embody/lib/evaluating/`              | Evaluation engines that `embody.streams.evaluate.*` wrap       |
| `lib/scope/`              | `embody/lib/scope/`                   | Scope analysis → NM scope-chain understanding                  |
| `lib/socratizing/`        | `orchestrate/lib/socratizing/`        | Socratic micro-decision analysis (orchestrator-level pedagogy) |
| (new)                     | `lib/documenting/`                    | JEJ docs for editor tooltips (landed at JEJ-peer `lib/`)       |
| (new)                     | `lib/formatting-editor/`              | JEJ format-callback adapter (landed at JEJ-peer `lib/`)        |
| (new)                     | `lib/linting/`                        | JEJ lint-diagnostic adapter (landed at JEJ-peer `lib/`)        |
| `lib/completing/`         | `lib/completing/`                     | Autocomplete (landed at JEJ-peer `lib/`)                       |
| (new)                     | `lib/classifying/`                    | Exhaustive token classification; consumed by blanks + quizzing |
| `lib/editing/`            | `orchestrate/lib/editing/`            | Editor integration                                             |
| `lib/error-interpreting/` | `orchestrate/lib/error-interpreting/` | Learner-friendly error messages (editor concern)               |
| `lib/recommender/`        | `orchestrate/lib/recommender/`        | Exercise recommender; consumes embodiment after refactor       |
| Cross-cutting infra       | stays at `src/lib/utils/`             | Used by all peers via @-alias                                  |

The moves landed in Phase A (its handoff self-deleted in `4526dc3`); the
per-module re-typing schedule lives in
[`EMBODY-ROADMAP.md`](./EMBODY-ROADMAP.md).

## Public API: `<StudyLenses>` (orchestrator-primary, not embody-primary)

The package's public interface is the **`<StudyLenses>`** React component
exported from `orchestrate/`. `index.ts` re-exports it. Consumers mount
`<StudyLenses snippet={…} />`; everything else (embody, lenses, editor, analysis
libs) is internal implementation.

embody is **not** part of the public surface. It is the operational data layer
the orchestrator consumes. Lens authors and curriculum authors don't import
`embody` directly — they ship lens plugins that the orchestrator mounts under
`<StudyLenses>`, and lens plugins receive `embodiment` via props from the
orchestrator.

embody architecture, data flow, and tradeoffs are documented in
[`embody/DOCS.md`](./embody/DOCS.md). The `embody/lib/*` evaluation engines
(`run`, `intercept`, `trace.syntax`, `trace.semantics`) are what
`embody.streams.evaluate.*` wraps internally.

### Three-prop public API

```tsx
<StudyLenses snippet={…} lens={…}? configs={…}? />
```

- **`snippet`** — code string. Orchestrator builds the embodiment internally.
- **`lens`** — optional default-mount lens name (Q-III seam).
- **`configs`** — optional, maximally opaque cascade passthrough
  (`Readonly<Record<string, unknown>>`). The orchestrator reads
  `configs.lenses?.[lensName]` as the authoritative per-lens config when opening
  any lens; that `lenses[lens]` lookup is an internal structural assumption, not
  a constraint on the public type.

The separate `config` prop is **gone** — the **3-prop reshape** folds any
per-fence / sibling override INTO `configs.lenses[lens]` at plugin emission
time, so the cascade is the single merged truth. The mount-time guard that once
threw on a `config` without a resolved `lens` has no trigger anymore and is
likewise gone.

**Resolved-default-lens resolution order**: `lens` prop → cascade default
declaration in `configs` → none.

**Resolution chain for any lens-name** (two tiers, post-reshape):

```text
resolved(lensName) = module.config()                  // tier 0: lens defaults
                   ⊕ configs.lenses?.[lensName]        // tier 1: cascade entry
```

(`⊕` = deep-merge-right-wins.)

**Per-fence info-string syntax** (URL-style; the Docusaurus plugin parses this
and emits the props):

```text
js                         → no lens (editor home base)
js:trace                   → lens="trace"
js:trace?stepDelay=500     → lens="trace", merged into configs.lenses.trace
js:trace?cols=value,steps  → lens="trace", merged into configs.lenses.trace
```

The URL-style query is deep-merged INTO `configs.lenses[lens]` at emission time
(there is no standalone `config` prop). The `lenses.json` directory cascade
emits the rest of `configs`. See
[`.planning-handoffs/03-orchestrator-and-contracts.md`](./.planning-handoffs/03-orchestrator-and-contracts.md)
for the full lock + plugin alignment.

**Q-IV (per-snippet manual sequencing) is deferred.** The future shape (a new
top-level prop / meta-key in `configs` / directory-level setting) is
intentionally undecided until Q-IV un-defers. The LMS owns curricular
sequencing; auto-recommended Q-II tours suffice for in-snippet guidance.

## Open holes in the contract

The package contract intentionally leaves the following parts unspecified. Each
gap is a deliberate choice — locking these would foreclose options that
consumers' real use is needed to inform. Consumers should not rely on specific
shapes within these gaps. Embody-internal contract gaps are documented in detail
at
[`embody/DOCS.md` § Open holes in the contract](./embody/DOCS.md#open-holes-in-the-contract);
the package-level gaps below are the ones beyond the embody surface.

- **embody `opts` config surface** — the contract leaves room for a small
  downstream-consumer config surface (e.g., a remix-style lens that wants to
  skip auto-format on its derivative source). The shape is intentionally open
  until concrete consumer needs make the right shape visible.
- **Public API surface for `index.ts`** — `<StudyLenses>` is the consumer-facing
  interface; `index.ts` also re-exports the legacy named functions (`run`,
  `trace`, `validate`, `parse`, `format`, `checkFormat`). The contract leaves
  the long-term place of those legacy exports open — they may consolidate into
  `<StudyLenses>` or remain alongside as a parallel surface.
- **The danger-iframe backend's internal contract** — the dock's danger mode is
  a second execution backend behind the embody-level evaluate contract; its
  internals (iframe lifecycle, script-tag evaluation, the in-guard elapsed-time
  seconds check) — and how a consumer selects the backend through the evaluate
  surface — are deliberately unspecified until the worker-backend engine
  settles.
- **The configs orchestrator tier's shape** — the orchestrator reads
  `configs.orchestrator` (initial source type, danger availability, run-limit
  defaults) as an internal structural assumption, same pattern as
  `configs.lenses`; the exact key set may evolve with the dock.

## Contributor guidelines

- Don't add new public-API functions ad hoc. Either fold observability features
  into embody, or keep them internal to the relevant peer.
- New types belong in `embody/types.ts` (canonical contract) or a peer's local
  types module. Don't add types elsewhere.
- All public results deep-frozen. No exceptions.
- Respect the dependency rules above. Lenses don't import from embody;
  orchestrate distributes embodiment via props.
- Cross-doc links (`README` ↔ `notional-machine` ↔ peer `README`/`DOCS`) must
  stay alive after structural moves.
