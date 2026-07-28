# Quarry map — src/lib/embody/lib/evaluating/trace/semantics/

READ-ONLY reference (copy, never modify). ~165 files. Excluded from
typecheck/lint/test by root `tsconfig.json` + eslint — compile-health was
unverified until the 2026-07-27 scoped probe below. The tree carries a DEAD
mid-flight campaign: the docs describe the DESIGN TARGET (dispatcher split +
resolve machinery), the code stopped at increment I-4.

All paths below are relative to the quarry root.

## Layout — where each concern lives

| Path | Concern | Port status |
| --- | --- | --- |
| `README.md`, `DOCS.md` | Tracer contract: 5-layer mental model (ast/resolve/expression/statement/scope), event-category table, phase map (Gate → Prepare → Instrument → Run/emit → Index) | **DESIGN OF RECORD** — docs are the target, not a code mirror |
| `tracing/DOCS.md` | Pipeline architecture + pinned mechanisms (I-9b situ fix, UpdateExpression pre-walk, dispatcher spec, BaseEvent shape) | **DESIGN OF RECORD** |
| `tracing/instrument.ts` | Main-thread pipeline: pre-walk → acorn parse → digest/tagMap → `transpile` → `createAspect` → `weaveFlexible` → `retropile({mode:'standalone'})` → `astring.generate` | Reusable SHAPE; the situ/standalone config is the mistracing legacy — replace per I-9b (api-map.md § semantic facts) |
| `tracing/weaving/create-aspect.ts` | Builds `{pointcut, adviceGlobals, initialState}`; wraps pointcuts so hash tags resolve to JejTag objects via tagMap | Reusable; initialState is stale vs the reshaped `TracerState` type |
| `tracing/weaving/types.ts` | `JejTag` (digest-time ESTree metadata: loc/node/source/nodePath + sparse semantic fields) + reshaped `TracerState` | JejTag: reusable as-is. TracerState: TYPE is post-campaign, CODE is pre-campaign — reconcile before porting |
| `tracing/weaving/pointcut/*.ts` | block (always cuts; derives scopeKind/segmentKind from AranLang parent), expression (test-position / Primitive / Read / Conditional dispatch), apply (intrinsic-name discriminants), effect, statement | Reusable — weave-time gating pattern is the pause-economics defense |
| `tracing/weaving/advice/*.ts` | 11 flexible-API advice + `emit-event.ts`, `gating.ts`, `scope-stack.ts`, `lookup-variable.ts`, `aran-parameters.ts` | Logic largely reusable; carries the I-4 dead keys + the two state-shape drifts below |
| `tracing/event-generators/**` | Config-mirroring generator namespace (`generators.ts`); one factory per event; `conformance.ts` compile-time tie-back; `create-trace-event.ts` (path-resolved dispatch + deep-freeze) | Reusable; half migrated to values-on-ResolveEvent (see I-4) |
| `tracing/represent-value/` | Worker-side tagged value representation (survives clone boundary) | Reusable |
| `tracing/index.ts` | Async-generator entry: instrument → spawn worker → stream events → TraceResult | REPLACE — bespoke worker/SAB plumbing is the engine's job now |
| `tracing/trace-worker.ts` | Bespoke worker: advice registered on `globalThis` (`_jej_*`), SAB I/O traps (prompt/confirm/alert), per-event pause handshake, `new Function(code)()` | REPLACE with a thin engine worker entry + `WorkerSetup` |
| `tracing/link.ts` | STUB — attaches empty ASTNode sentinel; real link = `ast[event.nodePath]` (Capstone) | Design note only |
| `prepare/` | NEW config pipeline (Prepare phase: expand → fill → validate → cross-field; returns ResolvedTraceOptions + range/cap/seconds/dialog) | Port THIS one |
| `configuring/` | OLD config pipeline (pre-campaign duplicate of `prepare/`) | Dead residue — do not port |
| `verify-options/`, `options-schema.ts`, `options.schema.json` | ajv schema + verifyOptions | Reusable |
| `index.ts` | Wires `@study-lenses/tracing` — a package that DOES NOT EXIST (never vendored) | Dead — greenfield exports the engine handle instead |
| `trace.ts` | EMPTY file (0 lines) | Residue |
| `sandbox.html` + `vite.sandbox.config.ts` | Manual browser sandbox (COOP/COEP for SAB); config sidebar drives `createTracingGenerator` | Pattern reusable; vite config's `root`/usage paths are STALE (pre-embody `src/lib/study-lenses/evaluating/trace/`) |
| `claude-chat.txt`, `.DS_Store`, `PHASE-1` remnants | Noise | Ignore |

## The aspect actually woven (all flexible API)

Registered under `_jej_*` advice-global names; hooks used: `block@setup`,
`block@before`, `block@declaration`, `block@after`, `block@throwing`,
`block@teardown`, `expression@after`, `apply@around`, `effect@before`,
`effect@after`, `statement@before`. Block/scope hooks are ALWAYS cut (scope
stack must exist even with scope events off); the rest register only when a
composite gate (`isAny*Enabled`) says some config path needs them. The block
pointcut's point array is `[parentType, scopeKind, segmentKind, tag,
userLabel]`; expression points start with a discriminant string
(`'literal' | 'read' | 'test' | 'shortCircuiting'`); apply points with the
intrinsic name or `'template'` / `'call'`.

## The I-4 unfinished seam (dead campaign) — exact inventory

The campaign moved expression VALUES off expression events onto paired
`ResolveEvent`s ("the ResolveEvent IS the result") and specced a dispatcher
(`emit-expression` / `emit-resolve` / `emit-error`, per `tracing/DOCS.md`).
Generators were reshaped; the dispatcher and resolve emission were NEVER
BUILT; advice still calls the single `emit-event.ts`. Result: **11 advice
call sites pass `value:`/`result:` keys the generators silently DROP** — the
values reach nothing:

| Advice file : line | Emit path | Dropped key |
| --- | --- | --- |
| `expression-after.ts:40` | `literals.*` | `value` |
| `expression-after.ts:61` | `bindings.read` | `value` |
| `expression-after.ts:116` | `operators.shortCircuiting` | `result` |
| `apply-around.ts:56` | `operators.pure.*` (binary) | `result` |
| `apply-around.ts:75` | `operators.pure.*` (unary) | `result` |
| `apply-around.ts:92` | `propertyAccess.*` | `value` |
| `apply-around.ts:125` | `templates.end` | `value` |
| `apply-around.ts:142` | `bindings.read` (global) | `value` |
| `apply-around.ts:178` | `operators.pure.typeof` | `result` |
| `effect-after.ts:70` | `bindings.available` | `value` |
| `block-declaration.ts:88` | `bindings.available` | `value` |

Still value-carrying by design (NOT dead): `bindings.initialize`
(value+explicit), `bindings.update` (value), `controlFlow.test`
(value+result), `templates.evaluation` (value), `functions.return` (value —
but the DESIGN removed the return event entirely: the call's ResolveEvent
carries the return value), `operators.assignment` (value stays — the
operator's own perspective).

Other campaign half-steps in code: `emit-event.ts` bumps BOTH `state.step`
and `state.eventStep` (design: one counter, bumped by the dispatcher AFTER
runtime gates); `create-aspect.ts` initialState still embeds `config` and
`step` and lacks the type-required `lastEmittedNodePath` / `lastEmittedTag`
/ `visitCounts` / `valueIdCounter`; gate config paths are pre-migration
(`gating.ts` is the declared single change point for the
`resolve.kinds.*` schema migration).

## Compile-health probe (2026-07-27, scoped tsc over instrument + weaving + generators)

No Aran hook is renamed or missing — all 11 kinds exist in 5.2.2 and every
advice positional signature conforms to `weave/flexible/aspect.d.ts`. The
probe's real findings, all internal:

1. `instrument.ts:93` — `initial_state: TracerState` not assignable to
   Aran's `Json` (fields typed `unknown[]`/`unknown`). Runtime-fine
   (values are JSON-safe), type-incompatible.
2. `instrument.ts:94` — the pointcut record's `kind: string` is too loose
   for `FlexiblePointcut` (needs the AspectKind literal). Shape is right;
   type the port properly.
3. ~30 uses of `state.config` and 7 of `state.step` across advice — fields
   the reshaped `TracerState` no longer declares (runtime works because
   create-aspect still embeds them).
4. `create-function-return-event.ts` imports `FunctionReturnEvent` and
   `create-with-event.ts` imports `WithEvent` — neither exported by
   `tracing/types.ts` anymore (removed by the campaign).
5. `index.ts` imports the nonexistent `@study-lenses/tracing` package.
6. Assorted `exactOptionalPropertyTypes` and stale-test failures
   (tests assert the dropped `value` keys — dead tests, do not port
   assertions verbatim).

## Landmines

1. **effect-after pre-write value** (`weaving/advice/effect-after.ts:32`):
   `assignedValue = state.lastExpressionResult` — correct ONLY when the RHS
   expression was itself cut (expression@after / apply@around fired and
   refreshed the register). Known repro: `let x = 1; x = 2` → the
   `bindings.update` event reports `1` (the PRE-write value). The whole
   `lastExpressionResult` register pattern is order-coupled and config-
   coupled; the greenfield fix is the dispatcher/resolve design, not a
   patch.
2. **Conformance Equal tie-back is FLAT-events-only**
   (`event-generators/conformance.ts`): full bidirectional
   `Expect<Equal<...>>` works for flat events (literal, property, operators,
   templates, function-call, scope, jump). Discriminated events
   (BindingEvent, ConditionalEvent, LoopEvent) are `BaseEvent & common &
   (variant-union)` — `Omit`/`Extract`/`DistributiveOmit` collapse to common
   keys, so only a one-directional shape check + the return-annotation trick
   holds; per-variant field drift is invisible to the type system (human/AR
   review covers it).
3. **Legacy situ/standalone global-read fabrication** — see
   `references/api-map.md` § semantic facts. Do NOT copy instrument.ts's
   `situ:{type:'local',mode:'strict'}` + standalone config forward.
4. **Pause economics**: advice fires at extreme frequency (every primitive,
   read, operator application...). Every EMITTED event costs a postMessage
   plus a potential Atomics pause round-trip (per-event `checkPause()` in the
   quarry; `api.emit` pauses under the engine's pause protocol too).
   Worker-side gating BEFORE emit is mandatory at both layers: weave-time
   (a disabled gate weaves NO advice call — free at runtime) and runtime
   (range window / name filters / caps drop the event before it touches the
   transport). Never emit-then-filter thread-side.
5. **Aran-internal noise**: filter `ARAN_PARAMETERS` and `.`-prefixed
   variables out of every user-facing frame/read/write; skip `$`-prefixed
   (Aran-mangled) labels.
6. **Concurrent-session rule**: the quarry rides the shared 0-curricula
   tree. Copy with `cp -p`, verify byte-identity, never edit in place.

## Porting to the greenfield (target sketch)

Home: `src/lib/study-lenses/evaluators/tracers/semantics/` driving the shared
engine at `src/lib/study-lenses/lib/engine/` (`evaluate(spec)`).

- **Main thread**: keep the instrument pipeline shape (pre-walk → digest →
  transpile → aspect → weaveFlexible → retropile → generate) with the I-9b
  situ mechanism; build + freeze the acyclic ast record (path → node,
  `parentPath` string, no back-refs) at instrument time.
- **Worker side**: a THIN entry —
  `bootstrap(workerSetup)` where the `WorkerSetup` (`(api, workerConfig) =>
  {globals, serializeHalt?}`) registers the `_jej_*` advice functions as the
  returned globals, wires `api.emit` as the emission callback (replaces the
  `__jej_onEvent` global + bespoke SAB checkPause), and receives the runtime
  gate bundle via `workerConfig`. NO bespoke SAB protocol, no prompt/confirm
  traps, no pause handshake — all engine-owned (`api.call` services
  round-trips).
- **Engine seam**: `workerFactory: () => new Worker(new URL('./entry.ts',
  import.meta.url), {type:'module'})` — the `new Worker(new URL(...))`
  expression must stay syntactically adjacent (static bundler detection) and
  module-typed.
- **Build the dispatcher the docs spec**: emit-expression / emit-resolve /
  emit-error — gates first, ONE step counter bumped after gates pass,
  visit counts bumped in emit-resolve BEFORE gates, values ride
  ResolveEvents; that closes I-4 instead of porting its dead keys.
- Deps already in root package.json: `aran ^5.2.2`, `acorn ^8.16`,
  `astring ^1.9`, `estree-walker ^3.0.3`, `ajv ^8.18`.
