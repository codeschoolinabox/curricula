# orchestrator

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
   The `lens-switched` event fires during the switch — exact timing
   (before or after attach) is one of the open Phase-0 design
   questions in
   [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
   and will be pinned in this README once Increment 9 Phase 0 resolves
   it. See [`./DOCS.md`](./DOCS.md) for the resolved switch flow.
3. **Unmount.** A dedicated unmount-cleanup effect runs `bus.clear()`,
   then `cache.visit(entry => entry.mount.dispose())`, then
   `cache.clear()`. The split between switch-cleanup and
   unmount-cleanup (Increment 9 Pre-work B) is what lets the cache
   survive across state transitions.

SSR: the entire React tree is wrapped in `<BrowserOnly>`; the server
pass renders `<pre>{code}</pre>` per
[`../DOCS.md`](../DOCS.md) §Structural constraints.

## Data attributes the DOM exposes

| Attribute                              | Where                              | Used by                                                         |
| -------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `data-orchestrator="study-lenses"`     | The lens host `<div>`              | Tests + dev sandbox (locate the host).                          |
| `data-orchestrator-banner=""`          | The lang≠js banner `<div>`         | Tests + accessibility (banner has `role="alert"`).              |
| `data-orchestrator-error=""`           | The error fallback `<pre>`         | Tests (verify `validatePipeline` throw is rendered).            |
| `data-orchestrator-root` (Inc-9)       | The wrapper `<div>` (toolbar + host)| Tests + sandbox; survives Inc-8 selectors unchanged.            |
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
