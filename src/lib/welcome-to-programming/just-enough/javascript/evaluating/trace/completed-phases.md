# Trace Module — Completed Phases (Reference)

Detailed record of completed work from the trace integration testing + refactoring session. Moved from the active plan to reduce context clutter. Reference for future sessions.

---

## Phase 0: DDD + Documentation

### What happened

Started with AGENTS.md/DEV.md's Phase 0 ceremony for the tag resolution and step numbering subsystems. Built glossary, README, DOCS.md, types, ran two adversarial reviews.

### Artifacts

- `tracing/README.md`: Glossary (Tag, Tag hash, Tag map, Event step, Internal step, TraceEvent, Advice, Pointcut). Architecture diagram. File map. ⏳ markers for planned features.
- `tracing/DOCS.md`: Architectural sketch with execution phases (pre-walk → transpile with digest → aspect assembly → weave → retropile → generate → execute). Structural constraints. Out of scope.
- `weaving/DOCS.md`: Tag resolution phases (digest → map → pointcut wrapping). Step numbering (eventStep contiguous, step internal). Cross-ref fields optional. Tag map lookup failure mode. beginStep/structureStep cross-refs documented.

### AR-1: Design challenge

Concerns raised and resolved:
- **Cross-counter mismatch** (SIGNIFICANT): eventStep vs step on same events. Resolved: cross-ref fields optional, treated as opaque grouping keys.
- **resolveTagsDeep underspecified** (SIGNIFICANT): Switched to shallow + whitelist (finite, verified by grep).
- **Pre-walk + digest encapsulation**: Extracted as `createDigest(ast, code)` factory.

### AR-2: Sketch challenge

Concerns raised and resolved:
- **emitEvent injection point**: Made explicit in docs (eventStep++ → event.step → trace.push).
- **beginStep cross-ref**: Documented alongside other cross-refs. Template sub-events suppressed when begin disabled.
- **Tag map lookup failure mode**: Must throw, not return undefined.

### TDZ investigation (Phase 0.7)

Empirical test (`debug-tdz.test.ts`):
- eval+strict: `x` is always TDZ symbol in declaration frame. WriteEffect follows.
- script: user variables don't appear in frame at all.
- No Aran mode produces actual value at declaration time.
- **Decision**: TDZ is real JS concept. Events must reflect declare → initialize → available lifecycle accurately. Synthesize in effect-after.

### Types updated (Phase 0.4)

- `weaving/types.ts`: `eventStep: number` on TracerState
- `types.ts`: `step: number` on BaseEvent. All `scopeCreationStep` fields made optional (8 event types). `targetScopeCreationStep` optional.
- 20 event generator files: Added `'step'` to Omit exclusion lists.
- `create-aspect.ts`: `eventStep: 0` in initialState.

---

## Phase 1: RC-1 — Missing JejTag (the keystone fix)

### The problem

`instrument.ts` called `transpile()` without a custom `digest`. Default digest produces hash strings (`"learner.js#body.0"`). Entire downstream pipeline expected JejTag objects (`{ loc, node, source, ... }`). All metadata missing. Most event categories silently disabled.

### The investigation

1. Discovered digest produces hash strings (read Aran's `trans/config.d.ts`)
2. Verified with `debug-digest.test.ts`: digest receives ESTree nodes with full metadata (loc, type, etc.)
3. Confirmed Aran's `Json` type accepts objects (not just strings)
4. Discovered digest order is bottom-up (Identifier → Literal → VariableDeclarator → VariableDeclaration → Program) — verified empirically

### The fix

- `instrument.ts`: `createDigest(ast, code)` factory. Pre-walks AST via `estree-walker` for parent info (bottom-up workaround). `buildJejTag(node, code, parentInfo)` extracts ESTree metadata. Custom digest stores in `Map<string, JejTag>`, returns hash.
- `create-aspect.ts`: `createAspect(config, tagMap?)`. `wrapPointcut` resolves hash → JejTag via shallow whitelist: `node.tag`, `parent.tag`, `root.tag`, `parent.test?.tag`, `parent.then?.tag`, `parent.else?.tag`, `parent.try?.tag`, `parent.catch?.tag`, `parent.finally?.tag`. `tagMap.get()` preserves identity for `===` comparisons.

### Key learnings

- Aran's `Atom.Tag` is a generic type parameter constrained to `string | number` in transpile, but `Json` (including objects) in weave. The bridge: pointcut return arrays carry JejTag objects, Aran JSON-serializes them into instrumented code.
- The `wrapPointcut` approach doesn't modify pointcut files — they already expected JejTag.

---

## Phase 2: RC-2 — Event step numbering

Simple fix: `state.eventStep += 1` in `emitEvent()`, included as `step: state.eventStep` in metadata. Existing `state.step` kept for internal cross-refs.

---

## Phase 3: RC-3 — Aran internal variable leak

Simple fix: `if (varName.startsWith('.')) continue;` in `block-declaration.ts`. Catches `.w.NNNN` dynamic Aran variables.

---

## Phase 4: RC-4/RC-6 + Bugs 1-5

### RC-6: Value ordering (the pivot)

**Expected**: `effect-before` has the value (Aran evaluates expression before effect).
**Reality** (empirically verified with `debug-value-ordering.test.ts`):
```
effect@before(x, lastVal=null) → expression@after(5) → effect@after(x, lastVal=5)
```
`effect-before` fires BEFORE the expression. `effect-after` fires AFTER.

**Pivot**: Moved binding event emission from `effect-before.ts` to `effect-after.ts`. Key principle established: **events are the public contract — which hook emits doesn't matter.**

**Discovery**: `advice/DOCS.md` had a false claim: "This works because Aran always evaluates the value sub-expression before firing the WriteEffect." Corrected.

### RC-4: TDZ lifecycle

- `initialized: boolean` added to `VariableInfo`
- `block-declaration.ts`: sets `initialized: false` when TDZ (symbol value)
- `effect-after.ts`: first write to uninitialized var emits `initialize` + `available` (not `assign`), sets `initialized = true`

Result for `let x = 5;`: declare(x) → literal(5) → initialize(x, value=5) → available(x, value=5)

### Bug 1: const reported as let

**Investigation chain**: block-declaration reads `tag.bindingKind` from block tag → block tag is Program (no bindingKind) → tried reading from WriteEffect tag → AR found WriteEffect hash maps to Identifier (not VariableDeclarator) → extended `buildParentInfoMap` to propagate bindingKind from VariableDeclaration → VariableDeclarator → Identifier → embedded `variableKinds` map in TracerState.

### Bug 2: No test events for if/else

Shallow copy in `wrapPointcut` broke `parent.test === node` (object identity). Fixed: `parent.test?.tag === node.tag` (tag identity). Added `parent.test` to resolution whitelist.

### Bug 3: structureStep null

`block-setup.ts` never set `structureStep`. Fixed: `structureStep: tag.structure ? state.step : null`.

### Bug 4: No template events

Aran transpiles TemplateLiteral into `ApplyExpression(IntrinsicExpression("String.prototype.concat"), ...)`. `apply-pointcut.ts` checked intrinsic BEFORE template. Reordered.

### Bug 5: No jump events for unlabeled break

ESTree `BreakStatement.label` is null for unlabeled breaks. `tag.jumpTarget` was null. Fixed: scope stack walk for nearest loop in `statement-before.ts`.

---

## Phase 5: Layer 1+2 Node integration tests

- `instrument-integration.test.ts`: 14 tests — tagMap population, metadata extraction, bindingKind, literalKind, operators, loops, conditionals, syntax errors.
- `advice-integration.test.ts`: 29 tests — binding lifecycle (declare→initialize→available→assign), operators, literals, scopes, control flow (if/else, while, for, break), functions, templates, config gating (6 dimensions), error cases.

---

## Phase 6a investigation: Worker loading failure

Layer 3 browser tests (13 written, 7 pass) revealed Worker module doesn't load in vitest browser mode. Every test hits 5s timeout.

**Root causes found:**
1. COEP `require-corp` blocks blob Worker's cross-origin `import()` to Vite dev server
2. Vitest issue #6552: `__vitest_browser_runner__` wrapping of `import()` absent in Workers

**Verified NOT the cause:**
- Advice globals all registered correctly (including `_jej_effect_after`)
- SAB constants match between Worker and protocol
- Pause protocol deadlock-free
- `complete` message guaranteed in all paths

**Module execution investigation:**
- Aran module output uses `import.meta` capture (works in blob module), no top-level `return`, initial_state embedded same way
- Feasible for JeJ code (no imports/exports) but marginal gain — eval+strict already gives module semantics
- **Deferred** to when curriculum adds top-level await or import/export

**Decision**: Module Worker for loading (`new Worker(url, { type: 'module' })`), keep `new Function()` for learner code execution.

---

## Key decisions log

| Decision | Reason | When |
| -------- | ------ | ---- |
| eval+strict mode | Module generates `import.meta` → `new Function()` can't execute | Phase 0.7 |
| Events are public contract | Which hook emits doesn't matter, only order/content/step | Phase 4 (RC-6 pivot) |
| Contiguous eventStep | Gaps from internal tracking unacceptable for learning UI | AR-1 discussion |
| Cross-refs optional | Consumer can't navigate to disabled events | AR-1 discussion |
| Shallow + whitelist tag resolution | Recursive fragile, deep underspecified. Finite whitelist verified by grep | AR-1 discussion |
| Module Worker for loading | Blob URL + dynamic import broken in vitest. Vite handles module Workers natively | Phase 6a |
| Module execution deferred | Marginal gain (eval+strict already works), real cost (async, split paths, Firefox) | Phase 6a |
| Plans only in plan mode | Casual edits bypass review process | Session incident |

---

## AR reviews conducted

| Review | Verdict | Key findings |
| ------ | ------- | ------------ |
| AR-1: Design | CONSIDER | Cross-counter mismatch, resolveTagsDeep underspecified, pre-walk encapsulation |
| AR-2: Sketch | CONSIDER | emitEvent injection point, beginStep, tag map failure mode |
| AR Phase 4e | CONSIDER | WriteEffect hash → Identifier (CRITICAL), parent.test whitelist mandatory |
| AR Phase 6 | PROCEED | Ready handshake detail, writePauseEngaged ordering, first module Worker in codebase |

---

## Investigation artifacts (delete before final commit)

- `debug-events.test.ts` — event structure inspection
- `debug-digest.test.ts` — digest callback arguments
- `debug-module-mode.test.ts` — eval vs module vs hybrid mode comparison
- `debug-tdz.test.ts` — TDZ frame values across modes
- `debug-value-ordering.test.ts` — hook firing order (effect-before vs expression-after vs effect-after)
- `debug-binding-kind.test.ts` — block@declaration frame investigation
- `tests/__screenshots__/` — browser test failure screenshots
