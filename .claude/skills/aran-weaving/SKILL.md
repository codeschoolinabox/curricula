---
name: aran-weaving
description:
  Working with the Aran JavaScript instrumentation library (aran@5.2.2) in
  0-curricula. Trigger on any Aran, weaving, aspect, pointcut, advice,
  instrumentation, notional-machine tracing, or semantics-tracer work —
  especially porting the legacy trace/semantics quarry into the greenfield
  evaluators region.
---

# Aran weaving (aran@5.2.2) — semantics tracer

Read the two reference files before writing code:

- `references/api-map.md` — the VERIFIED 5.2.2 API surface (entry points, both
  aspect vocabularies with signatures, configs, semantic facts).
- `references/quarry-map.md` — the legacy quarry's layout, the I-4 dead seam
  (exact file:line inventory), landmines, and the porting sketch.

## 1. Mental model (one page)

Aran instruments by SOURCE TRANSFORMATION, not by VM hooks. The pipeline:

```text
acorn.parse → transpile (ESTree → AranLang IR, your digest tags every node)
            → weaveFlexible (inject advice calls where pointcuts say "cut")
            → retropile (IR → ESTree; standalone mode embeds the intrinsics)
            → astring.generate → an instrumented source STRING you execute
```

Vocabulary: a **join point** is an observable moment (block entry, expression
result, effect, call). A **pointcut** is a weave-time predicate deciding whether
that moment gets an advice call — flexible-API pointcuts receive the AranLang
`(node, parent, root)` and return a **Json point array** that is code-generated
into the call as extra trailing args. **Advice** is the runtime function
receiving `(state, ...moment-specific args, ...point)`. The **aspect** =
pointcuts + advice + initial state. Two APIs exist: **standard** (one advice
object at one global) and **flexible** (each advice its own global, custom point
payloads) — this repo uses FLEXIBLE, and the top-level `instrument()`
convenience only supports standard, so we chain transpile → weaveFlexible →
retropile manually.

Join points for a notional-machine tracer: `block@setup/declaration/ teardown`
(scope stack + variable frames, TDZ = `aran.deadzone_symbol`),
`expression@after` (every produced value — a VALUE TRANSFORMER, must return its
result), `apply@around` / `construct@around` (REPLACE the call — must
`Reflect.apply`/`construct` and return), `effect@before/after` (writes),
`block@before/after/throwing`, `statement@before`. Operators, property access,
template assembly, and global reads/writes surface as intrinsic calls inside
`apply@around` (`aran.performBinaryOperation`, …).

Hard constraints: everything code-generated is JSON (`initial_state`, point
arrays — no functions/Maps; the emission callback is installed worker-side at
setup, never in state). Advice must never throw into learner code. Advice
functions must exist on `globalThis` under the exact pointcut-record keys before
the woven code runs.

## 2. Real API quick-reference

See `references/api-map.md` for full signatures. The load-bearing subset:

- `transpile({root, kind:'eval', situ, path}, {global_declarative_record, digest})`
  — digest is `(node, node_path, file_path, node_kind) => hash`; the hash
  becomes every AranLang node's `tag` (build a hash → JejTag map here).
- `weaveFlexible(root, {initial_state, pointcut})` — pointcut keyed by advice
  GLOBAL NAME:
  `{ kind: '<aspect-kind>', pointcut: (node, parent, root) => Json[] | null }`.
- `retropile(root, {mode:'standalone'})` → ESTree → `astring.generate`.
- **Situ that is actually faithful** (verified, pinned as I-9b): `kind:'eval'` +
  `situ:{type:'global'}` + an injected `'use strict'` directive. The legacy
  `situ:{type:'local',mode:'strict'}` + standalone combo FABRICATES global-read
  values (uninvoked accessor arrows) — never copy it forward.

## 3. Quarry map

Legacy source (READ-ONLY; copy, never modify):
`src/lib/embody/lib/evaluating/trace/semantics/`. Full table in
`references/quarry-map.md`. Orientation:

- **Design of record** = the docs (`README.md`, `DOCS.md`, `tracing/DOCS.md`):
  5-layer event model, dispatcher spec (emit-expression / emit-resolve /
  emit-error), values ride ResolveEvents. Docs are the design target, not a code
  mirror — conform ported code to them.
- **Reusable**: instrument pipeline shape, JejTag + digest/pre-walk, pointcuts,
  gating predicates, event generators + conformance, represent-value, `prepare/`
  config pipeline, scope-stack/lookup logic.
- **Dead residue**: `configuring/` (older duplicate of `prepare/`), `index.ts`
  (`@study-lenses/tracing` never existed), empty `trace.ts`, `link.ts` stub,
  stale vite sandbox paths, tests asserting dropped keys.
- **The I-4 unfinished seam**: the dispatcher split stopped mid-flight — 11
  advice call sites (in expression-after, apply-around, effect-after,
  block-declaration) still pass `value`/`result` keys the reshaped generators
  silently IGNORE, and no resolve dispatcher exists to carry those values. Exact
  file:line inventory in quarry-map. Close the seam by BUILDING the documented
  dispatcher, not by porting the dead keys.

## 4. Landmines

1. **Pre-write value bug** — `weaving/advice/effect-after.ts:32` reads
   `state.lastExpressionResult`, which is fresh only if the RHS was itself cut:
   `let x = 1; x = 2` → the update event reports `1`.
2. **Conformance `Equal` tie-back covers FLAT events only** — discriminated
   events (Binding/Conditional/Loop) get a one-directional check; per-variant
   field drift is invisible to tsc.
3. **Legacy situ fabricates global reads** (§ 2) — the single biggest
   correctness trap when copying `instrument.ts`.
4. **Pause economics** — advice fires at EXTREME frequency (every literal, read,
   operator). Each emitted event costs postMessage + a potential Atomics pause.
   Gate worker-side BEFORE emit, twice: weave-time (disabled gate ⇒ no advice
   call woven ⇒ zero runtime cost) and runtime (range / filters / caps drop
   before transport). Never emit-then-filter.
5. **Drift status** (probed 2026-07-27): no 5.2.2 hook renames — all 11 used
   aspect kinds and advice signatures match the installed declarations. The
   compile failures are INTERNAL: `TracerState` was reshaped (advice still reads
   dropped `state.config`/`state.step`; initialState lacks new required fields),
   `FunctionReturnEvent`/`WithEvent` type imports dangle, and the weave call
   site needs `Json`-typed state and literal-typed pointcut kinds. Details in
   quarry-map.
6. Filter Aran noise everywhere user-facing: `ARAN_PARAMETERS`, `.`-prefixed
   variables, `$`-prefixed labels.

## 5. Porting guidance (semantics-tracer sprint)

Greenfield home: `src/lib/study-lenses/evaluators/tracers/semantics/` driving
the shared engine `src/lib/study-lenses/lib/engine/` (`evaluate(spec)`).

- Main thread: port the instrument pipeline (I-9b situ), build + freeze the
  acyclic ast record at instrument time.
- Worker: a THIN entry calling the engine's `bootstrap(workerSetup)`; the
  `WorkerSetup` registers `_jej_*` advice as returned globals, wires `api.emit`
  as the emission callback, takes the runtime gate bundle via `workerConfig`. NO
  bespoke SAB protocol / pause handshake / io traps — all engine-owned
  (`api.call` for round-trips).
- Keep `new Worker(new URL('./entry.ts', import.meta.url), {type:'module'})`
  syntactically adjacent in `workerFactory` (static bundler detection; both
  constraints load-bearing).
- Build the dispatcher per `tracing/DOCS.md`: one step counter bumped after
  gates, visit counts in emit-resolve before gates, values on ResolveEvents.
- Deps already present: `aran ^5.2.2`, `acorn`, `astring`, `estree-walker`,
  `ajv`.
