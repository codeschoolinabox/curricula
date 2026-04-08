# evaluating/trace

Traces JavaScript execution via Aran AST weaving, capturing structured
`TraceEvent` objects for every expression evaluation, variable lifecycle,
function call, control-flow step, and scope boundary.

Not called directly — the `api/trace.ts` wrapper handles validation, config
preparation, and format checking before delegating here.

## 5-layer mental model

```text
ast (static)   ← frozen program structure, always in TraceResult.ast
resolve        ← data layer: what values flowed (ResolveEvents)
expression     ← expression layer: which code produced those values
statements     ← statement layer: how execution was controlled
scopes         ← structure layer: scope boundaries + binding lifecycle
```

The four dynamic layers are controlled by `TraceOptions`. Each layer can be
toggled with a boolean or fine-tuned with an object. The static `ast` layer is
always present in `ok:true` results — it's not configurable.

## Structure

| File / Directory | Purpose |
| ---------------- | ------- |
| `index.ts` | Async generator — orchestrates Worker, SAB, streaming |
| `trace.ts` | Internal trace pipeline entry |
| `config.types.ts` | `TraceOptions` type — the 4-layer config contract (re-exports from `shared/types.ts`) |
| `options.schema.json` | JSON Schema for `TraceOptions` — used by `configuring/` for default-filling |
| `options-schema.ts` | Thin TypeScript wrapper re-exporting `options.schema.json` |
| `configuring/` | Config preparation pipeline (expand shorthand → fill defaults → validate) |
| `tracing/` | Aran instrumentation pipeline + event emission + types |
| `verify-options/` | Cross-field semantic validation (`range.start ≤ range.end`) |
| `tests/` | Integration tests |

## TraceResult shape

On `ok: true`:

```typescript
{
  logs:    readonly TraceEvent[]          // ordered event stream
  code:    string                         // original source (echoed back)
  ast:     Readonly<Record<string, ASTNode>> // syntaxId → ASTNode (O(1) lookup)
  options: TraceOptions                   // config snapshot
}
```

`ast['$']` is the root Program node. Every `event.node` is a direct reference
into the frozen `ast` structure. `event.node.parent` provides upward navigation.
Note: `node.parent` is circular — `JSON.stringify` requires a custom replacer.

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and rationale
- [tracing/README.md](./tracing/README.md) — Aran instrumentation pipeline
- [tracing/DOCS.md](./tracing/DOCS.md) — tracing architectural decisions
- [configuring/README.md](./configuring/README.md) — config preparation pipeline
- [verify-options/README.md](./verify-options/README.md) — cross-field validation
- [../shared/README.md](../shared/README.md) — shared types across all engines
