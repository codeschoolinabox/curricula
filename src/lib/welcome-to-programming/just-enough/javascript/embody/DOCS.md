# embody — Architecture & Decisions

This module operationalizes the [JEJ Notional Machine](../notional-machine.md)
as a frozen-data + event-stream contract. The conceptual model is upstream
of the data; this document captures **why the data is shaped the way it
is** and the tradeoffs we considered before locking the contract in
[`types.ts`](./types.ts).

## Data flow

A JEJ source string flows through embody as follows. Static analyses on
the left-hand side are computed eagerly during construction. Lifecycle
event streams on the right-hand side are invoked a-la-carte by lenses.

```mermaid
flowchart TB
    src[("source string")]

    subgraph construction["embody(code) — eager construction"]
        direction TB
        tok["tokenize"]
        ast["AST-build"]
        valid["JEJ validate<br/>(metadata gate)"]
        crea["script-scope creation<br/>(GlobalDeclarationInstantiation §16.1.7)"]
        analy["static analyses<br/>(metrics, features, dependencies, hasIo, …)"]
        tok --> ast --> crea
        ast --> valid
        ast --> analy
    end

    src --> construction --> snip[("Snippet<br/>(frozen)")]

    subgraph streams["a-la-carte streams (called by lenses)"]
        direction TB
        rs["streams.realm()"]
        ps["streams.parse.tokenize()<br/>streams.parse.parse()"]
        cs["streams.create()"]
        es["streams.evaluate.{run,intercept,trace.*}()"]
    end

    snip -. exposes .-> rs
    snip -. exposes .-> ps
    snip -. exposes .-> cs
    snip -. exposes .-> es

    es --> ri[("RunInstance<br/>(frozen, per call)")]
```

Status booleans (`tokenized`, `parsed`, `created`) gate which streams /
fields are exposed; lenses guard by checking the relevant boolean before
reaching for fields. See [`types.ts`](./types.ts) for the full contract.

## Why this design

### Pure data, no methods

Every embody surface is data: frozen objects, primitives, arrays.
Generators are the only callable surface (event streams are inherently
iterated). No `query()`, `dispose()`, `clone*()`, no accessor methods,
no derived getters. Anything a lens "needs to do" is spelled out as
iteration + filter over the data.

Why: pedagogy depends on observability. If a lens has to call methods to
reach state, lenses fork into "API users" instead of "data readers." Pure
data means lenses are diff-able, predictable, and trivial to mock for
tests.

### Strict immutability via single deep-freeze

Built mutably during construction (so cross-references can be wired up),
deep-frozen once at the end. No clone-on-access. No closure-backed getters
that hide computation. Frozen objects are safely shareable.

LLM agents (and human collaborators) cannot trust each other not to mutate
returned data. The freeze is a hard guarantee, not a politeness.

### No Maps or Sets at the public surface

`Object.freeze` doesn't freeze Maps or Sets — `frozenObj.someMap.clear()`
silently succeeds. Pedagogy also prefers ground-truth shapes: indexes are
plain `Record<K, V>`, sequences are arrays. Lenses build their own Maps
internally if they want O(1) lookup.

### Per-instance, no shared state

No module-level cache, no cross-instance communication. One `embody(code)`
knows nothing of others. Multiple lenses on the same snippet hold their
own embody instance. (We considered caching deterministic runs; declined
as not worth the complexity for small JEJ programs — see "No evaluate
caching" below.)

### Status booleans, not a discriminated union

Field availability follows the parse-create staircase: tokenize success
unlocks parse, parse success unlocks creation, creation success unlocks
evaluate. We considered modeling this as a TypeScript discriminated union
(`status: 'tokenize-failed' | 'ast-failed' | 'create-failed' | 'ok'`)
but the user preferred independent boolean gates — each is data, no
ceremony to narrow. Lenses guard by `if (snippet.status.parsed) …`.

### Snowball event tiers as filter whitelists

Evaluate-side tiers (`run`, `intercept`, `trace.syntax`, `trace.semantics`)
are not type-narrowed subsets — they are **filter predicates** over a
single flat `Event` discriminated union. Higher tiers strictly include
more event categories. `run` is special: returns a RunInstance with
`events: []` (no event tier).

This avoids the modeling smell of "run ⊂ intercept" being false (run
emits no events at all). The flat union with filter whitelists is honest:
one universe, several views.

### Single static AST shared across runs

Each `evaluate.*` call produces a frozen `RunInstance` whose events
reference the **same single static AST** (snippet.parse.ast) by identity
(`event.node === astNode`). No per-run AST clone. RunInstance carries
run-specific state (events, endReport, finalEnvironment, runMetrics),
plus a back-reference to the snippet for static data.

We considered cloning the AST per run with events attached (matching
intercept's existing pattern). Declined: the clone cost is real, and a
simple `events.filter(e => e.node === node)` covers the lookup ergonomics
without the clone.

### Environment is derivable, not an event

There is no `category: 'environment'` event type. The environment at any
step is derivable by folding `category: 'scope'` (push/pop) and
`category: 'binding'` (declare/initialize/access/update) events from
`static.initialScope` forward. The environment is the substrate other
events happen *in*, not a thing that happens.

Lenses building "memory diagram at step N" fold the deltas; they don't
need a snapshot event. This is more parsimonious and avoids
double-counting state.

### No evaluate-call caching

Each `evaluate.*` call re-runs the worker. JEJ programs are small, runs
are cheap, and cache machinery (mock identity tracking, WeakMap edge
cases, stale-cache confusion) costs more than it saves. Lenses that want
a stable replay hold onto a RunInstance themselves.

### Doubly-linked event refs (data, not OOP)

Events form a doubly-linked list of plain frozen objects with `prev` /
`next` references — same pattern as
`lib/evaluating/intercept`'s `LinkedInterceptEvent`. Lenses can walk by
index (array) or by sequence (linked refs) without arithmetic. Not OOP
nodes — just data with object cross-references.

## `lib/*` integration (coordinated cross-cutting refactor)

embody composes outputs from `lib/parse-old/` (renamed to
`embody/lib/parse/` per REFACTOR-HANDOFF Step 9), `lib/validating/`,
`lib/evaluating/`, `lib/formatting/` into one entwined frozen graph.
The existing `lib/*` functions freeze their outputs by default. To
compose freely, embody needs unfrozen outputs:

```ts
libFn(code, options, _meta?: { freeze?: boolean })
```

`_meta` is underscore-prefixed to signal "embody-only, not part of the
public lib API." Single shape, single use case. This is a coordinated
cross-cutting refactor that **must be sequenced before embody
implementation** — its own plan + AR cycle.

The static-side parse and create generators are **new modules** built for
embody (no equivalent exists in `lib/` today). Implementation: each calls
the existing sync `lib/*` function, then iterates the result and yields
event-wrapped items. Frozen pre-computed event arrays cached on the
snippet; generators just emit from the cached array.

## Spec correspondence

embody is **ECMAScript-spec-aligned**. Every type and event in
[`types.ts`](./types.ts) corresponds to an NM concept which corresponds
to an ECMA-262 abstract operation:

| embody | NM concept | ES2024 op |
| --- | --- | --- |
| `Realm` | Realm setup | `InitializeHostDefinedRealm` (§9.6) |
| `Realm.intrinsics` | ECMA intrinsics | `SetDefaultGlobalBindings` (§9.3.4) |
| `Realm.host` | Host bindings | HTML host hook |
| `ParseGraph` | Parse output | `ParseScript` (§16.1.5) |
| `InitialScope` | Creation phase | `GlobalDeclarationInstantiation` (§16.1.7) |
| `RunInstance` | Evaluation | `ScriptEvaluation` (§16.1.6) + per-Block `BlockDeclarationInstantiation` (§14.2.3) |
| `BindingStatus = 'tdz'` | Uninitialized binding | §9.1.1.1.1 |
| `CoerceEvent kind` | ToPrimitive / ToString / ToNumeric / ToBoolean | §7.1 |

See `../notional-machine.md` § Spec correspondence appendix for the full
mapping including JEJ-pedagogical splits, glossary bridges, and known
imperfections.

## AR history

- **AR-1 (multi-hat design challenge)** — formal AR-1 + ECMAScript
  spec-pedant + pedagogical reviewer + senior-staff software-design
  reviewer (all on Opus). Found two BLOCKERs (realm name collision,
  false-or-generator polymorphism), several IMPORTANTs (snowball
  conceptual model, environment events vs. derivation, host vs.
  ECMA conflation, etc.), and many MINORs. All BLOCKERs and high-leverage
  IMPORTANTs resolved before [`types.ts`](./types.ts) locked.
- **AR-2 (architectural sketch challenge)** — applied to the rewritten
  `notional-machine.md`. Found two BLOCKERs (realm-as-phase confusion,
  declare-after-push micro-ordering not specified) and several
  IMPORTANTs (postfix update return value, prefix/postfix sequencing,
  global-env layer treatment, etc.). All BLOCKERs and high-leverage
  IMPORTANTs resolved before this DOCS.md was written.

## Status

embody ships in **two phases** per
[`../DOCS.md` § Locked decisions § Mock-first implementation strategy](../DOCS.md):

| File / artifact | Phase A state | Phase B state |
| --- | --- | --- |
| [`types.ts`](./types.ts) | Locked (canonical contract) | Unchanged (any update is a separate doc commit with full AR-1 + AR-2) |
| [`README.md`](./README.md) | Written; status section reflects Phase A | Finalized in REFACTOR-HANDOFF Step 14 |
| `DOCS.md` (this) | Written; status section reflects Phase A | Finalized in REFACTOR-HANDOFF Step 14 |
| `embody/index.ts` (factory) | **Mock**: input-discriminated, frozen, type-conformant; no `lib/*` invocation | Real composition of `embody/lib/*` outputs |
| `embody/lib/*` modules | Not started (live in `javascript/lib/` pre-refactor) | Each lands as its own DDD/AR increment per [`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md) |
| Tests | Mock-shape tests (freeze, status modes, override builder) | Real-impl tests per module |

`.legacy/` holds pre-DDD sketches (plann.txt, plann.excalidraw.svg,
parse-phase-error-categorization.js) — superseded by the locked design,
kept for archival reference only.

## Open specs (placeholders)

These are scoped open questions that DDD Phase 1 will resolve. Documented
here so implementers know they are *not* part of the locked contract:

- **RunInstance entwinement details** — exact relationship between
  `events`, `node` references, `prev/next` linked-list, and any
  derived indexes lock during DDD per `lib/evaluating/intercept`'s
  `LinkedInterceptEvent` + `InterceptResult` prior art.
- **Per-category event payloads** — the kinds within each category
  (`expression: 'literal' | 'identifier' | …`, `coerce: 'ToPrimitive' |
  'ToString' | …`, etc.) are sketched in [`types.ts`](./types.ts) but
  the full payload-shape per kind locks during DDD as event emission is
  implemented.
- **`Distribution` shape for `metrics`** — currently `{ min, max, mean,
  median, samples }`. Whether to expose `samples` as raw arrays vs.
  pre-computed stats only locks once we see how lenses consume them.
- **`HasIo` per-method counts vs. only sums** — currently per-method
  with convenience totals. Could simplify to sums only if lenses don't
  need per-method detail.
- **`features` enumeration** — the boolean record of language-feature
  usage may grow as lenses pull on it.
- **`lib/*` `_meta` shape** — currently `{ freeze?: boolean }`. May
  expand if other internal-only flags become necessary during the
  coordinated refactor.
