# tracing — Aran-based JavaScript trace engine

> **Status**: This document describes the target design. Items marked ⏳ are
> planned but not yet implemented. See the plan file for implementation status.

Instruments JavaScript source code via Aran AST weaving, capturing runtime
events for every expression, variable access, function call, and control-flow
step. Executes instrumented code in a disposable Web Worker (or via
`new Function()` in Node tests).

## Domain glossary

- **Tag (JejTag)** — ESTree metadata surviving Aran's desugaring. See
  `weaving/types.ts` for the type definition. Contains `loc`, `node`, `source`,
  and conditional fields (`operator`, `bindingKind`, `literalKind`, etc.).
  ⏳ Will be built during the digest phase of `instrument()`, keyed by hash
  string, and resolved by pointcuts at weave time. Currently tags are hash
  strings (the root cause of RC-1).

- ⏳ **Tag hash** — String identifier (`filepath#nodePath`) returned by Aran's
  digest function. Maps 1:1 to a JejTag via the tag map. Satisfies Aran's
  `string | number` tag constraint.

- ⏳ **Tag map** — `Map<string, JejTag>` built during `instrument()`, consumed
  by pointcuts during `weaveFlexible()`. Bridges Aran's string-hash constraint
  and the pipeline's need for rich metadata objects.

- ⏳ **Event step** — Contiguous 1-indexed counter on user-facing events. Only
  incremented when an event is emitted via `emitEvent()`. Will appear as the
  `step` field on every TraceEvent. Sequential with no gaps. Currently events
  have no `step` field (RC-2).

- **Internal step** — Counter (`state.step`) used for scope/variable
  cross-references (`creationStep`, `declarationStep`). Not visible on events
  directly. ⏳ Cross-reference fields on events (`scopeCreationStep`,
  `declarationStep`) will become optional — omitted when the referenced event is
  disabled by config.

- **TraceEvent** — A frozen, immutable record describing one observable moment
  during code execution. Carries source metadata (`loc`, `node`, `source`), a
  `step` number, a `category` discriminant, and domain-specific fields. See
  `types.ts` for the full union type.

- **Advice** — Runtime functions injected by Aran into the instrumented code.
  Each advice function receives the current TracerState, Aran-provided arguments,
  and pointcut data. Advice functions update internal state and conditionally emit
  TraceEvents.

- **Pointcut** — Static (weave-time) function that inspects AranLang nodes and
  returns a Json array of data to pass to the advice at runtime. Pointcuts also
  serve as filters — returning `null` means "don't intercept this node."

## Architecture

See `DOCS.md` in this directory and `weaving/DOCS.md` for architectural
decisions.

⏳ Target architecture (not yet implemented — current code skips steps 1–3):

```text
instrument(code, config)
  1. Pre-walk AST: build declarator→kind map (parent info for digest)
  2. Aran transpile with custom digest → tagMap (Map<hash, JejTag>)
  3. createAspect(config, tagMap) → { pointcut, adviceGlobals, initialState }
     - Wraps each pointcut to resolve hash tags → JejTag objects
  4. Aran weaveFlexible → inject advice calls
  5. Aran retropile (standalone) → ESTree
  6. astring generate → instrumentedCode string
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
