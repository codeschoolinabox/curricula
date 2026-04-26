# WS3: Orchestrator — Increment 9: Lens switching

> **Status**: Phase 0 complete. Increments 0–7b and **Increment 8
> (React wrapper scaffolding)** complete and committed to `main`. You
> are starting at **Increment 9: Lens switching** — the second of
> seven React-wrapper increments.
>
> Increment 8 landed in three atomic commits: `5cc125d` (editor lens
> stub), `0679e0f` (default registry factory), `bce4e83` (React wrapper
> scaffold + eslint test-glob extension to `.tsx`). The Phase 1
> pure-TS substrate is unchanged.
>
> Do NOT redo Phase 0 or Increment 8. Do NOT modify `types.ts` without
> user approval.
>
> **Session-boundary note**: Increments 9–14 are React + DOM. Each
> requires a **sandbox checkpoint** (human runs the dev server and
> verifies behavior in the browser). Do NOT attempt them in a
> context-constrained session.

---

## What's landed on `main`

Read these before writing any code — they ARE the contracts Increment 9
builds on.

### Phase 1 — pure-TS substrate

| Concern                        | File                                        | Commit    |
| ------------------------------ | ------------------------------------------- | --------- |
| Module registry                | `study-lenses/registry.ts`                  | `8417870` |
| Pipeline validation            | `study-lenses/pipeline.ts`                  | `757f375` |
| Per-name `configs` on Pipeline | `study-lenses/types.ts` (Pipeline)          | `a2ff0ad` |
| Stray-configs warn             | `study-lenses/pipeline.ts`                  | `464acdb` |
| Pipeline execution             | `study-lenses/execute-pipeline.ts`          | `099e424` |
| State management factory       | `study-lenses/create-orchestrator-state.ts` | `87b1ce9` |
| EventBus factory               | `study-lenses/create-event-bus.ts`          | `6b9b758` |
| Lens cache factory             | `study-lenses/create-lens-cache.ts`         | `9f49d47` |
| Reset (code-only)              | `study-lenses/reset-snippet.ts`             | `436c1df` |
| Reset All                      | `study-lenses/reset-all.ts`                 | `8d4bfca` |

### Increment 8 — React wrapper scaffolding

| Concern                  | File                                                  | Commit    |
| ------------------------ | ----------------------------------------------------- | --------- |
| Editor lens stub         | `study-lenses/lenses/editor/editor.ts`                | `5cc125d` |
| Default registry factory | `study-lenses/orchestrator/default-registry.ts`       | `0679e0f` |
| React wrapper scaffold   | `study-lenses/orchestrator/study-lenses.tsx`          | `bce4e83` |
| eslint test glob → .tsx  | `eslint.config.mjs` (test-file override)              | `bce4e83` |

Full study-lenses test suite (run before starting Increment 9):

```bash
npx vitest run src/lib/welcome-to-programming/just-enough/javascript/study-lenses/
```

Expect ~197 tests green across 13 files (the 3 new test files are
`lenses/editor/tests/editor.test.ts`,
`orchestrator/tests/default-registry.test.ts`, and three
`orchestrator/tests/study-lenses*.test.tsx`). If anything fails, stop
and investigate before writing code.

---

## Known pitfalls (carry forward from the Phase 1 pure-TS work)

1. **`deepClone` converts functions to metadata objects.** Never use
   `cloneAndFreeze(module)` on a `TransformModule` or `LensModule`.
   Use `freezeInPlace({ ...module })` instead.

2. **Do NOT name a local `module`.** Shadows ESM/CJS semantics and
   lint flags it. Use `transformModule`, `lensModule`, etc.

3. **Array-method lint on custom methods.** `unicorn/no-array-for-each`
   triggers on any `.forEach(` call — that's why the lens cache's
   iteration method is named `visit`, not `forEach`. Apply the same
   pattern if you expose an iteration API on a non-array handle.

4. **TS lib target is ES2022.** `Array.prototype.toSorted` (ES2023) is
   NOT available. Use `[...arr].sort(...)` instead, or inline
   `eslint-disable-next-line unicorn/no-array-sort` with a comment.

5. **`.js` extensions in imports are mandatory.** No exceptions.

6. **Named exports are banned outside `types.ts`** (per ESLint
   `import/no-named-export`). If you need to share a type between
   files, either move it to `types.ts` (requires user approval) or use
   `type Foo = ReturnType<typeof defaultExport>` in the consumer.

7. **`functional/immutable-data` warns on Map/Set mutations.**
   Shipped code in `registry.ts`, `create-event-bus.ts`, and
   `create-lens-cache.ts` carries these as non-blocking warnings. The
   pattern (closure over a const-ref Map, method mutations) is
   approved by precedent.

8. **`--no-verify` on every commit.** The repo-wide pre-commit hook
   runs markdownlint with 300+ pre-existing errors. See
   `development-guide.md`.

9. **`.tsx` test files were not in the eslint test-file override.**
   Commit `bce4e83` extended the glob at `eslint.config.mjs:304` to
   include `**/*.test.tsx` and `**/tests/**/*.tsx`. Future React
   component tests inherit the relaxed rules (arrow-body-style off,
   immutable-data off, etc.) automatically — no further config work
   needed.

10. **`Partial<LensConfig>` widens values to `T | undefined`.**
    After `freezeInPlace({ ...overrides })`, cast the result back to
    `LensConfig` to satisfy `LensModule.config`'s declared return
    type. See `lenses/editor/editor.ts` for the pattern.

11. **`arrow-body-style: ['error', 'never']` is enforced on non-test
    code.** Multi-statement React `useEffect` callbacks must use named
    function expressions (`useEffect(function mountActiveLens() { ... })`)
    or named `function` declarations to avoid the lint error.
    Returns must be type-consistent (`sonarjs/no-inconsistent-returns`)
    — if any branch returns a cleanup, all branches must.

12. **vitest `vi.mock` is hoisted to the top of the test file.**
    Variables referenced inside the mock factory must be wrapped in
    `vi.hoisted(() => ({ ... }))` so they exist when the mock runs.
    See `study-lenses.async-cancel.test.tsx` for the pattern.

13. **`registry.register()` shallow-spreads and freezes the input
    module**, so the stored handle is a fresh reference. Identity
    assertions (`toBe`) fail; assert structural equality on `.name`
    and reference-equality on individual function members instead.
    See `default-registry.test.ts`.

---

## Your task: Increment 9 — Lens switching

### One-line spec

> **Increment 9**: Wire a toolbar with a lens-picker dropdown
> (`<select>`) above the orchestrator host. Selecting a lens
> transitions `state.activeLens` (via `setState` on the existing
> `OrchestratorState` seam), dispatches a `lens-switched` event with
> the payload at `types.ts:313`, and triggers the existing effect to
> detach the outgoing lens and attach the incoming one (cache miss →
> mount fresh via `lensModule.lens(...)`; cache hit → reattach the
> cached `mount.el`).

### First step: draft the detailed contract (your Phase 0)

The Increment-8 wrapper already wires mount/unmount, async lens
handling, and cache disposal. The toolbar is brand new and has no
precedent in the wrapper — answer these in plan mode FIRST:

- Where the toolbar sits in the JSX (above the host? same row?
  inside the host div?).
- How the dropdown enumerates available lens names. Iterate the
  registry (no public API exists for that today — would need a
  `getNames()` or similar)? Use a prop-supplied list? Hardcode for
  Increment 9 with a TODO?
- How the state transition is wrapped: plain `setState` is the
  obvious path because the existing `useEffect` deps include
  `[state, ...]`, so a state identity change re-runs the effect.
  Reducer would be over-engineering for one transition.
- How the cache-hit reattach interacts with the current
  mount/unmount cleanup. The current cleanup detaches and disposes
  on every effect re-run, which is wrong for cache-hit reattach
  (you'd dispose the cached entry you just want to reuse). The
  effect's cleanup needs a "switching" path that detaches WITHOUT
  disposing.
- How `lens-switched` fires: before or after the new lens mounts?
  DOCS §EventBus says re-entrant dispatch is permitted, so timing
  is a design choice with consequences for listeners.

### Substrate hooks already wired (read before designing)

- `study-lenses/orchestrator/study-lenses.tsx` — current effect at
  `useEffect(function mountActiveLens(){...})`. The `[state, ...]`
  dep already triggers re-mount on `state` identity change, so
  `setState` is the only state-transition seam needed.
- `study-lenses/types.ts:265–290` — `EVENT_NAMES`, `EventName`,
  `EventPayload`. `lens-switched` payload shape at `types.ts:313`.
- `study-lenses/create-event-bus.ts` — call
  `bus.dispatch('lens-switched', payload)` to fire.
- `study-lenses/create-lens-cache.ts` — cache-hit reattach
  semantics. Cache stores `LensMount` per `(name, configHash)`; on
  hit, the orchestrator reattaches the cached `mount.el` instead of
  remounting.
- `study-lenses/DOCS.md` §Cache (cache-hit reattach contract) and
  §EventBus lifecycle (re-entrant dispatch permitted).

### Conventions to enforce

- `export default` a named-first function declaration.
- `.js` extensions in imports.
- Deep-freeze any fresh state objects via `freezeInPlace`.
- No mutable closures over `let`; no classes; no `this`.
- React hooks in normal function components — no class components.
- Multi-statement `useEffect` / arrow callbacks → named function
  expressions (see Pitfall #11).
- ZOMBIES-ordered test suite with AR-3 before implementation and
  AR-4 after. `@testing-library/react` is installed.
- **Sandbox checkpoint required**: after green tests, run the dev
  server and verify (a) the dropdown renders, (b) selecting a
  different lens swaps the visible mount, (c) selecting back to the
  original lens reattaches the cached mount (not a fresh one).
  Human confirms before commit lands.
- Atomic commit per increment with `--no-verify`.

---

## After this increment

- **Increment 10**: Transform toggling — toolbar toggles each
  transform on/off; updates `activeTransforms`; re-runs the pipeline;
  pushes the new snippet into cached mounts via `onSnippetChanged`.
- **Increment 11**: Reset button — wires `resetSnippet` to a toolbar
  button.
- **Increment 12**: Reset All button — wires `resetAll` to a toolbar
  button.
- **Increment 13**: Snippet name input — learner-editable; dispatches
  `snippet-name-changed`.
- **Increment 14**: Recommender panel — opens a 3D Block Model grid
  of recommendations; selecting one triggers a lens switch with the
  recommended config.
- **Then (Increments 15–18)**: trial lenses (editor, highlight,
  parsons, blanks, trace-table — whichever pair the user prioritises).

Each React-wrapper increment needs a sandbox checkpoint. Plan session
cadence accordingly: 1–2 increments per session at most; expect to
pause for human browser verification.
