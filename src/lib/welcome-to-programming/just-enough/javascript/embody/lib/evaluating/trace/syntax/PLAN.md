# Plan: Phase 0 DDD — Notional Machine layer wrapper

## Context

The NM-layer design has been iterated through an extensive canvas
session (archived below, after this plan). The design is a wrapper
on top of the existing JEJ tracer that exposes an NM-step-level API
for lens authors.

Three adversarial agent reviews just returned:

- **Design stability: PAUSE** — several decisions recorded two
  opposite ways in the same doc; must resolve before committing
  types.ts.
- **Implementation feasibility: CONSIDER** — buildable, but 4–5
  specs must be written before impl (step-closing rules,
  config translation, error cascade, `session.ast` vs `result.ast`).
  Real-time I/O verified workable via SAB spot-check.
- **Consumer ergonomics: PROCEED** — zero dealbreakers; 3 new pure
  helpers recommended (provenance, envPrefix, bindingTimeline).

Phase 0 artifacts go into (empty, ready):
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/`

Follows AGENTS.md workflow exactly.

## Resolutions (user decisions in this round)

All unsettled items must be resolved **before** Phase 0 begins. User
decisions captured below.

1. **Coercion — DUAL representation.** Coercion appears TWO ways:
   (a) as standalone semantic events in the step's event sub-stream
   when semantic events are enabled; (b) as a PROPERTY on the
   consuming operator step via `representCoercion` (pattern from a
   prior tracer version found in commit history — need to dig up the
   implementation to match signature). Consumer reading at step level
   sees the property; consumer drilling into events sees the event.
   Not a pick-one: both, at different layers.
2. **ScopeStep exists.** Blocks (`{ }`) are visible syntactic units.
   ScopeStep for create / leave at block boundaries. Strike the
   "no ScopeStep, scope transitions as metadata" entry from the
   canvas Decisions.
3. **`semanticEvents` config gate — kept, type-modeled.** Type the
   `events[]` and entwining as optional / conditional on the gate.
   When gated off, consumer gets bare step stream (efficient for
   lenses that don't need events). Not dropped.
4. **Range filtering — document in DDD.** Include in types.ts and
   DOCS.md (sketch). Defer the DECISION of which implementation phase
   implements it until after DDD commits.
5. **`StreamYield` shape — `{step, envDiff}` for v1.** Additional
   fields added later as non-breaking change.
6. **Step-closing-detection rules per kind — table in DOCS.md (0.5).**
   One row per step kind with its close trigger. Behavioral, not
   type-level.
7. **session.ast vs result.ast — confirmed distinction.** `session.ast`
   (live NM-owned mirror, built in parse + tag) vs `result.ast`
   (final, post-tracer-link, merged with NM tags). Name both in types
   - README.
8. **I/O mocks — tracer-side addition, part of this DDD.** Tracer
   updated to accept optional mocks for `prompt` / `alert` / `confirm`
   / `console.*`; defaults to native. NMConfig includes
   `io: { console, prompt, alert, confirm }` passed through to tracer.
   Exercise designers get UI/UX control. Since this is a tracer change,
   flag it as coordinated work (may need separate Phase 0 for the
   tracer-side API addition, or bundle if small enough).
9. **Stress-test "Unresolved" tags that are now Decided** — clerical
   cleanup before 0.4.
10. **NMConfig framing — AST question OPEN.** User flagged the
    pedagogy question: is teaching AST-level mental model valuable
    (deep-twinning, per syllabus.md — I need to read that) vs
    overhead for learners? This decision affects whether NMConfig
    options lean "AST-node-level" (teaches AST by exposure) or
    "source-visible" (hides AST). Still to discuss.
11. **NMConfig → TraceConfig mapping — table in DOCS.md (0.5).**
12. **Error-cascade rule — DOCS.md.** When a runtime error fires
    mid-step, every open LiveStep's `.done` resolves with the same
    error; one terminal ErrorStep then emits.

### Resolutions (post-compaction round — step-signature refinement)

1. **Anchor 1 — both AST and text refs on every step.**
    `dagNodePath: nodePath` (AST reference; the node visited at this
    moment) + `loc: SourceLocation` (text reference). `loc` is NOT
    always `ast[dagNodePath].loc` — for multi-transition steps
    (StatementStep enter/exit, ScopeStep create/leave), `loc` is the
    transition-specific moment (statement start vs end, `{` vs `}`).
    Step text SPAN (full syntactic unit) is derivable via
    `ast[dagNodePath].loc`; no third field needed.

2. **Anchor 2 — `semanticEvents: false` is Aran-level gating.**
    Path chosen: still use Aran, but the tracer emits only the
    minimum event set needed to build top-layer step fields (resolve,
    scope-create/leave, binding-initialize/update, control-flow
    decisions, error events). Detail-layer events (coercion,
    identifiers.read, binding-access, proto-check, scope-check)
    gated off at the tracer level. Consumer sees `events[] = undefined`
    on each step. Alternate lighter-instrumentation (non-Aran
    evaluator) dropped — not scoped for this DDD, no future RFC
    promised.

3. **Anchor 3 — step-kind gating affects emission; provenance
    traversal rule for broken chains.** NMConfig step-kind gates
    (`resolves`, `initializationSteps`, `scopeSteps`, etc.) directly
    control whether steps of that kind emit. When an upstream step
    is gated off, the NM layer maintains
    `Map<valueId, nearest-surviving-producing-step-index>` and
    applies this rule: if the gated step has a SINGLE upstream
    operand, hop transitively; if MULTIPLE upstreams (merge), the
    chain breaks (`producingStepIndex: undefined`). Consumers who
    need full provenance across gated regions use `valueId` +
    `sourceValueIds` (tracer-level value provenance, always intact).

4. **T1 — `resolves: false` is the default.** Coarse traces get
    structural steps only (statements, scopes, control flow,
    writes, emits). Structural steps that carry values
    (InitializationStep, WriteStep, EmitStep, ForInitStep,
    ControlFlowStep test) expose `.value` / `.result` / `.testValue`
    properties so coarse consumers see outcomes without resolve
    chains.

5. **T1 — `resolves: true` default with `.dependent` co-gating
    (updated).** Resolves are on by default. Co-gating pattern from
    tracer (`resolve.dependent`): a resolve fires only when its
    paired transformation/terminal step also fires. Set
    `{dependent: false}` for a pure data-flow trace where resolves
    fire standalone. Structural and terminal steps that carry
    values (InitializationStep, WriteStep, EmitStep, ForInitStep,
    ControlFlowStep test) still expose `.value` / `.result` /
    `.testValue` properties so coarse consumers get outcomes
    without needing resolves on.

6. **T2 — Resolve is a data-flow EDGE, not a value producer
    (REVISED from prior round).** Major structural correction:
    - A ResolveStep carries `.from: SourceRef` + `.to: DestinationRef`
      - `.value` — a single data-flow edge from source to
      destination. NOT `.sources[]` / `.destinations[]`. Singular.
    - Expression steps (see Resolution 18) are the value-producers.
      Resolves are the edges connecting them. Transformation chain
      is `expression → resolve → expression → resolve → ... →
      terminal`.
    - `.from` carries `{kind, loc, value, stepIndex?}`; `.to` carries
      `{kind, loc, stepIndex?, role?}`. `stepIndex` is `undefined`
      when the producer or consumer expression-step is gated off;
      `loc` is always populated (AST position) so consumer renders
      arrows between source locations even without those steps.
    - Pure data trace (`resolves: {dependent: false}`, transformations
      off) = chain of resolves with undefined stepIndex, rendered via
      `.from.loc` / `.to.loc`.
    - Side-effects (I/O emits triggered by calls; binding-updates
      triggered by assignments) are THEIR OWN steps (EmitStep,
      WriteStep) with back-ref `sourceResolveIndex` to the producing
      resolve or the causing expression step. NOT in the producer's
      `.to`.
    - Terminal destination steps (Initialization, ForInit, Write,
      Emit) carry `sourceResolveIndex?: number` back-ref (undefined
      when resolves off); when resolves off they carry `.value`
      directly.

7. **T3 — Step categories: 10-category expression-based baseline.**
    Step union uses `step.category` (outer) + `step.kind` (inner)
    two-level discriminant (Naming choice A — expression umbrella,
    kinds sub-discriminate, matches tracer vocabulary):

    | Category | Role | Kinds |
    |---|---|---|
    | `expression` | value-producer (node) | `literal`, `identifier`, `property`, `operator`, `call`, `template` |
    | `resolve` | data-flow edge | single kind |
    | `statement` | structural | `enter`, `exit` |
    | `scope` | structural | `create`, `leave` |
    | `control-flow` | structural | `conditional-test`, `branch-entry`, `loop-iter-start`, `loop-iter-end`, `break`, `continue`, `loop-exit` |
    | `initialization` | terminal destination | draft: single kind; TBD `let` vs `const` |
    | `for-init` | terminal destination | single kind (per-iteration rebind) |
    | `write` | terminal destination | `simple`, `compound` (e.g. `+=`) |
    | `emit` | terminal destination | `prompt`, `alert`, `confirm`, `console-log`, `console-warn`, `console-error`, etc. |
    | `error` | terminal | `ReferenceError`, `TypeError`, `RangeError` |

    **Coercion on operator expressions** (dual representation):
    - Property: `operatorExpressionStep.coercion?: CoercionRecord`
      — representCoercion-style array parallel to operands with
      pre-/post-coercion values and context.
    - Events: `operatorExpressionStep.events[]` carries standalone
      coercion events from the semantic tracer when
      `semanticEvents: true`.
    - NO `coerce` kind; there's no syntactic anchor for coercion.

    **Identifier-read variants:** IdentifierExpressionStep carries
    `.binding?: { name, scopePath, version }` when the read resolves
    to a binding; absent (or `.register: true`) when the read is of
    a pre-hoisted global (Math, prompt, etc.). Scope-chain walk
    events in `.events[]`.

    **Property-read:** PropertyExpressionStep carries prototype-chain
    walk in `.events[]` when `semanticEvents: true`. Proto-chain is
    sidecar; not its own category.

8. **PS1 — AST representation: fresh copies; cycles OK in-memory,
    stripped for serialization (UPDATED).**
    - NM layer builds its own AST structures (not Proxy, not parallel
      Map). Parent/child reference cycles are KEPT for in-memory
      convenience; `JSON.stringify` callers pass a replacer that
      strips cycles (or use a provided `toSerializable(ast)` helper
      when/if needed).
    - `session.ast` — construction-phase AST, frozen at session
      creation. Tags (dagRole, dagKind) + structure + loc per node.
      No events, visits, or stepIndices (execution hasn't happened).
    - `result.ast` — returned by `complete()`, fresh copy with
      events[] + visits + stepIndices populated per node (fully
      entwined).
    - NO progressive mutation during streaming. Consumer tracks
      live entwinement via the step stream if needed.
    - Two distinct AST objects per session (ref-unique). Refs held
      to `session.ast` stay valid post-complete but don't reflect
      post-execution annotations.

9. **No pure helpers in the NM layer.** The NM layer exposes
    data structures and the stream only. No `provenance`,
    `envPrefix`, `bindingTimeline`, or similar helpers. Consumers
    write their own walks over the data. Justification: keeps the
    NM layer lean; provenance-walk ergonomics differ per lens,
    so any built-in helper would risk over-fitting or be under-used.

10. **Gated-provenance UX guidance: suggest turning on resolves.**
    When consumers need continuous provenance across gated regions,
    the recommended path is to enable `resolves: true, dependent:
    false` for a pure data-flow trace — NOT to inspect raw
    `sourceValueIds` on events[] and reconstruct. The latter is
    possible but discouraged; document accordingly.

11. **Environment/Scope/Binding/EnvDiff data shape — DEFERRED to
    fresh session.** Design these in Phase 0.1 (ubiquitous language)
    of the fresh session with clean context. Concerns include: scope
    tree shape, TDZ state representation, binding versioning,
    envDiff delta format, active-scope-stack maintenance. Flagged
    as Phase 0.1 priority.

12. **NMConfig AST-aware framing confirmed.** Options reflect
    AST-node vocabulary (teaches AST by exposure per syllabus
    twinning). Exact NMConfig tree shape deferred to fresh session
    (Phase 0.2 README / 0.4 types.ts).

13. **Directory layout — DONE.** The NM-layer lives at
    `lib/evaluating/trace/syntax/`; the semantic tracer at
    `lib/evaluating/trace/semantics/`. Both are fully exportable,
    independently usable tracers — semantics is the core; syntax is
    an abstraction layer on top. Architectural implication: the
    syntax tracer must NOT hard-couple to the semantic tracer's
    private internals — only its public event stream + config
    contract + I/O passthrough. Agent artifacts moved from the
    originally-planned `/notional-machine/` into `syntax/` on
    2026-04-21; path references in Phase 0 artifacts updated.

## Phase 0-A — Tracer I/O mock API updates (parallel with Phase 0)

Tracer-side work that can be done in PARALLEL with Phase 0 NM-layer
DDD artifacts — not a strict precondition. Tracer DDD files (which
are the authoritative spec — source code is stale) are updated so
the NM Phase 0 can reference a consistent tracer contract when it
reaches the config-translation layer.

**Files updated (spec only — no code in this DDD):**

- `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/tracer.md`
- `/Users/master/Documents/.../javascript/tracer.architecture.md`
- `/Users/master/Documents/.../javascript/tracer.walkthroughs.md` (add a mocked-I/O walkthrough)

### 0-A.1 — Extend TraceConfig with `io` field (tracer.md)

```ts
type TraceConfig = {
  // existing: seconds, iterations, range, options

  io?: {
    prompt?:  (message: string, placeholder?: string) => Promise<string | null>
    alert?:   (message: string) => Promise<void>
    confirm?: (message: string) => Promise<boolean>
    console?: {
      log?:      (...args: unknown[]) => Promise<void>
      warn?:     (...args: unknown[]) => Promise<void>
      error?:    (...args: unknown[]) => Promise<void>
      info?:     (...args: unknown[]) => Promise<void>
      debug?:    (...args: unknown[]) => Promise<void>
      assert?:   (condition: boolean, ...args: unknown[]) => Promise<void>
      count?:    (label?: string) => Promise<void>
      countReset?: (label?: string) => Promise<void>
      group?:    (label?: string) => Promise<void>
      groupCollapsed?: (label?: string) => Promise<void>
      groupEnd?: () => Promise<void>
      time?:     (label?: string) => Promise<void>
      timeLog?:  (label?: string, ...args: unknown[]) => Promise<void>
      timeEnd?:  (label?: string) => Promise<void>
      clear?:    () => Promise<void>
    }
  }
}
```

**Contract:**

- Every mock function is **async** (returns Promise). Tracer awaits
  the Promise before continuing.
- Return values: `prompt` → user's "response" string (or `null` for
  cancel); `confirm` → boolean; `alert` / `console.*` → ignored.
- Missing mock → native implementation (main-thread native dialog /
  devtools console).
- Events are identical whether mocked or native — `io.user.output`,
  `io.user.input`, `io.dev.*` fire exactly as today. Mocks only
  change WHO receives the output / WHERE the input comes from, not
  the trace.

### 0-A.2 — Update worker ↔ main-thread I/O protocol (tracer.architecture.md)

Layer 5 (Emitter) section gains I/O handling detail:

- Worker posts an `io-request` message (method identifier + payload)
  via SAB protocol.
- Main-thread `handleIoRequest` consults `config.io?.<method>`:
  - Present → `await config.io[method](...args)`; write return value
    (if any) back via SAB; unblock worker.
  - Absent → call native (existing behavior); write return value
    back; unblock worker.
- SAB pause/resume protocol unchanged; mocks just swap the dispatcher
  on the main thread. (Important: the `await` happens on the main
  thread, NOT inside the worker — worker stays blocked until
  response. This is what makes async mocks tractable.)

**Footnote — mocked vs. native event timing (applies to all four I/O
channels: prompt / alert / confirm / console.\*).** The event
**sequence** is identical between mocks and native: `io.user.*` /
`io.dev.*` fire with the same args, in the same order, at the same
point in the event stream. What differs is wall-time:

- **Native**: worker calls the real implementation from its execution
  thread with no main-thread round-trip; the event fires and
  execution continues ~immediately.
- **Mocked**: worker posts an `io-request` via SAB; main thread
  awaits the async mock; worker unblocks. The event fires at the
  same position in the sequence, but wall-time between that event
  and the next is gated by the mock's Promise settling.

Consumers reading the event stream see identical ordering. Real-time
lenses that interpret event-arrival wall-time should note that
mocked I/O stretches inter-event gaps but never reorders events.

### 0-A.3 — Add a mocked-I/O walkthrough (tracer.walkthroughs.md)

Include one example showing a program with `prompt`/`alert` traced
with mocks:

```ts
const config = {
  options: { io: true },
  io: {
    prompt: async (msg) => 'Alice',       // mock returns fixed response
    alert: async (msg) => { /* no-op or write to test buffer */ },
  },
}
```

Event sequence identical to the existing prompt walkthrough — just
no native dialog appears; the `io.user.input` value comes from the
mock.

### 0-A.3b — `operandSteps: number[]` — UNDER DISCUSSION (dispatcher layer)

**Status: flagged for discussion, not committed.** The NM layer's
ExpressionStep schema would benefit from each operator event
carrying `operandSteps: number[]` (step-indices parallel to
operands) so `SourceRef.stepIndex` can be populated in O(1) per
source instead of requiring a per-operator scan.

**User-assessed placement: dispatcher layer, not emitter layer.**
The dispatcher already tracks step indices and operand valueIds;
attaching operand-step-indices there is the natural home. Confirm
in tracer.architecture.md as a proposed feature under discussion.

**Do NOT lock in during this DDD.** Flag in tracer.md as a
proposed addition; defer final decision to a tracer-side RFC.
The NM layer design accommodates both presence (O(1) lookup) and
absence (fallback to NM-layer-maintained
`Map<valueId, nearest-surviving-producing-step>` per Resolution 15).

Walkthrough sketch (for tracer.walkthroughs.md) when/if adopted:

```js
let x = 2;
let y = 1 + x * 3;
```

Expected: outer `+` event has `operandSteps: [-1, <mul-step-idx>]`
(literal `1`, then the `*` step that computed `x * 3`); the `*`
event has `operandSteps: [<x-read-step-idx>, -1]`. Exercises both
binding-read-as-producer and literal-as-primordial.

### 0-A.4 — AR-0A (adversarial review of tracer-side changes)

Spawn a reviewer with the three tracer doc updates. Focus:

- Mock contract consistent with existing worker-protocol spec?
- SAB pause/resume compatible with async mocks (verify the await
  stays main-side)?
- Any console method missed? (Cross-check against
  notional-machine.md §I/O Channels console table.)
- Any edge case where a mock vs native produces DIFFERENT events?
  (It should never — if it does, the contract is broken.)
- `operandSteps: number[]` schema addition consistent with the
  existing provenance model (valueId / sourceValueIds)? Sentinel
  for primordial sources well-chosen (`-1` vs `undefined`)?

Verdict rules per AGENTS.md.

### 0-A.5 — Commit Phase 0-A

Prompt: `docs: add tracer I/O mock configuration spec`

---

## Phase 0 — DDD artifacts

### 0.1 — Establish the ubiquitous language

Write the glossary into `/lib/evaluating/trace/syntax/README.md` (see 0.2).
Candidate core terms (refine in this step):

- **NM session** — object returned by `nm(source, config)`; orchestrates
  parse, tag, stream, finalize.
- **AST (NM view)** — the parsed tree with `dagRole` / `dagKind` tags
  per node; two reading conventions (syntax tree, data-flow DAG).
- **Step** — one NM-unit of execution. Two-level discriminant:
  `step.category` (outer) + `step.kind` (inner). Ten categories
  (Resolution 18): `expression` (kinds literal/identifier/property/
  operator/call/template), `resolve`, `statement`, `scope`,
  `control-flow`, `initialization`, `for-init`, `write`, `emit`,
  `error`. Steps are classified structurally as NODES (value
  producers + terminals + structural markers) or EDGES (resolves).
- **ExpressionStep** — category `expression`. Syntactically
  pointable value-producer at an AST Expression node. Six kinds
  mirror AST: `literal`, `identifier`, `property`, `operator`,
  `call`, `template`. Each carries its output value + transformation
  detail (operands/callee/parts + result). Operator steps carry
  optional `.coercion` property (Resolution 18 dual representation).
- **ResolveStep** — category `resolve`. A data-flow EDGE between
  nodes: `.from: SourceRef` + `.to: DestinationRef` + `.value` +
  `.loc`. Carries AST-position locs on both ends so consumers
  render arrows even when neighbor nodes are gated off. Not a
  value-producer.
- **Terminal step** — category `initialization` / `for-init` /
  `write` / `emit` / `error`. Represents where a value ends its
  flow. Carries back-ref `sourceResolveIndex?: number` to the
  incoming resolve (when resolves are on), plus `.value` /
  `.result` properties for coarse consumers. Side-effects of
  expression steps (I/O emit from a call, binding-update from an
  assignment) become their own terminal steps with back-refs,
  NOT as entries in the expression's destination.
- **LiveStep** — a step in its streaming / mutable form; fields fill
  as events arrive; `.done` resolves at close.
- **Environment** — the lexical + runtime state (scope tree, bindings,
  active scope stack).
- **envDiff** — per-step delta applied to the environment.
- **Dynamic trace** — the ordered step sequence + the entwined tagged
  AST.
- **Creation error (R4a)** — parse / validate / instrument failure
  pre-execution.
- **Runtime error (R4b)** — execution-phase error during a step.
- **NMConfig** — config passed to `nm()`; AST-node-level options that
  the wrapper translates to tracer gates.
- **Producing / consuming step index** — two-way link between
  step that produced a value and step(s) consuming it.

Watch: "step" (NM meaning, distinct from tracer's `.step` on events);
"scope" (lexical vs runtime); "trace" (tracer emits events; NM
produces steps built from events).

### 0.2 — Write `/lib/evaluating/trace/syntax/README.md`

Contents:

- What this module does: **"JEJ NM syntax-level tracer of the
  semantic-level tracer"** (preferred wording per user). Elevates
  tracer events into NM-step categories that map to visible
  syntactic units + one data-flow-edge category (resolves).
- Where it fits (between lens authors and raw tracer events).
- Inputs / outputs at the boundary.
- Glossary (from 0.1).
- **Diagrams and tables required** — take visual inspiration from
  `tracer.architecture.md` (layer-and-vertical diagrams, event-flow
  arrows, per-category tables). Specifically: a step-category
  summary table (columns: category, role, kinds, gate, sample
  events triggering emission), a NODE-vs-EDGE classification
  diagram showing expression/terminal/structural as nodes and
  resolves as edges, and an ASCII example trace of a representative
  program with every category visible.
- Bounded context — owns: step aggregation, AST tagging, envDiff
  computation, step-stream lifecycle. Does NOT own: execution
  (tracer), lens rendering (consumers), JEJ validation (upstream).
- Navigation (file layout).
- Links to sibling (`../semantics/`), parent
  (`../../../../README.md`), tracer docs (`../../../../tracer.md`
  et al), NM spec (`../../../../notional-machine.md`).

### 0.3 — AR-1 design challenge

Spawn one adversarial reviewer (general-purpose). Provide: README.md,
the Unsettled items list, canvas Decisions excerpt. Focus areas per
AGENTS.md §AR-1:

- Ubiquitous language alignment with codebase — any naming collisions
  (especially "step" homonym with tracer)?
- Bounded context correctness — doing too much / too little?
- Separation of concerns — will implementation phases tangle?
- Simpler alternatives?
- Missing edge cases in spec?
- Decisions hard to change later — flag them.
- New patterns (async iterable of live-mutable objects) —
  justified?

Verdict: PROCEED → 0.4; CONSIDER → document responses then 0.4; PAUSE
→ surface to user before continuing.

### 0.4 — Write `/lib/evaluating/trace/syntax/types.ts`

Translate the ubiquitous language into TypeScript. Start fresh from
the Resolutions list (especially 13–19 from the post-compaction
round). The canvas "Rough types" section in ARCHIVE is STALE —
use it for flavor only; Resolutions supersede.

Types to include:

- `NMSession`: source, ast (construction-phase; no events/visits),
  initialEnvironment, creationError, steps
  (AsyncIterable<StreamYield>), complete(), cancel().
- `NMConfig`: step-category gates (draft names, finalize in fresh
  session per Resolution 23):
  - `expressions?: boolean | { literals?, identifiers?, properties?,
    operators?, calls?, templates? }`
  - `resolves?: boolean | { dependent?: boolean }` (default
    `{dependent: true}`; see Resolution 16)
  - `statementSteps?`, `scopeSteps?`, `controlFlowSteps?`,
    `initializationSteps?`, `forInitSteps?`, `writeSteps?`,
    `emitSteps?`, `errorSteps?` (errors probably always on)
  - `semanticEvents?: boolean` (governs `events[]` population on
    every step; Resolution 14)
  - `seconds`, `iterations`, `range` (range deferred to Phase 1+)
  - I/O mocks field: `io?: { prompt?, alert?, confirm?, console? }`
    — consumer concern, passed through to tracer (Resolution 16 of
    comment batch; see Phase 0-A).
- `Step` discriminated union over `{ category, kind, ... }`. Ten
  categories (Resolution 18). Each category's variant defines its
  own `kind` enum + fields. Every step carries `dagNodePath`,
  `loc` (Resolution 13).
- `ExpressionStep` variant (category = `expression`): kinds
  `literal`, `identifier`, `property`, `operator`, `call`,
  `template`. Each kind has its own fields:
  - literal: `value`
  - identifier: `value`, `binding?: {name, scopePath, version}`,
    `register?: true`
  - property: `object`, `propertyName`, `value`
  - operator: `operator`, `operands: ValueRef[]`, `coercion?:
    CoercionRecord`, `result`
  - call: `callee: ValueRef`, `args: ValueRef[]`, `result`
  - template: `staticParts: string[]`, `interpolations:
    ValueRef[]`, `result: string`
- `ResolveStep` variant (category = `resolve`, single kind): `from:
  SourceRef`, `to: DestinationRef`, `value`, `valueId?`,
  `dagNodePath`, `loc`. Resolution 17 — edge, not producer.
- Terminal-step variants (`initialization`, `for-init`, `write`,
  `emit`, `error`): kind-specific fields + `sourceResolveIndex?:
  number` back-ref + `.value` / `.result` for coarse consumers.
- Structural-step variants (`statement`, `scope`, `control-flow`):
  transition/flowKind field per Resolution 18 table. `envDiff`
  on every step.
- `LiveStep` = Step + `events: AsyncIterable<TraceEvent>` + `done:
  Promise<Step>`; TSDoc documents mutation contract (mutable during
  streaming; frozen post-`.done`).
- `NMTraceResult`: ok, ast (fresh copy with events[] / visits /
  stepIndices populated), steps, initial/final env, coverage, error.
- `SourceRef`: `{kind: 'literal' | 'identifier' | 'property' |
  'operator-output' | 'call-output' | 'template-output' | 'io-input',
  loc, value, stepIndex?: number}`. `stepIndex` undefined when
  producer expression step is gated off.
- `DestinationRef`: `{kind: 'operand-input' | 'arg-input' |
  'initialization' | 'for-init' | 'write' | 'emit' | 'sink', loc,
  stepIndex?: number, role?: {operandIndex?: number, argIndex?:
  number}}`. `stepIndex` undefined when consumer is gated off.
- `ValueRef` (used inside ExpressionStep): the value + producing
  resolve back-ref.
- `CoercionRecord` (operator-step property, representCoercion-style):
  array parallel to operands carrying pre-/post-coercion values +
  context.
- `Environment`, `Scope`, `Binding`, `EnvDiff` — shape DEFERRED to
  fresh session Phase 0.1 per Resolution 22.
- `CreationError`, R4bError types.
- **No pure helpers** (Resolution 20). Data structures + stream only.

DEV.md rules: named functions, destructured param defaults, deep
freeze, `.js` import extensions, `type` over `interface`.

### 0.5 — Write `/lib/evaluating/trace/syntax/DOCS.md` architectural sketch

Per DEV.md §Directory Documentation Convention format. No function
names, no pseudocode. **Lean heavily on diagrams and tables** —
take inspiration from `tracer.architecture.md`'s style: labeled
layer diagrams, event-flow arrows, per-category tables. Concrete
asks:

- A layers diagram (Construction / Config-translation /
  Step-aggregation / Envdiff-computation / Provenance-tracking /
  Stream-lifecycle / Finalization) with data arrows between them.
- A step-category table (columns: category, role node/edge,
  kinds, close-trigger, gate).
- A step-closing-rules table (one row per kind, verbatim from
  Resolution 18 table expanded).
- An NMConfig → TraceConfig mapping table (Resolution 11).
- An execution-phase × data-artifact matrix showing what's
  readable when: session creation / streaming / complete().
- An ASCII example step stream for a representative JEJ program
  (e.g., `alert(prompt('n') + '!');`) at full fidelity, annotated
  with category/kind per step.

**Execution phases (domain terms):**

1. **Construction** (sync, throws on R4a) — parse + JEJ-validate +
   build tagged AST + initial environment. Output: live-mirror AST,
   initialEnvironment, creationError (if R4a).
2. **Config translation** (sync, pure) — map NMConfig options to
   tracer TraceConfig.options via a mapping table. No ambiguity:
   if any NM option requests a tracer gate, gate enabled.
3. **Step aggregation** (streaming) — observe tracer events, group
   into steps per per-kind closing rule; maintain nodePath-keyed
   bracket stack so nested expressions produce nested ResolveSteps;
   emit LiveStep on first event; resolve `.done` on close event.
   Per Resolution 15, gated-off step kinds don't emit but their
   valueIds are tracked in the NM layer's provenance map for the
   traversal-fallback rule.
4. **EnvDiff computation** (streaming) — maintain environment state
   as events arrive; compute per-step diff at step close.
5. **Provenance tracking** (streaming) — maintain
   `Map<valueId, nearest-surviving-producing-step-index>` for
   ResolveStep source resolution; + `Map<(scope, name),
   latest-write-step>` for back-refs on binding-read sources.
6. **Stream lifecycle** — outer AsyncIterable, per-step inner
   iterators, cancel cascade on outer `.return()`.
7. **Finalization** (at `complete()`) — merge NM tags with tracer's
   post-link AST into `result.ast`; freeze steps, env, coverage;
   return NMTraceResult.

**Structural constraints:**

- NM-owned ASTs are fresh copies (Resolution 19); `session.ast`
  at Construction, `result.ast` at Finalization. Tracer's frozen
  AST is an input; the NM layer does not mutate it. In-memory
  cycles OK; serialization requires replacer or helper.
- Step aggregation uses a nodePath-keyed bracket stack; events
  belong to innermost open step; nested ExpressionSteps supported
  via stack. Resolves are emitted as edges BETWEEN expression steps
  (from producer expression's exit → consumer expression's operand
  position).
- Nodes and edges (Resolution 17): expression steps + terminals +
  structural steps are NODES. Resolves are EDGES. Each resolve has
  `.from` + `.to` with AST-position locs, so edges render even
  when neighbor nodes are gated off.
- Coercion: property `.coercion` on operator ExpressionStep +
  events in `.events[]` (Resolution 18 dual representation). No
  separate coerce step/kind.
- ScopeStep exists for create/leave at block boundaries
  (Resolution 2). Hoisting events (binding-declare for let/const in
  the scope) ride as metadata on ScopeStep(create).
- Errors truncate all open LiveSteps with the same error; one
  terminal ErrorStep emits (Resolution 12).
- `cancel()` cascades: stop tracer worker; close all inner
  iterators; outer iterator terminates.
- Side-effects (I/O emit from call; binding-update from assignment)
  emit as their own terminal steps (EmitStep, WriteStep) with
  `sourceResolveIndex` back-ref to the causing flow.
- Step-closing rules (table in DOCS.md):
  - ExpressionStep(literal): emitted on literal encounter; closes
    immediately (no sub-events)
  - ExpressionStep(identifier): `identifiers.read` event + optional
    scope-chain walks; closes on value resolution
  - ExpressionStep(property): `identifiers.read` + proto-chain walks
    - property-access; closes on value resolution
  - ExpressionStep(operator): `enter-expr` / `exit-expr` bracket on
    the BinaryExpression / UnaryExpression / etc. node
  - ExpressionStep(call): `enter-expr` / `exit-expr` on CallExpression
  - ExpressionStep(template): `template-begin` / `template-end`
  - ResolveStep: emitted on each resolve event; single-event steps
    (no inner bracket)
  - InitializationStep: `exit-stmt(VariableDeclaration)` for
    declaration + initializer
  - ForInitStep: `binding-available` for loop's binding
  - WriteStep: `binding-update` (reassignment via assignment
    operator's side effect)
  - EmitStep: `io.user.*` / `io.dev.*` event
  - StatementStep: paired `enter-stmt` / `exit-stmt` brackets
  - ScopeStep: `scope-create` / `scope-leave`
  - ControlFlowStep: flow-kind-specific (conditional-test completes
    on resolve; loop-iteration-end on iteration's scope-leave)
  - ErrorStep: error event

**Out of scope:**

- Custom-UI I/O dialogs (consumer concern — consumer supplies
  `io: { prompt, alert, confirm, console }` async functions; NM
  layer passes through to tracer; tracer dispatches main-thread
  awaits).
- Trace-result caching (recompute each call).
- Middle-layer "syntax-view" emission (backlogged as projection
  utility).
- Range filtering (Phase 1 extension).
- Built-in env-snapshot reconstruction (offered as `envPrefix`
  helper instead).

### 0.6 — AR-2 sketch challenge

Spawn separate adversarial reviewer. Provide: DOCS.md, README.md,
types.ts. Focus areas per AGENTS.md §AR-2:

- Sketch at right level of abstraction (no function names, no
  pseudocode)?
- Named execution phases the right granularity?
- Each phase has single distinct responsibility?
- Structural constraints complete — failure modes, async boundaries?
- Out-of-scope section correct and complete?
- Uses ubiquitous language from 0.1?
- Consistent with types.ts?

Verdict rules: PROCEED → 0.7. CONSIDER → document responses, 0.7.
PAUSE → resolve before 0.7.

### 0.7 — Review & resolve

Read types.ts, README.md, DOCS.md together. Can I (and the user)
predict what the implementation will do and what shape it will take
from these three alone? If not, resolve ambiguity now — an unresolved
ambiguity will surface as a bug or a structural mess in Phase 1.

### 0.8 — Commit Phase 0 artifacts

Prompt user for commit:
`docs: establish trace/syntax domain model and architectural sketch`

## Phase 1 — TDD implementation increments

Each increment runs the full 15-step cycle per AGENTS.md:
JSDoc → stub → placeholder types → lint → test (ZOMBIES order) →
**AR-3** → lint → implement (Fake It OK for first) → lint → refactor
(check against DOCS.md sketch) → lint → update types → self-review
(LLM anti-pattern checklist) → **AR-4** → quality checks
(`npm test && npm run lint && npm run type-check`) → verify docs
match → **atomic commit** `add: [behavior]`.

### Planned increments (order)

The increment list below reflects the 10-category edge-based step
model. Exact sub-increments per ExpressionStep kind should be
finalized from the Phase 0.5 DOCS.md step-closing-rules table.

1. **Construction: parse + validate** — `nm(source)` exposes source;
   creation-error populated for invalid input.
2. **AST tagging** — dagRole / dagKind per node; role derived from
   node.type + JejTag. Fresh NM-owned copy (Resolution 19).
3. **Initial environment** — scope tree + bindings-in-TDZ + globals.
   (Env-shape spec from Resolution 22 Phase 0.1 work.)
4. **NMConfig → TraceConfig translation** — category gates +
   `resolves.dependent` + `semanticEvents` → tracer options.
5. **Step aggregation: ExpressionStep(literal)** — value capture
   from `resolve.kinds.literal`.
6. **Step aggregation: ExpressionStep(identifier)** — binding-read
   - register-read with `.binding?` populated.
7. **Step aggregation: ExpressionStep(property)** — MemberExpression
   - prototype-chain in `.events[]`.
8. **Step aggregation: ExpressionStep(operator)** — operands,
   `.coercion` property, result. Sub-sub-increments per operator
   family (arithmetic, comparison, logical, assignment, update,
   typeof, negation, in, conditional) as needed.
9. **Step aggregation: ExpressionStep(call)** — callee + args +
   return. Side-effect spawns (EmitStep) via back-ref.
10. **Step aggregation: ExpressionStep(template)** — static parts
    - interpolation slots + concat result.
11. **Step aggregation: ResolveStep** — edge between producer
    expression and consumer; `.from`/`.to` with AST locs; handles
    `resolves.dependent: false` standalone mode.
12. **Step aggregation: InitializationStep** — `let/const = ...`
    with `sourceResolveIndex` back-ref + `.value`.
13. **Step aggregation: ForInitStep** — for-loop init binding with
    per-iteration rebind semantics.
14. **Step aggregation: WriteStep** — reassignment (`x = 5`, `+=`)
    as side-effect of assignment operator step, back-referenced.
15. **Step aggregation: EmitStep** — I/O emits (alert / prompt /
    confirm / console.*) as side-effect of call-expression steps.
16. **Step aggregation: StatementStep** — enter/exit boundaries.
17. **Step aggregation: ScopeStep** — create/leave at blocks with
    hoisted-bindings metadata on create.
18. **Step aggregation: ControlFlowStep** — conditional / loop /
    break / continue, with `.testValue` / `.result` on tests.
19. **Step aggregation: ErrorStep** — R4b; truncate open LiveSteps.
20. **LiveStep emission** — emit on first event, mutate, resolve
    `.done` on close.
21. **Inner events stream** — `liveStep.events` AsyncIterable.
22. **envDiff computation** — per-step delta.
23. **Provenance tracking** — `Map<valueId, producing-step-idx>`
    with traversal-fallback rule (Resolution 15); `sourceResolveIndex`
    back-refs on terminals when resolves on.
24. **Cancel cascade** — outer `.return()` terminates tracer +
    closes inner iterators.
25. **Error truncation semantics** — mid-step error resolves all
    open LiveSteps + emits terminal ErrorStep (Resolution 12).
26. **`complete()` finalization** — NMTraceResult with fresh
    `result.ast` (entwined with events / visits / stepIndices) +
    steps + env + coverage.

~26 increments. Some may merge or split during implementation.
No pure helpers (Resolution 20).

## Phase 2 — Pre-merge review

1. Full quality checks: `npm test && npm run lint && npm run type-check`
2. **AR-5** pre-merge review. Provide: full diff (`git diff`),
   modified files list, this plan file as original task description,
   DOCS.md for the module. Focus areas per AGENTS.md §AR-5.
3. Address PAUSE / CONSIDER items from AR-5.
4. Prompt user for commit:
   `add: trace/syntax NM-layer tracer`.

## Critical files

**To create** in `/lib/evaluating/trace/syntax/`:

- `README.md` (0.2)
- `types.ts` (0.4)
- `DOCS.md` (0.5)
- `nm.ts` (entry point, Phase 1)
- `tag-ast.ts` (Phase 1 increment 2)
- `build-initial-environment.ts` (increment 3)
- `translate-config.ts` (increment 4)
- `aggregate-steps/*.ts` per step category (increments 5–19);
  `aggregate-steps/expression/*.ts` per ExpressionStep kind
- `live-step.ts` (increment 20)
- `env-diff.ts` (increment 22)
- `provenance-tracking.ts` (increment 23)
- `cancel.ts` (increment 24)
- `finalize.ts` (increment 26)
- No helper modules (Resolution 20 — no pure helpers in NM layer)
- `tests/` subdirectory with `.test.ts` per source file

**Read-only references:**

- `../../../../tracer.md`, `../../../../tracer.architecture.md`,
  `../../../../tracer.walkthroughs.md`,
  `../../../../notional-machine.md`, `../../../../reference.md`
- `../semantics/` (sibling runtime dep — the semantic tracer)
- `/0-curricula/AGENTS.md`, `/0-curricula/DEV.md`

## Verification

End-to-end after Phase 2:

1. `npm test` — all NM-layer unit tests pass.
2. `npm run lint` — no violations in `/lib/evaluating/trace/syntax/**`.
3. `npm run type-check` — no errors.
4. Smoke test: construct a session for Snippet B from canvas
   (`alert(prompt('n') + '!');`), iterate `session.steps`, verify
   LiveStep sequence matches the Phase-0-refined stress-test sketch.
5. Readable-together check: read README + types + DOCS together; can
   someone unfamiliar with the canvas predict the implementation?

---

# Handoff — state of decisions for fresh session

This section is the authoritative starting point for a fresh
session to pick up the NM-layer DDD. The ARCHIVE below contains
the full canvas history; the Resolutions list (§Resolutions
post-compaction round) captures all load-bearing decisions made
through this design phase. The canvas ARCHIVE has internal
contradictions that were resolved in the Resolutions list —
**Resolutions supersede ARCHIVE on any conflict.**

## Persist this plan into `/lib/evaluating/trace/syntax/` alongside DDD artifacts

Before starting Phase 0 in the fresh session, copy this entire
plan file (including the Context, Resolutions, Phase 0-A, Phase 0,
Phase 1, Phase 2, Critical files, Verification, Handoff, and
ARCHIVE sections) into
`/lib/evaluating/trace/syntax/PLAN.md` (or similar name chosen by the user).
Keep it committed alongside the DDD artifacts (README.md, types.ts,
DOCS.md). Reasons:

- The ARCHIVE canvas is a thinking record the user may want to
  revisit during implementation.
- The Resolutions list is the load-bearing decisions log; losing
  it means re-litigating the design.
- The handoff section lets subsequent sessions (across compactions,
  across days, across collaborators) pick up without scrolling
  `~/.claude/plans/`.

After copying, the plan file at
`~/.claude/plans/read-these-files-before-elegant-squirrel.md` can
be deleted or archived. The in-repo copy is the source of truth
from Phase 0 onward.

## Partial Phase 0 execution — THIS session

The user asked for "what you can do now with current context" to be
produced in `/lib/evaluating/trace/syntax/`, with deferred items clearly
marked. Following that instruction:

### Files to create in this session

1. **`PLAN.md`** — already copied (this file, verbatim) at
   `/lib/evaluating/trace/syntax/PLAN.md`.

2. **`development-guide.md`** — a human-coordinator guide styled
   after `.planning-handoffs/development-guide.md`. Covers: how to
   kick off an agent session, what to expect per phase, red flags,
   open decisions requiring human input, git strategy, context
   management, quick-reference table. Can be written in full now.

3. **`README.md`** — Phase 0.2 output. Written against Resolutions
   - Glossary. Contents per plan §0.2: module description ("JEJ NM
   syntax-level tracer of the semantic-level tracer"), glossary
   (10-category model), diagrams + tables (step-category summary,
   node-vs-edge classification, ASCII example), bounded context,
   navigation, links. Can be written in full now; NMConfig tree
   references go with placeholder + link to PLAN.md open items.

4. **`DOCS.md`** — Phase 0.5 architectural sketch. Written against
   Resolutions. Contents: execution-phase diagram, step-category
   table (from Resolution 18), step-closing rules table (expanded
   from §0.5), structural constraints, out-of-scope. Can be
   written ~85% now; the **NMConfig → TraceConfig mapping table is
   marked TBD** per Resolution 11 (needs finalized NMConfig per
   Resolution 23).

5. **`types.ts`** — Phase 0.4 output. Written against Resolutions
   17-19. Contents: NMSession, NMTraceResult, LiveStep,
   StreamYield, Step discriminated union (10 categories),
   ExpressionStep variant with 6 kinds, ResolveStep edge,
   terminal-step shapes, SourceRef/DestinationRef, CoercionRecord,
   ValueRef. **Environment, Scope, Binding, EnvDiff are STUBBED
   with TODO markers** per Resolution 22. **NMConfig tree is
   STUBBED** with draft shape + TODO per Resolution 23.
   **Terminal-step kind enums are STUBBED** pending decision. Can
   be written ~70% now; the stubs are explicit and compileable
   (using `unknown` or TODO-typed aliases).

### Deferred to fresh session

- **Phase 0-A tracer doc updates** — `io: { prompt, alert, confirm,
  console }` field, event-timing footnote, operandSteps flagged as
  under-discussion. These edit files OUTSIDE this directory
  (`../../../../tracer.md`, `../../../../tracer.architecture.md`,
  `../../../../tracer.walkthroughs.md`). Defer because: (a) they're
  tracer-side, not NM-layer; (b) scope is small but best reviewed
  with the tracer team/session; (c) parallel-with-Phase-0 per plan.
- **Environment / Scope / Binding / EnvDiff data shape** — per
  Resolution 22 Phase 0.1 prerequisite.
- **NMConfig tree finalization** — per Resolution 23 Phase 0.1
  prerequisite.
- **Q3b expression-kind register-read decision** — whether
  register-reads fold into `identifier` kind with flag or get their
  own kind.
- **Terminal-step kind enum details** — `initialization`
  (let/const?), `write` (simple/compound?), `emit` (per-method vs
  per-channel?), `error` (per-error-type?).
- **AR-1 (design challenge)** — adversarial review of README +
  types.ts + DOCS.md. Better done in fresh session with clean
  context and a dedicated reviewer agent.
- **AR-2 (sketch challenge)** — same rationale.
- **Phase 0.7 review-and-resolve pass** — human-loop decision-point
  per plan.
- **0.8 commit** — wait for AR-1/AR-2 verdicts.
- **Phase 1 TDD implementation** — entirely a fresh-session
  concern.
- **Phase 2 pre-merge review** — terminal phase.

### Execution plan for this session

1. Write `/lib/evaluating/trace/syntax/development-guide.md`.
2. Write `/lib/evaluating/trace/syntax/README.md`.
3. Write `/lib/evaluating/trace/syntax/DOCS.md`.
4. Write `/lib/evaluating/trace/syntax/types.ts` with Environment/NMConfig/
   terminal-kind stubs clearly marked.
5. No commit, no AR-1/AR-2, no Phase 0-A — those wait for the
   fresh session and the user's Phase 0.1 decisions.

After this session, `/lib/evaluating/trace/syntax/` will contain: PLAN.md,
development-guide.md, README.md, DOCS.md, types.ts — a readable
scaffold for the fresh session to validate, complete, and AR.

## What's settled (safe to commit to types.ts / DOCS.md)

- **Session shape:** `nm(source, config) → NMSession` with eager
  `source`, `ast`, `initialEnvironment`, `creationError` (null iff
  R4a); streaming `steps: AsyncIterable<StreamYield>`; resolution
  via `complete(): Promise<NMTraceResult>`; `cancel()` auto-called
  on iterator break.
- **Stream yield shape:** `{ step: LiveStep, envDiff: EnvDiff }`.
- **LiveStep lifecycle:** emit on step START; mutate in-place as
  events arrive; `events: AsyncIterable<TraceEvent>` for inner
  pull; `done: Promise<Step>` resolves with frozen step on close.
- **AST model** (Resolution 19): fresh NM-owned copies. In-memory
  reference cycles OK; stripped for serialization via replacer or
  helper. `session.ast` at construction + `result.ast` at
  `complete()`, no live mutation of `session.ast`.
- **Step signature** (Resolution 13): every step carries
  `dagNodePath` (AST ref) + `loc` (text ref, transition-aware).
- **Step union, two-level discriminant** (Resolution 18):
  `{ category, kind }`. TEN categories: `expression`, `resolve`,
  `statement`, `scope`, `control-flow`, `initialization`,
  `for-init`, `write`, `emit`, `error`.
- **Structural classification** (Resolution 17): expression,
  terminal, and structural steps are NODES. Resolves are EDGES.
  Expressions produce values; resolves flow values between nodes;
  terminals consume values.
- **ResolveStep is a data-flow EDGE** (Resolution 17 REVISED),
  not a value-producer. `.from: SourceRef` + `.to: DestinationRef`
  - `.value` + `.loc`. Singular destination. Terminal steps carry
  `sourceResolveIndex?` back-ref when resolves are on.
- **Coercion on operator expressions** (Resolution 18 dual
  representation): `.coercion?: CoercionRecord` property on the
  operator ExpressionStep + standalone coercion events in
  `.events[]` when `semanticEvents: true`. NO coerce step/kind.
- **Resolves default ON with co-gating** (Resolution 16). Default
  `resolves: { dependent: true }`. Set `{dependent: false}` for
  pure data-flow trace mode.
- **Gating affects step emission** (Resolution 15). Broken chains:
  single-upstream hop transitively, multi-upstream merge can leave
  `stepIndex: undefined` on from/to — LOCs still populated for
  rendering. Recommended fix: turn on resolves.
- **semanticEvents: false = Aran-level gating** (Resolution 14).
  Tracer emits minimum events for top-layer step fields; detail
  events gated off.
- **ScopeStep exists** (Resolution 2) for block create/leave;
  hoisting rides on create.
- **Error cascade** (Resolution 12): mid-step runtime error →
  open LiveStep `.done` resolves with error → one terminal
  ErrorStep emits.
- **No pure helpers** (Resolution 20). Data + stream only.
- **I/O mocks are a consumer concern** (comment 16). Consumer
  supplies async functions; NM layer passes through to tracer;
  tracer dispatches on main thread. Phase 0-A specs the tracer
  contract; NM layer just forwards.
- **Diagrams + tables required in README and DOCS.md**
  (comment 14). Inspiration: `tracer.architecture.md`.

## What's still open (needs decision in fresh session)

- **Environment / Scope / Binding / EnvDiff data shape**
  (Resolution 22 — Phase 0.1 priority). TDZ states, scope tree
  shape, binding versioning, envDiff delta format.
- **NMConfig tree shape finalization** (Resolution 23). AST-aware
  vocabulary confirmed. Exact field names, nesting, and
  shorthand-expansion rules to finalize against tracer's
  TraceConfig.options structure. Candidate names from Phase 0.4
  sketch: `expressions?: { literals?, identifiers?, properties?,
  operators?, calls?, templates? }`, `resolves?: { dependent? }`,
  plus per-terminal-kind gates.
- **Q3b — finalize expression-kind enum** details. Draft:
  `literal`, `identifier`, `property`, `operator`, `call`,
  `template`. Confirm whether register-reads (pre-hoisted globals)
  are `identifier` with `.register: true` flag, or a separate
  kind. Cross-check against JEJ AST node types.
- **Range filtering** (Resolution 4): documented in DOCS.md as
  Phase 1+ extension; decide which increment implements it.
- **NMConfig → TraceConfig mapping table** (Resolution 11): write
  in DOCS.md Phase 0.5.
- **Machine-based category reorganization — discussion point.**
  During design we considered adding `binding` and `prototype`
  categories (env-visible events as first-class steps) to align
  with notional-machine.md's machine-at-a-glance. User concluded
  for now: env-access events stay as sub-events in the owning
  step's `.events[]` (coherent with nodes/edges structural model
  — resolves are edges; env-access would be intra-node). Revisit
  in fresh session WITH notional-machine.md open if visualization
  needs surface env-access as its own steps. Don't re-design
  unless a concrete pedagogical use case forces it.
- **Stress-test "Unresolved" tags in the ARCHIVE canvas that are
  now Decided** (Resolution 9): clerical cleanup before Phase 0.4.
- **Terminal step kinds** — finalize `initialization` (let vs
  const as kinds?), `write` (simple vs compound), `emit` (per
  I/O method).
- **Assignment operator modeling** — confirmed shape: expression
  step (operator kind, `operator: '='`) produces RHS value;
  side-effect spawns WriteStep with back-ref. Finalize the
  sideEffects field shape (if any) on the operator ExpressionStep
  itself (probably: no forward-ref — consumers scan for back-refs
  on downstream WriteSteps).

## Where to begin in the fresh session

1. Read §Context, §Resolutions (both rounds), and this Handoff
   section. That's the whole input. The ARCHIVE canvas is
   reference-only — Resolutions SUPERSEDE any contradiction.
2. Resolve the Phase 0.1 priority items from "What's still open"
   before writing types.ts:
   - Environment/Scope/Binding/EnvDiff data shape (Resolution 22)
   - NMConfig tree-shape finalization (Resolution 23)
   - Q3b expression-kind enum details
3. Execute Phase 0-A in PARALLEL with Phase 0 (not a strict
   precondition): tracer docs — I/O mock API (with
   prompt(message, placeholder) two-arg signature), event-timing
   footnote, operandSteps flagged as under-discussion
   (dispatcher-layer).
4. Execute Phase 0 DDD artifacts (0.1 ubiquitous language → 0.2
   README → 0.3 AR-1 → 0.4 types.ts → 0.5 DOCS.md → 0.6 AR-2 →
   0.7 review → 0.8 commit). README and DOCS.md MUST contain
   substantial diagrams + tables (inspiration:
   `tracer.architecture.md`).
5. Phase 1 TDD increments per the ~26-increment list (now
   reflecting the edge-based step model). Sub-increments per
   ExpressionStep kind finalize from Phase 0.5 step-closing table.
6. Phase 2 AR-5 pre-merge review + commit.

## Pointers for the fresh session

- The in-repo plan copy in `/lib/evaluating/trace/syntax/PLAN.md` stays the
  source of truth. The ARCHIVE canvas in this plan is
  reference-only; skim for depth, trust Resolutions for decisions.
  On any conflict, Resolutions win.
- Adversarial reviews per AGENTS.md: AR-0A for Phase 0-A, AR-1
  for Phase 0.2 README, AR-2 for Phase 0.5 DOCS+types,
  AR-3/AR-4 per TDD increment, AR-5 pre-merge.
- The canvas has a Diagram-0c stress-test (§Diagram 0c in
  ARCHIVE) under the OLD DataStep-era step model — treat as
  historical; rebuild under the current 10-category edge-based
  model once DOCS.md stabilizes.
- Machine-based category reorganization (binding/prototype as
  top-level categories) is DEFERRED and may not happen. Current
  expression-based ontology is the committed baseline.
- When writing DOCS.md: the Resolution 18 table, the step-closing
  table, and an annotated ASCII example of a representative JEJ
  program's full-fidelity step stream are all load-bearing
  artifacts. Don't skip them.

---

# ARCHIVE — Design iteration canvas

The following is the full design canvas that led to this DDD
proposal. Kept as reference; Phase 0 artifacts (README.md, types.ts,
DOCS.md in `/lib/evaluating/trace/syntax/`) supersede it from 0.8 onward.

---

# Canvas — NM-layer design + DAG-based execution-event representation

A working canvas for designing the NM (notional machine) layer that
wraps the JEJ tracer with an NM-step-tracer API. Not a plan — a
working design document with current decisions + open questions.

**Reading order:**

- **Diagram 0** — the DAG substrate, the foundational representation.
  Six subsections (0.0 through 0.5) cover the 3×2 role × view grid,
  AST (= AST with tags), environment, dynamic trace rules,
  exercise operationalization, and the layer palette.
- **Diagram 0b** — stress tests that probe where the DAG model bends.
- **Adversarial review** — short status summary of findings from four
  hat-wearing agents (spec / impl / pedagogy / curriculum).
- **Walkthrough alignment check** — validation that the tracer's
  specified event vocabulary supports the DAG model.
- **Future work: NM-enrichment layer** — the API for an NM step
  tracer that wraps the raw tracer. Data structure lifecycle, types,
  entwinement, decisions made. Primary design artifact.
- **Consumer-pattern validation** — three high-level lens sketches
  (trace table, live data-flow highlight, backward provenance) to
  validate the API supports real pedagogical use cases.
- **Open questions / decisions** — consolidated status list.

Earlier Diagrams 0c (concrete snippet examples) and 3–7 (axis
speculation, visual renderings) were removed in condensation; 0c
is slated for rebuild once the model refinements settle.

---

## Diagram 0 — The DAG substrate (the proposed foundation)

**Scope of this proposal.** This is a **tool for capturing and
representing static and execution evaluation** of JEJ programs.
Pedagogy, curriculum sequencing, learner-facing vocabulary, and
higher-order learning objectives (strategy, correctness, debugging,
style, algorithmic intent) are OUT OF SCOPE — those are later layers
built on top of this substrate. Audience for the current artifact:
developers and SME content authors.

**Claim (from your message):** the smallest unit of a JEJ trace is
`source --[optional transformation]--> destination`. A full trace is the
DAG of all such units.

**Why this may be the right foundation:** the tracer is SPECCED to
produce this. From `tracer.md`: `resolve.provenance` adds `valueId` +
`sourceValueIds` to every ResolveEvent, and "the full provenance graph
is reconstructable from ResolveEvents alone." That spec makes the DAG
the natural representation for L1.

> **Docs + types are the contract; impl will catch up.** Treat
> `tracer.md` and the TS type surface as the authoritative spec of what
> the tracer emits. The current codebase lags in some places
> (`resolve`, `coercion`, `identifier`, `scope-check`, `proto-check`
> generators; `ValueRepresentation.valueId`) — these gaps are scheduled
> to close. This proposal represents the tracer's SPECIFIED output, not
> a snapshot of the current implementation. Event patterns in
> [`tracer.walkthroughs.md`](../../tracer.walkthroughs.md) are
> consistent with the DAG model (confirmed in the
> Walkthrough-alignment section below).

### NM components map onto DAG roles (3 roles × 2 views)

Each DAG role has two views: the SYNTAX the learner sees in the code,
and the NM EVENTS the tracer fires. The "explanation" activity links
them across the boundary — "this `+` in the code produced this
`operator` event, which resolved to 3."

```text
┌──────────────────┬─────────────────────────────┬──────────────────────────────┐
│                  │  SYNTAX (what's in the code) │  NM EVENTS (what fires)      │
├──────────────────┼─────────────────────────────┼──────────────────────────────┤
│ SOURCE           │ • literals (5, 'hi', true,   │ • resolve.kinds.{literal,    │
│ (node)           │   null, undefined, regex)    │     variable, property}      │
│                  │ • identifier reads           │ • expression.literals.*      │
│                  │   — binding or register      │ • expression.identifiers.read│
│                  │   — see Ambiguity 1 below    │ • expression.properties.*    │
│                  │ • I/O inputs (prompt /       │ • bindings.events.access     │
│                  │   confirm return values)     │ • io.user.input              │
├──────────────────┼─────────────────────────────┼──────────────────────────────┤
│ TRANSFORMATION   │ • operators (+, <, ===, ??, │ • resolve.kinds.{operator,   │
│ (edge)           │   ++, typeof, !, …)          │     call, template,          │
│                  │ • CALLS (the call itself —   │     shortCircuit,            │
│                  │   function values come from  │     conditional, increment,  │
│                  │   a source: binding read,    │     assignment}              │
│                  │   register access, etc.)     │ • expression.operators.*     │
│                  │ • template interpolations    │ • expression.functions.call  │
│                  │   (coerce + concat)          │ • expression.templates.*     │
│                  │ • new Date() (constructor    │ • coercion                   │
│                  │   call — sole `new` in JEJ)  │                              │
│                  │ • ASSIGNMENT expressions     │ • resolve.kinds.assignment   │
│                  │   (`x = 1`, `+=`, `??=`) —   │ • expression.operators.      │
│                  │   ARE transformations: fire  │     assignment.{simple,      │
│                  │   operator events AND        │     compound, logical-       │
│                  │   evaluate to the RHS value  │     Compound}                │
│                  │   (enables `a = b = 1`)      │                              │
│                  │ • PURE PROVENANCE edge only  │ (no operator event; only    │
│                  │   in DECLARATION-WITH-INIT   │  bindings.events.initialize │
│                  │   (`let y = x`): RHS flows   │  in DESTINATION column)     │
│                  │   directly to binding, no    │                              │
│                  │   intermediate op            │                              │
├──────────────────┼─────────────────────────────┼──────────────────────────────┤
│ DESTINATION      │ • assignment (=, +=, ??=)    │ • bindings.events.{          │
│ (node)           │ • declaration-with-init      │     initialize, update}      │
│                  │   (let x = 5, const y = …)   │ • io.dev.* (console.*)       │
│                  │ • I/O-emitting calls         │ • io.user.output             │
│                  │   (alert, console.log, …)    │   (alert / confirm / prompt  │
│                  │ — see Ambiguity 2 below      │     at moment of display)    │
└──────────────────┴─────────────────────────────┴──────────────────────────────┘

┌─── SIDECAR (routing annotation; NOT data flow) ───────────────────────────┐
│   prototype-chain lookup: "how we reached this transformation"             │
│   scope-chain lookup:     "how we reached this source/destination"         │
│                           gates: scopes.lookup, prototype                  │
└────────────────────────────────────────────────────────────────────────────┘

┌─── META-STRUCTURE (OVER the DAG, not IN it) ──────────────────────────────┐
│   statement seq: TOTAL ORDER between sub-DAGs (linear sequence)            │
│   control flow:  WHICH sub-DAGs materialize, HOW MANY times                │
│                  gates: statements.{conditionals, while, doWhile, for,     │
│                                     forOf, break, continue}                │
│   scopes:        grouping of binding time-portals                          │
│                  gates: scopes.{script, block}.*                           │
│   errors:        truncate a sub-DAG without producing its output           │
│                  gates: errors                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Two ambiguities the 3×2 exposes

**Ambiguity 1 — Identifiers have dual role: value vs function.**
An identifier read always resolves to *something*. If the something is
a primitive (`Math.PI`, `name`, `x`), the identifier-read is an
ordinary source node. If the something is a function reference
(`Math.random`, `parseInt`, or a binding previously assigned a
function), the identifier-read is STILL a source — but the value it
yields is callable machinery, not data. What makes it part of a
transformation is the CALL that follows, not the identifier-read.

```text
   Math.PI (identifier, no call)        Math.random() (identifier + call)
          │                                    │
          ▼                           [identifier: Math.random]
    [source: 3.14]                            │  resolves to function ref
    (ordinary source node,                    ▼
     flows directly into DAG)           [source: function]
                                               │
                                               ▼ (call transforms)
                                           random number
                                           (the call is the transformation)
```

**Ambiguity 2 — Bindings can hold functions, not just values.**
JS's "functions are first-class values" reaches into JEJ even though
JEJ forbids user-defined functions. You can still assign a function
reference to a binding:

```text
   const r = Math.random;         // binding r holds a function reference
   const val = r();               // binding read → call → value
```

At the DAG level, the binding time-portal works the same whether the
stored value is a primitive (`5`) or a function reference
(`Math.random`). Nothing special. The distinction only matters when
the downstream node is a CALL — calls on non-callable values throw
`TypeError`.

**Implication for the 3×2:** transformations (edges) are ALWAYS
triggered by a call, an operator, a template interpolation, or coercion
— never by an identifier read or a binding access alone. Sources
(nodes) are whatever resolves to a value, primitive OR function. The
tracer event signature is the same; what's different is what happens
next.

### 0.1 — AST (the AST view)

The **AST** is the source code rendered as a tree of syntactic nodes.
Read it via parent/child for the syntax-tree view; read node tags
(dagRole / dagKind) for the data-flow view ("AST"). Derivable
from source by parse + validate; no execution required. **AST and
"AST" collapse to one data structure** — two reading
conventions over the same nodes.

**Anchor program** (used through 0.1–0.5):

```js
let name = prompt('name');
if (name.length > 0) {
  alert('hi, ' + name.toUpperCase());
}
```

**Static DAG:**

```text
┌─ Stmt 1: let name = prompt('name'); ────────────────┐
│                                                      │
│   [lit 'name'] ──► prompt:call ──► [terminal]        │
│                                         │             │
│                                         ▼             │
│                                    [bind-w: name]     │
└──────────────────────────────────────────────────────┘
                │  (L5b statement sequence)
                ▼
┌─ Stmt 2: if (name.length > 0) { … } ────────────────┐
│                                                      │
│   test DAG:                                          │
│     [bind-r: name] ──► .length ──► >:op ◀── [lit 0]  │
│                                      │                │
│                                  [terminal: bool]    │
│                                      │                │
│                          ┌───────────┴────────────┐  │
│                          │                        │  │
│                       TRUTHY                    FALSY │
│                          │                     (empty │
│                          ▼                     — no   │
│                                                else)  │
│   body sub-DAG:                                      │
│                                                      │
│     [bind-r: name] ──► .toUpperCase:call ──► (string)│
│                                                 │     │
│     [lit 'hi, '] ──────► +:op (concat) ◄────────┘     │
│                              │                        │
│                              ▼                        │
│                          [terminal]                   │
│                              │                        │
│                              ▼                        │
│                          alert:call ──╎──► [io-out]   │
│                              │                        │
│                           (sink)                      │
└──────────────────────────────────────────────────────┘
```

**R4a errors:** if source fails parse, JEJ validation, or tracer
instrumentation, the AST never materializes. Program never runs.

**AST (AST) properties:**

- **Potential, not actual.** Every branch and loop body is shown. The
  dynamic trace will realize ONE path through.
- **Identifier kind is syntactic.** `name` (free-floating) vs
  `.length` / `.toUpperCase` (dot-property). Scope-chain vs
  prototype-chain lookup is decided at parse.
- **No runtime values.** Literals render as code form; bindings are
  named slots with no content.
- **Dead code visible.** An unreachable AST subtree is still part of
  the program structure.

---

### 0.2 — Environment

The **environment** is the lookup infrastructure. Built after the
AST is tagged (by R0 rule), then queried and mutated throughout the
dynamic trace.

**Initial environment** (after R0 setup for the anchor program):

```text
┌─ Script scope ──────────────────────────────────────┐
│  name: TDZ (declared in source, not yet initialized) │
└──────────────────────────────────────────────────────┘
                │ scope-chain parent
                ▼
┌─ Global scope (fixed for every JEJ program) ────────┐
│  ƒ prompt, ƒ alert, ƒ confirm                        │
│  ƒ parseInt, ƒ parseFloat, ƒ Boolean                 │
│  Math:   { PI, E, max, min, abs, floor, …, random }  │
│  String: { fromCharCode, fromCodePoint,              │
│            .prototype: { toUpperCase, toLowerCase,   │
│                          slice, trim, includes, … } }│
│  Number: { isNaN, isFinite, isInteger,               │
│            .prototype: { toString, toFixed, … } }    │
│  Date:   { now, parse,                               │
│            .prototype: { getFullYear, getMonth, … } }│
│  console: { log, warn, error, assert, …, clear }     │
│  Infinity, NaN, undefined (constants)                │
└──────────────────────────────────────────────────────┘
```

**Environment evolution** — snapshot per trace step for the anchor:

```text
Step 0 (after R0):       name: TDZ
Step 1 (after Stmt 1):   name: 'Alice' (v1, initialized)
Step 2 (after Stmt 2):   name: 'Alice' (unchanged)
```

**Equivalent as a diff stream** — what conventional trace tables track:

```text
Step 1 diff: name: TDZ → 'Alice' (v1)
Step 2 diff: (no env change — alert returns undefined, nothing stored)
```

**Environment properties:**

- **Lexical structure comes from the AST** — which bindings
  exist and in which scope are derivable at parse time.
- **Runtime state evolves during trace** — TDZ → initialized; version
  updates; active scope stack changes when scopes enter/leave.
- **Two equivalent renderings.** Full snapshot per step (trace tables)
  OR initial + diff sequence (compact; what changes).
- **No errors during R0** for JEJ (deterministic).

---

### 0.3 — Dynamic trace rules

The dynamic trace is derived from the AST + environment by
**12 rules**: R0 setup + three families (Structural / Valuational /
Resolving).

**R0 — Environment setup** (pre-execution). Populate script scope with
declared `let`/`const` bindings (all in TDZ); fix the global
environment and prototype chain structure. No errors in JEJ.

**STRUCTURAL** (what shape the trace takes)

- **R1 — Statement sequencing.** Dispatch each statement to its rule;
  advance one step at a time.
- **R2 — Control flow.** Realize test (R5); execute chosen branch
  (conditional) or repeat body N times (loop) inside new block scopes.
  Break/continue interrupt. Env effect: scope enter/leave;
  per-iteration re-hoist. Errors: RangeError on loop-guard exceed.
- **R3 — Short-circuit ops** (`&&`, `||`, `??`, `?.`, `??=`, `&&=`).
  Realize LHS; conditionally realize RHS. RHS skipped → not in trace.
- **R4a — Static errors** (fire pre-R0). Parse, JEJ validation,
  instrumentation. Program never runs.
- **R4b — Dynamic errors** (fire during R5/R7/R8/R9). Reference /
  Type / Range. Truncate sub-DAG; downstream skipped; env stays at
  error-point snapshot; no rollback.

**VALUATIONAL** (how values get computed)

- **R5 — Realize expression DAG.** Evaluate sources (literals direct;
  identifiers via R8/R9; I/O via runtime). Evaluate transformations
  in **left-to-right order per the ECMAScript spec** (operators with
  R10 coercion; calls with function value + args; templates coerce +
  concat; identity R6). Produce terminal value. Env: read-only.
- **R6 — Pure provenance edge in declaration-with-init.** `let y = x`
  or `let y = 5`: the RHS expression's terminal value flows directly
  to the binding; no intermediate operator event fires. (Standalone
  assignment `x = 1` is NOT this case — it IS a transformation via
  the assignment operator, fires `expression.operators.assignment.*`,
  and evaluates to the RHS value. See R7.)
- **R7 — Binding writes.** Advance version (v_n → v_n+1); update value;
  clear TDZ on init. Env effect: binding version + value.
  Errors: TypeError on `const` reassignment.

**RESOLVING** (how identifiers become values)

- **R8 — Scope-chain lookup** (free-floating identifiers). Walk current
  scope → parent → … → global. Observable at L4 via scope-check events.
  Errors: ReferenceError (TDZ or not-found).
- **R9 — Prototype-chain lookup** (dot-property identifiers). Walk
  value's type-proto → … → null. Observable at L6 via proto-check
  events. Errors: TypeError on unfound call target.
- **R10 — Coercion.** In R5, between operand resolution and operator
  application, on type mismatch. Kinds: string concat, numeric, boolean
  context, equality (`==` only), template interpolation, explicit
  conversion. Observable at L3.
  > **Decision: spec-aligned (standalone coercion events).**
  > `tracer.md` specs standalone coercion events; the walkthroughs
  > confirm (e.g., `coerce('hello' → true, context: boolean)`,
  > `coerce(1 → '1', context: string-concatenation)`). Standalone
  > events give independent gateability — a lens focused just on
  > coercion can filter for them. Coercion events are BOOKENDED
  > between `enter-expr` and `exit-expr` of the containing operator:
  > still "within" the operator temporally, but distinct events in the
  > stream rather than payload on a single operator event. Current
  > implementation folds coercion into a `coercedOperands` field; the
  > impl will be updated to match spec.
  >
  > **JEJ-scope note on ToPrimitive hints:** in full JS, `+` uses hint
  > "default"; `-` / `*` / `<` / `>` use "number"; `` `${x}` `` uses
  > "string", and these differ for reference-typed operands. JEJ is
  > primitives-only with a read-only Date exception. The hint
  > distinction is invisible at the JEJ level. Not a JEJ concern;
  > flag for transition to full JS later.

(Condensed rule-application trace for the anchor program was
previously here — removed because it pre-specced the Step stream
shape before we'd finalized LiveStep / Step payload structure, and
risked codifying a misreading. A worked example of the final Step
stream will go into the rebuilt Diagram 0c.)

---

### 0.4 — Exercise operationalization

The four-artifact architecture — **source → AST (the AST,
when read via dagRole tags) → environment → dynamic trace** —
generates a family of exercise types, each instantiable as a Study
Lenses lens configuration. One formal distinction, many concrete
interventions. (Note: AST and "AST" are one data structure
with two reading conventions; the NM layer exposes only `ast` with
role tags.)

**Static → Dynamic** (prediction):

- "Given this AST + this input, what's the dynamic trace?"
- "Given this AST, enumerate all possible dynamic traces."
- "Given this partial dynamic trace, predict the next step."

**Dynamic → Static** (reverse engineering):

- "Given a dynamic trace, reconstruct the AST."
- "Given multiple dynamic traces of the same program, identify the
  invariant static structure."

**Environment-focused:**

- "Fill in the env snapshot at step T." (conventional trace table)
- "Given env diffs, infer the code that produced them."
- "Scope movie: given a trace, draw the scope lifecycle."

**Hybrid / mixed:**

- "Given AST + env snapshot at step T, predict dynamic trace
  at T+1."
- "Coverage map: given a dynamic trace, highlight which AST
  nodes were realized."

**Mapping to existing Study Lenses activities** (trace-dependent
lenses only — purely static exercises like blanks/parsons/highlight
don't need this trace API and aren't listed here):

- Trace tables ↔ environment snapshot / diff exercises.
- Predict-then-compare ↔ static → dynamic prediction with self-check.
- Live data-flow highlight ↔ step-stream subscription.
- Coverage map ↔ ast[node].visits + stepIndices.

Each existing trace-dependent lens becomes a specific slice of the static↔dynamic
design space, not a bespoke activity.

---

### 0.5 — Layer palette (not a progression)

Decided: **layers are a visibility palette, not an additive ladder.**
Each column below lists what becomes available as specific tracer
gates turn on. An exercise composes any subset — e.g., "control flow
- bindings without scope-chain lookup" or "resolves + bindings only"
are equally legitimate. Curated progressions (analogs of "L1 → L6")
can be built on top of the palette as specific named profiles.

**The palette** (elements, not levels):

| Element | Static DAG reveals | Environment reveals | Dynamic Trace reveals |
|---|---|---|---|
| **Resolves** (core) | topology | (opaque without others) | resolve stream |
| **Origination labels** | source / destination roles | initial snapshot | literal / I/O / binding / register labels on nodes |
| **Transformations** | operator / call / template kinds | (as origination) | operator events + coercion |
| **Bindings** | time-portals | binding versions over time | binding events |
| **Scopes** | scope groupings | scope-chain structure | scope-check events |
| **Statements + control flow** | statement flowchart | (as scopes) | statement sequence, branch decisions, loop iterations |
| **Prototypes** | prototype structure | prototype chains explicit | proto-check events |

Each row is a gateable element. Curated named profiles (the former
L1, L3, L6 triples) become lens-config presets built from the palette,
not a fixed progression.

**Two compatible framings:**

- **Palette = tracer gate profile**: each enabled row corresponds to
  specific `options.*` gates.
- **Palette = DAG visibility slice**: each enabled row reveals a
  specific set of annotations across all four artifacts.

The frames are equivalent — every palette row IS a gate subset; the
four-artifact framing just says WHAT the gates expose in structural /
semantic terms.

---

## Diagram 0b — Stress tests of the DAG metaphor

Probes to find where the DAG holds, bends, or breaks. Order is arbitrary;
each is a separate sketch the user can push back on.

### Stress 1 — Identity vs equality for literal duplicates

Program: `let y = 5 + 5;`

```text
   5 [literal]    5 [literal]    <- two source nodes
    │              │                same VALUE, distinct NODES
    └──▶ + ◀───────┘
          │
          ▼
         10
          │
          ▼
      [binding y]
```

**Question:** are the two `5`s "the same value" or "two values that
happen to be equal"? In JS they're `===`. In DAG terms they're distinct
nodes with distinct provenance. **Verdict:** handled cleanly. May
actually HELP teach primitive value semantics — value-equality and
node-identity are separate axes, and the DAG makes the distinction
visible.

### Stress 2 — Compound assignment: read-and-write on the same binding

Program: `x += 1`

```text
  [binding x: read]               <- source
        │
        ▼
        +  ◀── 1 [literal]        <- transformation (2→1)
        │
        ▼
  [binding x: write]              <- destination (SAME binding, later time)
```

**Question:** same binding as both source and destination. Fit?
**Verdict:** yes — tracer already splits `binding.access` from
`binding.update` as distinct events at distinct steps. The DAG captures
them as distinct nodes tied to the same binding. Clean.

### Stress 3 — Multiple writes: binding versioning

```text
  let x = 5;    // binding x v1 ← 5
  x = 10;       // binding x v2 ← 10
  alert(x);     // read x ← which version?
```

**Verdict:** reads come from the MOST RECENT version at read-time.
Time-portals need versioning. This is exactly SSA form from compiler
IRs — a well-studied representation. Adds one concept but it's a
concept the learner is likely to want anyway ("x changed over time").
Good L4 variant: "show every version of x."

### Stress 4 — Short-circuit evaluation

Program: `a && b`

```text
  [source a]
      │
      ▼
   && (short-circuit)  ◀── conditional 2nd-input activation
      │
      ├─ a falsy  ─▶  result = a   (b NEVER becomes a source)
      │
      └─ a truthy ─▶  result = b   (b evaluated as source)
```

**Verdict:** sub-expression control flow. The `&&` transformation has
conditional input activation. Fits the "control flow determines which
sub-DAGs materialize" framing at micro-scale. No breakage.

### Stress 5 — Loop scale: sub-DAG explosion

A loop with N iterations produces N copies of the body's sub-DAG.
At N=1000, the DAG is too large to visualize directly.

**Affordances** (UI level, not model level):

- **Roll-up**: show 1 iteration + "… N−1 more." Expand on demand.
- **Invariant view**: show the sub-DAG TEMPLATE + an iteration-counter
  knob the learner scrubs.
- **Aggregate view**: "x went from 0 to N−1 over N iterations" — summary
  without per-iteration detail.
- **Sampling**: show iteration 1, 2, N−1, N.

**Verdict:** model is fine; UI needs scale strategies. Each strategy is
a potential lens variant at L5b.

### Stress 6 — Side effects crossing the program boundary

`alert('hi')`: DAG has `'hi' → alert transformation → undefined → sink`.
The EFFECT on the user (dialog appears) is not a node inside the DAG.

**Question:** is that a problem?

```text
  'hi' [literal]
     │
     ▼
   alert [destination]
     │
     ▼
  (sink — return value undefined)

     ╎
     ╎ (dashed "effect edge" crossing program boundary)
     ▼
  [user sees dialog]
```

**Verdict:** partial coverage of reality but FINE as a model — tracer's
`io.user.output` captures the effect as an event, so we have the data.
Rendering choice: show a dashed effect-edge crossing the program
boundary at L2. The PROGRAM boundary becomes an explicit part of the
visualization.

### Stress 7 — Errors mid-sub-DAG

Program: `let x = undefined.foo;`

```text
  undefined [source]
       │
       ▼
    .foo access
       │
       ⚡ TypeError: cannot read .foo of undefined
       │
     (sub-DAG terminates; output never produced;
      downstream nodes never materialized)
```

**Verdict:** errors = truncated transformations. Downstream greyed out.
Good rendering affordance: the error symbol on the edge, with the
un-materialized downstream region shown faded.

### Stress 8 — Prototype/scope chain: genuine sidecars?

`'hello'.toUpperCase()`

```text
  'hello' [source]
     │
     │   ╎ (sidecar lookup — NOT data flow)
     │   ╎   proto-check('hello', miss)
     │   ╎   proto-check(String.prototype, hit: toUpperCase)
     │   ╎        │
     │   ╎        ▼ (selects WHICH transformation to apply)
     ▼   ╎
   toUpperCase [transformation]
     │
     ▼
   'HELLO'
```

**Verdict:** routing machinery, not data flow. Clean sidecar. Same
shape for scope-chain lookups (L4). The DAG model cleanly separates
"what data flows" from "how the engine finds the transformer." Both
are pedagogically important but are genuinely different things.

### Stress 9 — Regex literals

Program: `const re = /hello/i; const ok = re.test('hi there');`

```text
  [lit-regex] /hello/i      <- source node (reference-valued)
       │
       ▼
  [bind-w: re] ── time portal ── [bind-r: re]
                                      │
                                      │  ╎ proto-check(re, miss)
                                      │  ╎ proto-check(RegExp.prototype, hit: test)  (L6 sidecar)
                                      ▼
                                  .test:call ◀── [lit] 'hi there'
                                      │
                                     true (or false)
                                      │
                                      ▼
                                 [bind-w: ok]
```

**Verdict:** regex literals are source nodes (reference-valued, like
primitives in DAG flow). `.test()` / `.exec()` are transformations
reached via L6 proto-chain sidecar. Stateful regex (`/g` flag with
`lastIndex` mutation) is probably out of JEJ scope — if in, would
require a time-portal INSIDE the regex object (beyond the current
binding-level time-portal model). Flag for later.

### Stress 10 — `new Date()` as the sole reference-type exception

Program: `const now = new Date(); const year = now.getFullYear();`

```text
  new Date:call   (no data inputs; 0→1 transformation)
       │
    [Date instance]   <- reference-valued source node
       │
       ▼
  [bind-w: now] ── time portal ── [bind-r: now]
                                      │
                                      │  ╎ proto-check(Date.prototype, hit: getFullYear)
                                      ▼
                                  .getFullYear:call
                                      │
                                    2026      <- primitive (Date's guarantee)
                                      │
                                      ▼
                                 [bind-w: year]
```

**Verdict:** `new Date()` is a 0-input transformation that produces a
reference-typed value. JEJ's guarantee that Date methods return
primitives and Date is never mutated means the Date value acts as "a
primitive with methods." The DAG flow treats it like a primitive —
clean.

**Subtle fact worth rendering at L4:** two binding-reads of `now`
point to the SAME object (reference equality). For primitive bindings,
two reads create two nodes with value-equal-but-independent provenance.
For reference bindings, two reads are the same identity. Possible UI
distinction: solid arrow for reference-read, dashed for value-copy.
Rendering concern, not model concern.

### Stress 11 — Template literals: multi-input transformations

Program: `` const msg = `hi ${name}, you are ${age}`; ``

```text
  [lit] 'hi '    [bind-r: name]    [lit] ', you are '    [bind-r: age]    [lit] ''
       │               │                  │                     │             │
       │               ▼                  │                     ▼             │
       │           :coerce                │                 :coerce           │
       │           (→ string)             │                 (→ string)        │
       │               │                  │                     │             │
       └───────┬───────┴────────┬─────────┴──────────┬──────────┴─────────┬───┘
               │                │                    │                    │
               └────────────────┴─── template:transform ──────────────────┘
                                            │
                                'hi Alice, you are 30'
                                            │
                                            ▼
                                      [bind-w: msg]
```

**Verdict:** N+1 static parts + N interpolations → 1 string. Fits
multi-input transformation cleanly. Each interpolation fires implicit
`:coerce` to string (also L3). Visually dense at high N — candidate
for a "collapse template internals" UI affordance at L3.

### Stress 12 — Compound: loop containing conditional

Program:

```js
for (let i = 0; i < 3; i++) {
  if (i % 2 === 0) alert('even: ' + i);
  else alert('odd: ' + i);
}
```

```text
  LOOP (N=3)
    │
    ├─ iter 1 (i=0) ─► CONDITIONAL ─► truthy sub-DAG ─► alert('even: 0')
    │
    ├─ iter 2 (i=1) ─► CONDITIONAL ─► falsy sub-DAG  ─► alert('odd: 1')
    │
    └─ iter 3 (i=2) ─► CONDITIONAL ─► truthy sub-DAG ─► alert('even: 2')
```

**Verdict:** Stress 5 (loop) wrapping Snippet C (conditional). Each
iteration selects one of two sub-DAGs. Unrolled: N × 2 potential, M
× 1 materialized. UI strategies compose — loop roll-up from Stress 5
plus a per-iteration "branch decision log" ("iter 1: even, iter 2:
odd, iter 3: even"). No new model mechanism; affordances compose.

### Stress 13 — `??` nullish coalescing

Program: `const name = input ?? 'anonymous';`

**Verdict:** same pattern as `&&` / `||` (Stress 4). Conditional
2nd-input activation — RHS is a source ONLY if LHS is nullish. No
new mechanism; variant of short-circuit. (Similarly for `?.` optional
chaining — skipped if LHS is nullish.)

### Stress 15 — Statement sequencing without data-flow coupling

Program:

```js
const x = 5;
const y = 10;
alert(x);
alert(y);
```

The DAG at L1–L4 shows two independent sub-DAGs — no shared edges:

```text
  sub-DAG A:  [lit] 5  ──► [bind-w: x] ── portal ── [bind-r: x]
                                                         │
                                                      alert:call ──╎──► [io-out: 5]

  sub-DAG B:  [lit] 10 ──► [bind-w: y] ── portal ── [bind-r: y]
                                                         │
                                                      alert:call ──╎──► [io-out: 10]
```

At L1–L4 the sub-DAGs are only **partially ordered** — by data
dependency. Sub-DAG A has no data edge to sub-DAG B, so a rendering
could show them in any order, or side-by-side.

At **L5b** (control-flow meta-structure), the learner sees the
**statement sequence** that pins the total order:

```text
  sub-DAG A ──(stmt-sequence)──► sub-DAG B
```

**Verdict — genuinely new observation:** L5b's scope is broader than
"branching + looping." It's ALL statement-level sequencing, including
linear statement order between otherwise-independent sub-DAGs. Prior
to L5b, the DAG is only PARTIALLY ordered (by data dependencies). At
L5b, it becomes TOTALLY ordered (by statement sequence). This subtly
reshapes what L5b does.

### Summary (updated)

| Stress | Model verdict |
| --- | --- |
| 1. Literal duplicates | Handled; helps teach value vs node identity |
| 2. Compound assignment | Handled via tracer's access/update split |
| 3. Multiple writes | Requires versioning (SSA-like); well-studied |
| 4. Short-circuit (`&&`) | Sub-expression control flow; fits framing |
| 5. Loop scale | Model fine; needs UI roll-up strategies |
| 6. I/O effects | Partial; dashed effect-edges across boundary |
| 7. Errors | Truncated transformations; downstream greyed |
| 8. Proto/scope lookups | Clean sidecars |
| 9. Regex literals | Reference-valued sources; `.test()` via L6 sidecar |
| 10. `new Date()` | Works as "primitive with methods" — JEJ's guarantee; reference vs value rendering at L4 is a UI concern |
| 11. Templates (N+1→1) | Fits multi-input; visually dense at high N |
| 12. Compound (loop+if) | Affordances from Stress 4+5 compose |
| 13. `??` nullish | Variant of short-circuit; no new mechanism |
| 15. Stmt sequencing | **Expands L5b's scope** — includes linear order, not just branching/looping |

**Overall:** the DAG foundation holds across every stress test. A handful
require extensions (binding versioning, loop roll-up, reference-vs-value
rendering, effect edges, sidecar annotations), all standard for
data-flow representations. **One stress test genuinely reshaped the
model**: Stress 15 widens L5b's scope from "branching + looping" to
"all statement-level sequencing, including linear order between
independent sub-DAGs."

### Remaining probes (lower priority)

- `in` operator — likely fits as a 2→1 transformation with a L6
  property-lookup coupling.
- Labeled `break` / `continue` — does JEJ allow labels?
- Error mid-template-interpolation (one interpolation throws) —
  truncated transformation mid-compound-edge.
- Regex with `/g` flag (stateful `lastIndex`) — needs intra-object
  time-portal if in JEJ scope.
- `typeof` operator on uninitialized binding (returns `'undefined'`
  without throwing, unlike access) — asymmetric behavior, may deserve
  its own rendering rule.

---

## Diagram 0c — Stress-test sketch of the refined Step model

Three snippets that exercise the current Step model and stream shape.
Each shows: source → step stream yields → selected live-step events
→ what's stress-tested.

### Snippet A — `let x = 5;`

**Source:**

```js
let x = 5;
```

**Step stream** (outer yields, in order):

```text
1. { step: ScopeStep(create, script),
     envDiff: { scopesEntered: [script], bindingChanges: [
       { scope: script, name: 'x', transition: 'tdz-to-declared' }
     ] } }
   events[]: [scope-create(script), binding-declare(x, let)]
   hoistedBindings: [{ name: 'x', kind: 'let', declaredAt: <VarDecl> }]

2. { step: StatementStep(enter, VariableDeclaration),
     envDiff: {} }
   events[]: [enter-stmt(VarDecl)]

3. { step: InitializationStep,
     envDiff: { bindingChanges: [
       { scope: script, name: 'x', transition: 'tdz-to-initialized',
         newValue: 5, version: 1 }
     ] } }
   bindingName: 'x', bindingKind: 'let'
   initializer: { form: 'inline-source',
                  source: { sourceKind: 'literal', value: 5 } }
   initialValue: 5
   events[]: [resolve(5), binding-initialize(x, 5), binding-available(x)]

4. { step: StatementStep(exit, VariableDeclaration, exitReason: 'normal'),
     envDiff: {} }

5. { step: ScopeStep(leave, script),
     envDiff: { scopesLeft: [script] } }
```

**Stress-checked:**

- ScopeStep(create) carrying hoist events.
- InitializationStep as the visible step on `let x = 5;` (declare
  already done under ScopeStep).
- Inline source for simple literal RHS.
- envDiff captures TDZ → initialized transition cleanly.

### Snippet B — `alert(prompt('n') + '!');`

Critical stress: real-time I/O (learner must see the prompt dialog
BEFORE the user responds).

**Step stream:**

```text
1. ScopeStep(create, script) — no hoisted bindings
2. StatementStep(enter, ExpressionStatement)

3. DataStep (prompt call):
     transformKind: 'call', callee: { name: 'prompt', nodePath: ... }
     sources: [
       { sourceKind: 'register-read', value: ƒ prompt,
         nodePath: <Id 'prompt'> },
       { sourceKind: 'literal', value: 'n', nodePath: <Literal 'n'> }
     ]
     outputValue: 'Alice' (after user responds)
     destinations: [{ destKind: 'feeds-next-step', consumerStepIndex: 4 }]

   LIVE events[] as they arrive (within step 3's inner stream):
     (i)   enter-expr(CallExpression, prompt)
     (ii)  identifiers.read(prompt), register-check, resolve(ƒ)
     (iii) resolve('n')
     (iv)  call(prompt, args: ['n'])
     (v)   io.user.output { fn: 'prompt', message: 'n' }
           ← LEARNER SEES DIALOG HERE; .done is NOT resolved yet
     (vi)  (tracer pauses; user types)
     (vii) io.user.input { fn: 'prompt', value: 'Alice' }
     (viii) exit-expr(prompt, value: 'Alice')
   .done resolves with the finalized DataStep.

4. DataStep (+ concat):
     transformKind: 'operator', operator: '+'
     sources: [
       { producingStepIndex: 3, value: 'Alice' },
       { sourceKind: 'literal', value: '!' }
     ]
     coercions: []  (both strings, no coercion)
     outputValue: 'Alice!'
     destinations: [{ destKind: 'feeds-next-step', consumerStepIndex: 5 }]

5. DataStep (alert call):
     transformKind: 'call', callee: 'alert'
     sources: [
       { sourceKind: 'register-read', value: ƒ alert },
       { producingStepIndex: 4, value: 'Alice!' }
     ]
     outputValue: undefined
     destinations: [
       { destKind: 'io-emit', channel: { channel: 'user', method: 'alert' } },
       { destKind: 'sink' }
     ]

6. StatementStep(exit)
7. ScopeStep(leave)
```

**Stress-checked:**

- **Real-time I/O visibility**: `io.user.output` fires as an event
  on the LiveStep's inner stream BEFORE `.done` resolves. Consumer
  can render "prompt dialog showing 'n'" between events (v) and
  (vii).
- **Sub-expression chaining**: DataStep 3's output feeds DataStep 4
  via `{ destKind: 'feeds-next-step', consumerStepIndex: 4 }` +
  DataStep 4's source with `producingStepIndex: 3`. Two-way link.
- **Multi-destination on a call**: `alert` both emits to I/O and
  returns `undefined` → two entries in `destinations[]`.
- **Register-read sources**: function-valued identifiers (`prompt`,
  `alert`) read from the global register as sources.

### Snippet C — `if (x > 0) { let y = x * 2; }` (assuming `x` pre-initialized)

**Step stream (selected yields):**

```text
1. StatementStep(enter, IfStatement)

2. DataStep (test `x > 0`):
     transformKind: 'operator', operator: '>'
     sources: [
       { sourceKind: 'binding-read', value: <x's value>,
         producingStepIndex: <wherever x was last written> },
       { sourceKind: 'literal', value: 0 }
     ]
     outputValue: true
     destinations: [{ destKind: 'feeds-next-step' }]

3. ControlFlowStep (flowKind: 'conditional-test', decision: 'truthy',
                    testValueId: <from step 2's outputValueId>)

4. ControlFlowStep (flowKind: 'branch-entry')

5. ScopeStep(create, block) — if-body scope
     hoistedBindings: [{ name: 'y', kind: 'let', declaredAt: <VarDecl> }]

6. StatementStep(enter, VariableDeclaration for y)

7. DataStep (`x * 2`):
     sources: [
       { sourceKind: 'binding-read', value: <x's value>,
         producingStepIndex: <last write> },
       { sourceKind: 'literal', value: 2 }
     ]
     outputValue: <computed>
     destinations: [{ destKind: 'feeds-next-step', consumerStepIndex: 8 }]

8. InitializationStep:
     bindingName: 'y'
     initializer: { form: 'from-step', stepIndex: 7,
                    valueId: <step 7 outputValueId> }
     initialValue: <computed>

9. StatementStep(exit, VariableDeclaration)
10. ScopeStep(leave, block) — if-body scope ends
11. StatementStep(exit, IfStatement)
```

**Stress-checked:**

- Nested scopes: script scope (outer) + if-body block scope (inner).
- Control flow represented as two ControlFlowSteps (test → branch).
- InitializationStep with complex RHS via `from-step` reference.
- ScopeStep(create) for the if-body carries its hoisted `y` binding.

### Insights from the stress-test sketch

**Design holds:**

1. **Visible-syntax principle.** Each step corresponds to a
   syntactic construct the learner can point at.
2. **Real-time I/O works.** The LiveStep inner event stream + `.done`
   pattern supports prompt-dialog-visible-before-response.
3. **Sub-expression chaining via indices** is ergonomic for the
   sketched cases.
4. **envDiff granularity feels right.** Reads produce empty diffs;
   writes produce targeted ones.
5. **The `{ step, envDiff }` yield is enough** — consumer can derive
   anything else from `step.dagNodePath → ast` lookups.

**Gaps / questions surfaced:**

1. **Compound assignment (`x += 1`) as a DataStep.** Not sketched.
   The step would have sources including a binding-read of x AND
   destinations including a binding-write to x. The `producingStepIndex`
   for the read, and the `latest-write-step` tracking for future reads,
   both need updating within one step. Feasible but subtle; worth a
   dedicated stress test later.
2. **Step count is substantial.** Snippet B produces 7 steps for one
   line. Manageable but not trivial. Consumer may want a
   "filter-to-interesting-steps" pattern (and can implement it
   themselves via `dagRole` / step kind filters).
3. **`binding-read` source's `producingStepIndex`** requires the NM
   layer to maintain `Map<(scope, name), latest-write-step>` during
   streaming. Confirmed feasible (one of NM-layer's enumerated
   responsibilities) but adds state-tracking work per read.
4. **Initial environment pre-hoisted globals** (Math, String, etc.)
   aren't initialized by any user step — they're part of the initial
   environment setup. Reads of `Math.PI`, `prompt`, etc. have NO
   `producingStepIndex` (value predates all steps). Source field
   should allow `producingStepIndex` to be undefined / null to
   represent this; the pure provenance walk terminates when it
   reaches a source without producingStepIndex.

---

## Adversarial review — status summary

Four agents ran in parallel: JS spec language lawyer, tracer
implementation engineer, pedagogy researcher, curriculum designer.
Detailed findings have been folded into corrective edits and the
Decisions list. Status summary:

**Corrected in canvas:** R6 identity split; "tracer ALREADY produces
DAG" overstatement revised to "specced to produce"; R10 coercion
ToPrimitive hint note (JEJ-scope only); 3×2 grid IDENTITY bullet
split into assignment-vs-declaration; Stress 11 templates rephrased
as compound sub-structure (decided).

**Decisions made (see Decisions list):** layer = palette; river
metaphor dropped; coercion framing spec-aligned; error shape split;
tracer docs/types authoritative; JEJ reference-type scope; learner
vocabulary deferred; enrichment = AsyncIterable<LiveStep>; caching
= recompute; static-DAG build in wrapper; env reconstruction =
consumer; step types confirmed (Data / Declaration / ForInit /
Template / Statement / ControlFlow / Scope / Error); entwinement
full; AST↔staticDAG collapse; LiveStep mutation in-place; binding-
read provenance tracked; nested break cascades.

**Deferred (prose-polish pass before impl):** R5 evaluation order
phrasing, TDZ/typeof asymmetry, scope-walk framing, `==` specials,
for-of code-point vs code-unit, increment pre/post semantics,
register-vs-prototype at parse.

**Scope clarification (curriculum agent):** this proposal is a
**tool for capturing and representing static + execution evaluation**
— not a curriculum. Strategy / correctness / debugging / style /
abstraction / algorithmic intent require complementary artifacts
built as later layers on top. Acknowledged in Diagram 0's scope
statement.

---

## Walkthrough alignment check

Reading [`tracer.walkthroughs.md`](../../tracer.walkthroughs.md)
against the DAG model — does the tracer's specified event vocabulary
support what the DAG needs?

**Strong alignment (event model supports DAG as specified):**

- **Coercion as standalone events** between operand resolve and
  operator apply: `coerce(0 → false, context: boolean)`,
  `coerce(1 → '1', context: string-concatenation)`. Directly supports
  L3 rendering and decided coercion framing.
- **Identifier-read + binding-access as dual events** —
  `identifiers.read(x)` (visual syntax) fires alongside
  `binding-access(x, value: 5)` (behind-the-scenes). Matches the 3×2
  grid's syntax-vs-event split perfectly.
- **Scope-chain walks as per-step events**:
  `scope-check(script, hit: x)`; failed lookup chain ends
  `scope-check(global, miss) → ReferenceError`. R8 can render each
  walk step directly.
- **Prototype-chain walks as per-step events**:
  `proto-check(value: 'hello', miss) → proto-check(String.prototype, hit: toUpperCase)`.
  R9 maps 1:1.
- **Assignment as operator + update**: `operator(=, target: x)` and
  `binding-update(x, value: 6)` fire as distinct events. Confirms the
  R6 fix (assignment IS a transformation that fires an operator event).
- **Compound assignment**: reads LHS → resolves RHS → operator →
  update, all as separate events. R5 / R7 interaction matches.
- **Per-iteration block scopes in loops**: `scope-create(block) → ... → scope-leave(block)`
  fires per iteration. Loop template + dynamic realization both
  expressible.
- **Short-circuit marks the skip**:
  `operator(&&, shortCircuited: true, left: 0)` with RHS never
  evaluated. R3 renderable directly.
- **Errors as terminal events** with
  `phase: 'creation' | 'execution'`. R4a / R4b map directly.

**Alignment issues to address in proposal text (minor):**

- **Templates render as three events** (`template-begin`,
  `template-evaluation` per interpolation, `template-end`) with
  coercions interspersed. Stress 11's "single multi-input
  `template:transform` node" oversimplifies. Fix: model templates as
  a compound sub-structure with begin/evaluations/end, not a single
  transformation edge.
- **Increment postfix vs prefix**: `x++` exits with OLD value;
  `++x` with NEW value. Both fire `binding-update`. R5's
  terminal-value concept needs this distinction in UpdateExpression
  handling.
- **Assignment fires `identifiers.read` for the TARGET identifier
  too**: `x = 5` has `identifiers.read(x)` at RHS evaluation AND at
  write-target resolution. Two separate events on the same binding
  name within one statement. R5 / R7 interaction needs to account.

**Verdict**: the tracer event model supports the DAG representation.
No new events required for the core DAG. The three alignment issues
above are proposal-text fixes, not tracer-spec changes.

---

## Future work: NM-enrichment layer on top of the tracer

**Key realization from tracer.md + tracer.architecture.md:** the
tracer already returns an **entwined result** — an ordered event
stream bidirectionally linked to a frozen AST:

- `events[]` — chronological. Each event has `.node` pointing to its
  AST node, plus scalar fields (`step`, `semantics`, `nodePath`,
  `loc`, `type`, `source`).
- `ast: Record<nodePath, ASTNode>` — full program structure. Every
  ASTNode has `.events[]` (reverse lookup, chronological),
  `.visits`, `.parent`, ESTree children (`.left`, `.right`, `.body`,
  etc.), and scalar metadata.
- The AST is **always full** — `config.range` filters events but
  never the AST.

This means a **NM-enrichment layer** (not thin — see responsibilities below) can sit on top of the
tracer and stream enriched events, each carrying full NM context.
The wrapper doesn't re-trace; it projects the tracer's entwined
output into DAG-NM vocabulary.

### Per-event enrichment

For each streamed raw event, the wrapper attaches:

- **AST context** — the event's `.node`, plus convenience walks
  (parent chain, siblings-on-same-node via `node.events[]`, enclosing
  statement, enclosing scope).
- **DAG role classification** — source / transformation / destination
  / sidecar, derived from `semantics` + JejTag metadata (operator,
  literalKind, accessKind, bindingKind, etc.).
- **Environment snapshot at this step** — incrementally maintained as
  events stream; diff since previous step; TDZ state per binding;
  active scope stack.
- **Static DAG position** — the AST subtree rooted at the event's
  node, identified as part of a specific expression-DAG, statement,
  or control-flow sub-DAG.
- **Source span** — `node.loc` + `node.source` (already on the
  event, but surfaced as part of the enrichment contract).
- **Provenance pointers** — `valueId` and `sourceValueIds` (once the
  tracer emits them), used to reconstruct the DAG backbone.

A consumer subscribes to the enriched stream and gets everything
needed to render any view (DAG, trace table, scope movie, I/O log,
coverage map) without manually walking the AST or reconstructing
environment state.

### Core principle: the NM layer is the syntax ↔ semantics bridge

Each NM step corresponds to a **visible syntactic unit** in the
learner's code. The step's outer shape carries syntax (via the AST
reference); its inner shape carries semantics (values, env diffs,
provenance). From a single step a consumer can fully reconstruct
both.

Behind-the-scenes NM events (coercion, scope create/enter/leave,
binding declare/initialize/available/update) are NOT their own
steps — they're **metadata** on the step corresponding to the
enclosing syntactic unit. Coercion rides inside the consuming
operator step; scope transitions ride inside the statement or
declaration or control-flow step that introduces the scope.

This principle drives several decisions above:

- ScopeStep doesn't exist (no visible syntactic unit for "a scope
  transition"); `scopeTransitions?: ScopeTransition[]` rides as
  metadata.
- Coercion is a sub-structure on the operator DataStep, not a
  separate step.
- Short-circuit doesn't emit a marker step — the transformation
  step carries `shortCircuited: { ... }`.
- InitializationStep exists because `let y = 5;` IS a visible
  syntactic unit with its own distinct shape.

It also drives the entwinement shape: every step references its
AST node (dagNodePath); every AST node back-references the steps
that touched it; both back-reference raw events. **Data lookups,
no logic.**

### Data structure lifecycle

Per your framing: pass in code; immediately get `source`, `ast`
(tagged), and `initialEnvironment` as properties; the trace is a
stream of LiveSteps; the finalized result resolves at the end.

**Immediate / synchronous** (computed on construction from parse +
validate + instrumentation):

- `source: string` — the input code verbatim.
- `ast: Record<nodePath, ASTNode & { dagRole, dagKind }> | null` —
  (NB: `dagRole` / `dagKind` are DERIVED from `node.type` + JejTag by
  the NM layer's construction phase — a Literal is always a source, a
  BinaryExpression is always a transformation, etc. Stored as tags so
  consumers don't reimplement the derivation; the rules live in one
  place in the NM layer.)
  null iff a creation-phase error. Otherwise the full AST with
  NM-role tags per node. The AST IS the AST — traverse
  parent/children for syntax tree view, read dagRole per node for
  data-flow view. `events[]` / `visits` / `stepIndices` populate
  incrementally as the stream runs.
- `initialEnvironment: Environment | null` — scope tree with all
  declared bindings in TDZ plus the fixed global scope populated.
  Null iff R4a error.
- `creationError: CreationError | null` — R4a failures
  (parse / JEJ validation / instrumentation). If present,
  `ast` and `initialEnvironment` are null and the step stream is
  empty.

**Streamed** (during execution):

`steps: AsyncIterable<LiveStep>` — stream of LiveSteps, emitted on
step start. Each LiveStep:

- Carries the step's type-specific fields, mutated as events arrive
  (sources[] grows, outputValue gets set, envDiff accumulates).
- Exposes `events: AsyncIterable<TraceEvent>` — the inner pull-based
  stream of raw tracer events belonging to this step.
- Resolves `done: Promise<Step>` on step completion with the
  finalized (frozen) step shape.

Breaking out of the outer iterator auto-cancels the session and
terminates all live-step inner streams.

**Resolved / final** (after the stream completes):

`complete(): Promise<NMTraceResult>` where NMTraceResult carries:

- `ok: boolean` — true if execution finished without error.
- `ast: Record<nodePath, ASTNode>` — the fully entwined AST as
  returned by the tracer, with `.events[]` populated per node, NM
  role tags attached, `.visits` counts. Raw events reachable via
  `ast[path].events`.
- `steps: Step[]` — NM-level execution-step sequence; each step is
  either a data step (source → transformation → destination) or a
  control-flow step. Fully entwined with the AST by nodePath.
  See Step type in Rough types below.
- `finalEnvironment: Environment` — env state at exit.
- `coverage: Set<nodePath>` — AST nodes realized (derivable
  from `ast[path].visits > 0`, surfaced as a convenience).
- `error?: R4bError | 'timeout' | 'iteration-limit' | 'cancelled'`
  — populated if `ok === false`.

### Rough types (placeholder)

```ts
interface NMSession {
  // --- Immediate / eager (available synchronously after `nm(source)`) ---
  readonly source: string
  // The AST IS the AST. Nodes carry NM role tags; traversed as
  // a syntax tree, it's an AST; traversed as source→transformation→
  // destination, it's the AST. Same data, two lenses.
  readonly ast: Record<nodePath, ASTNode & {
    dagRole: 'source' | 'transformation' | 'destination' | 'sidecar' | null
    dagKind?: string
  }> | null                                       // null iff creationError
                                                  // .events[] / .visits / .stepIndices
                                                  //   populate incrementally as stream runs
  readonly initialEnvironment: Environment | null // null iff creationError
  readonly creationError: CreationError | null    // R4a (parse / validate / instrument)

  // --- Streaming ---
  readonly steps: AsyncIterable<StreamYield>      // yields { step: LiveStep, envDiff, ... } on step START

  // --- Resolution / control ---
  complete(): Promise<NMTraceResult>              // resolves after stream completes
  cancel(): void                                  // auto-called on iterator break
}

// Config passed to `nm(source, config)`.
// Options are SYNTAX-VISIBLE elements (things the learner can point
// at in code). The NM wrapper translates each option to the set of
// semantic tracer gates it needs to build that step's sub-stream.
// E.g., `operators: true` → every operator step's events[] includes
// its coercion events; `assignments: true` → every assignment step's
// events[] includes binding-update. Consumer specifies WHAT to see
// in code; wrapper handles WHICH tracer gates to enable.
type NMConfig = {
  options?: {
    // Each field: boolean (true = full; false = off) OR nested object
    // for selective enablement. Tracer-config-style shorthand + nested
    // object, syntax-based not semantics-based.

    variables?: boolean | {
      declare?: boolean                            // hoist moment at scope create
      initialize?: boolean                         // `let y = 5;` visible init
      update?: boolean                             // `x = 10;` reassignment
      read?: boolean                               // identifier evaluation
      filter?: string[]                            // only named bindings
      // NB: 'available' (TDZ-exit semantic event) is NOT here — it's
      //   not syntax-visible; sits in the semantic-event layer under
      //   `initialize`'s events[].
    }

    operators?: boolean | {
      arithmetic?: boolean                         // +, -, *, /, %, **
      comparison?: boolean                         // <, >, <=, >=, ==, ===, !=, !==
      logical?: boolean                            // &&, ||, ??
      assignment?: boolean                         // =, +=, ??=, etc.
      increment?: boolean                          // ++, --
      typeof?: boolean
      negation?: boolean                           // !, ~, unary -
      in?: boolean                                 // `in` operator
      conditional?: boolean                        // ternary ?:
      filter?: string[]                            // only named operators
    }

    calls?: boolean | {
      function?: boolean                           // bare `foo(args)`
      method?: boolean                             // `obj.method(args)`
      ctor?: boolean                               // `new Date()` (sole in JEJ)
      filter?: string[]                            // only named callees
    }

    propertyAccess?: boolean | {
      dot?: boolean                                // `obj.prop`
      bracket?: boolean                            // `obj[key]`
      optionalChaining?: boolean                   // `obj?.prop`
      filter?: string[]                            // only named properties
    }

    loops?: boolean | {
      while?: boolean
      doWhile?: boolean
      for?: boolean
      forOf?: boolean
    }

    conditionals?: boolean | { if?: boolean, ternary?: boolean }

    breakContinue?: boolean
    literals?: boolean | { string?: boolean, number?: boolean,
                           boolean?: boolean, null?: boolean,
                           undefined?: boolean, bigint?: boolean,
                           regex?: boolean }
    templates?: boolean                            // template literals
    scopes?: boolean                               // scope create/leave at block boundaries
    errors?: boolean                               // runtime errors (R4b)
    io?: boolean | {
      console?: boolean                            // console.* (dev channel)
      user?: boolean                               // alert / prompt / confirm
    }

    // Layer gate (two-level model):
    // If `semanticEvents: false`, NM emits top-layer steps only; each
    // step's `.events[]` and the AST's entwined events are NOT
    // populated. Saves space/time for coarse-navigation consumers.
    // If `semanticEvents: true` (default), full entwinement.
    semanticEvents?: boolean
  }

  // Tracer-level passthrough:
  seconds?: number                                 // timeout; default 5
  iterations?: number                              // loop guard
  range?: { start: SourceLocation, end: SourceLocation }
                                                   // affects both events and step emission;
                                                   //   AST stays full regardless
}
// NM wrapper's responsibility: from these options, compute the
// TraceConfig.options subset that will deliver all semantic events
// needed to populate each step's events[]. Tracer-style shorthand
// expansion applies — e.g., `variables: true` → full nested object
// with all sub-fields true.

// A LiveStep is emitted when the step STARTS (first event fires) and
// its internal state accumulates as subsequent events arrive. Inner
// async-iterable `events` streams raw tracer events for this step;
// `done` resolves when the step completes. Consumer renders skeleton
// on emit, updates as events arrive, finalizes on done. Supports
// real-time visualizations (e.g., "prompt dialog shown" BEFORE the
// user response arrives).
interface LiveStep {
  // step-kind fields (the Step union) — mutated as events arrive
  kind: Step['kind']
  dagNodePath: nodePath
  startedAt: number                    // step index in the final steps[]
  completed: boolean
  // step type-specific fields:
  // (all fields from DataStep / InitializationStep / StatementStep /
  // ControlFlowStep / ScopeStep / ErrorStep — starts sparse, fills
  // as events come in)

  // per-step event subscription (async iterator only; no callback
  // API — supporting two interfaces doubles surface area without
  // clear consumer advantage):
  events: AsyncIterable<TraceEvent>    // consumer pulls events for this step

  // completion:
  done: Promise<Step>                  // resolves with FINALIZED immutable step
                                       //   when the step is complete
}

// The outer stream yields objects shaped like this, NOT bare Steps:
type StreamYield = {
  step: LiveStep
  envDiff: EnvDiff                     // diff from preceding step's env
                                       //   (accumulated from this step's events)
  // TBD: what else belongs here? Probably some step-context metadata
  //   (covering-scope, containing-statement), TBD during impl.
}

// NB: no envAt / eventsOn / provenance helpers — wrapper is pure
// functions for now. Consumers reconstruct env state from the
// initial environment + envDiffs they observe. Caching is a future
// concern (inputs can be interactive, so caching is non-trivial).

type NMTraceResult = {
  ok: boolean
  // The AST is the AST. Traverse parent/child for the syntax
  // tree view; read dagRole / dagKind per node for the data-flow view.
  // Fully entwined: events per node, visits, step-indices per node.
  ast: Record<nodePath, ASTNode & {
    dagRole: 'source' | 'transformation' | 'destination' | 'sidecar' | null
    dagKind?: string
    events: TraceEvent[]            // existing: raw events on this node
    visits: number                  // existing: visit count
    stepIndices: number[]           // NM-added: steps touching this node
  }>
  steps: Step[]                     // NM execution stream (the trace, at NM level)
  initialEnvironment: Environment
  finalEnvironment: Environment
  coverage: Set<nodePath>           // nodes with visits > 0; derivable from ast
  error?: {                         // unified error shape (decided: same union type)
    phase: 'execution'
    name: 'ReferenceError' | 'TypeError' | 'RangeError'
    message: string
  } | 'timeout' | 'iteration-limit' | 'cancelled'
}

// Full entwinement cross-references (available eagerly where
// possible; populated as the stream runs):
//
//   source ─→ ast (parse + tag with dagRole / dagKind)
//                  ↑
//                  │ ast[path].events = TraceEvent[]         ← from tracer
//                  │ ast[path].stepIndices = step indices    ← NM added
//                  │ ast[path].visits = visit count          ← from tracer
//                  │
//   steps ─→ step.dagNodePath → ast lookup
//         → step.events[] ⊆ ast[path].events
//         → step.sources[i].producingStepIndex → steps[i]
//         → step.destinations[i].consumerStepIndex → steps[i]
//
// Consumer can start from ANY of {source, ast node, step, event}
// and reach the others via one-step lookups. No logic to implement
// — just documented lookup paths.

// Step model — v3. Principle: each Step corresponds to a
// VISIBLE SYNTACTIC UNIT in the learner's code. Behind-the-scenes
// NM events (coercion, scope lifecycle, binding lifecycle) are
// METADATA on the step corresponding to the enclosing syntax — not
// their own step types. The NM step stream IS the bridge between
// syntax and semantics: outer shape = syntax (AST reference),
// inner shape = semantics (values, env diffs, provenance).
//
// Step types map to visible syntactic units:
//   DataStep        → expressions with a transformation (operator, call, template)
//   InitializationStep → let/const declarations
//   StatementStep   → statement boundaries (enter/exit)
//   ControlFlowStep → if/while/for/for-of/do-while decision points + iteration boundaries
//   ErrorStep       → runtime errors (terminal for the sub-DAG)
//
// ScopeStep exists for scope create/leave at block boundaries and
// program start — these ARE visible syntactic units (a block's `{`,
// the top of the file, the start of a for-loop). Scope create
// bundles hoisting (binding-declare events for let/const in the
// scope) as its events. Scope enter/interrupt/completion transitions
// stay as metadata on adjacent steps (those aren't visible code
// moments).
type Step =
  | DataStep
  | InitializationStep
  | ForInitStep                        // for-loop init: `let i = 0` in `for (let i = 0; ...; ...)`
  | TemplateStep                       // template-begin / template-end brackets
  | StatementStep
  | ControlFlowStep
  | ScopeStep                          // create / leave at block boundaries
  | ErrorStep

type DataStep = {
  kind: 'data'
  dagNodePath: nodePath               // primary node — the transformation
  transformKind:
    | 'operator'                       // +, <, ===, typeof, !, ++, =, +=, ...
    | 'call'                           // function / method call
    | 'template'                       // template literal
    | 'coerce'                         // implicit type coercion (its own step
                                       //   per visibility preference — fires
                                       //   between operand resolve and operator
                                       //   apply at the middle/event layer)
  operator?: string                    // for transformKind: 'operator'
  callee?: { name: string, nodePath: nodePath }  // for 'call'
  coerceContext?: 'string-concatenation' | 'numeric' | 'boolean'
                | 'equality' | 'template' | 'explicit'   // for 'coerce'
  sources: SourceRef[]                 // inputs feeding this step
  outputValue: Value
  outputValueId?: number
  destinations: DestinationRef[]
  events: TraceEvent[]
  envDiff: EnvDiff
  // for short-circuit operators: RHS skipped entirely (no marker step):
  shortCircuited?: { skippedSide: 'rhs', skippedNodePath: nodePath }
}

type SourceRef = {
  nodePath: nodePath                   // AST node of the source
  sourceKind:
    | 'literal'                        // no producingStepIndex (primordial)
    | 'binding-read'                   // producingStepIndex = latest-write step
    | 'register-read'                  // no producingStepIndex (pre-hoisted global)
    | 'property-read'                  // producingStepIndex of the owning value's origin
    | 'io-in'                          // producingStepIndex = the input's producing step
  value: Value
  valueId?: number                     // from tracer's provenance (when available)
  producingStepIndex?: number          // undefined for 'primordial' sources
                                       //   (literals; pre-hoisted globals like Math, ƒ prompt)
}

type DestinationRef = {
  nodePath: nodePath                   // AST node of the destination (or sink marker)
  destKind:
    | 'binding-write'                  // store in a binding
    | 'io-emit'                        // cross program boundary (alert, console.*, etc.)
    | 'sink'                           // thin-air — produced but not captured
    | 'feeds-next-step'                // consumed by a subsequent DataStep
  target?: { name: string, scopePath: nodePath, version: number }   // binding-write
  channel?: { channel: 'dev' | 'user', method?: string }             // io-emit
  consumerStepIndex?: number           // feeds-next-step: which step consumes
}

type InitializationStep = {
  kind: 'initialization'               // the VISIBLE event on the `let y = 5;`
                                       //   line — binding moves from TDZ to its
                                       //   initial value. The declare/hoist event
                                       //   happened earlier under a ScopeStep.
  dagNodePath: nodePath                // VariableDeclaration node
  bindingName: string
  bindingKind: 'let' | 'const'
  initializer:
    | { form: 'inline-source', source: SourceRef }          // simple RHS
    | { form: 'from-step', stepIndex: number, valueId: number } // complex RHS
    | { form: 'uninitialized' }                             // `let x;` without init
  initialValue?: Value                 // present unless uninitialized
  events: TraceEvent[]                 // enter-stmt, RHS (if inline),
                                       //   binding-initialize, binding-available,
                                       //   exit-stmt. binding-declare is NOT here
                                       //   — it fires earlier under ScopeStep(create)
  envDiff: EnvDiff                     // { y: TDZ → value }
}

type StatementStep = {
  kind: 'statement'
  dagNodePath: nodePath                // statement AST node
  transition: 'enter' | 'exit'
  exitReason?: 'normal' | 'break' | 'continue' | 'error'
  events: TraceEvent[]
  envDiff: EnvDiff
  scopeTransitions?: ScopeTransition[] // metadata (e.g., BlockStatement creates a block scope on enter)
}

type ControlFlowStep = {
  kind: 'control-flow'
  dagNodePath: nodePath                // if / while / for / for-of / do-while
  flowKind:
    | 'conditional-test'
    | 'branch-entry'
    | 'loop-iteration-start'
    | 'loop-iteration-end'
    | 'loop-exit'
    | 'break'
    | 'continue'
  decision?: 'truthy' | 'falsy' | 'continue' | 'exit' | 'break'
  iteration?: number
  testValueId?: number                 // conditional-test: which value was tested
  events: TraceEvent[]
  envDiff: EnvDiff
  scopeTransitions?: ScopeTransition[] // metadata (e.g., per-iteration block-scope create/enter/leave)
}

type ForInitStep = {
  kind: 'for-init'
  dagNodePath: nodePath                // VariableDeclaration inside for()
  bindingName: string
  bindingKind: 'let' | 'const'
  initialValue: Value                  // always present — for-init is always initialized
  initialSource: SourceRef | { form: 'from-step', stepIndex: number, valueId: number }
  events: TraceEvent[]                 // binding-declare + binding-initialize + binding-available
  envDiff: EnvDiff                     // {i: TDZ → 0}
  // Distinct from InitializationStep because for-init has:
  //  - unique lifetime (tied to the loop's block scope)
  //  - per-iteration rebind semantics (ES2015 CreatePerIterationEnvironment)
  //  - interleaved with test/update phases of the loop
}

type TemplateStep = {
  kind: 'template'
  dagNodePath: nodePath                // TemplateLiteral node
  transition: 'begin' | 'end'
  // For 'begin':
  staticParts?: string[]               // the string chunks between interpolations
  expressionCount?: number             // how many ${...} interpolations expected
  // For 'end':
  interpolationStepIndices?: number[]  // step indices that produced each interpolation
                                       //   value (in order)
  outputValue?: string                 // the concatenated final string
  outputValueId?: number
  events: TraceEvent[]                 // template-begin OR template-evaluation +
                                       //   template-end; coercions ride here too
  envDiff: EnvDiff                     // empty
}
// Between the template's 'begin' and 'end' steps in the stream,
// each interpolation's sub-expression produces its own DataSteps
// (just like control-flow loop iterations produce their own steps
// between loop-iteration-start and loop-iteration-end). This keeps
// sub-expression DAGs as first-class steps rather than nested-inside
// a template step.

type ScopeStep = {
  kind: 'scope'
  dagNodePath: nodePath                // scope-bearing AST node (Program /
                                       //   BlockStatement / ForStatement body)
  scopeKind: 'script' | 'block'
  transition: 'create' | 'leave'       // only the boundary moments — enter /
                                       //   interrupt / completion stay as
                                       //   metadata on adjacent steps
  // For 'create' transitions: the hoisted bindings that entered TDZ
  // at this moment (one binding-declare event per hoisted binding):
  hoistedBindings?: Array<{
    name: string
    kind: 'let' | 'const'
    declaredAt: nodePath               // the VariableDeclaration node
  }>
  events: TraceEvent[]                 // scope-create + binding-declare's,
                                       //   OR scope-leave (+ completion / interrupt)
  envDiff: EnvDiff
}

type ErrorStep = {
  kind: 'error'
  dagNodePath: nodePath                // node where error occurred
  error: {
    name: 'ReferenceError' | 'TypeError' | 'RangeError'
    message: string
    phase: 'execution'                 // R4a static errors are on session.creationError
  }
  events: TraceEvent[]
}

// Non-boundary scope transitions (enter / interrupt / completion)
// ride as metadata on adjacent steps. Use ScopeStep for create/leave.
type ScopeTransition = {
  kind: 'enter' | 'interrupt' | 'completion'
  scopeNodePath: nodePath
  scopeKind: 'script' | 'block'
}

// NB: no EnrichedEvent type. The NM layer emits LiveSteps (not
// events). Each LiveStep exposes its raw tracer events via
// `step.events[]` (post-completion) or `step.events` AsyncIterable
// (during live progression). NM-level enrichment lives on the Step
// (dagRole / dagKind via ast tagging, envDiff, stepIndices), not on
// individual events.

// NB: no separate StaticDAG type. The tagged AST IS the AST.
// Derivations like "statement sequence" and "per-statement expression
// root" are queries over the AST (walk Program.body for statement
// sequence; each statement's .expression or initializer for expression
// root). No separate data needed.

type Environment = {
  globalScope: Scope
  scopes: Map<nodePath, Scope>
  activeScopeStack: Scope[]           // current lexical path during trace
}

type Scope = {
  kind: 'script' | 'block' | 'global'
  bindings: Map<string, Binding>
  parent: Scope | null
}

type Binding = {
  name: string
  kind: 'let' | 'const' | 'global'
  declaredAt: nodePath
  tdz: boolean
  value?: Value
  version: number
}

type EnvDiff = Partial<{
  scopesEntered: nodePath[]
  scopesLeft: nodePath[]
  bindingChanges: Array<{
    scope: nodePath
    name: string
    transition: 'tdz-to-initialized' | 'value-updated'
    newValue?: Value
    version: number
  }>
}>

type CreationError = {
  kind: 'parse' | 'validate' | 'instrument'
  message: string
  location?: SourceLocation
}
```

### Worked example — `console.log('hi');`

Steps produced (schematic, order preserved):

```text
1. StatementStep      { transition: 'enter', dagNodePath: <ExprStmt> }
2. DataStep           { transformKind: 'call',
                        callee: { name: 'console.log', ... },
                        sources: [
                          { sourceKind: 'binding-read',  value: <console register>,
                            nodePath: <Id 'console'> },
                          { sourceKind: 'property-read', value: <ƒ log>,
                            nodePath: <MemberExpr .log> },
                          { sourceKind: 'literal',       value: 'hi',
                            nodePath: <Literal 'hi'> }
                        ],
                        outputValue: undefined,
                        destinations: [
                          { destKind: 'io-emit',
                            channel: { channel: 'dev', method: 'log' },
                            nodePath: <CallExpr> },
                          { destKind: 'sink',
                            nodePath: <CallExpr> }   // undefined not captured
                        ],
                        events: [enter-expr, identifiers.read(console),
                                 scope-check, binding-access, resolve,
                                 property-dot, identifiers.read(log),
                                 register-check (or proto-check),
                                 resolve(ƒ log),
                                 resolve('hi'),
                                 call, io:dev, exit-expr, resolve(undefined)] }
3. StatementStep      { transition: 'exit', dagNodePath: <ExprStmt> }
```

One DataStep bundles all three sources (console, .log, 'hi'), the
call transform, and BOTH destinations (I/O emit + sink). The raw
events array collects all tracer events that belong to this step.
Alternative: split into multiple steps if a consumer-facing lens
wants finer granularity — this is a design question below.

### Lifecycle in one sentence

`nm(source, config)` synchronously parses + validates + tags the
AST with NM roles + sets up the initial environment, then returns a
session object with immediate properties (`source`, `ast`,
`initialEnvironment`) and a live async iterable (`steps`). Awaiting
`complete()` resolves to the finalized result with the full entwined
ast + steps + final environment + coverage.

### Relationship to the current tracer

The tracer (`lib/evaluating/trace/`) stays as-is: produces raw events
- entwined AST + visit counts. The NM layer has real responsibilities
on top (NOT a thin wrapper):

- **Construction-phase work**: parse + validate (reuse the tracer's
  pipeline), then compute dagRole / dagKind tags per AST node (derived
  from node.type + JejTag), set up the initial environment. Synchronous;
  completes before events start flowing.
- **Config translation**: map NMConfig's syntax-visible options to
  the exact TraceConfig gate subset that will deliver the events
  each enabled step-kind needs. Non-trivial.
- **Stream lifecycle**: subscribe to the tracer's event stream;
  aggregate events into LiveSteps (per step-kind completion rules);
  emit each LiveStep on its start event with inner-events iterator
  attached; mutate LiveStep as events arrive; resolve `.done` on the
  step's completion event.
- **EnvDiff computation per step**: maintain environment state
  incrementally as tracer events arrive; produce the diff for each
  emitted step.
- **Binding-write tracking**: maintain `latest-write-step` per
  binding so that future binding-reads can carry `producingStepIndex`
  without consumers having to reconstruct it.
- **Stream cleanup cascade**: on outer-iterator break or `cancel()`,
  terminate the tracer worker AND close all live-step inner
  iterators.
- **Finalization**: when the tracer's link() phase completes, freeze
  the steps array + tagged ast + visit counts into an NMTraceResult.
- **Pure provenance helper** (exported): a standalone function
  `provenance(steps, start, direction) → Step[]` for consumers who
  want the walk pre-built. Pure, no state.

The NM layer owns INTERPRETATION, STEP AGGREGATION, and ENV
TRACKING; the tracer owns EMISSION.

### Why this is the right shape

- **Stream + context** beats filter + reconstruct. Raw events can
  always be reconstructed by stripping enrichment; lens authors rarely
  need to go the other way.
- **Tracer stays focused.** Event emission concerns stay in the
  tracer; wrapper owns NM interpretation.
- **Pure functions for now.** Wrapper recomputes on each call;
  caching deferred (user input makes caching non-trivial).
- **Lens-author ergonomics.** Authors query nm-level concepts (source,
  transformation, binding-version) rather than raw tracer events.
  Drops the prerequisite that lens authors understand tracer internals.

### Adversarial review + stress tests of the data structure

**Calling out that this section is the AR, not the proposal.** The
Step type + NMTraceResult + Session shape above are first drafts.
Stress-tests below; design questions collected into the next section.

#### Stress 1 — Step granularity

A program like `let x = 1 + 2;` fires ~15 tracer events. How many
Steps should this produce?

- **1:1 with events** → 15 steps. Rejects the "step" abstraction;
  steps are just renamed events.
- **1 semantic step** → "let x = 1 + 2 executed." Loses the inner
  structure the DAG is supposed to surface.
- **Per s→t→d unit** → ~4 steps: "resolve 1," "resolve 2," "+ = 3,"
  "write x = 3." Sources-without-transformation (a bare `resolve(1)`)
  are awkward — they're sources, not s→t→d.
- **Per transformation or destination, with sources as sub-structure
  of their consuming step**: 2 steps — "compute 3 from 1+2" (step
  contains: operator event + operand resolves), "store 3 in x" (step
  contains: binding-initialize + binding-available events).

**Unresolved.** The proposal above hedges with `category: 'source'
| 'transformation' | 'destination'` which only works if EVERY source
produces its own step. That means `1 + 2` is 4 steps including two
standalone source-only steps. Is that what we want?

#### Stress 2 — Coercion placement

Coercion events fire between operand resolve and operator apply
(spec-aligned, decided). Is coercion its OWN DataStep, or nested as
an "internal event" of the consuming transformation step?

- Own step: pedagogically visible. `'5' + 1` is 5 steps: resolve('5'),
  resolve(1), **coerce(1 → '1')**, operator(+), produce('51').
- Nested: coercion is metadata on the transformation step.
  `'5' + 1` is 3 steps: resolve('5'), resolve(1), operator(+, with
  internalCoercion: {1 → '1'}).

**Unresolved.** Trade-off: visibility (own step) vs cleanliness (nested).

#### Stress 3 — Short-circuit — missing step or explicit "skipped"?

`a && b` with `a` falsy → b is never evaluated. The steps for this
expression:

- No step for b: steps are only for events that happened. Consumer
  sees "a evaluated, && decided falsy, no RHS."
- Explicit "skipped" step: ControlFlowStep with `flowKind: 'rhs-skipped'`
  and no events.

**Unresolved.** Explicit skipped-step helps visualization ("here's what
DIDN'T happen") but adds a step type. Consumers can infer skip from
the absence of a b-step via the AST.

#### Stress 4 — Loop iteration nesting

A for loop with 3 iterations: ~40 steps flat. How to distinguish
iteration 1 from iteration 2?

- **Flat steps with iteration markers**: ControlFlowStep
  `loop-iteration-start` / `loop-iteration-end` bracket each
  iteration. Consumer groups by brackets.
- **Nested steps**: loop step contains `iterations: Step[][]` — a
  sub-array per iteration.

**Unresolved.** Flat is simpler but consumer does the grouping.
Nested is structurally clearer but deviates from the "flat array"
pattern everywhere else.

#### Stress 5 — Template literals

Per the walkthroughs, templates produce begin / per-interpolation
eval / end events, with coercions interspersed. Is a template ONE
step or MANY?

- One step: "template literal produced 'hi Alice, you are 30'"
  with sub-evaluations in payload.
- Many: begin step, one eval step per interpolation (each possibly
  with coercion sub-step), end step.

**Unresolved.** Related to Stress 1 (granularity).

#### Stress 6 — Call sites: transformation AND destination

`console.log('hi')`: produces `undefined` return (transformation
output) AND emits 'hi' to dev console (destination effect).

- Category = 'transformation': misses the destination side.
- Category = 'destination': misses the return value.
- TWO steps for one call? Splits what's conceptually one action.
- Step with multi-category: `category: ('transformation' |
  'destination')[]`. Loses cleanliness.

**Unresolved.** The proposal's single-`category` field can't
represent this cleanly.

#### Stress 7 — Identifier reads for TARGETS

Per the walkthroughs, `x = 5` fires `identifiers.read(x)` twice —
once for RHS identifier use, once for LHS target resolution. Does
each read get its own step?

- Yes: two source-steps per assignment.
- No: target-identifier-read is absorbed into the destination step.

**Unresolved.** Consumer visibility vs step-count bloat.

#### Stress 8 — Creation error shape vs dynamic error shape

Creation errors: `nmSession.creationError` is populated; no stream,
no steps.
Dynamic errors: stream runs until error; `error` populates on
`NMTraceResult`.

- **Shape divergence**: CreationError has `{kind, message, location}`;
  dynamic error uses R4bError. Should they unify?
- **Step for dynamic errors**: an ErrorStep is emitted for R4b. For
  R4a, there's no stream at all — no steps.
- **Consumer branching**: consumer must check both
  `session.creationError` AND `result.error`. Asymmetric.

**Unresolved.** Could unify by: make `complete()` ALWAYS resolve
with an error field that covers both R4a and R4b. Then the session's
eager creationError is redundant.

#### Stress 9 — AST mutation vs parallel tags

`NMTraceResult.ast` is supposed to have NM-role tags on each
ASTNode. But the tracer's ast is FROZEN (deep-frozen per
tracer.architecture.md). You can't mutate to add tags.

- Option A: parallel `Map<nodePath, {dagRole, dagKind}>` as a
  sidecar. Consumer joins.
- Option B: wrapper builds its own copy of the ast structure with
  tags, before freeze. Duplicates memory.
- Option C: tracer's ast is wrapped in a Proxy that layers tags.
  Clever but opaque.

**Unresolved, but probably A.** Parallel map is simplest.

#### Stress 10 — Scope lifecycle: step or not?

`scope-create(script)`, `scope-enter(script)`, `scope-leave(script)`:
these are structural, not "things the program does."

- As ScopeStep: each lifecycle event is a step. Pedagogically makes
  scope visible.
- NOT as step: scope events are metadata on adjacent DataSteps /
  ControlFlowSteps.

**Unresolved.** Related to palette decision — scope lifecycle is one
palette element. When that element is enabled, should it surface as
steps OR as metadata on other steps?

#### Stress 11 — Stream backpressure / cancellation

`NMSession.events` is an AsyncIterable. Consumer pulls. If consumer
abandons iteration mid-stream:

- Tracer worker is paused on SAB; resources leaked unless
  `session.cancel()` is called.
- Does `for await (const e of session.events) break` trigger
  cleanup? (JavaScript's for-await-of calls `.return()` on the
  iterator on break — IF the iterator defines it.)

**Unresolved.** Cleanup semantics need to be well-defined for
correctness.

#### Stress 12 — Backward provenance without helper methods

Removed `provenance()` helper per "recompute / pure functions"
decision. Consumer needs to walk backward from a destination? They
write their own walk using `sourceValueIds` from DataSteps.

- Requires: DataStep carries `sourceValueIds`; consumer can index
  all steps by `producedValueId` and walk.
- **Question**: is this pure-functional walk ergonomic enough for
  lens authors, or should provenance be a pure helper function (not
  a cached method) exported from the NM layer?

#### Stress 13 — JEJ subset edge cases

Anything in JEJ that doesn't fit the Step model cleanly?

- **Regex literals** — sources. Fit.
- **`new Date()`** — transformation producing a reference value.
  Fits IF we treat Date as primitive-with-methods (JEJ's choice).
- **`typeof` on unbound** — returns `'undefined'` without throwing.
  Fit as a source step? Or own category?
- **`void x`** — evaluates x, discards, returns undefined. Data step
  with "discard" destination (sink)?
- **Comma operator `(a, b)`** — evaluates both, returns b. Two
  source/transformation steps; first is discarded.

Mostly fit. Minor edge cases.

#### Stress 14 — Range filtering

User comment: TBD. Range drops events but keeps full AST. Under
Steps:

- Steps are a projection of events. If events are filtered, some
  steps won't have their full raw-event coverage.
- Option: range affects events only; steps ALWAYS cover the full
  program. Consumers query range-aware via steps.
- Option: range affects both; partial steps have partial events[].

**Unresolved per user.** Design first.

#### Stress 15 — Coverage derivation

`coverage: Set<nodePath>` in NMTraceResult. Claim: derivable from
`ast[path].visits > 0`. TRUE if the tracer's visitCounts are
reliable. Per tracer.architecture.md: visitCounts bumped by the
Dispatcher, tied to resolve events. What about nodes that don't
produce resolves (e.g., statement containers)? Do they have visits?

Per walkthroughs, `enter-stmt(VariableDeclaration)` fires — the
statement node is visited. But does that bump visitCounts? Per
tracer.md `visits` = how many times a learner would "point at" the
syntax. So yes, should bump.

**Probably OK.** Verify against implementation when building.

#### Stress 16 — Circularity in the entwined AST

Per tracer.md: the entwined AST has cycles (`event.node.events[i].node === event.node`). `JSON.stringify` throws without a replacer.

- Consumer must know this when serializing (e.g., for snapshots).
- NM layer should document the cycle pattern and provide a
  `serializable()` helper? Or leave to consumer?

**Minor.** Documentation + convenience helper at most.

#### Summary of stress-test findings

No stress test breaks the foundation, but SEVERAL reveal real design
questions that need resolution before implementation:

1. Step granularity — Stress 1 (unresolved)
2. Coercion placement — Stress 2 (unresolved)
3. Short-circuit step — Stress 3 (unresolved)
4. Loop nesting — Stress 4 (unresolved)
5. Template granularity — Stress 5 (related to Stress 1)
6. Multi-category call steps — Stress 6 (unresolved)
7. Target-identifier reads — Stress 7 (unresolved)
8. Error shape unification — Stress 8 (worth unifying)
9. AST tag overlay — Stress 9 (likely parallel map)
10. Scope lifecycle as step — Stress 10 (related to palette)
11. Stream cleanup — Stress 11 (correctness concern)
12. Provenance walk ergonomics — Stress 12 (pure helper?)
13. JEJ edge cases — Stress 13 (minor)
14. Range filter — Stress 14 (TBD per user)
15. Coverage reliability — Stress 15 (probably OK)
16. Serialization — Stress 16 (minor)

---

## Consumer-pattern validation — high-level lens sketches

Three contrasting lens shapes to validate that the NM step tracer
API supports real pedagogical use cases. High-level only;
implementation details omitted. Purpose: expose API ergonomics
gaps before implementation.

### Lens 1 — Trace table (pull / post-hoc)

**Pedagogical use case:** classic trace-table exercise. Learner
sees a program, a blank table of (binding × step), fills in values,
submits, compares to reality.

**Consumption pattern:**

```text
const session = nm(sourceCode, { options: { bindings: true, statements: true } })
// session.ast and session.initialEnvironment available immediately
renderProgramWithEmptyTable(session.source, session.ast)

const result = await session.complete()
// result.steps is the full sequence; result.initialEnvironment gives
// row 0 state; each subsequent row is reconstructed by folding
// envDiffs from StatementSteps in order
renderFullTable(session, result)
```

**API features validated:**

- Immediate `ast` (the tagged AST) + `initialEnvironment`
  for pre-render.
- `complete()` for the full finalized result.
- `envDiff` chain on steps for row-by-row reconstruction.

**Gaps discovered:** none so far. Straightforward.

### Lens 2 — Live data-flow highlight (push / real-time)

**Pedagogical use case:** as the program executes, highlight the
current expression and show values flowing in real time. Critical
use case: `prompt('name')` dialog visible BEFORE user responds.

**Consumption pattern:**

```text
const session = nm(sourceCode, { options: { origination: true,
                                            transformations: true,
                                            bindings: true } })

for await (const liveStep of session.steps) {
  // On step start: render skeleton (e.g., highlight the node)
  highlightNode(liveStep.dagNodePath)

  // Subscribe to events within this step:
  for await (const event of liveStep.events) {
    // Update rendering as events arrive
    // For I/O: io.user.output shows "prompt dialog shown" BEFORE
    //   io.user.input (user response) arrives
    updateUI(liveStep, event)
  }

  // Finalize when step completes:
  const finalizedStep = await liveStep.done
  finalizeRender(finalizedStep)
}
```

**API features validated:**

- `session.steps` as AsyncIterable, yields LiveSteps on start.
- LiveStep.events inner AsyncIterable for incremental updates.
- LiveStep.done Promise for completion.
- Real-time visibility of I/O events BEFORE step completion
  (prompt dialog shown before response arrives).

**Gaps discovered:**

- LiveStep type has both the step's progressively-accumulating
  fields AND the inner streams — consumer uses both. Needs clear
  docs on mutation semantics (is the LiveStep object mutated as
  events fire, or is each step snapshot immutable?).
- Cleanup: if consumer breaks out of the outer loop AND the inner
  `for await` is mid-iteration on the last step — does auto-cancel
  cleanly kill both?

### Lens 3 — Backward provenance explorer (graph walk)

**Pedagogical use case:** learner points at an I/O output or final
binding value and asks "where did this come from?" Lens walks
backward through the DAG, highlighting each ancestor step.

**Consumption pattern:**

```text
const result = await session.complete()

// User clicks an I/O-out destination in the UI:
const clickedStep = result.steps[someIndex]  // has destinations: [{ destKind: 'io-emit', ... }]

// Walk backward via valueIds:
function walkBack(step) {
  const ancestors = []
  for (const source of step.sources) {
    if (source.producingStepIndex !== undefined) {
      const producer = result.steps[source.producingStepIndex]
      ancestors.push(producer)
      ancestors.push(...walkBack(producer))
    }
  }
  return ancestors
}

const lineage = walkBack(clickedStep)
highlightLineage(session, lineage)
```

**API features validated:**

- `producingStepIndex` on SourceRefs gives backward walk.
- `consumerStepIndex` on DestinationRefs would symmetrically give
  forward walk.
- Result's steps[] is a flat array; random access by index works.
- No helper needed for the walk (consumer writes it; decided).

**Gaps discovered:**

- When a source is `{ sourceKind: 'literal' }`, it has no
  producingStepIndex — the walk terminates. That's correct but
  consumer code needs to handle the undefined case.
- When a source is `{ sourceKind: 'binding-read' }`, the
  producingStepIndex should point to the InitializationStep or the
  previous DataStep that last wrote the binding. How does the NM
  layer determine that?

### Summary — does the API support real lenses?

Yes. Two non-trivial gaps identified (LiveStep mutation semantics;
binding-read provenance linking). Both are resolvable by design
clarification. Neither requires API shape changes.

---

## Open design thread — 2D config (syntax × DAG role)?

You flagged the possible argument for a 2D config system — syntax
options × (source | transformation | destination) — as opposed to
today's 1D syntax-visible-elements list. Lens scenarios to evaluate:

**Scenario A — "Show all variable interactions (reads + writes)."**

- 1D: `identifiers: true` + `declarations: true` + `assignments: true`
  catches it, but also includes non-variable identifiers (`Math`,
  `prompt`, `.length`).
- 2D: `identifiers × (source | destination)` — no clear precision
  gain over 1D for this scenario; the cleanup is still by name, not
  role.

**Scenario B — "Show variable READS only (no writes)."**

- 1D: `identifiers: true` — but this also catches target-reads in
  assignments (`x` in `x = 5`) and property-key reads (`.length`).
- 2D: `identifiers × source` — precise; cleanly excludes target /
  destination identifier reads.
- 1D + consumer-side filter on dagRole — equally precise if dagRole
  is available on every step / event.

**Scenario C — "Show data flow, hide storage."**

- 1D: `operators + calls + templates` gets it. No benefit from 2D.

**Scenario D — "Show I/O inputs separately from outputs."**

- 1D: `io: true` catches both; consumer filters by dagKind (`io-in`
  vs `io-out`).
- 2D: `io × source` vs `io × destination` — same filtering, just
  moved to config.

**Assessment:** 2D adds a precision gain in Scenarios B and D, but
the same precision is achievable via **1D config + consumer-side
filtering on dagRole** (which is always on every step). The 2D
config moves the filter from consumer code to the config object —
ergonomic preference, not a capability difference.

**Trade-off:** 2D doubles the config surface (each syntax option
multiplied by 3 role values) and adds NM-layer implementation
complexity (gate translation must account for role). For the same
result as consumer-side filter.

**Recommendation (to discuss):** keep 1D config at the NM level.
`dagRole` (derived from node.type + JejTag) is always available on
every step and event; consumers filter by role when they need role
precision. Revisit if concrete lens authoring proves the
consumer-side filter is awkward in practice.

---

## Open questions / decisions

### Decided this pass

- **Scope of the proposal** — tool for **capturing and representing
  static and execution evaluation**. Pedagogy, curriculum,
  learner-facing vocabulary, higher-order objectives are later layers
  built on top. Audience: developers / SME content authors.
- **Layer model** — **palette, not ladder.** See 0.5.
- **River metaphor** — **dropped.**
- **Coercion framing** — spec-aligned, standalone events, bookended
  by operator `enter-expr` / `exit-expr`. See R10.
- **R6 identity** — split. Declaration-with-init is the only pure
  provenance case; assignment expressions ARE transformations.
- **Tracer docs/types are authoritative.** Impl will catch up.
- **JEJ reference-type scope** — primitives + read-only Date only.
- **Templates as compound sub-structure** — begin / eval / end.
- **Learner-facing vocabulary** — deferred; dev/SME audience for now.
- **NMConfig: 1D syntax-visible options only.** No 2D (syntax × role);
  role precision is consumer-side filtering by `dagRole`.
  Config surface stays simple; NM-layer impl stays tractable.
  (Lens scenarios in the earlier section cover the reasoning.)
- **Stream yield shape** — `{ step: LiveStep, envDiff }`. Nothing
  else; consumer derives context via `step.dagNodePath → ast` lookups.
- **Declaration → Initialization rename.** The visible step on the
  `let y = 5;` line is `InitializationStep` (the declaration was
  hoisted earlier under `ScopeStep(create)`). Semantically accurate
  framing: hoisting is behind-the-scenes; initialization is what
  the learner sees happen on that line.
- **dagRole / dagKind as DERIVED tags.** Computed from `node.type` +
  JejTag by the NM layer's construction phase; stored on AST nodes
  so consumers don't reimplement the derivation logic.
- **Config abstraction boundary clean.** Consumer configures
  syntax-visible elements; NM layer handles tracer-gate translation.
  Data structures are allowed to expose events directly at
  top-level fields (step.events[]) — the consumer reads raw tracer
  events; that's not an abstraction leak.
- **NM-layer is not a "thin wrapper"** — owns construction-phase
  AST tagging, config translation, stream lifecycle, envDiff
  computation, binding-write tracking, cleanup cascade, and
  finalization. Tracer owns emission; NM layer owns
  interpretation + aggregation.
- **Provenance helper (pure, exported).** `provenance(steps, start,
  direction)` as a standalone pure function in the NM-layer package.
  Consumers may use it; they don't have to.
- **onEvent callback dropped** — only async iterator on LiveStep.events
  for per-step event subscription.
- **Two-level model (not three).** Top = NM-semantic steps
  (LiveStep types); bottom = raw tracer events (accessible via
  step.events[] + ast entwining). A "middle syntax-view" is NOT a
  separate emission layer — it's a consumer-side projection over
  bottom events (filter to enter-expr / exit-expr / resolve /
  operator, etc.). Cleaner composition, one fewer concept.
- **Syntax-view projection utility — backlogged.** The NM layer
  will not ship a built-in middle-layer stream. If pedagogical use
  cases need the enter/exit-bracket view, we'll add a projection
  helper (pure function over events + ast) as a later deliverable.
- **Coercion placement: OWN DataStep** (reversal — prior pass said
  internal). `transformKind: 'coerce'` with `coerceContext` field.
  Better visibility at the NM step level; matches the tracer's
  standalone coercion event emission; consumers who want coercion
  as sub-structure on its consuming operator can correlate via
  step ordering + nodePath.
- **NMConfig nested fields + filters.** Syntax-based shorthand +
  nested objects, tracer-config-style. E.g., `variables: boolean |
  { declare, initialize, update, read, filter }`. Skipped `available`
  (not syntax-visible — it's a semantic-event-layer concept under
  `initialize`'s events[]).
- **`semanticEvents` gate in config.** When false, NM emits
  top-layer steps only; each step's events[] and ast entwining
  unpopulated. Lightweight mode for coarse-navigation consumers.
  (NM layer still internally consumes all tracer events to build
  steps correctly — gating saves CONSUMER exposure, not NM-layer
  computation.)
- **Enrichment interface** — `session.steps: AsyncIterable<LiveStep>`;
  consumer pulls (tracer parity). Per-step events available via
  `liveStep.events: AsyncIterable<TraceEvent>` (inner stream).
- **Caching** — recompute. Pure functions. Caching deferred.
- **Static-DAG build** — lives in the **wrapper** at
  `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/`.
- **Environment reconstruction** — consumer's job. Wrapper emits
  initial env + per-step envDiff.
- **Step types** — multi-type model: `DataStep` (atomic s→t→d with
  sources[] + destinations[]), `InitializationStep`, `ForInitStep`,
  `TemplateStep` (begin/end brackets for template literals),
  `StatementStep` (enter/exit boundaries), `ControlFlowStep`,
  `ScopeStep` (create/leave at block boundaries; enter/interrupt/
  completion as metadata), `ErrorStep`. One step per visible
  syntactic unit. See Rough types.
- **Multi-destination actions** — `DataStep.destinations[]` is an
  array. `console.log('hi')` emits: one DataStep with sources =
  [console read, .log read, 'hi' literal], transformKind = 'call',
  destinations = [{ destKind: 'io-emit', channel: 'dev', method:
  'log' }, { destKind: 'sink' }].
- **Sink / thin-air destination** — first-class `destKind: 'sink'`
  when the output value has no capture site (expression-statement
  result, discarded call return, comma-operator left operand).
- **Loop representation** — flat steps array; ControlFlowStep with
  `flowKind: 'loop-iteration-start' | 'loop-iteration-end'` brackets
  each iteration.
- **Error shape** — creation (R4a) on `session.creationError`;
  dynamic (R4b) on `result.error` AND emitted as a terminal
  ErrorStep in `result.steps[]`. Typed together via a union.
- **Coercion placement** — internal to the consuming operator step as
  a `coercions` sub-structure field on DataStep. Tracer fires
  standalone coercion events (for gateability); the NM layer folds
  them into the operator step because at the NM level coercion IS
  part of the transformation (translation layer between semantics
  and syntax).
- **Short-circuit representation** — no marker step. The operator
  DataStep has `shortCircuited: { skippedSide, skippedNodePath }`;
  the RHS sub-DAG nodes have no corresponding step. Consumers infer
  the skip from the flag + absent steps.
- **Sub-expression chaining** — two-way linking via indices.
  Producing step's destination: `{ destKind: 'feeds-next-step',
  consumerStepIndex: N }`. Consuming step's source: `{ ...,
  producingStepIndex: M }`. Plus `sourceValueIds` / `outputValueId`
  for pure value-level provenance. Chosen because **pedagogical
  use cases need cheap bidirectional traversal** ("where does this
  value go?" and "where did this value come from?" must be equally
  easy for any lens author).
- **Declaration structure** — own step type `InitializationStep` (not
  a DataStep with identity; not a bare StatementStep). `let y = 5`
  is a visible syntactic unit distinct from assignment, gets its
  own step shape. Inline-source for simple RHS; from-step reference
  for complex RHS.
- **Statement boundaries** — two separate StatementSteps per
  statement, `transition: 'enter'` then `transition: 'exit'`.
  Preserves the flat stream.
- **Scope lifecycle** — no ScopeStep type. Scope transitions are
  metadata on the Statement / ControlFlow / Declaration step that
  introduces or exits the scope. Rationale: scope is a property of
  the enclosing construct, not a visible syntactic unit of its own.
- **AST tag overlay** — parallel map from nodePath to
  `{ dagRole, dagKind, stepIndices }`. Doesn't touch the tracer's
  frozen AST. Consumer joins at query time (one-hop lookup).
- **Syntax ↔ semantics bridge** (load-bearing): each NM step
  corresponds to a visible syntactic unit; behind-the-scenes events
  become step metadata. This is the north star for step-shape
  decisions.
- **Full entwinement** — decided. Cross-references in ALL directions
  (step → ast, ast → steps, ast → events, step → events, step → step
  via value IDs). No logic for consumers; only documented lookups.
  One-time onboarding cost (more schema to learn); zero per-use cost.
- **Stream unit** — `session.steps` yields `LiveStep`. Wrapper
  waits for all semantic events under the syntactic step before
  emitting nothing — it emits the LiveStep on step START (first
  event) so consumers can render skeleton immediately.
- **Step emission timing** — emitted on start; accumulates as events
  fire; `.done` promise resolves on completion. Supports real-time
  visualizations (e.g., render "prompt dialog shown" before user
  response arrives). LiveStep has `events: AsyncIterable<TraceEvent>`
  for incremental updates within the step (onEvent callback dropped).
- **Stream cleanup** — `break` / `return` out of the async iterator
  auto-calls `session.cancel()`, terminating the tracer worker.
- **Step completion** — explicit marker per step kind. Wrapper
  detects each step kind's closing condition from the event stream
  and resolves `LiveStep.done`. Not dependent on a single universal
  trigger; each step type specifies its own end.
- **Scope creation as a step** — ScopeStep exists for `create` and
  `leave` at block boundaries (program start, block entry, for-loop
  body). Hoisting (binding-declare events) rides as metadata on the
  `create` step. Non-boundary transitions (enter / interrupt /
  completion) stay as metadata on adjacent steps (they're not
  visible code moments).
- **Error mid-step** — the live step's `.done` resolves with a
  partial step carrying `error: { ... }` populated. The stream then
  emits an `ErrorStep` as the next item. Consumer gets both: the
  step that failed (partial, with its events so far) AND the error
  details. Precision for error-cause visualizations.
- **Target identifier-read in assignment** — lives in `step.events[]`
  only, not promoted to step-level structure. The destination ref
  already carries `target: { name, scopePath, version }` which
  captures the resolved binding info. Lens authors who want to
  visualize the engine's target lookup filter events[].
- **Template literal structure** — TemplateStep with `transition:
  'begin' | 'end'` brackets the template. Between begin and end,
  each interpolation sub-expression produces its own DataStep(s)
  (symmetric with how loop iterations live between
  loop-iteration-start / -end). Preserves "sub-expressions are
  first-class steps," doesn't nest.
- **For-loop init** — own step type `ForInitStep`. Distinct from
  InitializationStep because lifetime + per-iteration rebind semantics
  differ.
- **Provenance walks** — no helper. Consumer implements using
  sourceValueIds / producingStepIndex / consumerStepIndex. Keeps
  the wrapper as pure data.
- **Static DAG and AST collapse to ONE data structure.** The AST
  with NM-role tags per node IS the AST. "AST" and "static
  DAG" are two lenses on the same data: AST emphasizes syntax-tree
  traversal (parent/children); AST emphasizes data-flow
  traversal (source → transformation → destination, read via
  `dagRole`). Statement sequence and per-statement expression roots
  are QUERIES over the AST (`Program.body`, `stmt.expression`, etc.),
  not separate data. Simplifies the types: `NMSession.ast`,
  `NMTraceResult.ast` — no separate `staticDag` field.
- **LiveStep mutation** — in-place. The LiveStep object mutates as
  events arrive; consumers hold the reference and re-read.
- **Binding-read provenance** — NM layer tracks latest-write step
  per binding AND exposes raw sourceValueIds. Both `producingStepIndex`
  (binding-aware) and raw valueId chain available to consumers.
- **Nested break cleanup** — outer iterator break cascades: session
  cancel + all live step inner streams terminate.

### Still open (load-bearing, need discussion)

The 16 stress tests in the Future-work section raise these. Ordered
by impact:

#### A. Step granularity (Stress 1)

How atomic is a Step? Per-event (too fine), per-statement (too
coarse), per-s→t→d (sources-without-destinations are awkward), or
per-transformation-or-destination with sources nested inside their
consumer?

**Tentative:** one step per transformation or destination; sources
are represented as inputs to their consuming step (via
`sourceValueIds` + reference to their originating AST nodes). This
keeps step count tractable and matches "DAG unit" intuition. Still
open.

#### B. Coercion as own step vs nested (Stress 2)

Own step (visibility) vs nested as internal event of the operator
step (cleanliness).

**Tentative:** own step. Coercion is pedagogically load-bearing;
making it first-class in the Step stream matches the decided
"standalone events" framing for tracer gates.

#### C. Short-circuit skipped-RHS representation (Stress 3)

Emit explicit "skipped" step, or infer skip from absence?

#### D. Loop iteration representation (Stress 4)

Flat steps with iteration markers, or nested (`iterations:
Step[][]`)? Affects consumer ergonomics.

#### E. Multi-category call steps (Stress 6)

`console.log` is BOTH transformation (returns undefined) AND
destination (emits to I/O). Single-category field doesn't represent.
Options: split into two steps, multi-category field, or flag
side-effect as metadata.

#### F. Scope lifecycle as step vs metadata (Stress 10)

Scope create / enter / leave / interrupt / completion: each its own
ScopeStep? Or metadata on adjacent steps? Ties into palette.

#### G. Error shape unification (Stress 8)

Creation errors vs dynamic errors have asymmetric shape today
(creationError on session, error on result). Worth unifying so
consumers have a single code path.

#### H. AST tag overlay strategy (Stress 9)

Tracer returns frozen AST; NM layer wants to attach dagRole/dagKind.
Parallel Map (simplest) vs ast copy (memory) vs Proxy (opaque).
Tentative: parallel Map.

#### I. Stream cleanup semantics (Stress 11)

What happens on `break` out of `for await`? Does the tracer Worker
auto-cancel, or do we need explicit `session.cancel()` every time?
Correctness concern.

#### J. Provenance walk ergonomics (Stress 12)

Removed `provenance()` helper per "pure functions" decision. Is
consumer-side walk (index steps by producedValueId, walk parent
chain via sourceValueIds) ergonomic enough? Or should we export a
pure helper function?

#### K. Template step granularity (Stress 5, related to A)

One step per template, or begin + per-eval + end as separate steps?

#### L. Target-identifier-read as own step (Stress 7)

Assignment fires identifiers.read for target. Own source-step, or
absorbed into the destination step?

#### M. Range filtering behavior (Stress 14, user-flagged as TBD)

Range drops events; does it drop steps too? Or steps always cover
the full program with partial event arrays?

### Less critical (prose-polish pass)

- TDZ / `typeof` asymmetry
- `==` non-coercive special cases
- Scope-walk framing (pedagogical affordance, not engine internals)
- for-of code-point vs code-unit
- Increment postfix-vs-prefix semantics
- Register vs prototype at parse time — `Math.max` is TWO lookups
- Assignment target `identifiers.read` (see stress 7)
- Circularity in entwined AST; serialization helper (Stress 16)

### Palette-specific (to discuss later)

- Time-portal as Bindings sub-element or standalone?
- Sidecar visual — one symbol with context, or three?

---

## Things NOT drawn (candidates for later)

- **Rebuild of Diagram 0c** — concrete worked snippets showing the
  refined NM-layer design (DataStep / InitializationStep / etc.)
  applied to real programs. The previous 0c was removed in
  condensation; planned for a follow-up pass after the model
  refinements settle.
- A worked program demonstrating the LiveStep emission flow for I/O
  (e.g., `prompt('name')` showing dialog BEFORE response arrives).
- A taxonomy of trace-table variants mapped to palette subsets.
- An "event-count histogram" per palette configuration showing the
  noise profile on real programs.

---

## How to engage with this canvas

Comments, arrows, rewrites, alternative sketches are all welcome inline.
Nothing here is load-bearing — it's all first-draft to argue with.
