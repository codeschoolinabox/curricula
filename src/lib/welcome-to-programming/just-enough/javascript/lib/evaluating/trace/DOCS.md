# evaluating/trace — Architecture & Decisions

## Why this tracer exists

Instruments JavaScript source code via Aran AST weaving to produce structured,
typed `TraceEvent` objects — one per observable moment during execution. Used
by educational tools to visualize programs step by step.

The `api/trace.ts` wrapper validates code, prepares config, and gates on format
before calling into this module. This module focuses solely on instrumentation
and event emission.

## Why 5 layers

The mental model separates concerns by what each layer answers:

| Layer | Question answered |
| ----- | ----------------- |
| `ast` (static) | What does the program's syntax look like? |
| `resolve` | What values flowed through the program? |
| `expression` | Which code constructs produced those values? |
| `statements` | How was execution controlled? |
| `scopes` | Where do variables live and how do they become available? |

Learners can start with just `resolve: true` (pure data trace) and progressively
add layers as their mental model grows. Config at instrument time (pointcuts)
means disabled layers have zero runtime overhead.

## Config gating at instrumentation time

Most config gates are resolved statically in pointcuts using `JejTag` metadata
(`literalKind`, `operator`, `loopKind`, `accessKind`, `bindingKind`, `prefix`).
Pointcuts either inject advice calls or skip the node entirely.

Only three gate types stay at runtime (in the dispatcher):

- **Filter arrays** (variable names, function names, property names) — name
  only known at runtime for some patterns
- **`initialize` vs `update`** — TDZ state is runtime-only
- **Short-circuit detection** — depends on runtime evaluation results

**Why:** Zero-overhead disabled features. A learner tracing only `expression.variables.read`
incurs no instrumentation cost for operators, literals, or control flow. Simpler
dispatcher — it only handles what couldn't be decided at weave time.

## ASTNode as direct event reference

Each `TraceEvent.node` is a direct `ASTNode` reference rather than flat
`loc`, `node: string`, and `source` fields.

**Why:** `ASTNode` provides everything the flat fields provided, plus `syntaxId`
(for linking events to the `ast` record), `parent` navigation (for syntax
context without a separate lookup), and full ESTree children. Consumers can
navigate from any event directly to its parent constructs without touching the
`ast` record.

Tradeoff: `node.parent` is circular — deep-freeze requires a cycle guard, and
JSON serialization requires a custom replacer. Both are documented and handled.

## ResolveEvent as the data baseline

Every expression-producing event is followed by a `ResolveEvent` carrying the
resulting value. This separates concerns cleanly:

- Expression events carry **context** (operator, operands, name, kind)
- `ResolveEvent` carries **the value** (always `ValueRepresentation`)

A consumer interested only in data flow can set `resolve: true` and disable
all other layers — they still get a complete picture of what values flowed
through the program, just without syntax context.

**Why remove `.result` from expression events:** Consumers were accessing the
same value through two paths (`.result` on the event, OR the following
ResolveEvent). Having it in one place (ResolveEvent) forces a consistent model.

## TraceResult gains `code`, `ast`, `options`

On `ok: true`, TraceResult now includes:

- `code` — echoes back the source for consumers that don't store it separately
- `ast` — flat `Record<syntaxId, ASTNode>` built at instrument time. `ast['$']`
  is the root Program; every event's `.node` is a direct reference into it.
  O(1) lookup by syntaxId. Circular `parent` refs — JSON serialization needs a
  replacer.
- `options` — snapshot of the `TraceOptions` that was used, so consumers know
  which event categories were enabled without re-reading config.

## Dual-perspective events on assignment

On `x = 5` with both `expression.operators.assignment` and
`expression.variables.update` enabled, three events fire in order:

1. `AssignmentOperatorEvent` — operator view (operator, operands, value written)
2. `BindingEvent(update)` — variable lifecycle view (name, value written)
3. `ResolveEvent(kind:'assignment')` — data view (the produced value)

All three share the same `syntaxId`. This is intentional: a trace consumer
focused on operators gets the full picture; one focused on variables gets theirs.
The shared `syntaxId` links them for consumers that need both views.

## Range filtering

`TraceConfig.range` (not inside `options`) filters events to a source range.
The dispatcher checks `event.node.loc` against the range before emitting.
Events outside the range are silently dropped. The `ast` record is NOT filtered
by range — it always contains the full program structure.

UI use case: learner highlights a code selection; the tool traces only the
events under the highlight.

## Implementation prerequisites

Before implementing ASTNode embedding in events:

1. **`deepFreezeInPlace` cycle guard** — add a `visited: Set` parameter to
   prevent infinite recursion on `ASTNode.parent` circular refs.

2. **`buildParentInfoMap()` for ASTNode construction** — `instrument.ts` already
   calls this before `transpile()`. During the digest callback, use the map to
   set `.parent` on each ASTNode as it's collected. No nodePath trimming needed.

3. **ResolveEvent dual-hook emission** — no single "after all expressions" hook
   in Aran. `expression@after` handles literals, variable reads, and short-circuit
   operators. `apply@around` handles binary/unary ops, property access, calls,
   and templates. Both hooks must emit ResolveEvents.
