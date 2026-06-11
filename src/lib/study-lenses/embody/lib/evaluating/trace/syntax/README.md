# trace/syntax — NM syntax-level tracer

The **JEJ NM syntax-level tracer of the semantic-level tracer**.

Sibling to [`../semantics/`](../semantics/) (the semantic-level tracer). Both
tracers are independently exportable — semantics is the core, syntax is an
abstraction layer on top. The syntax tracer consumes the semantic tracer's event
stream + entwined AST and produces NM-level steps mapping to visible syntactic
units.

Takes raw semantic-tracer events and aggregates them into a stream of NM-level
steps that map to visible syntactic units of a JEJ program. The tracer's output
is fine-grained value-movement and lookup events; the NM layer's output is
coarser — each step corresponds to something a learner can point at in their
source code (expressions, statements, scope transitions, terminals), plus one
edge category for data-flow resolves between those steps.

> **Status.** Phase 0 DDD artifact. Types and architectural sketch drafted;
> Environment/NMConfig/terminal-kind details stubbed pending resolution of Phase
> 0.1 open items. See [PLAN.md](./PLAN.md) §Handoff §What's still open.

## Where it fits

```text
┌──────────────────────────────────────────────────────────────────────┐
│ lens authors / study-lenses system / exercise designers              │
│                                                                      │
│                        ▲                                             │
│                        │  NM-step stream + NM-tagged AST             │
│                        │                                             │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │                trace/syntax  (THIS MODULE)                       │ │
│ │  - step aggregation                                              │ │
│ │  - AST tagging (dagRole / dagKind)                               │ │
│ │  - envDiff computation                                           │ │
│ │  - stream lifecycle                                              │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                        ▲                                             │
│                        │  raw events + entwined AST                  │
│                        │                                             │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │  semantic tracer (lib/evaluating/trace/)                         │ │
│ │  - Aran instrumentation, Worker execution, SAB I/O protocol      │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Inputs at the boundary:** a source string (a JEJ program) + an NMConfig
(category gates, semantic-event gate, I/O mocks, timeout).

**Outputs at the boundary:** an `NMSession` with eager properties (`source`,
`ast`, `initialEnvironment`, `creationError`) available synchronously; a
streaming `AsyncIterable<StreamYield>` of LiveSteps; and a `complete()` promise
resolving to an `NMTraceResult` with the final entwined `result.ast` + full step
sequence + env state + coverage.

The NM layer **owns**: step aggregation per category, AST tagging, envDiff
computation, step-stream lifecycle, binding-write tracking.

The NM layer **does not own**: code execution (that's the tracer), lens
rendering (consumers), JEJ language validation (upstream), raw event emission
(tracer), or I/O dialog UI (consumer's `io` config).

## Glossary

**NM session** — object returned by `nm(source, config)`. Orchestrates
construction (parse + tag), streaming (event → step aggregation), and
finalization. Pure: recomputes on each call; no caching.

**AST (NM view)** — the parsed tree with `dagRole` + `dagKind` tags per node.
Two reading conventions over the same data:

- Syntax-tree view (traverse parent/children) — what the learner sees.
- Data-flow view (read `dagRole`) — source / transformation / destination /
  sidecar.

**Step** — one NM-unit of execution. Two-level discriminant: `step.category`
(outer) + `step.kind` (inner). Ten categories. See table below.

**Expression step** — category `expression`. A syntactically pointable
value-producer at an AST Expression node. Six kinds mirror AST node types:
`literal`, `identifier`, `property`, `operator`, `call`, `template`. Each
carries output value + transformation detail. Operator steps optionally carry a
`.coercion` property (dual representation with events in `.events[]`).

**Resolve step** — category `resolve`. A data-flow EDGE between nodes. Carries
`.from: SourceRef` + `.to: DestinationRef` + `.value` + `.loc`. AST-position
locs on both ends so consumers render arrows even when neighbor nodes are gated
off. NOT a value-producer.

**Terminal step** — category `initialization` / `for-init` / `write` / `emit` /
`error`. Where a value ends its flow. Carries back-ref
`sourceResolveIndex?: number` to the incoming resolve (when resolves are on),
plus `.value` / `.result` properties for coarse consumers. Side-effects of
expression steps (I/O emit from a call; binding-update from an assignment)
become their own terminal steps with back-refs.

**Structural step** — category `statement` / `scope` / `control-flow`. Syntactic
frames around value-producing work. Not value-carrying, but pointable.

**LiveStep** — a step in its streaming / mutable form. Fields fill as events
arrive. `.events: AsyncIterable<TraceEvent>` for inner pull.
`.done: Promise<Step>` resolves at close with a frozen step.

**envDiff** — the delta applied to the environment at one step.

**Creation error** (R4a) — parse / JEJ-validate / instrument failure
pre-execution.

**Runtime error** (R4b) — execution-phase error during a step.

**NMConfig** — config passed to `nm()`. Category gates (which step kinds emit),
`semanticEvents` gate, I/O mocks passthrough, timeout/iteration limits.

## Step categories

Every step is classified STRUCTURALLY as a **node** (value producer or terminal
destination or syntactic frame) or an **edge** (data-flow resolve). Nodes are
syntactically pointable in the learner's source code; edges span between nodes,
carrying AST-position locs on both sides.

| Category         | Role              | Kinds (draft)                                                                                            |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `expression`     | node (producer)   | `literal`, `identifier`, `property`, `operator`, `call`, `template`                                      |
| `resolve`        | edge              | single kind (data-flow edge)                                                                             |
| `statement`      | node (structural) | `enter`, `exit`                                                                                          |
| `scope`          | node (structural) | `create`, `leave`                                                                                        |
| `control-flow`   | node (structural) | `conditional-test`, `branch-entry`, `loop-iter-start`, `loop-iter-end`, `break`, `continue`, `loop-exit` |
| `initialization` | node (terminal)   | TBD — see [PLAN.md](./PLAN.md) open items                                                                |
| `for-init`       | node (terminal)   | TBD                                                                                                      |
| `write`          | node (terminal)   | TBD — `simple` vs `compound`?                                                                            |
| `emit`           | node (terminal)   | TBD — per-method vs per-channel?                                                                         |
| `error`          | node (terminal)   | TBD — per-error-type?                                                                                    |

**Terminal kind details are open** (PLAN.md §Handoff §What's still open

# 4). Sketches here are drafts to be finalized.

## Node vs edge classification

```text
            ┌───── NODES (pointable at AST positions) ─────┐

         literal                                            initialization
       identifier      ─┐                                   for-init
         property       │                                   write
     ── operator ──     ├─ expression steps (producers) ──  emit
         call           │                                   error
         template      ─┘

         statement(enter/exit)                              ┌── terminals ──┐
         scope(create/leave)    ── structural steps ──     (where values
         control-flow(...)                                  end their flow)

            └─────────────────────────────────────────────┘

            ┌───── EDGES (between nodes; AST-position loc both ends) ─────┐
                          resolve  (single category; single kind)
            └──────────────────────────────────────────────────────────────┘
```

**Why edges vs nodes matters:** each node is a visible syntactic unit; each edge
is a data-flow arrow. Env-visible sub-events (binding-access, scope-lookup,
proto-chain-walk) are INTRA-NODE details (they ride in the owning node's
`.events[]`); they are NOT their own categories. Coercion is also intra-node (a
property on operator expressions) but intentionally dual-represented: as
`.coercion` on the operator step AND as standalone coercion events in
`.events[]` when `semanticEvents: true`.

## Example: `let y = 1 + x * 2;`

Assuming `x` is already initialized to `3`, full-fidelity trace (all categories
on, `resolves.dependent: true`):

```text
step  category          kind              notes
────  ────────────────  ────────────────  ──────────────────────────────────
  0   statement         enter             VariableDeclaration
  1   expression        literal           value=1
  2   expression        identifier        value=3, binding=x@script
  3   expression        literal           value=2
  4   expression        operator          operator='*', operands=[3,2], result=6
  5   resolve           (edge)            from=step4.output, to=step6.operand[1]
  6   expression        operator          operator='+', operands=[1,6], result=7
  7   resolve           (edge)            from=step6.output, to=step8.value
  8   initialization    -                 target=y, value=7, sourceResolveIndex=7
  9   statement         exit              VariableDeclaration
```

With `expressions: false, resolves: {dependent: false}`, only resolves between
AST-position locs fire — consumers render data-flow arrows without seeing
transformation detail.

With `resolves: false` (coarse mode), no resolves at all; InitializationStep
carries `.value = 7` directly; upstream operations are invisible at the step
level.

## Session lifecycle

```text
  nm(source, config)                              ← synchronous call
       │
       │  Construction (parse + tag)
       ▼
  ┌──────────────────────────────────────────────┐
  │ NMSession                                    │
  │   source:          string                    │
  │   ast:             NMASTNode (frozen)        │
  │   initialEnvironment: Environment            │  ← available eagerly
  │   creationError:   CreationError | null      │
  │   steps:           AsyncIterable<StreamYield>│  ← streaming
  │   complete():      Promise<NMTraceResult>    │  ← resolves at end
  │   cancel():        void                      │
  └──────────────────────────────────────────────┘
       │
       │  (consumer pulls from .steps)
       ▼
  for await ({ step, envDiff } of session.steps) {
    // step is a LiveStep — fields fill as events arrive
    // step.events: AsyncIterable<TraceEvent> for inner pull
    // step.done: Promise<Step> resolves when step closes
  }
       │
       │  (or await complete())
       ▼
  ┌──────────────────────────────────────────────┐
  │ NMTraceResult                                │
  │   ok:              boolean                   │
  │   ast:             NMASTNode (entwined)      │  ← fresh copy, has events/visits/stepIndices
  │   steps:           readonly Step[]           │
  │   initialEnvironment: Environment            │
  │   finalEnvironment:   Environment            │
  │   coverage:        Set<nodePath>             │
  │   error?:          R4bError | 'timeout' | 'iteration-limit' | 'cancelled'
  └──────────────────────────────────────────────┘
```

Two AST objects per session (Resolution 19): `session.ast` (construction-phase,
no events/visits yet) and `result.ast` (fresh copy with events, visits,
stepIndices populated). In-memory parent/child cycles kept for convenience;
stripped for serialization via replacer or helper.

## Bounded context

**Owns** (this module):

- Step aggregation per category (per-kind close rules).
- AST tagging (dagRole / dagKind per node).
- envDiff computation per step.
- Binding-write tracking (`Map<valueId, nearest-surviving-producing-step>` for
  provenance fallback per Resolution 15).
- Stream lifecycle (outer AsyncIterable, per-step inner streams, cancel
  cascade).
- Finalization (merging into `result.ast`, freezing state).

**Does not own:**

- Code execution — that's the tracer.
- Lens rendering — consumers (study-lenses system and lens authors).
- JEJ language validation — upstream (`lib/validating/`).
- Raw event emission — tracer.
- I/O dialog UI — consumer supplies async functions via `NMConfig.io`; the NM
  layer passes through to tracer; tracer dispatches main-thread awaits.
- Snippet analysis / recommender — separate `lib/analysis/` and
  `lib/recommender/` modules.

## Navigation

| Path                                           | Purpose                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| [PLAN.md](./PLAN.md)                           | Full DDD plan, Resolutions, design canvas archive |
| [development-guide.md](./development-guide.md) | Coordinator guide for future sessions             |
| [DOCS.md](./DOCS.md)                           | Architectural sketch — execution phases + tables  |
| [types.ts](./types.ts)                         | Public types (partial; stubs flagged)             |

## Links

- Sibling: [../semantics/](../semantics/) — the semantic tracer (core engine)
- Parent: [../../../../README.md](../../../../README.md) — JEJ language level
  overview
- NM spec:
  [../../../../language-levels/just-enough-javascript/notional-machine.md](../../../../language-levels/just-enough-javascript/notional-machine.md)
- Semantic tracer docs: [../../../../tracer.md](../../../../tracer.md),
  [../../../../tracer.architecture.md](../../../../tracer.architecture.md),
  [../../../../tracer.walkthroughs.md](../../../../tracer.walkthroughs.md)
- Syllabus (pedagogical framing): `../../../../../syllabus.md`
- Study-lenses context:
  [../../../../.planning-handoffs/00-master-plan.md](../../../../.planning-handoffs/00-master-plan.md)
