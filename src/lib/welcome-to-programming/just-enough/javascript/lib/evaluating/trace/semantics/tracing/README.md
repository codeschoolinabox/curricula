# tracing — Aran-based JavaScript trace engine

Instruments JavaScript source code via Aran AST weaving, capturing runtime
events for every expression, variable access, function call, and control-flow
step. Executes instrumented code in a disposable Web Worker (or via
`new Function()` in Node tests).

## Domain glossary

- **ASTNode** — ESTree-style node enriched with tracing metadata. Has `syntaxId`,
  `parent: ASTNode | null` (circular), `type`, `loc`, `source`, and standard
  ESTree child fields. Built at instrument time, frozen, returned in
  `TraceResult.ast`. Every `TraceEvent.node` is a direct reference into this
  structure.

- **syntaxId** — Aran's `nodePath` string (e.g. `$.body.0.test.left`). Assigned
  statically at instrument time — no runtime state needed. Used as keys in
  `TraceResult.ast`. Links events to syntax: events sharing a `syntaxId` describe
  the same construct from different perspectives (e.g. both `AssignmentOperatorEvent`
  and `BindingEvent(update)` fire on `x = 5`).

- **Tag (JejTag)** — ESTree metadata surviving Aran's desugaring. Built during
  the digest phase of `instrument()`, keyed by `syntaxId` hash, and resolved by
  pointcuts at weave time. Contains `loc`, `node` (ESTree type string), `source`,
  and conditional fields (`operator`, `bindingKind`, `literalKind`, `loopKind`,
  `accessKind`, `prefix`).

- **Tag map** — `Map<string, JejTag>` built during `instrument()`. Bridges Aran's
  string-hash tag constraint and the pipeline's need for rich metadata objects.

- **TraceEvent** — A frozen, immutable record describing one observable moment
  during code execution. Has `step`, `semantics`, and `node: ASTNode`. Discriminate
  on `category`. See `types.ts` for the full union.

- **ResolveEvent** — The data-layer event. Emitted after every expression-producing
  event, carrying the resulting value. `category: 'resolve'`, `semantics: 'resolve'`,
  `kind: ResolveKind`, `value: ValueRepresentation`.

- **5-layer mental model** — The static `ast` layer (always present) plus four
  dynamic config layers: `resolve` (data), `expression` (which code produced
  values), `statements` (control flow), `scopes` (structure).

- **Advice** — Runtime functions injected by Aran into instrumented code. Receive
  the current TracerState, Aran-provided arguments, and pointcut data. Update
  internal state and conditionally emit TraceEvents.

- **Pointcut** — Static (weave-time) function inspecting AranLang nodes. Returns
  a JSON array of data passed to advice at runtime, or `null` to skip the node.
  Config gating happens here — most gates resolved statically from JejTag metadata.

- **Event step** — Contiguous 1-indexed counter on user-facing events. Only
  incremented when an event is emitted. Sequential with no gaps. Appears as the
  `step` field on every TraceEvent.

- **Internal step** — Counter (`state.step`) used for scope/variable cross-references
  (`creationStep`, `declarationStep`). Not directly visible on events.

## Architecture

See [DOCS.md](./DOCS.md) for architectural decisions.

```text
instrument(code, config)
  1. Pre-walk AST: build parent info map (declarator→kind, for digest)
  2. Aran transpile with digest → tagMap (Map<hash, JejTag>)
     - digest callback: collect ASTNode per node, set .parent from parentInfoMap
  3. createAspect(config, tagMap) → { pointcut, adviceGlobals, initialState }
     - Pointcuts resolve hash tags → JejTag, gate at instrument time
  4. Aran weaveFlexible → inject advice calls
  5. Aran retropile (standalone) → ESTree
  6. astring generate → instrumentedCode string
  7. Freeze all ASTNode objects (cycle guard for .parent circular refs)
  8. Build ast: Record<syntaxId, ASTNode> from tagMap
```

## Files

| File | Purpose |
| ---- | ------- |
| `index.ts` | Async generator — orchestrates Worker, SAB, streaming |
| `instrument.ts` | Main-thread Aran pipeline (parse → digest → transpile → weave → generate) |
| `trace-worker.ts` | Worker module — registers advice, executes instrumented code |
| `types.ts` | TraceEvent type definitions (consumer API contract) |
| `weaving/` | Pointcuts + advice functions |
| `event-generators/` | Factory functions for each event category |
| `represent-value/` | Value serialization for event payloads |

## Navigation

- [DOCS.md](./DOCS.md) — architectural decisions for this module
- [weaving/README.md](./weaving/README.md) — pointcut + advice architecture
- [../README.md](../README.md) — trace module overview
- [../DOCS.md](../DOCS.md) — trace module architecture decisions
