# Weaving — Architecture

> **Status**: This document describes the target design. Sections marked with
> ⏳ describe planned changes not yet reflected in the code or types. See the
> plan file for implementation status.

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

### ⏳ Tag resolution (digest → map → pointcut wrapping)

Aran's `digest` function must return `string | number`. But pointcuts and advice
need rich JejTag objects. The solution uses three phases:

1. **Digest phase** (during `transpile()`): A custom digest function receives
   each ESTree node, extracts metadata into a JejTag, stores it in a
   `Map<string, JejTag>` keyed by hash, and returns the hash string. Aran
   digests nodes bottom-up (children before parents), so parent-dependent
   metadata (e.g., VariableDeclarator needs parent VariableDeclaration's `kind`)
   is resolved via a pre-walk of the AST before transpile.

2. **Pointcut wrapping** (during `createAspect()`): Each pointcut function is
   wrapped to resolve hash strings → JejTag objects before calling the original
   pointcut. Resolution is **shallow with a whitelist**: `node.tag`, `parent.tag`,
   `root.tag`, plus the known nested positions used in identity comparisons:
   `parent.then?.tag`, `parent.else?.tag`, `parent.try?.tag`, `parent.catch?.tag`,
   `parent.finally?.tag`. The same Map lookup (`tagMap.get(hash)`) is used for
   all resolutions, preserving object identity for `===` comparisons in pointcuts
   like `block-pointcut.ts`. No recursive walking — the whitelist is finite and
   verified by grep against all pointcut files.

3. **Runtime** (in advice): The pointcut return array contains the resolved
   JejTag object (not the hash string). Aran JSON-serializes this into the
   instrumented code. Advice functions receive JejTag objects directly — no
   further resolution needed.

### Constraint: tag map lookup must succeed

Tag map lookup must succeed for every hash encountered at pointcut time. A
missing hash indicates a digest/pre-walk bug and should throw an error with the
hash and node type for debugging. Silent fallback (returning undefined or a
default tag) would mask instrumentation bugs and produce events with missing
metadata.

### Constraint: JejTag must be Json-serializable

Because pointcut return arrays are embedded in the instrumented code via JSON,
every field of JejTag must be a Json primitive, array, or plain object. No
functions, Maps, Sets, Dates, or class instances.

## Architecture: one set of advice, conditional dispatch

Not two categories (internal/dispatch). One set of advice functions that:
1. Always update internal state (scope stack, variable maps, step counter)
2. Conditionally call `createTraceEvent()` based on config

An `if` check before calling the wrapper is simpler than maintaining two
parallel advice systems.

## State design

TracerState is Json-serializable (Aran requirement). Contains:

- `trace[]` — accumulated events
- `step` — internal step counter for cross-references (see Step numbering below)
- ⏳ `eventStep` — contiguous event counter for user-facing `step` field
- `scopeStack[]` — scope nesting for depth/creation tracking
- `iterationCounters{}` — per-loop iteration counts (keyed by source location)
- `lastExpressionResult` — most recent expression result (for assignment values)
- `previousExpressionResult` — prior expression result (for short-circuit recovery)
- `lastReadValues{}` — last read values per variable (for compound assignment operands)
- `config{}` — user's config for conditional dispatch
- `onEvent?` — streaming callback (set by worker, not Json-serializable)

### ⏳ Step numbering: single contiguous counter, optional cross-references

**`eventStep`** (user-facing): Contiguous 1-indexed counter. The event emission
function increments it, injects it as the `step` field on the event object, then
pushes to trace: `eventStep++ → event.step = eventStep → trace.push(event)`.
Consumers see sequential steps with no gaps: 1, 2, 3, 4...

**`step`** (internal): Counter used by advice for internal scope and variable
tracking. Incremented by `block-setup` (scope creation) and `block-declaration`
(variable registration). Not visible on events. Used to build the internal
`creationStep` and `declarationStep` values in the scope stack and variable
registry.

**Cross-reference fields are optional**: Fields like `scopeCreationStep`,
`declarationStep`, and `parentCreationStep` on events use internal step values
to reference scope/variable tracking moments. These are **omitted** when the
referenced event is disabled by config — the consumer can't navigate to a
disabled event anyway. When present, they reference internal tracking IDs, not
event step numbers. Consumers should treat them as opaque grouping keys, not as
step indices for navigation.

Additional cross-reference fields: `beginStep` on template evaluation/end events
(references the template begin event), `structureStep` on scope events
(references the control flow structure's initial event). These follow the same
rule: optional, omitted when the referenced event is disabled. Exception:
template sub-events (evaluation, end) are meaningless without their begin event,
so if begin is disabled, evaluation/end should also be suppressed by the config
gating logic — `beginStep` should never be orphaned in practice.

Why separate counters: internal tracking always runs (scope creation, variable
registration) even when those event categories are disabled by config. A single
counter would produce gaps in user-facing step numbers. The learning UI needs
contiguous steps for step-by-step visualization.

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
