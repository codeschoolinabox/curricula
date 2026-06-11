# Weaving

Bridges Aran's flexible weave API to our trace event generators. Contains
pointcut functions (what to intercept), advice stubs (what to do when
intercepted), and aspect assembly (wiring them together).

## How it fits

```text
User config + JS source
       ↓
  create-aspect.ts   ← builds Aran aspect from config
       ↓
  Aran flexible weave
       ↓
  pointcut functions  ← decide which AranLang nodes to intercept
       ↓
  advice functions    ← receive runtime values, call emitExpression/emitResolve
       ↓
  trace events        ← frozen TraceEvent objects in state.trace (node: syntaxId string)
```

- **Upstream**: User provides a config (options.schema.json) and JS source code
- **This module**: Translates config into Aran weaving/advice, emits frozen
  `TraceEvent` objects
- **Two-way linking**: `ASTNode.events[]` and `ASTNode.visits` are built by the
  internal `link()` post-execution — never by advice

## Directory structure

| Path               | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `types.ts`         | JejTag (AST metadata) and TracerState (runtime state)      |
| `create-aspect.ts` | Main entry point — builds Aran flexible aspect from config |
| `pointcut/`        | One pointcut function per Aran hook category (5 files)     |
| `advice/`          | Advice stubs — one per Aran hook category (5 files)        |

## Key concepts

- **Tags**: Metadata embedded in every AranLang node during transpilation.
  Carries ESTree info that Aran's desugaring erases (source location, original
  node type, operator, loop kind, etc.)
- **Points**: Json arrays returned by pointcut functions, passed to advice as
  spread parameters. Carry extracted data from the AranLang node + tag.
- **State**: Json-serializable runtime state tracking scope nesting, variable
  ownership, step counts. Shared across all advice functions in a block.
