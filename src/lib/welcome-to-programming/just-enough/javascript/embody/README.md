# embody

`embody(code)` is the **operational embodiment of the JEJ notional
machine**. It takes a JEJ source string and returns a frozen-data +
event-stream object representing the snippet as the NM would treat it.

embody is one rung of the conceptual chain (see
[../README.md](../README.md)):

```text
JEJ  →  NM  →  embody  →  study lenses  →  orchestrate
```

- The **NM** ([../notional-machine.md](../notional-machine.md)) defines
  what concepts exist (phases, scopes, bindings, coercion, …).
- **embody** turns each JEJ snippet into a data object whose every field
  and event corresponds to one of those NM concepts.
- **Study lenses** consume `embodiment` to render pedagogical
  perspectives on it.
- **The orchestrator** (`orchestrate/`) distributes `embodiment` to
  mounted lenses via props. Lenses never re-derive what embody exposes;
  they also do not import embody directly — they receive `embodiment`
  from the orchestrator.

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

## Phase A — mock embody (current)

`embody/index.ts` currently ships a **mock factory** that returns
hand-shaped `Snippet` instances dispatched by sentinel comments in the
input source. The mock unblocks orchestrator and lens development
before the real Phase B internals (`embody/lib/*`) come online.

The 11 named scenarios are exported as `EMBODY_MOCK_SCENARIOS` so
tests + sandbox demos can construct deterministic inputs:

```typescript
import { embody, EMBODY_MOCK_SCENARIOS } from './embody/index.js';

// Each scenario is a constant whose value is the sentinel comment
// the mock dispatches on (e.g. '/* MOCK_OK */').
const ok = embody(EMBODY_MOCK_SCENARIOS.OK + '\nlet x = 1;');
```

Scenarios cover: `OK`, `FAIL_AT_TOKENIZE`, `FAIL_AT_PARSE`,
`FAIL_AT_CREATE`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES`,
`EVAL_ERROR`, `EVAL_TIMEOUT`, `EVAL_LIMIT`, `EVAL_CANCELLED`. Unknown
sentinels throw — the mock fails loud rather than silently degrading.

> **Anti-pattern: no consumer-side sentinel branching.** Consumers
> (orchestrator, lenses, tests) must never `if (code.includes('/*
> MOCK_…'))` to choose code paths. Branch on the **shape** of the
> returned `Snippet` (e.g. `snippet.parsed === false`,
> `snippet.validation.isJeJ === false`), not on the sentinel that
> produced it. Sentinels are an internal mock dispatch mechanism;
> they will not exist in Phase B. Branching on them ties consumer
> code to scaffolding that is about to disappear.

The Phase B real implementation replaces `embody(code)` internals
without changing the public `Snippet` shape — see the JSDoc on
[`./index.ts`](./index.ts) for the full Phase A → Phase B migration
plan.

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

**Pyramid placement.** embody is **per-snippet operational data** —
the substrate that Layers I–IV (lenses, recommender, path generation)
all consume. It is NOT the pyramid base ("Progress modelling" of the
Malaise & Signer pyramid), which is system-wide learner state owned
by the embedding LMS. embody handles "what does this snippet look
like"; the LMS handles "where is this learner in their journey." See
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles).

## Archive

`.legacy/` holds pre-DDD sketches superseded by the locked design — kept
for archival reference only, not part of the live module.
