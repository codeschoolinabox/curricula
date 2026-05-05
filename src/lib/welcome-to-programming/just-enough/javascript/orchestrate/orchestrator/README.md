# orchestrator

> **⚠️ STALE — pre-refactor content. Superseded by
> [`../README.md`](../README.md) +
> [`../DOCS.md`](../DOCS.md) for the post-Round-2 architecture
> (four-prop API, two-mode state machine, disposable practice,
> React-component lens mounts).** This file was relocated verbatim
> from `study-lenses/orchestrator/` in commit `5d6fc54` and
> describes the Inc-8/Inc-9 sprint architecture (LensMount,
> dispose, framework-agnostic mounts, three-prop API,
> `onSnippetChanged` IoC hook, lens cache reattach) — all of which
> were superseded by the locked architecture in the peer-level
> README + DOCS. Regenerated content lands as part of the
> post-migration sweep + WS3 F1 implementation. Do not consult this
> file for current architecture.

---

The React wrapper for the study-lenses orchestrator. Wires the Phase-1
pure-TS substrate (registry, pipeline validate/execute, state factory,
EventBus, lens cache) to a Docusaurus-rendered React tree. This is the
component the swizzled `MDXComponents` registry resolves the
`<StudyLenses>` tag to.

> **Status — Increment-8 scaffolding.** The wrapper renders one lens
> (no toolbar, no transforms, no reset) inside the orchestrator host.
> Increment 9 adds the lens-picker toolbar and the
> switch-cleanup/unmount-cleanup split; Increments 10–14 add transform
> toggling, Reset, Reset All, the snippet-name field, and the
> recommender panel.

## What lives here

| File                                           | Purpose                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`study-lenses.tsx`](./study-lenses.tsx)       | The `<StudyLenses>` component. Outer `<BrowserOnly>` wrapper + inner `StudyLensesClient` that owns per-instance registry/bus/cache and the resolved lens mount. |
| [`default-registry.ts`](./default-registry.ts) | Factory that builds a `Registry` pre-populated with every shipped lens and transform. Called once per mount via `useMemo`. |
| `toolbar.tsx` (Inc-9 TDD-1)                    | Lens-picker dropdown component. Pure presentational — receives `value`, `options`, `onLensChange` as props.              |
| `tests/`                                       | vitest jsdom tests for the wrapper (main suite, async cancellation, SSR fallback) plus the future toolbar suite.         |

## Lifecycle

The wrapper is mounted by the swizzled `MDXComponents` registry in the
Docusaurus theme. Per `<StudyLenses>` instance:

1. **Mount.** `useMemo` builds the per-instance registry, bus, and
   cache. `useState` lazily builds the initial `OrchestratorState` from
   the resolved props. The mount-effect runs once: validate → execute
   pipeline → resolve lens → call `lens(code, cfg)` (sync or async) →
   attach `mount.el` to the host ref.
2. **Switch (Increment 9+).** Learner selects from the lens-picker.
   `setState` updates `state.activeLens`. The mount-effect re-runs:
   detaches the outgoing mount (cache stays alive — no dispose), then
   either reattaches a cached mount (cache hit) or mounts fresh (miss).
   A separate dispatch-effect watches `state.activeLens` and fires
   `bus.dispatch('lens-switched', { previous, next })` **after the
   React commit that updated `state.activeLens`** — the
   dispatch-effect is registered after the mount-effect, so its
   synchronous portion runs after the mount-effect's synchronous
   portion. Note: the mount-effect body is async, so `mount.el` may
   be attached in a microtask AFTER `lens-switched` listeners fire;
   subscribers that need the new mount attached should defer their
   work to a microtask or `requestAnimationFrame`. See
   [`./DOCS.md`](./DOCS.md) §Switch flow for the diagram and the
   §Async caveat.
3. **Unmount.** A dedicated unmount-cleanup effect runs `bus.clear()`,
   then `cache.visit(entry => entry.mount.dispose())`, then
   `cache.clear()`. The split between switch-cleanup and
   unmount-cleanup (Increment 9 Pre-work B) is what lets the cache
   survive across state transitions.

SSR: the entire React tree is wrapped in `<BrowserOnly>`; the server
pass renders `<pre>{code}</pre>` per
[`../DOCS.md`](../DOCS.md) §Structural constraints.

## Toolbar (Increment 9+)

Increment 9 ships **only the lens-picker dropdown** as the toolbar's
first child. Transform toggles, Reset, Reset All, snippet name, and
recommender land in Increments 10–14 as additional toolbar children
— none of those changes the wrapper's effect topology described in
[`./DOCS.md`](./DOCS.md) §Effect topology.

The toolbar sits **outside** the lens host, in a sibling position
inside an outer `<div data-orchestrator-root>` wrapper. The
lang-not-js fallback path keeps its current structure unchanged
(`<div data-orchestrator="study-lenses">` wrapping the banner +
raw `<pre>`), and the error fallback also stays as-is.

```text
<div data-orchestrator-root>
  ├── <nav data-orchestrator-toolbar>
  │     └── <select data-orchestrator-lens-picker>
  │           ├── <option value="editor">editor</option>
  │           └── <option value="highlight">highlight</option>
  └── <div data-orchestrator="study-lenses">     // lens host (unchanged)
        └── (one of the registered lens mounts: see Lens host content below)
```

**Lens host content** is one of:

- `<textarea data-lens="editor-stub">` when `state.activeLens === 'editor'`.
- `<pre data-lens="highlight-stub"><code>...</code></pre>` when `state.activeLens === 'highlight'`.

Only one lens is mounted at a time per the parent
[`../DOCS.md`](../DOCS.md) §Structural constraints.

### Toolbar prop contract

The lens-picker dropdown is purely presentational. The Toolbar
component takes:

| Prop            | Type                          | Behavior                                                                               |
| --------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `value`         | `string`                      | The current `state.activeLens` passed in. Pre-selects the matching `<option>`.         |
| `options`       | `ReadonlyArray<string>`       | The registered lens names from `registry.getLensNames()`, in registration order.       |
| `onLensChange`  | `(next: string) => void`      | Fires on `<select>` `onChange`. The wrapper invokes `setState` from inside this callback. |

**Edge cases the Toolbar component handles** (pinned by direct unit
tests in [`./tests/toolbar.test.tsx`](./tests/toolbar.test.tsx)):

- **Empty `options`.** Should not happen in practice (`createDefaultRegistry` always
  registers at least the `editor` stub, which is also the unknown-name fallback target —
  see [`../pipeline.ts`](../pipeline.ts)). If it ever happens, the toolbar renders
  `<select>` with zero `<option>` children; the wrapper still mounts whatever
  `state.activeLens` resolves to via `validatePipeline`.
- **`value` not in `options`.** Means `state.activeLens` is a name not currently
  registered. The browser falls back to the first option's value visually, but
  `onLensChange` does not fire on render — the wrapper's state stays unchanged until the
  learner explicitly picks a different option. `validatePipeline` rewrites unknown names
  to `'editor'` before they reach `state`, so this divergence is not expected in practice.
- **`onLensChange` throws.** The Toolbar does not wrap the call in `try/catch`. A throw
  propagates to React's event-handler error reporting (console.error in dev,
  error-boundary in production); recovery requires unmount/remount. The Toolbar's own
  invariant — pinned by the unit test — is "invokes the handler exactly once with the
  selected value per change", regardless of what the handler does. This is an intentional
  fail-loud choice — silent state-transition failures are worse than visible crashes.

**Accessibility**:

- The `<select>` carries `aria-label="Lens"` for its accessible name (resolved
  Increment-9 decision). Increments 10+ retain this and never add a competing
  visible `<label htmlFor>`.
- Keyboard navigation is the browser default for `<select>` (Tab to focus, arrow keys to
  cycle, Space/Enter to commit). No custom handlers.
- No focus management on switch — the `<select>` retains focus by default, which is the
  expected affordance for a learner mid-exploration.

### Selection behavior

Selecting a different option triggers a state transition: the wrapper
calls `setState(prev => freezeInPlace({ ...prev, activeLens: next }))`.
The mount-effect re-runs (detach, resolve, reattach) and the
dispatch-effect fires `lens-switched` on the same React commit (see
the Lifecycle §Switch above for the timing, and `./DOCS.md` §Switch
flow for the async caveat).

Selecting the currently-active lens is a no-op — no dispatch fires
and no DOM swap happens. The dispatch-effect short-circuits when the
new value equals the previous value.

## Data attributes the DOM exposes

| Attribute                              | Where                              | Used by                                                         |
| -------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `data-orchestrator="study-lenses"`     | The lens host `<div>`              | Tests + dev sandbox (locate the host).                          |
| `data-orchestrator-banner=""`          | The lang≠js banner `<div>`         | Tests + accessibility (banner has `role="alert"`).              |
| `data-orchestrator-error=""`           | The error fallback `<pre>`         | Tests (verify `validatePipeline` throw is rendered).            |
| `data-orchestrator-root` (Inc-9)       | The wrapper `<div>` (toolbar + host)| Tests + sandbox; the inner `data-orchestrator="study-lenses"` selector still resolves to the lens host. |
| `data-orchestrator-toolbar` (Inc-9)    | The toolbar `<nav>`                | Tests + sandbox (locate the toolbar container without depending on tag). |
| `data-orchestrator-lens-picker` (Inc-9)| The toolbar `<select>`             | Tests + sandbox (locate the dropdown without depending on tag). |

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- React hooks live inside normal function components — no class
  components, no `this`. The Increment-9 wrapper splits the lifecycle
  across multiple `useEffect`s (mount/detach, dispatch, unmount-only);
  this is documented in [`./DOCS.md`](./DOCS.md) §Effect topology.
- Multi-statement `useEffect` and other multi-statement arrow-callbacks
  use **named function expressions** (lint pitfall #11 in
  [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md));
  arrow-body-style is `'never'` on non-test code.
- React component tests use `.test.tsx` and the jsdom environment
  (configured at the file level via the `@vitest-environment jsdom`
  pragma).
- `vi.mock` factories that reference outer-scope variables wrap them
  in `vi.hoisted(() => ({ ... }))` (lint pitfall #12 — see
  [`./tests/study-lenses.async-cancel.test.tsx`](./tests/study-lenses.async-cancel.test.tsx)).

## Navigation

- **Parent:** [`../README.md`](../README.md) — study-lenses overview
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md)
- **Wrapped substrate:** [`../DOCS.md`](../DOCS.md) §Execution phases
- **Types:** [`../types.ts`](../types.ts) (`PluginEmittedProps`,
  `OrchestratorState`, `EventBus`, `Registry`)
- **Increment plan:** [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
