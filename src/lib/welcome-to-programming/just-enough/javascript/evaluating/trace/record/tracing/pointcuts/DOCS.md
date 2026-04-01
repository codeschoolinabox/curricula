# Pointcuts — Architecture

## Why flexible weave

Aran offers two weave modes. We use **flexible** because it provides
statement/effect/expression-level hooks that standard lacks, giving us room
to grow the trace as pedagogical needs evolve.

## Aran constraints

These are hard requirements from Aran's flexible weave API:

1. **point[] must be Json[]** — pointcut return values are serialized into the
   instrumented code. No functions, Maps, class instances, or circular objects.
2. **initial_state must be Json** — cloned via JSON.parse/stringify at startup.
3. **expression@after is a value transformer** — advice MUST return the result
   value or the program breaks.
4. **apply@around replaces execution** — advice MUST call Reflect.apply and
   return the result.
5. **apply@around and construct@around: single cut only** — one handler for all
   function calls. Other hooks support multiple cuts.

## Tag strategy

Aran desugars JS into AranLang IR, erasing original syntax. Tags carry ESTree
metadata that survives desugaring:

- `loc`, `node` (ESTree type), `source` — always present
- `operator`, `loopKind`, `bindingKind`, `accessKind`, `literalKind` — present
  only on relevant ESTree constructs

The tag is a single type (Aran's Atom.Tag is one type parameter for all nodes).
The `node` field serves as runtime discriminant for sparse optional fields.

## Architecture: one set of advice, conditional dispatch

Not two categories (internal/dispatch). One set of advice functions that:
1. Always update internal state (scope stack, variable maps, step counter)
2. Conditionally call `createTraceEvent()` based on config

An `if` check before calling the wrapper is simpler than maintaining two
parallel advice systems.

## State design

TracerState is Json-serializable (Aran requirement). Contains:
- `trace[]` — accumulated events
- `step` — global step counter for step references
- `scopeStack[]` — scope nesting for depth/creation tracking
- `variableScopes{}` — variable name → scope creation step
- `iterationCounters{}` — scope step → iteration index
- `config{}` — user's config for conditional dispatch

## Pointcut → advice data flow

Pointcut functions inspect AranLang nodes at weave time (static). They extract
node type, tag data, and variable names, then return this as a Json[] point
array. At runtime, the advice function receives `(state, ...builtinArgs,
...pointData)` and uses the point data to determine which event to create.

## Aspect assembly

`create-aspect.ts` reads the user's config and builds an Aran flexible aspect
object. Each aspect entry maps an advice global variable name to a `{ kind,
pointcut, advice }` triple. Config-disabled features produce no aspect entries
(zero overhead). Scope tracking hooks are always included because binding events
need scope references even when scope events are disabled.

## Loop guards

When `maxIterations` is configured, a statement@before hook on WhileStatement
tracks iteration count and throws RangeError if exceeded. This runs regardless
of controlFlow config — it's a safety mechanism, not a trace feature.

## Execution time limits

Tracked OUTSIDE Aran, in the wrapper that evaluates instrumented code. The
wrapper starts a timer, pauses during I/O interactions (prompt/confirm/alert),
and checks against maxSeconds. Simpler and more accurate than in-advice timing.
