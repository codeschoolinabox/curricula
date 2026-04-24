# WS3: Orchestrator — Increment 4: State management

> **Status**: Phase 0 complete. Increments 0–3 complete and committed to
> `main`. You are starting at **Increment 4: State management**.
>
> Do NOT redo Phase 0. Do NOT modify `types.ts` without user approval.

---

## What's landed on `main`

Read these files before writing any code — they ARE the contracts Increment 4
builds on:

| Concern                        | File                                      | Commit    |
| ------------------------------ | ----------------------------------------- | --------- |
| Module registry                | `study-lenses/registry.ts`                | `8417870` |
| Pipeline validation            | `study-lenses/pipeline.ts`                | `757f375` |
| Per-name `configs` on Pipeline | `study-lenses/types.ts` (Pipeline type)   | `a2ff0ad` |
| Stray-configs warn             | `study-lenses/pipeline.ts`                | `464acdb` |
| Pipeline execution             | `study-lenses/execute-pipeline.ts`        | `099e424` |

Test suites for the above total 76 tests — run them first:

```bash
npx vitest run src/lib/welcome-to-programming/just-enough/javascript/study-lenses/tests/
```

---

## Known pitfalls

Read these before writing any code — prior WS3 agents hit them.

1. **`deepClone` converts functions to metadata objects.** Never use
   `cloneAndFreeze(module)` on a `TransformModule` or `LensModule` — it
   silently converts the `transform`/`lens` function property into
   `{ type: 'function', name, stringified }`. Use `freezeInPlace({ ...module })`
   instead (as done in `registry.ts`). For your own-built state objects that
   contain only strings and arrays, `freezeInPlace` is correct.

2. **Standalone pure functions, not classes.** `createRegistry()` is a factory
   that returns an object; `validatePipeline` / `executePipeline` are standalone
   pure functions. State management is likely the first increment that wants
   per-instance state — but DEV.md bans classes. Use a factory that returns a
   closure-over-immutable-bindings, or return a plain state object with helper
   functions that take the state as an argument.

3. **ESM-reserved identifier.** Don't name a local `module` — it shadows
   ESM/CJS semantics and lint flags it. `transformModule`, `lensModule`, or
   a scope-specific name is fine.

4. **Test conventions (enforced).** `.js` extensions in imports, default
   export only, named function declarations, inline stubs (see
   `tests/execute-pipeline.test.ts` `makeTransform`/`makeLens` pattern —
   stubs take an options object for behavioral variations).

---

## Your task: Increment 4 — State management

### One-line spec (from 03 handoff's historical "After this increment" list)

> **Increment 4**: State management — factory for per-instance state
> (`snippet`, `activeLens`, `activeTransforms`).

The type shape is already pinned in `types.ts`:

```ts
type OrchestratorState = Readonly<{
    originalCode: string;
    snippet: string;
    initialLens: string;
    activeLens: string;
    initialTransforms: ReadonlyArray<string>;
    activeTransforms: ReadonlyArray<string>;
    snippetName: string;
}>;
```

### First step: draft the detailed contract (Phase 0, your own agent plan)

The forward-looking one-liner above is intentionally underspecified — the
next agent is expected to draft the detailed behavioral contract in plan
mode before writing code, the same way Increments 2 and 3 were drafted.
At minimum, the plan must pin:

- **Factory signature**: inputs (probably `PluginEmittedProps`-shaped, see
  `types.ts:193`), output (something satisfying `OrchestratorState` plus
  the transition methods).
- **Transition semantics**: `setActiveLens`, `setActiveTransforms`,
  `setSnippet`, `setSnippetName` — return a new state (functional update),
  never mutate.
- **Reset behavior sketch** (Increments 7a/7b land the full reset flow;
  Increment 4 just needs a factory + transitions that don't preclude
  them).
- **How state composes with the EventBus** (Increment 5) and the lens
  cache (Increment 6). State should be the single source of truth —
  events and cache entries reflect it, not the other way around.

See `study-lenses/DOCS.md` §OrchestratorState for the wider context.

### Conventions to enforce (same as Increments 2 and 3)

- `export default` a named-first function declaration.
- `.js` extensions in imports.
- Deep-freeze returns via `freezeInPlace` (own-built) or `cloneAndFreeze`
  (caller-provided); see `src/lib/utils/freeze.ts`.
- No mutable closures over `let`; no classes; no `this`.
- ZOMBIES-ordered test suite with AR-3 before implementation and AR-4 after.
- Atomic commit per increment with `--no-verify` (pre-existing markdownlint
  errors in the repo; see `development-guide.md`).

---

## After this increment

- **Increment 5**: EventBus — `createEventBus()`, typed dispatch/subscribe, pure TS.
- **Increment 6**: Lens cache — keyed by `(lens-name, config-hash)`;
  `forEach` for IoC push.
- **Increment 7a**: Reset (code-only) — restore snippet, dispatch
  `state-reset`, invoke `onSnippetChanged` on all cached instances.
- **Increment 7b**: Reset All — restore snippet + initialLens +
  initialTransforms, clear cache.
- **Then**: React wrapper (Increments 8–14), trial lenses (15–18).
