# Weaving

Bridges Aran's flexible weave API to our trace event generators. Contains
pointcut functions (what to intercept), advice stubs (what to do when
intercepted), and aspect assembly (wiring them together).

## How it fits

```text
resolved options + validated source
       ↓
  aspect assembly     ← builds the Aran aspect from the options (weave-time gating)
       ↓
  Aran flexible weave
       ↓
  pointcut functions  ← decide which nodes to intercept; return semantic +
       ↓                 co-gating discriminants and the resolved tag
  advice functions    ← receive runtime values, hand payloads to the dispatcher
       ↓
  trace events        ← frozen, wire-safe (nodePath string — never a node reference)
```

- **Upstream**: the tracer entry provides resolved options and validated source
- **This module**: translates options into Aran weaving/advice; advice hands
  payloads to the dispatcher (`advice/emit-*`), which gates against the runtime
  gate bundle, stamps, freezes, and emits
- **Two-way linking**: node event lists and visits are built by linking after
  the run settles — never by advice

## Directory structure

| Path               | Purpose                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `types.ts`         | JejTag (AST metadata) and TracerState (runtime state)                                     |
| `create-aspect.ts` | Main entry point — builds the Aran flexible aspect from the options                       |
| `pointcut/`        | One pointcut function per Aran hook category                                              |
| `advice/`          | Advice per Aran hook + the dispatcher (`emit-expression` / `emit-resolve` / `emit-error`) |

## Key concepts

- **Tags**: Metadata embedded in every AranLang node during transpilation.
  Carries ESTree info that Aran's desugaring erases (source location, original
  node type, operator, loop kind, etc.)
- **Points**: Json arrays returned by pointcut functions, passed to advice as
  spread parameters. Carry extracted data from the AranLang node + tag.
- **State**: Json-serializable runtime state tracking scope nesting, variable
  ownership, step counts. Shared across all advice functions in a block.
