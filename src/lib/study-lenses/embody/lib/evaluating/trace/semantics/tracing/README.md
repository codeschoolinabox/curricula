# tracing — the Aran instrumentation pipeline

Turns a validated JEJ program into instrumented source (via Aran AST weaving),
provides the worker-side machinery the woven code drives at runtime (advice,
dispatcher, event generators, value representation), and links the streamed
events back onto the ast record after the run settles. The sandbox that executes
the instrumented source is the engine's — this module never touches a Worker or
the transport.

The ubiquitous language (trace event, linked event, nodePath, ast record,
linking, runtime gate bundle, co-gating, provenance, visit counts, JejTag,
pointcut, advice, dispatcher) is pinned once, in
[`../README.md § Glossary`](../README.md); this module adds no vocabulary of its
own.

## What lives here

| File / directory    | Purpose                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `instrument.ts`     | Main-thread pipeline: pre-walk → parse → digest (tag map) → aspect assembly → weave → generate; builds the mutable ast record |
| `link.ts`           | Post-settlement linking: node refs onto events, per-node event lists, visits from the halt, cycle-guarded freeze              |
| `types.ts`          | The event contract: wire-safe `TraceEvent` union, `LinkedTraceEvent`, `ASTNode`, value representations                        |
| `weaving/`          | Pointcuts (weave-time gating + discriminants) and advice (runtime observation + dispatch)                                     |
| `event-generators/` | Pure factory functions, one per event category                                                                                |
| `represent-value/`  | Clone-safe value representation (built worker-side, before the boundary)                                                      |
| `tests/`            | T2 engine-seam conformance + T3 pipeline-seam suites ([`tests/README.md`](./tests/README.md))                                 |

## Two facts that shape everything

- **Wire safety.** Events cross the worker boundary by structured clone, so
  every event field is a scalar or plain frozen object; `nodePath` (a string) is
  the link to syntax during streaming, and the direct `.node` reference exists
  only after linking. Events sharing a `nodePath` describe the same construct
  from different perspectives (the dual-perspective rule —
  [`../README.md § Event categories`](../README.md)).
- **Weave-time gating.** Config gates are resolved while weaving: a disabled
  gate injects no advice call at all. Only the runtime gate bundle (range
  window, name filters, iteration cap — delivered via the engine's worker
  config) is checked at runtime, in the dispatcher.

## Navigation

- [DOCS.md](./DOCS.md) — this module's architectural sketch and decision records
- [weaving/README.md](./weaving/README.md) — pointcut + advice architecture
- [../README.md](../README.md) — the tracer front door (glossary, event
  categories, bounded context)
- [../DOCS.md](../DOCS.md) — the tracer-level phase map
