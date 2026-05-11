# orchestrate — Architecture & Decisions

## Why this peer exists

`orchestrate/` is the React-aware peer of the three-peer architecture and the
**React seam** between the package's pure-TS substrate (`embody/`,
`orchestrate/lib/*`) and the rendered learner experience. It exports
`<StudyLenses>` — the package's public API.

**At the peer's top level** (the orchestrator itself):

- The `<StudyLenses>` component (`./index.tsx`).
- The toolbar lens-picker, the Q-I always-on surface (`./toolbar.tsx`).
- The recommendations panel UI shell, covering Q-II auto-paths plus Q-III
  ranking-overrides (`./recommendations-panel.tsx`); the recommender engine
  itself lives in `./lib/recommender/`, owned by WS2. Q-IV (manual study paths)
  is deferred entirely.
- The orchestrator-internal types (`./types.ts`): prop contract, 2-mode state
  machine, lazy-embodiment trigger policy, internal EventBus event taxonomy.

**As subdirs** (separable concerns):

- [`./editor/`](./editor/) — the home-base editor, the only writer of snippet
  state.
- [`./lib/`](./lib/) — the pure-TS analysis libs every consumer uses
  (recommender, socratizing, completing, editing, error-interpreting,
  jej-documentation, analysis).

[`embody/`](../embody/) and [`lenses/`](../lenses/) are pure-TS peers;
`orchestrate/` is where React enters and where the learner-facing experience is
assembled. Concentrating everything React-aware here keeps the substrate
testable in vitest without `jsdom` and limits framework-portability concerns to
one peer.

The peer follows a **primary-export-at-top-level** convention: `<StudyLenses>`
and its co-bundled UI files (toolbar, panel, types) sit at the peer's top level,
mirroring [`../embody/`](../embody/)'s convention where `embody()` lives at
`embody/index.ts`. Subdirs (`editor/`, `lib/`) are separable concerns the peer
also owns; the orchestrator's primary export sits above them at the peer root.

> **Prior art**: the pre-refactor orchestrator's architectural sketch was
> relocated to a sibling `orchestrator/` directory during the Phase A refactor
> (commit `5d6fc54`) and then deleted when F1 brought the new orchestrator
> online. Structural patterns documented there carried forward (cleanup-split
> rationale, `vi.hoisted` test pattern, async-caveat for mid-mount
> cancellation); specific mechanisms (cache, framework-agnostic LensMount,
> multi-prop API, always-active lens mount, transforms tier) were superseded per
> the locked decisions in
> [`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles).
> The pre-refactor source remains in git history under commits prior to F1.A.

## Architectural sketch

> Written Phase 0, before implementation. The Refactor step of each increment in
> [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
> is held against this sketch. Domain terms only — no function names, no
> variable names, no pseudocode (React API names like `useEffect` / `useState` /
> `useRef` are acceptable as structural-mechanism references).

> **End-state vs. F1 + B reality.** The diagrams below depict the steady-state
> F2/F3/F5 architecture (mode discriminator, lens-mode subtree, lens-switched
> dispatch, recommendations-panel branch). In F1 + B the wired path is
> `snippet → embody → {registered-lens-mount || editor-mount}` — when the `lens`
> prop matches a registered key (currently only `debug-props`), the orchestrator
> mounts that lens with `embodiment` + `resolvedConfig`; otherwise the editor
> mounts unconditionally. Specifically still missing: full mode discriminator
> (no editor↔lens transition, no `onSnippetChange` edge — the F1 textarea is
> editable but does not propagate up), no panel-open path (ships before L5), no
> internal-bus dispatch (ships before F5), only the single bootstrap registry
> entry (F4 grows it). The F1+B effect topology is _"embody fires on every
> snippet change, derived synchronously; lens dispatches when `lens` prop
> matches a registered key"_; F2-F5 and L1-L8 narrow it further. See
> [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
> and
> [`../.planning-handoffs/B-plugin-alignment.md`](../.planning-handoffs/B-plugin-alignment.md)
> for the per-increment narrowing schedule.

### Lifecycle modes

The orchestrator's UI is in exactly one of two modes at a time (per
`03-orchestrator-and-contracts.md` F2):

```mermaid
stateDiagram-v2
    [*] --> EditorMode: initial mount
    EditorMode --> LensMode: learner opens a lens<br/>(picker selection OR panel selection)
    LensMode --> EditorMode: learner exits lens
    LensMode --> LensMode: learner switches to a different lens<br/>(reuses current embodiment;<br/>previous lens unmounts)
    EditorMode --> EditorMode: learner edits snippet<br/>(no embodiment built yet)
    LensMode --> [*]: component unmount
    EditorMode --> [*]: component unmount
```

- **Editor mode** — [`./editor/`](./editor/) is mounted; learner is editing the
  snippet string. **No active lens, no embodiment.** Picker is visible.
- **Lens mode** — a lens is active with a frozen embodiment + lens config bundle
  as React props. Snippet is read-only while in lens mode. Switching lenses
  reuses the current embodiment; previous lens unmounts; new lens mounts fresh.

The mode switch from editor → lens is the moment the snippet is snapshotted.
Returning editor → lens later (after edits) builds a NEW embodiment.

### Prop-to-mode routing (peer-level view)

Where each prop ends up. Answers: "what powers the editor path, the lens path,
and the recommendations panel?" Includes the recommender as a sibling of
editor + lens; omits internal state and bus dispatch (those are in the next
diagram).

```mermaid
flowchart TD
    SnippetProp["snippet prop<br/>(string, required)"]
    LensProp["lens? prop<br/>(string, Q-III default)"]
    ConfigsProp["configs? prop<br/>(whole resolved cascade, opaque;<br/>per-fence/sibling override pre-merged<br/>INTO configs.lenses[lens])"]

    SnippetProp --> EditorPath
    SnippetProp -->|"embody, sync (lazy on lens-open)"| Embodiment["frozen Snippet<br/>(embodiment)"]

    Embodiment --> LensPath
    Embodiment --> RecPath
    LensProp --> LensPath
    ConfigsProp -->|"read configs.lenses?.[lens]"| LensPath

    EditorPath["editor mode<br/>(home base mounted; consumes snippet string only)"]
    LensPath["lens mode<br/>(active lens mounted with embodiment +<br/>resolved per-lens config)"]
    RecPath["recommendations panel<br/>(WS2 recommender ranks applicable lenses)"]

    Picker["toolbar lens-picker<br/>(Q-I — always available)"] -->|"selection, sync"| LensPath
    RecPath -->|"selection, sync"| LensPath
    EditorPath -->|"learner opens lens, sync"| LensPath
    LensPath -->|"learner exits lens, sync"| EditorPath

    EditorPath -->|"edit, sync"| SnippetProp
    SnippetProp -.invalidates cached embodiment.-> Embodiment
```

The recommendations panel opens via an explicit toolbar button or keyboard
shortcut — that open-trigger is a UI affordance, not a data path, so it isn't
drawn in the data-flow diagram. Lands in L5 alongside the panel UI itself.

#### Per-lens config resolution chain

For any lens the learner mounts, the final config feeding
`<LensModule.Component config={…}>` is computed as:

```text
resolved(lensName) = module.config()                  // tier 0: lens defaults
                   ⊕ configs.lenses?.[lensName]       // tier 1: cascade (post-merge with per-fence/sibling override)
```

`⊕` is **deep-merge-right-wins**. The orchestrator computes this two-tier chain
in its pipeline; lens authors don't compute it themselves. There is no separate
per-fence-override tier on the orchestrator side — the plugin pre-merges the
URL-style query / directive JSON INTO `configs.lenses[lens]` before emission, so
the cascade IS the merged truth.

`resolvedDefault` resolution order:

1. The `lens` prop (populated upstream by the plugin from per-fence `:suffix`,
   frontmatter `defaultLens`, or sibling `@study-lens` directive — cascade
   `defaults[lang]` is gate-only and does NOT populate `lens` per AR-1 locked
   decision 1; the cascade-supplied default seam is L2-deferred. Or set directly
   by an MDX-author writing `<StudyLenses lens="…" />`).
2. None — when no default resolves, the orchestrator mounts the editor home base
   (no lens dispatch). There is no mount-time guard at F1+B; with no separate
   `config` prop, the pre-3-prop guard has no trigger surface.

L2 will extend the resolution order with a cascade-supplied default seam
(currently deferred — the seam shape lives somewhere in `configs` itself; L2's
Phase 0 settles the exact key, e.g. `configs.defaults` re-used or a dedicated
`configs.defaultLens` slot).

**F1+B note on the resolution-chain formula.** At F1+B,
`resolvedDefault === lens` always (no cascade-supplied default seam yet). The
two-tier chain is the steady-state shape; L2 may add a third tier ONLY if the
cascade-supplied default seam introduces a config layer (it likely does not —
that seam concerns the default lens NAME, not its config). Implementing agents
write the formula as two tiers; AR-3/AR-4 should not flag the absence of a
tier-2 override-decoration.

Steady-state lifecycle:

- `<StudyLenses>` ingests the `snippet` prop.
- `embody()` turns the snippet directly into a frozen `Snippet` — lazy (built
  when a lens or evaluation needs it). Format compliance is checked inside
  `embody` and surfaced via `Snippet.validation.formatted` (boolean) plus
  JEJ-subset violations on `Snippet.validation.violations`. The orchestrator
  does NOT pre-format; formatting is the learner's responsibility.
- The orchestrator switches between **editor mode** (home base active, no lens)
  and **lens mode** (active lens mounted with embodiment + config props).
- The toolbar lens-picker (Q-I) is always visible; the recommendations panel
  (Q-II auto-paths; Q-III ranking-overrides extend it via WS3 increments L7/L8)
  opens via toolbar button. Q-IV (per-snippet manual study paths) is DEFERRED
  entirely.
- An edit in the editor produces a new snippet string; any cached embodiment is
  discarded; the next lens-open or evaluation triggers a fresh embody.

### Mode-gated state machine (component-internal view)

What state lives where, and how the mode discriminator gates the React subtree
mounted at any moment. Answers: "what's in React state, and what does the
internal bus dispatch when?" Adds the mode discriminator + bus dispatch the
prior diagram omitted; drops the recommendations panel (which doesn't sit in
mode state).

> **This diagram depicts the F2+ end-state.** At F1+B there is no `mode` state —
> the orchestrator dispatches directly from `lens`-prop registry-membership
> without a mode discriminator. See the F1+B narrowing block at the top of
> §Architectural sketch for the partial-wiring shape.

```mermaid
flowchart TD
    Props["&lt;StudyLenses snippet=… lens?=… configs?=…&gt;"]

    Props -->|"lazy state, sync read"| Mode["mode: editor | lens<br/>(initially editor)"]
    Props -->|"lazy state, sync read"| SnippetState["snippet: string<br/>(controlled by editor)"]

    Mode -->|"editor mode"| EditorMount["&lt;EditorComponent<br/>snippet onSnippetChange&gt;"]
    SnippetState --> EditorMount
    EditorMount -->|"edit notification, sync"| SnippetState

    Mode -->|"lens mode (on transition)"| EmbodyTrigger["embody trigger"]
    SnippetState --> EmbodyTrigger
    EmbodyTrigger -->|"embody, sync"| Embodiment["frozen Snippet"]

    Mode -->|"lens mode"| LensMount["&lt;LensModule.Component<br/>embodiment config&gt;"]
    Embodiment --> LensMount
    LensProp["resolved lens name<br/>(from picker OR recommendations panel)"] --> LensMount
    ResolvedConfig["resolved LensConfig<br/>(module.config() ⊕ configs.lenses?.[lens])"] --> LensMount

    Mode -->|"dispatch on mode change, sync"| InternalBus["lens-switched event<br/>(internal bus)"]

    SnippetState -.invalidates cached embodiment on edit.-> Embodiment
```

#### Failure modes (embody trigger + lens internals)

Errors the orchestrator coordinates between the embody trigger and the mounted
lens:

- **Validation / parse error at embody trigger** — surfaces in lens mode at the
  moment the trigger fires (lens-open from editor). `embody` does NOT throw; it
  returns a `Snippet` whose `status.parsed=false` (or equivalent gates),
  `errors` field, and `validation.{formatted, isJeJ, violations}` flags carry
  the diagnostic. The lens receives that embodiment and displays per its own
  error-surface contract. NOT surfaced while typing.
- **Evaluation error inside a lens** — surfaces only when the lens's evaluation
  triggers (run / predict button), even if detectable statically. Per lens's own
  error-surface contract.
- **Async setup inside a lens** — async resource loading (e.g. CodeMirror
  language modules) lives inside the lens's React component, not in the embody
  trigger. The orchestrator's embody trigger is **sync** by contract: embody →
  cache. If a future evaluation engine needs async embody, that contract change
  re-opens this section; until then, sync.

### Switch flow (lens-mode internal)

When already in lens mode and the learner picks a different lens via the picker
or panel:

```mermaid
flowchart TD
    Selection["learner picks lens N<br/>(picker change OR panel cell)"]
    Selection -->|"state transition, sync"| ActiveLens["state.activeLens = N"]
    ActiveLens -->|"reconciliation, sync"| Unmount["previous lens unmounts<br/>(React runs its cleanups)"]
    ActiveLens -->|"mount, sync"| LensMount["&lt;LensModule.Component<br/>embodiment={…current} config={…N's}&gt;"]
    Unmount --> InternalBus["lens-switched event<br/>(internal bus; payload: { previous, next: N })"]
    LensMount --> InternalBus
```

Snippet does NOT change during a lens-mode switch — same embodiment is fed to
the new lens. The previous lens's in-progress UI state (parsons shuffle, blanks
fills) is gone (per disposability). The new lens's `LensModule.Component` mounts
fresh; if it does async setup, it manages that internally.

The `lens-switched` event fires INTERNALLY (no outbound emit). The picker
re-renders to reflect the new default-selected option.

### Effect topology

The orchestrator owns **three named effect categories**. Editor and
lens-internal effects are listed second for system-wide context, but they are
not orchestrator categories — they're the neighbors' effects shown so the
cross-module picture is visible in one place.

**Orchestrator-internal effect categories** (load-bearing names; specific deps
and ordering pin during F1's Phase 0):

> **F1 + B narrowing of this table.** F1 implements the **Embody trigger** only,
> with a _broadened_ trigger condition: because F1 has no mode discriminator,
> embody fires on every snippet change unconditionally, not only on mode → lens
> transition. The B work-stream (plugin alignment) adds the **Lens-mount
> dispatch** category as a partial wiring of `lens` prop dispatch — a
> single-entry static registry routes `lens="debug-props"` to the
> [`debug-props` meta-lens](../lenses/debug-props/) for sandbox-harness
> verification of the three-prop shape; any other `lens` value continues to
> mount the editor (F1 narrowing). F2 narrows the embody trigger to the table's
> "mode → lens transition" row shape once the discriminator lands; F3 refines
> further to lazy-on-need; F4 grows the registry beyond the debug-props
> bootstrap entry. The remaining categories (Lens-switch dispatch,
> Embodiment-on-edit invalidation) are wired in F5 and F2 respectively. The
> exact React shape in F1 (`useMemo` keyed on `snippet` vs.
> `useState`+`useEffect`) is an implementation choice F1.B picked during TDD —
> the F1 contract pinned here is just _"a fresh `Snippet` is available on every
> snippet change, derived synchronously"_.

| Category                            | Triggers on                                                      | What it does                                                                                            | Cleanup                                |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Embody trigger** †                | mode → lens transition                                           | `embody(snippet)` → cache embodiment in state                                                           | None — embodiment is plain frozen data |
| **Lens-mount dispatch** †           | render with `lens` matching a registered key (B bootstrap → F4+) | Mount `<LensModule.Component embodiment={…} config={resolvedConfig} />` instead of the editor home base | Per-lens React `useEffect` cleanups    |
| **Lens-switch dispatch**            | active-lens change while in lens mode                            | Fire `lens-switched` (payload `{ previous, next }`) on the internal bus                                 | None                                   |
| **Embodiment-on-edit invalidation** | snippet change while in editor mode                              | Discard cached embodiment; next lens-open builds a fresh one                                            | None                                   |

† **F1+B reality**: the Embody-trigger row's "Triggers on" column depicts F2
end-state. At F1+B, embody fires on every snippet change unconditionally (no
mode discriminator yet); F2 narrows it to the listed shape. The Lens-mount
dispatch reads the embodiment built by the broadened Embody trigger **in the
same render** — same-render ordering eliminates the stale-embodiment race even
without a mode discriminator. Both rows narrow as later increments land.

**Neighbor effects (system-wide context, not orchestrator categories)**:

| Module                      | Effect                  | Triggers on                    | What it does                                                                              | Cleanup                       |
| --------------------------- | ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------- |
| `orchestrate/editor/`       | Editor mount / teardown | editor mode entered / exited   | Construct CodeMirror EditorView async; append to host; tear down (`destroy()`) on cleanup | `EditorView.destroy()`        |
| `lenses/<name>/` (per lens) | Lens-internal effects   | lens-component mount / unmount | Lens-author concern (e.g. parsons shuffle, blanks state, async language modules)          | Per-lens `useEffect` cleanups |

What's NOT in the topology (vs the pre-refactor design):

- ~~`mountActiveLens`~~ — React reconciles components by tree position; no
  manual mount/detach.
- ~~`disposeOnUnmount` cleanup orchestrating `mount.dispose()` for every cached
  lens~~ — no cache; each lens's own `useEffect` cleanups run when React
  unmounts it.
- ~~`onSnippetChanged` IoC dispatch to cached mounts~~ — no cache; no in-place
  propagation. React unmounts the lens; the next embodiment props feed a fresh
  mount.

See [`./editor/DOCS.md`](./editor/DOCS.md) for the editor module's
mount/teardown details.

### Internal event taxonomy (sketch)

The internal EventBus carries intra-component coordination events. Specific
payloads pin during F1/F5; the sketched roster:

| Event                | Fires on                                  | Implemented in | Notes                                                                                 |
| -------------------- | ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `lens-switched`      | active-lens transition (lens-mode switch) | F5             | Payload: `{ previous: string \| null, next: string }`. Picker re-render trigger.      |
| `mode-changed`       | editor ↔ lens mode transition             | F5             | Payload: `{ from: 'editor' \| 'lens', to: 'editor' \| 'lens' }`. May fold into above. |
| `exercise-completed` | lens fires its own completion signal      | future         | Lens-internal; orchestrator forwards. Shape per-lens, opaque to orchestrator.         |
| `lens-mount-error`   | lens throws during mount or async setup   | future         | Surfaces lens errors to the orchestrator's error UI.                                  |

The taxonomy is **internal-only**: no `subscribe` / `onEvent` prop on
`<StudyLenses>` until a concrete LMS integration target appears (per F5). When
that target appears, the externalized protocol can be a curated subset of these.

### Structural constraints

- **Public surface is one component**: `<StudyLenses>`. **Three props** total —
  one required (`snippet`), two optional (`lens?`, `configs?`). Everything else
  internal. See § Per-lens config resolution chain (above) for how
  `configs.lenses[lens]` flows per lens. The pre-3-prop `config?` prop is
  absorbed into `configs.lenses[lens]` at plugin emission time.
- **No consumer-side sentinel branching.** During the Phase A embody mock,
  `embody(code)` accepts named-scenario sentinels (e.g. `"OK"`,
  `"FAIL_AT_PARSE"`, `"EVAL_TIMEOUT"`). Orchestrator code MUST NOT branch on
  `snippet.source.code === "OK"` or any sentinel literal. Always branch on the
  resulting `Snippet`'s `status.{tokenized, parsed, created}`, `errors`,
  `validation.{isJeJ, isDeterministic, doesPause}`, and `endReport.outcome`
  (from a resolved `streams.evaluate.run()`). Sentinels are inputs to `embody()`
  only; in Phase B they vanish (real tokenization replaces the discriminator)
  and any consumer code that branched on them silently breaks. See
  [`../embody/index.ts`](../embody/index.ts) JSDoc and
  [`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md).
- **Single-writer state.** Only [`./editor/`](./editor/) mutates snippet source.
  The orchestrator threads the editor's `onSnippetChange` callback into its
  state-update; lenses receive `embodiment` via props and have no mutation
  surface.
- **Editor mode vs lens mode** is a 2-state machine. There is no concurrent
  "editor + lens" rendering. Editor mode = home base mounted, no lens, no
  embodiment. Lens mode = active lens mounted with frozen embodiment + config;
  snippet is read-only.
- **Lazy embodiment.** The orchestrator builds a new `embodiment` only when
  something downstream needs it (lens-open from editor, evaluation trigger
  inside a mounted lens). Never on every keystroke; no debounced background
  re-embody; no speculative pre-build.
- **Disposable practice.** Snippet edits invalidate any cached embodiment AND
  trigger React unmount of the active lens. When re-entering lens mode against
  the new snippet, a fresh lens mount happens with the new embodiment.
  Lens-internal UI state is per-mount only.
- **Internal-only EventBus** (per WS3 handoff F5). The orchestrator's bus
  coordinates intra-component communication (picker → orchestrator → mounted
  lens). No outbound `subscribe` prop on `<StudyLenses>` until a concrete LMS
  integration target exists.
- **Picker always visible**: the toolbar lens-picker dropdown is shown in BOTH
  editor mode and lens mode — it's the Q-I autonomy guarantee.
- **Recommendations panel is opt-in UI**: opens via toolbar button or keyboard
  shortcut. Not always visible; not modal.
- **Async caveat carries forward**: any `useEffect` body that awaits a Promise
  (async lens setup, future async embody) creates a microtask gap between
  effect-fire and side-effect-completion. Subscribers to `lens-switched` that
  need the new mount in the DOM should defer their work to a microtask or
  `requestAnimationFrame` (the pre-refactor orchestrator's effect topology
  surfaced this as Phase 2 step 4; durable rule).
- **Dependency rules** (per `../DOCS.md` § Dependency rules):
  - `orchestrate/` may import from `orchestrate/lib/*`, `embody/`, `lenses/`,
    `@-utils`.
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`,
    `@-utils`. Never from `lenses/`.
  - `lenses/<lens>/*` receives `embodiment` via props from the orchestrator. May
    import (type-only) from `embody/types.ts` and (runtime + type) from
    `orchestrate/lib/*` and `@-utils`. Never imports runtime values from
    `embody/` (top) or `orchestrate/` (top).

### Out of scope

- **Embodiment construction details** — owned by [`../embody/`](../embody/). The
  orchestrator just calls `embody(snippet)` and consumes the returned `Snippet`.
- **Format pre-processing** — `embody` checks format compliance via
  `Snippet.validation.formatted` and surfaces JEJ-subset violations via
  `Snippet.validation.violations`; the learner formats their own code; the
  orchestrator does not pre-format. (Was sketched in earlier drafts; removed per
  the user-confirmed Phase 0 decision.)
- **Lens internals** — owned by [`../lenses/`](../lenses/). The orchestrator
  passes `embodiment` + `config` props; what the lens does inside is its own
  concern.
- **Recommender engine** — owned by [`./lib/recommender/`](./lib/recommender/)
  (WS2). The orchestrator's panel UI consumes the engine's output; it does not
  re-rank.
- **Editor implementation** — owned by [`./editor/`](./editor/). The
  orchestrator threads its callback prop and renders it in editor mode.
- **System-wide learner state, knowledge graph, ZPD positioning** — LMS's job
  per `../DOCS.md` § "What we explicitly do NOT own".
- **Multi-snippet path arrangement** — LMS's job. Each `<StudyLenses>` instance
  is one stepping stone; the LMS arranges them.
- **Grade reports / LMS integration / cheating detection** — top of the pyramid;
  LMS responsibility.
- **An outbound data-emit protocol** — DEFERRED until a concrete LMS integration
  target exists. Internal events stay internal.
- **Per-snippet manual study tours (Q-IV)** — DEFERRED entirely per
  `03-orchestrator-and-contracts.md` § Layer IV. Auto- recommended Q-II tours
  via the panel are sufficient.

## Pyramid mapping

`orchestrate/` ships **the orchestrator side of Layers I-III** of the
Explorotron pyramid (per `../README.md` § Pedagogical first principles):

| Layer                              | What `orchestrate/` provides                                                                                                                           | Where it lives                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Layer I (Lenses & defaults)        | Toolbar lens-picker dropdown over the registered lens roster                                                                                           | `orchestrate/toolbar.tsx` (planned)                                                    |
| Layer II (Path generation)         | Recommendations panel UI consuming the WS2 recommender's filtered + ranked grid                                                                        | `orchestrate/recommendations-panel.tsx` (UI) + `orchestrate/lib/recommender/` (engine) |
| Layer III (Manual recommendations) | `lens` + `configs` prop seam pre-filled by per-fence info-string and `lenses.json` cascade (per-fence override pre-merged into `configs.lenses[lens]`) | `orchestrate/index.tsx` (consumes the props)                                           |
| Layer IV (Manual study paths)      | DEFERRED at snippet scope (per `03-orchestrator-and-contracts.md` § Layer IV)                                                                          | n/a                                                                                    |

The pyramid base (Progress modelling) and top (Monitored learning) are
explicitly NOT owned by `orchestrate/` — those belong to the embedding LMS.

## Why two-mode state machine (vs always-active)

The pre-refactor design always had a lens mounted (the editor lens was the
default). When the learner edited code, the editor lens absorbed the edits via
its own UI; other lenses (parsons, blanks) reacted via `onSnippetChanged`.

The new architecture's editor-vs-lens split makes the editing- vs-exercising
boundary explicit:

- In editor mode, the learner is **authoring** code — the editor is the focus;
  no lens is active; no embodiment is built.
- In lens mode, the learner is **exercising** an embodiment — the snippet is
  frozen; the lens is the focus.

Benefits:

- **Simpler state.** No "editor lens edits while parsons lens shuffles"
  concurrency. One mode at a time, one clear focus.
- **Lazy embodiment is natural.** Building embodiments only at mode transition
  matches what the learner expects: typing is cheap; opening an exercise costs
  an embody.
- **Disposability is structural.** Snippet edits in editor mode don't disturb
  any lens — there is no lens. The next lens-open builds a fresh embodiment.

The cost is a UX nuance: the learner can't type code WHILE watching parsons
shuffle reorder. Per the locked disposable-practice decision and the Explorotron
framing, this is the intended pedagogical model: practice surfaces (lenses) are
distinct from authoring surfaces (editor); switching modes is an explicit
pedagogical commitment.

## Why lazy embodiment

The pre-refactor design built embodiments eagerly: every effect re-run rebuilt
or revalidated. That was fine because the "embodiment" was light (a parsed AST).
The new `embody()` factory is heavier — it bundles parse, validation, scope
analysis, metrics, and (eventually) entwined event streams.

Building embodiments on every keystroke would be wasteful when most keystrokes
are mid-statement and not yet parseable. The lazy strategy ties embody
construction to **explicit user actions** (open a lens, run/predict an
evaluation phase) — moments where the learner has paused and the snippet is
meaningful to inspect.

This also aligns the **error-surfacing UX**: validation / parse /
format-compliance signals appear at lens-open time (not while typing) — surfaced
via `Snippet.validation.*` and `Snippet.errors` on the returned embodiment.
Evaluation errors appear at run/predict time (not statically). Per the
lifelong-learning autonomy principle, this avoids intruding on the learner's
typing with real-time syntax-error spam.

## Why internal-only EventBus

The pre-refactor design implicitly assumed an LMS would consume events from the
orchestrator (lens-mounted, exercise-completed, etc.). The new architecture
defers that protocol entirely until a concrete integration target exists.

Reasons for deferral:

- **Premature interface design risks lock-in.** Without a real LMS in hand, we'd
  guess at event payload shapes, subscribe-prop signatures, and timing
  semantics. Wrong guesses become hard to reverse once curriculum authors depend
  on the contract.
- **Internal coordination is enough today.** The picker + the recommendations
  panel + the editor all live inside the same React tree; React's natural
  component composition + a private EventBus suffice for intra-`<StudyLenses>`
  plumbing.
- **The event taxonomy can mature internally.** As lenses ship and the
  orchestrator's coordination needs grow, the internal events evolve. When an
  LMS appears, the externalized protocol can be a curated subset of the internal
  events that proved useful.

The internal EventBus inherits from the pre-refactor Inc-9 EventBus pattern
(`bus.dispatch`, `bus.subscribe`, `bus.clear`) but is not exposed on
`<StudyLenses>`'s prop surface.

## Why the editor is a peer subdir, not a lens

In the pre-refactor architecture the editor was a `LensModule` named `'editor'`
— also the unknown-name fallback target. That made it look like
just-another-lens, but it was structurally different: only the editor lens was
meant to mutate snippet state; every other lens was read-only. The
framework-agnostic `LensMount` contract didn't enforce this distinction.

The new architecture makes the distinction structural:

- `orchestrate/editor/` is a peer subdirectory, not a lens. It's the
  always-present home base.
- The editor's React component takes an `onSnippetChange` callback prop — the
  only mutation surface for snippet state in the whole system.
- Lenses receive `embodiment` (frozen) via props; they have no mutation surface.

The single-writer model is enforced at the type level: only the
`orchestrate/editor/` component's prop signature accepts an `onSnippetChange`
callback. A lens's `LensProps` (in `../lenses/types.ts`) has no such field.

## Why three named effect categories (vs Inc-9's three named effects)

The pre-refactor Inc-9 design had three named effects: `disposeOnUnmount`,
`mountActiveLens`, `dispatchSwitch`. The new topology has three categories that
look different but solve the same problems:

- **Inc-9 `disposeOnUnmount`** managed cache disposal on real unmount. Replaced
  by **per-lens-React-cleanup** — each lens's `useEffect` cleanups run when
  React unmounts it. No central registry to clean up.
- **Inc-9 `mountActiveLens`** managed the framework-agnostic mount lifecycle
  (attach/detach `mount.el` to host ref). Replaced by **React reconciliation** —
  the orchestrator just renders `<LensModule.Component>` and React handles the
  rest.
- **Inc-9 `dispatchSwitch`** fired `lens-switched` events. Survives as the
  **lens-switch dispatch** category in the new topology.

Two new categories appear:

- **Embody trigger** — replaces what used to happen inside the pre-refactor
  `mountActiveLens` body (validate, execute pipeline, lens.lens). Embody
  centralizes the substrate calls.
- **Embodiment-on-edit invalidation** — new because the pre-refactor design
  always had an active embodiment. Lazy embodiment requires explicit
  invalidation when the snippet changes.

## Module ownership

What this peer owns is enumerated in
[`./README.md` § What lives here](./README.md); this section calls out only the
**negative-space** boundaries — what looks like it might belong here but
doesn't, plus the one load-bearing open-spec item.

**Open-spec item the peer owns**: the **lens registry** mechanism. B
bootstrapped a single-entry static map keyed by lens name
(`{ "debug-props": DebugPropsLens }`) at the peer's top level for the
sandbox-harness verification path; F4 Phase 0 settles whether the registry stays
a static map, grows a runtime `register()` API, or refactors entirely when the
first pedagogical trial lens lands. Either way the registry lives at the peer's
top level alongside the `<StudyLenses>` component.

This peer does NOT own:

- The `embody()` factory or its substrate (lives in [`../embody/`](../embody/)).
- Specific lens implementations (live in [`../lenses/`](../lenses/)).
- Per-lib content for the analysis libs — owned by WS2 (recommender, analysis)
  and per-lib sessions (socratizing, completing, editing, error-interpreting,
  jej-documentation).
- The Docusaurus plugin's prop emission contract (lives in
  `src/plugins/study-lenses/`; alignment is flagged in
  `03-orchestrator-and-contracts.md` Cross-handoff impact).

## Future direction

- The async-embody affordance (loading state during embody-on-trigger) lands in
  F3 Phase 0 if needed. Sketch only — pin during F3 implementation. Until then:
  embody is sync.
- The picker + panel coexistence visual design (overlapping? side-by-side? modal
  panel?) lands during L5's Phase 0 sandbox checkpoint.
- Outbound LMS event protocol — designed when a concrete integration target
  appears. The internal EventBus is the wire-tap point; the public contract
  stays minimal until then.
- Per-snippet manual study tours (Q-IV) — re-introducible if a curriculum need
  surfaces. Per `03-orchestrator-and-contracts.md` § Layer IV, the path is a
  `sequence` field inside `config` (no new top-level prop) plus a
  sequential-walk-through component inside `orchestrate/`.
- `orchestrate/lib/` index — as more analysis libs land, the index README may
  grow into a richer per-lib summary table.
