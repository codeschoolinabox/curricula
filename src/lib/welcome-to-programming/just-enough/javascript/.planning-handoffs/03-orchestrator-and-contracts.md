# WS3: Orchestrator — Increment 8: React wrapper (start of Phase 2)

> **Status**: Phase 0 complete. Increments 0–7b complete and committed
> to `main`. You are starting at **Increment 8: React wrapper
> (scaffolding)** — the first of seven React-wrapper increments.
>
> Do NOT redo Phase 0. Do NOT modify `types.ts` without user approval.
>
> **Session-boundary note**: Increments 8–14 are React + DOM. Each
> requires a **sandbox checkpoint** (human runs the dev server and
> verifies behavior in the browser). Do NOT attempt them in a
> context-constrained session.

---

## What's landed on `main` (the pure-TS substrate)

Read these before writing any code — they ARE the contracts Increment 8
builds on.

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

Full study-lenses test suite (run before starting Increment 8):

```bash
npx vitest run src/lib/welcome-to-programming/just-enough/javascript/study-lenses/tests/
```

Expect ~140+ tests green across 8 files. If anything fails, stop and
investigate before writing code.

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

---

## Your task: Increment 8 — React wrapper (scaffolding)

### One-line spec

> **Increment 8**: React wrapper — wire the `<StudyLenses>` component
> stub at `study-lenses/orchestrator/study-lenses.tsx` to the Phase 1
> substrate (registry, pipeline validate/execute, state factory,
> EventBus, cache). Mount the active lens; no toolbar, no reset, no
> transform toggling yet — those are Increments 9–14.

### First step: draft the detailed contract (your Phase 0)

The Phase 1 substrate is done. The remaining unknown is the React
glue: how props flow in, how state composes with `useState` +
`useMemo` + `useEffect`, how `BrowserOnly` SSR boundary is wired,
how lens-mount async (`LensModule.lens(...)` may return a Promise) is
handled, how unmount clears the bus + disposes the cache.

Draft the detailed Phase 0 artifacts **in plan mode** before coding:

- Component signature (input: `PluginEmittedProps` at `types.ts:193`).
- State composition: which pure-TS factories run at mount, which are
  memoised, which are re-run on prop change.
- Lifecycle: mount → validate pipeline → create state → create bus →
  create cache → render initial lens. Unmount → `bus.clear()` →
  `cache.visit(dispose) + cache.clear()`.
- SSR: wrap the whole thing in `<BrowserOnly>`; fallback is a `<pre>`
  of `props.code` (per DOCS.md §Structural constraints).
- Lens mounting: handle both sync and async `lens()` return values.

Read `study-lenses/DOCS.md` §1 (Initialize) and §2 (Pipeline) and
§7 (EventBus lifecycle) for the orchestrator-level shape.

### Conventions to enforce

- `export default` a named-first function declaration.
- `.js` extensions in imports.
- Deep-freeze any fresh state objects via `freezeInPlace`.
- No mutable closures over `let`; no classes; no `this`.
- React hooks in normal function components — no class components.
- ZOMBIES-ordered test suite with AR-3 before implementation and AR-4
  after. UI rendering can be tested with `@testing-library/react`
  (check if it's already installed; if not, flag to user).
- **Sandbox checkpoint required**: after green tests, run the dev
  server and verify a `js:editor` fence renders the code in the
  editor lens. Human confirms before commit lands.
- Atomic commit per increment with `--no-verify`.

---

## After this increment

- **Increment 9**: Lens switching — toolbar with lens-picker dropdown;
  updates `activeLens` via a state transition; dispatches
  `lens-switched` event; detaches the outgoing lens from the DOM and
  attaches the incoming one (cache miss → mount fresh; cache hit →
  reattach).
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
