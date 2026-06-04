# trace/syntax — architectural sketch

Per DEV.md §Directory Documentation Convention. The Refactor step is held
against this document — not what the code does, but what shape it takes.

See [README.md](./README.md) for the module overview and glossary. This document
describes the internal architecture — execution phases, structural constraints,
step-closing behaviors, and the config translation to the tracer.

## Execution phases

The NM session passes through seven phases. Phases 1-2 run synchronously at
construction; 3-6 run as events arrive; 7 runs at `complete()`.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. Construction   ──►  2. Config translation                        │
│     (sync)              (sync, pure)                                 │
│       │                       │                                      │
│       │                       │  TraceConfig                         │
│       │                       ▼                                      │
│       │                  ┌────────────────┐                          │
│       │                  │ semantic tracer│ ◄── tracer events        │
│       │                  └────────────────┘                          │
│       │                       │                                      │
│       │                       │  event stream                        │
│       │                       ▼                                      │
│  3. Step aggregation  ──►  4. EnvDiff computation                    │
│     (streaming)              (streaming)                             │
│                                                                      │
│          │                                                           │
│          │  each emitted step                                        │
│          ▼                                                           │
│  5. Provenance tracking  ──►  6. Stream lifecycle                    │
│     (streaming)                 (consumer-pull)                      │
│                                                                      │
│          │                                                           │
│          │  at close                                                 │
│          ▼                                                           │
│  7. Finalization                                                     │
│     (at complete())                                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 1. Construction (sync, may throw R4a)

Parse source with recast/acorn; JEJ-validate; instrument via Aran; build the
NM-owned tagged AST (fresh copy with `dagRole` + `dagKind` derived from
`node.type` + `JejTag`); set up the initial environment (scope tree +
pre-hoisted globals + declared bindings in TDZ).

**Outputs:** `session.source`, `session.ast` (construction-phase),
`session.initialEnvironment`, `session.creationError` (populated on R4a —
parse/validate/instrument failure; the other outputs are null in that case).

### 2. Config translation (sync, pure)

Map `NMConfig` categorical gates + `resolves.dependent` + `semanticEvents` to
the tracer's `TraceConfig.options` subset. See §NMConfig → TraceConfig mapping
below. This table is TBD pending NMConfig finalization (Resolution 23 open
item); the sketch here names the columns.

### 3. Step aggregation (streaming)

Observe tracer events; aggregate into steps per per-kind closing rule; emit
LiveStep on first event; resolve `.done` on the step's close event. A
nodePath-keyed bracket stack handles nested expressions (events belong to the
innermost open step; producer expressions complete before their consumer's
resolve emits).

Nodes and edges: expression/terminal/structural steps are nodes with dagNodePath
references; resolve steps are edges with `.from` + `.to` refs carrying
AST-position locs. Each aggregation path handles both kinds per Resolution 17.

Gated-off step kinds don't emit; their valueIds are still tracked in the
provenance map for the traversal-fallback rule (Resolution 15).

### 4. EnvDiff computation (streaming)

Maintain environment state incrementally as events arrive. Compute the envDiff
for each step at close — scopes entered, scopes left, binding changes (TDZ →
initialized, value-updated with version bump). EnvDiff delta format TBD per
Resolution 22.

### 5. Provenance tracking (streaming)

Maintain two maps:

- `Map<valueId, nearest-surviving-producing-step-index>` — for ResolveStep
  `.from.stepIndex` and ExpressionStep operand back-refs. Updated at each
  candidate step emission; when a step is gated off, its valueId inherits the
  nearest-surviving upstream per Resolution 15's rule (single-upstream hops
  transitively; multi-upstream merges break to `undefined`).
- `Map<(scope, name), latest-write-step>` — for `sourceResolveIndex` back-refs
  on terminal steps when resolves are on.

### 6. Stream lifecycle (consumer-pull)

Outer AsyncIterable (`session.steps`) yields
`StreamYield = { step: LiveStep, envDiff }` on each step start. Per-step inner
AsyncIterable (`step.events`) yields raw tracer events belonging to that step.
`step.done` resolves with a frozen Step when the step closes. Consumer breaks
out with `break` / `return` → JavaScript's for-await-of calls `.return()` →
triggers `cancel()` cascade (stop tracer worker, close all inner iterators).

### 7. Finalization (at `complete()`)

Tracer's `link()` phase finishes (the tracer already has its own finalization
producing a frozen AST with events/visits entwined). The NM layer builds a fresh
`result.ast` as a new NM-owned copy with:

- `dagRole` / `dagKind` tags (carried from construction-phase AST).
- `events: TraceEvent[]` per node (reverse lookup, chronological).
- `visits: number` per node (visit count).
- `stepIndices: number[]` per node (NM-added).

Steps, env, coverage are frozen. `NMTraceResult` returned.

## Step categories — summary

(Reproduced here alongside the step-closing rules; full glossary is in
[README.md](./README.md).)

| Category         | Node/Edge | Kinds (draft)                                                                                            |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `expression`     | node      | `literal`, `identifier`, `property`, `operator`, `call`, `template`                                      |
| `resolve`        | edge      | single kind                                                                                              |
| `statement`      | node      | `enter`, `exit`                                                                                          |
| `scope`          | node      | `create`, `leave`                                                                                        |
| `control-flow`   | node      | `conditional-test`, `branch-entry`, `loop-iter-start`, `loop-iter-end`, `break`, `continue`, `loop-exit` |
| `initialization` | node      | TBD                                                                                                      |
| `for-init`       | node      | TBD                                                                                                      |
| `write`          | node      | TBD                                                                                                      |
| `emit`           | node      | TBD                                                                                                      |
| `error`          | node      | TBD                                                                                                      |

## Step-closing rules

Each step kind has a specific event pattern that closes it. Until close, the
LiveStep is mutable; after close, `.done` resolves with a frozen Step.

| Kind                       | Close trigger                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------- |
| ExpressionStep(literal)    | emitted on literal resolve; single-event step                                      |
| ExpressionStep(identifier) | value resolution after `identifiers.read` (+ scope-chain walk events)              |
| ExpressionStep(property)   | value resolution after property access (+ proto-chain walk events)                 |
| ExpressionStep(operator)   | `exit-expr` matching the BinaryExpression / UnaryExpression / etc. node            |
| ExpressionStep(call)       | `exit-expr` on CallExpression                                                      |
| ExpressionStep(template)   | `template-end` matching `template-begin`                                           |
| ResolveStep                | single resolve event; no inner bracket                                             |
| StatementStep              | paired `enter-stmt` / `exit-stmt` brackets                                         |
| ScopeStep                  | `scope-create` / `scope-leave`                                                     |
| ControlFlowStep            | flowKind-specific (test completes on resolve; iter-end on iteration's scope-leave) |
| InitializationStep         | `exit-stmt(VariableDeclaration)` for declaration + initializer                     |
| ForInitStep                | `binding-available` for loop's binding                                             |
| WriteStep                  | `binding-update` (reassignment — side-effect of assignment operator expression)    |
| EmitStep                   | `io.user.*` / `io.dev.*` event (side-effect of call expression)                    |
| ErrorStep                  | error event; terminal                                                              |

## Structural constraints

- **NM-owned ASTs are fresh copies** (Resolution 19). `session.ast` at
  Construction, `result.ast` at Finalization. Tracer's frozen AST is an INPUT;
  the NM layer does not mutate it. In-memory reference cycles allowed;
  serialization requires replacer or helper.
- **Nodes and edges structural model** (Resolution 17). Expression, terminal,
  and structural steps are NODES. Resolves are EDGES with `.from` + `.to` each
  carrying AST-position locs (so edges render even when neighbor nodes are gated
  off).
- **Step aggregation uses a nodePath-keyed bracket stack.** Events belong to the
  innermost open step. Nested ExpressionSteps are supported via stack.
- **Coercion is dual-represented** (Resolution 18). Property `.coercion` on
  operator ExpressionSteps + standalone coercion events in `.events[]` when
  `semanticEvents: true`. No separate coerce step or kind.
- **ScopeStep exists for block create/leave** (Resolution 2). Hoisting events
  (binding-declare for let/const declared in the scope) ride as metadata on
  ScopeStep(create).
- **Side-effects of expressions emit as terminal steps.** Assignment operator
  expression → side-effect WriteStep with back-ref. Call expression →
  side-effect EmitStep(s) with back-refs (for I/O-producing callees).
- **Error cascade** (Resolution 12). Mid-step runtime error: every open
  LiveStep's `.done` resolves with the same error; one terminal ErrorStep emits.
- **cancel() cascades.** Stop tracer worker; close all inner iterators; outer
  iterator terminates.
- **Transforms are pure in the NM layer.** No side effects in aggregation paths
  (other than updating the provenance/env maps which are owned local state).
- **Registry of step-kind aggregators is static** (module-load-time
  registration). No dynamic registration at runtime.
- **Per-session isolation.** Each `nm()` call returns a fresh session. No
  cross-session shared state.

## NMConfig → TraceConfig mapping

**TBD** per Resolution 11 + 23. The mapping translates NMConfig's category
gates + `resolves.dependent` + `semanticEvents` to the tracer's
`TraceConfig.options` bit structure. Columns the table will have:

| NMConfig field | Effect on emission | TraceConfig.options required |
| -------------- | ------------------ | ---------------------------- |
| ...            | ...                | ...                          |

Finalize after NMConfig tree is decided (Resolution 23 — Phase 0.1
prerequisite).

**Contract sketch** (independent of the specific field names):

- `resolves: true, dependent: true` (default) → tracer emits all resolve events;
  NM aggregates them into ResolveSteps that co-emit with their consuming
  expression step.
- `resolves: true, dependent: false` → tracer emits all resolve events; NM
  aggregates ResolveSteps standalone (stepIndex may be undefined on from/to when
  transformation steps are gated off, but .loc populated).
- `expressions: false` → corresponding expression events still fire at tracer
  level (NM needs them for envDiff and terminal back-refs) but NM skips emission
  of those ExpressionSteps; their output valueIds propagate via the
  nearest-surviving map.
- `semanticEvents: false` → tracer enables only the minimum event set needed to
  build top-layer step fields; detail events (coercion, identifiers.read,
  binding-access, proto-check, scope-check) gated off. Consumer sees
  `events[] = undefined` on each step.

## Execution-phase × data-artifact matrix

| Artifact                     | Construction |     Streaming      |    Finalization     |
| ---------------------------- | :----------: | :----------------: | :-----------------: |
| `session.source`             |      ✓       |     (readable)     |     (readable)      |
| `session.ast`                |      ✓       | (readable, frozen) | (readable, frozen)  |
| `session.initialEnvironment` |      ✓       |     (readable)     |     (readable)      |
| `session.creationError`      |      ✓       |         —          |          —          |
| `session.steps` (stream)     |      —       |      pulling       |       drained       |
| LiveStep (in-progress)       |      —       |      mutable       |  frozen via .done   |
| Step (finalized)             |      —       |     via .done      | ✓ in `result.steps` |
| envDiff (per step)           |      —       |         ✓          |          ✓          |
| `result.ast`                 |      —       |         —          |   ✓ (fresh copy)    |
| `result.finalEnvironment`    |      —       |         —          |          ✓          |
| `result.coverage`            |      —       |         —          |          ✓          |

## Annotated example: `alert(prompt('n') + '!');`

Full-fidelity trace (all categories on, `resolves: { dependent: true }`,
`semanticEvents: true`):

```text
step  category          kind              notes
────  ────────────────  ────────────────  ──────────────────────────────────
  0   scope             create            script scope + hoisted bindings
  1   statement         enter             ExpressionStatement
  2   expression        identifier        value=ƒprompt, register=true
  3   resolve           (edge)            from=step2.output, to=step5.callee
  4   expression        literal           value='n'
  5   resolve           (edge)            from=step4.output, to=step6.arg[0]
  6   expression        call              callee=ƒprompt, args=['n'], result='Alice' (after user input)
      │                                    ⚡ events: enter-expr, identifiers.read(prompt),
      │                                        resolve('n'), call, io.user.output,
      │                                        [worker pauses],
      │                                        io.user.input('Alice'), exit-expr
  7   resolve           (edge)            from=step6.output, to=step9.operand[0]
  8   expression        literal           value='!'
  9   resolve           (edge)            from=step8.output, to=step10.operand[1]
 10   expression        operator          operator='+', operands=['Alice','!'], coercion=null, result='Alice!'
 11   resolve           (edge)            from=step10.output, to=step13.arg[0]
 12   expression        identifier        value=ƒalert, register=true
 13   resolve           (edge)            from=step12.output, to=step14.callee
 14   expression        call              callee=ƒalert, args=['Alice!'], result=undefined
 15   emit              (tbd)             channel='user', method='alert', payload='Alice!'
      │                                    back-ref: sourceResolveIndex=11
 16   resolve           (edge)            from=step14.output, to=sink (expression-statement discards)
 17   statement         exit              ExpressionStatement
 18   scope             leave             script scope end
```

With `resolves: false`: drop steps 3, 5, 7, 9, 11, 13, 16. InitializationSteps
(none here) and WriteStep/EmitStep (step 15) still carry `.value`.

With `expressions: false, resolves: {dependent: false}`: drop steps 2, 4, 6, 8,
10, 12, 14. Resolves 3/5/7/9/11/13/16 still fire with `stepIndex: undefined` on
their from/to but AST locs populated. EmitStep (15) still fires because its gate
is independent. Pure data-flow trace visualized as arrows between AST positions.

## Out of scope

- **Cross-session or cross-snippet communication.** If comparison exercises need
  multiple snippets, a single lens creates the variations internally.
- **Persistence.** No `localStorage`, no URL state. Each `nm()` recomputes.
- **Trace-result caching.** Recompute per call. User-input programs make caching
  non-trivial; deferred.
- **Middle-layer "syntax-view" emission.** Backlogged as a pure projection
  utility over events + ast when a concrete lens need surfaces.
- **Range filtering.** Phase 1+ extension per Resolution 4; affects event
  visibility only, AST stays full.
- **Pure helpers** (provenance walks, env-prefix reconstruction, binding
  timeline). Per Resolution 20 — the NM layer exposes data structures + stream
  only. Consumers write their own walks.
- **I/O dialog UI.** Consumer concern. Consumer supplies async functions via
  `NMConfig.io`; NM layer passes through to tracer; tracer dispatches
  main-thread awaits.
- **Snippet analysis / recommender.** Separate modules (`lib/analysis/`,
  `lib/recommender/`). The NM layer produces the data; those modules consume it.
- **Build-time MDAST processing.** That's the study-lenses plugin's concern.

## Links

- [README.md](./README.md) — module overview + glossary + diagrams
- [PLAN.md](./PLAN.md) — full DDD plan, Resolutions, canvas
- [types.ts](./types.ts) — public types (partial)
- [../semantics/](../semantics/) — sibling semantic tracer module
- [../../../../notional-machine.md](../../../../notional-machine.md) — NM spec
- [../../../../tracer.architecture.md](../../../../tracer.architecture.md) —
  tracer architecture (inspiration for this doc's style)
