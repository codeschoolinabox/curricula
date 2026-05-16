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

- **Status booleans** — independent hard gates (`tokenized`, `parsed`,
  `validated`, `created`) that lenses check before reaching for fields
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

## Named scenarios

`embody(code)` recognizes a small fixed set of **scenarios** — exact-match
strings (after normalization) that bypass real composition and return a
deterministic canned `Snippet` shape per named scenario. These canned
scenarios are a **permanent integration-testing fixture set** kept inside
`embody()` because the orchestrator, lenses, and recommender all need a
way to drive every reachable Snippet shape without crafting real JS that
happens to produce that shape. Tests and sandbox harnesses are the
primary consumers; the live editor passes them through transparently,
which is acceptable because the resulting Snippet is shape-valid.

### Pipeline and shape leaves

The construction pipeline is a hard-gated staircase: **tokenize → parse →
validate → create**. Each gate can fail, producing a structurally
distinct embodiment shape. Failure means downstream surfaces are absent
(no event streams for programs that won't run). Five total **shape
leaves** result:

The "Has" column accumulates top-to-bottom: each row's contents include
all prior rows' contents plus the listed additions. (The staircase
comment in [`types.ts`](./types.ts) Snippet JSDoc carries the same
convention, with explicit `+` deltas.)

| Leaf | Reached when | `Snippet.status` | Has | Missing |
| --- | --- | --- | --- | --- |
| **tokenize-fail** | tokenize fails | `tokenized=false` | source, partial `parse.tokens`, errors, `streams.realm`, `streams.parse.{tokenize, parse}` (parse stream yields no events) | `parse.ast`, `static`, `validation`, `streams.create`, `streams.evaluate` |
| **parse-fail** | parse (AST-build) fails | `tokenized=true, parsed=false` | + full `parse.tokens` (the type-paired parse stream already exposed from tokenize-fail, still no AST to walk so emits nothing) | `parse.ast`, `static`, `validation`, `streams.create`, `streams.evaluate` |
| **validate-fail** | `validation.isJeJ === false` | `parsed=true, validated=false` | + `parse.ast`, `parse.comments`, `static`, `validation` (with violations populated) | `streams.create`, `streams.evaluate` |
| **create-fail** | script-scope creation fails | `validated=true, created=false` | + clean `validation` (isJeJ=true), `streams.create` (partial events up to the failure) | `streams.evaluate` |
| **apex** | all gates pass | all true | + `streams.evaluate` (complete `streams.create` events) | — |

Validation is a **hard gate**, not a metadata field: a program that fails
JEJ validation produces no `streams.create` and no `streams.evaluate`
(invalid programs don't run). The gate criterion is `isJeJ`
(`violations.length === 0`); `validation.isDeterministic` and
`validation.doesPause` are **informational metadata** for consumers, not
gate criteria — a non-deterministic or user-pausing program is still a
valid JEJ subset and passes the gate.

### Scenario → leaf mapping

The 11 named scenarios are shortcuts into specific shape leaves. The
non-scenario path traverses the actual pipeline.

| Scenario keyword | Lands at leaf | Overlay |
| --- | --- | --- |
| `FAIL_AT_TOKENIZE` | tokenize-fail | — |
| `FAIL_AT_PARSE` | parse-fail | — |
| `VALIDATION_FAIL` | validate-fail | canned violation |
| `FAIL_AT_CREATE` | create-fail | — |
| `OK` | apex | — |
| `NON_DETERMINISTIC` | apex | `nonDeterminism.random=true` (informational, not a gate failure) |
| `PAUSES` | apex | `hasIo.user.total=1` (informational, not a gate failure) |
| `EVAL_ERROR` | apex | `streams.evaluate.run()` outcome `'errored'` |
| `EVAL_TIMEOUT` | apex | `streams.evaluate.run()` outcome `'timed-out'` |
| `EVAL_LIMIT` | apex | `streams.evaluate.run()` outcome `'limit-exceeded'` |
| `EVAL_CANCELLED` | apex | `streams.evaluate.run()` outcome `'cancelled'` |

`EVAL_*` overlays don't change the Snippet's structural shape (still
apex); they're interpreted by `streams.evaluate.*` at call time to force
the canned outcome on `RunInstance.endReport`. Runtime errors are not
embodied in the static `Snippet` — they're per-call outcomes on
`RunInstance`.

**Normalization rule.** Input is passed through `trim().toUpperCase()`
before the scenario match. Leading and trailing whitespace (including
newlines and other Unicode whitespace stripped by `String.prototype.trim`)
and case differences are tolerated. Internal whitespace, punctuation, and
substrings are not. Scenarios are ASCII; `toUpperCase()` is treated as
locale-independent for the match. Non-string input (`null`, `undefined`,
objects) throws at the boundary — `code.trim()` fails fast on non-string.
Empty-string-after-trim is not a scenario and falls through to real
composition.

```typescript
import embody from './embody/index.js';

embody('OK');             // → frozen OK Snippet
embody('ok');             // → same OK Snippet (case-insensitive)
embody('  OK\n');         // → same OK Snippet (whitespace tolerated)
embody('FAIL_AT_PARSE');  // → frozen Snippet, status.parsed === false
embody('fail_at_parse');  // → same Snippet

// Non-scenario input → real composition
embody('let x = 1;');
embody('O K');            // internal whitespace — not a scenario match
```

On the scenario-dispatch branch, `Snippet.source.code` holds the
**normalized** form (the canonical scenario identifier). Non-scenario
inputs preserve their raw form through real tokenization.

`EMBODY_SCENARIOS` is exported as a frozen array of the 11 valid
scenario keywords for use in test fixtures and sandbox demos. The named
scenarios cover: `OK`, `FAIL_AT_TOKENIZE`, `FAIL_AT_PARSE`,
`FAIL_AT_CREATE`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES`,
`EVAL_ERROR`, `EVAL_TIMEOUT`, `EVAL_LIMIT`, `EVAL_CANCELLED`.

> **Anti-pattern: no consumer-side branching on `snippet.source.code`.**
> Consumers (lenses, orchestrator, recommender, …) MUST NOT use
> `source.code` content as a discriminator — branch on the resulting
> `Snippet`'s `status` / `validation` / `endReport` shape instead. The
> scenario dispatch is a producer affordance; the Snippet shape is the
> consumer surface. Lenses MAY read `source.code` to *render* it (a
> source-display lens is legitimate); what they MAY NOT do is use
> `source.code` as a branching key. Test code IS allowed to call
> `embody('FAIL_AT_PARSE')` as setup — that's *using* the affordance,
> not *branching* on it. A side-effect of scenario dispatch is that
> source-display lenses will render the scenario keyword verbatim
> (e.g. `OK`) when a scenario is in play; that's a known dev/debug
> trade-off, intentional rather than accidental.

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
