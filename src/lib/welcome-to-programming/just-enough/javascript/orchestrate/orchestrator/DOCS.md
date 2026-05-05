# orchestrator — Architecture & Decisions

## Why this module exists

The `orchestrator/` directory is the React seam between the
study-lenses Phase-1 pure-TS substrate (registry, pipeline,
orchestrator state, EventBus, lens cache) and the Docusaurus swizzle
(`MDXComponents.tsx`). Concentrating the React wiring in one
directory keeps every other study-lenses module pure TypeScript —
testable in vitest without `jsdom`, runnable in node-only contexts,
free of React-as-dependency creep.

The wrapper component, `<StudyLenses>`, is the only React-aware
surface in this system. Everything else (transforms, lenses, registry,
pipeline, EventBus, lens cache, state factory) is pure TS that the
wrapper composes via hooks.

## Bounded context

| Inside this directory                                    | Elsewhere                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `<StudyLenses>` React component (mount / dispatch / unmount effects) | The substrate it wraps lives one level up                              |
| Default registry assembly (`createDefaultRegistry`)      | Individual lens / transform modules live in `../lenses/` and `../transforms/`   |
| Toolbar (Increment 9+) — lens-picker, transforms, reset, recommender, snippet name | The state mutations the toolbar triggers go through the existing `setState` seam |
| `<BrowserOnly>` SSR boundary                             | The plugin emits `<StudyLenses>` JSX nodes; it does not render them              |
| Per-instance registry / bus / cache **lifecycle**        | Per-instance state factory + EventBus + lens cache **factories** live one level up |

## Architectural sketch

> Written Phase 0, expanded incrementally. The Refactor step of each
> Increment-9+ TDD increment is held against this sketch. Domain terms
> only — no function names, no variable names, no pseudocode.

### Execution phases

The `<StudyLenses>` lifecycle is three phases (initial mount, switch,
unmount), implemented across three named `useEffect`s post-Increment-9.

#### Phase 1: Initial mount

1. **Build per-instance handles** (sync, `useMemo`) — registry, bus,
   cache. Stable across re-renders so subsequent effects can capture
   them.
2. **Build initial state** (sync, `useState` lazy initializer) —
   freeze a fresh `OrchestratorState` from the props, with `snippet =
   originalCode` and `activeLens = initialLens`.
3. **Resolve and attach** (sync OR async, mount-effect) — validate
   pipeline → execute pipeline → resolve lens module → call
   `lens(code, cfg)` (await if Promise) → attach `mount.el` to the
   host ref. A cancellation flag inside the effect closure protects
   against unmount-mid-flight.

#### Phase 2: Switch (Increment 9+)

The lens-picker dropdown calls back into the wrapper with a target
lens name. The wrapper applies the transition through the existing
`setState` seam:

1. **State transition** (sync) — `setState` produces a new frozen
   `OrchestratorState` whose only diff is `activeLens`. The new state
   identity triggers the mount-effect.
2. **Detach** (sync, mount-effect cleanup) — remove the previously
   attached `mount.el` from the host. **Do not dispose.** The cached
   entry survives so the orchestrator can reattach it on a future
   switch-back.
3. **Reattach OR fresh mount** (sync OR async, mount-effect body) —
   `cache.get(name, cfg)` → cache hit reattaches the existing
   `mount.el`; cache miss runs `lens(code, cfg)` and `cache.set(name,
   cfg, mount)`.
4. **Dispatch** (sync, separate dispatch-effect, **runs after the
   React commit that updated `state.activeLens`**) —
   `bus.dispatch('lens-switched', { previous, next })` fires from a
   second `useEffect` whose dep is `[state.activeLens, bus]` and
   whose body uses a `useRef`-held previous-lens value to suppress
   the first-mount case. React effect ordering: effects run in
   registration order on commit; the dispatch-effect is registered
   AFTER the mount-effect, so its synchronous portion runs after the
   mount-effect's synchronous portion.

   **Important async caveat.** The mount-effect body is an `async
   function` invoked via `void run()`. Even when `lens(code, cfg)`
   returns synchronously and `cache.get(...)` hits, the body goes
   through an `await` and `host.append(mount.el)` happens in a
   microtask AFTER the synchronous portion of the commit completes.
   The dispatch-effect runs **synchronously** as part of the same
   commit, so listeners may observe `Dispatched` BEFORE `mount.el`
   is in the DOM. Subscribers that need the new mount attached
   should defer their work to a microtask (`Promise.resolve().then`)
   or `requestAnimationFrame`. The Increment-9 sandbox checkpoint
   verifies the observable behavior; future increments may flip the
   mount-effect to a synchronous fast-path for cache-hit and
   sync-lens cases (closing the async window for those paths).

   `LensSwitchedPayload.previous` is the value of the previous-lens
   ref at the moment the dispatch-effect fires — not necessarily the
   lens currently visible in the DOM. A switch issued during an
   in-flight async-mount cancellation may produce a `previous` that
   pre-dates the cancelled mount.

   (Resolved Increment-9 Phase-0 decision; see §Why a separate
   dispatch-effect below for the reasoning.)

#### Phase 3: Unmount

A dedicated unmount-cleanup effect (empty deps, captures stable
registry / bus / cache by closure) runs once on real component
unmount:

1. `bus.clear()` — drop every subscription.
2. `cache.visit(entry => entry.mount.dispose())` — call dispose on
   every cached lens.
3. `cache.clear()` — drop every entry.

This sequence runs **only on unmount**, never on state-driven effect
re-runs. That separation is what lets the cache survive across
switches (Phase 2 step 2 detaches without disposing).

### Data flow

```mermaid
flowchart TD
    Props["PluginEmittedProps"] -->|"build, sync, useMemo"| Substrate["per-instance<br/>registry / bus / cache"]
    Props -->|"build, sync, useState lazy"| State["OrchestratorState<br/>frozen"]
    Props -->|"lang ≠ 'js' branch"| Banner["banner + raw &lt;pre&gt;<br/>(no host attach)"]
    State -->|"validate, sync, throws"| Validated["validated Pipeline"]
    Validated -->|"on throw"| ErrorPane["&lt;pre data-orchestrator-error&gt;"]
    Validated -->|"execute, sync, pure"| Resolved["transformed code +<br/>resolved lens name"]
    Resolved -->|"lookup, sync, pure"| Module["LensModule (frozen)"]
    Module -->|"hash key, sync, pure"| HitCheck{"cache hit?"}
    HitCheck -->|hit| CachedMount["cached LensMount<br/>(name, hash(cfg))"]
    HitCheck -->|miss| FreshMount["fresh LensMount<br/>(name, hash(cfg))"]
    Module -->|"mount, sync OR async, may throw"| FreshMount
    FreshMount -->|"on async-cancel for fresh only"| Disposed["disposed mount<br/>(not attached)"]
    CachedMount --> Attached["lens host with<br/>mount.el child"]
    FreshMount --> Attached
    State -->|"dispatch on activeLens change, sync (after React commit)"| Event["dispatched<br/>LensSwitchedPayload"]
    Event -.may fire BEFORE Attached on async-mount paths.-> Attached
```

The diagram covers the happy path (Mount + Switch) and three failure
modes (lang ≠ js banner; validation throw; async-cancel-of-fresh-mount).
The dispatch edge originates from `State` (the trigger is
`state.activeLens` changing — what the dispatch-effect deps watch),
runs synchronously on the same React commit as the mount-effect, and
fires AFTER the mount-effect's synchronous portion. The dotted edge
captures the **async caveat**: because the mount-effect body is
async, `Attached` may complete in a microtask AFTER the synchronous
dispatch fires. See §Switch flow below for the isolated diagram and
§Phase 2 step 4 for the listener-side implications.

### Switch flow

This subsection is the canonical reference for Increment-9 toolbar
behavior. Anchor: `§Switch flow`. The data-flow diagram above covers
the cache-resolve / mount / attach machinery; this diagram is scoped
to the **user-trigger seam and the resolved dispatch ordering**.

```mermaid
flowchart TD
    userSelect["learner selects lens N<br/>(toolbar onChange)"] -->|"setState, sync"| Transitioning["new OrchestratorState<br/>(activeLens = N)"]
    Transitioning -->|"trigger mount-effect re-run, sync"| MountSync["mount-effect synchronous portion<br/>(detach, kick off run())"]
    MountSync -->|"trigger dispatch-effect, sync"| Dispatched["dispatched LensSwitchedPayload<br/>{ previous, next: N }"]
    MountSync -.async microtask, awaited cache-hit OR lens(code, cfg).-> Attached["mount.el attached to host"]
```

**Ordering on the commit**: `Transitioning` triggers BOTH the
mount-effect and dispatch-effect re-runs. Effects run in registration
order (mount-effect first, dispatch-effect second), so the
**synchronous portions** complete in that order: the mount-effect's
synchronous body schedules `void run()` and returns, then the
dispatch-effect fires `bus.dispatch(...)`.

**Async caveat (dotted edge)**: the mount-effect's `run()` is async
— even on cache-hit and synchronous `lens()` it goes through an
`await` before `host.append(mount.el)`. So `Attached` happens in a
microtask AFTER `Dispatched`. Listeners that need `mount.el` in the
DOM at callback time must defer their work
(`Promise.resolve().then(...)` or `requestAnimationFrame`).

(Resolved Increment-9 Phase-0 decision. See §Why a separate
dispatch-effect below for the reasoning. The async window may close
in a future increment if the mount-effect is split into a
synchronous fast-path for cache-hit and sync-lens cases.)

### Effect topology

Three named `useEffect`s, each with a single responsibility. The
**Cleanup work** column is the load-bearing distinction — splitting
detach (every re-run) from dispose (unmount only) is what makes
cache-hit reattach work.

| Effect              | Deps                                            | Cleanup runs on                              | Cleanup work                                              | Purpose                                                                          |
| ------------------- | ----------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `disposeOnUnmount`  | `[bus, cache]`                                  | on unmount only                              | `bus.clear`; `cache.visit(dispose)`; `cache.clear`        | Owns full teardown — runs once, on real unmount only (Increment 9 Pre-work-B split). |
| `mountActiveLens`   | `[state, registry, cache, langOk]`              | every effect re-run AND on unmount           | detach `mount.el` from host (NO dispose); set cancel flag | Resolve the active lens, attach `mount.el`. Cache survives across switch.        |
| `dispatchSwitch`    | `[state.activeLens, bus]` (Increment 9+)        | on `state.activeLens` change AND on unmount  | none — see registration-order note below                  | Fire `bus.dispatch('lens-switched', ...)` after a real switch. First-mount suppressed via ref. |

**Registration order** (top of the table = first registered, bottom =
last): `disposeOnUnmount`, `mountActiveLens`, `dispatchSwitch`.

**Cleanup order on unmount** (reverse of registration):
`dispatchSwitch.cleanup` (none) → `mountActiveLens.cleanup` (detach)
→ `disposeOnUnmount.cleanup` (bus.clear → cache-dispose-all →
cache.clear).

The `dispatchSwitch` cleanup is `none` because the dispatch effect
is purely a watch-and-fire; on unmount no further dispatch is needed
and `disposeOnUnmount` (declared earlier, cleanup runs later) clears
the bus. No dispatch fires into a cleared bus because the
dispatch-effect's body does not re-run during cleanup.

Splitting the cleanup across two effects (mount-effect retains
detach-without-dispose; unmount-effect owns the full teardown) is
what makes cache-hit reattach work across state-identity changes.
React fires both on real unmount in registration order (last
registered runs first), so the unmount sequence is: detach →
`bus.clear` → cache-dispose-all → `cache.clear`. No ordering
guarantees are required between the mount-effect cleanup's detach
and the unmount cleanup's dispose because dispose is safe to call on
a detached element.

### Structural constraints

- **`<BrowserOnly>` boundary.** Server-render produces
  `<pre>{code}</pre>`; no orchestrator wiring runs on the server.
- **Per-instance isolation.** Each `<StudyLenses>` instance owns its
  own registry, bus, cache, and state. Two instances on the same
  page do not share state.
- **`<div data-orchestrator="study-lenses">` is the lens host
  only.** Increment 9 wraps it in an outer
  `<div data-orchestrator-root>` that also contains the toolbar;
  existing tests selecting on the inner host attribute continue to
  pass.
- **Lang ≠ js short-circuits before any substrate work.** No
  validation, no execution, no lens resolution.
- **Validation failure is a render-side error fallback,** not an
  uncaught exception. The error-boundary contract sits inside the
  effect's try/catch.
- **Cancellation flag is per effect run.** A new effect run resets
  it to `false`; the previous run's cleanup sets the previous
  closure's flag to `true`.

### Out of scope

- **Pipeline construction at runtime.** The plugin parses fence
  syntax at build time and emits `transforms` + `lens` props. The
  orchestrator only validates and executes.
- **Lens internals.** The orchestrator never inspects the contents
  of `mount.el`. Lenses own everything inside the box.
- **Snippet analysis and recommendation.** Lives in `lib/analysis/`
  and `lib/recommender/` (TBD); the orchestrator consumes them
  through `recommend()` calls only when the recommender panel is
  opened (Increment 14).
- **Persistence.** No localStorage, no URL state. Per-instance
  in-memory only.

## Why split the cleanup across two effects

The Increment-8 wrapper had a single mount-effect whose cleanup ran
both detach and dispose-everything. For an unmount-only lifecycle
this is correct. For a switch lifecycle it is catastrophic: every
state-driven effect re-run would dispose the cache it was about to
read from, defeating the whole `(name, config-hash)` reattach
strategy.

Two named effects make the responsibility split explicit at the
source level: `mountActiveLens.cleanup` only undoes what its body
did this run; `disposeOnUnmount.cleanup` undoes everything once. The
split is a behavior-preserving refactor for the existing test suite
because async cancel still uses the per-effect closure flag and real
unmount still runs the full dispose sequence — just from a
different effect.

**Strict-mode caveat (development only).** React 18 Strict Mode in
development double-invokes effects on initial mount: setup → cleanup
→ setup. `disposeOnUnmount`'s cleanup runs in that fake-unmount
cycle and calls `bus.clear()` + `cache.visit(dispose)` +
`cache.clear()`. The first cycle's setup populates nothing (the
mount-effect runs separately and may not have set anything yet), so
the wipe is a benign no-op on the very first mount. After the first
switch in strict mode, the wipe would dispose the cached lens that
was just registered, defeating cache-hit reattach for that one
session. None of the Increment-9 tests wrap renders in
`<React.StrictMode>`, so the test suite does not exercise this
path; the `[bus, cache]` deps are stable references from `useMemo`
in production, which keeps the cleanup unmount-only outside strict
mode. A future increment may convert the deps to truly empty (with
an eslint disable + comment) or move the dispose-all into a
ref-based one-shot guard to make strict-mode safe end-to-end.

## Why a separate dispatch-effect (rather than dispatching in the handler)

Two reasons:

1. **Coverage of every switch.** A handler-only dispatch fires only
   from `onLensChange`. Future call sites — recommender selection
   (Increment 14), Reset All (Increment 12) — would each have to
   remember to dispatch. A dispatch-effect on `[state.activeLens]`
   covers every state mutation that changes the active lens, no
   matter who triggered it.
2. **Ordering with mount.** A handler-side dispatch fires before the
   React state commit. A dispatch-effect fires after the
   mount-effect re-run, so listeners observe the new mount as
   already attached. [`../DOCS.md`](../DOCS.md) §4 (Switch) describes
   `lens-switched` as fired after the new lens is mounted; the
   dispatch-effect places the call correctly without a
   synchronization dance.

The trade-off: the dispatch-effect needs a `useRef`-held previous-lens
value to suppress first-mount dispatch. That bookkeeping is contained
inside this directory.

## Module ownership

This module owns the React seam, the default-registry assembly, and
(post Increment 9) the toolbar component. It does NOT own:

- The substrate it wraps — see [`../README.md`](../README.md) and
  [`../DOCS.md`](../DOCS.md).
- Specific lens or transform implementations — see
  [`../lenses/`](../lenses/) and
  [`../transforms/`](../transforms/).
- The plugin's MDAST → JSX transformation — that lives outside
  `study-lenses/` entirely (in
  `src/plugins/study-lenses/`).

## Future direction

- Increments 10–14 add toolbar buttons (transform toggles, Reset,
  Reset All, snippet name, recommender). Each is a new prop or
  callback on the toolbar component; none change the effect
  topology.
- A future increment may extract the per-effect cleanup discipline
  into a `useStudyLensesLifecycle()` custom hook. That extraction is
  deferred until the third callback site appears (per AGENTS.md
  §Within-file helpers).
