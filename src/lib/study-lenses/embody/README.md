# embody

`embody(code, { type })` is the **operational embodiment of the JEJ notional
machine**. It takes any JavaScript source string — plus a **source type**
(`'script' | 'module'`, default `'module'`) — and returns a frozen-data +
event-stream object representing the snippet as the machine treats it. A
JS-generic core reads the text (tokens, AST) for any code; the
just-enough-javascript **language level** supplies the NM's semantic models
(realm, creation, evaluation) behind an **admission gate** that runs only on
module-type snippets once they parse.

embody is one rung of the conceptual chain (see [../README.md](../README.md)):

```text
JEJ  →  NM  →  embody  →  study lenses  →  orchestrate
```

- The **NM**
  ([../embody/language-levels/just-enough-javascript/notional-machine.md](../embody/language-levels/just-enough-javascript/notional-machine.md))
  defines what concepts exist (phases, scopes, bindings, coercion, …).
- **embody** turns each snippet into a data object: core phases (source,
  tokenize, parseAST) for any JavaScript; the full NM correspondence — every
  field and event mapping to an NM concept — for admitted JEJ.
- **Study lenses** consume `embodiment` to render pedagogical perspectives on
  it.
- **The orchestrator** (`orchestrate/`) distributes `embodiment` to mounted
  lenses via props. Lenses never re-derive what embody exposes; they also do not
  import embody directly — they receive `embodiment` from the orchestrator.

embody is **not** part of the package's public API. The public surface is the
`<StudyLenses>` orchestrator component (see [`../README.md`](../README.md) §
Public API). This module is the internal data layer that `<StudyLenses>` builds
on.

Embody decides nothing about pedagogy. The contract is _accuracy_. Lenses choose
what to teach.

## Glossary

This module uses a three-layer vocabulary for NM entities. Terms are defined
here; types are in [`types.ts`](./types.ts).

**Data** — Layer 1. Pure data describing an NM entity in isolation — kind,
value, range, name. No cross-references to other entities. Type names follow
`<Kind>Data`: `TokenData`, `NodeData`, `ScopeData`, `CommentData`,
`RealmBindingData`, `ScriptBindingData`. Accessed via `.data` on any phase
object.

**Entwined** — Layer 2. Wraps data and adds typed cross-references to other
entwined entities (parent nodes, containing scope, adjacent tokens). This is the
graph. Type names follow `<Kind>Entwined`: `TokenEntwined`, `NodeEntwined`,
`ScopeEntwined`, `CommentEntwined`, `RealmBindingEntwined`,
`ScriptBindingEntwined`. Accessed via `.entwined` on any phase object.

**NodePath** — A dot-style path string identifying an AST node by its position
from the Program root: `$` for Program, then dot-joined ESTree property keys and
numeric array indices, e.g. `$.body.0.declarations.0.init`. The canonical
node-identity format embody defines; validating, intercept, and trace all
identify nodes by it. Injective — every node has a unique NodePath, so `byPath`
holds exactly one entry per node. Stored on every node as `NodeEntwined.path`
(referenced as `nodePath` on analysis/violations, `innermostPath` on tokens —
all `NodePath`-typed); postMessage-safe for crossing the worker boundary.

**byPath** — A frozen `Record<NodePath, NodeEntwined>` on `parseAST.entwined`
mapping each node's `path` to that node. The canonical O(1) resolution from a
path string (carried by an event, or persisted by a lens) back to its entwined
node. Holds the same node references as the tree — an entry-point _into_ the
graph, not a copy.

**byOffset** — A frozen `ReadonlyArray<NodeEntwined>` on `parseAST.entwined`
indexed by source character offset; each slot holds the deepest node whose span
covers that offset (deepest-wins). Every offset in `[0, source.length)` resolves
to at least the Program root — never a hole; `offset === source.length` (EOF) is
out of bounds; zero-width nodes (`start === end`) are unreachable (use
`byPath`). Resolve a `(line, column)` to an offset via
`source.offsets[line - 1] + column` (column is 0-based), then index this array —
O(1) `(line, column) → node`. The positional counterpart to `byPath`.

**NMEvent** — Layer 3. A moment in the program's lifetime. Wraps an entwined
entity and adds `phase`, `step`, `prev`/`next` chain links, and `relations`
(bookending pairs, correlated events). Type names follow `<Kind>NMEvent`:
`TokenNMEvent`, `CommentNMEvent`, `NodeNMEvent`, `ScopeNMEvent`, etc. Access
pattern within an event: `event.entwined.data.kind`.

**Three-layer framework** — The design principle (Data → Entwined → NMEvent).
Every NM component has all three layers, no exceptions. Layers are composed by
wrapping, not extension.

**Crystallized data** — The static, frozen portion of a snippet: tokens,
comments, AST, scopes, analysis, validation. Computed pre-run and deterministic
across calls. Lives on `snippet.*` phase objects.

**Living stream** — An event-stream replay of the snippet's lifetime from realm
through evaluation. Calling a stream generator replays crystallized data as
ordered events. Tokenization-the-verb is as dynamic as runtime from the
stream-consumer's perspective.

**Bookending event** — Events that come in opener/closer pairs around a
structural construct (NodeEnterNMEvent/NodeExitNMEvent, scope push/pop, …). The
pair is exposed via `.relations` on each event in the pair.

**Correlated event** — Any event linked to another by structural meaning;
exposed via `.relations`. Link targets are getters (frozen-emit constraint: the
linked event may not exist when the opener is emitted).

**Layer-first event access** — `snippet.events.tokenize()` is equivalent to
`snippet.tokenize?.events()` but always safe — returns an empty generator when
the phase is null, never throws. Only the `.events` axis has this layer-first
access. The `.data` and `.entwined` layers are phase-first only.

**Source type** — `'script' | 'module'`, the program-type input to
`embody(code, { type })`, carried on `snippet.type`. Selects the spec parse goal
(acorn `sourceType`) and the execution semantics at run. Module is the default
and the NM-study posture; script is the validator-free posture — the admission
gate never runs, so every language-level phase is null.

**Language level** — a plugin inside [`language-levels/`](./language-levels/)
providing (1) the semantic models for the NM's realm, creation, and evaluation
phases and (2) a validator as admission gate guaranteeing those models never lie
about admitted programs. Semantic, not syntactic: the syntax restriction derives
from what the models cover. `just-enough-javascript` is the first and only
language level today.

**Admission gate** — the language level's validator; runs iff
`type === 'module'` and the snippet parsed. Gate criterion: `validation.isJeJ`
(zero violations). Not a linter — admission to the level's semantic models. The
admission gate is the validate stage of the hard-gated staircase — one gate
among the staircase's gates, and the only one the language level owns (tokenize
and parse are JS-generic).

## What you get from `embody(code)`

```text
const snippet = embody(code);                       // module by default
const scripty = embody(code, { type: 'script' });   // validator-free posture
```

`snippet` is a frozen `Snippet` (see [`types.ts`](./types.ts)) with a
two-dimensional property grid:

- **Phase axis** — spec-grounded JS lifecycle phases: `realm`, `tokenize`,
  `parseAST`, `creation`, `evaluation`
- **Layer axis** — three layers: `.data` (L1), `.entwined` (L2), `.events` (L3)

```text
                   realm          tokenize          parseAST          creation          evaluation
.data         RealmData       TokenizeData      ParseASTData      CreationData      (none — dynamic)
.entwined     RealmEntwined   TokenizeEntwined  ParseASTEntwined  CreationEntwined  (none — dynamic)
.events       events()        events()          events()          events()          events.{ run, intercept, trace.* }
```

Phase-first access:

```ts
snippet.realm.data; // RealmData
snippet.tokenize.entwined; // TokenizeEntwined — entwined tokens + comments
snippet.parseAST.events(); // Generator<NodeNMEvent>
snippet.creation.data; // CreationData — static scopes + bindings
snippet.evaluation.events.run(); // Promise<RunInstance>
```

Layer-first access — **events only** (the `.data` and `.entwined` layers are
phase-first only):

```ts
snippet.events.realm(); // === snippet.realm.events() — always safe
snippet.events.tokenize(); // safe even if snippet.tokenize === null; yields nothing
snippet.events.evaluation.run(); // === snippet.evaluation.events.run()
```

**Nullable phase objects.** `tokenize`, `parseAST`, `creation`, and `realm` are
`Phase | null`. `tokenize`/`parseAST`/`creation` are null when the corresponding
status flag is false; `realm` — a language-level model — is null exactly when no
language level is active (`type === 'script'`). `evaluation` is always present.
Gate on `snippet.status` (and `snippet.type`) before reaching for nullable phase
objects. Under `type === 'script'`, `snippet.events.realm()` (layer-first)
yields an empty generator — the always-safe layer-first contract holds for realm
like any null phase.

**Evaluation exception.** `snippet.evaluation` has only `.events` — no `.data`
or `.entwined`. Evaluation data is fully dynamic and lives only on `RunInstance`
events; nothing is crystallized. Static analyses _about_ evaluation
(reachability, control-flow predictions) live on `snippet.analysis`, not on
`snippet.evaluation`.

**Cross-phase flat fields** (not on the grid):

- **`type`** — `'script' | 'module'` — the source type this snippet was embodied
  as (the second `embody` argument; module by default)
- **`source`** — `{ code, offsets }` — input string + line-offsets index for
  `loc` lookups
- **`status`** — `{ tokenized, parsed, validated, created }` — hard-gate
  booleans; check before reaching for nullable phase objects
- **`errors`** — first-fail-wins error from any pre-evaluation gate, or `null`
- **`analysis`** — cross-phase derived analyses: `bindings`, `dependencies`,
  `features`, `metrics`, `controlFlow`, `nonDeterminism`, `hasIo`
- **`validation`** — gate output: `isJeJ`, `isDeterministic`, `doesPause`,
  `formatted`, `violations`
- **`raw`** — flat Acorn provenance: `{ tokens, ast, comments }` — raw Acorn
  output verbatim

`analysis` and `validation` are cross-phase gate outputs, not grid phases. On
module-type snippets they are present from `validate-fail` onward; on
script-type snippets they are always null — the validate stage never runs
without a language level (see § Pipeline and shape leaves below).

## Events (the only callable surface)

Generators are the only callable thing on a Snippet. Static-side generators
iterate pre-computed frozen data; evaluate-side generators run a Worker live.

| Stream                   | Phase-first access                                 | Returns                                     | Purpose                                        |
| ------------------------ | -------------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| realm                    | `snippet.realm.events()`                           | `Generator<RealmNMEvent>`                   | Realm setup — intrinsics scope then host scope |
| tokenize                 | `snippet.tokenize?.events()`                       | `Generator<TokenNMEvent \| CommentNMEvent>` | Tokens + comments interleaved in source order  |
| parseAST                 | `snippet.parseAST?.events()`                       | `Generator<NodeNMEvent>`                    | AST traversal — bookended enter/exit pairs     |
| creation                 | `snippet.creation?.events()`                       | `Generator<ScopeNMEvent \| BindingNMEvent>` | Script-scope creation events                   |
| evaluate.run             | `snippet.evaluation.events.run(opts?)`             | `Promise<RunInstance>`                      | End-report only (no event stream)              |
| evaluate.intercept       | `snippet.evaluation.events.intercept(opts?)`       | `EvaluateHandle`                            | I/O + error events (live worker)               |
| evaluate.trace.variables | `snippet.evaluation.events.trace.variables(opts?)` | `EvaluateHandle`                            | + light variables-only instrumentation         |
| evaluate.trace.syntax    | `snippet.evaluation.events.trace.syntax(opts?)`    | `EvaluateHandle`                            | + NM step events                               |
| evaluate.trace.semantics | `snippet.evaluation.events.trace.semantics(opts?)` | `EvaluateHandle`                            | + finer-grained internals                      |

`RealmNMEvent` discriminates by `kind: 'intrinsics-created' | 'host-created'`.
`NodeNMEvent` discriminates by `kind: 'enter' | 'exit'` (bookended pairs linked
via `.relations`).

Static-phase stream functions are also reachable via layer-first access —
`snippet.events.realm()`, `snippet.events.tokenize()`, etc. —
reference-identical to the phase-first functions. `snippet.events.evaluation` is
reference-identical to `snippet.evaluation.events`.

Layer-first stream access is **always safe** — `snippet.events.tokenize()` never
throws even if `snippet.tokenize` is null; it returns an empty generator.
Phase-first access (`snippet.tokenize?.events()`) requires optional chaining for
nullable phases.

Evaluate-tier events are a flat discriminated union; tiers are filter
whitelists, not type-narrowed subsets. Each call returns a `RunInstance` with
the events that fired plus an end-report.

Streaming handles (`intercept`, `trace.*`) expose `.cancel()` and
`.fail(reason?)` — `fail` is the structured consumer-driven stop, resolving
`result` with `endReport.outcome: 'failed'` and the reason on
`endReport.failReason`. `run()` returns a bare `Promise<RunInstance>` with
neither (no mid-stream surface to decide a stop from).

**Runnability is tiered.** The plain `run()` tier serves any snippet that parsed
— script or module, admitted or not (the program may still error at runtime;
that is the lesson). The NM-instrumented tiers (`intercept`, `trace.*`) require
`status.created` — they replay the language level's machine, which exists only
for admitted programs. Below its gate, a tier short-circuits with
`endReport.outcome: 'not-runnable'`.

## Load-bearing principles (do not violate without explicit decision)

1. **Pure data, no methods.** Every embody surface is data: frozen objects,
   arrays, primitives. Generators are the only callable surface (event streams
   are inherently iterated). No `query()`, `dispose()`, `clone*()`, or accessor
   methods.
2. **No Maps/Sets at the public surface.** `Object.freeze` doesn't freeze them;
   pedagogy prefers ground-truth shapes. Use `Record<string, T>` for indexes and
   `ReadonlyArray<T>` for sequences. embody ships the canonical
   node-identity/position indexes (`parseAST.entwined.byPath` / `.byOffset`);
   lenses build only _pedagogy-specific_ groupings on top.
3. **Strict immutability.** Single deep-freeze at end of construction. Consumers
   wanting a mutable copy `structuredClone` themselves.
4. **Per-instance, no shared state.** No module-level cache, no cross-instance
   communication. One `embody(code)` knows nothing of others.
5. **Spec-aligned, learner-named.** Names follow the NM body (learner-
   friendly); spec correspondence is in
   `../embody/language-levels/just-enough-javascript/notional-machine.md`.
6. **`event.bindings` is a Proxy.** The one exception to "pure frozen data":
   this field walks the current scope chain at access time and is documented as
   a computed view. Enumeration and mutation are not supported.

## Named scenarios

`embody(code)` recognizes a small fixed set of **scenarios** — exact-match
strings (after normalization) that bypass real composition and return a
deterministic canned `Snippet` shape per named scenario. These canned scenarios
are a **permanent integration-testing fixture set** kept inside `embody()`
because the orchestrator, lenses, and recommender all need a way to drive every
reachable Snippet shape without crafting real JS that happens to produce that
shape. Tests and sandbox harnesses are the primary consumers; the live editor
passes them through transparently, which is acceptable because the resulting
Snippet is shape-valid.

### Pipeline and shape leaves

The construction pipeline is a hard-gated staircase, branched by source type.
Module (the default): **realm → tokenize → parse → validate → create** — realm
always passes; each subsequent gate can fail, producing a structurally distinct
embodiment shape. Script: **tokenize → parse** — the core phases only; no
language level is active, so no realm model, no admission gate, and nothing
beyond parse.

The "Phase objects present" column lists which `snippet.*` phase objects are
non-null. `evaluation` is always present (events always callable, though may
yield nothing when prior phases failed).

| Leaf              | Reached when                 | `Snippet.status`                                                           | Phase objects present                         | Phase objects null                 |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------- |
| **tokenize-fail** | tokenize fails               | `tokenized=false`                                                          | `realm`, `evaluation`                         | `tokenize`, `parseAST`, `creation` |
| **parse-fail**    | AST-build fails              | `tokenized=true, parsed=false`                                             | `realm`, `tokenize`, `evaluation`             | `parseAST`, `creation`             |
| **validate-fail** | `validation.isJeJ === false` | `parsed=true, validated=false`                                             | `realm`, `tokenize`, `parseAST`, `evaluation` | `creation`                         |
| **create-fail**   | script-scope creation fails  | `validated=true, created=false`                                            | `realm`, `tokenize`, `parseAST`, `evaluation` | `creation`                         |
| **apex**          | all gates pass               | all `true`                                                                 | all phases                                    | —                                  |
| **script-parsed** | script-type snippet parses   | `tokenized=true, parsed=true` (`validated`/`created` structurally `false`) | `tokenize`, `parseAST`, `evaluation`          | `realm`, `creation`                |

The validate-fail, create-fail, and apex leaves are module-only (`realm` present
— the language level is active even when its admission gate refuses);
tokenize-fail and parse-fail occur under both types, carrying `realm` per-type
(present on module, null on script). **script-parsed** is the script-type
terminal: parsing succeeded and the staircase is complete — no language-level
phase exists, `validation` and `analysis` are null, and `validated`/`created`
are structurally false rather than failed.

On module-type snippets, `snippet.analysis` and `snippet.validation`
(cross-phase flat fields) are present from `validate-fail` onward.

`snippet.events.tokenize()`, `snippet.events.parseAST()`, etc. are always
callable via layer-first access; null or absent phases yield empty generators.

Validation is the language level's **admission gate**, not a metadata field —
itself one hard gate of the staircase, distinct from the JS-generic gates
(tokenize, parse), and scoped to the level: it runs only on module-type snippets
that parsed. A program that fails it produces no `creation` phase object and no
NM-instrumented evaluate events (`intercept`, `trace.*`); the plain `run()` tier
remains available to anything that parsed (see § Events — runnability is
tiered). `validation.isDeterministic` and `validation.doesPause` are
informational metadata for consumers, not gate criteria — a non-deterministic or
user-pausing program is still valid JEJ and passes the gate.

### Scenario → leaf mapping

The 11 named scenarios are shortcuts into specific shape leaves. The
non-scenario path traverses the actual pipeline.

| Scenario keyword    | Lands at leaf | Overlay                                                          |
| ------------------- | ------------- | ---------------------------------------------------------------- |
| `FAIL_AT_TOKENIZE`  | tokenize-fail | —                                                                |
| `FAIL_AT_PARSE`     | parse-fail    | —                                                                |
| `VALIDATION_FAIL`   | validate-fail | canned violation                                                 |
| `FAIL_AT_CREATE`    | create-fail   | —                                                                |
| `OK`                | apex          | —                                                                |
| `NON_DETERMINISTIC` | apex          | `nonDeterminism.random=true` (informational, not a gate failure) |
| `PAUSES`            | apex          | `hasIo.user.total=1` (informational, not a gate failure)         |
| `EVAL_ERROR`        | apex          | `evaluation.events.run()` outcome `'errored'`                    |
| `EVAL_TIMEOUT`      | apex          | `evaluation.events.run()` outcome `'timed-out'`                  |
| `EVAL_LIMIT`        | apex          | `evaluation.events.run()` outcome `'limit-exceeded'`             |
| `EVAL_CANCELLED`    | apex          | `evaluation.events.run()` outcome `'cancelled'`                  |

`EVAL_*` overlays don't change the Snippet's structural shape (still apex);
they're interpreted by `evaluation.events.*` at call time to force the canned
outcome on `RunInstance.endReport`. Runtime errors are not embodied in the
static `Snippet` — they're per-call outcomes on `RunInstance`.

**Normalization rule.** Input is passed through `trim().toUpperCase()` before
the scenario match. Leading and trailing whitespace (including newlines and
other Unicode whitespace stripped by `String.prototype.trim`) and case
differences are tolerated. Internal whitespace, punctuation, and substrings are
not. Non-string input (`null`, `undefined`, objects) throws at the boundary —
`code.trim()` fails fast on non-string. Empty-string-after-trim is not a
scenario and falls through to real composition.

```typescript
import embody from './embody/index.js';

embody('OK'); // → frozen OK Snippet
embody('ok'); // → same OK Snippet (case-insensitive)
embody('  OK\n'); // → same OK Snippet (whitespace tolerated)
embody('FAIL_AT_PARSE'); // → frozen Snippet, status.parsed === false
embody('fail_at_parse'); // → same Snippet

// Non-scenario input → real composition
embody('let x = 1;');
embody('O K'); // internal whitespace — not a scenario match
```

On the scenario-dispatch branch, `snippet.source.code` holds the **normalized**
form (the canonical scenario identifier). Non-scenario inputs preserve their raw
form through real tokenization.

Scenario snippets are module-typed (`snippet.type === 'module'`) regardless of
the `type` option passed — they are canned module-shape fixtures; the option
affects only real composition.

`EMBODY_SCENARIOS` is exported as a frozen array of the 11 valid scenario
keywords for use in test fixtures and sandbox demos. The named scenarios cover:
`OK`, `FAIL_AT_TOKENIZE`, `FAIL_AT_PARSE`, `FAIL_AT_CREATE`, `VALIDATION_FAIL`,
`NON_DETERMINISTIC`, `PAUSES`, `EVAL_ERROR`, `EVAL_TIMEOUT`, `EVAL_LIMIT`,
`EVAL_CANCELLED`. The set is exhaustive over `run()`-reachable outcomes — not
over all outcomes: `'failed'` has no scenario keyword because it is reachable
only through a live `.fail(reason)` on a streaming handle (see
[DOCS.md](./DOCS.md) § Consumer-driven stops).

> **Anti-pattern: no consumer-side branching on `snippet.source.code`.**
> Consumers (lenses, orchestrator, recommender, …) MUST NOT use `source.code`
> content as a discriminator — branch on the resulting `Snippet`'s `status` /
> `validation` / `endReport` shape instead. The scenario dispatch is a producer
> affordance; the Snippet shape is the consumer surface. Lenses MAY read
> `source.code` to _render_ it (a source-display lens is legitimate); what they
> MAY NOT do is use `source.code` as a branching key. Test code IS allowed to
> call `embody('FAIL_AT_PARSE')` as setup — that's _using_ the affordance, not
> _branching_ on it. A side-effect of scenario dispatch is that source-display
> lenses will render the scenario keyword verbatim (e.g. `OK`) when a scenario
> is in play; that's a known dev/debug trade-off, intentional rather than
> accidental.

## How to read this directory

| File                                     | Audience                                                                                | Purpose                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `README.md` (this)                       | Contributors                                                                            | What embody is, navigation                                                                         |
| [`types.ts`](./types.ts)                 | embody implementers, orchestrator authors, lens authors (for typing `embodiment` props) | **Canonical contract** — every type, fully documented                                              |
| [`DOCS.md`](./DOCS.md)                   | Implementers, reviewers                                                                 | Architecture: why these decisions, data flow, tradeoffs                                            |
| [`language-levels/`](./language-levels/) | LL authors, implementers                                                                | Language-level plugins — semantic models + admission gates; `just-enough-javascript/` is the first |

For prose explanation of the NM concepts each type maps to, see
[`../embody/language-levels/just-enough-javascript/notional-machine.md`](../embody/language-levels/just-enough-javascript/notional-machine.md).

## Conceptual link to the NM

Every `embody/types.ts` shape corresponds to a concept in `notional-machine.md`:

| embody type                                  | NM concept                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Source`                                     | Phase 0 — source code (string + offsets)                                                  |
| `TokenData`, `TokenEntwined`                 | Phase 1 — token data (kind, value, range) + token graph node (prev/next, innermostNode)   |
| `CommentData`, `CommentEntwined`             | Phase 1 — comment data (kind, range) + comment graph placement                            |
| `NodeData`, `NodeEntwined`                   | Phase 2 — AST node data (type, loc, key fields) + graph node (parent, children, keyToken) |
| `ScopeData`, `ScopeEntwined`                 | Scope lifecycle — intrinsics/host/script/block/for-iteration                              |
| `RealmBindingData`, `RealmBindingEntwined`   | Realm setup — intrinsic + host built-in bindings                                          |
| `ScriptBindingData`, `ScriptBindingEntwined` | Script/block binding lifecycle (tdz → initialized → dead)                                 |
| `ScopeTreeNode`                              | Static scope tree — predicted block/for-iteration scopes under a script scope             |
| `NMEvent` (flat discriminated union)         | Lifecycle event base — phase / step / chain / relations                                   |
| `RunInstance`                                | One evaluation of a snippet                                                               |
| `Validation`, `NonDeterminism`, `HasIo`      | Snippet-level gate output + informational metadata                                        |
| `Analysis`                                   | Cross-phase derived analyses                                                              |

If you're unsure what something means, the NM doc is upstream of the types —
read the prose, then come back to the type.

**Pyramid placement.** embody is **per-snippet operational data** — the
substrate that Layers I–IV (lenses, recommender, path generation) all consume.
It is NOT the pyramid base ("Progress modelling" of the Malaise & Signer
pyramid), which is system-wide learner state owned by the embedding LMS. embody
handles "what does this snippet look like"; the LMS handles "where is this
learner in their journey." See
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles).

## Archive

`.legacy/` holds pre-DDD sketches superseded by the locked design — kept for
archival reference only, not part of the live module.
