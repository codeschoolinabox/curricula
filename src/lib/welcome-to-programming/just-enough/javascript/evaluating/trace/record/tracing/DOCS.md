# tracing — Architecture

> **Status**: Sections marked ⏳ describe planned changes not yet in the code.

## Architectural Sketch

> Written Phase 0, before implementation of tag resolution and step numbering.
> The Refactor step is held against this document.

### Execution phases

1. **⏳ Pre-walk** (sync, pure) — walk the parsed ESTree AST to build parent
   metadata (e.g., VariableDeclarator → parent VariableDeclaration's `kind`).
   Needed because Aran's digest visits nodes bottom-up. Input: parsed AST.
   Output: parent info map.

2. **Transpile with digest** (sync, side-effectful) — Aran's `transpile()`
   transforms ESTree → AranLang IR. A custom digest callback builds a
   `Map<string, JejTag>` as a side effect, capturing ESTree metadata that
   Aran's desugaring erases. Input: ESTree AST + parent info map. Output:
   AranLang AST + tag map.

3. **Aspect assembly** (sync, pure) — `createAspect()` reads user config and
   the tag map to build pointcuts and advice globals. ⏳ Each pointcut is
   wrapped to resolve hash-string tags → JejTag objects before the original
   pointcut logic runs. Input: config + tag map. Output: Aran-compatible
   aspect (pointcut + adviceGlobals + initialState).

4. **Weave** (sync, pure) — Aran's `weaveFlexible()` injects advice calls into
   the AranLang IR based on the pointcuts. Input: AranLang AST + aspect.
   Output: woven AranLang AST.

5. **Retropile + generate** (sync, pure) — Aran's `retropile()` converts woven
   AranLang → ESTree (standalone mode embeds intrinsic setup). `astring`
   generates the JavaScript string. Input: woven AST. Output: executable
   instrumented code string.

6. **Execute** (async, Worker) — the instrumented code is sent to a disposable
   Web Worker (or executed via `new Function()` in Node tests). Advice functions
   fire during execution, emitting frozen TraceEvents via `state.onEvent`.
   Input: instrumented code string. Output: stream of TraceEvents + TraceResult.

### Structural constraints

- **Tag map built during transpile**: the digest callback mutates the map as a
  side effect. The map must be fully populated before `createAspect()` is called.
  This creates a temporal dependency: transpile → createAspect → weave.
- **eval+strict mode**: Aran's `kind: 'eval'` with `situ: { type: 'local',
  mode: 'strict' }` produces code executable via `new Function()`. Module mode
  generates `import.meta` syntax which `new Function()` cannot execute.
- **Standalone retropile**: embeds the intrinsic record directly — no separate
  setup step needed. Learner code can't break Aran internals.
- **Events structured at runtime**: no post-processing or regex parsing. Config
  controls what's instrumented at pointcut time; advice functions emit structured,
  frozen events directly.

### Out of scope

- Caching instrumented code (caller responsibility)
- Config expansion/validation (handled by `@study-lenses/tracing` wrapper)
- Worker lifecycle management (handled by `index.ts` async generator, not by
  the instrumentation pipeline)

## Key design decisions

- **eval kind with strict situ**: JEJ programs are conceptually modules (strict
  mode, block-scoped). Module mode generates `import.meta` → can't use
  `new Function()`. eval+strict gives module-like semantics without ESM syntax.
  Unifies code path between Worker and Node tests.

- **`with` fallback to script mode**: `with` requires sloppy mode. Detected via
  regex (`/\bwith\s*\(/`), switches to `kind: 'script'` + `situ: { type:
  'global' }`. Known limitation: regex can false-positive on `"with("` in
  strings/comments.

- **onEvent via global callback**: Aran JSON-clones initialState (losing
  functions). The Worker sets `globalThis.__jej_onEvent` before execution.
  `block-setup` (first advice hook to fire) picks it up and sets
  `state.onEvent`. All subsequent hooks inherit it via state threading.

- **No post-processing**: Events are structured by advice at runtime. No regex
  parsing, no batch filtering. Config-time pointcuts control what gets
  instrumented.

## Subsystem docs

- `weaving/DOCS.md` — tag strategy, tag resolution, step numbering, advice
  architecture
- `event-generators/DOCS.md` — event factory design
