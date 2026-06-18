# orchestrate

The package's React-aware peer. Wires [`embody/`](../embody/) (the operational
NM data layer), [`lenses/`](../lenses/) (the read-only views), and the home-base
[`editor/`](./editor/) into one consumer-mountable surface, and ships the
package's public API: `<StudyLenses>`.

## What lives here

```text
orchestrate/
  README.md                  (this — orientation + navigation)
  DOCS.md                    architectural sketch + Mermaid (peer + StudyLenses)
  types.ts                   <StudyLenses> prop contract + state shape + INTERNAL EventBus events

  index.tsx                  the <StudyLenses> component (owns surface-mount routing + runs the panel derivations — see § The phases panel)
  event-bus.ts               createEventBus() — per-instance internal pub/sub
  stations.ts                STATIONS — the canonical left → right station order
  derive-station-roster.ts        (registry) → per-station lens rosters (static)
  derive-station-availability.ts  (type, validation) → shown stations (per-edit)
  derive-station-status.ts        (status, errors) → per-station statuses (per-edit)
  phases-panel/              the panel component — presentation only (replaced toolbar.tsx)
    index.tsx, README.md, DOCS.md, tests/
  tests/                     vitest jsdom tests

  editor/                    default home base — only writer of snippet state
    index.tsx, README.md, DOCS.md, tests/

  lib/                       analysis helpers — all (embodiment) → result
    README.md                (index — links to per-lib READMEs/DOCS)
    recommender/             snippet-fit lens ranking (deferred backlog; sibling of the future Quiz engine)
    socratizing/             Socratic micro-decision analysis (the Quiz button calls this)
    editing/                 editor integration helpers (CodeMirror wrapper)
    error-interpreting/      learner-friendly error messages (feeds interpreted diagnostics)
```

The peer follows a **primary-export-at-top-level** convention: `<StudyLenses>`
and its co-bundled files (the phases panel module and the three station
derivations) sit at the peer's top level alongside the subdirs `editor/` and
`lib/`. This mirrors [`../embody/`](../embody/)'s convention — the peer's
primary export sits at the peer's top level (`embody()` at `embody/index.ts`;
`<StudyLenses>` at `orchestrate/index.tsx`). Subdirs are separable concerns the
peer also owns; the orchestrator's primary export sits above them at the peer
root.

The two subdirs map to separable concerns:

- **`editor/`** — the always-present home base where learners type snippets. Per
  the locked single-writer state model, this is the ONLY surface that mutates
  snippet state. It is also the Cycle-1 surface for **interpreted diagnostics**
  (friendly error explanations in the gutter — see § Interpreted diagnostics).
- **`lib/`** — pure-TS analysis utilities every consumer can call with an
  `embodiment` as input. The recommender lives here (deferred backlog); the
  editor and the orchestrator consume the others (`editing`,
  `error-interpreting`, `socratizing`). The JEJ-aware editor adapters
  (`completing`, `documenting`, `formatting-editor`, `linting`) live at the
  JEJ-package [`lib/`](../lib/) peer, not here.

Everything else (the `<StudyLenses>` component, mode state, lens dispatch, the
affordance container — the phases panel — and the internal EventBus) lives at
the peer's top level: these are inseparable from the orchestrator because they
ARE the orchestrator.

## Public API: `<StudyLenses>`

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
<StudyLenses snippet={X} lens="annotate" />
<StudyLenses
  snippet={X}
  lens="annotate"
  configs={{ lenses: { annotate: { defaultView: 'code' } } }}
/>
```

(The `configs` shape shown is what today's plugin emits and what hand-written
JSX usually looks like — see the prop table for the type-level contract, which
is intentionally **maximally opaque**. The orchestrator's `lenses[lens]` lookup
is an internal structural assumption, not a public type constraint.)

Three props (per the locked decision in
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
and the **3-prop reshape** that absorbs `config` into `configs.lenses[lens]`):

| Prop      | Type                                                          | Required | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snippet` | `string`                                                      | yes      | The code string, consumed as the **initial value** only. The orchestrator seeds an internal `useState(snippet)` on the first render and is the sole writer of snippet state thereafter; subsequent changes to the `snippet` prop are ignored. Callers who need to swap the snippet remotely should remount via React `key={…}`. The orchestrator builds the embodiment internally — caller does NOT pre-build.                                                                                                                                                                                    |
| `lens`    | `string`                                                      | no       | Default-mounted lens name. The learner can switch via the picker. Populated upstream by the plugin per the **default-lens precedence chain**: per-fence info-string `:suffix` > frontmatter `defaultLens` > cascade `defaults[fenceLang]` (the cascade default lens, when non-null) > none (editor mode). Sibling-emitted `<StudyLenses>` nodes use `@study-lens` directive > cascade `defaults[lang]`. The orchestrator is indifferent to the source — any string the plugin emits drives initial mount; subsequent prop changes drive mode transitions (per § Editor-vs-lens state machine).    |
| `configs` | maximally opaque object (`Readonly<Record<string, unknown>>`) | no       | Opaque cascade passthrough — the public type makes no statement about internals. Today the plugin emits the whole resolved cascade from the `lenses.json` directory walk; per-fence URL-style queries and sibling `@study-lens` directive JSON overrides are deep-merged INTO `configs.lenses[lens]` at plugin emission time. The orchestrator's INTERNAL `resolvePerLensConfig` reads `configs.lenses?.[lens]` as a structural assumption at the cast boundary — that assumption is NOT a constraint on the public type, so future cascade-shape evolution doesn't require widening the surface. |

The `lens` and `configs` props flow from per-fence info-string (`js:annotate`),
per-directory `lenses.json` cascade, and the optional per-fence `@study-lens`
directive — the Docusaurus plugin at `src/plugins/study-lenses/` parses all
three input surfaces and emits the resolved values onto the JSX node. There is
no separate `config` prop; the per-fence/sibling override is folded into
`configs.lenses[lens]` before emission, so the cascade IS the merged truth.

> **Dispatch path**: when `lens` matches a registered key, the orchestrator
> initializes (or transitions to) **lens mode** with the live `embodiment`
> (flushed from the internal snippet state — see § Live embodiment) plus the
> per-lens resolved config (per § Per-lens config resolution chain). When `lens`
> is unset OR not in the registry, the orchestrator initializes (or transitions
> to) **editor mode**. The mode discriminator and its transitions are described
> in § Editor-vs-lens state machine; the flush-or-reuse decision for the
> embodiment is described in § Live embodiment. The cascade-supplied
> default-lens seam is sourced from `configs.defaults[fenceLang]` (per the
> plugin's default-lens precedence chain (a glossary entry in
> [`src/plugins/study-lenses/README.md` § Glossary](../../../plugins/study-lenses/README.md#glossary));
> the orchestrator itself reads only the resolved `lens` prop and is indifferent
> to which precedence tier supplied it.
>
> **Silent-drop case.** When `lens` is supplied but not in the registry (e.g. an
> authoring typo or a lens that has not yet been registered), the orchestrator
> falls back to editor mode and any `configs.lenses[lens]` entry supplied
> alongside is silently unused. Authors who hit this should consult React
> DevTools or the sandbox `debug-props` lens to confirm the prop shape.

### Per-lens config resolution chain

For any lens the learner mounts (default or picker-switched), the final config
is computed as:

```text
resolved(lensName) = module.config()                  // tier 0: lens defaults
                   ⊕ configs.lenses?.[lensName]       // tier 1: cascade (post-merge with per-fence/sibling override)
```

`⊕` is **deep-merge-right-wins**. Tier 0 is the lens's own default factory; tier
1 is the directory `lenses.json` cascade's `lenses[lensName]` entry, with any
per-fence URL-style query OR sibling `@study-lens` directive JSON override
already folded in at plugin emission time. There is no separate
per-fence-override tier on the orchestrator side — the plugin pre-merges and
ships the result inside `configs`. The orchestrator threads this two-tier chain;
lens authors don't compute it themselves.

> The `configs.lenses?.[lensName]` read is an **orchestrator-internal structural
> assumption**, not a constraint on the public `configs` type. The public type
> is maximally opaque; `resolvePerLensConfig` casts at the boundary to look up
> `lenses[lensName]`. If a caller hands the orchestrator a `configs` value that
> doesn't expose a `lenses` map, the read returns `undefined` and tier-1
> contributes nothing — the chain falls back to `module.config()` alone.

The full type declarations live in [`./types.ts`](./types.ts).

### Orchestrator-level settings (configs tier)

Beyond per-lens entries, the orchestrator reads `configs.orchestrator` — the
same internal-structural-assumption pattern as `configs.lenses` (a cast at the
boundary; no constraint on the maximally opaque public type) — for
orchestrator-level defaults: the initial **source type** (script | module),
**danger-mode availability** (educators can remove the danger position from the
sandbox toggle per page), and **run-limit defaults**. Unconfigured settings use
built-in defaults and reset on remount — the LMS owns persistence
(disposability).

### Anti-patterns (durable rules)

- **No consumer-side branching on `snippet.source.code`.** `embody(code)`
  recognizes 11 named scenario keywords (`"OK"`, `"FAIL_AT_PARSE"`, …) and
  dispatches a canned `Snippet` shape for each; these scenarios are a permanent
  integration-testing fixture set. Orchestrator code MUST NOT use
  `snippet.source.code` as a branching key — branch on the resulting `Snippet`'s
  `status.{tokenized,parsed,validated,created}`, `errors`, `validation`, and
  `endReport.outcome` shape instead. Rendering `source.code` verbatim (e.g. a
  source-display lens) is fine; using it as a discriminator is not. See
  [`../embody/README.md` § Named scenarios](../embody/README.md) and
  [`../embody/index.ts`](../embody/index.ts) JSDoc.
- **Single-writer state.** Only `orchestrate/editor/` mutates snippet source.
  Lenses are read-only views; they never mutate `embodiment` or call back into
  the editor.

## INTERNAL EventBus

Each `<StudyLenses>` mount owns an isolated `EventBus` instance (see
[`./types.ts`](./types.ts) § `EventBus`). The bus coordinates
**intra-component** events — picker selections notifying the orchestrator of
mode changes, sandbox test subscribers verifying transitions, future analytics
hooks — and is internal-only: no DOM registry, no global, no `subscribe` /
`onEvent` prop on the public `<StudyLenses>` surface. The four event names are
`lens-switched`, `mode-changed`, `type-toggled`, and `sandbox-toggled` — the
latter two are typed now and dispatch from the dock when it is built (the
typed-before-wired pattern `LensSelectionSource`'s `'panel'` followed until the
phases panel landed its dispatch site).

### Why internal-only

A LMS-facing `subscribe` prop on `<StudyLenses>` (or an `onEvent` callback)
would lock the internal event taxonomy as a public contract. The bus is internal
because the event taxonomy is not yet a public surface; externalizing it
requires a separate, narrower protocol designed against a concrete host's needs
— not the raw internal bus.

See [`./DOCS.md`](./DOCS.md) § Internal event taxonomy for the full event list,
dispatch sites, contract (per-instance / synchronous / caught throws /
depth-first re-entrancy / typed), and the dispatch-ordering rule (mode-changed
before lens-switched within the same React commit).

## Editor-vs-lens state machine

The UI is in exactly one of two modes at a time; mode is selected by an internal
**mode discriminator** stored in `useState<OrchestratorState>` and mutated only
via well-defined **mode transitions**. See [`./types.ts`](./types.ts) for the
discriminated-union state shape; see
[`./DOCS.md` § Mode-gated state machine](./DOCS.md) for the architectural
sketch.

> **Picker-vs-prop ownership.** Mode transitions are driven by three sources:
> (a) the `lens` prop changing (consumer-driven; the
> `useEffect([lens, configs])` path), (b) the picker selection (learner-driven),
> and (c) the edit-return affordance (learner-driven). All three route through
> the same internal transition handler — there is no second source of truth for
> `state.activeLens`. On conflict, the most-recent write wins: a subsequent
> `lens` prop change from the consumer overrides a prior picker selection.
> Consumers SHOULD memoize `configs` to avoid clobbering learner picker
> selections on unrelated parent re-renders: the same `lens` value paired with a
> NEW `configs` object identity counts as a consumer write and re-runs the
> transition.

### Glossary (ubiquitous language)

- **Phase (three senses — a deliberate homonym).** The word "phase" carries
  three distinct meanings in this peer; keep them apart:
  - **(a) Lifecycle phase** — a stage of the embody notional machine, the
    `NMEventPhase` value-space: `realm` / `parse:tokenize` / `parse:ast` /
    `creation` / `evaluation`. This is what `errors.phase` and the embody
    staircase report.
  - **(b) Station** — a column of the phases panel (see § The phases panel). The
    station set is **not** `NMEventPhase`: it folds `parse:tokenize` +
    `parse:ast` into a single **parse** station and adds the non-lifecycle
    **source** station (code-as-text, before the machine). Station set: `source`
    · `realm` · `parse` · `creation` · `evaluation`.
  - **(c) `LensModule.phase`** — a pedagogical-target binding on a lens (which
    lifecycle phase the lens teaches understanding OF). Its value-space **IS the
    station-name set** (sense b) — single or array
    (`Station | readonly Station[]`; absent = panel-excluded) — deliberately
    distinct from `NMEventPhase` (sense a). A lens declares the station(s) it
    slots into, not the embody phase it reads from.
  - **Naming note:** the Cycle-2 panel itself is the **phases panel** — named
    for sense (a), the lifecycle it instruments; its columns are stations (sense
    b). See § The phases panel.
- **"State" and "surface" (overloaded words — keep the senses apart).**
  - _State:_ the orchestrator `state.*` (the mode-discriminated React state); the
    dock's **run state** (its transport phase — `idle` / `running` / `settled`);
    and a tool's **display state** (collapse / expand). All three are distinct from
    **mode** (Danger mode position / editor-lens mode / `SandboxMode`).
  - _Surface:_ "surface" names any rendered region; the **active surface**
    specifically is the editor-or-lens host (§ Editor-vs-lens state machine). The
    dock's **run/debug surface** + **output surface** and the Quiz
    **question-render surface** are region tools — context disambiguates, but the
    active surface is the one load-bearing sense.
- **Source type** — `'script' | 'module'`, the snippet's program-type posture
  (`snippet.type`; selected by the dock's type toggle, default module). Module
  is the NM-study posture — the admission gate can run; script is the
  validator-free posture — no language level is active. Full definition:
  [`../embody/README.md` § Glossary](../embody/README.md).
- **CORE station / LL station** — the two station kinds: CORE (`source`,
  `parse`) are provided by embody's JS-generic core and always shown; LL
  (`realm`, `creation`, `evaluation`) are provided by the active language
  level's semantic models and shown only where those models apply. CORE/LL is a
  _classification_ of stations, not a station name — no `Station` union member
  is named core; any future type literal uses lowercase (`'core' | 'll'`). See §
  The phases panel.
- **Station availability** — the per-edit pure derivation
  `(type, validation) → shown stations`. The third panel derivation, beside the
  static roster derivation and the per-edit status derivation; LL stations hide
  iff `type === 'script'` or `validation?.isJeJ === false`.
- **Editor mode** — the home base ([`./editor/`](./editor/)) is mounted. The
  learner types into the snippet; the CodeMirror buffer is the source of truth
  for `snippet`. No active lens. The live embodiment of the buffer is kept fresh
  in the background (debounced) and feeds interpreted gutter diagnostics.
- **Lens mode** — a lens is active with the live `embodiment` + resolved
  per-lens config as React props. The snippet is read-only (the editor is
  unmounted; the embodiment was flushed to the exact current buffer at the
  transition).
- **Mode discriminator** — the `mode: 'editor' | 'lens'` field on
  `OrchestratorState` that names which subtree the orchestrator renders. Initial
  value is derived **synchronously** by
  `deriveInitialState({ snippet, lens, configs })` — a top-level helper that
  returns `{ state: OrchestratorState; liveEmbodiment: LiveEmbodiment | null }`
  in a single pure pass. Both `useState` lazy initializers (one for `state`, one
  for `liveEmbodiment`) project their respective field from the same call, so
  `embody(snippet)` runs once per **logical mount** in **both** modes (seeding
  the live slot for gutter errors on the first frame), and the lens-mode subtree
  paints on the first frame when the caller supplies a registered `lens`. (React
  StrictMode may double-invoke the lazy initializer in dev; `embody()` is
  idempotent on a given string, so the slot is identical either way — safe.)
- **Mode transition** — a state-update that flips the discriminator. Three
  transitions exist: **editor → lens** (a registered lens is selected via the
  `lens` prop or the picker — flushes or reuses the live embodiment; mounts the
  lens), **lens → editor** (the `lens` prop unsets, moves to an unregistered
  key, or the edit-return affordance fires — disposes the lens; the live
  embodiment is retained), and **lens → lens** (the picker selects a different
  registered lens or the `lens` prop changes to a different registered key while
  in lens mode — same embodiment is fed to the new lens; no mode change). The
  transition logic is centralized in a single internal handler shared by the
  prop-change effect, the picker handler, and the edit-return handler.
- **Live embodiment** — the orchestrator's single live `Snippet` of the editing
  buffer, held in the top-level `liveEmbodiment` slot and keyed by the
  `(snippet, type)` pair. Refreshed by a debounced static `embody()` in editor
  mode, flushed to the exact current buffer on an editor → lens transition, and
  re-embodied immediately on a type toggle. Static-only (no execution); the
  source of `status` / `errors` / `validation` for gutter errors (Cycle 1) and
  the phases panel (Cycle 2).
- **Debounce settle** — the trailing-edge moment, after ~200 ms of edit
  inactivity, when the orchestrator re-runs static `embody()` on the current
  buffer and refreshes the live slot. Per-keystroke `onSnippetChange` still
  fires 1:1; only the embody reaction is debounced.
- **Flush-on-transition** — on an editor → lens transition, the orchestrator
  guarantees the live slot reflects the exact current buffer: if a debounce was
  pending (`liveEmbodiment.snippet !== currentSnippet`), it embodies
  synchronously inline and cancels the pending timer before mounting the lens.
- **Interpreted diagnostic** — a located `LintDiagnostic` carrying a
  human-friendly explanation of a `snippet.errors` entry, produced by
  `interpretError(embodiment, …)` (`lib/error-interpreting/`). The orchestrator
  computes these from the live embodiment and passes them to the editor as a
  `readonly LintDiagnostic[]` (the `interpretedDiagnostics` prop) — never the
  embodiment itself. Cycle 1 passes `interpretError`'s `whatWentWrong` as plain
  text in `message`; the editor renders messages as text (no markdown rendering
  wired yet), and rich multi-section markdown hover is deferred. Each is
  source-tagged (syntax / JEJ-compliance / interpreted render distinctly) so it
  renders distinctly from `lintJej`'s structural markers and supersedes the raw
  terse message for the same error. Line targeting prefers `errors.loc`, else
  derives `(line, column)` from `source.offsets` + the error's char offset, else
  a file-level notice.
- **Phases panel** — the always-visible affordance container at the top of the
  active surface: the NM-lifecycle instrument (see § The phases panel and
  [`./phases-panel/README.md`](./phases-panel/README.md)). Owns the per-station
  lens dropdowns and (in lens mode only) the edit-return button. Mounted in both
  editor and lens mode; its contents are state-derived. It replaced the Cycle-1
  toolbar; the picker and edit-return semantics survived the replacement.
- **Omnipresent region** — the orchestrator-resident band of **cross-phase study
  tools** (spanning source → evaluation) that sits alongside the phase stations.
  Its run/debug surface is the dock; its other inhabitants are the Quiz button and
  the embedded guide (see § The omnipresent region). Distinct from **the dock**,
  which is one surface within the region, not the region itself.
- **Tool kind** — the three-way classification of cross-phase tools:
  **generative** (produce something _about the program_; get an omnipresent
  affordance — Run, Quiz), **reactive explainer** (explain one subject where it
  appears, not a button — `error-interpret`), and **meta** (document the
  instrument itself, program-independent — the embedded guide). Orthogonal to the
  per-phase-lens vs. cross-phase-tool axis.
- **The dock** — the run/debug **surface** of the omnipresent region (see § The
  dock): a collapsible affordance container + output surface holding the type
  toggle (+ adjacent hint), the sandbox toggle, run limits, Run (with the two
  output channels), and the danger-only debugger option. One surface of the
  region, not the region itself.
- **Output channel** — a labelled region of the dock's output surface that renders
  one of the NM's two I/O channels: the **User Interface channel**
  (`alert`/`confirm`/`prompt` dialogs) and the **Developer Console channel**
  (`console.*`). _Homonym guard:_ **"panel" is reserved for the phases panel** —
  the dock's output regions are **channels**, never panels. A dock channel IS the
  rendering of an NM I/O channel; same concept, not a new one.
- **Execution backend** (**worker** / **danger**) — the engine that evaluates the
  snippet behind the locked `EvaluateHandle` contract: **worker** (the sandboxed
  default — the real evaluating engine) and **danger** (an iframe script-tag
  backend; deferred). _Homonym guard:_ "backend" here is the evaluation engine
  behind `EvaluateHandle`, never a server. Distinct from **Danger mode**, the
  sandbox toggle **position** that selects the danger backend.
- **Danger mode** — the sandbox toggle's non-default **position** (it selects the
  danger backend): the snippet is evaluated as a script tag in an iframe (pure JS
  only). Native dialogs, real window, browser-debugger stepping; a hung run can
  freeze the host page — the name carries the consent. Loop-guard instrumentation
  stays active and visible in the debugger. ("Mode" here is the toggle position,
  NOT the orchestrator's editor/lens mode.)
- **Debugger option** — a danger-only dock affordance that wraps the evaluated
  snippet with a `debugger;` statement above and below, so a learner with devtools
  open steps straight into their program; inert without devtools. Guard
  instrumentation stays visible in the stepped source (deliberately).
- **Run limits** — the learner interface to the seconds and iterations execution
  limits, with per-backend semantics (worker: engine timer + terminate; danger:
  in-guard elapsed check). Surfaces `endReport.outcome: 'limit-exceeded'` when
  tripped. (The embody substrate calls the seconds value the run's time budget and
  the iterations mechanism the loop guard; "run limits" is the learner-facing name
  over those two embody mechanisms.)
- **Quiz button** — an omnipresent **generative** affordance (not a lens) that
  calls `socratize` (`lib/socratizing/`) on the live embodiment to produce
  Socratic questions about the program. The heavier block-model Quiz _engine_ is
  deferred backlog (see § Deferred backlog).
- **Collapse / expand** — the dock's two display states; collapsing hides the
  controls while output stays reachable (the exact visual treatment is a Phase-1
  presentational choice).
- **Embedded guide** — the orchestrator-resident learner guide to the environment
  itself (stations, reveal rules, toggles, limits, danger). The **meta** tool
  kind's one inhabitant: neither generative nor a reactive explainer.
- **Lens-picker** (or just **picker**) — the affordance that selects a lens: the
  phases panel's N per-station dropdowns (see § The phases panel). Each is a
  `<select>` over the lenses that target its station (its roster), with a
  non-selectable sentinel first option; editor is not a picker option;
  panel-excluded lenses (no `phase` declaration) appear in no dropdown.
  Selecting a non-sentinel option transitions the orchestrator to lens mode for
  that lens — the same "select a registered lens → enter lens mode" contract the
  Cycle-1 single picker carried.
- **Registry / registered lens** — the orchestrator's lens-dispatch lookup
  exposed as `LENS_REGISTRY`, keyed by `LensModule.name`. It registers **five**
  lenses today: `annotate`, `blanks`, `debug-props`, `parsons`, `writeme`. The
  picker enumerates registry entries; the active lens (in lens mode) is always a
  registry entry.
- **Active lens** — when `state.mode === 'lens'`, the lens name currently
  mounted. Stored as `state.activeLens`. The picker `value` derives from this;
  the edit-return affordance's visibility derives from `state.mode === 'lens'`.
- **Edit return** — the orchestrator-state transition from lens mode back to
  editor mode. The affordance (the panel's edit button) dispatches
  `mode-changed({ from: 'lens', to: 'editor' })` on the internal bus; it does
  NOT dispatch `lens-switched` (no lens is being selected — the active lens is
  being unmounted). The live embodiment is retained across the return. The
  affordance is conditionally rendered (lens mode only); the editor-mode tree
  exposes no edit-return affordance because no transition is needed.
- **Neutral picker state** — what every station dropdown renders in editor mode
  (and what a non-rostering station's dropdown renders in lens mode): a
  non-selectable sentinel first `<option>`
  (`<option value="" disabled hidden>— select a lens —</option>`) that reads as
  the dropdown's `value`, with the remaining `<option>`s enumerating the
  station's roster. Selecting any non-sentinel option transitions to lens mode
  for that lens; the sentinel itself cannot be re-selected by the learner.
- **Dispatch** — calling `bus.dispatch(eventName, payload)` to notify all
  listeners registered for that event. Synchronous; listeners execute in
  registration order.
- **Subscribe** — registering a listener for an event via
  `bus.subscribe(eventName, listener)`. Returns a teardown function that removes
  the listener when called.
- **Listener** — a function passed to `bus.subscribe` that receives the
  dispatched payload for its event. Listeners that throw are caught and warned
  (`console.warn`); subsequent listeners still fire.
- **Payload** — the typed value passed to `bus.dispatch` and received by
  listeners. Each `EventName` has exactly one payload shape via the
  `EventPayloadMap` type-level mapping.
- **Event name** — a member of the `EventName` union (`'lens-switched'` |
  `'mode-changed'` | `'type-toggled'` | `'sandbox-toggled'`). Each name has a
  fixed payload shape; new names land alongside their payloads in `types.ts`.
- **Re-entrant dispatch** — a listener dispatches another event (or the same
  event) inside its own handler. Depth-first: the nested dispatch runs to
  completion before the outer dispatch's next listener fires.

### Live embodiment

The orchestrator holds a single authoritative top-level state slot
`liveEmbodiment: { snippet: string; type: SnippetType; embodiment: Snippet } | null`
alongside the mode-discriminator state. The slot is keyed by the
`(snippet, type)` pair — the same buffer embodied under a different source type
is a different embodiment. It is the orchestrator's **live static embodiment of
the editing buffer**: there is one storage location for the embodiment;
`LensModeState` carries only `activeLens` and `resolvedConfig`, and both
lens-mode rendering and the (Cycle-2) phases panel read
`liveEmbodiment.embodiment` — and its `status` / `errors` / `validation` —
directly.

In **editor mode** the slot is kept fresh by a **debounced** static
`embody(buffer)` (~200 ms idle settle). The editor still fires `onSnippetChange`
exactly once per keystroke (the orchestrator's `setSnippet` is per-keystroke),
but the orchestrator **debounces its embody reaction** so the machine isn't
re-run on every character. Embodiment is **static-only** (realm → tokenize →
parse → validate → creation; no worker) — program **execution stays lazy**,
firing only on the future Run affordance. The seed snippet is embodied **once
per logical mount in both modes** so a snippet that _ships_ with a syntax error
shows its interpreted gutter marker on the first frame, before the learner
types. (React StrictMode may double-invoke the lazy initializer in dev; because
`embody()` is idempotent on a given string the resulting slot is identical, so
the double-invoke is safe.) (The same live slot also feeds the phases panel's
per-edit derivations, but that was not the Cycle-1 justification.)

The slot is **never cleared on edit**: an edit only schedules a debounced
refresh, and the slot holds the prior value until the trailing edge replaces it.

**Coherence invariant** — whenever `state.mode === 'lens'`, the slot is non-null
AND `liveEmbodiment.snippet === currentSnippet` AND
`liveEmbodiment.type === currentType`. A stale slot (snippet or type mismatch)
at lens-mount is a **loud** failure, not just a null one. The transition logic
enforces this; types cannot.

**Trigger semantics:**

| Event                                                      | liveEmbodiment effect                                                                   | Mode effect                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Initial mount (either mode)                                | populate atomically with fresh `embody(snippet, { type })`                              | per `deriveInitialState`                          |
| Snippet edit in editor mode                                | schedule a debounced refresh; slot holds the prior value until the trailing edge        | (no transition; stays in editor mode)             |
| Debounce settle in editor mode                             | `embody(currentSnippet, { type })` once; refresh slot                                   | (no transition)                                   |
| Editor → lens, `liveEmbodiment.snippet === currentSnippet` | reuse `embodiment` (flush no-op); cancel pending debounce                               | `{ mode: 'lens', activeLens, resolvedConfig }`    |
| Editor → lens, slot stale or null                          | flush: `embody(currentSnippet, { type })` synchronously inline; cancel pending debounce | `{ mode: 'lens', activeLens, resolvedConfig }`    |
| Lens → editor transition                                   | retain slot                                                                             | `{ mode: 'editor' }`                              |
| Type toggle (dock)                                         | re-embody immediately under the new type; cancel any pending debounce                   | lens mode first returns to editor (disposability) |

A lens → editor → lens round-trip with no intervening edit reuses the slot (the
flush is a no-op — zero `embody` at the transition); an edit refreshes the slot
on the debounce settle, and the next lens-open flushes to the exact current
buffer.

**Error policy:** `embody()` is sync. For any `string` input it returns a
fully-shaped `Snippet` — it does not throw on parse-phase failure. Non-scenario
input routes to real composition — acorn tokenizes and parses the code,
producing an apex `Snippet` (valid JS) or a non-apex leaf (`tokenize-fail` or
`parse-fail`) carrying `snippet.errors` with the failure detail (still a no-op
evaluation phase: `snippet.evaluation.events.run()` resolves to a `RunInstance`
with `endReport.outcome: 'not-runnable'`). Those `errors` are exactly what the
editor gutter's **interpreted diagnostics** read (see
[`./editor/README.md`](./editor/README.md)). The debounced editor-mode refresh
wraps `embody()` defensively so a stray throw never tears down the editor — the
prior slot value survives. The **flush-on-transition** path, by contrast,
embodies inline without a try/catch: it relies on embody's total-on-`string`
contract (acorn errors are caught internally and returned as error-leaves, never
thrown) — a flagged dependency should embody ever reintroduce throwing. The
live-embodiment trigger governs only **when** embody fires; it is independent of
how `embody()` reports errors.

**Known cost (Cycle 1):** the editor's `lintJej` runs `validate(code)` (acorn)
_and_ the orchestrator's debounced `embody()` runs acorn — two parses per settle
(plus CodeMirror's own tokenizer). Accepted for now. **Convergence target:**
once embody's real-composition `validation` is wired (reaching parity with
`lintJej`'s JEJ-compliance markers), the embodiment becomes the single parse
source and the editor renders only orchestrator-supplied diagnostics —
collapsing to one parse. Deferred until then.

Lens-internal UI state never carries across mode switches — the disposability
principle (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)).

## Interpreted diagnostics

The orchestrator derives `interpretedDiagnostics: readonly LintDiagnostic[]`
from the live embodiment's `errors` (NOT from the embodiment object itself) and
passes them to the editor as a new optional prop. The editor renders them
through its existing `linter()` / `lintGutter()` / `hoverTooltip()` machinery —
one more diagnostic source alongside `lintJej`. **The editor never receives the
embodiment**; only the located, interpreted strings cross the boundary, so the
single-writer / read-only-view invariant holds in spirit.

- **Source-tagged, not blanket-deduped.** Each diagnostic is tagged with its
  source — syntax, JEJ-compliance, or interpreted — so the three coexist and
  render distinctly (distinct severity + gutter affordance). The editor
  suppresses only the case where the _same_ error is shown both terse (raw
  `lintJej`) and interpreted: the interpreted message supersedes the raw one for
  that error.
- **What lights up in Cycle 1.** Interpreted explanations are demonstrable now
  for **tokenize/parse (syntax) errors** (the real acorn path) plus the 11
  scenario fixtures. JEJ-violation and creation-phase interpretation on
  arbitrary real code lights up only when embody's validating/creation slices
  land. Real non-JEJ code (e.g. `var x = 1`) still shows `lintJej`'s structural
  marker (live) but no embodiment-derived interpretation in Cycle 1 — this is by
  design, not a bug.
- **Coherence (staleness bound).** Interpreted diagnostics are at most **one
  debounce-window** stale while typing; the live slot always reflects the buffer
  at the last settle, and a new settle re-derives them. How the editing layer
  absorbs that transient overshoot between settles (e.g. CodeMirror
  line-clamping of marker positions) is an **editing-layer assumption owned by
  [`./editor/README.md`](./editor/README.md)** — this doc states only the
  staleness bound, not the rendering-layer mechanism, so the claim isn't
  asserted at two strengths in two docs.

See [`./editor/README.md`](./editor/README.md) for how the editor consumes the
prop and merges it into its diagnostic pipeline.

## Snippet-content-blind orchestrator

The orchestrator's transition handler and live-embodiment layer never inspect
`Snippet.source.code` content semantically. (Sibling `orchestrate/lib/*` modules
may operate on derived strings — error messages, identifier autocomplete,
AST-derived voices — but never on raw snippet content for dispatch.) The handler
may compare snippet strings as **slot keys** via **full-string identity only**
(`liveEmbodiment.snippet === snippet`, answering "is this the same snippet I
already embodied?") — that's slot-validity, not semantic dispatch. Substring /
prefix / regex / pattern tests against snippet content are forbidden **even when
used to gate slot behavior** (e.g. `if (snippet.startsWith("//"))` as a
re-embody-bypass optimization is also a violation).

Branches that need to know what the code does consume only the resulting
`Snippet`'s `status` / `errors` / `validation` fields. Cycle 1 begins consuming
these to compute the interpreted gutter diagnostics; Cycle 2 consumes the full
`Status` + `errors.phase` for the phases panel's station-status derivation, and
the station-availability derivation consumes `snippet.type` + `validation.isJeJ`
(see § The phases panel) — all the allowed path; the orchestrator still never
inspects `source.code` semantically. This invariant aligns with embody's
anti-pattern (no consumer-side branching on `snippet.source.code`) and persists
as the non-scenario real-composition path grows per
[`../EMBODY-ROADMAP.md`](../EMBODY-ROADMAP.md).

## The phases panel

> **Design status.** This section is the locked Cycle-2 design, and it is BUILT:
> the phases panel ships at [`./phases-panel/`](./phases-panel/), replacing the
> Cycle-1 `toolbar.tsx`. The picker and edit-return semantics described above
> carried over.

The panel is a **notional-machine lifecycle instrument**. Instead of one lens
picker, it lays the NM lifecycle out as **N "stations" left → right** — **source
· realm · parse · creation · evaluation** — each its own lens dropdown for the
lenses that target that phase. The N dropdowns are deliberate: the layout itself
teaches the lifecycle, so a learner reads the machine's stages before picking
any lens.

The panel **doubles as a lifecycle-status display.** Off the live embodiment's
**embody staircase** (the whole `Status` + `errors.phase`) it shows how far the
machine got and where it tripped — teaching the lifecycle even before a lens is
picked. (This dual role — teach the lifecycle AND show the machine's progress
through it — is the panel's reason for being.)

### Phase stations and column gating

Each station maps to a stage of the embody staircase. Shown stations follow the
availability split (CORE always; LL iff the level's models apply — see § Where
the panel lives); within the shown regime the panel **greys out phases after the
one that errored**:

| Station        | Kind | embody mapping (what it shows status from)                                    | Greying (within regime)                                                                    |
| -------------- | ---- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **source**     | CORE | `snippet.source` (code-as-text, before the machine; not a lifecycle phase)    | never greyed                                                                               |
| **realm**      | LL   | the level's documentary realm (light; constant — never changes with the code) | never greyed                                                                               |
| **parse**      | CORE | tokenize + AST, folded into one station                                       | the **first** phase that can error; nothing bars it. A self-error here greys later phases. |
| **creation**   | LL   | script-scope decls, hoisting, TDZ                                             | greyed when `status.created` is unreached or a prior phase errored                         |
| **evaluation** | LL   | the machine's runtime internals (trace-tier prediction)                       | greyed until creation succeeds; runtime errors surface only at Run                         |

The greying is computed **purely from the embody staircase** (column/phase-based
gating only — lens-level `applicableTo` gating is a backlog seam, not this
design). `source` never greys; `realm`, when shown, never greys. The exact
per-station value-space is the station-status model below (locked in Cycle 2
Phase 0; availability revision recorded in this follow-up).

### Station-status model (locked)

Each station renders exactly one of five statuses, derived **purely** from the
live embodiment's staircase by a single pure derivation —
`(status, errors) → a per-station status map`. The input is the **whole**
`Status` (`{tokenized, parsed, validated, created}`) plus
`errors: EmbodyError | null`: `validated` is always `false` under today's stubs,
but it is an input NOW so the validating slice can land later without a
derivation-signature change (the zero-panel-changes invariant below depends on
this).

| Status     | Meaning                                                                                      | When                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constant` | no machine status; the station never greys                                                   | `source` and `realm`, always                                                                                                                                                                       |
| `ok`       | the machine completed this stage                                                             | parse: `status.parsed`; creation: `status.created`                                                                                                                                                 |
| `errored`  | the machine tripped AT this stage                                                            | `errors.phase` maps into the station: `parse:tokenize` / `parse:ast` → **parse**; `creation` → **creation**; `evaluation` → **evaluation** (type-reachable only today; runtime errors land at Run) |
| `barred`   | unreachable — an earlier machine phase failed                                                | every shown station after the errored one (machine errors only — a `validation` failure hides the LL stations instead; see the availability rule)                                                  |
| `pending`  | not yet reported — nothing failed before it, but the machine has not instrumented this stage | creation on real code while embody's creation slice is stubbed (`status.created === false`, no prior error); evaluation statically (runtime status exists only at Run)                             |

Per-station **reachable subsets** (so the implementation carries no dead
branches): `source` / `realm` → `{constant}` only (`realm` is structurally
error-free — `EmbodyPhase` excludes it); `parse` → `{ok, errored}` (nothing
precedes it, so never `barred`/`pending`); `creation` →
`{ok, errored, barred, pending}` (`barred` only from machine errors upstream —
parse — never from validation, which hides instead); `evaluation` →
`{errored, barred, pending}` (never `ok` statically — runtime success is only
knowable at Run, Cycle 3).

- **The validation outcome has no station — and no barred mapping.** A module
  snippet that parses but fails the admission gate
  (`validation.isJeJ === false`, `errors.phase === 'validation'`) **hides** the
  LL stations via the availability derivation rather than rendering them barred:
  non-admission is out-of-model, not a machine failure, and rendering
  valid-but-not-admitted JS as a broken machine would lie. Consequently the
  status derivation's barred-after-error rule applies to machine phases only — a
  validation error never produces `barred`. There is still **no separate
  trip-attribution field**: consumers read `errors.phase` / `validation`
  directly (minting a panel-private field would duplicate them and add a fourth
  phase-vocabulary surface).
- **Honest under stubs.** `pending` is deliberately distinct from `barred`:
  creation on clean real code today is `pending` ("the machine hasn't reported
  this stage yet") — never `ok` (a lie while the creation slice is stubbed) and
  never `barred` (implies an upstream failure). The distinction's payoff is the
  forward-compatibility property (the validating/creation slices land and the
  same derivation starts returning `ok` / `errored` for real code with **zero
  panel changes**), not a visual difference today.
- **Visual treatment** of `barred` vs `pending` (greyed vs dimmed vs identical
  with distinct tooltips/aria) is **intentionally unspecified** — a Phase-1
  presentational choice. Phase 0 locks the state model, not the CSS.

### Lens → station binding (locked)

`LensModule.phase?: Station | readonly Station[]` declares the station(s) a lens
belongs to. Its semantics are the **pedagogical target** — which lifecycle phase
the lens teaches understanding OF — **not** which embody phase the lens reads
from. So `blanks`/`annotate` declare `phase: 'source'` even though they consume
the AST: they teach understanding of the source, the AST is just their
instrument.

The locked shape (Cycle 2 Phase 0):

- **Optional** — an **absent** `phase` means **panel-excluded** (`debug-props`
  declares nothing; no registry-level exclusion list needed).
- **Single or array** — a lens may target one station or several. The panel
  **normalizes at read** (a `stationsOf(lens): readonly Station[]` helper), so
  no consumer ever branches on the union shape.
- **`Station` is a named union** —
  `'source' | 'realm' | 'parse' | 'creation' | 'evaluation'` — declared in
  [`../lenses/types.ts`](../lenses/types.ts) next to `LensModule` (the lens
  declares it, so the lens peer owns the type).
- **Migration (Phase-1 work, locked now):** `parsons`, `blanks`, `annotate`,
  `writeme` declare `phase: 'source'`; `debug-props` declares nothing.
- **Orthogonal to the `applicableTo` tiers.** `phase` (station / pedagogical
  target) is independent of the three-tier `applicableTo` classification (see
  [`../lenses/README.md` § Three-tier classification](../lenses/README.md)):
  `blanks` targets the `source` **station** and is **Tier 2** (AST-dependent) —
  the two never need to agree. "Source" the station names what a lens teaches;
  "text-only" the tier names what a lens needs. Panel column gating reads the
  embody staircase, never `applicableTo`.

> **Homonym alert.** `LensModule.phase` (sense c in the glossary) is **not**
> `NMEventPhase` (sense a). Its value-space is the **station-name set** (sense b
> — `source` · `realm` · `parse` · `creation` · `evaluation`), deliberately
> distinct from the lifecycle `NMEventPhase` values. A lens declares the station
> it teaches, not the embody phase it reads from.

The lenses slot as (all five registered today):

| Lens          | Station | Notes                                                                             |
| ------------- | ------- | --------------------------------------------------------------------------------- |
| `parsons`     | source  | registered today                                                                  |
| `blanks`      | source  | registered today; consumes the AST; teaches the source                            |
| `annotate`    | source  | registered today; consumes the AST; teaches the source                            |
| `writeme`     | source  | registered today                                                                  |
| `debug-props` | (none)  | registered today, but **panel-excluded** — carries no `phase` binding (see below) |

The non-source stations (`realm`, `parse`, `creation`, `evaluation`) stay mostly
empty until prediction lenses are built (token / AST / creation / trace
prediction — backlog).

> **Naming (locked).** The panel is the **phases panel** — named for the
> lifecycle (glossary sense (a)) it lays out and instruments; its columns remain
> **stations** (sense (b)): "the phases panel's parse station". "Control panel"
> stays reserved —
> [`notional-machine.md`](../embody/language-levels/just-enough-javascript/notional-machine.md)
> gives it to the syntax-as-the-programmer's-interface metaphor; the phases
> panel is an instrument **over the machine's stages**, not the interface that
> drives the machine, so the two names share no metaphor. Module folder (Phase
> 1): `phases-panel/`.

### Where the panel lives

The panel lives at the module folder [`phases-panel/`](./phases-panel/) (it
replaced `toolbar.tsx`). The panel module is presentation; `index.tsx` owns
which surface mounts and runs the three derivations (each its own top-level
`derive-station-*.ts` file beside `index.tsx`, which invokes them).

> **Locked constraint (full-JS lens availability).** Source-station lenses
> (`writeme`, `annotate`, `parsons`, `blanks`) serve the **full JS language**,
> not just the JEJ subset — lens availability is never JEJ-gated. A learner
> studying arbitrary (parseable) JS keeps the source-station study tools.

**What `validation.isJeJ` drives — station availability.** The panel always
mounts; what varies is **which stations are shown**. Stations split into two
kinds:

- **CORE stations** — `source`, `parse`: provided by embody's JS-generic core;
  shown for any code, under both source types.
- **LL stations** — `realm`, `creation`, `evaluation`: provided by the active
  language level's semantic models (see
  [`../embody/language-levels/just-enough-javascript/`](../embody/language-levels/just-enough-javascript/));
  hidden exactly when the level's models do not apply. Hidden means **fully
  removed** — no stubs, no greyed placeholders. The hidden set is non-contiguous
  (`realm` sits between `source` and `parse`; out-of-model code reads
  `source · parse`).

A third pure derivation — **station availability**,
`(type, validation) → shown stations`, per-edit — joins the two locked
derivations (static roster, per-edit status). LL stations are hidden iff
`type === 'script'` OR `validation?.isJeJ === false` (admission explicitly
refused). When `validation` is null — the gate's output absent on a snippet that
failed before the gate, or while embody's validating slice reports nothing —
admission is undetermined and the LL stations stay shown: failures _inside_ the
machine render through the station-status model (parse `errored`, downstream
`barred` — the staircase teaching), and only _out-of-model_ code hides the
machine. The three derivations have distinct inputs and cadences and are never
coupled; within the shown regime the station-status model below applies
unchanged (intra-JEJ greying retained: creation-fail ⇒ evaluation visible but
barred).

**Learner signals.** In module mode the editor gutter's JEJ-compliance markers
name the exact non-JEJ features that cost the NM stations — the warning is the
explanation. In script mode there are no JEJ markers (structurally: no validator
runs); the dock's type toggle carries an adjacent hint when module-admissible
code sits in script mode. The embedded guide (§ The omnipresent region)
documents the reveal rules for learners.

The **quadrant principles** (Q-I curated/uncurated × guided/unguided, etc.) are
**not** the panel's structural axis — that role belongs to the NM lifecycle
phases. The quadrants survive as **implicit design principles** the JEJ and
non-JEJ states each embody (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)),
not as a panel layout.

## The omnipresent region

> **Design status.** Locked Cycle-3 design; **not yet built**. Documented here
> as the intended end-state so the panel design reads whole.

Alongside the phase stations, the orchestrator carries a region of **cross-phase
study tools** — tools that span the whole lifecycle (source → evaluation) rather
than targeting one station. The durable ontology cuts along **two axes**:

1. **per-phase lenses** (target one station) vs. **cross-phase tools** (span the
   lifecycle);
2. within cross-phase tools, a three-way **kind**: **generative** tools (produce
   things _about the program_) get an omnipresent affordance; **reactive
   explainers** (explain one specific thing) attach where the subject appears
   rather than living as a button; **meta** tools (document the instrument
   itself, not the program) are omnipresent and program-independent.

Those axes place the known tools:

- **Run** — a cross-phase generative affordance (not a lens), mapping to
  `evaluation.events.{run, intercept}` on the embodiment.
- **Quiz** — an omnipresent generative **button** that calls `socratize` now
  (generator #1; a future dropdown dispatches to more generators).
- **`format`** is an **editor-only subtoolbar**, not omnipresent — formatting
  mutates source, so it belongs to the home base.
- **`error-interpret` is not a button** — it is the **reactive explainer**
  behind the interpreted diagnostics (editor gutter for static errors today,
  dock console for runtime errors later), a shared utility consumed by surfaces,
  not an affordance the learner clicks.
- **The embedded guide** — the **meta** kind's one inhabitant today: it
  documents the instrument itself (what the stations are, why they appear and
  disappear, what the toggles and limits do, what danger mode risks). It
  produces nothing about the program and explains no single subject — it
  explains the environment. Orchestrator-resident.

### The dock (run/debug surface)

The region's run/debug surface is **the dock** — a collapsible affordance
container + output surface. Its contract:

- **Type toggle** — selects the snippet's source type (`script` | `module`;
  default module, seedable via configs). Toggling re-embodies the buffer under
  the other type — the live-embodiment slot is keyed by `(snippet, type)` (see §
  Live embodiment); toggling while a lens is mounted returns to editor mode
  first (the toggle changes what the machine IS; the lens was mounted against
  the old machine — disposability applies). An adjacent hint appears when
  module-admissible code sits in script mode (the only state in which the NM
  stations are absent with nothing in the gutter to say why).
- **Sandbox toggle** — selects the execution backend: **worker** (the sandboxed
  default) ↔ **danger** (an iframe evaluating the snippet as a script tag — pure
  JS only; HTML hosting templates are backlogged, not this surface). Danger mode
  exists for what workers cannot give: native dialogs, the real window
  environment, and the browser debugger. A hung danger run can freeze the host
  page — the name carries the consent; educators can disable danger availability
  via configs.
- **Run limits** — the learner interface to the seconds and iterations limits.
  Per-backend semantics: the worker backend enforces seconds by engine timer +
  external termination (exact) and iterations by the loop-guard rewrite; the
  danger backend's limits both ride the loop-guard rewrite — the iterations
  counter, plus an elapsed-time check specified on the same per-iteration
  injection point (a requirement on the guard rewrite, not a capability it has
  today) — loop-bound coverage, deliberately weaker than the worker's external
  clock. Limit trips surface as `endReport.outcome: 'limit-exceeded'`.
- **Run** — the affordance that drives program execution (the lazy half of the
  embody contract), opening the dock's output surface: two **output channels**
  mirroring the NM's two I/O channels — a **User Interface** channel
  (alert/confirm/prompt dialogs) and a **Developer Console** channel
  (`console.*`). ("Panel" stays reserved for the phases panel — the dock's
  output regions are channels, never panels.)
- **Debugger option** (danger mode only) — wraps the evaluated snippet with a
  `debugger;` statement above and below, so a learner with devtools open steps
  straight into their program; inert without devtools. Loop-guard
  instrumentation remains active and **visible** in the stepped source —
  deliberately: navigating a guard in the debugger teaches what a guard is.

**Execution backends behind one contract.** The dock programs against the
embody-level evaluate surface (`EvaluateHandle` / `RunInstance` — see
[`../embody/types.ts`](../embody/types.ts)); runnability is tiered (the plain
run tier serves anything parsed; NM tiers require `created` — see
[`../embody/README.md` § Events](../embody/README.md)). The worker backend is
the evaluating engine; the danger-iframe is a second backend behind the same
contract, deliberately deferred (the registry-shape precedent: named, not yet
specified).

### Region structure and where it mounts

The region is **three presentation-only tool modules**, each mirroring
[`./phases-panel/`](./phases-panel/) (its own `README.md` + `DOCS.md` +
`index.tsx` + `tests/`):

- [`./dock/`](./dock/) — the run/debug surface (above).
- [`./quiz-button/`](./quiz-button/) — the Quiz generative button + its
  question-render surface (calls `socratize`).
- [`./embedded-guide/`](./embedded-guide/) — the meta guide.

Each is **presentation only**: `index.tsx` owns the state, the run lifecycle, and
the handlers, and threads them down as props — the tool modules import no
`embody`, dispatch no bus events, and hold no orchestrator state (the same split
the phases panel follows). The Run lifecycle (invoking
`evaluation.events.{run, intercept}` on the live embodiment) lives in `index.tsx`,
not in the dock component; the dock receives run state + output as props and emits
intent callbacks.

The **region itself is a labelled landmark** grouping the tools; it is realised as
flat siblings inside `data-orchestrator-root` alongside the phases panel and the
active surface (panel on top, active surface in the middle, the dock below it — the
console-below-editor reading order). The region is **not** a wrapper around the
panel.

The exact CSS / visual arrangement — ordering within the dock, collapsed-vs-expanded
treatment, channel layout, the question-render surface's shape — is a Phase-1
presentational choice. This section locks the **affordance set, the module
boundaries, and the selector surface** (§ Data attributes), not the pixels (the
same "lock the model, not the CSS" line the phases panel follows).

## Deferred backlog

Named here so they are not mistaken for current surfaces:

- **The recommender** (`lib/recommender/`) — snippet-fit lens ranking. The
  ranking library exists; there is no recommendations-panel UI, and none is
  planned for these three cycles. "Works within the NM phases later."
- **The Quiz engine** — the heavy block-model quiz generator (sibling of the
  recommender). The Cycle-3 Quiz button calls `socratize` directly; the engine
  is a separate later DDD.
- **The block model** — the 3D Block-model × NM analysis feeding both the
  recommender and the future Quiz engine. Backlog.

## Data attributes the DOM exposes

The set below is the orchestrator's stable selector surface for tests and
sandbox harnesses.

| Attribute                                | Where                                                                                                                                    | Used by                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `data-orchestrator-root`                 | The wrapper `<div>` (affordance container + active surface)                                                                              | Tests + sandbox locate the orchestrator instance.       |
| `data-orchestrator-host`                 | The host `<div>` where the active surface mounts — for the editor home base, a `<div>` into which the CodeMirror `EditorView` is mounted | Tests + sandbox locate where the active surface mounts. |
| `data-orchestrator-phases-panel`         | The panel root `<nav>` (the affordance container)                                                                                        | Tests + sandbox locate the panel.                       |
| `data-orchestrator-station`              | Each station column (`="<Station>"`); the per-station lens dropdown lives inside it                                                      | Tests + sandbox locate a station column.                |
| `data-orchestrator-station-status`       | The column's per-edit status (`="<StationStatus>"`)                                                                                      | Tests + sandbox read a station's status.                |
| `data-orchestrator-station-status-label` | The visible status label inside a column (tests anchor on the attributes above, never label text)                                        | Tests + sandbox locate the status label.                |
| `data-orchestrator-edit-button`          | The panel `<button>` that returns to editor mode (rendered only when `state.mode === 'lens'`; carried over from the retired toolbar)     | Tests + sandbox locate the edit-return affordance.      |
| `data-orchestrator-error`                | The editor host `<div>` when CodeMirror mount rejects (fallback render)                                                                  | Tests + sandbox detect a failed editor mount.           |

**Omnipresent-region selectors.** The region's stable selector contract is locked
here; the attributes materialise on the DOM when the region is built. Value-bearing
attributes carry the current value (tests anchor on attribute + value, never label
text), mirroring `data-orchestrator-station-status="<StationStatus>"`. **Value
convention:** an attribute whose value mirrors a named type (`SnippetType`,
`SandboxMode`, `DockRunState`, `ChannelKind`, `EndReport['outcome']`) carries the
exact type-member string; any other value-bearing attribute carries a kebab-cased
domain term. The visual treatment of each (collapsed styling, channel layout) is a
Phase-1 presentational choice; the names and value-spaces below are the locked
contract.

- `data-orchestrator-omnipresent-region` — the region landmark `<section>` grouping
  the dock, Quiz button, and guide.
- `data-orchestrator-dock` — the dock root.
- `data-orchestrator-dock-collapsed` — on the dock root; `="true"` or `="false"`.
- `data-orchestrator-dock-type-toggle` — the type toggle control; `="script"` or
  `="module"`.
- `data-orchestrator-dock-type-hint` — the admissible-in-script hint (present only
  when shown).
- `data-orchestrator-dock-sandbox-toggle` — the sandbox toggle control; `="worker"`
  or `="danger"`.
- `data-orchestrator-dock-limit` — each run-limit input; `="seconds"` or
  `="iterations"`.
- `data-orchestrator-dock-debugger` — the debugger option (present only in danger
  mode).
- `data-orchestrator-dock-run` — the Run button.
- `data-orchestrator-dock-run-state` — the dock's transport phase (a `DockRunState`)
  on the Run control; `="idle"`, `="running"`, or `="settled"`. Orthogonal to
  `-dock-outcome`: while `running` no outcome exists yet; once `settled`, read
  `-dock-outcome` for HOW the run ended. ("settled" replaces a lossy "done" — a run
  that errored, timed out, was cancelled, or came back not-runnable is all settled
  but carries four different outcomes.)
- `data-orchestrator-dock-channel` — each output channel container;
  `="user-interface"` or `="developer-console"`.
- `data-orchestrator-dock-outcome` — the terminal classification, present only when
  `-dock-run-state="settled"`; `="<EndReport outcome>"` (the embody `EndReport`
  union, in its declared order: completed, errored, timed-out, cancelled, failed,
  limit-exceeded, not-runnable).
- `data-orchestrator-quiz` — the Quiz button.
- `data-orchestrator-guide` — the embedded-guide root.

**Fate of `-toolbar` / `-lens-picker` under the Cycle-2 replacement — RESOLVED
(Cycle 2 Phase 0): renamed; executed in Phase 1.** The names
`data-orchestrator-toolbar` and `data-orchestrator-lens-picker` described a DOM
that no longer exists once the phases panel replaced `toolbar.tsx`, and keeping
them as aliases would have introduced exactly the homonym this doc warns against
(`-toolbar` naming a non-toolbar). They retired WITH `toolbar.tsx` in the
increment that replaced it; the test suite re-anchored on the panel attributes
in that same increment. No alias survives.

**Directory → type/attribute asymmetry.** The directory is named `orchestrate/`
(verb) to mirror `embody/`'s convention of verb-named peers exporting their
primary surface at the peer's top level. The internal type names
(`OrchestratorState`) and DOM attributes (`data-orchestrator-*`) use the noun
form because that's how prose talks about it ("the orchestrator", "the
orchestrator state"). `embody/` doesn't expose a corresponding noun-form because
its primary surface is itself a verb (`embody()`); `orchestrate/`'s primary
surface is a noun-form component (`<StudyLenses>`), so the noun form creeps in
for internals. The asymmetry is honest, not a mistake.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the top-level
`AGENTS.md`. Peer-specific rules:

- **Single-writer state**. Only [`./editor/`](./editor/) mutates snippet source.
  The orchestrator routes the edit-callback through; lenses are read-only views.
- **Internal-only EventBus** (see § INTERNAL EventBus above for the full
  contract). The orchestrator's bus coordinates intra-component events; each
  `<StudyLenses>` mount owns a per-instance bus. No outbound `subscribe` prop on
  `<StudyLenses>` until a concrete LMS integration target appears.
- **Live embodiment** (debounced, static-only). The orchestrator keeps a live
  `Snippet` of the editing buffer, refreshed by a **debounced** static
  `embody()` in editor mode (never on every keystroke) and flushed to the exact
  current buffer on an editor → lens transition (see § Live embodiment). The
  static phases (realm → tokenize → parse → validate → creation) are eager;
  program **execution stays lazy**. **For lenses, evaluation phases** (run /
  predict / step) are lens-internal — the lens invokes
  `snippet.evaluation.events.{run, intercept, trace.variables, trace.syntax, trace.semantics}`
  directly on the embodiment it already holds (see
  [`../embody/types.ts § EvaluationEvents`](../embody/types.ts)); no
  orchestrator round-trip. The one non-lens consumer is the **Cycle-3 Run
  affordance** (§ The omnipresent region), which is also handed the **same live
  embodiment** and invokes `evaluation.events.{run, intercept}` on it directly —
  so it too needs no re-embody, and the no-round-trip property holds for both
  consumers. See [`./DOCS.md` § Live embodiment](./DOCS.md).
- **Snippet-content-blind orchestrator** (durable invariant). See §
  Snippet-content-blind orchestrator above for the full rule: the transition
  handler + live-embodiment layer never inspect `Snippet.source.code`
  semantically; they may compare snippet strings as slot keys via full-string
  identity only.
- **Disposable practice**. Lens-internal state is per-mount; nothing carries
  across the edit return or a lens switch.
- **Dependency rules** (per [`../DOCS.md` § Dependency rules](../DOCS.md)):
  - `orchestrate/` may import from `orchestrate/lib/*`, `embody/`, `lenses/`,
    `@-utils`.
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`,
    `@-utils`. Never from `lenses/`.
  - Lenses receive `embodiment` via props from the orchestrator; they never
    import from `orchestrate/` (top) or `embody/` (top).
- **React conventions** (component code):
  - React hooks live inside normal function components. No class components, no
    `this`. Multi-statement `useEffect` callbacks use named function
    expressions.
  - React component tests use `.test.tsx` and the `jsdom` environment
    (configured at the file level via `@vitest-environment jsdom`).
  - `vi.mock` factories that reference outer-scope variables wrap them in
    `vi.hoisted(() => ({ ... }))`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — package overview + Pedagogical
  first principles.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Subdirs**:
  - [`./editor/README.md`](./editor/README.md) — the home base (+ interpreted
    diagnostics rendering).
  - [`./lib/README.md`](./lib/README.md) — analysis libs index.
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts).
- **Lens contract**: [`../lenses/types.ts`](../lenses/types.ts).
- **Notional machine**:
  [`../embody/language-levels/just-enough-javascript/notional-machine.md`](../embody/language-levels/just-enough-javascript/notional-machine.md)
  — the lifecycle the phases panel instruments.
