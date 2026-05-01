# embody

`embody(code)` is the **operational embodiment of the JEJ notional
machine**. It takes a JEJ source string and returns a frozen-data +
event-stream object representing the snippet as the NM would treat it.

embody is one rung of the conceptual chain (see
[../README.md](../README.md)):

```text
JEJ  →  NM  →  embody  →  study lenses
```

- The **NM** ([../notional-machine.md](../notional-machine.md)) defines
  what concepts exist (phases, scopes, bindings, coercion, …).
- **embody** turns each JEJ snippet into a data object whose every field
  and event corresponds to one of those NM concepts.
- The **orchestrator** (`compose/`) consumes embody instances and
  distributes the `embodiment` to mounted **lenses** via props. Lenses
  never re-derive what embody exposes; they also do not import embody
  directly — they receive `embodiment` from the orchestrator.

embody is **not** part of the package's public API. The public surface
is the `<StudyLenses>` orchestrator component (see
[`../README.md`](../README.md) § Public API). This module is the
internal data layer that `<StudyLenses>` builds on.

Embody decides nothing about pedagogy. The contract is *accuracy*. Lenses
choose what to teach.

## What you get from `embody(code)`

```text
const snippet = embody(code);
```

`snippet` is a frozen `Snippet` (see [`types.ts`](./types.ts) for the
canonical contract) with:

- **Status booleans** — independent gates (`tokenized`, `parsed`,
  `created`) that lenses check before reaching for fields
- **Source** — the input string + a line-offsets index for `loc` lookups
- **Parse output** — entwined frozen graph: tokens, AST, comments,
  cross-reference indexes
- **Static analyses** — realm, initial scope, bindings, dependencies,
  features, metrics (length distributions + structural counts),
  control flow, non-determinism sources, I/O usage
- **Validation summary** — `isJeJ`, `isDeterministic`, `doesPause`,
  `formatted`, `violations`
- **Errors** — first-fail-wins error from any pre-evaluation gate
- **Streams** — a-la-carte event-stream generators per lifecycle phase

## Streams (the only callable surface)

Generators are the only callable thing on a Snippet. Static-side
generators iterate pre-computed frozen data; evaluate-side generators run
a Worker live.

| Stream | Returns | Purpose |
| --- | --- | --- |
| `streams.realm()` | `Generator<RealmBindingEvent>` | Iterate realm bindings alphabetically — "what's in the world?" |
| `streams.parse.tokenize()` | `Generator<TokenEvent>` | Token events from the cached token array |
| `streams.parse.parse()` | `Generator<NodeEvent>` | AST traversal events in parse order |
| `streams.create()` | `Generator<ScopeEvent \| BindingEvent>` | Script-scope creation events |
| `streams.evaluate.run(opts?)` | `Promise<RunInstance>` | End-report only (no event stream) |
| `streams.evaluate.intercept(opts?)` | `EvaluateHandle` | I/O + error events (live worker) |
| `streams.evaluate.trace.syntax(opts?)` | `EvaluateHandle` | + NM step events |
| `streams.evaluate.trace.semantics(opts?)` | `EvaluateHandle` | + finer-grained internals |

Evaluate-tier events are a flat discriminated union; tiers are filter
whitelists, not type-narrowed subsets. Each call returns a `RunInstance`
with the events that fired plus an end-report.

## Load-bearing principles (do not violate without explicit decision)

1. **Pure data, no methods.** Every embody surface is data: frozen
   objects, arrays, primitives. Generators are the only callable surface
   (event streams are inherently iterated). No `query()`, `dispose()`,
   `clone*()`, or accessor methods.
2. **No Maps/Sets at the public surface.** `Object.freeze` doesn't freeze
   them; pedagogy prefers ground-truth shapes. Use plain objects and
   arrays.
3. **Strict immutability.** Single deep-freeze at end of construction.
   Consumers wanting a mutable copy `structuredClone` themselves.
4. **Per-instance, no shared state.** No module-level cache, no
   cross-instance communication. One `embody(code)` knows nothing of
   others.
5. **Spec-aligned, learner-named.** Names follow the NM body (learner-
   friendly); spec correspondence is in `../notional-machine.md` § Spec
   correspondence appendix.

## How to read this directory

| File | Audience | Purpose |
| --- | --- | --- |
| `README.md` (this) | Contributors | What embody is, navigation |
| [`types.ts`](./types.ts) | embody implementers, orchestrator authors, lens authors (for typing `embodiment` props) | **Canonical contract** — every type, fully documented |
| [`DOCS.md`](./DOCS.md) | Implementers, reviewers | Architecture: why these decisions, data flow, tradeoffs |

For prose explanation of the NM concepts each type maps to, see
[`../notional-machine.md`](../notional-machine.md).

## Conceptual link to the NM

Every `embody/types.ts` shape corresponds to a concept in `notional-machine.md`:

| embody type | NM concept |
| --- | --- |
| `Source` | Phase 0 — source code (string + offsets) |
| `ParseGraph`, `AugmentedToken`, `AugmentedASTNode` | Phase 1 — parse output (tokens + AST) |
| `Realm`, `BuiltinBinding` | Realm setup (intrinsics + host bindings) |
| `InitialScope`, `Scope`, `Binding`, `BindingStatus` | Scopes + binding lifecycle (tdz → initialized → dead) |
| `Event` (flat union) | Lifecycle event categories |
| `RunInstance` | One evaluation of a snippet |
| `Validation`, `NonDeterminism`, `HasIo` | Snippet-level metadata |

If you're unsure what something means, the NM doc is upstream of the
types — read the prose, then come back to the type.

## Status

embody is **pre-implementation**. The types are locked
([`types.ts`](./types.ts)) and adversarial-reviewed (AR-1 + AR-2 — see
[`DOCS.md`](./DOCS.md) § AR history). Implementation begins at
documentation-driven-development phase 1; the
[`lib/`](../lib/) modules will be coordinated to support embody (see
[`DOCS.md`](./DOCS.md) § `lib/*` integration).

`.legacy/` holds pre-DDD sketches superseded by the locked design — kept
for archival reference only, not part of the live module.
