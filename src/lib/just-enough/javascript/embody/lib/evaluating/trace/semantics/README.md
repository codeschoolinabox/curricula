# evaluating/trace

Traces JavaScript execution via Aran AST weaving, capturing structured
`TraceEvent` objects for every expression evaluation, variable lifecycle,
function call, control-flow step, and scope boundary.

Not called directly — the `api/trace.ts` wrapper handles JEJ-level code
validation and format checking before delegating here. Config preparation
(expand shorthand → fill defaults → validate → cross-field semantic checks)
happens inside the tracer via the `prepare/` module.

## 5-layer mental model

```text
ast (static)   ← frozen program structure, always in TraceResult.ast
resolve        ← data layer: what values flowed (ResolveEvents)
expression     ← expression layer: which code produced those values
statements     ← statement layer: how execution was controlled
scopes         ← structure layer: scope boundaries + binding lifecycle
errors         ← error layer: unhandled runtime errors (ErrorEvent, top-level gate)
```

The dynamic layers are controlled by `TraceOptions`. Each can be toggled with a
boolean or fine-tuned with an object. The static `ast` layer is always present
in `ok:true` results — it's not configurable. `errors` is a top-level boolean
flag.

## Structure

| File / Directory      | Purpose                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.ts`            | Tracer module entry point — exports the trace generator + tracer-module fields (id, langs, optionsSchema)                                                    |
| `config.types.ts`     | `TraceOptions` + `TraceConfig` types — the 4-layer config contract                                                                                           |
| `options.schema.json` | JSON Schema for `TraceOptions` — used by `prepare/` for default-filling                                                                                      |
| `options-schema.ts`   | Thin TypeScript wrapper re-exporting `options.schema.json`                                                                                                   |
| `prepare/`            | Pre-flight pipeline: validates input, expands shorthand, fills defaults, validates, runs cross-field semantic checks. Called by the tracer before execution. |
| `tracing/`            | Aran instrumentation pipeline + event emission + types                                                                                                       |
| `tests/`              | Integration tests                                                                                                                                            |

## TraceResult shape

On `ok: true`:

```typescript
{
  events:      readonly LinkedTraceEvent[]          // ordered event stream — each has .node: ASTNode
  code:        string                               // original source (echoed back)
  ast:         Readonly<Record<string, ASTNode>>    // nodePath → ASTNode (O(1) lookup)
  options:     TraceOptions                         // config snapshot
  visitCounts: Readonly<Record<string, number>>     // nodePath → visit count (mirrors node.visits)
}
```

`trace()` returns a **fully-linked** result. `TraceResult.events` are
`LinkedTraceEvent` objects — each has a direct `.node: ASTNode` reference in
addition to `.nodePath`. `ASTNode.events[]` holds back-references to all events
on that node. Both directions of navigation are available without any
post-processing step.

`visitCounts` records how many times execution passed through each syntax node.
Mirrors `node.visits` in the `ast` record — both are populated by the internal
`link()` function after execution completes.

`ast['$']` is the root Program node. Events are wire-safe scalars during
streaming (generator yields `TraceEvent` with no `.node` field). The final
`TraceResult.events` have `.node` refs added by the internal linking step.
Reference identity between yielded and final events is NOT preserved — same
data, different objects (Worker boundary makes this unavoidable).

Serialization: `node.parent` and `node.events[i].node` are circular —
`JSON.stringify` requires a replacer that omits them. Use `node.parentPath`
(scalar) and `node.events.map(e => e.step)` for serialization-safe equivalents.

## Navigation

- [DOCS.md](./DOCS.md) — vocabulary, architecture axes, test taxonomy, key
  design decisions
- [tracing/README.md](./tracing/README.md) — Aran instrumentation pipeline
- [tracing/DOCS.md](./tracing/DOCS.md) — 6-layer architecture, control
  enforcement, key constraints
- [tracing/weaving/DOCS.md](./tracing/weaving/DOCS.md) — tag strategy,
  pointcut/advice design, co-gating discriminant
- [tracing/tests/README.md](./tracing/tests/README.md) — 7-tier test taxonomy +
  full file inventory
- [tests/profiles/README.md](./tests/profiles/README.md) — named semantic
  profiles for T4 tests
- [prepare/README.md](./prepare/README.md) — pre-flight config pipeline
- [../shared/README.md](../shared/README.md) — shared types across all engines
